"use strict";

/** Expose `Postpone`. */
module.exports = Postpone;

/**
 * Creates a new Postpone instance.
 * @constructor
 * @param {number|string} [threshold] - The distance from an edge at which an
 * element should be considered to be at the edge.
 */
function Postpone( threshold ) {
    if ( !( this instanceof Postpone ) ) return new Postpone( threshold );

    /**
     * The init method for Postpone gets the object running. It runs
     * postpone.postpone() to attach scroll event handlers and check if any
     * elements are already visible. Then, init will start the watch process.
     * @returns this
     */
    this.init = function( threshold ) {
        /**
         * @property {string} tags - A list of all the tags for which postpone
         * will work;
         */
        this.tags = "audio, embed, iframe, img, image, picture, use, video, tref";
        /**
         * @property {array} elements - An array of all the postponed elements in the document.
         */
        this.elements = [];
        /**
        * @property {object} scrollElements - A variable to keep track of the
        * elements with respoect to which the postponed elements scroll.
        */
        this.scrollElements = [];
        this.setThreshold( threshold );
        this.postpone();

        /** Call method to start looking for postponed media. */
        return this.start();
    };

    return this.init( threshold );
}

/**
 * The main postpone method. This method iterates over all the elements with
 * a `postpone` attribute and links them to a scroll event so that they are not
 * loaded until they become visible.
 * @returns this
 */
Postpone.prototype.postpone = function() {
    var id = "";

    /**
     * Remove any previous event handlers so they can be reattached for new
     * postponed elements without duplicating old ones. This must be done
     * before updating the scroll elements so the references to the event
     * callbacks still exist.
     */
    for ( id in this.scrollElements ) {
        if ( id === "window" ) {
            window.removeEventListener( "scroll", this.scrollElements[ id ].callback );
        } else {
            this.scrollElements[ id ].element.removeEventListener( "scroll", this.scrollElements[ id ].callback );
        }
    }

    /**
     * Update the elements and scroll elements to properly load or postpone
     * them.
     */
    this.getElements();
    this.getScrollElements();

    /**
     * If any of the postponed elements should be visible to begin with,
     * load them.
     */
    for ( var id in this.scrollElements ) {
        for ( var i = 0, element = {}; i < this.scrollElements[ id ].length; i++ ) {
            element = this.scrollElements[ id ][ i ];
            if ( this.isInViewport( element, this.scrollElements[ id ].element ) ) {
                this.load( element );
            }
        }
    }

    if ( this.elements.length ) {
       /** Attach scroll event listeners. */
        for ( id in this.scrollElements ) {
            this.scrollElements[ id ].callback = this.scrollHandler.bind( this );
            if ( id === "window" ) {
                window.addEventListener( "scroll", this.scrollElements[ id ].callback );
            } else {
                this.scrollElements[ id ].element.addEventListener( "scroll", this.scrollElements[ id ].callback );
            }
        }
    }
    return this;
};

/**
 * A helper method to find all of the elements with a postponed attribute.
 * @returns {array} An array of nodes with a `truthy` postpone attribute.
 */
Postpone.prototype.getElements = function() {
    var elements = [],
        visible = [],
        matches = Array.prototype.slice.call( document.querySelectorAll( this.tags ) ),
        postpone = null;

    for ( var i = 0; i < matches.length; i++ ) {
        postpone = matches[ i ].getAttribute( "postpone" );
        if ( typeof postpone === "string" && postpone !== "false" ) {
            elements.push( matches[ i ] );
            if ( this.isVisible( matches[ i ] ) ) {
                visible.push( matches[ i ] );
            }
        }
    }
    this.elements = elements;
    /**
     * @property {array} visible - An array of all the non-hidden postponed
     * elements in the document.
     */
    this.elements.visible = visible;
};

/**
 * A helper method to find all of the elements with respect to which postponed
 * elements scroll. The elements are stored with a unique ID as a their key.
 * @returns {object} A hash with arrays of postponed elements associated with
 * IDs of their scroll elements.
 */
Postpone.prototype.getScrollElements = function() {
   this.scrollElements = {};

    var id = "",
        element = {},
        scrollElement = {};

    for ( var i = 0; i < this.elements.visible.length; i++ ) {
        element = this.elements.visible[ i ];
        /**
         * Find the element relative to which the postponed element's
         * position should be calculated.
         */
        if ( element.getAttribute( "data-scroll-element" ) ) {
            scrollElement = document.querySelector( element.getAttribute( "data-scroll-element" ) );
            /**
             * If the scroll element does not have an ID, generate one and
             * assign it as a data attribute.
             */
            id = scrollElement.getAttribute( "data-id" );
            if ( !id ) {
                scrollElement.setAttribute( "data-id", id = new Date().getTime() );
            }
        /**
         * If the element does not have a scroll element specified then
         * assume its position should be calculated relative to the window.
         */
        } else {
            scrollElement = "window";
            id = "window";
        }
        /**
         * If the array already has this id as a key, then add the current
         * element to the array in its value, otherwise create a new key.
         */
        if ( this.scrollElements[ id ] ) {
            this.scrollElements[ id ].push( element );
        } else {
            this.scrollElements[ id ] = [ element ];
            this.scrollElements[ id ].element = scrollElement;
        }
    }
    return this.scrollElements;
};

/**
 * A small helper that finds the posponed elements and returns them in a
 * string.
 * @param {array} elements - An array of elements to stringify.
 * @returns {string} A string containing all the HTML of postponed elements.
 */
Postpone.prototype.stringifyElements = function( elements ) {
    var elementsString = "";

    for ( var i = 0; i < elements.length; i++ ) {
        elementsString += elements[ i ].outerHTML;
    }

    return elementsString;
};

/**
 * Method to watch the document for new postponed elements.
 * @param {string} [elementsString] - A string of non-visually hidden
 * postponed elements.
 * @returns this
 */
Postpone.prototype.watch = function( elementsString ) {
    /** Refresh the array of postponed elements, this.elements. */
    this.getElements();
    var newElementsString = this.stringifyElements( this.elements.visible );
    /** If the postponed elements have changed, then postpone them. */
    if ( elementsString !== newElementsString ) {
        this.postpone();
    }
    /**
     * This timeout calls the watch method every 500ms. In other words,
     * postpone will look for new postponed elements twice a second.
     * @property {number} timeout - The ID for the current timeout.
     */
    this.timeout = window.setTimeout( (function( _this ) {
        return function() {
            return _this.watch( newElementsString );
        };
    })( this ), 500);

    return this;
};

/**
 * Method to start watching for elements that should postponed.
 * @returns this
 */
Postpone.prototype.start = function() {
    /** Ensure that watching has stopped before starting to watch. */
    if ( this.timeout ) this.stop();
    /** Start watching. */
    this.watch();

    return this;
};

/**
 * Method to stop watching for elements that should postponed.
 * @returns this
 */
Postpone.prototype.stop = function() {
    if ( this.timeout ) window.clearTimeout( this.timeout );

    return this;
};

/**
 * This method defines the scroll event handler used to test if postponed
 * elementes are visible.
 * @param {object} e - Event object.
 * @returns this
 */
Postpone.prototype.scrollHandler = function( e ) {
    var scrollElement = e.srcElement || e.target,
        elements = this.scrollElements[ scrollElement === window.document ? scrollElement = "window" : scrollElement.getAttribute( "data-id" ) ],
        element = {},
        scrolledIntoView = false;

    for ( var i = 0; i < elements.length; i++ ) {
        element = elements[ i ];

        /**
         * If an element is visible then we no longer need to postpone it
         * and can download it.
         */
        if ( this.isInViewport( element, scrollElement ) ) {
           this.load( element );
        }
    }

    return this;
};

/**
 * A convenience method to easily set the threshold property of postpone.
 * @param {number|string} threshold - The distance from an edge at which an
 * element should be considered to be at the edge.
 * @returns this
 */
Postpone.prototype.setThreshold = function( threshold ) {
    threshold = threshold ? threshold : 0;
    /**
     * @property {object} threshold - A hash containing the value and unit of
     * measurement of the desired postpone threshold.
     */
    this.threshold = {};
    /**
     * @property {number} value - The number of units from an edge at
     * which an element should be considered to be at the edge. This is
     * useful to start loading images or other resources before they scroll
     * into view to prevent flash of content.
     */
    this.threshold.value = parseInt( threshold, 10 );
    /**
     * @property {string} unit - The unit of measurement for the threshold
     * value. Currently, only `vh` and `px` are supported. By default, the unit
     * is `vh`.
     */
    this.threshold.unit = ( typeof threshold === "number" ) ? "vh" : ( threshold.match(/[a-zA-Z]+/)[ 0 ] || "vh" );

    return this;
};
 /**
 * Small helper method to find the total vertical offset of an element.
 * @param {object} el - The element we wish to locate.
 * @returns {number} The total vertical offset of the element.
 */
Postpone.prototype.offsetTop = function( el ) {
    var temp = el,
        o = 0;
    /** Iterate over all parents of el up to body to find the vertical offset. */
    while ( temp && temp.tagName.toLowerCase() !== "body" && temp.tagName.toLowerCase() !== "html" ) {
        o += temp.offsetTop;
        temp = temp.offsetParent;
    }

    return o;
};

/**
 * Small helper method to determine if an element is visually hidden or not.
 * This method check if the element provided, or any of its parents have the
 * style `display: none;`.
 * @param {object} el - The element we wish to locate.
 * @returns {boolean} Returns true if the element is visible and false if it is
 * hidden.
 */
Postpone.prototype.isVisible = function( el ) {
    var temp = el,
        isVisible = true;
    /**
     * Iterate over all parents of el up to HTML to find if el or a parent is
     * hidden.
     */
    while ( temp && temp.parentElement && isVisible ) {
        isVisible = temp.style.display !== "none";
        temp = temp.parentElement;
    }

    return isVisible;
};

/**
 * Helper method to determine if an element is in the browser's viewport.
 * @param {object} el - The element we wish to test.
 * @param {object} [scrollElement] - The element with respect to which `el` scrolls.
 * @returns {boolean} Return true if the `el` is in view and false if it is not.
 */
Postpone.prototype.isInViewport = function( el, scrollElement ) {
    /** If no scroll element is specified, then assume the scroll element is the window. */
    scrollElement = scrollElement? scrollElement : "window";

    if ( scrollElement === "window" ) {
        scrollElement = document.documentElement.scrollTop ? document.documentElement : document.body;
    }
    /** Use clientHeight instead of window.innerHeight for compatability with ie8. */
    var viewPortHeight = document.documentElement.clientHeight,
        top = this.offsetTop( el ),
        scrollHeight = scrollElement.scrollTop + this.offsetTop( scrollElement ),
        isHighEnough = false,
        isLowEnough = false,
        threshold = 0;

    if ( this.threshold.unit === "vh" ) {
        threshold = viewPortHeight * this.threshold.value / 100;
    } else if ( this.threshold.unit === "px" ) {
        threshold = this.threshold.value;
    }

    /** Check if element is above bottom of screen. */
    isHighEnough = viewPortHeight + scrollHeight + threshold >= top;

    /** Check if element is below top of screen. */
    isLowEnough = ( el.height || 0 ) + top + threshold >= scrollHeight;

    return isHighEnough && isLowEnough;
};

/**
 * This method takes care of loading the media that should no longer be
 * postponed.
 * @param {object} el - The element that should be loaded.
 * @returns {object} The element that was loaded.
 */
Postpone.prototype.load = function( el ) {
    var child = {},
        i = 0;
    el.removeAttribute( "postpone" );

    /** If the element has a `data-src` attribute then copy it to `src`. */
    if ( ~"audio, embed, iframe, img, picture, video".indexOf( el.tagName.toLowerCase() ) && el.getAttribute( "data-src" ) ) {
        el.setAttribute( "src", el.getAttribute( "data-src" ) );
    }

    if ( ~"image, tref, use".indexOf( el.tagName.toLowerCase() )  && el.getAttribute( "data-xlink:href" ) ) {
        el.setAttribute( "xlink:href", el.getAttribute( "data-xlink:href" ) );
    }

    else if ( ~"audio, video".indexOf( el.tagName.toLowerCase() ) && el.children.length ) {
        for ( i = 0; i < el.children.length; i++ ) {
            child = el.children[ i ];
            if ( child.tagName.toLowerCase() === "source" && child.getAttribute( "data-src" ) ) {
                child.setAttribute( "src", child.getAttribute( "data-src" ) );
            }
        }
    }

    else if ( el.tagName.toLowerCase() === "picture" && el.children.length ) {
        for ( i = 0; i < el.children.length; i++ ) {
            child = el.children[ i ];
            if ( child.tagName.toLowerCase() === "source" ) {
                if ( child.getAttribute( "data-src" ) ) {
                    child.setAttribute( "src", child.getAttribute( "data-src" ) );
                }
                if ( child.getAttribute( "data-srcset" ) ) {
                    child.setAttribute( "srcset", child.getAttribute( "data-srcset" ) );
                }
            }
        }
    }

    return el;
};

