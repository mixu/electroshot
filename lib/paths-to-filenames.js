module.exports = function(paths) {

  // discard common prefixes; for paths, we don't really care about
  // the full path but rather the part where it is different
  // e.g. /foo/bar, /foo/baz -> bar, baz


  // discard common suffixes; e.g.
  // bar/index.html, baz/index.html -> bar, baz

  // sanitize and return

};
