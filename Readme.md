
# postpone

  Postpone is a polyfill for delaying the downloading of media associated with an element when the element is not visible. This polyfill is modelled after the W3C's draft specification for [resource priorities](https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/ResourcePriorities/Overview.html).

## Installation

  Install with [component(1)](http://component.io):

  $ component install lsvx/postpone

## Usage

  To postpone an element, simply specify a `postpone` attribute on it and move the url for the resource you would like to load to a data attribute.

````html
<img data-src="http://i.imgur.com/kDtVsrE.gif" postpone>
````

  To make sure the resource loads when the element is visual, import the `postpone` module and create a new instance. This instance will automatically start watching your document.

````js
var Postpone = require( "postpone" );

postpone = new Postpone(); // Creates a new instance and starts watching the document.
````

  The postpone polyfill works with audio, embed, iframe, img, image, picture, use, video, and tref elements. *Note:* although the specification for `picture` is still evolving, postpone has basic support for it and is fully compatible with the [pictureTime polyfill](https://github.com/chuckcarpenter/picturetime).

  Postpone works by modyfing the `src` and `xlink:href` attributes of elements and their descendant `source` elements when they become visible.

### Advanced Usage
  In order to load an external resource when it scrolls into view, postpone needs to know the container with respect to which your postponed element is scrolling. In most cases this container is the document, however in some cases, such as single-page apps, the main content scrolls inside of container element with a style property like `overflow-y: scroll;`. In these cases, you should add `data-scroll-element="<selector>"` as an attribute to elements you would like to postpone, where `<selector>` is any CSS selector that uniquely identifies the container element. If no scroll element is specified, then postpone assumes that the element scrolls inside of the document.

````html
<img data-src="http://i.imgur.com/kDtVsrE.gif" postpone data-scroll-element="#wrapper">
````

## API

### .stop()
  Stop watching the document for changes.

### .start()
  If you have paused postpone's watcher, you can start it back up with `.start()`.

### .isVisible(element, [scrollElement])
  Check if your `element` is visible, where `element` and `scrollElement` are DOM nodes. If `scrollElement` is not specified, postpone assumed `element` scrolls with respect to the document.

### .load(element)
  Stop postponing the download of your `element` by manually telling postpone to load it.

## License

  MIT
