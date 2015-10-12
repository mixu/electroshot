#!/usr/bin/env node
var fs = require('fs'),
    path = require('path'),
    spawn = require('child_process').spawn;

var electron = require('electron-prebuilt'),
    express = require('express'),
    subarg = require('subarg'),
    xtend = require('xtend');

var defaultOptions = require('../lib/default-options.js'),
    argsToTasks = require('../lib/args-to-tasks.js'),
    tasksToMountpoints = require('../lib/tasks-to-mountpoints.js');

var argv = xtend({}, defaultOptions, subarg(process.argv.slice(2)));

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
var baseUrl = 'http://' + argv.host + ':' + argv.port;
var tasks = argsToTasks(process.argv.slice(2));
var pairs = tasksToMountpoints(tasks, baseUrl);

// set up express server here - node probably already has permission to accept incoming connections whereas electron probably doesn't
var server;
if (pairs.length > 0) {
  var app = express();
  pairs.forEach(function(pair) {
    app.use(pair[0], express.static(pair[1]));
  });
  server = app.listen(argv.port, function () {
    console.log('Express server listening at ' + baseUrl);
    runElectron();
  });
} else {
  runElectron();
}

// run electron and pipe the tasks into it
function runElectron() {
  var electronArgs = [
    __dirname + '/../electron/index.js'
  ].concat(Object.keys(argv).filter(function(key) {
    return typeof defaultOptions[key] === 'undefined' && key !== '_';
  }).reduce(function(all, key) {
    if (typeof argv[key] !== 'boolean') {
      return all.concat([ '--' + key,  argv[key] ]);
    } else {
      return all.concat('--' + (argv[key] ? 'no-' : '') + key);
    }
  }, []));

  console.log(electronArgs);
  var child = spawn(electron, electronArgs, {
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
