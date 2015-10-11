var fs = require('fs'),
    path = require('path');

var app = require('app'),
    ipc = require('ipc'),
    BrowserWindow = require('browser-window');

var subarg = require('subarg'),
    parallel = require('miniq');

// Report crashes to our server.
require('crash-reporter').start();

var express = require('express'),
    subarg = require('subarg');

var pathsToLocalhost = require('../lib/paths-to-localhost.js'),
    argsToTasks = require('./args-to-tasks.js');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is GCed.
var mainWindow = null;

app.commandLine.appendSwitch('force-device-scale-factor', '1');

var server;

app.on('window-all-closed', function() {
  console.log('window-all-closed');
  if (server) {
    server.close();
  }
  app.quit();
});

app.on('ready', function() {

  var baseUrl = 'http://localhost:3000';
  var tasks = argsToTasks(process.argv.slice(2));
  var pairs = pathsToLocalhost(tasks, 'http://localhost:3000');

  if (pairs.length > 0) {
    var app = express();
    pairs.forEach(function(pair) {
      console.log(pair[0], pair[1]);
      app.use(pair[0], express.static(pair[1]));
    });
    var host = 'localhost';
    var port = 3000;
    server = app.listen(3000, function () {
      console.log('Example app listening at http://' + host + ':' + port);
      runElectron();
    });
  } else {
    runElectron();
  }

  function runElectron() {
    var args = subarg(process.argv.slice(2));
  var output = args.output;
  console.log(tasks);


  parallel(1, tasks.map(function(task, i) {
    return function(done) {
      if (i === 0) {
        mainWindow = new BrowserWindow({
          show: true,
          "enable-larger-than-screen": true,
          "skip-taskbar": true,
          'use-content-size': true,
          resizable: false,
          // frame: false,
          'web-preferences': {
            'overlay-scrollbars': false
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
      mainWindow.setSize(task.size.width, task.size.height || 768);

      var tries = 0;
      function tryCapture() {
        if (task.size.height > 0) {
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

        var outPath = task.out ? task.out : output + '/' + task.filename;
        console.log('write screenshot ', outPath);
        fs.writeFile(outPath, data.toPng());
        done();
      }

      ipc.once('window-loaded', function() {
        console.log('IPC', 'window-loaded');
        console.log('SEND', 'ensure-rendered');
        mainWindow.webContents.send('ensure-rendered', 'loaded');
      });

      ipc.once('loaded', function() {
        console.log('IPC', 'loaded');
        tryCapture();
      });

      mainWindow.loadUrl(task.url);
      // to work around https://github.com/atom/electron/issues/1580
      mainWindow.webContents.executeJavaScript(fs.readFileSync(path.resolve(__dirname + '/preload.js'), 'utf8'));
    };
  }), function() {
    console.log('ALL DONE');
    mainWindow.close();
  });

  }
});
