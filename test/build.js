
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("postpone/index.js", Function("exports, require, module",
"(function ( root, factory ) {\n\
    if ( typeof define === \"function\" && define.amd ) {\n\
        define( [], factory );\n\
    } else if ( typeof exports === \"object\" ) {\n\
        module.exports = factory();\n\
    } else {\n\
        root.Postpone = factory();\n\
    }\n\
}(this, function() {\n\
    \"use strict\";\n\
\n\
    /**\n\
    * Creates a new Postpone instance.\n\
    * @constructor\n\
    * @param {number|string} [threshold] - The distance from an edge at which an\n\
    * element should be considered to be at the edge.\n\
    */\n\
    var Postpone = function( threshold ) {\n\
        if ( !( this instanceof Postpone ) ) return new Postpone( threshold );\n\
\n\
        /**\n\
        * The init method for Postpone gets the object running. It runs\n\
        * postpone.postpone() to attach scroll event handlers and check if any\n\
        * elements are already visible. Then, init will start the watch process.\n\
        * @returns this\n\
        */\n\
        this.init = function( threshold ) {\n\
            /**\n\
            * @property {string} tags - A list of all the tags for which postpone\n\
            * will work;\n\
            */\n\
            this.tags = \"audio, embed, iframe, img, image, picture, use, video, tref\";\n\
            /**\n\
            * @property {array} elements - An array of all the postponed elements in the document.\n\
            */\n\
            this.elements = [];\n\
            /**\n\
            * @property {object} scrollElements - A variable to keep track of the\n\
            * elements with respoect to which the postponed elements scroll.\n\
            */\n\
            this.scrollElements = [];\n\
            this.setThreshold( threshold );\n\
            this.postpone();\n\
\n\
            /** Call method to start looking for postponed media. */\n\
            return this.start();\n\
        };\n\
\n\
        return this.init( threshold );\n\
    };\n\
\n\
    /**\n\
    * The main postpone method. This method iterates over all the elements with\n\
    * a `postpone` attribute and links them to a scroll event so that they are not\n\
    * loaded until they become visible.\n\
    * @returns this\n\
    */\n\
    Postpone.prototype.postpone = function() {\n\
        /**\n\
        * Remove any previous event handlers so they can be reattached for new\n\
        * postponed elements without duplicating old ones. This must be done\n\
        * before updating the scroll elements so the references to the event\n\
        * callbacks still exist.\n\
        */\n\
        this.unbindEvents();\n\
\n\
        /**\n\
        * Update the elements and scroll elements to properly load or postpone\n\
        * them.\n\
        */\n\
        this.getElements();\n\
        this.getScrollElements();\n\
\n\
        /**\n\
        * If any of the postponed elements should be visible to begin with,\n\
        * load them.\n\
        */\n\
        for ( var id in this.scrollElements ) {\n\
            for ( var i = 0, element = {}; i < this.scrollElements[ id ].length; i++ ) {\n\
                element = this.scrollElements[ id ][ i ];\n\
                if ( this.isInViewport( element, this.scrollElements[ id ].element ) ) {\n\
                    this.load( element );\n\
                }\n\
            }\n\
        }\n\
\n\
        if ( this.elements.length ) {\n\
        /** Attach scroll event listeners. */\n\
            this.bindEvents();\n\
        }\n\
\n\
        return this;\n\
    };\n\
\n\
    /**\n\
    * A helper method to unbind the scroll event callbacks.\n\
    * @returns this\n\
    */\n\
    Postpone.prototype.unbindEvents = function() {\n\
        for ( var id in this.scrollElements ) {\n\
            if ( id === \"window\" ) {\n\
                window.removeEventListener( \"scroll\", this.scrollElements[ id ].callback );\n\
            } else {\n\
                this.scrollElements[ id ].element.removeEventListener( \"scroll\", this.scrollElements[ id ].callback );\n\
            }\n\
        }\n\
    };\n\
\n\
    /**\n\
    * A helper method to bind the scroll event callbacks.\n\
    * @returns this\n\
    */\n\
    Postpone.prototype.bindEvents = function() {\n\
        for ( var id in this.scrollElements ) {\n\
            this.scrollElements[ id ].callback = this.scrollHandler.bind( this );\n\
            if ( id === \"window\" ) {\n\
                window.addEventListener( \"scroll\", this.scrollElements[ id ].callback );\n\
            } else {\n\
                this.scrollElements[ id ].element.addEventListener( \"scroll\", this.scrollElements[ id ].callback );\n\
            }\n\
        }\n\
    };\n\
\n\
    /**\n\
    * A helper method to find all of the elements with a postponed attribute.\n\
    * @returns {array} An array of nodes with a `truthy` postpone attribute.\n\
    */\n\
    Postpone.prototype.getElements = function() {\n\
        var elements = [],\n\
            visible = [],\n\
            matches = this._slice( document.querySelectorAll( this.tags ) ),\n\
            postpone = null;\n\
\n\
        for ( var i = 0; i < matches.length; i++ ) {\n\
            postpone = matches[ i ].getAttribute( \"postpone\" );\n\
            if ( typeof postpone === \"string\" && postpone !== \"false\" ) {\n\
                elements.push( matches[ i ] );\n\
                if ( this.isVisible( matches[ i ] ) ) {\n\
                    visible.push( matches[ i ] );\n\
                }\n\
            }\n\
        }\n\
        this.elements = elements;\n\
        /**\n\
        * @property {array} visible - An array of all the non-hidden postponed\n\
        * elements in the document.\n\
        */\n\
        this.elements.visible = visible;\n\
    };\n\
\n\
    /**\n\
    * A helper method to find all of the elements with respect to which\n\
    * postponed elements scroll. The elements are stored with a unique ID as\n\
    * their key.\n\
    * @returns {object} A hash with arrays of postponed elements associated with\n\
    * IDs of their scroll elements.\n\
    */\n\
    Postpone.prototype.getScrollElements = function() {\n\
    this.scrollElements = {};\n\
\n\
        var id = \"\",\n\
            element = {},\n\
            scrollElement = {};\n\
\n\
        for ( var i = 0; i < this.elements.visible.length; i++ ) {\n\
            element = this.elements.visible[ i ];\n\
            /**\n\
            * Find the element relative to which the postponed element's\n\
            * position should be calculated.\n\
            */\n\
            if ( element.getAttribute( \"data-scroll-element\" ) ) {\n\
                scrollElement = document.querySelector( element.getAttribute( \"data-scroll-element\" ) );\n\
                /**\n\
                * If the scroll element does not have an ID, generate one and\n\
                * assign it as a data attribute.\n\
                */\n\
                id = scrollElement.getAttribute( \"data-id\" );\n\
                if ( !id ) {\n\
                    scrollElement.setAttribute( \"data-id\", id = new Date().getTime() );\n\
                }\n\
            /**\n\
            * If the element does not have a scroll element specified then\n\
            * assume its position should be calculated relative to the window.\n\
            */\n\
            } else {\n\
                scrollElement = \"window\";\n\
                id = \"window\";\n\
            }\n\
            /**\n\
            * If the array already has this id as a key, then add the current\n\
            * element to the array in its value, otherwise create a new key.\n\
            */\n\
            if ( this.scrollElements[ id ] ) {\n\
                this.scrollElements[ id ].push( element );\n\
            } else {\n\
                this.scrollElements[ id ] = [ element ];\n\
                this.scrollElements[ id ].element = scrollElement;\n\
            }\n\
        }\n\
        return this.scrollElements;\n\
    };\n\
\n\
    /**\n\
    * A small helper that finds the posponed elements and returns them in a\n\
    * string.\n\
    * @param {array} elements - An array of elements to stringify.\n\
    * @returns {string} A string containing all the HTML of postponed elements.\n\
    */\n\
    Postpone.prototype.stringifyElements = function( elements ) {\n\
        var elementsString = \"\";\n\
\n\
        for ( var i = 0; i < elements.length; i++ ) {\n\
            elementsString += elements[ i ].outerHTML;\n\
        }\n\
\n\
        return elementsString;\n\
    };\n\
\n\
    /**\n\
    * Method to watch the document for new postponed elements.\n\
    * @param {string} [elementsString] - A string of non-visually hidden\n\
    * postponed elements.\n\
    * @returns this\n\
    */\n\
    Postpone.prototype.watch = function( elementsString ) {\n\
        /** Refresh the array of postponed elements, this.elements. */\n\
        this.getElements();\n\
        var newElementsString = this.stringifyElements( this.elements.visible );\n\
        /** If the postponed elements have changed, then postpone them. */\n\
        if ( elementsString !== newElementsString ) {\n\
            this.postpone();\n\
        }\n\
        /**\n\
        * This timeout calls the watch method every 500ms. In other words,\n\
        * postpone will look for new postponed elements twice a second.\n\
        * @property {number} timeout - The ID for the current timeout.\n\
        */\n\
        this.timeout = window.setTimeout( (function( _this ) {\n\
            return function() {\n\
                return _this.watch( newElementsString );\n\
            };\n\
        })( this ), 500);\n\
\n\
        return this;\n\
    };\n\
\n\
    /**\n\
    * Method to start watching for elements that should postponed.\n\
    * @returns this\n\
    */\n\
    Postpone.prototype.start = function() {\n\
        /** Ensure that watching has stopped before starting to watch. */\n\
        if ( this.timeout ) this.stop();\n\
        /** Start watching. */\n\
        this.watch();\n\
\n\
        return this;\n\
    };\n\
\n\
    /**\n\
    * Method to stop watching for elements that should postponed and unbind events\n\
    * associated with postponed elements.\n\
    * @returns this\n\
    */\n\
    Postpone.prototype.stop = function() {\n\
        if ( this.timeout ) window.clearTimeout( this.timeout );\n\
\n\
        /* Unbind the scroll events associated with postponed elements. */\n\
        this.unbindEvents();\n\
\n\
        return this;\n\
    };\n\
\n\
    /**\n\
    * This method defines the scroll event handler used to test if postponed\n\
    * elementes are visible.\n\
    * @param {object} e - Event object.\n\
    * @returns this\n\
    */\n\
    Postpone.prototype.scrollHandler = function( e ) {\n\
        var scrollElement = e.srcElement || e.target,\n\
            elements = this.scrollElements[ scrollElement === window.document ? scrollElement = \"window\" : scrollElement.getAttribute( \"data-id\" ) ],\n\
            element = {},\n\
            scrolledIntoView = false;\n\
\n\
        for ( var i = 0; i < elements.length; i++ ) {\n\
            element = elements[ i ];\n\
\n\
            /**\n\
            * If an element is visible then we no longer need to postpone it\n\
            * and can download it.\n\
            */\n\
            if ( this.isInViewport( element, scrollElement ) ) {\n\
            this.load( element );\n\
            }\n\
        }\n\
\n\
        return this;\n\
    };\n\
\n\
    /**\n\
    * A convenience method to easily set the threshold property of postpone.\n\
    * @param {number|string} threshold - The distance from an edge at which an\n\
    * element should be considered to be at the edge.\n\
    * @returns this\n\
    */\n\
    Postpone.prototype.setThreshold = function( threshold ) {\n\
        threshold = threshold ? threshold : 0;\n\
        /**\n\
        * @property {object} threshold - A hash containing the value and unit of\n\
        * measurement of the desired postpone threshold.\n\
        */\n\
        this.threshold = {};\n\
        /**\n\
        * @property {number} value - The number of units from an edge at\n\
        * which an element should be considered to be at the edge. This is\n\
        * useful to start loading images or other resources before they scroll\n\
        * into view to prevent flash of content.\n\
        */\n\
        this.threshold.value = parseInt( threshold, 10 );\n\
        /**\n\
        * @property {string} unit - The unit of measurement for the threshold\n\
        * value. Currently, only `vh` and `px` are supported. By default, the unit\n\
        * is `vh`.\n\
        */\n\
        this.threshold.unit = ( typeof threshold === \"number\" ) ? \"vh\" : ( threshold.match(/[a-zA-Z]+/)[ 0 ] || \"vh\" );\n\
\n\
        return this;\n\
    };\n\
    /**\n\
    * Small helper method to find the total vertical offset of an element.\n\
    * @param {object} el - The element we wish to locate.\n\
    * @returns {number} The total vertical offset of the element.\n\
    */\n\
    Postpone.prototype.offsetTop = function( el ) {\n\
        var temp = el,\n\
            o = 0;\n\
        /** Iterate over all parents of el up to body to find the vertical offset. */\n\
        while ( temp && temp.tagName.toLowerCase() !== \"body\" && temp.tagName.toLowerCase() !== \"html\" ) {\n\
            o += temp.offsetTop;\n\
            temp = temp.offsetParent;\n\
        }\n\
\n\
        return o;\n\
    };\n\
\n\
    /**\n\
    * Small helper method to determine if an element is visually hidden or not.\n\
    * This method check if the element provided, or any of its parents have the\n\
    * style `display: none;`.\n\
    * @param {object} el - The element we wish to locate.\n\
    * @returns {boolean} Returns true if the element is visible and false if it is\n\
    * hidden.\n\
    */\n\
    Postpone.prototype.isVisible = function( el ) {\n\
        var temp = el,\n\
            isVisible = true;\n\
        /**\n\
        * Iterate over all parents of el up to HTML to find if el or a parent is\n\
        * hidden.\n\
        */\n\
        while ( temp && temp.parentElement && isVisible ) {\n\
            isVisible = temp.currentStyle ? temp.currentStyle.display !== \"none\" : document.defaultView.getComputedStyle( temp ).getPropertyValue( \"display\" ) !== \"none\";\n\
            temp = temp.parentElement;\n\
        }\n\
\n\
        return isVisible;\n\
    };\n\
\n\
    /**\n\
    * Helper method to determine if an element is in the browser's viewport.\n\
    * @param {object} el - The element we wish to test.\n\
    * @param {object} [scrollElement] - The element with respect to which `el` scrolls.\n\
    * @returns {boolean} Return true if the `el` is in view and false if it is not.\n\
    */\n\
    Postpone.prototype.isInViewport = function( el, scrollElement ) {\n\
        /** If no scroll element is specified, then assume the scroll element is the window. */\n\
        scrollElement = scrollElement ? scrollElement : \"window\";\n\
\n\
        if ( scrollElement === \"window\" ) {\n\
            scrollElement = document.documentElement.scrollTop ? document.documentElement : document.body;\n\
        }\n\
        /** Use clientHeight instead of window.innerHeight for compatability with ie8. */\n\
        var viewPortHeight = document.documentElement.clientHeight,\n\
            top = this.offsetTop( el ),\n\
            scrollHeight = scrollElement.scrollTop + this.offsetTop( scrollElement ),\n\
            isHighEnough = false,\n\
            isLowEnough = false,\n\
            threshold = 0;\n\
\n\
        if ( this.threshold.unit === \"vh\" ) {\n\
            threshold = viewPortHeight * this.threshold.value / 100;\n\
        } else if ( this.threshold.unit === \"px\" ) {\n\
            threshold = this.threshold.value;\n\
        }\n\
\n\
        /** Check if element is above bottom of screen. */\n\
        isHighEnough = viewPortHeight + scrollHeight + threshold >= top;\n\
\n\
        /** Check if element is below top of screen. */\n\
        isLowEnough = ( el.height || 0 ) + top + threshold >= scrollHeight;\n\
\n\
        return isHighEnough && isLowEnough;\n\
    };\n\
\n\
    /**\n\
    * This method takes care of loading the media that should no longer be\n\
    * postponed.\n\
    * @param {object} el - The element that should be loaded.\n\
    * @returns {object} The element that was loaded.\n\
    */\n\
    Postpone.prototype.load = function( el ) {\n\
        var child = {},\n\
            i = 0;\n\
        el.removeAttribute( \"postpone\" );\n\
\n\
        /** If the element has a `data-src` attribute then copy it to `src`. */\n\
        if ( ~\"audio, embed, iframe, img, picture, video\".indexOf( el.tagName.toLowerCase() ) && el.getAttribute( \"data-src\" ) ) {\n\
            el.setAttribute( \"src\", el.getAttribute( \"data-src\" ) );\n\
        }\n\
\n\
        if ( ~\"image, tref, use\".indexOf( el.tagName.toLowerCase() )  && el.getAttribute( \"data-xlink:href\" ) ) {\n\
            el.setAttribute( \"xlink:href\", el.getAttribute( \"data-xlink:href\" ) );\n\
        }\n\
\n\
        else if ( ~\"audio, video\".indexOf( el.tagName.toLowerCase() ) && el.children.length ) {\n\
            for ( i = 0; i < el.children.length; i++ ) {\n\
                child = el.children[ i ];\n\
                if ( child.tagName.toLowerCase() === \"source\" && child.getAttribute( \"data-src\" ) ) {\n\
                    child.setAttribute( \"src\", child.getAttribute( \"data-src\" ) );\n\
                }\n\
            }\n\
        }\n\
\n\
        else if ( el.tagName.toLowerCase() === \"picture\" && el.children.length ) {\n\
            for ( i = 0; i < el.children.length; i++ ) {\n\
                child = el.children[ i ];\n\
                if ( child.tagName.toLowerCase() === \"source\" ) {\n\
                    if ( child.getAttribute( \"data-src\" ) ) {\n\
                        child.setAttribute( \"src\", child.getAttribute( \"data-src\" ) );\n\
                    }\n\
                    if ( child.getAttribute( \"data-srcset\" ) ) {\n\
                        child.setAttribute( \"srcset\", child.getAttribute( \"data-srcset\" ) );\n\
                    }\n\
                }\n\
            }\n\
        }\n\
\n\
        return el;\n\
    };\n\
\n\
    /**\n\
    * A helper method to convert array-like objects into arrays.\n\
    * @param {object} arr - The object to be converted.\n\
    * @returns {array} An array representation of the supplied object.\n\
    * @api private\n\
    */\n\
    Postpone.prototype._slice = function( object ) {\n\
        /** Try to use `slice` to convert the object. */\n\
        try {\n\
            return Array.prototype.slice.call( object );\n\
        /**\n\
         * If that doesn't work, manually iterate over the object and convert\n\
         * it to an array.\n\
         */\n\
        } finally {\n\
            var array = [];\n\
            for ( var i = 0; i < object.length; i++ ) {\n\
                array.push( object[ i ] );\n\
            }\n\
            return array;\n\
        }\n\
    };\n\
\n\
    /** Expose `Postpone`. */\n\
    return Postpone;\n\
}));\n\
\n\
//@ sourceURL=postpone/index.js"
));
require.alias("postpone/index.js", "postpone/index.js");