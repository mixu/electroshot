var fs = require('fs'),
    os = require('os'),
    path = require('path');

var ipc = require('ipc'),
    BrowserWindow = require('browser-window');

var parallel = require('miniq');

module.exports = function(tasks) {
  var mainWindow;
  parallel(1, tasks.map(function(task, i) {
    return function(done) {
      console.log(task);
      if (i === 0) {
        mainWindow = new BrowserWindow({
          show: true,
          // SEGFAULTS on linux (!) with Electron 0.33.7 (!!)
          'enable-larger-than-screen': (os.platform() !== 'linux'),
          'skip-taskbar': true,
          'use-content-size': true,
          // resizable: false,
          // frame: false,
          'web-preferences': {
            'overlay-scrollbars': false,
            'page-visibility': true,
          }
        });
        // Emitted when the window is closed.
        mainWindow.on('closed', function() {
          // Dereference the window object, usually you would store windows
          // in an array if your app supports multi windows, this is the time
          // when you should delete the corresponding element.
          mainWindow = null;
        });
      }
      mainWindow.setContentSize(task.size.width, task.size.height || 768);

      var tries = 0;
      function tryCapture(dims) {
        if (dims) {
          mainWindow.capturePage(dims, complete);
        } else if (task.size.height > 0) {
          mainWindow.capturePage({
            x: 0,
            y: 0,
            width: task.size.width,
            height: task.size.height,
          }, complete);
        } else {
          mainWindow.capturePage(complete);
        }
      }

      function complete(data, err) {
        if (data.isEmpty() || err) {
          console.log(data.isEmpty() ? 'Screenshot is empty, retrying' : 'Error: ' + err);
          tries++;
          if (tries > 5) {
            return done(err);
          }
          setTimeout(tryCapture, 10);
          return;
        }

        console.log('write screenshot', task.out);
        fs.writeFile(task.out, (task.format === 'png' ? data.toPng() : data.toJpeg(task.quality)));
        if (task['zoom-factor'] !== 1) {
          console.log('SEND', 'set-zoom-factor', task['zoom-factor']);
          mainWindow.webContents.send('set-zoom-factor', task['zoom-factor']);
        }
        done();
      }

      ipc.once('window-loaded', function() {
        console.log('IPC', 'window-loaded');
        console.log('SEND', 'ensure-rendered');
        if (task['zoom-factor'] !== 1) {
          console.log('SEND', 'set-zoom-factor', task['zoom-factor']);
          mainWindow.webContents.send('set-zoom-factor', task['zoom-factor']);
        }
        mainWindow.webContents.send('ensure-rendered', task.delay, 'loaded');
      });

      ipc.once('loaded', function() {
        console.log('IPC', 'loaded');

        if (task.selector) {
          ipc.once('return-dimensions', function(event, dims) {
            tryCapture(dims);
          });
          mainWindow.webContents.send('get-dimensions', task.selector);
          return;
        }

        tryCapture();
      });

      mainWindow.loadUrl(task.url);
      // to work around https://github.com/atom/electron/issues/1580
      mainWindow.webContents.executeJavaScript(fs.readFileSync(path.resolve(__dirname + '/preload.js'), 'utf8'));
    };
  }), function() {
    console.log('ALL DONE');
    if (mainWindow) {
      mainWindow.close();
    }
  });
};
