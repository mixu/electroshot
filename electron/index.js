var fs = require('fs'),
    path = require('path');

var app = require('app'),
    subarg = require('subarg');

var argv = subarg(process.argv.slice(2));
if (argv.v || argv.version) {
  console.log('electron v' + process.versions.electron);
  console.log('chrome v' + process.versions.chrome);
  return app.quit();
}

var runTasks = require('./run-tasks.js');
// Report crashes to our server.
require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is GCed.
var mainWindow = null;

app.commandLine.appendSwitch('force-device-scale-factor', '1');

app.on('window-all-closed', function() {
  console.log('window-all-closed');
  app.quit();
});

app.on('ready', function() {
  var buffer = '';
  process.stdin.on('data', function(data) {
    buffer += data.toString();
  });
  process.stdin.once('end', function() {
    runTasks(JSON.parse(buffer));
  });
});
