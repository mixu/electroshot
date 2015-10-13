var fs = require('fs'),
    os = require('os'),
    path = require('path');

var ipc = require('ipc'),
    BrowserWindow = require('browser-window');

function TargetWindow() {
  this.window = null;
}

// sync initialization
TargetWindow.prototype.initialize = function(opts, onDone) {
  var self = this;
  this.opts = opts;
  if (!this.window) {
    this.window = new BrowserWindow({
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
    this.window.on('closed', function() {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      self.window = null;
    });
  }

  // width, height
  this.window.setContentSize(opts.width, opts.height);

  ipc.once('window-loaded', function() {
    console.log('IPC', 'window-loaded');
    console.log('SEND', 'ensure-rendered');

    // webContents configuration
    // - zoom factor
    if (opts['zoom-factor'] !== 1) {
      console.log('SEND', 'set-zoom-factor', opts['zoom-factor']);
      self.window.webContents.send('set-zoom-factor', opts['zoom-factor']);
    }

    ipc.once('loaded', function() {
      console.log('IPC', 'loaded');
      onDone();
    });
    self.window.webContents.send('ensure-rendered', opts.delay, 'loaded');
  });

  this.window.setContentSize(375, 627);
  // useful: set the size exactly (contentsize is not useful here)
  this.window.setSize(375, 627);
  this.window.setMaximumSize(627, 627);

  this.window.loadUrl(opts.url, {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.3 (KHTML, like Gecko) Version/8.0 Mobile/12A4345d Safari/600.1.4'
  });
  // this happens before the page starts executing
  self.window.webContents.enableDeviceEmulation({
    screenPosition: 'mobile',
    screenSize:  { width: 375, height: 627 },
    viewPosition: { x: 0, y: 0 },
    offset: {x: 0, y: 0},
    viewSize: { width: 375, height: 627 },
    deviceScaleFactor: 2,
    fitToView: false,
    scale: 1,
  });

  // to work around https://github.com/atom/electron/issues/1580
  this.window.webContents.executeJavaScript(fs.readFileSync(path.resolve(__dirname + '/preload.js'), 'utf8'));

};

TargetWindow.prototype.reset = function() {
  // reset zoom
  if (this.opts['zoom-factor'] !== 1) {
    this.window.webContents.send('set-zoom-factor', 1);
  }
  // reset deviceEmulation
};

TargetWindow.prototype.getDimensions = function(selector, onDone) {
  ipc.once('return-dimensions', function(event, dims) {
    onDone(dims);
  });
  this.window.webContents.send('get-dimensions', selector);
};

TargetWindow.prototype.capture = function(dims, onDone) {
  var self = this;
  var tries = 0;
  var hasDims = arguments.length > 1;
  var opts = this.opts;

  function tryCapture(dims) {
    if (hasDims) {
      self.window.capturePage(dims, complete);
    } else {
      self.window.capturePage(complete);
    }
  }

  function complete(data, err) {
    if (data.isEmpty() || err) {
      console.log(data.isEmpty() ? 'Screenshot is empty, retrying' : 'Error: ' + err);
      tries++;
      if (tries > 5) {
        return done(err);
      }
      setTimeout(tryCapture, 100 * tries);
      return;
    }

    console.log('write screenshot', opts.out);
    fs.writeFile(opts.out, (opts.format === 'png' ? data.toPng() : data.toJpeg(opts.quality)));
    self.reset();
    onDone();
  }
  tryCapture(dims);
};

TargetWindow.prototype.close = function() {
  if (this.window) {
    this.window.close();
  }
};

module.exports = TargetWindow;
