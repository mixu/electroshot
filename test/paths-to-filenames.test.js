var assert = require('assert');

var pathsToFilenames = require('../lib/paths-to-filenames.js');

describe('paths to filenames', function() {

  it('removes shared prefix', function() {
    assert.deepEqual(pathsToFilenames([
      '/foo/bar',
      '/foo/baz',
    ]), ['bar', 'baz']);
  });

  it('removes common file extension', function() {
    assert.deepEqual(pathsToFilenames([
      '/foo/bar.html',
      '/foo/baz.html',
    ]), ['bar', 'baz']);
  });

  it('index', function() {
    assert.deepEqual(pathsToFilenames([
      '/foo/bar/index.html',
      '/foo/baz/index.html',
    ]), ['bar-index', 'baz-index']);
  });

/* moveme
  it('makes duplicates unique', function() {
    assert.deepEqual(pathsToFilenames([
      '/foo/bar.html',
      '/foo/bar.html',
    ]), ['bar-1', 'bar-2']);
  });
*/

  it('works with a single file', function() {
    console.log(pathsToFilenames([
      '/foo/bar.html',
    ]), ['bar']);
  });

  it('works with a single dir', function() {
    console.log(pathsToFilenames([
      '/foo/bar/',
    ]), ['bar']);
    console.log(pathsToFilenames([
      '/foo/bar',
    ]), ['bar']);
  });

});
