# electroshot

Capture website screenshots with optional device and network emulation as JPG, PNG or PDF (with web fonts!) using Electron / Chrome.

# Features

- Webfonts! `electroshot` uses Electron, which offers the most recent stable version of Chrome (rather than one from years ago); this means that pages render as they would in a browser, including web fonts!
- Electron is also much faster to install, as it has prebuilt binaries that install thru npm on Ubuntu/OSX/Windows.
- You can capture screenshots from:
  - local file paths: these are served up over http by default, eliminating the hassles that come with `file://` protocol CORS security settings (etc.)
  - http and https URLs
  - as a timelapse using multiple `--delay`s
- You can capture PNG, JPG or PDF screenshots:
  - cropped to a specific size
  - full-page screenshots at a particular width (e.g. for testing CSS)
  - a single element matched by a specific CSS selector
  - ... after either waiting for the page to render, or after a custom timeout
- Supports Chrome's powerful options for device emulation
  - ... which make it easy to emulate a specific device, like the iPhone, with the right user agent settings, device pixel ratio and screen resolution
- Supports Chrome's network condition emulation options (RTT latency and bandwidth throttling)
  - ... which (with `--delay`) make it easy to produce a page load timeline

## Changelog

- `v1.4.0` upgrades to Electron 1.6.11 (Chromium 56) & fixes a rounding bug (thanks shawnbot!).
- `v1.3.0` fixes the ability to extend the window size to be beyond screen height (thanks danielkalen!) and makes Electroshot exit with the same exit code as Electron (thanks handcraftedbits!)
- `v1.2.0` adds Windows-related fixes
- `v1.1.0` upgrades electron for 2017

## Quickstart

Install `electroshot` via npm (to get npm, just [install Node.js](http://nodejs.org/download/)):

    sudo npm install -g electroshot

## Usage

Specify urls and screen resolutions as arguments - urls first. The CLI design was strongly influenced by the excellent [pageres-cli](https://github.com/sindresorhus/pageres-cli) CLI.

```
electroshot <url> <resolution | device preset>

electroshot google.com 1024x768
electroshot google.com 1024x768 1366x768 # 2 screenshots
electroshot google.com yahoo.com 1024x768 # 2 screenshots
electroshot google.com yahoo.com 1024x768 1366x768 # 4 screenshots
```

You can also capture screenshots with device emulation on. Device presets work just like resolutions:

```
electroshot google.com "iPhone 6"
electroshot google.com "horizontal iPhone 6" "Nexus 6" # 2 screenshots
electroshot google.com yahoo.com 1024x768 "Nokia N9" # 4 screenshots
```

To list all the device presets, run `electroshot --list-devices`. Prepending "horizontal" to the device name switches it to horizontal (landscape) orientation.

To use a custom device, set `--device <json>`, where the value is a JSON blob that defines a custom device, similar to how devices are listed in [chromium-emulated-devices](https://github.com/mixu/chromium-emulated-devices) under `extensions.device` in `index.json`.

You can also pass in file paths. By default, file paths are served through an Express static file server on localhost to avoid the hassles that come with the `file://` protocol. By default, the directory that contains the file becomes the webroot of the server.

```
electroshot /path/index.html 1024x768 # mounts /path onto localhost:3000/
electroshot file:///path/index.html 1024x768 # skips mounting, and loads a file:// url
```

You can capture a local file directly without a static file server by explicitly starting files with the `file://` protocol.

You can set the web server root by setting `--root /path` explicitly.

```
electroshot /foo/bar/index.html 1024 --root /foo
```

## Cropping

By default, what you say is what you get - the screenshots are clipped to the specified size. To generate a screenshot of the whole page (e.g. as tall needed for the page), just leave out the height:

```
electroshot google.com 800x
electroshot google.com 800 # also works
electroshot google.com "cropped iPhone 6" # cropped to iPhone 6 screen height
electroshot google.com "iPhone6"x800 # cropped to 800 px tall
```

Emulated devices can also be cropped. Prepending "cropped" to the device name will produce a screenshot that is the size of a single screen for that device. You can also set a specific pixel height as shown in the example above.

## Capture groups

You can group arguments with square brackets:

```
electroshot [ <url> <resolution> ] [ <url> <resolution> ]
electroshot [ <url> <resolution> ... ]

# Mix grouped and single arguments
electroshot [ google.com 1024x768 1600x900 ] google.com 1366x768

# Options defined inside a group will override the outer ones.
electroshot [ google.com 1024x --format png ] google.com 1366x --format jpg
```

## Capture options

### Location and file name

You can set the output directory by setting `--out <dir>` (default: process.cwd).

You can explicitly set the full path for each screenshot using `--filename <path>`. Relative paths in file names are relative to `--out`, full paths are preserved as-is.

```
electroshot google.com 1024 --out /foo/bar
# -> writes /foo/bar/screenshot.png
electroshot google.com 1024 --out /foo/bar --filename "screenshot.png"
# -> writes /foo/bar/google.com-linux.png
electroshot google.com 1024 --filename "/foo/bar/{name}-{platform}.{format}"
```

You can also use the following tokens to specify a template for filenames. The default template is `{name}-{size}.{format}`; if you set a `--delay`, it is `{name}-{size}-at-{delay}ms.{format}`.

- `{crop}`: `-cropped` if the height is not set
- `{date}`: a date like `2015-10-21`
- `{time}`: a time like `17:00:50`
- `{delay}`: the `--delay` value used for the screenshot (`''` if 0)
- `{name}`:
  - for http/https urls, this is a filename-safe version of the URL (no protocol), e.g.
    - `google.com` -> `google.com`
    - `https://github.com/mixu/gr#features?foo=bar` -> `github.com-mixu-gr-features-foo-bar`
  - for local files:
    - when there is a single target, this is the filename without an extenstion e.g. `/foo/bar/index.html` -> `index`
    - when there are multiple targets, this the full path to the file, excluding  any shared extensions and paths, e.g. `/foo/bar/index.html`, `/foo/baz/index.html` -> `bar-index`, `baz-index`
- `{size}`: if a device is emulated, this is the name of device (e.g. `iphone-6`); otherwise this is equivalent to `{width}x{height}`.
- `{width}`: the current width, e.g. `1024`
- `{height}`: the current height, e.g. `768`
- `{platform}`: the current operating system as returned by [`os.platform()`](https://nodejs.org/api/os.html#os_os_platform)
- `{format}`: `.png` or `.jpg`

If the generated filenames are not unique, a number will be appended to the paths, e.g. `foo.com-1024x768-1.png` and `foo.com-1024x768-2.png`.

### Page rendering: delay, selector, zoom-factor

You can capture a specific DOM element via `--selector <expr>`. The selector is passsed to [`document.querySelector`](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector). The screenshot is cropped and sized to match the element as it appears on the page.

You can set the default zoom factor of the page using `--zoom-factor <n>`. 1.0 represents 100% and 3.0 represents 300%.

On OSX, you should also be aware of the Chrome flag `--force-device-scale-factor <n>` which forces Chrome to use a specific high dpi scale factor. You can pass Chrome flags to `electroshot` and they will be passed through to Electron / Chrome.

To introduce a delay to the page capture, specify `--delay <ms>`. The default value is `0`, which simply waits until two [`requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) calls have passed. This is usually enough time to capture something reasonable.

You can set multiple `--delay`s to capture the page(s) at multiple points in time. Combined with `--emulate-network`, this can produce a full timeline of loading a specific page under slow network access.

```
electroshot --emulate-network "Good 3G" theverge.com "cropped Nexus 6" --delay 1000 --delay 3000 --delay 5000 --delay 6000 --delay 8000 --delay 0
```

Note that there are some limitations when using `--delay`. Specifically:

- you need to explicitly specify the height of the screen capture and
- you cannot specify `--selector` or `--zoom-factor`

This is because those features require `electroshot` to inject a content script, and Electron's `executeJavaScript` API waits until the page is fully loaded before executing injected scripts - so I had to pick between having those features available or having accurate timing information. Let me know if you can figure out a better way to handle those features.

### Format-specific options

You can capture screenshots as JPG, PNG, or PDF by setting `--format <png|jpg|pdf>`. The following options control format-specific options.

- `--quality <0..100>`: Sets the jpg quality parameter (default: 75).
- `--pdf-margin <default|none|minimum>`: Sets the PDF margin.
- `--pdf-page-size <size>`: Sets the PDF page size. Valid values are `A4`, `A3`, `legal`, `letter`, `tabloid`
- `--pdf-background`:   Whether to print CSS backgrounds. (false by default)
- `--pdf-orientation <orientation>`: Sets the PDF orientation. Valid values are `landscape` and `portrait`.

## Network emulation

To list all the known network condition presets, run `electroshot --list-networks`.

Use `--emulate-network <preset>` to set a specific network profile.

```
electroshot --emulate-network "Good 3G" theverge.com "cropped iPhone 6"
```

You can also set the network parameters individually:

- `--latency <ms>`: RTT in ms.
- `--download <Bps>`: Download rate in Bps.
- `--upload <Bps>`: Upload rate in Bps.

## Capturing using an headless server / vagrant / docker

Most headless (e.g. no X11) environments will need some additional packages to be installed for `electroshot` to work. Here's one example snippet:

```
# Install dependencies
apt-get update &&\
    apt-get install -y libgtk2.0-0 libgconf-2-4 \
    libasound2 libxtst6 libxss1 libnss3 xvfb ttf-mscorefonts-installer

# Start Xvfb
Xvfb -ac -screen scrn 1280x2000x24 :9.0 &
export DISPLAY=:9.0
```

Related issue on Electron: https://github.com/atom/electron/issues/228

## HTTP options

You can set a custom user agent using `--user-agent <string>`.

You can set a custom cookie using `--cookie <cookie>`. This can be set multiple times.

The local file server starts on `localhost` port `3000` by default if you pass in local file paths. You can set the hostname and port using `--host <hostname>` and `--port <port>`. As discussed earlier, you can control the mount point by setting `--root <dir>`.

If you need to ignore SSL errors, you can set the Chrome flag `--ignore-certificate-errors`.

## Content injection

You can inject CSS and JS into the page using the following options:

- `--css <str>`: Inserts a string of CSS onto the page. Can be set multiple times.
- `--js <str>`: Inserts a string of JS onto the page. Can be set multiple times.

## Misc

- `--help, -h`: Shows the builtin help.
- `--debug`: Enables debugging mode, which shows additional logging information and renders the screenshots in a visible window.
- `--version`: Shows version info for `electroshot` as well as the Chrome and Electron version used.

### Passing thru Chrome flags

`electroshot` passes any unknown flags on to Chrome via Electron. Here are three useful flags:

- `--ignore-certificate-errors`: Ignores certificate related errors.
- `--force-device-scale-factor <n>`: Forces Chrome to use a specific hidpi scale factor.
- `--proxy-server <address:port>`: Use a specified proxy server. Only affects HTTP and HTTPS requests.

For more, see: https://github.com/atom/electron/blob/master/docs/api/chrome-command-line-switches.md and
http://peter.sh/experiments/chromium-command-line-switches/.

## API

TODO for now; will probably look something like:

- resolve args
- resolve mountpoints
- run server
- run electron
