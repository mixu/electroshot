var ipc = require('ipc');
var webFrame = require('web-frame');

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
ipc.on('ensure-rendered', function ensureRendered(delay, eventName) {
  console.log('RECEIVE', 'ensure-rendered');

  try {
    var style = document.createElement('style');
    // WebKit hack :(
    style.appendChild(document.createTextNode(''));
    document.head.appendChild(style);
    style.sheet.insertRule('::-webkit-scrollbar { display: none; }');
  } catch(e) {}

  waitFor(delay, function() {
    console.log('SEND', eventName);
    ipc.send(eventName);
  });
});

ipc.on('get-dimensions', function ensureRendered(selector) {
  console.log('get-dimensions', selector);
  try {
   var result = document.querySelector(selector).getBoundingClientRect();
  } catch(e) {
    console.error('Could not find target ' + selector, e);
 //  ipc.send('return-dimensions', false);
    return;
  }
  ipc.send('return-dimensions', {
    x: result.top,
    y: result.left,
    width: result.right - result.left,
    height: result.bottom - result.top,
  });
});

ipc.on('set-zoom-factor', function(factor) {
  console.log('set-zoom-factor', factor);
  webFrame.setZoomFactor(factor);
});

console.log('SEND', 'window-loaded');
ipc.send('window-loaded');
