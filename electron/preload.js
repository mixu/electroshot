var ipc = require('electron').ipcRenderer;
var webFrame = require('electron').webFrame;

function waitFor(wait, onDone) {
  var timer = setInterval(function(){
    if (!!document.getElementById('pdf-page-header') === true) {
      clearInterval(timer);
      console.log('WAIT Condition Passed! Calling Done Now.');
      onDone();
    }
  }, 10);
  // Fallback max wait time
  setTimeout(function(){
    console.log('WAIT Condition still not true, timeout is 10 mintues, calling Done now.');
    clearInterval(timer);
    onDone();
  }, (1000 * 60 * 100));
  return;
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
    x: result.top,
    y: result.left,
    width: result.right - result.left,
    height: result.bottom - result.top,
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
