var os = require('os'),
    uri = require('url'),
    path = require('path');

var subarg = require('subarg'),
    xtend = require('xtend'),
    Cookie = require('tough-cookie').Cookie,
    es6template = require('es6-template'),
    sanitizeFilename = require('sanitize-filename');

var defaultOptions = require('./default-options.js'),
    pathsToFilenames = require('./paths-to-filenames.js'),
    networkConditions = require('chromium-emulated-networks').reduce(function(all, d) {
      all[d.title] = d;
      return all;
    }, {}),
    emulatedDevices = require('chromium-emulated-devices').extensions.reduce(function(all, d) {
      var dev = d.device;
      var vertical = {
        screenPosition: dev.capabilities.indexOf('mobile') !== -1 ? 'mobile' : 'desktop',
        screenSize: { width: dev.screen.vertical.width, height: dev.screen.vertical.height },
        viewPosition: { x: 0, y: 0 },
        offset: { x: 0, y: 0 },
// Setting this will prevent the resize-window-to-contents trick from working (!)
//        viewSize: { width: dev.screen.vertical.width, height: dev.screen.vertical.height },
        deviceScaleFactor: dev.screen['device-pixel-ratio'],
        fitToView: false,
        scale: 1,
        'user-agent': dev['user-agent'],
      };
      [
        dev.title,
        dev.title.replace(/^(Apple|Blackberry|Google|LG|Nokia|Samsung) /ig, '')
      ].forEach(function(name) {
        all[name] = vertical;
        all['cropped ' + name] = xtend({ cropped: true }, vertical);
        var horizontal = xtend({}, vertical, {
          screenSize: { width: dev.screen.horizontal.width, height: dev.screen.horizontal.height },
//          viewSize: { width: dev.screen.horizontal.width, height: dev.screen.horizontal.height },
        });
        all['horizontal ' + name] = horizontal;
        all['cropped horizontal ' + name] = all['horizontal cropped ' + name] =
          xtend({ cropped: true }, horizontal);
      });
      return all;
    }, {});

var resRe = /^(\d+)x(\d+)?$/i;
var resXDeviceRe = /^["']?([A-za-z0-9\s ]+)["']?x(\d+)$/i;
var protocolRe = /^(http|https|file):\/\//i;

function hasFilePrefix(arg) {
 return arg.substr(0, 'file://'.length) === 'file://';
}

function isSize(arg) {
  return resRe.test(arg) || typeof arg === 'number' || emulatedDevices[arg] || resXDeviceRe.test(arg);
}

function crossProduct(current, indices, choices, eachFn) {
  for (indices[current] = 0; indices[current] < choices[current].length; indices[current]++) {
    if (current + 1 === choices.length) {
      eachFn.apply(null, indices.map(function(index, i) {
        return choices[i][index];
      }));
    } else {
      crossProduct(current + 1, indices, choices, eachFn);
    }
  }
}

function parseUrlsAndSizes(args) {
  var list = args._;

  var nonSizes = list.filter(function(arg) {
    return !isSize(arg);
  });
  var sizes = list.filter(isSize).map(function(size) {
    if (typeof size === 'number') {
      return { width: size, height: 0 };
    }
    if (resRe.test(size)) {
      var parts = size.match(resRe);
      var height = parseInt(parts[2], 10);
      return { width: parseInt(parts[1], 10), height: isNaN(height) ? 0 : height };
    }
    var deviceName = size;
    var heightOverride;
    if (resXDeviceRe.test(size)) {
      var parts = size.match(resXDeviceRe);
      deviceName = parts[1];
      heightOverride = parseInt(parts[2], 10);
    }
    var device = emulatedDevices[deviceName];
    var height = (device.cropped ? device.screenSize.height : 0);
    if (heightOverride) {
      height = heightOverride;
    }
    return {
      width: device.screenSize.width,
      height: height,
      device: device,
      deviceName: deviceName,
    };
  });
  // --device <json>
  if (args.device) {
    sizes = sizes.concat(Array.isArray(args.device) ? args.device : [args.device]).map(function(str) {
      var device = JSON.parse(str);
      var result ={
        width: device.screenSize.width,
        height: device.screenSize.height,
        device: device,
        deviceName: device.name || 'custom',
      };
      delete device.name;
      return result;
    });
  }

  var paths = [],
      urls = [],
      pathHadFilePrefix = []
  nonSizes.forEach(function(arg) {
    // TODO windows
    // TODO check for existence
    var startsWithFile = hasFilePrefix(arg);
    if (arg.charAt(0) === '.' || arg.charAt(0) === '/' || startsWithFile) {
      var name = startsWithFile ? arg.substr('file://'.length) : arg;
      name = path.normalize(path.resolve(process.cwd(), name));
      paths.push(name);
      pathHadFilePrefix.push(startsWithFile);
    } else {
      urls.push(arg);
    }
  });

  // to filenames
  var filenames = pathsToFilenames(paths.slice(0));
  // restore prefix
  paths = paths.map(function(p, i) {
    return (pathHadFilePrefix[i] ? 'file://' + p : p);
  });
  var filenameLookup = paths.reduce(function(all, p, i) {
    all[p] = filenames[i];
    return all;
  }, {});

  urls = urls.map(function(url) {
    var parts = uri.parse(url);
    // add missing protocol
    if (!protocolRe.test(url)) {
      parts = uri.parse('http://' + url);
    }
    return uri.format(parts);
  });

  var choices = [paths, sizes];
  if (typeof args.delay !== 'undefined') {
    choices.push(Array.isArray(args.delay) ? args.delay : [args.delay]);
  }

  var tasks = [];
  crossProduct(0, [], choices, function(url, size, delay) {
    if (typeof delay !== 'undefined') {
      args.delay = delay;
    }
    tasks.push(toTask(url, size, args, filenameLookup[url]));
  });

  choices = [urls, sizes];
  if (typeof args.delay !== 'undefined') {
    choices.push(Array.isArray(args.delay) ? args.delay : [args.delay]);
  }

  crossProduct(0, [], choices, function(url, size, delay) {
    if (typeof delay !== 'undefined') {
      args.delay = delay;
    }
    tasks.push(toTask(url, size, args));
  });

  return tasks;
}

var marginToElectron = {
  'default': 0,
  'none': 1,
  'minimum': 2,
};

var validPageSizes = { 'a4': 'A4', 'a3': 'A3', 'legal': 'Legal', 'tabloid': 'Tabloid' };

function toTask(url, size, args, filename) {
  var parts = uri.parse(url);
  var result = {
    url: url,
    delay: args.delay,
    selector: args.selector,
    'zoom-factor': args['zoom-factor'],
    format: args.format,
    quality: args.quality,
    'user-agent': args['user-agent'],
    latency: args.latency,
    download: args.download,
    upload: args.upload,
    css: args.css,
    js: args.js,
    debug: args.debug,
    root: args.root,
  };
  var sizeStr = size.width + 'x' + size.height;
  if (args.format === 'pdf') {
    var pageSize = (args['pdf-page-size'] ? validPageSizes[args['pdf-page-size'].toLowerCase()] : 'A4');
    result.pdf = {
      pageSize: pageSize || 'A4',
      marginsType: (args['pdf-margin'] ? marginToElectron[args['pdf-margin']] : 0),
      printBackground: args['pdf-background'],
      landscape: args['pdf-orientation'] === 'landscape',
    };
  }
  if (args.cookie) {
    // from parsed cookie to Electron cookie
    result.cookies =
      (Array.isArray(args.cookie) ? args.cookie : [args.cookie])
      .map(function(str) {
        var c = Cookie.parse(str);
        // MUST delete domain if localhost...
        var result =  {
          url: 'http' + (c.secure ? 's' : '') + '://' + (c.domain || parts.hostname) +
                (c.path || parts.path),
          name: c.key,
          value: c.value,
          domain: c.domain || parts.hostname,
          path: c.path || parts.path,
          secure: c.secure,
          session: c.httpOnly,
        // expirationDate: (c.expires !== 'Infinity' ? c.expires.getTime() / 1000 : 0),
        };
        if (result.domain === 'localhost') {
          delete result.domain;
        }
        return result;
      });
  }

  if (args['emulate-network'] && networkConditions[args['emulate-network']]) {
    var condition = networkConditions[args['emulate-network']];
    result.latency = condition.value.latency;
    result.download = result.upload = condition.value.throughput;
  }

  if (size.device) {
    result.device = xtend({}, size.device);
    delete result.device.cropped;
    if (size.device['user-agent']) {
      result['user-agent'] = size.device['user-agent'];
      delete result.device['user-agent'];
    }
    sizeStr = size.deviceName.toLowerCase().replace(/[^0-9a-z]/g, '-');
  }
  result.size = { width: size.width, height: size.height };

  var now = new Date();
  result.out = {
    crop: (size.height > 0 || (size.device && size.device.cropped)) ? '-cropped' : '',
    date: now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate(),
    time: now.getHours() + '-' + now.getMinutes() + '-' + now.getSeconds(),
    delay: result.delay !== 0 ? result.delay : '',
    size: sizeStr,
    width: result.size.width,
    height: result.size.height,
    format: args.format,
    platform: os.platform(),
  };

  if (filename) {
    result.out.name = filename;
  } else {
    result.out.name = sanitizeFilename(
      [parts.hostname, parts.path, parts.hash].filter(Boolean).join(''),
      { replacement: '-' }).replace(/-{1,}$/, '');
  }
  // now replace tokens with values per format
  // we're actually using ES6 template syntax but escaping \$ in shells is a pain so do a quick replace
  if (args.filename) {
    var template = args.filename.replace(/{/g, '${');
    result.out = es6template(template, result.out);
  } else if (args.delay !== 0) {
    result.out = es6template('${name}-${size}-at-${delay}ms.${format}', result.out);
  } else {
    result.out = es6template('${name}-${size}.${format}', result.out);
  }
  // resolve path
  result.out = path.resolve(args.out, result.out);

  return result;
}

module.exports = function(argv) {
  var rootArgs = xtend(defaultOptions, subarg(argv));
  var baseArgs = rootArgs._.filter(function(arg) { return !arg._; });

  var args = rootArgs._.filter(function(arg) { return arg._; }).concat({ _: baseArgs });

  var results = args.reduce(function(all, arg) {
    var opts = xtend({}, rootArgs, arg);
    return all.concat(parseUrlsAndSizes(opts));
  }, []);

  // uniquefy
  var seen = {};
  results.forEach(function(task, i) {
    if (seen[task.out]) {
      seen[task.out].push(i);
    } else {
      seen[task.out] = [i];
    }
  });

  Object.keys(seen).forEach(function(fullpath) {
    if (seen[fullpath].length > 1) {
      var counter = 1;
      seen[fullpath].forEach(function(i) {
        results[i].out = path.dirname(results[i].out) + '/' +
                         path.basename(results[i].out, path.extname(results[i].out)) +
                         '-' + counter +
                         path.extname(results[i].out);
        counter++;
      });
    }
  });

  return results;
};
