var uri = require('url'),
    path = require('path');

var subarg = require('subarg'),
    xtend = require('xtend'),
    Cookie = require('tough-cookie').Cookie;

var defaultOptions = require('./default-options.js'),
    pathsToFilenames = require('./paths-to-filenames.js'),
    emulatedDevices = require('chromium-emulated-devices').extensions.reduce(function(all, d) {
      var dev = d.device;
      var vertical = {
        screenPosition: dev.capabilities.indexOf('mobile') !== -1 ? 'mobile' : 'desktop',
        screenSize: { width: dev.screen.vertical.width, height: dev.screen.vertical.height },
        viewPosition: { x: 0, y: 0 },
        offset: { x: 0, y: 0 },
        viewSize: { width: dev.screen.vertical.width, height: dev.screen.vertical.height },
        deviceScaleFactor: dev.screen['device-pixel-ratio'],
        fitToView: false,
        scale: 1,
        'user-agent': dev['user-agent'],
      };
      all[dev.title] = vertical;
      all['cropped ' + dev.title] = xtend({ cropped: true }, vertical);
      var horizontal = xtend({}, vertical, {
        screenSize: { width: dev.screen.horizontal.width, height: dev.screen.horizontal.height },
        viewSize: { width: dev.screen.horizontal.width, height: dev.screen.horizontal.height },
      });
      all['horizontal ' + dev.title] = horizontal;
      all['cropped horizontal ' + dev.title] = all['horizontal cropped ' + dev.title] =
        xtend({ cropped: true }, horizontal);
      return all;
    }, {});

var resRe = /^(\d+)x(\d+)?$/i;
var protocolRe = /^(http|https|file):\/\//i;

function hasFilePrefix(arg) {
 return arg.substr(0, 'file://'.length) === 'file://';
}

function isSize(arg) {
  return resRe.test(arg) || typeof arg === 'number' || emulatedDevices[arg];
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
    if (!emulatedDevices[size]) {
      var parts = size.match(resRe);
      var height = parseInt(parts[2], 10);
      return { width: parseInt(parts[1], 10), height: isNaN(height) ? 0 : height };
    }
    return {
      width: emulatedDevices[size].screenSize.width,
      height: emulatedDevices[size].screenSize.height,
      device: emulatedDevices[size],
      deviceName: size,
    };
  });

  // default resolution
  if (sizes.length === 0) {
    // via Bootstrap
    sizes = [
      { width: 1200, height: 0 }, // Large display
      { width: 980, height: 0 }, // Default
      { width: 768, height: 0 }, // Tablet
      { width: 480, height: 0 } // Mobile
    ];
  }

  var paths = [],
      urls = [];
  nonSizes.forEach(function(arg) {
    // TODO windows
    // TODO check for existence
    var startsWithFile = hasFilePrefix(arg);
    if (arg.charAt(0) === '.' || arg.charAt(0) === '/' || startsWithFile) {
      paths.push(startsWithFile ? arg.substr('file://'.length) : arg);
    } else {
      urls.push(arg);
    }
  });

  // to filenames
  var filenames = pathsToFilenames(paths.slice(0));

  paths = paths.map(function(p) {
    return 'file://' + path.normalize(path.resolve(process.cwd(), p));
  }).reduce(function(all, url, i) {
    return all.concat(sizes.map(function(size) {
      return toTask(url, size, args, filenames[i]);
    }));
  }, []);

  urls = urls.map(function(url) {
    var parts = uri.parse(url);
    // add missing protocol
    if (!protocolRe.test(url)) {
      parts = uri.parse('http://' + url);
    }
    return uri.format(parts);
  }).reduce(function(all, url) {
    return all.concat(sizes.map(function(size) {
      return toTask(url, size, args);
    }));
  }, []);

  return urls.concat(paths);
}

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
  };
  var sizeStr = size.width + 'x' + size.height;
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

  if (size.device) {
    result.size = { width: size.width, height: (size.device.cropped ? size.height : 0) };
    result.device = xtend({}, size.device);
    delete result.device.cropped;
    if (size.device['user-agent']) {
      result['user-agent'] = size.device['user-agent'];
      delete result.device['user-agent'];
    }
    sizeStr = size.deviceName.toLowerCase().replace(/[^0-9a-z]/g, '-');
  } else {
    result.size = size;
  }
  if (filename) {
    result.out = args.out + '/' + filename + '-' + sizeStr + '.' + args.format;
  } else {
    result.out = args.out + '/' + parts.hostname + '-' + sizeStr + '.' + args.format;
  }
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
