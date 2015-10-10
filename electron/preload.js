var ipc = require('ipc');

function onceContentRendered(onDone) {
  // requestAnimationFrame's callback happens right before a paint. So, it takes two calls
  // before we can be confident that one paint has happened.
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      onDone();
    });
  });
}
ipc.on('ensure-rendered', function ensureRendered(eventName) {
  console.log('RECEIVE', 'ensure-rendered');

  var style = document.createElement('style');
  // WebKit hack :(
  style.appendChild(document.createTextNode(''));
  document.head.appendChild(style);
  style.sheet.insertRule('::-webkit-scrollbar { display: none; }');

  onceContentRendered(function() {
    console.log('SEND', eventName);
    ipc.send(eventName);
  });
});


console.log('SEND', 'window-loaded');
ipc.send('window-loaded');
