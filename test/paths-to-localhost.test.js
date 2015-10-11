var assert = require('assert');
var pathsToLocalhost = require('../lib/paths-to-localhost.js');
var fixture = require('file-fixture');

var baseUrl = 'http://localhost:3000';
describe('paths to localhost', function() {

  var tmpDir = fixture.dir({
    'some-folder/index.html': '<html>Index.html</html>',
    'some-folder/foo.html': '<html>Foo.html</html>',
    'other.html': '<html>Other.html</html>',
    'other-folder/index.html': '<html>other-folder/Index.html</html>',
  });

  it('given a dir, it mounts the dir by default', function() {
    var tasks = [
      { url: 'file://' + tmpDir + '/some-folder' }
    ];
    assert.deepEqual(pathsToLocalhost(tasks, baseUrl), [
      ['/0', tmpDir + '/some-folder' ]
    ]);
    assert.deepEqual(tasks, [
      { url: 'http://localhost:3000/0' }
    ]);
  });

  it('given a file, it mounts the file by default; handles duplicates and nonexistent', function() {
    var tasks = [
      { url: 'file://' + tmpDir + '/some-folder/index.html' },
      { url: 'file://' + tmpDir + '/some-folder/foo.html' },
      { url: 'file://' + tmpDir + '/some-folder/nonexistent.html' },
      { url: 'file://' + tmpDir + '/other.html' },
      { url: 'file://' + tmpDir + '/other-folder/index.html' },
    ];
    assert.deepEqual(pathsToLocalhost(tasks, baseUrl), [
      ['/0', tmpDir + '/some-folder' ],
      ['/1', tmpDir ],
      ['/2', tmpDir + '/other-folder' ],
    ]);
    assert.deepEqual(tasks, [
      { url: 'http://localhost:3000/0/index.html' },
      { url: 'http://localhost:3000/0/foo.html' },
      { url: 'http://localhost:3000/1/other.html' },
      { url: 'http://localhost:3000/2/index.html' },
    ]);

  });

  it('given a --root, it mounts that root for files that are under that root', function() {
    var tasks = [
      { url: 'file://' + tmpDir + '/some-folder', root: tmpDir },
      { url: 'file://' + tmpDir + '/some-folder/index.html', root: tmpDir },
      { url: 'file://' + tmpDir + '/some-folder/foo.html', root: tmpDir },
      { url: 'file://' + tmpDir + '/other.html', root: tmpDir },
      { url: 'file://' + tmpDir + '/other-folder/index.html', root: tmpDir },
    ];
    assert.deepEqual(pathsToLocalhost(tasks, baseUrl), [
      ['/0', tmpDir ],
    ]);
    assert.deepEqual(tasks, [
      { url: 'http://localhost:3000/0/some-folder', root: tmpDir },
      { url: 'http://localhost:3000/0/some-folder/index.html', root: tmpDir },
      { url: 'http://localhost:3000/0/some-folder/foo.html', root: tmpDir },
      { url: 'http://localhost:3000/0/other.html', root: tmpDir },
      { url: 'http://localhost:3000/0/other-folder/index.html', root: tmpDir },
    ]);
  });
  // support --host
  // support --port

});
