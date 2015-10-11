#!/usr/bin/env node
var fs = require('fs'),
    path = require('path'),
    spawn = require('child_process').spawn;

var electron = require('electron-prebuilt');
var express = require('express'),
    subarg = require('subarg');

var argsToTasks = require('../lib/args-to-tasks.js'),
    tasksToMountpoints = require('../lib/tasks-to-mountpoints.js');

var argv = subarg(process.argv.slice(2));
if (argv.v || argv.version) {
  console.log('shot v'+ require('../package.json').version);
  spawn(electron, [__dirname + '/../electron/index.js', '--version'], { stdio: 'inherit' });
  return;
}

if (argv.help || argv.h) {
  console.log(fs.readFileSync(__dirname + '/usage.txt').toString());
  process.exit();
}

// expand args
var tasks = argsToTasks(process.argv.slice(2));
var pairs = tasksToMountpoints(tasks, 'http://localhost:3000');

// set up express server here - node probably already has permission to accept incoming connections whereas electron probably doesn't
var server;
var baseUrl = 'http://localhost:3000';
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

// run electron and pipe the tasks into it
function runElectron() {
  var child = spawn(electron, [__dirname + '/../electron/index.js'].concat(process.argv.slice(2)), {
    stdio: ['pipe', process.stdout, process.stderr]
  });

  child.stdin.end(JSON.stringify(tasks));

  child.on('close', function (code) {
    console.log('Electron exited');
    if (server) {
      server.close();
    }
  });
}
