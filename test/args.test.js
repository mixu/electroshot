var assert = require('assert');
var argsToTasks = require('../lib/args-to-tasks.js');
var fixture = require('file-fixture');

var oldArgsToTasks = argsToTasks;
argsToTasks = function(args) {
  var result = oldArgsToTasks(args);
  result.forEach(function(task) {
    if (task.delay === 0) {
      delete task.delay;
    }
    if (task['zoom-factor'] === 1) {
      delete task['zoom-factor'];
    }
    if (!task.selector) {
      delete task.selector;
    }
    if (task.quality === 75) {
      delete task.quality;
    }
    if (task.format === 'png') {
      delete task.format;
    }
  });
  return result;
};

describe('args to tasks', function() {

  // output path spec

  // cases:
  // - set a full output path for each file
  //   - single file
  //      input: <url> <resolution> <path>
  //   - many files
  //      input: <url> <url> <resolution> <path> <path>
  //      input: <url> <resolution> <path> <url> <resolution> <path>
  //      input: [  <url> <resolution> <path> ] [ <url> <resolution> <path> ] <--- this
  // - set a output path but use auto filenames for each file
  //   - single file
  //      input: --out <path> <url> <resolution>
  //   - many files
  //      input: --out <path> <url> <url> <resolution>


  it('accepts <url> <resolution>', function() {
    assert.deepEqual(argsToTasks(['http://google.com', '1024x768']), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 768 },
        out: process.cwd() + '/google.com-1024x768.png'
      }
    ]);
  });

  it('accepts --out <path> <url> <resolution>', function() {
    assert.deepEqual(argsToTasks(['--out', '/foo', 'http://google.com', '1024x768']), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 768 },
        out: '/foo/google.com-1024x768.png'
      }
    ]);
  });

  it('accepts <url> <resolution> <resolution>', function() {
    assert.deepEqual(argsToTasks(['http://google.com', '1024x768', '1366x768']), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 768 },
        out: process.cwd() + '/google.com-1024x768.png'
      },
      {
        url: 'http://google.com/',
        size: { width: 1366, height: 768 },
        out: process.cwd() + '/google.com-1366x768.png'
      },
    ]);
  });

  it('accepts <url> <url> <resolution>', function() {
    assert.deepEqual(argsToTasks(['http://google.com', 'http://gmail.com', '1024x768']), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 768 },
        out: process.cwd() + '/google.com-1024x768.png'
      },
      {
        url: 'http://gmail.com/',
        size: { width: 1024, height: 768 },
        out: process.cwd() + '/gmail.com-1024x768.png'
      },
    ]);
  });

  it('accepts --out <path> <url> <url> <resolution>', function() {
    assert.deepEqual(argsToTasks(['--out', '/foo', 'http://google.com', 'http://gmail.com', '1024x768']), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 768 },
        out: '/foo/google.com-1024x768.png'
      },
      {
        url: 'http://gmail.com/',
        size: { width: 1024, height: 768 },
        out: '/foo/gmail.com-1024x768.png'
      },
    ]);
  });

  it('accepts grouped arguments', function() {
    assert.deepEqual(argsToTasks([ '[', 'http://google.com', '1024x768', ']']), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 768 },
        out: process.cwd() + '/google.com-1024x768.png'
      }
    ]);
    assert.deepEqual(argsToTasks([
      '[', 'http://google.com', '1024x768', ']',
      '[', 'http://gmail.com', '1366x768', ']'
    ]), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 768 },
        out: process.cwd() + '/google.com-1024x768.png'
      },
      {
        url: 'http://gmail.com/',
        size: { width: 1366, height: 768 },
        out: process.cwd() + '/gmail.com-1366x768.png'
      }
    ]);
  });

  it('accepts mixed grouped arguments', function() {
    assert.deepEqual(argsToTasks([
      '[', 'http://google.com', '1024x768', ']',
      'http://gmail.com', '1366x768'
    ]), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 768 },
        out: process.cwd() + '/google.com-1024x768.png'
      },
      {
        url: 'http://gmail.com/',
        size: { width: 1366, height: 768 },
        out: process.cwd() + '/gmail.com-1366x768.png'
      }
    ]);

  });

  it('can override flags in groups', function() {
    assert.deepEqual(argsToTasks([ '--out', '/foo', '[', 'http://google.com', '1024x768', '--out', '/bar', ']']), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 768 },
        out: '/bar/google.com-1024x768.png'
      }
    ]);
  });

  it('missing http:// is added', function() {
    assert.deepEqual(argsToTasks(['google.com', '1024x768']), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 768 },
        out: process.cwd() + '/google.com-1024x768.png'
      }
    ]);
    assert.deepEqual(argsToTasks(['localhost', '1024x768']), [
      {
        url: 'http://localhost/',
        size: { width: 1024, height: 768 },
        out: process.cwd() + '/localhost-1024x768.png'
      }
    ]);
    assert.deepEqual(argsToTasks(['localhost:8000', '1024x768']), [
      {
        url: 'http://localhost:8000/',
        size: { width: 1024, height: 768 },
        out: process.cwd() + '/localhost-1024x768.png'
      }
    ]);
    assert.deepEqual(argsToTasks(['127.0.0.1:8000', '1024x768']), [
      {
        url: 'http://127.0.0.1:8000/',
        size: { width: 1024, height: 768 },
        out: process.cwd() + '/127.0.0.1-1024x768.png'
      }
    ]);
  });


  it('when no resolution is set, use responsive breakpoints', function() {
    assert.deepEqual(argsToTasks(['google.com']), [
      {
        url: 'http://google.com/',
        size: { width: 1200, height: 0 },
        out: process.cwd() + '/google.com-1200x0.png'
      },
      {
        url: 'http://google.com/',
        size: { width: 980, height: 0 },
        out: process.cwd() + '/google.com-980x0.png'
      },
      {
        url: 'http://google.com/',
        size: { width: 768, height: 0 },
        out: process.cwd() + '/google.com-768x0.png'
      },
      {
        url: 'http://google.com/',
        size: { width: 480, height: 0 },
        out: process.cwd() + '/google.com-480x0.png'
      }
    ]);
  });

  it('height can be undefined (full height)', function() {
    assert.deepEqual(argsToTasks(['google.com', '1024x']), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 0 },
        out: process.cwd() + '/google.com-1024x0.png'
      }
    ]);
    assert.deepEqual(argsToTasks(['google.com', '1024']), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 0 },
        out: process.cwd() + '/google.com-1024x0.png'
      }
    ]);
  });

  it('pathlike thing that exists is parsed as path', function() {
    var tmpDir = fixture.dir({
      'some-folder/index.html': '<html>Index.html</html>'
    });

    // dir
    assert.deepEqual(argsToTasks(['file://' + tmpDir + '/some-folder/', '1024x768']), [
      {
        url: 'file://' + tmpDir + '/some-folder',
        size: { width: 1024, height: 768 },
        out: process.cwd() + '/some-folder-1024x768.png'
      }
    ]);
    assert.deepEqual(argsToTasks([tmpDir + '/some-folder', '1024x768']), [
      {
        url: 'file://' + tmpDir + '/some-folder',
        size: { width: 1024, height: 768 },
        out: process.cwd() + '/some-folder-1024x768.png'
      }
    ]);
    // plain file
    assert.deepEqual(argsToTasks([tmpDir + '/some-folder/index.html', '1024x768']), [
      {
        url: 'file://' + tmpDir + '/some-folder/index.html',
        size: { width: 1024, height: 768 },
        out: process.cwd() + '/index-1024x768.png'
      }
    ]);
  });

  it('accepts --delay <n> <url> <resolution>', function() {
    assert.deepEqual(argsToTasks(['--delay', '2000', 'http://google.com', '1024x768']), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 768 },
        out: process.cwd() + '/google.com-1024x768.png',
        delay: 2000,
      }
    ]);
  });

  it('accepts --selector <expr> <url> <resolution>', function() {
    assert.deepEqual(argsToTasks(['--selector', '#foo', 'http://google.com', '1024x768']), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 768 },
        out: process.cwd() + '/google.com-1024x768.png',
        selector: '#foo',
      }
    ]);
  });

  it('accepts --zoom-factor <n> <url> <resolution>', function() {
    assert.deepEqual(argsToTasks(['--zoom-factor', '2', 'http://google.com', '1024x768']), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 768 },
        out: process.cwd() + '/google.com-1024x768.png',
        'zoom-factor': 2,
      }
    ]);
  });

  it('accepts --format jpg <url> <resolution>', function() {
    assert.deepEqual(argsToTasks(['--format', 'jpg', 'http://google.com', '1024x768']), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 768 },
        out: process.cwd() + '/google.com-1024x768.jpg',
        format: 'jpg',
      }
    ]);
  });

  // --format <png | jpg> (--quality)
  // Capture strings of HTML
  //   --stdin-html
  // smart filenames
  // good looking messages V Generated 3 screenshots from 2 urls


  // when given multiple pages on the same domain (??): use the full path + qs
  // -> https://github.com/sindresorhus/filenamify-url

  // options:
  // --delay name of callback
  // --filename <template>
  // --keywords (http://viewportsizes.com/)
  // maybe not:
  // --hide
  // other actions on elements ? custom script??
  // --debug (pop open electron window, verbose logging)
  // --parallel <n> (num windows)
  // Remap --crop ???

  // cool:
  // - tiling (montage) use case
  // - diffing

  // web options:
  // - cookies, headers, http auth, userAgent
  // - ignore ssl errors (?)
  // - pipe in content (?)


  // special format strings
});
