#!/usr/bin/env node
var path = require('path'),
    spawn = require('child_process').spawn;

var electron = require('electron-prebuilt');

var child = spawn(electron, [__dirname + '/../electron/index.js'].concat(process.argv.slice(2)), { stdio: 'inherit' });

child.on('close', function (code) {
  console.log('Electron exited');
});
