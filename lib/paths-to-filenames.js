var path = require('path');

module.exports = function(paths) {
  if (paths.length === 0) {
    return paths;
  }
  if (paths.length === 1) {
    return [path.basename(paths[0], path.extname(paths[0]))];
  }
  var i, j, ok;
  var min = Infinity;
  var all = paths.map(function(p) {
    var parts = p.split(path.sep);
    min = Math.min(min, parts.length - 1);
    return parts.filter(Boolean);
  });
  // discard common prefixes; for paths, we don't really care about
  // the full path but rather the part where it is different
  // e.g. /foo/bar, /foo/baz -> bar, baz
  var sameStart = 0;
  for (i = 0; i < min; i++) {
    var first = all[0][i];
    ok = true;
    for (j = 1; j < all.length; j++) {
      if (all[j][i] !== first) {
        ok = false;
        break;
      }
    }
    if (ok) {
      sameStart++;
    } else {
      break;
    }
  }

  // discard common extension
  // bar/index.html, baz/index.html -> bar, baz
  var sameExt = '';
  for (i = 0; i < min; i++) {
    var last = path.extname(all[0][all[0].length - 1]);
    ok = true;
    for (j = 1; j < all.length; j++) {
      if (path.extname(all[j][all[j].length - 1]) !== last) {
        ok = false;
        break;
      }
    }
    if (ok) {
      sameExt = last;
    } else {
      break;
    }
  }

  // sanitize and return
  all = all.map(function(parts, i) {
    var remain = parts.slice(sameStart);

    if (sameExt) {
      var noExt = path.basename(remain[remain.length - 1], sameExt);
      remain[remain.length - 1] = noExt;
    }
    if (remain.join(path.sep) === '') {
      remain = [path.basename(paths[i])];
    }

    return remain.join('-');
  });
  return all;
};
