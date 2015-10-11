args-to-tasks.js
var uri = require('url'),
    path = require('path');

var subarg = require('subarg');

var resRe = /^(\d+)x(\d+)?$/i;
var protocolRe = /^(http|https|file):\/\//i;

function hasFilePrefix(arg) {
 return arg.substr(0, 'file://'.length) === 'file://';
}

function parseUrlsAndSizes(args, rootArgs) {
  var list = args._;

  var nonSizes = list.filter(function(arg) {
    return !resRe.test(arg) && typeof arg !== 'number';
  });
  var sizes = list.filter(function(arg) {
    return resRe.test(arg) || typeof arg === 'number';
  }).map(function(size) {
    if (typeof size === 'number') {
      return { width: size, height: 0 };
    }
    var parts = size.match(resRe);
    var height = parseInt(parts[2], 10);
    return { width: parseInt(parts[1], 10), height: isNaN(height) ? 0 : height };
  });

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

  paths = paths.map(function(p) {
    return 'file://' + path.normalize(path.resolve(process.cwd(), p));
  }).reduce(function(all, url) {
    return all.concat(sizes.map(function(size) {
      var parts = uri.parse(url);
      return {
        size: size,
        url: url,
        filename: path.basename(parts.path, path.extname(parts.path)) + '-' +
          size.width + 'x'
          + size.height
          + '.png',
        out: rootArgs.out
      };
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
      var parts = uri.parse(url);
      return {
        size: size,
        url: url,
        filename: parts.hostname + '-' +
          size.width + 'x'
          + size.height
          + '.png',
        out: rootArgs.out

      }
    }));
  }, []);

  return urls.concat(paths);
}

module.exports = function(argv) {
  var rootArgs = subarg(argv);
  var baseArgs = rootArgs._.filter(function(arg) { return !arg._; });

  var args = rootArgs._.filter(function(arg) { return arg._; }).concat({ _: baseArgs });

  return args.reduce(function(all, arg) {
    return all.concat(parseUrlsAndSizes(arg, rootArgs));
  }, []);
};
