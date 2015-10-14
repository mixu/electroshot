var fs = require('fs'),
    path = require('path');

function hasFilePrefix(arg) {
 return arg.substr(0, 'file://'.length) === 'file://';
}

module.exports = function(tasks, baseUrl) {
  var pairs = [];
  var filePaths = tasks.filter(function(task) { return hasFilePrefix(task.url); });
  var uniquePaths = {};
  var counter = 0;
  filePaths.forEach(function(task) {
    var p = task.url.substr('file://'.length),
        mountPath,
        isInRootPath = task.root && p.length >= task.root.length && p.substr(0, task.root.length) === task.root;
    if (isInRootPath) {
      mountPath = task.root;
    } else {
      try {
        mountPath = fs.statSync(p).isDirectory() ? p : path.dirname(p);
      } catch (e) {
        console.warn('Could not stat ' + p + '. ' + e);
        var index = tasks.indexOf(task);
        if (index !== -1) {
          tasks.splice(index, 1);
        }
        return;
      }
    }
    if (!uniquePaths[mountPath]) {
      uniquePaths[mountPath] = '/' + (counter++);
      pairs.push([uniquePaths[mountPath], mountPath]);
    }
    task.url = baseUrl + uniquePaths[mountPath];
    if (p.length > mountPath.length) {
      task.url += '/' + p.substr(mountPath.length + 1);
    }
  });
  return pairs;
};
