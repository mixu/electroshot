var ipc = require('electron').ipcRenderer;
var webFrame = require('electron').webFrame;

function waitFor(num, onDone) {
  if (num) {
    setTimeout(onDone, num);
    return;
  }

  // requestAnimationFrame's callback happens right before a paint. So, it takes two calls
  // before we can be confident that one paint has happened.
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      onDone();
    });
  });
}
ipc.on('waitfor', function ensureRendered(event, delay, eventName) {
  console.log('RECEIVE', 'waitfor', delay, eventName);
  waitFor(delay, function() {
    console.log('SEND', eventName);
    ipc.send(eventName);
  });
});


ipc.on('ensure-rendered', function ensureRendered(event, delay, eventName) {
  console.log('RECEIVE', 'ensure-rendered', delay, eventName);
  try {
    var style = document.createElement('style');
    // WebKit hack :(
    style.appendChild(document.createTextNode(''));
    document.head.appendChild(style);
    style.sheet.insertRule('::-webkit-scrollbar { display: none; }', 0);
  } catch (e) {}

  waitFor(delay, function() {
    console.log('SEND', eventName);
    ipc.send(eventName);
  });
});

ipc.on('get-dimensions', function ensureRendered(event, selector) {
  console.log('get-dimensions', selector);
  var result;
  try {
   result = document.querySelector(selector).getBoundingClientRect();
  } catch (e) {
    console.error('Could not find target ' + selector, e);
    ipc.send('return-dimensions', false);
    return;
  }
  ipc.send('return-dimensions', {
    x: Math.floor(result.left),
    y: Math.floor(result.top),
    width: Math.ceil(result.right - result.left),
    height: Math.ceil(result.bottom - result.top),
  });
});

ipc.on('get-content-dimensions', function() {
  // We want to increase the height if needed, but not the width.
  var height = Math.max( document.body.scrollHeight, document.body.offsetHeight,
                         document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight );
  ipc.send('return-content-dimensions', {
    width: window.innerWidth,
    height: height,
  });
});

ipc.on('set-zoom-factor', function(event, factor) {
  console.log('set-zoom-factor', factor);
  webFrame.setZoomFactor(factor);
  ipc.send('return-zoom-factor');
});

console.log('SEND', 'window-loaded');
ipc.send('window-loaded');
