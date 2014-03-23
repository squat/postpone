
# postpone

  Postpone is a polyfill for delaying the downloading of media associated with an element when the element is not visible. This polyfill is modelled after the W3C's draft specification for [resource priorities](https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/ResourcePriorities/Overview.html).

## Installation

  Install with [component(1)](http://component.io):

    $ component install lsvx/postpone

  Install with [bower](http://bower.io/)

    $ bower install postpone


## Usage

  To postpone an element, simply specify a `postpone` attribute on it and move the url for the resource you would like to load to a data attribute.

````html
<img data-src="http://i.imgur.com/kDtVsrE.gif" postpone>
````

  Postpone is written using a [UMD](https://github.com/umdjs/umd) pattern so it can be used in CJS-style environments, with AMD loaders, or as a browser global. To start using postpone, import the `postpone` module and create a new instance; this instance will automatically start watching your document.

````js
// If you are using postpone as a CJS module, require it like so:
var Postpone = require( "postpone" );

var postpone = new Postpone(); // Creates a new instance and starts watching the document.
````

*Note:*  If you are using postpone in a large project or as a dependency for a library you would like to distribute publicly, then it is advisable to import it as a module rather than use it as a global variable to avoid polluting the global namespace.

  By default, postpone will load an element's resource when that element scrolls into the viewport, however, you may want postpone to start loading your resources a bit before they scroll into view to ensure that they are available by the time they are on screen. Postpone lets you do this easily by passing a parameter to the constructor. If you feed postpone a number, postpone will assume you are using `vh` units, however you can also feed it a string with explicit units, such as `"150px"` or `"30vh"`. Currently, only `vh` and `px` units are supported.

````js
var postpone = new Postpone( 50 ); // Postpone will set the threshold to 50vh, or half a viewport.
````

Optionally, you can manually change the threshold at any point in your code by calling the `.setThreshold()` method.

````js
var postpone = new Postpone() // Threshold defaults to 0vh

... // Do something with our code.

postpone.setThreshold( "200px" ).postpone() // Change the threshold to 200px.
````

*Note:* it is good practice to chain the `postpone()` method after changing the threshold to make sure postpone reexamines the postponed elements in the document and check if any of them should be loaded.

  The postpone polyfill works with audio, embed, iframe, img, image, object, picture, use, video, and tref elements. *Note:* although the specification for `picture` is still evolving, postpone has basic support for it and is fully compatible with the [pictureTime polyfill](https://github.com/chuckcarpenter/picturetime).

  Postpone works by modyfing the `src` and `xlink:href` attributes of elements and their descendant `source` elements when they become visible.

### Advanced Usage
  In order to load an external resource when it scrolls into view, postpone needs to know the container with respect to which your postponed element is scrolling. In most cases this container is the document, however in some cases, such as single-page apps, the main content scrolls inside of container element with a style property like `overflow-y: scroll;`. In these cases, you should add `data-scroll-element="<selector>"` as an attribute to elements you would like to postpone, where `<selector>` is any CSS selector that uniquely identifies the container element. If no scroll element is specified, then postpone assumes that the element scrolls inside of the document.

````html
<img data-src="http://i.imgur.com/kDtVsrE.gif" postpone data-scroll-element="#wrapper">
````

## API

### .stop()
  Stop all of postpone's functionality. This means postpone will stop watching the document for changes and will unbind any scroll events associated with postponed elements.

### .start()
  If you have paused postpone's watcher and unbound its scroll events using `.stop()`, you can start it all back up with `.start()`.

### .isInViewport(element, [scrollElement])
  Check if your `element` is somewhere in the browser's viewport, where `element` and `scrollElement` are DOM nodes. If `scrollElement` is not specified, postpone assumes that `element` scrolls with respect to the document.

### .isVisible(element)
  Check if your `element` is visually hidden, where `element` is a DOM node. This method checks if `element` or any parent element is hidden with the CSS style `display: none;`.

### .load(element)
  Stop postponing the download of your `element` by manually telling postpone to load it.

### .setThreshold([threshold])
  Set postpone's threshold, the distance away from an edge of the viewport at which an element should be considered to be at the edge and thus loaded. `setThreshold()` accepts one optional argument and can be called at any point. The argument can be a string representing a distance in either `vh` or `px` units, a number, in which case the threshold will be interpretted as having `vh` units, or empty, effectively setting the threshold to 0.

## License

  MIT
