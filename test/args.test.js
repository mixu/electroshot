var assert = require('assert');
var argsToTasks = require('../electron/args-to-tasks.js');
var fixture = require('file-fixture');

describe('args to tasks', function() {

  // output path determination

  it('accepts <url> <resolution>', function() {
    assert.deepEqual(argsToTasks(['http://google.com', '1024x768']), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 768 },
        filename: 'google.com-1024x768.png'
      }
    ]);
  });

  it('accepts <url> <resolution> <resolution>', function() {
    assert.deepEqual(argsToTasks(['http://google.com', '1024x768', '1366x768']), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 768 },
        filename: 'google.com-1024x768.png'
      },
      {
        url: 'http://google.com/',
        size: { width: 1366, height: 768 },
        filename: 'google.com-1366x768.png'
      },
    ]);
  });

  it('accepts <url> <url> <resolution>', function() {
    assert.deepEqual(argsToTasks(['http://google.com', 'http://gmail.com', '1024x768']), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 768 },
        filename: 'google.com-1024x768.png'
      },
      {
        url: 'http://gmail.com/',
        size: { width: 1024, height: 768 },
        filename: 'gmail.com-1024x768.png'
      },
    ]);
  });

  it('accepts grouped arguments', function() {
    assert.deepEqual(argsToTasks([ '[', 'http://google.com', '1024x768', ']']), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 768 },
        filename: 'google.com-1024x768.png'
      }
    ]);
    assert.deepEqual(argsToTasks([
      '[', 'http://google.com', '1024x768', ']',
      '[', 'http://gmail.com', '1366x768', ']'
    ]), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 768 },
        filename: 'google.com-1024x768.png'
      },
      {
        url: 'http://gmail.com/',
        size: { width: 1366, height: 768 },
        filename: 'gmail.com-1366x768.png'
      }
    ]);
  });

  it('accepts mixed grouped arguments', function() {
    assert.deepEqual(argsToTasks([
      '[', 'http://google.com', '1024x768', ']',
      'http://gmail.com', '1366x768'
    ]), [
      {
        url: 'http://google.com/',
        size: { width: 1024, height: 768 },
        filename: 'google.com-1024x768.png'
      },
      {
        url: 'http://gmail.com/',
        size: { width: 1366, height: 768 },
        filename: 'gmail.com-1366x768.png'
      }
    ]);

  });

  // when given multiple pages on the same domain (??): use the full path + qs
  // -> https://github.com/sindresorhus/filenamify-url

  // default values vs overrides in groups

  // options:
  // --delay <ms> || name of callback
  // --filename <template>
  // --selector <element>
  // --format <png | jpg> (--quality)
  // --scale
  // --force-device-scale-factor 1
  // --keywords (http://viewportsizes.com/)
  // maybe not:
  // --hide
  // other actions on elements ? custom script??
  // --debug (pop open electron window, verbose logging)
  // --parallel <n> (num windows)
  // good looking messages V Generated 3 screenshots from 2 urls
  // Remap --crop ???

/*
 if (options.selector) {
   page.clipRect = page.evaluate(function (s) {
     return document.querySelector(s).getBoundingClientRect();
   }, options.selector);
 }
*/
  // cool:
  // - tiling (montage) use case
  // - diffing


  // errors:
  // - no url
  // - width is undefined
  // - remove temporary files on error (any error)
  // - 404 error on URL
  // - redirects
  // - SSL errors
  // - page.onError handler
  // - cannot exec
  // - page is very wide or very tall

  // web options:
  // - cookies, headers, http auth, userAgent
  // - ignore ssl errors (?)
  // - pipe in content (?)


  // special format strings
});
