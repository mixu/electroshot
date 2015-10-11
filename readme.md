# screenshot

# Features

- Webfonts! `electroshot` uses Electron, which offers the most recent stable version of Chrome (rather than one from years ago); this means that pages render as they would in a browser, including web fonts! Electron is also much faster to install, as it has prebuilt binaries that install thru npm on Ubuntu/OSX/Windows.
- You can capture screenshots from:
  - local file paths: these are served up over http by default, eliminating the hassles that come with `file://` protocol CORS security settings (etc.)
  - http and https URLs
  - strings of HTML (piped in)
  - as a timelapse using multiple `--delay`s
- You can capture png or jpeg screenshots:
  - cropped to a specific size
  - full-page screenshots at a particular width (e.g. for testing CSS)
  - a single element matched by a specific CSS selector
  - ... after either waiting for the page to render, or after a custom timeout
- Supports Chrome's powerful options for device emulation and network condition emulation - so you can see what your site would look like on a specific device or given significantly worse network conditions.
  - includes user agent settings, device pixel ratio and screen resolutions at different orientations
  - includes RTT latency and upload and download bandwidth throttling

- capture options:
  - perform other actions on specific elements on the page before screenshotting
  - wait timeout (for killing the process)
  - zoom factor / scaling

## Quickstart

Install `electroshot` via npm (to get npm, just [install Node.js](http://nodejs.org/download/)):

    sudo npm install -g electroshot

## Usage

Specify urls and screen resolutions as arguments - urls first. The CLI design was strongly influenced by the excellent [pageres-cli](https://github.com/sindresorhus/pageres-cli) CLI.

```
electroshot <url> <resolution>

electroshot google.com 1024x768
electroshot google.com 1024x768 1366x768 # 2 screenshots
electroshot google.com yahoo.com 1024x768 # 2 screenshots
electroshot google.com yahoo.com 1024x768 1366x768 # 4 screenshots
```

By default, what you say is what you get - the screenshots are clipped to the specified size. To generate a screenshot of the whole page (e.g. as tall needed for the page), just leave out the height:

```
electroshot google.com 800x
electroshot google.com 800 # also works
```

You can also pass in file paths. By default, file paths are served over localhost to avoid the hassles around the `file://` protocol. Specifically, the directory that contains the file becomes the webroot of the server.

If you want to, you can use the `file://` protocol by prefixing all your paths with `file://`; these files will then be directly loaded from the file system.

You can group arguments with square brackets:

```


```

## Capture options

- output formats:
  - PDF?
    - paper-format
    - paper-orientation
    - paper-margin

marginsType Integer - Specify the type of margins to use
0 - default
1 - none
2 - minimum
pageSize String - Specify page size of the generated PDF.
A4
A3
Legal
Letter
Tabloid
printBackground Boolean - Whether to print CSS backgrounds.
printSelectionOnly Boolean - Whether to print selection only.
landscape Boolean - true for landscape, false for portrait.

## File names




## Capturing using an headless server / vagrant / docker

See: https://github.com/atom/electron/issues/228

## Server options

- cookies
- ignore SSL errors
- set user agent

## Content injection

- injection:
  - inject HTML / CSS / JS onto the page


## Device and network emulation

latency Double - RTT in ms
downloadThroughput Double - Download rate in Bps
uploadThroughput Double - Upload rate in Bps

Setting multiple delays


screenPosition String - Specify the screen type to emulate (default: desktop)
desktop
mobile
screenSize Object - Set the emulated screen size (screenPosition == mobile)
width Integer - Set the emulated screen width
height Integer - Set the emulated screen height
viewPosition Object - Position the view on the screen (screenPosition == mobile) (default: {x: 0, y: 0})
x Integer - Set the x axis offset from top left corner
y Integer - Set the y axis offset from top left corner
deviceScaleFactor Integer - Set the device scale factor (if zero defaults to original device scale factor) (default: 0)
viewSize Object - Set the emulated view size (empty means no override)
width Integer - Set the emulated view width
height Integer - Set the emulated view height
fitToView Boolean - Whether emulated view should be scaled down if necessary to fit into available space (default: false)
offset Object - Offset of the emulated view inside available space (not in fit to view mode) (default: {x: 0, y: 0})
x Float - Set the x axis offset from top left corner
y Float - Set the y axis offset from top left corner
scale Float - Scale of emulated view inside available space (not in fit to view mode) (default: 1)


UA: https://github.com/atom/electron/blob/master/docs/api/web-contents.md#webcontentsloadurlurl-options

enableDeviceEmulation: https://github.com/atom/electron/blob/master/docs/api/web-contents.md

enableNetworkEmulation: https://github.com/atom/electron/blob/master/docs/api/session.md#sessionenablenetworkemulationoptions


# nonfeatures

  - cropping a specific region and/or offset ({top}x{left}x{width}x{height} on CLI)
  - transparent bg or color
- HTTP options
  - CURL-like:
    - https://code.google.com/p/chromium/codesearch#chromium/src/third_party/WebKit/Source/devtools/front_end/network/NetworkLogView.js&q=_generateCurlCommand&sq=package:chromium&type=cs&l=1725
    - custom headers
    - basic auth
  - custom behavior on different HTTP codes
- thumbnails / montage
- diffing: https://github.com/Huddle/Resemble.js
  - test suite definitions (mocha compatible assertions)
  - GUI with github-like previews
    - generate two-way as image
    - two-way
    - three way https://github.com/stefanjudis/grunt-photobox
    - side by side
    - onion skin
    - assertion name, assert message
    - responsive sizes by default
    - www_google_com_320x480.jpeg
    - www_google_com_480x320.jpeg
    - www_google_com_1024x768.jpeg
    - www_google_com_768x1024.jpeg
    - www_google_com_1280x768.jpeg
- streaming API
  - chainable
  - request-like .defaults
