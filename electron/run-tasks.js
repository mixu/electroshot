var TargetWindow = require('./target-window');
var parallel = require('miniq');

module.exports = function(tasks) {
  var targetWindow = new TargetWindow();
  parallel(1, tasks.map(function(task, i) {
    return function(done) {
      console.log(task);

      targetWindow.initialize({
        width: task.size.width,
        height: task.size.height || 768,
        url: task.url,
        out: task.out,
        format: task.format,
        quality: task.quality,
        delay: task.delay,
      }, function() {
        if (task.selector) {
          targetWindow.getDimensions(task.selector, function(dims) {
            targetWindow.capture(dims, done);
          });
        } else if (task.size.height > 0) {
          targetWindow.capture({
            x: 0,
            y: 0,
            width: task.size.width,
            height: task.size.height,
          }, done);
        } else {
          targetWindow.capture(done);
        }
      });
    };
  }), function() {
    console.log('ALL DONE');
    if (targetWindow) {
      targetWindow.close();
    }
  });
};
