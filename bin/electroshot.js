#!/usr/bin/env node
var fs = require('fs'),
    path = require('path'),
    process = require('process'),
    spawn = require('child_process').spawn,
    os = require('os');

var electron = require('electron'),
    express = require('express'),
    subarg = require('subarg'),
    xtend = require('xtend'),
    networkConditions = require('chromium-emulated-networks'),
    emulatedDevices = require('chromium-emulated-devices').extensions,
    logSymbols = require('log-symbols');

var defaultOptions = require('../lib/default-options.js'),
    argsToTasks = require('../lib/args-to-tasks.js'),
    tasksToMountpoints = require('../lib/tasks-to-mountpoints.js');

var argv = xtend({}, defaultOptions, subarg(process.argv.slice(2)));

if (argv.v || argv.version) {
  console.log('shot v' + require('../package.json').version);
  spawn(electron, [__dirname + '/../electron/index.js', '--version'], { stdio: 'inherit' });
  return;
}

if (argv['list-network-conditions'] || argv['list-networks'] || argv['list-network'] ) {
  console.log(networkConditions.map(function(net) {
    return [
      '--emulate-network  "' + net.title + '"',
      '    Throughput: ' + net.value.throughput + ' Bps',
      '    RTT latency: ' + net.value.latency + ' ms'
    ].join('\n');
  }).join('\n'));
  return;
}

if (argv['list-devices'] || argv['list-device']) {
  console.log(emulatedDevices.map(function(dev) {
    return [
      '--emulate-device "' + dev.device.title + '" || --emulate-device "horizontal ' + dev.device.title + '"',
      '    ' + dev.device.screen.vertical.width + 'x' + dev.device.screen.vertical.height,
      '    Pixel ratio: ' + dev.device.screen['device-pixel-ratio'],
      '    UA: ' + dev.device['user-agent']
    ].join('\n');
  }).join('\n'));
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

if (tasks.length === 0) {
  console.log('No screenshot tasks were specified.');
  console.log('Usage: electroshot <urls | paths> <resolutions | devices>');
  console.log('Run `electroshot --help` for a list of all the CLI options.');
  return;
}

// set up express server here - node probably already has permission to accept incoming connections whereas electron probably doesn't
var server;
if (pairs.length > 0) {
  var app = express();
  pairs.forEach(function(pair) {
    app.use(pair[0], express.static(pair[1]));
  });
  server = app.listen(argv.port, function() {
    console.log('Express server listening at ' + baseUrl);
    runElectron();
  });
} else {
  runElectron();
}

// run electron and pipe the tasks into it
function runElectron() {
  var configFile = os.tmpdir() + '/electroshot-config.json';

  var electronArgs = [
    path.join(__dirname, '..', 'electron', 'index.js')
  ].concat(Object.keys(argv).filter(function(key) {
    return typeof defaultOptions[key] === 'undefined' && key !== '_' || key === 'debug';
  }).reduce(function(all, key) {
    if (typeof argv[key] !== 'boolean') {
      return all.concat(['--' + key, argv[key]]);
    } else {
      return all.concat('--' + (!argv[key] ? 'no-' : '') + key);
    }
  }, [])).concat(['--config', configFile]);

  // Windows does not support piped stdio on GUI programs like electron
  // see https://github.com/electron/electron/issues/4218
  fs.writeFileSync(configFile, JSON.stringify(tasks));

  var child = spawn(electron, electronArgs, {stdio: argv.debug ? 'inherit' : 'ignore'});

  child.on('exit', function(code) {
    if (server) {
      server.close();
    }
    if (code !== 0) {
      console.log('Electron exited with code ' + code);
      process.exit(code);
    } else {
      console.log(logSymbols.success, 'Generated ' + tasks.length + ' screenshot' + (tasks.length > 1 ? 's' : '') + '.');
    }
  });
}
