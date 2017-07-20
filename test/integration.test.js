var fs = require('fs'),
    path = require('path'),
    http = require('http'),
    crypto = require('crypto'),
    assert = require('assert'),
    spawn = require('child_process').spawn;

var fixture = require('file-fixture');
var binpath = path.normalize(__dirname + '/../bin/electroshot.js');

function md5(filename) {
  var hash = crypto.createHash('md5');
  hash.update(fs.readFileSync(filename));
  return hash.digest('hex');
}

function run(args, cwd, onDone) {
  console.log(binpath + ' ' + args.join(' '));
  var child = spawn(binpath, args, {
        cwd: cwd,
        maxBuffer: 1024 * 1024
      });
  var stdout = '';
  child.stdout.on('data', function(data) {
    stdout += data.toString();
  });
  var stderr = '';
  child.stderr.on('data', function(data) {
    stderr += data.toString();
  });
  child.on('error', function(err) {
    throw err;
  });

  child.on('close', function(code) {
      var json;
      if (stderr) {
        console.log('stderr: ' + stderr);
      }
      if (code !== 0) {
        throw new Error('Child exit code: ' + code);
      }
      console.log(stdout);
      onDone(stdout);
  });
}

describe('integration tests', function() {

  it('can delay for a specific interval', function(done) {
    this.timeout(5000);
    var tmpDir = fixture.dirname();
    run([
      __dirname + '/fixtures/interval.html', '100x100', '--out', tmpDir, '--delay', '1000'
    ], process.cwd(), function() {
      assert.ok([
        '46ead2a024bd27574d6ba36f0b47d793',
        '8875084a1f14c512aaf3310917016ddb', // OSX (2x)
        ].indexOf(md5(tmpDir + '/interval-100x100-at-1000ms.png')) !== -1);
      done();
    });
  });

  it('can screenshot a specific element', function(done) {
    this.timeout(10000);
    var tmpDir = fixture.dirname();
    run([
      __dirname + '/fixtures/selector.html', '100x100', '--out', tmpDir, '--selector', '#one'
    ], process.cwd(), function() {
      assert.ok([
        '2f4358ac1b145b71c984abc40a3306f3',
        'f7edb2bf6d64146ba7c0286144e71a75', // OSX (2x)
      ].indexOf(md5(tmpDir + '/selector-100x100.png')) !== -1);
      run([
        __dirname + '/fixtures/selector.html', '100x100', '--out', tmpDir, '--selector', '.two'
      ], process.cwd(), function() {
        assert.ok([
          'd66cec58520cb2b391354b08c0e802c8',
          '36e8405b5c031e412f3fbe669037dee3', // OSX (2x)
        ].indexOf(md5(tmpDir + '/selector-100x100.png')) !== -1);
        done();
      });
    });
  });

  it('can set a zoom factor', function(done) {
    this.timeout(10000);
    var tmpDir = fixture.dirname();
    run([
      '[',
        __dirname + '/fixtures/selector.html',
        '300x300',
        '--zoom-factor', '3',
      ']',
      '[',
        __dirname + '/fixtures/selector.html',
        '100x100',
        '--zoom-factor', '1',
      ']',
      '--out', tmpDir,
       ], process.cwd(), function() {
        assert.ok([
            '3a60ca00f2841351110ab62c78cc1f7e',
            'b42d35b26ff2d5aab7eebc9fd1bccadc',
            '21d28dbf925e0a0152ff4d2785733f30', // OSX
            '2298cb9cb647cdafe04261ffa1cbbef5', // OSX (2x)
            'bb4ab9d772fd6d9ab92ee8c4646c3df1', // Ubuntu
          ].indexOf(md5(tmpDir + '/selector-300x300.png')) !== -1
        );
        assert.ok([
            'bae69b8086212675c19dfdbba2c84eeb', // OSX
            '03bf106d36c7d05c029347762dbab688', // OSX (2x)
          ].indexOf(md5(tmpDir + '/selector-100x100.png')) !== -1
        );
        done();
    });
  });

  it('can set a Chrome flag', function(done) {
    this.timeout(5000);
    var tmpDir = fixture.dirname();
    run([
      __dirname + '/fixtures/selector.html', '100x100', '--out', tmpDir, '--force-device-scale-factor', 2
    ], process.cwd(), function() {
      assert.ok([
        'bae69b8086212675c19dfdbba2c84eeb',
        '03bf106d36c7d05c029347762dbab688', // OSX (2x)
        ].indexOf(md5(tmpDir + '/selector-100x100.png')) !== -1);
      done();
    });
  });

  it('can produce a jpg image', function(done) {
    this.timeout(5000);
    var tmpDir = fixture.dirname();
    run([
      __dirname + '/fixtures/selector.html', '100x100', '--out', tmpDir, '--format', 'jpg', '--quality', '85'
    ], process.cwd(), function() {
      // console.log(tmpDir);
      assert.ok([
        'd23a7483bfc2010d8ac15793620b98d4',
        'bb9d6e3c427eeaf883c675cf7996d73f', // OSX (2x)
        ].indexOf(md5(tmpDir + '/selector-100x100.jpg')) !== -1);
      done();
    });
  });

  it('can set a custom user agent string', function(done) {
    var tmpDir = fixture.dirname();
    var assertions = 0;
    var server = http.createServer(function(req, res) {
      assert.equal(req.headers['user-agent'], 'some-user-agent');
      assertions++;
      res.end('<html></html>');
    }).listen(3000, function() {
      run([
        'http://localhost:3000/', '100x100', '--out', tmpDir, '--user-agent', 'some-user-agent'
      ], process.cwd(), function() {
        assert.equal(assertions, 1);
        server.close(done);
      });
    });
  });

  it('can set a cookie', function(done) {
    var tmpDir = fixture.dirname();
    var assertions = 0;
    var rand = Math.random().toString(36).substring(2);
    var server = http.createServer(function(req, res) {
      assert.notEqual(req.headers.cookie.indexOf('priority=' + rand), -1);
      assertions++;
      res.end('<html></html>');
    }).listen(3000, function() {
      run([
        'http://localhost:3000/', '100x100', '--out', tmpDir, '--cookie',
        'priority=' + rand +'; expires=Wed, 29 Jan 2014 17:43:25 GMT; Path=/'
      ], process.cwd(), function() {
        assert.equal(assertions, 1);
        server.close(done);
      });
    });
  });

  it('can capture a PDF', function(done) {
    this.timeout(10000);
    var tmpDir = fixture.dirname();
    run([
      '--format', 'pdf',
      '--pdf-margin', 'minimum',
      '--pdf-page-size', 'A4',
      '--pdf-background',
      '--pdf-orientation', 'landscape',
      __dirname + '/fixtures/selector.html', '1024x',
      '--out', tmpDir
    ], process.cwd(), function() {
      console.log(tmpDir);
      done();
    });
  });

  it('can produce an image that matches a device profile', function() {

  });

  it('accepts --js <str> --js <str>', function(done) {
    this.timeout(10000);
    var tmpDir = fixture.dirname();
    run([
      '--js', "document.querySelector('body').style.backgroundColor = 'red';",
      '--js', "var e = document.querySelector('p'); e.style.fontSize = '20px'; e.style.color = 'white';",
      __dirname + '/fixtures/basic.html', '100x100',
      '--out', tmpDir
    ], process.cwd(), function() {
       assert.ok([
        'c635c5db8725d6e6fbce8a7092a4c839',
        'd524ebddc2c459132a169379998334b3', // OSX (2x)
      ].indexOf(md5(tmpDir + '/basic-100x100.png')) !== -1);
      done();
    });
  });
  it('accepts --js <path>');

  it('accepts --css <str> --css <str>', function(done) {
    this.timeout(10000);
    var tmpDir = fixture.dirname();
    run([
      '--css', 'body { background-color: red; }',
      '--css', 'p { font-size: 20px; color: white; }',
      __dirname + '/fixtures/basic.html', '100x100',
      '--out', tmpDir
    ], process.cwd(), function() {
       assert.ok([
        'c635c5db8725d6e6fbce8a7092a4c839',
        'd524ebddc2c459132a169379998334b3', // OSX (2x)
      ].indexOf(md5(tmpDir + '/basic-100x100.png')) !== -1);
      done();
    });
  });
  it('accepts --css <path>');


  it('accepts --stdin-html + html');

  describe('errors', function() {

    it('exits with the right error code');

    it('warns when called with no params', function() {

    });

    it('warns when no url is passed', function() {

    });

    it('warns when width is undefined', function() {

    });

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
    // - EADDRINUSE

  });

});
