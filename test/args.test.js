var assert = require('assert');
var xtend = require('xtend');
var argsToTasks = require('../lib/args-to-tasks.js');
var fixture = require('file-fixture');
var Cookie = require('tough-cookie').Cookie;

var oldArgsToTasks = argsToTasks;
argsToTasks = function(args) {
  var result = oldArgsToTasks(args);
  result.forEach(function(task) {
    if (typeof task.debug === 'boolean' && !task.debug) {
      delete task.debug;
    }
    if (task.delay === 0) {
      delete task.delay;
    }
    if (task['zoom-factor'] === 1) {
      delete task['zoom-factor'];
    }
    if (task['user-agent'] === '') {
      delete task['user-agent'];
    }
    if (task.cookie === '') {
      delete task.cookie;
    }
    if (task.root === '') {
      delete task.root;
    }
    if (!task.js) {
      delete task.js;
    }
    if (!task.css) {
      delete task.css;
    }
    if (!task.upload) {
      delete task.upload;
    }
    if (!task.download) {
      delete task.download;
    }
    if (!task.latency) {
      delete task.latency;
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
    assert.deepEqual(argsToTasks([
      '--out', '/foo', 'http://google.com', 'http://gmail.com', '1024x768'
    ]), [
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
    assert.deepEqual(argsToTasks(['[', 'http://google.com', '1024x768', ']']), [
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
    assert.deepEqual(argsToTasks([
      '--out', '/foo', '[', 'http://google.com', '1024x768', '--out', '/bar', ']'
    ]), [
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
        url: tmpDir + '/some-folder',
        size: { width: 1024, height: 768 },
        out: process.cwd() + '/some-folder-1024x768.png'
      }
    ]);
    // plain file
    assert.deepEqual(argsToTasks([tmpDir + '/some-folder/index.html', '1024x768']), [
      {
        url: tmpDir + '/some-folder/index.html',
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
        out: process.cwd() + '/google.com-1024x768-at-2000ms.png',
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

  it('accepts --user-agent <str> <url> <resolution>', function() {
    assert.deepEqual(argsToTasks(['--user-agent', 'Foo', 'http://google.com', '1024x768']), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 768 },
        out: process.cwd() + '/google.com-1024x768.png',
        'user-agent': 'Foo',
      }
    ]);
  });

  it('accepts --cookie <str> <url> <resolution>', function() {
    var result = argsToTasks([
      '--cookie', 'priority=true; expires=Wed, 29 Jan 2014 17:43:25 GMT; Path=/',
      'http://google.com', '1024x768'
    ]);
    var c = result[0].cookies[0];
    assert.equal(new Cookie({
        key: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path,
        secure: c.secure,
        httpOnly: c.session,
      }).toString(),
      'priority=true; Domain=google.com; Path=/');
    assert.deepEqual(result, [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 768 },
        out: process.cwd() + '/google.com-1024x768.png',
        cookies: [
          { url: 'http://google.com/',
            name: 'priority',
            value: 'true',
            domain: 'google.com',
            path: '/',
            secure: false,
            session: false,
          }
        ]
      }
    ]);
  });

  var appleDevice = {
    screenPosition: 'mobile',
    screenSize: { width: 375, height: 667 },
    viewPosition: { x: 0, y: 0 },
    offset: {x: 0, y: 0},
    deviceScaleFactor: 2,
    fitToView: false,
    scale: 1,
  };

  var appleExpected = {
        url: 'http://google.com/',
        size: { width: 375, height: 0 },
        out: process.cwd() + '/google.com-apple-iphone-6.png',
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.3 ' +
        '(KHTML, like Gecko) Version/8.0 Mobile/12A4345d Safari/600.1.4',
        device: appleDevice,
      };

  it('accepts <url> <device>', function() {
    assert.deepEqual(argsToTasks(['http://google.com', 'Apple iPhone 6']), [
      appleExpected
    ]);
    assert.deepEqual(argsToTasks(['http://google.com', 'iPhone 6']), [
      xtend({}, appleExpected, { out: process.cwd() + '/google.com-iphone-6.png' })
    ]);
  });

  it('accepts <url> <cropped device>', function() {
    assert.deepEqual(argsToTasks(['http://google.com', 'cropped Apple iPhone 6']), [
      xtend({}, appleExpected, {
        out: process.cwd() + '/google.com-cropped-apple-iphone-6.png',
        size: { width: 375, height: 667 },
      })
    ]);
    assert.deepEqual(argsToTasks(['http://google.com', 'cropped iPhone 6']), [
      xtend({}, appleExpected, {
        out: process.cwd() + '/google.com-cropped-iphone-6.png',
        size: { width: 375, height: 667 },
      })
    ]);
  });

  it('accepts <url> <horizontal device>', function() {
    assert.deepEqual(argsToTasks(['http://google.com', 'horizontal Apple iPhone 6']), [
      xtend({}, appleExpected, {
        out: process.cwd() + '/google.com-horizontal-apple-iphone-6.png',
        size: { width: 667, height: 0 },
        device: xtend({}, appleDevice, {
          screenSize: { width: 667, height: 375 },
        }),
      })
    ]);
    assert.deepEqual(argsToTasks(['http://google.com', 'horizontal iPhone 6']), [
      xtend({}, appleExpected, {
        out: process.cwd() + '/google.com-horizontal-iphone-6.png',
        size: { width: 667, height: 0 },
        device: xtend({}, appleDevice, {
          screenSize: { width: 667, height: 375 },
        }),
      })
    ]);
  });

  it('accepts <url> <cropped horizontal device>', function() {
    assert.deepEqual(argsToTasks(['http://google.com', 'cropped horizontal Apple iPhone 6']), [
      xtend({}, appleExpected, {
        out: process.cwd() + '/google.com-cropped-horizontal-apple-iphone-6.png',
        size: { width: 667, height: 375 },
        device: xtend({}, appleDevice, {
          screenSize: { width: 667, height: 375 },
        }),
      })
    ]);
    assert.deepEqual(argsToTasks(['http://google.com', 'cropped horizontal iPhone 6']), [
      xtend({}, appleExpected, {
        out: process.cwd() + '/google.com-cropped-horizontal-iphone-6.png',
        size: { width: 667, height: 375 },
        device: xtend({}, appleDevice, {
          screenSize: { width: 667, height: 375 },
        }),
      })
    ]);
  });

  it('accepts <url> <horizontal cropped device>', function() {
    assert.deepEqual(argsToTasks(['http://google.com', 'horizontal cropped Apple iPhone 6']), [
      xtend({}, appleExpected, {
        out: process.cwd() + '/google.com-horizontal-cropped-apple-iphone-6.png',
        size: { width: 667, height: 375 },
        device: xtend({}, appleDevice, {
          screenSize: { width: 667, height: 375 },
        }),
      })
    ]);
    assert.deepEqual(argsToTasks(['http://google.com', 'horizontal cropped iPhone 6']), [
      xtend({}, appleExpected, {
        out: process.cwd() + '/google.com-horizontal-cropped-iphone-6.png',
        size: { width: 667, height: 375 },
        device: xtend({}, appleDevice, {
          screenSize: { width: 667, height: 375 },
        }),
      })
    ]);
  });

  it('accepts <device>x<height>', function() {
    assert.deepEqual(argsToTasks(['http://google.com', '"iPhone 6"x1000']), [
      xtend({}, appleExpected, {
        out: process.cwd() + '/google.com-iphone-6.png',
        size: { width: 375, height: 1000 },
      })
    ]);
  });

  it('accepts --latency <ms> <url> <resolution>', function() {
    assert.deepEqual(argsToTasks(['--latency', '2', 'http://google.com', '1024x768']), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 768 },
        out: process.cwd() + '/google.com-1024x768.png',
        latency: 2,
      }
    ]);
  });

  it('accepts --download <bps> <url> <resolution>', function() {
    assert.deepEqual(argsToTasks(['--download', '2', 'http://google.com', '1024x768']), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 768 },
        out: process.cwd() + '/google.com-1024x768.png',
        download: 2,
      }
    ]);
  });

  it('accepts --upload <bps> <url> <resolution>', function() {
    assert.deepEqual(argsToTasks(['--upload', '2', 'http://google.com', '1024x768']), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 768 },
        out: process.cwd() + '/google.com-1024x768.png',
        upload: 2,
      }
    ]);
  });

  it('accepts --emulate-network <profile>', function() {
    assert.deepEqual(argsToTasks(['--emulate-network', 'Regular 3G', 'http://google.com', '1024x768']), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 768 },
        out: process.cwd() + '/google.com-1024x768.png',
        latency: 100,
        download: 96000,
        upload: 96000,
      }
    ]);
  });

  it('accepts multiple --delay(s) and makes duplicate filenames unique', function() {
    assert.deepEqual(argsToTasks(['--delay', '2000', '--delay', '4000', 'http://google.com', '1024x768']), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 768 },
        out: process.cwd() + '/google.com-1024x768-at-2000ms.png',
        delay: 2000,
      },
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 768 },
        out: process.cwd() + '/google.com-1024x768-at-4000ms.png',
        delay: 4000,
      }
    ]);
  });

  it('accepts a file:// url as a passthru', function() {
    assert.deepEqual(argsToTasks(['file:///tmp/foo', '1024x768']), [
      {
        url: 'file:///tmp/foo',
        size: { width: 1024, height: 768 },
        out: process.cwd() + '/foo-1024x768.png',
      }
    ]);
  });

  it('accepts a --filename option', function() {
    var now = new Date();
    var d = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate(),
        t = now.getHours() + '-' + now.getMinutes() + '-' + now.getSeconds();

    assert.deepEqual(argsToTasks([
      '--filename', '{crop}{date}-{time}{delay}{name}{size}{width}y{height}.{format}',
      'http://google.com', '1024x', '1366x768']), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 0 },
        out: process.cwd() + '/' + d + '-' + t + 'google.com1024x01024y0.png'
      },
      {
        url: 'http://google.com/',
        size: { width: 1366, height: 768 },
        out: process.cwd() + '/-cropped' + d + '-' + t + 'google.com1366x7681366y768.png'
      },
    ]);
    // abspath
    assert.deepEqual(argsToTasks([
      '--filename', '/bar/foo.png',
      'http://google.com', '1024x']), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 0 },
        out: '/bar/foo.png'
      }
    ]);
    // override in a group
    assert.deepEqual(argsToTasks([
      '[', '--filename', '/bar/{name}.png', 'http://google.com', '1024x', ']',
      '[', '--filename', '/some/{size}.png', 'http://google.com', '1024x768', ']',
    ]), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 0 },
        out: '/bar/google.com.png'
      },
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 768 },
        out: '/some/1024x768.png'
      }
    ]);
    assert.deepEqual(argsToTasks([
    // override has duplicated name handling
      '--filename', '/bar/foo.png',
      'http://google.com', '1024x', '1024x768',
    ]), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 0 },
        out: '/bar/foo-1.png'
      },
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 768 },
        out: '/bar/foo-2.png'
      }
    ]);
  });

  it('accepts multiple --device <json>', function() {
    assert.deepEqual(argsToTasks([
      'http://google.com', '--device', JSON.stringify(appleDevice),
      '--device', JSON.stringify(xtend({ name: 'foo' }, appleDevice)),
    ]), [
      {
        url: 'http://google.com/',
        size: { width: 375, height: 667 },
        out: process.cwd() + '/google.com-custom.png',
        device: appleDevice
      },
      {
        url: 'http://google.com/',
        size: { width: 375, height: 667 },
        out: process.cwd() + '/google.com-foo.png',
        device: appleDevice
      },
    ]);

  });

  it('accepts --format pdf', function() {
    assert.deepEqual(argsToTasks([
      '--format', 'pdf',
      'http://google.com', '1024x']), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 0 },
        out: process.cwd() + '/google.com-1024x0.pdf',
        format: 'pdf',
        pdf: {
          pageSize: 'A4',
          marginsType: 0,
          printBackground: false,
          landscape: false,
        },
      }
    ]);
  });

  it('accepts --pdf-margin --pdf-page-size --pdf-background --pdf-orientation', function() {
    assert.deepEqual(argsToTasks([
      '--format', 'pdf',
      '--pdf-margin', 'minimum',
      '--pdf-page-size', 'legal',
      '--pdf-background',
      '--pdf-orientation', 'landscape',
      'http://google.com', '1024x']), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 0 },
        out: process.cwd() + '/google.com-1024x0.pdf',
        format: 'pdf',
        pdf: {
          pageSize: 'Legal',
          marginsType: 2,
          printBackground: true,
          landscape: true,
        },
      }
    ]);
  });

  it('accepts --js <str>', function() {
    assert.deepEqual(argsToTasks([
      '--js', 'console.log("Hello");',
      'http://google.com', '1024x']), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 0 },
        out: process.cwd() + '/google.com-1024x0.png',
        js: 'console.log("Hello");',
      }
    ]);
  });

  it('accepts --css <str>', function() {
    assert.deepEqual(argsToTasks([
      '--css', '* { font-size: x-large;}',
      'http://google.com', '1024x']), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 0 },
        out: process.cwd() + '/google.com-1024x0.png',
        css: '* { font-size: x-large;}',
      }
    ]);
  });

  it('stringifies complex urls', function() {
    assert.deepEqual(argsToTasks(['https://github.com/mixu/gr?foo=bar#features', '1024x768']), [
      {
        url: 'https://github.com/mixu/gr?foo=bar#features',
        size: { width: 1024, height: 768 },
        out: process.cwd() + '/github.com-mixu-gr-foo=bar#features-1024x768.png',
      }
    ]);
  });

  // device and --emulate-network are case insensitive
  // device and --emulate-network are separator-insensitive

  it('accepts --max-wait <ms>');
  it('accepts --debug');
  // --debug (pop open electron window, verbose logging)

  // good looking messages V Generated 3 screenshots from 2 urls

// TODO
// --max-wait <ms>    Set a maximum wait timer, after which a single screenshot is timed out. Good for automation.


  // Later:
  // --delay name of callback
  // --html in? can use data: urls!
  // it('accepts --parallel <n> (num windows)');
});
