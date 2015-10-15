var assert = require('assert');
var tasksToMountpoints = require('../lib/tasks-to-mountpoints.js');
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
      { url: tmpDir + '/some-folder' }
    ];
    assert.deepEqual(tasksToMountpoints(tasks, baseUrl), [
      ['/0', tmpDir + '/some-folder']
    ]);
    assert.deepEqual(tasks, [
      { url: 'http://localhost:3000/0' }
    ]);
  });

  it('given a file, it mounts the file by default; handles duplicates and nonexistent', function() {
    var tasks = [
      { url: tmpDir + '/some-folder/index.html' },
      { url: tmpDir + '/some-folder/foo.html' },
      { url: tmpDir + '/some-folder/nonexistent.html' },
      { url: tmpDir + '/other.html' },
      { url: tmpDir + '/other-folder/index.html' },
    ];
    assert.deepEqual(tasksToMountpoints(tasks, baseUrl), [
      ['/0', tmpDir + '/some-folder'],
      ['/1', tmpDir],
      ['/2', tmpDir + '/other-folder'],
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
      { url: tmpDir + '/some-folder', root: tmpDir },
      { url: tmpDir + '/some-folder/index.html', root: tmpDir },
      { url: tmpDir + '/some-folder/foo.html', root: tmpDir },
      { url: tmpDir + '/other.html', root: tmpDir },
      { url: tmpDir + '/other-folder/index.html', root: tmpDir },
    ];
    assert.deepEqual(tasksToMountpoints(tasks, baseUrl), [
      ['/0', tmpDir],
    ]);
    assert.deepEqual(tasks, [
      { url: 'http://localhost:3000/0/some-folder', root: tmpDir },
      { url: 'http://localhost:3000/0/some-folder/index.html', root: tmpDir },
      { url: 'http://localhost:3000/0/some-folder/foo.html', root: tmpDir },
      { url: 'http://localhost:3000/0/other.html', root: tmpDir },
      { url: 'http://localhost:3000/0/other-folder/index.html', root: tmpDir },
    ]);
  });

  it('given a --root, it still adds new mount points for things outside the root', function() {
    var tasks = [
      { url: tmpDir + '/some-folder', root: tmpDir + '/some-folder' },
      { url: tmpDir + '/some-folder/index.html', root: tmpDir + '/some-folder' },
      { url: tmpDir + '/some-folder/foo.html', root: tmpDir + '/some-folder' },
      { url: tmpDir + '/other.html', root: tmpDir + '/some-folder' },
      { url: tmpDir + '/other-folder/index.html', root: tmpDir + '/some-folder' },
    ];
    assert.deepEqual(tasksToMountpoints(tasks, baseUrl), [
      ['/0', tmpDir + '/some-folder'],
      ['/1', tmpDir],
      ['/2', tmpDir + '/other-folder'],
    ]);
    assert.deepEqual(tasks, [
      { url: 'http://localhost:3000/0', root: tmpDir + '/some-folder' },
      { url: 'http://localhost:3000/0/index.html', root: tmpDir + '/some-folder'},
      { url: 'http://localhost:3000/0/foo.html', root: tmpDir + '/some-folder' },
      { url: 'http://localhost:3000/1/other.html', root: tmpDir + '/some-folder' },
      { url: 'http://localhost:3000/2/index.html', root: tmpDir + '/some-folder' },
    ]);
  });

  it('skips file:// urls', function() {
    var tasks = [
      { url: 'file://' + tmpDir + '/some-folder/index.html' },
      { url: 'file://' + tmpDir + '/some-folder/foo.html' },
      { url: 'file://' + tmpDir + '/some-folder/nonexistent.html' },
      { url: 'file://' + tmpDir + '/other.html' },
      { url: 'file://' + tmpDir + '/other-folder/index.html' },
    ];
    assert.deepEqual(tasksToMountpoints(tasks.slice(0), baseUrl), [
    ]);
    assert.deepEqual(tasks, [
      { url: tasks[0].url },
      { url: tasks[1].url },
      { url: tasks[2].url },
      { url: tasks[3].url },
      { url: tasks[4].url },
    ]);
  });

  // support --host
  // support --port

});
