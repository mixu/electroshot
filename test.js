var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.
var fs = require('fs');
// Report crashes to our server.
require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is GCed.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    app.quit();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 820,
    height: 600,
    show: false,
    "enable-larger-than-screen": true,
    "skip-taskbar": true,
    "use-content-size": true

  });

  // and load the index.html of the app.
  mainWindow.loadUrl('http://localhost:8000/witex/index.html');

  setTimeout(function() {
    mainWindow.capturePage({
      x: 0,
      y: 0,
      width: 800,
      height: 600,
    }, function(data, err) {
      if (data.isEmpty()) {
        console.error("Got empty screenshot.");
      }
      if (err) {
        throw err;
      }

      fs.writeFile('/tmp/test.png', data.toPng());
    });
  },  1000);

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
});
