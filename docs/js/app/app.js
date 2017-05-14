(function () {
'use strict';

var util = {

	stripSearch: function (str) {
		var start = str.indexOf( '?' );

		if ( start >= 0 ) {
			str = str.substring( 0, start );
		}
		return str;
	},

	isUrl: function ( str ) {
		if ( str.indexOf( "://" ) >= 0 ) {
			return true;
		}
	},

	prefixWithBase: function ( str, base ) {

		// Cannot prefix a url with the base value: http://moo will become refixhttp://moo
		if ( util.isUrl( str ) ) {
			return str;
		}

		var index = str.indexOf( base );
		if ( index === 0 ) {
			return str;
		}

		// Guard against double '/' when base ends with '/' and str starts with '/'
		if ( base[base.length - 1] === '/' && str[0] === '/' ) {
			str = str.slice( 1 );
		}

		str = base + str;
		return str;
	},

	stripBase: function ( str, base ) {
		if ( str.indexOf( base ) === 0 ) {
			str = str.substr( base.length );
		}

		if ( str === '' ) {
			// Don't return an empty str, return '/' which is generally mapped
			return '/';
		}
		return str;
	},

	getLocationAsRelativeUrl: function () {
		var relUrl = location.pathname + location.search + location.hash || '';
		return relUrl;
	},

	useDefaultRoute: function ( path ) {
		if ( path == null )
			{ return true; }

		if ( path.length == 1 ) {

			if ( path[0] == '/' || path[0] == '#' ) {
				return true;
			}
		}

		return false;
	},

	extend: function ( out ) {
		var arguments$1 = arguments;

		out = out || { };
		for ( var i = 1; i < arguments.length; i ++ ) {
			if ( ! arguments$1[i] )
				{ continue; }
			for ( var key in arguments[i] ) {
				if ( arguments$1[i].hasOwnProperty( key ) )
					{ out[key] = arguments$1[i][key]; }
			}
		}

		return out;
	}
};

var config = {
	base: '',

	useHash: false,

	hash: '#',
};

var pathHelper = {

	getGotoPath: function (href) {
		if ( config.useHash ) {
			return href;
		}
		
		href = pathHelper.stripSlashOrHashPrefix( href );
		return href;
	},

	getInitialPath: function () {
		var relUrl = config.useHash ? location.hash : util.getLocationAsRelativeUrl();
		var path = util.stripBase( relUrl, config.base );

		if ( config.defaultRoute && util.useDefaultRoute( path ) ) {
			path = config.defaultRoute || path;
		}

		if ( ! config.useHash ) {
			path = pathHelper.stripSlashOrHashPrefix( path );
		}

		return path;
	},

	stripSlashOrHashPrefix: function (str) {

		if ( str == null )
			{ return str; }
		str = str.trim( );
		if ( str[0] === '/' ) {
			str = str.slice( 1 );
		}

		if ( str.startsWith( config.hash ) ) {
			return str.slice( config.hash.length );
		}

		if ( str[0] === '#' ) {
			str = str.slice( 1 );
		}

		return str;
	},
	prefixWithHash: function (str) {
		if ( str.startsWith( config.hash ) ) {
			return str;
		}

		str = pathHelper.stripSlashOrHashPrefix( str );
		str = config.hash + str;
		return str;
	},
	prefixWithSlash: function prefixWithSlash( str ) {
// Cannot prefix a url with '/' else http://moo will become /http://moo
		if ( util.isUrl( str ) ) {
			return str;
		}

		if ( str[0] === '/' ) {
			return str;
		} else {
			str = pathHelper.stripSlashOrHashPrefix( str );
		}
		str = '/' + str;
		return str;
	}
};

var listener;

var watchHistory = {

	_ignoreHashChange: false,

	useOnHashChange: false,

	supportHistory:   !!(window.history && window.history.pushState),

	noop: function noop() {},

	start: function start( options ) {
		if ( options === void 0 ) options = {};


		watchHistory.useOnHashChange = watchHistory.shouldUseOnHashChange(options.useOnHashChange || false);
		watchHistory.listener = options.listener || watchHistory.noop;

		watchHistory.startListening();
	},

	startListening: function startListening() {

		if (watchHistory.useOnHashChange) {
			window.addEventListener( 'hashchange', watchHistory.hashchangeEventLisener, false );

		} else {
			window.addEventListener( 'popstate', watchHistory.popstateEventLisener, false );
		}
	},
	
	shouldUseOnHashChange: function shouldUseOnHashChange(value) {
		// Use override if present
		if (value) {
			return true;
		}

		 if (watchHistory.supportHistory) {
			 return false;
		 }
		 return true;
	},

	popstateEventLisener: function popstateEventLisener( e ) {
		if ( e.state == null ) { return; } // hashchange, or otherwise outside roadtrip's control

		//let url = location.pathname;
		var url = config.useHash ? location.hash : location.pathname;
		var options = {
			url: url,
			popEvent: e,
			popState: true // so we know not to update the url and create another history entry
		};
		listener(options);
	},

	hashchangeEventLisener: function hashchangeEventLisener( e ) {
		if (watchHistory._ignoreHashChange) {
			watchHistory._ignoreHashChange = false;
			return;
		}

		var url = location.hash;
		
		var options = {
			url: url,
			hashEvent: e,
			hashChange: true // so we know not to update the url and create another history entry
		};
		
		listener(options);
	},

	setListener: function setListener( callback ) {
		listener = callback;
	},
	
	setHash: function setHash(hash, replace) {
		if ( replace === void 0 ) replace = false;


		if (replace) {
			location.replace(hash);

		} else {
			// updating the hash will fire a hashchange event but we only want to respond to hashchange events when the history pops, not pushed
			watchHistory._ignoreHashChange = true;
			location.hash = hash;
		}
	}
};

var a = typeof document !== 'undefined' && document.createElement( 'a' );
var QUERYPAIR_REGEX = /^([\w\-]+)(?:=([^&]*))?$/;
var HANDLERS = [ 'beforeenter', 'enter', 'leave', 'update' ];

var isInitial = true;

function RouteData( ref ) {
	var route = ref.route;
	var pathname = ref.pathname;
	var params = ref.params;
	var query = ref.query;
	var hash = ref.hash;
	var scrollX = ref.scrollX;
	var scrollY = ref.scrollY;

	this.pathname = pathname;
	this.params = params;
	this.query = query;
	this.hash = hash;
	this.isInitial = isInitial;
	this.scrollX = scrollX;
	this.scrollY = scrollY;

	this._route = route;

	isInitial = false;
}

RouteData.prototype = {
	matches: function matches( href ) {
		return this._route.matches( href );
	}
};

function Route( path, options ) {
	var this$1 = this;

	path = pathHelper.stripSlashOrHashPrefix(path);	

	this.path = path;
	this.segments = path.split( '/' );

	if ( typeof options === 'function' ) {
		options = {
			enter: options
		};
	}

	this.updateable = typeof options.update === 'function';

	HANDLERS.forEach( function (handler) {
		this$1[ handler ] = function ( route, other, opts ) {
			var value;

			if ( options[ handler ] ) {
				value = options[ handler ]( route, other, opts );
			}

			return roadtrip.Promise.resolve( value );
		};
	} );
}

Route.prototype = {
	matches: function matches( href ) {
		a.href = pathHelper.prefixWithSlash(href); // This works for the options useHash: false + contextPath: true

		var pathname = a.pathname.slice( 1 );
		var segments = pathname.split( '/' );

		return segmentsMatch( segments, this.segments );
	},

	exec: function exec( target ) {
		var this$1 = this;

		a.href = target.href;

		var pathname = a.pathname;
		pathname = pathHelper.stripSlashOrHashPrefix(pathname);
		var search = a.search.slice( 1 );

		var segments = pathname.split( '/' );

		if ( segments.length !== this.segments.length ) {
			return false;
		}

		var params = { };

		for ( var i = 0; i < segments.length; i += 1 ) {
			var segment = segments[i];
			var toMatch = this$1.segments[i];

			if ( toMatch[0] === ':' ) {
				params[ toMatch.slice( 1 ) ] = segment;
			} else if ( segment !== toMatch ) {
				return false;
			}
		}

		var query = { };
		var queryPairs = search.split( '&' );

		for ( var i$1 = 0; i$1 < queryPairs.length; i$1 += 1 ) {
			var match = QUERYPAIR_REGEX.exec( queryPairs[i$1] );

			if ( match ) {
				var key = match[1];
				var value = decodeURIComponent( match[2] );

				if ( query.hasOwnProperty( key ) ) {
					if ( typeof query[ key ] !== 'object' ) {
						query[ key ] = [ query[ key ] ];
					}

					query[ key ].push( value );
				} else {
					query[ key ] = value;
				}
			}
		}

		return new RouteData( {
			route: this,
			pathname: pathname,
			params: params,
			query: query,
			hash: a.hash.slice( 1 ),
			scrollX: target.scrollX,
			scrollY: target.scrollY
		} );
	}
};

function segmentsMatch( a, b ) {
	if ( a.length !== b.length )
		{ return; }

	var i = a.length;
	while ( i -- ) {
		if ( ( a[i] !== b[i] ) && ( b[i][0] !== ':' ) ) {
			return false;
		}
	}

	return true;
}

//
//const skip = [ "isInitial", "_route", "pathname", "params", "query", "hash" ];
//
//RouteData.prototype.extend = function ( src ) {
//	for ( var nextKey in src ) {
//		if ( src.hasOwnProperty( nextKey ) ) {
//
//			if ( skip.indexOf( nextKey ) < 0 ) {
//				this[nextKey] = src[nextKey];
//			}
//		}
//	}
//	return this;
//};


RouteData.prototype.extend = function( target ) {
	var arguments$1 = arguments;

	var output = Object( target );

	for ( var i = 1; i < arguments.length; i++ ) {
		var src = arguments$1[i];
		if ( src === undefined || src === null )
			{ continue; }
		for ( var nextKey in src ) {
			if ( src.hasOwnProperty( nextKey ) ) {
				output[nextKey] = src[nextKey];
			}
		}
	}
	return output;
};

var window$1 = ( typeof window !== 'undefined' ? window : null );

var routes = [];

function watchLinks ( callback ) {
	window$1.addEventListener( 'click', handler, false );
	window$1.addEventListener( 'touchstart', handler, false );

	function handler ( event ) {
		if ( which( event ) !== 1 ) { return; }
		if ( event.metaKey || event.ctrlKey || event.shiftKey ) { return; }
		if ( event.defaultPrevented ) { return; }

		// ensure target is a link
		var el = event.target;
		while ( el && el.nodeName !== 'A' ) {
			el = el.parentNode;
		}

		if ( !el || el.nodeName !== 'A' ) { return; }

		// Ignore if tag has
		// 1. 'download' attribute
		// 2. rel='external' attribute
		if ( el.hasAttribute( 'download' ) || el.getAttribute( 'rel' ) === 'external' ) { return; }

		// ensure non-hash for the same path

		// Check for mailto: in the href
		if ( ~el.href.indexOf( 'mailto:' ) ) { return; }

		// check target
		if ( el.target ) { return; }

		// x-origin
		if ( !sameOrigin( el.href ) ) { return; }

		var path;

		if (config.useHash) {
			path = toHash(el);

		} else {
		path = el.getAttribute('href');
		
		// below is original code which builds up path from the a.href property. Above we instead simply use the <a href> attribute
		//path = el.pathname + el.search + ( el.hash || '' );
		}

		// strip leading '/[drive letter]:' on NW.js on Windows
		if ( typeof process !== 'undefined' && path.match( /^\/[a-zA-Z]:\// ) ) {
			path = path.replace( /^\/[a-zA-Z]:\//, '/' );
		}

		// same page
		//const orig = path;

		/*
		if ( config.base && orig === path ) {
			return;
		}*/

		path = util.stripBase(path, config.base);

		// no match? allow navigation
		var matchFound = routes.some( function (route) { return route.matches( path ); } );

		if ( matchFound ) {
			event.preventDefault();

			//path = util.prefixWithBase(path, config.base);
			callback( path );
		}

		return;
	}
}

function toHash(link) {
	var href = link.getAttribute('href');
	href = pathHelper.prefixWithHash(href);
	return href;
}

function which ( event ) {
	event = event || window$1.event;
	return event.which === null ? event.button : event.which;
}

function sameOrigin ( href ) {
	var origin = location.protocol + '//' + location.hostname;
	if ( location.port ) { origin += ':' + location.port; }

	return ( href && ( href.indexOf( origin ) === 0 ) );
}

function isSameRoute ( routeA, routeB, dataA, dataB ) {
	if ( routeA !== routeB ) {
		return false;
	}

	return (
		dataA.hash === dataB.hash &&
		deepEqual( dataA.params, dataB.params ) &&
		deepEqual( dataA.query, dataB.query )
	);
}

function deepEqual ( a, b ) {
	if ( a === null && b === null ) {
		return true;
	}

	if ( isArray( a ) && isArray( b ) ) {
		var i = a.length;

		if ( b.length !== i ) { return false; }

		while ( i-- ) {
			if ( !deepEqual( a[i], b[i] ) ) {
				return false;
			}
		}

		return true;
	}

	else if ( typeof a === 'object' && typeof b === 'object' ) {
		var aKeys = Object.keys( a );
		var bKeys = Object.keys( b );

		var i$1 = aKeys.length;

		if ( bKeys.length !== i$1 ) { return false; }

		while ( i$1-- ) {
			var key = aKeys[i$1];

			if ( !b.hasOwnProperty( key ) || !deepEqual( b[ key ], a[ key ] ) ) {
				return false;
			}
		}

		return true;
	}

	return a === b;
}

var toString = Object.prototype.toString;

function isArray ( thing ) {
	return toString.call( thing ) === '[object Array]';
}

// from https://developer.mozilla.org/en/docs/Web/API/WindowEventHandlers/onhashchange
if ( ! window.HashChangeEvent )
	{ ( function () {

		var lastURL = document.URL;

		window.addEventListener( "hashchange", function ( event ) {
			Object.defineProperty( event, "oldURL", { enumerable: true, configurable: true, value: lastURL } );
			Object.defineProperty( event, "newURL", { enumerable: true, configurable: true, value: document.URL } );

			lastURL = document.URL;
		} );
	}() ); }


if ( ! String.prototype.startsWith ) {
	String.prototype.startsWith = function ( searchString, position ) {
		position = position || 0;
		return this.substr( position, searchString.length ) === searchString;
	};
}

if ( ! String.prototype.endsWith ) {
	String.prototype.endsWith = function ( searchString, position ) {
		var subjectString = this.toString();
		if ( typeof position !== 'number' || ! isFinite( position ) || Math.floor( position ) !== position || position > subjectString.length ) {
			position = subjectString.length;
		}
		position -= searchString.length;
		var lastIndex = subjectString.lastIndexOf( searchString, position );
		return lastIndex !== - 1 && lastIndex === position;
	};
}

function noop () {}

var currentData = {};
var currentRoute = {
	enter: function () { return roadtrip.Promise.resolve(); },
	leave: function () { return roadtrip.Promise.resolve(); }
};

var _target;
var isTransitioning = false;

var scrollHistory = {};
var uniqueID = 1;
var currentID = uniqueID;

var roadtrip = {
	Promise: Promise,

	add: function add ( path, options ) {
		routes.push( new Route( path, options ) );
		return roadtrip;
	},

	start: function start ( options ) {
		if ( options === void 0 ) options = {};


		util.extend( config, options );
		
		watchHistory.start(config);
		watchHistory.setListener(historyListener);

		var path = pathHelper.getInitialPath();

		var matchFound = routes.some( function (route) { return route.matches( path ); } );
		var href = matchFound ?
			path :
			config.fallback;

			var internalOptions = {
				replaceState: true,
				scrollX: window$1.scrollX,
				scrollY: window$1.scrollY
			};
			var otherOptions = {};

		return roadtrip.goto( href, otherOptions, internalOptions);
	},

	goto: function goto ( href, otherOptions, internalOptions ) {
		if ( otherOptions === void 0 ) otherOptions = {};
		if ( internalOptions === void 0 ) internalOptions = {};

		if (href == null) { return roadtrip.Promise.resolve(); }

		href = pathHelper.getGotoPath(href);

		scrollHistory[ currentID ] = {
			x: window$1.scrollX,
			y: window$1.scrollY
		};

		var target;
		var promise = new roadtrip.Promise( function ( fulfil, reject ) {
			target = _target = {
				href: href,
				scrollX: internalOptions.scrollX || 0,
				scrollY: internalOptions.scrollY || 0,
				internalOptions: internalOptions,
				otherOptions: otherOptions,
				fulfil: fulfil,
				reject: reject
			};
		});
		
		promise._locked = false;
		if ( isTransitioning ) {
			promise._locked = true;
			return promise;
		}

		_goto( target );

		promise._sameRoute = target._sameRoute;
		return promise;
	},

	getCurrentRoute: function getCurrentRoute () {
		return currentData;
	}
};

if ( window$1 ) {
	watchLinks( function (href) {
		roadtrip.goto( href )

			.catch(function (e) {
				isTransitioning = false; 
			} );
	});
}

function getNewData(target) {
	var newData;
	var newRoute;

	for ( var i = 0; i < routes.length; i += 1 ) {
		var route = routes[i];
		newData = route.exec( target );

		if ( newData ) {
			newRoute = route;
			break;
		}
	}

	return {
		newRoute: newRoute,
		newData: newData
	};
}

function historyListener(options) {

		var url = util.stripBase(options.url, config.base);

	var otherOptions = {};
	var internalOptions = {};

		_target = {
			href: url,
			hashChange: options.hashChange, // so we know not to manipulate the history
			popState: options.popState, // so we know not to manipulate the history
			fulfil: noop,
			reject: noop,
			otherOptions: otherOptions,
			internalOptions: internalOptions
		};

		if(options.popEvent != null) {
			var scroll = scrollHistory[ options.popEvent.state.uid ] || {x: 0, y: 0};
			_target.scrollX = scroll.x;
			_target.scrollY = scroll.y;

		} else {
			_target.scrollX = 0;
			_target.scrollY = 0;
		}

		_goto( _target );

		if(options.popEvent != null) {
			currentID = options.popEvent.state.uid;
		}
}

function _goto ( target ) {
	var newRoute;
	var newData;
	var forceReloadRoute = target.otherOptions.forceReload || false;

	//let targetHref = util.stripBase(target.href, config.base);
	targetHref = pathHelper.prefixWithSlash(target.href);
	target.href = targetHref;

	var result = getNewData(target);

	if (!result.newData) {
		// If we cannot find data, it is because the requested url isn't mapped to a route. Use fallback to render page. Keep url pointing to requested url for 
		// debugging.
		var tempHref = target.href;
		target.href = config.fallback;
		result = getNewData(target);
		target.href = tempHref;
	}

	newData = result.newData;
	newRoute = result.newRoute;

	target._sameRoute = false;
	if ( !newRoute || (isSameRoute( newRoute, currentRoute, newData, currentData ) && !forceReloadRoute) ) {
		target.fulfil();
		target._sameRoute = true;
		return;
	}

	scrollHistory[ currentID ] = {
		x: ( currentData.scrollX = window$1.scrollX ),
		y: ( currentData.scrollY = window$1.scrollY )
	};

	isTransitioning = true;

	var promise;
	if ( !forceReloadRoute && ( newRoute === currentRoute ) && newRoute.updateable ) {

		// For updates, copy merge newData into currentData, in order to peserve custom data that was set during enter or beforeenter events
		newData = newData.extend({}, currentData, newData);

		promise = newRoute.update( newData, target.otherOptions );
	} else {
		promise = roadtrip.Promise.all([
			currentRoute.leave( currentData, newData, target.otherOptions ),
			newRoute.beforeenter( newData, currentData, target.otherOptions )
		]).then( function () { return newRoute.enter( newData, currentData, target.otherOptions ); } );
	}

	promise
		.then( function () {
			currentRoute = newRoute;
			currentData = newData;

			isTransitioning = false;

			// if the user navigated while the transition was taking
			// place, we need to do it all again
			if ( _target !== target ) {
				_goto( _target );

			} else {
				target.fulfil();
			}
		})
		.catch( function (e) {
			isTransitioning = false;
			target.reject(e);
		});

	if ( target.popState || target.hashChange ) { return; }

	var uid = target.internalOptions.replaceState ? currentID : ++uniqueID;

	var targetHref = target.href;

	if (watchHistory.useOnHashChange) {
		targetHref = pathHelper.prefixWithHash(targetHref);
		target.href = targetHref;
		watchHistory.setHash( targetHref, target.internalOptions.replaceState );

	} else {

		if (config.useHash) {
			targetHref = pathHelper.prefixWithHash(targetHref);
			target.href = targetHref;

		} else {
			targetHref = pathHelper.prefixWithSlash(targetHref);
			// Add base path for pushstate, as we are routing to an absolute path '/' eg. /base/page1
			targetHref = util.prefixWithBase(targetHref, config.base);
			target.href = targetHref;
		}

		window$1.history[ target.internalOptions.replaceState ? 'replaceState' : 'pushState' ]( { uid: uid }, '', target.href );
	}

	currentID = uid;
	scrollHistory[ currentID ] = {
		x: target.scrollX,
		y: target.scrollY
	};
}

/*!
 * EventEmitter v4.2.11 - git.io/ee
 * https://github.com/Olical/EventEmitter
 * Unlicense - http://unlicense.org/
 * Oliver Caldwell - http://oli.me.uk/
 * @preserve
 */

    function EventEmitter() {}
	

    // Shortcuts to improve speed and size
    var proto = EventEmitter.prototype;

    /**
     * Finds the index of the listener for the event in its storage array.
     *
     * @param {Function[]} listeners Array of listeners to search through.
     * @param {Function} listener Method to look for.
     * @return {Number} Index of the specified listener, -1 if not found
     * @api private
     */
    function indexOfListener(listeners, listener) {
        var i = listeners.length;
        while (i--) {
            if (listeners[i].listener === listener) {
                return i;
            }
        }

        return -1;
    }

    /**
     * Alias a method while keeping the context correct, to allow for overwriting of target method.
     *
     * @param {String} name The name of the target method.
     * @return {Function} The aliased method
     * @api private
     */
    function alias(name) {
        return function aliasClosure() {
            return this[name].apply(this, arguments);
        };
    }

    /**
     * Returns the listener array for the specified event.
     * Will initialise the event object and listener arrays if required.
     * Will return an object if you use a regex search. The object contains keys for each matched event. So /ba[rz]/ might return an object containing bar and baz. But only if you have either defined them with defineEvent or added some listeners to them.
     * Each property in the object response is an array of listener functions.
     *
     * @param {String|RegExp} evt Name of the event to return the listeners from.
     * @return {Function[]|Object} All listener functions for the event.
     */
    proto.getListeners = function getListeners(evt) {
        var events = this._getEvents();
        var response;
        var key;

        // Return a concatenated array of all matching events if
        // the selector is a regular expression.
        if (evt instanceof RegExp) {
            response = {};
            for (key in events) {
                if (events.hasOwnProperty(key) && evt.test(key)) {
                    response[key] = events[key];
                }
            }
        }
        else {
            response = events[evt] || (events[evt] = []);
        }

        return response;
    };

    /**
     * Takes a list of listener objects and flattens it into a list of listener functions.
     *
     * @param {Object[]} listeners Raw listener objects.
     * @return {Function[]} Just the listener functions.
     */
    proto.flattenListeners = function flattenListeners(listeners) {
        var flatListeners = [];
        var i;

        for (i = 0; i < listeners.length; i += 1) {
            flatListeners.push(listeners[i].listener);
        }

        return flatListeners;
    };

    /**
     * Fetches the requested listeners via getListeners but will always return the results inside an object. This is mainly for internal use but others may find it useful.
     *
     * @param {String|RegExp} evt Name of the event to return the listeners from.
     * @return {Object} All listener functions for an event in an object.
     */
    proto.getListenersAsObject = function getListenersAsObject(evt) {
        var listeners = this.getListeners(evt);
        var response;

        if (listeners instanceof Array) {
            response = {};
            response[evt] = listeners;
        }

        return response || listeners;
    };

    /**
     * Adds a listener function to the specified event.
     * The listener will not be added if it is a duplicate.
     * If the listener returns true then it will be removed after it is called.
     * If you pass a regular expression as the event name then the listener will be added to all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to attach the listener to.
     * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.addListener = function addListener(evt, listener) {
        var listeners = this.getListenersAsObject(evt);
        var listenerIsWrapped = typeof listener === 'object';
        var key;

        for (key in listeners) {
            if (listeners.hasOwnProperty(key) && indexOfListener(listeners[key], listener) === -1) {
                listeners[key].push(listenerIsWrapped ? listener : {
                    listener: listener,
                    once: false
                });
            }
        }

        return this;
    };

    /**
     * Alias of addListener
     */
    proto.on = alias('addListener');

    /**
     * Semi-alias of addListener. It will add a listener that will be
     * automatically removed after its first execution.
     *
     * @param {String|RegExp} evt Name of the event to attach the listener to.
     * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.addOnceListener = function addOnceListener(evt, listener) {
        return this.addListener(evt, {
            listener: listener,
            once: true
        });
    };

    /**
     * Alias of addOnceListener.
     */
    proto.once = alias('addOnceListener');

    /**
     * Defines an event name. This is required if you want to use a regex to add a listener to multiple events at once. If you don't do this then how do you expect it to know what event to add to? Should it just add to every possible match for a regex? No. That is scary and bad.
     * You need to tell it what event names should be matched by a regex.
     *
     * @param {String} evt Name of the event to create.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.defineEvent = function defineEvent(evt) {
        this.getListeners(evt);
        return this;
    };

    /**
     * Uses defineEvent to define multiple events.
     *
     * @param {String[]} evts An array of event names to define.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.defineEvents = function defineEvents(evts) {
        var this$1 = this;

        for (var i = 0; i < evts.length; i += 1) {
            this$1.defineEvent(evts[i]);
        }
        return this;
    };

    /**
     * Removes a listener function from the specified event.
     * When passed a regular expression as the event name, it will remove the listener from all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to remove the listener from.
     * @param {Function} listener Method to remove from the event.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeListener = function removeListener(evt, listener) {
		if (listener == null) {
			return this.removeEvent(evt);
		}
        var listeners = this.getListenersAsObject(evt);
        var index;
        var key;

        for (key in listeners) {
            if (listeners.hasOwnProperty(key)) {
                index = indexOfListener(listeners[key], listener);

                if (index !== -1) {
                    listeners[key].splice(index, 1);
                }
            }
        }

        return this;
    };

    /**
     * Alias of removeListener
     */
    proto.off = alias('removeListener');

    /**
     * Adds listeners in bulk using the manipulateListeners method.
     * If you pass an object as the second argument you can add to multiple events at once. The object should contain key value pairs of events and listeners or listener arrays. You can also pass it an event name and an array of listeners to be added.
     * You can also pass it a regular expression to add the array of listeners to all events that match it.
     * Yeah, this function does quite a bit. That's probably a bad thing.
     *
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add to multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to add.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.addListeners = function addListeners(evt, listeners) {
        // Pass through to manipulateListeners
        return this.manipulateListeners(false, evt, listeners);
    };

    /**
     * Removes listeners in bulk using the manipulateListeners method.
     * If you pass an object as the second argument you can remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
     * You can also pass it an event name and an array of listeners to be removed.
     * You can also pass it a regular expression to remove the listeners from all events that match it.
     *
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to remove from multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to remove.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeListeners = function removeListeners(evt, listeners) {
        // Pass through to manipulateListeners
        return this.manipulateListeners(true, evt, listeners);
    };

    /**
     * Edits listeners in bulk. The addListeners and removeListeners methods both use this to do their job. You should really use those instead, this is a little lower level.
     * The first argument will determine if the listeners are removed (true) or added (false).
     * If you pass an object as the second argument you can add/remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
     * You can also pass it an event name and an array of listeners to be added/removed.
     * You can also pass it a regular expression to manipulate the listeners of all events that match it.
     *
     * @param {Boolean} remove True if you want to remove listeners, false if you want to add.
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add/remove from multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to add/remove.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.manipulateListeners = function manipulateListeners(remove, evt, listeners) {
        var this$1 = this;

        var i;
        var value;
        var single = remove ? this.removeListener : this.addListener;
        var multiple = remove ? this.removeListeners : this.addListeners;

        // If evt is an object then pass each of its properties to this method
        if (typeof evt === 'object' && !(evt instanceof RegExp)) {
            for (i in evt) {
                if (evt.hasOwnProperty(i) && (value = evt[i])) {
                    // Pass the single listener straight through to the singular method
                    if (typeof value === 'function') {
                        single.call(this$1, i, value);
                    }
                    else {
                        // Otherwise pass back to the multiple function
                        multiple.call(this$1, i, value);
                    }
                }
            }
        }
        else {
            // So evt must be a string
            // And listeners must be an array of listeners
            // Loop over it and pass each one to the multiple method
            i = listeners.length;
            while (i--) {
                single.call(this$1, evt, listeners[i]);
            }
        }

        return this;
    };

    /**
     * Removes all listeners from a specified event.
     * If you do not specify an event then all listeners will be removed.
     * That means every event will be emptied.
     * You can also pass a regex to remove all events that match it.
     *
     * @param {String|RegExp} [evt] Optional name of the event to remove all listeners for. Will remove from every event if not passed.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeEvent = function removeEvent(evt) {
        var type = typeof evt;
        var events = this._getEvents();
        var key;

        // Remove different things depending on the state of evt
        if (type === 'string') {
            // Remove all listeners for the specified event
            delete events[evt];
        }
        else if (evt instanceof RegExp) {
            // Remove all events matching the regex.
            for (key in events) {
                if (events.hasOwnProperty(key) && evt.test(key)) {
                    delete events[key];
                }
            }
        }
        else {
            // Remove all listeners in all events
            delete this._events;
        }

        return this;
    };

    /**
     * Alias of removeEvent.
     *
     * Added to mirror the node API.
     */
    proto.removeAllListeners = alias('removeEvent');

    /**
     * Emits an event of your choice.
     * When emitted, every listener attached to that event will be executed.
     * If you pass the optional argument array then those arguments will be passed to every listener upon execution.
     * Because it uses `apply`, your array of arguments will be passed as if you wrote them out separately.
     * So they will not arrive within the array on the other side, they will be separate.
     * You can also pass a regular expression to emit to all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
     * @param {Array} [args] Optional array of arguments to be passed to each listener.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.emitEvent = function emitEvent(that, evt, args) {
        var this$1 = this;

		// NOTE: customized this method
        var listenersMap = this.getListenersAsObject(evt);
        var listeners;
        var listener;
        var i;
        var key;
        var response;

        for (key in listenersMap) {
            if (listenersMap.hasOwnProperty(key)) {
                listeners = listenersMap[key].slice(0);
                i = listeners.length;

                while (i--) {
                    // If the listener returns true then it shall be removed from the event
                    // The function is executed either with a basic call or an apply if there is an args array
                    listener = listeners[i];

                    if (listener.once === true) {
                        this$1.removeListener(evt, listener.listener);
                    }

                    response = listener.listener.apply(that, args || []);

                    if (response === this$1._getOnceReturnValue()) {
                        this$1.removeListener(evt, listener.listener);
                    }
                }
            }
        }

        return this;
    };

    /**
     * Alias of emitEvent
     */
    proto.trigger = alias('emitEvent');

    /**
     * Subtly different from emitEvent in that it will pass its arguments on to the listeners, as opposed to taking a single array of arguments to pass on.
     * As with emitEvent, you can pass a regex in place of the event name to emit to all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
     * @param {...*} Optional additional arguments to be passed to each listener.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.emit = function emit(that, evt) {
		// NOTE: customized this method
        var args = Array.prototype.slice.call(arguments, 2);
        return this.emitEvent(that, evt, args);
    };

    /**
     * Sets the current value to check against when executing listeners. If a
     * listeners return value matches the one set here then it will be removed
     * after execution. This value defaults to true.
     *
     * @param {*} value The new value to check for when executing listeners.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.setOnceReturnValue = function setOnceReturnValue(value) {
        this._onceReturnValue = value;
        return this;
    };

    /**
     * Fetches the current value to check against when executing listeners. If
     * the listeners return value matches this one then it should be removed
     * automatically. It will return true by default.
     *
     * @return {*|Boolean} The current value to check for or the default, true.
     * @api private
     */
    proto._getOnceReturnValue = function _getOnceReturnValue() {
        if (this.hasOwnProperty('_onceReturnValue')) {
            return this._onceReturnValue;
        }
        else {
            return true;
        }
    };

    /**
     * Fetches the events object and creates one if required.
     *
     * @return {Object} The events storage object.
     * @api private
     */
    proto._getEvents = function _getEvents() {
        return this._events || (this._events = {});
    };

    if (typeof module === 'object' && module.exports) {
        module.exports = EventEmitter;
    }

var eventer = new EventEmitter();

var journey$2;

var origEmit = eventer.emit;

eventer.emit = function ( that ) {
	if ( typeof that === 'string' ) {
		var args = Array.prototype.slice.call( arguments );
		args.unshift( journey$2 );
		return origEmit.apply( this, args );
	}
	origEmit.apply( this, arguments );
};


eventer.init = function ( arg ) {
	journey$2 = arg;

	journey$2.on = function ( event, listener ) {
		//eventer.on.call( journey, event, listener );
		eventer.on( event, listener );
	};
	
	journey$2.off = function ( event, listener ) {
		eventer.off( event, listener );
	};
	
journey$2.once = function ( event, listener ) {
		eventer.off( event, listener );
	};
	
	journey$2.emit = function () {
		eventer.emit.apply( eventer, arguments );
	};

	journey$2.emitEvent = function () {
		eventer.emitEvent.apply( eventer, arguments );
	};
};

var mode = {
	DEBUG: null
};

var rbracket = /\[\]$/;
var r20 = /%20/g;
var utils = {

	isFunction: function ( val ) {
		return typeof val === 'function';
	},

	fadeIn: function ( el ) {
		el.style.opacity = 0;
		var last = + new Date( );
		var tick = function ( ) {
			el.style.opacity = + el.style.opacity + ( new Date( ) - last ) / 400;
			last = + new Date( );
			if ( + el.style.opacity < 1 ) {
				( window.requestAnimationFrame && requestAnimationFrame( tick ) ) || setTimeout( tick, 16 );
			}
		};
		tick( );
	},

	fadeOut: function ( el ) {
		el.style.opacity = 0;
		var last = + new Date( );
		var tick = function ( ) {
			el.style.opacity = + el.style.opacity + ( new Date( ) - last ) / 400;
			last = + new Date( );
			if ( + el.style.opacity < 1 ) {
				( window.requestAnimationFrame && requestAnimationFrame( tick ) ) || setTimeout( tick, 16 );
			}
		};
		tick( );
	},

	// Serialize an array of form elements or a set of key/values into a query string
	param: function ( a, traditional ) {
		var prefix,
				s = [ ],
				add = function ( key, value ) {
					// If value is a function, invoke it and return its value
					value = ( typeof value === 'function' ) ? value( ) : ( value == null ? "" : value );
					s[ s.length ] = encodeURIComponent( key ) + "=" + encodeURIComponent( value );
				};
		// If an array was passed in, assume that it is an array of form elements.
		if ( Array.isArray( a ) ) {
			// Serialize the form elements
			a.forEach( function ( item, index ) {
				add( item.name, item.value );
			} );
		} else {
			// If traditional, encode the "old" way (the way 1.3.2 or older
			// did it), otherwise encode params recursively.
			for ( prefix in a ) {

				buildParams( prefix, a[ prefix ], traditional, add );
			}
		}

		// Return the resulting serialization
		return s.join( "&" ).replace( r20, "+" );
	},

	log: function ( ) {
		if ( mode.DEBUG ) {
			Function.apply.call( console.log, console, arguments );
		}
	},

	logWarn: function ( ) {
		if ( mode.DEBUG ) {
			Function.apply.call( console.info, console, arguments );
		}
	},

	logInfo: function ( ) {
		if ( mode.DEBUG ) {
			Function.apply.call( console.warn, console, arguments );
		}
	},

	logError: function ( ) {
		if ( mode.DEBUG ) {
			Function.apply.call( console.error, console, arguments );
		}
	}
};

function buildParams( prefix, obj, traditional, add ) {
	var name;
	if ( Array.isArray( obj ) ) {
		// Serialize array item.
		obj.forEach( function ( item, index ) {
			if ( traditional || rbracket.test( prefix ) ) {
				// Treat each array item as a scalar.
				add( prefix, item );
			} else {
				// Item is non-scalar (array or object), encode its numeric index.
				buildParams( prefix + "[" + ( typeof item === "object" ? index : "" ) + "]", item, traditional, add );
			}
		} );
	} else if ( ! traditional && type( obj ) === "object" ) {
		debugger;
		// Serialize object item.
		for ( name in obj ) {
			buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
		}

	} else {
		// Serialize scalar item.
		add( prefix, obj );
	}
}

function type( obj ) {
	return Object.prototype.toString.call( obj ).replace( /^\[object (.+)\]$/, "$1" ).toLowerCase( );
}

var events = {
	BEFORE_ENTER: "beforeenter",
	BEFORE_ENTER_COMPLETE: "beforeenterComplete",
	ENTER: "enter",	
	ENTERED: "entered",
	UPDATE: "update",
	UPDATED: "updated",
	LEAVE: "leave",
	LEFT: "left",
	ERROR: "error"
};

var callstack = [ ];

var resetRequest = false;

setupListeners();

var handler = {

	//init: ( options ) => {
	//},

	check: function () {
		if ( callstack.length > 1 ) {
			eventer.emit( "routeAbuseStart" );

			// After a short delay we check if the callstack is back to normal.
			// If at the end of the dely the callstack is normal, we emit "callstackNormal" event.
			// If the callstack overflows again during the delay, we cancel the reset request
			// and begin a new reset request after a delay.
			var delay = 2000;
			resetWhenNormal( delay );
		}
	},
	reset: function () {
		callstack = [ ];
		eventer.emit( "routeAbuseEnd" );
	},

	push: function () {
		callstack.push( 1 );
		handler.check();
	},

	pop: function () {
		callstack.splice( 0, 1 );
		if ( callstack.length === 0 ) {
		}
	}
};

function setupListeners() {

	eventer.on( "goto", function ( options ) {
		handler.push();
	} );


	eventer.on( "error", function ( options ) {
		handler.pop();
	} );

	eventer.on( "entered", function ( options ) {
		handler.pop();
	} );

	eventer.on( "updated", function ( options ) {
		handler.pop();
	} );
}

function resetWhenNormal( delay ) {
	if ( delay === void 0 ) delay = 2000;


	// if a request was already made to reenable animations, clear it and make a new request
	if ( resetRequest ) {
		clearTimeout( resetRequest );
	}

	// We wait a bit before restting callstack in case user is still thrashing UI.
	resetRequest = setTimeout( function ( ) {
		handler.reset( );
	}, delay );
}

var config$2 = {
	target: null,
	defaultRoute: null,
	debug: true

};

var location$1 = window && ( window.history.location || window.location );

var journey = {	};

eventer.init( journey );

journey.add = function add( path, options ) {
	
	if (path == null) {
		throw new Error("journey.add does not accept 'null' path");
	}
	
	if (options == null) {
		throw new Error("journey.add does not accept 'null' options");
	}
	
	options = util.extend( { }, options );
	wrap( options );

	roadtrip.add( path, options );

	return journey;
};

journey.start = function( options ) {

	util.extend( config$2, options );

	mode.DEBUG = config$2.debug;
	
	wrapRoadtripGoto();

	return roadtrip.start( options );
};

journey.goto = function ( href, otherOptions, internalOptions) {
	if ( otherOptions === void 0 ) otherOptions = {};
	if ( internalOptions === void 0 ) internalOptions = {};

	if (roadtrip._origGoto == null) {
		throw new Error("call start() before using journey");
	}
		var promise = roadtrip._origGoto( href, otherOptions, internalOptions );

	if (promise._sameRoute) {
		return promise;
	}

	journey.emit( journey, "goto", {href: location$1.href} );

	//routeAbuseMonitor.push();
	//callstack.check();

	return promise;
};

journey.getBase = function( ) {
	return roadtrip.base;
};

journey.getCurrentRoute = function( ) {
	return roadtrip.getCurrentRoute();
};

function raiseError( options ) {
	utils.logError( options.error );
	journey.emit( journey, "error", options );
}

function raiseEvent( event, args ) {
	var options = { };
	if ( event === events.UPDATE || event === events.UPDATED ) {
		options.route = args[0];
		options.other = args[1];

	} else if ( event === events.BEFORE_ENTER || event === events.BEFORE_ENTER_COMPLETE ) {
		options.to = args[0];
		options.from = args[1];
		options.other = args[2];

	} else if ( event === events.ENTER || event === events.ENTERED ) {
		options.to = args[0];
		options.from = args[1];
		options.other = args[2];

	} else if ( event === events.LEAVE || event === events.LEFT ) {
		options.from = args[0];
		options.to = args[1];
		options.other = args[2];
	}

	journey.emit( journey, event, options );
}

function wrap( options ) {
	enhanceEvent( events.ENTER, options );
	enhanceEvent( events.UPDATE, options );
	enhanceEvent( events.BEFORE_ENTER, options );
	enhanceEvent( events.LEAVE, options );
}

function enhanceEvent( name, options ) {
	var handler = options[name];

	if ( handler == null ) {
		return;
	}

	var wrapper = function ( ) {
		var that = this;
		//var thatArgs = arguments;

		// Handle errors thrown by handler: enter, leave, update or beforeenter
		try {
			// convert arguments into a proper array
			var args = Array.prototype.slice.call(arguments);
			
			var options;
			
			if (name === events.UPDATE) { // update only accepts one argument
				options = args[1];
				if (options == null) {
					options = args[1] = {};
				}

			} else {
				options = args[2];
				if (options == null) {
					options = args[2] = {};
				}
			}

			// Ensure default target is passed to events, but don't override if already present
			options.target = options.target || config$2.target;
			options.startOptions = options.startOptions || config$2;
			//args.push(options);

			raiseEvent( name, args );

			// Call handler
			var result = handler.apply( that, args );

			result = Promise.all( [ result ] ); // Ensure handler result can be handled as promise
			result.then( function () {

				if ( name === events.BEFORE_ENTER ) {
					raiseEvent( events.BEFORE_ENTER_COMPLETE, args );

				} else if ( name === events.ENTER ) {
					raiseEvent( events.ENTERED, args );

				} else if ( name === events.LEAVE ) {
					raiseEvent( events.LEFT, args );

				} else if ( name === events.UPDATE ) {
					raiseEvent( events.UPDATED, args );
				}
			} ).catch( function (err) {
				var options = gatherErrorOptions( name, args, err );
				raiseError( options );
			} );

			return result;

		} catch ( err ) {
			var options = gatherErrorOptions( name, args, err );
			raiseError( options );
			return Promise.reject( "error occurred in [" + name + "] - " + err.message ); // let others handle further up the stack
		}
	};

	options[name] = wrapper;
}

function gatherErrorOptions( event, args, err ) {
	//utils.log( "JA journey got this one: " + event );
	var route, from, to;

	if ( event === events.UPDATE ) {
		route = args[0];

	} else if ( event === events.BEFORE_ENTER || event === events.ENTER ) {
		route = args[0];
		to = args[0];
		from = args[1];
	} else {
		route = args[1];
		to = args[1];
		from = args[0];
	}
	var options = { error: err, event: event, from: from, to: to, route: route };
	return options;

}

function wrapRoadtripGoto() {
	// Ensure to only wrap goto once, in case journey.start is called more than once
	if (roadtrip._origGoto != null) { return; }

	roadtrip._origGoto = roadtrip.goto;
	roadtrip.goto = journey.goto;

	
}

/*
	Ractive.js v0.9.0-edge
	Build: unknown
	Date: Fri May 12 2017 23:15:19 GMT+0200 (South Africa Standard Time)
	Website: http://ractivejs.org
	License: MIT
*/
var defaults = {
	// render placement:
	el:                     void 0,
	append:                 false,
	delegate:               true,

	// template:
	template:               null,

	// parse:
	delimiters:             [ '{{', '}}' ],
	tripleDelimiters:       [ '{{{', '}}}' ],
	staticDelimiters:       [ '[[', ']]' ],
	staticTripleDelimiters: [ '[[[', ']]]' ],
	csp:                    true,
	interpolate:            false,
	preserveWhitespace:     false,
	sanitize:               false,
	stripComments:          true,
	contextLines:           0,
	parserTransforms:       [],

	// data & binding:
	data:                   {},
	computed:               {},
	syncComputedChildren:   false,
	resolveInstanceMembers: true,
	warnAboutAmbiguity:     false,
	adapt:                  [],
	isolated:               true,
	twoway:                 true,
	lazy:                   false,

	// transitions:
	noIntro:                false,
	noOutro:                false,
	transitionsEnabled:     true,
	complete:               void 0,
	nestedTransitions:      true,

	// css:
	css:                    null,
	noCssTransform:         false
};

// These are a subset of the easing equations found at
// https://raw.github.com/danro/easing-js - license info
// follows:

// --------------------------------------------------
// easing.js v0.5.4
// Generic set of easing functions with AMD support
// https://github.com/danro/easing-js
// This code may be freely distributed under the MIT license
// http://danro.mit-license.org/
// --------------------------------------------------
// All functions adapted from Thomas Fuchs & Jeremy Kahn
// Easing Equations (c) 2003 Robert Penner, BSD license
// https://raw.github.com/danro/easing-js/master/LICENSE
// --------------------------------------------------

// In that library, the functions named easeIn, easeOut, and
// easeInOut below are named easeInCubic, easeOutCubic, and
// (you guessed it) easeInOutCubic.
//
// You can add additional easing functions to this list, and they
// will be globally available.


var easing = {
	linear: function linear ( pos ) { return pos; },
	easeIn: function easeIn ( pos ) { return Math.pow( pos, 3 ); },
	easeOut: function easeOut ( pos ) { return ( Math.pow( ( pos - 1 ), 3 ) + 1 ); },
	easeInOut: function easeInOut ( pos ) {
		if ( ( pos /= 0.5 ) < 1 ) { return ( 0.5 * Math.pow( pos, 3 ) ); }
		return ( 0.5 * ( Math.pow( ( pos - 2 ), 3 ) + 2 ) );
	}
};

var toString$1 = Object.prototype.toString;


function isEqual ( a, b ) {
	if ( a === null && b === null ) {
		return true;
	}

	if ( typeof a === 'object' || typeof b === 'object' ) {
		return false;
	}

	return a === b;
}

// http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
function isNumeric ( thing ) {
	return !isNaN( parseFloat( thing ) ) && isFinite( thing );
}

function isObject ( thing ) {
	return ( thing && toString$1.call( thing ) === '[object Object]' );
}

function isObjectLike ( thing ) {
	if ( !thing ) { return false; }
	var type = typeof thing;
	if ( type === 'object' || type === 'function' ) { return true; }
}

/* eslint no-console:"off" */
var win = typeof window !== 'undefined' ? window : null;
var doc = win ? document : null;
var isClient = !!doc;
var hasConsole = ( typeof console !== 'undefined' && typeof console.warn === 'function' && typeof console.warn.apply === 'function' );

var svg = doc ?
	doc.implementation.hasFeature( 'http://www.w3.org/TR/SVG11/feature#BasicStructure', '1.1' ) :
	false;

var vendors = [ 'o', 'ms', 'moz', 'webkit' ];

var noop$1 = function () {};

/* global console */
/* eslint no-console:"off" */

var alreadyWarned = {};
var log;
var printWarning;
var welcome;

if ( hasConsole ) {
	var welcomeIntro = [
		"%cRactive.js %c0.9.0-edge %cin debug mode, %cmore...",
		'color: rgb(114, 157, 52); font-weight: normal;',
		'color: rgb(85, 85, 85); font-weight: normal;',
		'color: rgb(85, 85, 85); font-weight: normal;',
		'color: rgb(82, 140, 224); font-weight: normal; text-decoration: underline;'
	];
	var welcomeMessage = "You're running Ractive 0.9.0-edge in debug mode - messages will be printed to the console to help you fix problems and optimise your application.\n\nTo disable debug mode, add this line at the start of your app:\n  Ractive.DEBUG = false;\n\nTo disable debug mode when your app is minified, add this snippet:\n  Ractive.DEBUG = /unminified/.test(function(){/*unminified*/});\n\nGet help and support:\n  http://docs.ractivejs.org\n  http://stackoverflow.com/questions/tagged/ractivejs\n  http://groups.google.com/forum/#!forum/ractive-js\n  http://twitter.com/ractivejs\n\nFound a bug? Raise an issue:\n  https://github.com/ractivejs/ractive/issues\n\n";

	welcome = function () {
		if ( Ractive.WELCOME_MESSAGE === false ) {
			welcome = noop$1;
			return;
		}
		var message = 'WELCOME_MESSAGE' in Ractive ? Ractive.WELCOME_MESSAGE : welcomeMessage;
		var hasGroup = !!console.groupCollapsed;
		if ( hasGroup ) { console.groupCollapsed.apply( console, welcomeIntro ); }
		console.log( message );
		if ( hasGroup ) {
			console.groupEnd( welcomeIntro );
		}

		welcome = noop$1;
	};

	printWarning = function ( message, args ) {
		welcome();

		// extract information about the instance this message pertains to, if applicable
		if ( typeof args[ args.length - 1 ] === 'object' ) {
			var options = args.pop();
			var ractive = options ? options.ractive : null;

			if ( ractive ) {
				// if this is an instance of a component that we know the name of, add
				// it to the message
				var name;
				if ( ractive.component && ( name = ractive.component.name ) ) {
					message = "<" + name + "> " + message;
				}

				var node;
				if ( node = ( options.node || ( ractive.fragment && ractive.fragment.rendered && ractive.find( '*' ) ) ) ) {
					args.push( node );
				}
			}
		}

		console.warn.apply( console, [ '%cRactive.js: %c' + message, 'color: rgb(114, 157, 52);', 'color: rgb(85, 85, 85);' ].concat( args ) );
	};

	log = function () {
		console.log.apply( console, arguments );
	};
} else {
	printWarning = log = welcome = noop$1;
}

function format ( message, args ) {
	return message.replace( /%s/g, function () { return args.shift(); } );
}

function fatal ( message ) {
	var arguments$1 = arguments;

	var args = [], len = arguments.length - 1;
	while ( len-- > 0 ) { args[ len ] = arguments$1[ len + 1 ]; }

	message = format( message, args );
	throw new Error( message );
}

function logIfDebug () {
	if ( Ractive.DEBUG ) {
		log.apply( null, arguments );
	}
}

function warn ( message ) {
	var arguments$1 = arguments;

	var args = [], len = arguments.length - 1;
	while ( len-- > 0 ) { args[ len ] = arguments$1[ len + 1 ]; }

	message = format( message, args );
	printWarning( message, args );
}

function warnOnce ( message ) {
	var arguments$1 = arguments;

	var args = [], len = arguments.length - 1;
	while ( len-- > 0 ) { args[ len ] = arguments$1[ len + 1 ]; }

	message = format( message, args );

	if ( alreadyWarned[ message ] ) {
		return;
	}

	alreadyWarned[ message ] = true;
	printWarning( message, args );
}

function warnIfDebug () {
	if ( Ractive.DEBUG ) {
		warn.apply( null, arguments );
	}
}

function warnOnceIfDebug () {
	if ( Ractive.DEBUG ) {
		warnOnce.apply( null, arguments );
	}
}

// Error messages that are used (or could be) in multiple places
var badArguments = 'Bad arguments';
var noRegistryFunctionReturn = 'A function was specified for "%s" %s, but no %s was returned';
var missingPlugin = function ( name, type ) { return ("Missing \"" + name + "\" " + type + " plugin. You may need to download a plugin via http://docs.ractivejs.org/latest/plugins#" + type + "s"); };

function findInViewHierarchy ( registryName, ractive, name ) {
	var instance = findInstance( registryName, ractive, name );
	return instance ? instance[ registryName ][ name ] : null;
}

function findInstance ( registryName, ractive, name ) {
	while ( ractive ) {
		if ( name in ractive[ registryName ] ) {
			return ractive;
		}

		if ( ractive.isolated ) {
			return null;
		}

		ractive = ractive.parent;
	}
}

function interpolate ( from, to, ractive, type ) {
	if ( from === to ) { return null; }

	if ( type ) {
		var interpol = findInViewHierarchy( 'interpolators', ractive, type );
		if ( interpol ) { return interpol( from, to ) || null; }

		fatal( missingPlugin( type, 'interpolator' ) );
	}

	return interpolators.number( from, to ) ||
	       interpolators.array( from, to ) ||
	       interpolators.object( from, to ) ||
	       null;
}

function snap ( to ) {
	return function () { return to; };
}

var interpolators = {
	number: function number ( from, to ) {
		if ( !isNumeric( from ) || !isNumeric( to ) ) {
			return null;
		}

		from = +from;
		to = +to;

		var delta = to - from;

		if ( !delta ) {
			return function () { return from; };
		}

		return function ( t ) {
			return from + ( t * delta );
		};
	},

	array: function array ( from, to ) {
		var len, i;

		if ( !Array.isArray( from ) || !Array.isArray( to ) ) {
			return null;
		}

		var intermediate = [];
		var interpolators = [];

		i = len = Math.min( from.length, to.length );
		while ( i-- ) {
			interpolators[i] = interpolate( from[i], to[i] );
		}

		// surplus values - don't interpolate, but don't exclude them either
		for ( i=len; i<from.length; i+=1 ) {
			intermediate[i] = from[i];
		}

		for ( i=len; i<to.length; i+=1 ) {
			intermediate[i] = to[i];
		}

		return function ( t ) {
			var i = len;

			while ( i-- ) {
				intermediate[i] = interpolators[i]( t );
			}

			return intermediate;
		};
	},

	object: function object ( from, to ) {
		if ( !isObject( from ) || !isObject( to ) ) {
			return null;
		}

		var properties = [];
		var intermediate = {};
		var interpolators = {};

		for ( var prop in from ) {
			if ( from.hasOwnProperty( prop ) ) {
				if ( to.hasOwnProperty( prop ) ) {
					properties.push( prop );
					interpolators[ prop ] = interpolate( from[ prop ], to[ prop ] ) || snap( to[ prop ] );
				}

				else {
					intermediate[ prop ] = from[ prop ];
				}
			}
		}

		for ( var prop$1 in to ) {
			if ( to.hasOwnProperty( prop$1 ) && !from.hasOwnProperty( prop$1 ) ) {
				intermediate[ prop$1 ] = to[ prop$1 ];
			}
		}

		var len = properties.length;

		return function ( t ) {
			var i = len;

			while ( i-- ) {
				var prop = properties[i];

				intermediate[ prop ] = interpolators[ prop ]( t );
			}

			return intermediate;
		};
	}
};

function addToArray ( array, value ) {
	var index = array.indexOf( value );

	if ( index === -1 ) {
		array.push( value );
	}
}

function arrayContains ( array, value ) {
	for ( var i = 0, c = array.length; i < c; i++ ) {
		if ( array[i] == value ) {
			return true;
		}
	}

	return false;
}

function arrayContentsMatch ( a, b ) {
	var i;

	if ( !Array.isArray( a ) || !Array.isArray( b ) ) {
		return false;
	}

	if ( a.length !== b.length ) {
		return false;
	}

	i = a.length;
	while ( i-- ) {
		if ( a[i] !== b[i] ) {
			return false;
		}
	}

	return true;
}

function ensureArray ( x ) {
	if ( typeof x === 'string' ) {
		return [ x ];
	}

	if ( x === undefined ) {
		return [];
	}

	return x;
}

function lastItem ( array ) {
	return array[ array.length - 1 ];
}

function removeFromArray ( array, member ) {
	if ( !array ) {
		return;
	}

	var index = array.indexOf( member );

	if ( index !== -1 ) {
		array.splice( index, 1 );
	}
}

function combine () {
	var arguments$1 = arguments;

	var arrays = [], len = arguments.length;
	while ( len-- ) { arrays[ len ] = arguments$1[ len ]; }

	var res = arrays.concat.apply( [], arrays );
	var i = res.length;
	while ( i-- ) {
		var idx = res.indexOf( res[i] );
		if ( ~idx && idx < i ) { res.splice( i, 1 ); }
	}

	return res;
}

function toArray ( arrayLike ) {
	var array = [];
	var i = arrayLike.length;
	while ( i-- ) {
		array[i] = arrayLike[i];
	}

	return array;
}

function findMap ( array, fn ) {
	var len = array.length;
	for ( var i = 0; i < len; i++ ) {
		var result = fn( array[i] );
		if ( result ) { return result; }
	}
}

var TransitionManager = function TransitionManager ( callback, parent ) {
	this.callback = callback;
	this.parent = parent;

	this.intros = [];
	this.outros = [];

	this.children = [];
	this.totalChildren = this.outroChildren = 0;

	this.detachQueue = [];
	this.outrosComplete = false;

	if ( parent ) {
		parent.addChild( this );
	}
};

TransitionManager.prototype.add = function add ( transition ) {
	var list = transition.isIntro ? this.intros : this.outros;
	transition.starting = true;
	list.push( transition );
};

TransitionManager.prototype.addChild = function addChild ( child ) {
	this.children.push( child );

	this.totalChildren += 1;
	this.outroChildren += 1;
};

TransitionManager.prototype.decrementOutros = function decrementOutros () {
	this.outroChildren -= 1;
	check( this );
};

TransitionManager.prototype.decrementTotal = function decrementTotal () {
	this.totalChildren -= 1;
	check( this );
};

TransitionManager.prototype.detachNodes = function detachNodes () {
	this.detachQueue.forEach( detach );
	this.children.forEach( _detachNodes );
	this.detachQueue = [];
};

TransitionManager.prototype.ready = function ready () {
	if ( this.detachQueue.length ) { detachImmediate( this ); }
};

TransitionManager.prototype.remove = function remove ( transition ) {
	var list = transition.isIntro ? this.intros : this.outros;
	removeFromArray( list, transition );
	check( this );
};

TransitionManager.prototype.start = function start () {
	this.children.forEach( function (c) { return c.start(); } );
	this.intros.concat( this.outros ).forEach( function (t) { return t.start(); } );
	this.ready = true;
	check( this );
};

function detach ( element ) {
	element.detach();
}

function _detachNodes ( tm ) { // _ to avoid transpiler quirk
	tm.detachNodes();
}

function check ( tm ) {
	if ( !tm.ready || tm.outros.length || tm.outroChildren ) { return; }

	// If all outros are complete, and we haven't already done this,
	// we notify the parent if there is one, otherwise
	// start detaching nodes
	if ( !tm.outrosComplete ) {
		tm.outrosComplete = true;

		if ( tm.parent && !tm.parent.outrosComplete ) {
			tm.parent.decrementOutros( tm );
		} else {
			tm.detachNodes();
		}
	}

	// Once everything is done, we can notify parent transition
	// manager and call the callback
	if ( !tm.intros.length && !tm.totalChildren ) {
		if ( typeof tm.callback === 'function' ) {
			tm.callback();
		}

		if ( tm.parent && !tm.notifiedTotal ) {
			tm.notifiedTotal = true;
			tm.parent.decrementTotal();
		}
	}
}

// check through the detach queue to see if a node is up or downstream from a
// transition and if not, go ahead and detach it
function detachImmediate ( manager ) {
	var queue = manager.detachQueue;
	var outros = collectAllOutros( manager );

	var i = queue.length;
	var j = 0;
	var node, trans;
	start: while ( i-- ) {
		node = queue[i].node;
		j = outros.length;
		while ( j-- ) {
			trans = outros[j].element.node;
			// check to see if the node is, contains, or is contained by the transitioning node
			if ( trans === node || trans.contains( node ) || node.contains( trans ) ) { continue start; }
		}

		// no match, we can drop it
		queue[i].detach();
		queue.splice( i, 1 );
	}
}

function collectAllOutros ( manager, _list ) {
	var list = _list;

	// if there's no list, we're starting at the root to build one
	if ( !list ) {
		list = [];
		var parent = manager;
		while ( parent.parent ) { parent = parent.parent; }
		return collectAllOutros( parent, list );
	} else {
		// grab all outros from child managers
		var i = manager.children.length;
		while ( i-- ) {
			list = collectAllOutros( manager.children[i], list );
		}

		// grab any from this manager if there are any
		if ( manager.outros.length ) { list = list.concat( manager.outros ); }

		return list;
	}
}

var batch;

var runloop = {
	start: function start ( instance ) {
		var fulfilPromise;
		var promise = new Promise( function (f) { return ( fulfilPromise = f ); } );

		batch = {
			previousBatch: batch,
			transitionManager: new TransitionManager( fulfilPromise, batch && batch.transitionManager ),
			fragments: [],
			tasks: [],
			immediateObservers: [],
			deferredObservers: [],
			instance: instance,
			promise: promise
		};

		return promise;
	},

	end: function end () {
		flushChanges();

		if ( !batch.previousBatch ) { batch.transitionManager.start(); }

		batch = batch.previousBatch;
	},

	addFragment: function addFragment ( fragment ) {
		addToArray( batch.fragments, fragment );
	},

	// TODO: come up with a better way to handle fragments that trigger their own update
	addFragmentToRoot: function addFragmentToRoot ( fragment ) {
		if ( !batch ) { return; }

		var b = batch;
		while ( b.previousBatch ) {
			b = b.previousBatch;
		}

		addToArray( b.fragments, fragment );
	},

	addObserver: function addObserver ( observer, defer ) {
		addToArray( defer ? batch.deferredObservers : batch.immediateObservers, observer );
	},

	registerTransition: function registerTransition ( transition ) {
		transition._manager = batch.transitionManager;
		batch.transitionManager.add( transition );
	},

	// synchronise node detachments with transition ends
	detachWhenReady: function detachWhenReady ( thing ) {
		batch.transitionManager.detachQueue.push( thing );
	},

	scheduleTask: function scheduleTask ( task, postRender ) {
		var _batch;

		if ( !batch ) {
			task();
		} else {
			_batch = batch;
			while ( postRender && _batch.previousBatch ) {
				// this can't happen until the DOM has been fully updated
				// otherwise in some situations (with components inside elements)
				// transitions and decorators will initialise prematurely
				_batch = _batch.previousBatch;
			}

			_batch.tasks.push( task );
		}
	},

	promise: function promise () {
		if ( !batch ) { return Promise.resolve(); }

		var target = batch;
		while ( target.previousBatch ) {
			target = target.previousBatch;
		}

		return target.promise || Promise.resolve();
	}
};

function dispatch ( observer ) {
	observer.dispatch();
}

function flushChanges () {
	var which = batch.immediateObservers;
	batch.immediateObservers = [];
	which.forEach( dispatch );

	// Now that changes have been fully propagated, we can update the DOM
	// and complete other tasks
	var i = batch.fragments.length;
	var fragment;

	which = batch.fragments;
	batch.fragments = [];

	while ( i-- ) {
		fragment = which[i];
		fragment.update();
	}

	batch.transitionManager.ready();

	which = batch.deferredObservers;
	batch.deferredObservers = [];
	which.forEach( dispatch );

	var tasks = batch.tasks;
	batch.tasks = [];

	for ( i = 0; i < tasks.length; i += 1 ) {
		tasks[i]();
	}

	// If updating the view caused some model blowback - e.g. a triple
	// containing <option> elements caused the binding on the <select>
	// to update - then we start over
	if ( batch.fragments.length || batch.immediateObservers.length || batch.deferredObservers.length || batch.tasks.length ) { return flushChanges(); }
}

var refPattern = /\[\s*(\*|[0-9]|[1-9][0-9]+)\s*\]/g;
var splitPattern = /([^\\](?:\\\\)*)\./;
var escapeKeyPattern = /\\|\./g;
var unescapeKeyPattern = /((?:\\)+)\1|\\(\.)/g;

function escapeKey ( key ) {
	if ( typeof key === 'string' ) {
		return key.replace( escapeKeyPattern, '\\$&' );
	}

	return key;
}

function normalise ( ref ) {
	return ref ? ref.replace( refPattern, '.$1' ) : '';
}

function splitKeypath ( keypath ) {
	var result = [];
	var match;

	keypath = normalise( keypath );

	while ( match = splitPattern.exec( keypath ) ) {
		var index = match.index + match[1].length;
		result.push( keypath.substr( 0, index ) );
		keypath = keypath.substr( index + 1 );
	}

	result.push( keypath );

	return result;
}

function unescapeKey ( key ) {
	if ( typeof key === 'string' ) {
		return key.replace( unescapeKeyPattern, '$1$2' );
	}

	return key;
}

var keep = false;

function set ( ractive, pairs, options ) {
	var k = keep;

	var deep = options && options.deep;
	var shuffle = options && options.shuffle;
	var promise = runloop.start( ractive, true );
	if ( options && 'keep' in options ) { keep = options.keep; }

	var i = pairs.length;
	while ( i-- ) {
		var model = pairs[i][0];
		var value = pairs[i][1];
		var keypath = pairs[i][2];

		if ( !model ) {
			runloop.end();
			throw new Error( ("Failed to set invalid keypath '" + keypath + "'") );
		}

		if ( deep ) { deepSet( model, value ); }
		else if ( shuffle ) {
			var array = value;
			var target = model.get();
			// shuffle target array with itself
			if ( !array ) { array = target; }

			if ( !Array.isArray( target ) || !Array.isArray( array ) ) {
				throw new Error( 'You cannot merge an array with a non-array' );
			}

			var comparator = getComparator( shuffle );
			model.merge( array, comparator );
		} else { model.set( value ); }
	}

	runloop.end();

	keep = k;

	return promise;
}

var star = /\*/;
function gather ( ractive, keypath, base ) {
	if ( !base && keypath[0] === '.' ) {
		warnIfDebug( "Attempted to set a relative keypath from a non-relative context. You can use a getNodeInfo or event object to set relative keypaths." );
		return [];
	}

	var model = base || ractive.viewmodel;
	if ( star.test( keypath ) ) {
		return model.findMatches( splitKeypath( keypath ) );
	} else {
		return [ model.joinAll( splitKeypath( keypath ) ) ];
	}
}

function build ( ractive, keypath, value ) {
	var sets = [];

	// set multiple keypaths in one go
	if ( isObject( keypath ) ) {
		var loop = function ( k ) {
			if ( keypath.hasOwnProperty( k ) ) {
				sets.push.apply( sets, gather( ractive, k ).map( function (m) { return [ m, keypath[k], k ]; } ) );
			}
		};

		for ( var k in keypath ) { loop( k ); }

	}
	// set a single keypath
	else {
		sets.push.apply( sets, gather( ractive, keypath ).map( function (m) { return [ m, value, keypath ]; } ) );
	}

	return sets;
}

var deepOpts = { virtual: false };
function deepSet( model, value ) {
	var dest = model.get( false, deepOpts );

	// if dest doesn't exist, just set it
	if ( dest == null || typeof value !== 'object' ) { return model.set( value ); }
	if ( typeof dest !== 'object' ) { return model.set( value ); }

	for ( var k in value ) {
		if ( value.hasOwnProperty( k ) ) {
			deepSet( model.joinKey( k ), value[k] );
		}
	}
}

var comparators = {};
function getComparator ( option ) {
	if ( option === true ) { return null; } // use existing arrays
	if ( typeof option === 'function' ) { return option; }

	if ( typeof option === 'string' ) {
		return comparators[ option ] || ( comparators[ option ] = function (thing) { return thing[ option ]; } );
	}

	throw new Error( 'If supplied, options.compare must be a string, function, or true' ); // TODO link to docs
}

var errorMessage = 'Cannot add to a non-numeric value';

function add ( ractive, keypath, d ) {
	if ( typeof keypath !== 'string' || !isNumeric( d ) ) {
		throw new Error( 'Bad arguments' );
	}

	var sets = build( ractive, keypath, d );

	return set( ractive, sets.map( function (pair) {
		var model = pair[0];
		var add = pair[1];
		var value = model.get();
		if ( !isNumeric( add ) || !isNumeric( value ) ) { throw new Error( errorMessage ); }
		return [ model, value + add ];
	}));
}

function Ractive$add ( keypath, d, options ) {
	var num = typeof d === 'number' ? d : 1;
	var opts = typeof d === 'object' ? d : options;
	return add( this, keypath, num, opts );
}

var noAnimation = Promise.resolve();
Object.defineProperty( noAnimation, 'stop', { value: noop$1 });

var linear = easing.linear;

function getOptions ( options, instance ) {
	options = options || {};

	var easing$$1;
	if ( options.easing ) {
		easing$$1 = typeof options.easing === 'function' ?
			options.easing :
			instance.easing[ options.easing ];
	}

	return {
		easing: easing$$1 || linear,
		duration: 'duration' in options ? options.duration : 400,
		complete: options.complete || noop$1,
		step: options.step || noop$1
	};
}

function animate ( ractive, model, to, options ) {
	options = getOptions( options, ractive );
	var from = model.get();

	// don't bother animating values that stay the same
	if ( isEqual( from, to ) ) {
		options.complete( options.to );
		return noAnimation; // TODO should this have .then and .catch methods?
	}

	var interpolator = interpolate( from, to, ractive, options.interpolator );

	// if we can't interpolate the value, set it immediately
	if ( !interpolator ) {
		runloop.start();
		model.set( to );
		runloop.end();

		return noAnimation;
	}

	return model.animate( from, to, options, interpolator );
}

function Ractive$animate ( keypath, to, options ) {
	if ( typeof keypath === 'object' ) {
		var keys = Object.keys( keypath );

		throw new Error( ("ractive.animate(...) no longer supports objects. Instead of ractive.animate({\n  " + (keys.map( function (key) { return ("'" + key + "': " + (keypath[ key ])); } ).join( '\n  ' )) + "\n}, {...}), do\n\n" + (keys.map( function (key) { return ("ractive.animate('" + key + "', " + (keypath[ key ]) + ", {...});"); } ).join( '\n' )) + "\n") );
	}


	return animate( this, this.viewmodel.joinAll( splitKeypath( keypath ) ), to, options );
}

function enqueue ( ractive, event ) {
	if ( ractive.event ) {
		ractive._eventQueue.push( ractive.event );
	}

	ractive.event = event;
}

function dequeue ( ractive ) {
	if ( ractive._eventQueue.length ) {
		ractive.event = ractive._eventQueue.pop();
	} else {
		ractive.event = null;
	}
}

var initStars = {};
var bubbleStars = {};

// cartesian product of name parts and stars
// adjusted appropriately for special cases
function variants ( name, initial ) {
	var map = initial ? initStars : bubbleStars;
	if ( map[ name ] ) { return map[ name ]; }

	var parts = name.split( '.' );
	var result = [];
	var base = false;

	// initial events the implicit namespace of 'this'
	if ( initial ) {
		parts.unshift( 'this' );
		base = true;
	}

	// use max - 1 bits as a bitmap to pick a part or a *
	// need to skip the full star case if the namespace is synthetic
	var max = Math.pow( 2, parts.length ) - ( initial ? 1 : 0 );
	for ( var i = 0; i < max; i++ ) {
		var join = [];
		for ( var j = 0; j < parts.length; j++ ) {
			join.push( 1 & ( i >> j ) ? '*' : parts[j] );
		}
		result.unshift( join.join( '.' ) );
	}

	if ( base ) {
		// include non-this-namespaced versions
		if ( parts.length > 2 ) {
			result.push.apply( result, variants( name, false ) );
		} else {
			result.push( '*' );
			result.push( name );
		}
	}

	map[ name ] = result;
	return result;
}

function fireEvent ( ractive, eventName, context, args ) {
	if ( args === void 0 ) { args = []; }

	if ( !eventName ) { return; }

	context.name = eventName;
	args.unshift( context );

	var eventNames = ractive._nsSubs ? variants( eventName, true ) : [ '*', eventName ];

	return fireEventAs( ractive, eventNames, context, args, true );
}

function fireEventAs  ( ractive, eventNames, context, args, initialFire ) {
	if ( initialFire === void 0 ) { initialFire = false; }

	var bubble = true;

	if ( initialFire || ractive._nsSubs ) {
		enqueue( ractive, context );

		var i = eventNames.length;
		while ( i-- ) {
			if ( eventNames[ i ] in ractive._subs ) {
				bubble = notifySubscribers( ractive, ractive._subs[ eventNames[ i ] ], context, args ) && bubble;
			}
		}

		dequeue( ractive );
	}

	if ( ractive.parent && bubble ) {
		if ( initialFire && ractive.component ) {
			var fullName = ractive.component.name + '.' + eventNames[ eventNames.length - 1 ];
			eventNames = variants( fullName, false );

			if ( context && !context.component ) {
				context.component = ractive;
			}
		}

		bubble = fireEventAs( ractive.parent, eventNames, context, args );
	}

	return bubble;
}

function notifySubscribers ( ractive, subscribers, context, args ) {
	var originalEvent = null;
	var stopEvent = false;

	// subscribers can be modified inflight, e.g. "once" functionality
	// so we need to copy to make sure everyone gets called
	subscribers = subscribers.slice();

	for ( var i = 0, len = subscribers.length; i < len; i += 1 ) {
		if ( !subscribers[ i ].off && subscribers[ i ].handler.apply( ractive, args ) === false ) {
			stopEvent = true;
		}
	}

	if ( context && stopEvent && ( originalEvent = context.event ) ) {
		originalEvent.preventDefault && originalEvent.preventDefault();
		originalEvent.stopPropagation && originalEvent.stopPropagation();
	}

	return !stopEvent;
}

var extern = {};

function getRactiveContext ( ractive ) {
	var arguments$1 = arguments;

	var assigns = [], len = arguments.length - 1;
	while ( len-- > 0 ) { assigns[ len ] = arguments$1[ len + 1 ]; }

	var fragment = ractive.fragment || ractive._fakeFragment || ( ractive._fakeFragment = new FakeFragment( ractive ) );
	return fragment.getContext.apply( fragment, assigns );
}

function getContext () {
	var arguments$1 = arguments;

	var assigns = [], len = arguments.length;
	while ( len-- ) { assigns[ len ] = arguments$1[ len ]; }

	if ( !this.ctx ) { this.ctx = new extern.Context( this ); }
	assigns.unshift( Object.create( this.ctx ) );
	return Object.assign.apply( null, assigns );
}

var FakeFragment = function FakeFragment ( ractive ) {
	this.ractive = ractive;
};

FakeFragment.prototype.findContext = function findContext () { return this.ractive.viewmodel; };
var proto$1 = FakeFragment.prototype;
proto$1.getContext = getContext;
proto$1.find = proto$1.findComponent = proto$1.findAll = proto$1.findAllComponents = noop$1;

var Hook = function Hook ( event ) {
	this.event = event;
	this.method = 'on' + event;
};

Hook.prototype.fire = function fire ( ractive, arg ) {
	var context = getRactiveContext( ractive );

	if ( ractive[ this.method ] ) {
		arg ? ractive[ this.method ]( context, arg ) : ractive[ this.method ]( context );
	}

	fireEvent( ractive, this.event, context, arg ? [ arg, ractive ] : [ ractive ] );
};

function findAnchors ( fragment, name ) {
	if ( name === void 0 ) { name = null; }

	var res = [];

	findAnchorsIn( fragment, name, res );

	return res;
}

function findAnchorsIn ( item, name, result ) {
	if ( item.isAnchor ) {
		if ( !name || item.name === name ) {
			result.push( item );
		}
	} else if ( item.items ) {
		item.items.forEach( function (i) { return findAnchorsIn( i, name, result ); } );
	} else if ( item.iterations ) {
		item.iterations.forEach( function (i) { return findAnchorsIn( i, name, result ); } );
	} else if ( item.fragment && !item.component ) {
		findAnchorsIn( item.fragment, name, result );
	}
}

function updateAnchors ( instance, name ) {
	if ( name === void 0 ) { name = null; }

	var anchors = findAnchors( instance.fragment, name );
	var idxs = {};
	var children = instance._children.byName;

	anchors.forEach( function (a) {
		var name = a.name;
		if ( !( name in idxs ) ) { idxs[name] = 0; }
		var idx = idxs[name];
		var child = ( children[name] || [] )[idx];

		if ( child && child.lastBound !== a ) {
			if ( child.lastBound ) { child.lastBound.removeChild( child ); }
			a.addChild( child );
		}

		idxs[name]++;
	});
}

function unrenderChild ( meta ) {
	if ( meta.instance.fragment.rendered ) {
		meta.shouldDestroy = true;
		meta.instance.unrender();
	}
	meta.instance.el = null;
}

var attachHook = new Hook( 'attachchild' );

function attachChild ( child, options ) {
	if ( options === void 0 ) { options = {}; }

	var children = this._children;

	if ( child.parent && child.parent !== this ) { throw new Error( ("Instance " + (child._guid) + " is already attached to a different instance " + (child.parent._guid) + ". Please detach it from the other instance using detachChild first.") ); }
	else if ( child.parent ) { throw new Error( ("Instance " + (child._guid) + " is already attached to this instance.") ); }

	var meta = {
		instance: child,
		ractive: this,
		name: options.name || child.constructor.name || 'Ractive',
		target: options.target || false,
		bubble: bubble,
		findNextNode: findNextNode
	};
	meta.nameOption = options.name;

	// child is managing itself
	if ( !meta.target ) {
		meta.parentFragment = this.fragment;
		meta.external = true;
	} else {
		var list;
		if ( !( list = children.byName[ meta.target ] ) ) {
			list = [];
			this.set( ("@this.children.byName." + (meta.target)), list );
		}
		var idx = options.prepend ? 0 : options.insertAt !== undefined ? options.insertAt : list.length;
		list.splice( idx, 0, meta );
	}

	child.set({
		'@this.parent': this,
		'@this.root': this.root
	});
	child.component = meta;
	children.push( meta );

	attachHook.fire( child );

	var promise = runloop.start( child, true );

	if ( meta.target ) {
		unrenderChild( meta );
		this.set( ("@this.children.byName." + (meta.target)), null, { shuffle: true } );
		updateAnchors( this, meta.target );
	} else {
		if ( !child.isolated ) { child.viewmodel.attached( this.fragment ); }
	}

	runloop.end();

	promise.ractive = child;
	return promise.then( function () { return child; } );
}

function bubble () { runloop.addFragment( this.instance.fragment ); }

function findNextNode () {
	if ( this.anchor ) { return this.anchor.findNextNode(); }
}

var detachHook = new Hook( 'detach' );

function Ractive$detach () {
	if ( this.isDetached ) {
		return this.el;
	}

	if ( this.el ) {
		removeFromArray( this.el.__ractive_instances__, this );
	}

	this.el = this.fragment.detach();
	this.isDetached = true;

	detachHook.fire( this );
	return this.el;
}

var detachHook$1 = new Hook( 'detachchild' );

function detachChild ( child ) {
	var children = this._children;
	var meta, index;

	var i = children.length;
	while ( i-- ) {
		if ( children[i].instance === child ) {
			index = i;
			meta = children[i];
			break;
		}
	}

	if ( !meta || child.parent !== this ) { throw new Error( ("Instance " + (child._guid) + " is not attached to this instance.") ); }

	var promise = runloop.start( child, true );

	if ( meta.anchor ) { meta.anchor.removeChild( meta ); }
	if ( !child.isolated ) { child.viewmodel.detached(); }

	runloop.end();

	children.splice( index, 1 );
	if ( meta.target ) {
		var list = children.byName[ meta.target ];
		list.splice( list.indexOf( meta ), 1 );
		this.set( ("@this.children.byName." + (meta.target)), null, { shuffle: true } );
		updateAnchors( this, meta.target );
	}
	child.set({
		'@this.parent': undefined,
		'@this.root': child
	});
	child.component = null;

	detachHook$1.fire( child );

	promise.ractive = child;
	return promise.then( function () { return child; } );
}

function Ractive$find ( selector, options ) {
	var this$1 = this;
	if ( options === void 0 ) { options = {}; }

	if ( !this.el ) { throw new Error( ("Cannot call ractive.find('" + selector + "') unless instance is rendered to the DOM") ); }

	var node = this.fragment.find( selector, options );
	if ( node ) { return node; }

	if ( options.remote ) {
		for ( var i = 0; i < this._children.length; i++ ) {
			if ( !this$1._children[i].instance.fragment.rendered ) { continue; }
			node = this$1._children[i].instance.find( selector, options );
			if ( node ) { return node; }
		}
	}
}

function Ractive$findAll ( selector, options ) {
	if ( options === void 0 ) { options = {}; }

	if ( !this.el ) { throw new Error( ("Cannot call ractive.findAll('" + selector + "', ...) unless instance is rendered to the DOM") ); }

	if ( !Array.isArray( options.result ) ) { options.result = []; }

	this.fragment.findAll( selector, options );

	if ( options.remote ) {
		// seach non-fragment children
		this._children.forEach( function (c) {
			if ( !c.target && c.instance.fragment && c.instance.fragment.rendered ) {
				c.instance.findAll( selector, options );
			}
		});
	}

	return options.result;
}

function Ractive$findAllComponents ( selector, options ) {
	if ( !options && typeof selector === 'object' ) {
		options = selector;
		selector = '';
	}

	options = options || {};

	if ( !Array.isArray( options.result ) ) { options.result = []; }

	this.fragment.findAllComponents( selector, options );

	if ( options.remote ) {
		// search non-fragment children
		this._children.forEach( function (c) {
			if ( !c.target && c.instance.fragment && c.instance.fragment.rendered ) {
				if ( !selector || c.name === selector ) {
					options.result.push( c.instance );
				}

				c.instance.findAllComponents( selector, options );
			}
		});
	}

	return options.result;
}

function Ractive$findComponent ( selector, options ) {
	var this$1 = this;
	if ( options === void 0 ) { options = {}; }

	if ( typeof selector === 'object' ) {
		options = selector;
		selector = '';
	}

	var child = this.fragment.findComponent( selector, options );
	if ( child ) { return child; }

	if ( options.remote ) {
		if ( !selector && this._children.length ) { return this._children[0].instance; }
		for ( var i = 0; i < this._children.length; i++ ) {
			// skip children that are or should be in an anchor
			if ( this$1._children[i].target ) { continue; }
			if ( this$1._children[i].name === selector ) { return this$1._children[i].instance; }
			child = this$1._children[i].instance.findComponent( selector, options );
			if ( child ) { return child; }
		}
	}
}

function Ractive$findContainer ( selector ) {
	if ( this.container ) {
		if ( this.container.component && this.container.component.name === selector ) {
			return this.container;
		} else {
			return this.container.findContainer( selector );
		}
	}

	return null;
}

function Ractive$findParent ( selector ) {

	if ( this.parent ) {
		if ( this.parent.component && this.parent.component.name === selector ) {
			return this.parent;
		} else {
			return this.parent.findParent ( selector );
		}
	}

	return null;
}

var stack = [];
var captureGroup;

function startCapturing () {
	stack.push( captureGroup = [] );
}

function stopCapturing () {
	var dependencies = stack.pop();
	captureGroup = stack[ stack.length - 1 ];
	return dependencies;
}

function capture ( model ) {
	if ( captureGroup ) {
		captureGroup.push( model );
	}
}

var KeyModel = function KeyModel ( key, parent ) {
	this.value = key;
	this.isReadonly = this.isKey = true;
	this.deps = [];
	this.links = [];
	this.parent = parent;
};

KeyModel.prototype.get = function get ( shouldCapture ) {
	if ( shouldCapture ) { capture( this ); }
	return unescapeKey( this.value );
};

KeyModel.prototype.getKeypath = function getKeypath () {
	return unescapeKey( this.value );
};

KeyModel.prototype.rebind = function rebind ( next, previous ) {
		var this$1 = this;

	var i = this.deps.length;
	while ( i-- ) { this$1.deps[i].rebind( next, previous, false ); }

	i = this.links.length;
	while ( i-- ) { this$1.links[i].rebind( next, previous, false ); }
};

KeyModel.prototype.register = function register ( dependant ) {
	this.deps.push( dependant );
};

KeyModel.prototype.registerLink = function registerLink ( link ) {
	addToArray( this.links, link );
};

KeyModel.prototype.unregister = function unregister ( dependant ) {
	removeFromArray( this.deps, dependant );
};

KeyModel.prototype.unregisterLink = function unregisterLink ( link ) {
	removeFromArray( this.links, link );
};

KeyModel.prototype.reference = noop$1;
KeyModel.prototype.unreference = noop$1;

function bind               ( x ) { x.bind(); }
function cancel             ( x ) { x.cancel(); }
function destroyed          ( x ) { x.destroyed(); }
function handleChange       ( x ) { x.handleChange(); }
function mark               ( x ) { x.mark(); }
function marked             ( x ) { x.marked(); }
function markedAll          ( x ) { x.markedAll(); }
function render             ( x ) { x.render(); }
function shuffled           ( x ) { x.shuffled(); }
function teardown           ( x ) { x.teardown(); }
function unbind             ( x ) { x.unbind(); }
function unrender           ( x ) { x.unrender(); }
function unrenderAndDestroy ( x ) { x.unrender( true ); }
function update             ( x ) { x.update(); }
function toString$1$1           ( x ) { return x.toString(); }
function toEscapedString    ( x ) { return x.toString( true ); }

var KeypathModel = function KeypathModel ( parent, ractive ) {
	this.parent = parent;
	this.ractive = ractive;
	this.value = ractive ? parent.getKeypath( ractive ) : parent.getKeypath();
	this.deps = [];
	this.children = {};
	this.isReadonly = this.isKeypath = true;
};

KeypathModel.prototype.get = function get ( shouldCapture ) {
	if ( shouldCapture ) { capture( this ); }
	return this.value;
};

KeypathModel.prototype.getChild = function getChild ( ractive ) {
	if ( !( ractive._guid in this.children ) ) {
		var model = new KeypathModel( this.parent, ractive );
		this.children[ ractive._guid ] = model;
		model.owner = this;
	}
	return this.children[ ractive._guid ];
};

KeypathModel.prototype.getKeypath = function getKeypath () {
	return this.value;
};

KeypathModel.prototype.handleChange = function handleChange$1 () {
		var this$1 = this;

	var keys = Object.keys( this.children );
	var i = keys.length;
	while ( i-- ) {
		this$1.children[ keys[i] ].handleChange();
	}

	this.deps.forEach( handleChange );
};

KeypathModel.prototype.rebindChildren = function rebindChildren ( next ) {
		var this$1 = this;

	var keys = Object.keys( this.children );
	var i = keys.length;
	while ( i-- ) {
		var child = this$1.children[keys[i]];
		child.value = next.getKeypath( child.ractive );
		child.handleChange();
	}
};

KeypathModel.prototype.rebind = function rebind ( next, previous ) {
		var this$1 = this;

	var model = next ? next.getKeypathModel( this.ractive ) : undefined;

	var keys = Object.keys( this.children );
	var i = keys.length;
	while ( i-- ) {
		this$1.children[ keys[i] ].rebind( next, previous, false );
	}

	i = this.deps.length;
	while ( i-- ) {
		this$1.deps[i].rebind( model, this$1, false );
	}
};

KeypathModel.prototype.register = function register ( dep ) {
	this.deps.push( dep );
};

KeypathModel.prototype.removeChild = function removeChild ( model ) {
	if ( model.ractive ) { delete this.children[ model.ractive._guid ]; }
};

KeypathModel.prototype.teardown = function teardown$$1 () {
		var this$1 = this;

	if ( this.owner ) { this.owner.removeChild( this ); }

	var keys = Object.keys( this.children );
	var i = keys.length;
	while ( i-- ) {
		this$1.children[ keys[i] ].teardown();
	}
};

KeypathModel.prototype.unregister = function unregister ( dep ) {
	removeFromArray( this.deps, dep );
	if ( !this.deps.length ) { this.teardown(); }
};

KeypathModel.prototype.reference = noop$1;
KeypathModel.prototype.unreference = noop$1;

var fnBind = Function.prototype.bind;

function bind$1 ( fn, context ) {
	if ( !/this/.test( fn.toString() ) ) { return fn; }

	var bound = fnBind.call( fn, context );
	for ( var prop in fn ) { bound[ prop ] = fn[ prop ]; }

	return bound;
}

var hasProp = Object.prototype.hasOwnProperty;

var shuffleTasks = { early: [], mark: [] };
var registerQueue = { early: [], mark: [] };

var ModelBase = function ModelBase ( parent ) {
	this.deps = [];

	this.children = [];
	this.childByKey = {};
	this.links = [];

	this.keyModels = {};

	this.bindings = [];
	this.patternObservers = [];

	if ( parent ) {
		this.parent = parent;
		this.root = parent.root;
	}
};

ModelBase.prototype.addShuffleTask = function addShuffleTask ( task, stage ) {
	if ( stage === void 0 ) { stage = 'early'; }
 shuffleTasks[stage].push( task ); };
ModelBase.prototype.addShuffleRegister = function addShuffleRegister ( item, stage ) {
	if ( stage === void 0 ) { stage = 'early'; }
 registerQueue[stage].push({ model: this, item: item }); };

ModelBase.prototype.findMatches = function findMatches ( keys ) {
	var len = keys.length;

	var existingMatches = [ this ];
	var matches;
	var i;

	var loop = function (  ) {
		var key = keys[i];

		if ( key === '*' ) {
			matches = [];
			existingMatches.forEach( function (model) {
				matches.push.apply( matches, model.getValueChildren( model.get() ) );
			});
		} else {
			matches = existingMatches.map( function (model) { return model.joinKey( key ); } );
		}

		existingMatches = matches;
	};

		for ( i = 0; i < len; i += 1 ) { loop(  ); }

	return matches;
};

ModelBase.prototype.getKeyModel = function getKeyModel ( key, skip ) {
	if ( key !== undefined && !skip ) { return this.parent.getKeyModel( key, true ); }

	if ( !( key in this.keyModels ) ) { this.keyModels[ key ] = new KeyModel( escapeKey( key ), this ); }

	return this.keyModels[ key ];
};

ModelBase.prototype.getKeypath = function getKeypath ( ractive ) {
	if ( ractive !== this.ractive && this._link ) { return this._link.target.getKeypath( ractive ); }

	if ( !this.keypath ) {
		var parent = this.parent && this.parent.getKeypath( ractive );
		this.keypath = parent ? ((this.parent.getKeypath( ractive )) + "." + (escapeKey( this.key ))) : escapeKey( this.key );
	}

	return this.keypath;
};

ModelBase.prototype.getValueChildren = function getValueChildren ( value ) {
		var this$1 = this;

	var children;
	if ( Array.isArray( value ) ) {
		children = [];
		if ( 'length' in this && this.length !== value.length ) {
			children.push( this.joinKey( 'length' ) );
		}
		value.forEach( function ( m, i ) {
			children.push( this$1.joinKey( i ) );
		});
	}

	else if ( isObject( value ) || typeof value === 'function' ) {
		children = Object.keys( value ).map( function (key) { return this$1.joinKey( key ); } );
	}

	else if ( value != null ) {
		return [];
	}

	return children;
};

ModelBase.prototype.getVirtual = function getVirtual ( shouldCapture ) {
		var this$1 = this;

	var value = this.get( shouldCapture, { virtual: false } );
	if ( isObject( value ) ) {
		var result = Array.isArray( value ) ? [] : {};

		var keys = Object.keys( value );
		var i = keys.length;
		while ( i-- ) {
			var child = this$1.childByKey[ keys[i] ];
			if ( !child ) { result[ keys[i] ] = value[ keys[i] ]; }
			else if ( child._link ) { result[ keys[i] ] = child._link.getVirtual(); }
			else { result[ keys[i] ] = child.getVirtual(); }
		}

		i = this.children.length;
		while ( i-- ) {
			var child$1 = this$1.children[i];
			if ( !( child$1.key in result ) && child$1._link ) {
				result[ child$1.key ] = child$1._link.getVirtual();
			}
		}

		return result;
	} else { return value; }
};

ModelBase.prototype.has = function has ( key ) {
	if ( this._link ) { return this._link.has( key ); }

	var value = this.get();
	if ( !value ) { return false; }

	key = unescapeKey( key );
	if ( hasProp.call( value, key ) ) { return true; }

	// We climb up the constructor chain to find if one of them contains the key
	var constructor = value.constructor;
	while ( constructor !== Function && constructor !== Array && constructor !== Object ) {
		if ( hasProp.call( constructor.prototype, key ) ) { return true; }
		constructor = constructor.constructor;
	}

	return false;
};

ModelBase.prototype.joinAll = function joinAll ( keys, opts ) {
	var model = this;
	for ( var i = 0; i < keys.length; i += 1 ) {
		if ( opts && opts.lastLink === false && i + 1 === keys.length && model.childByKey[keys[i]] && model.childByKey[keys[i]]._link ) { return model.childByKey[keys[i]]; }
		model = model.joinKey( keys[i], opts );
	}

	return model;
};

ModelBase.prototype.notifyUpstream = function notifyUpstream ( startPath ) {
		var this$1 = this;

	var parent = this.parent;
	var path = startPath || [ this.key ];
	while ( parent ) {
		if ( parent.patternObservers.length ) { parent.patternObservers.forEach( function (o) { return o.notify( path.slice() ); } ); }
		path.unshift( parent.key );
		parent.links.forEach( function (l) { return l.notifiedUpstream( path, this$1.root ); } );
		parent.deps.forEach( handleChange );
		parent = parent.parent;
	}
};

ModelBase.prototype.rebind = function rebind ( next, previous, safe ) {
		var this$1 = this;

	// tell the deps to move to the new target
	var i = this.deps.length;
	while ( i-- ) {
		if ( this$1.deps[i].rebind ) { this$1.deps[i].rebind( next, previous, safe ); }
	}

	i = this.links.length;
	while ( i-- ) {
		var link = this$1.links[i];
		// only relink the root of the link tree
		if ( link.owner._link ) { link.relinking( next, safe ); }
	}

	i = this.children.length;
	while ( i-- ) {
		var child = this$1.children[i];
		child.rebind( next ? next.joinKey( child.key ) : undefined, child, safe );
	}

	if ( this.keypathModel ) { this.keypathModel.rebind( next, previous, false ); }

	i = this.bindings.length;
	while ( i-- ) {
		this$1.bindings[i].rebind( next, previous, safe );
	}
};

ModelBase.prototype.reference = function reference () {
	'refs' in this ? this.refs++ : this.refs = 1;
};

ModelBase.prototype.register = function register ( dep ) {
	this.deps.push( dep );
};

ModelBase.prototype.registerLink = function registerLink ( link ) {
	addToArray( this.links, link );
};

ModelBase.prototype.registerPatternObserver = function registerPatternObserver ( observer ) {
	this.patternObservers.push( observer );
	this.register( observer );
};

ModelBase.prototype.registerTwowayBinding = function registerTwowayBinding ( binding ) {
	this.bindings.push( binding );
};

ModelBase.prototype.unreference = function unreference () {
	if ( 'refs' in this ) { this.refs--; }
};

ModelBase.prototype.unregister = function unregister ( dep ) {
	removeFromArray( this.deps, dep );
};

ModelBase.prototype.unregisterLink = function unregisterLink ( link ) {
	removeFromArray( this.links, link );
};

ModelBase.prototype.unregisterPatternObserver = function unregisterPatternObserver ( observer ) {
	removeFromArray( this.patternObservers, observer );
	this.unregister( observer );
};

ModelBase.prototype.unregisterTwowayBinding = function unregisterTwowayBinding ( binding ) {
	removeFromArray( this.bindings, binding );
};

ModelBase.prototype.updateFromBindings = function updateFromBindings$1 ( cascade ) {
		var this$1 = this;

	var i = this.bindings.length;
	while ( i-- ) {
		var value = this$1.bindings[i].getValue();
		if ( value !== this$1.value ) { this$1.set( value ); }
	}

	// check for one-way bindings if there are no two-ways
	if ( !this.bindings.length ) {
		var oneway = findBoundValue( this.deps );
		if ( oneway && oneway.value !== this.value ) { this.set( oneway.value ); }
	}

	if ( cascade ) {
		this.children.forEach( updateFromBindings );
		this.links.forEach( updateFromBindings );
		if ( this._link ) { this._link.updateFromBindings( cascade ); }
	}
};

// TODO: this may be better handled by overreiding `get` on models with a parent that isRoot
function maybeBind ( model, value, shouldBind ) {
	if ( shouldBind && typeof value === 'function' && model.parent && model.parent.isRoot ) {
		if ( !model.boundValue ) {
			model.boundValue = bind$1( value._r_unbound || value, model.parent.ractive );
		}

		return model.boundValue;
	}

	return value;
}

function updateFromBindings ( model ) {
	model.updateFromBindings( true );
}

function findBoundValue( list ) {
	var i = list.length;
	while ( i-- ) {
		if ( list[i].bound ) {
			var owner = list[i].owner;
			if ( owner ) {
				var value = owner.name === 'checked' ?
					owner.node.checked :
					owner.node.value;
				return { value: value };
			}
		}
	}
}

function fireShuffleTasks ( stage ) {
	if ( !stage ) {
		fireShuffleTasks( 'early' );
		fireShuffleTasks( 'mark' );
	} else {
		var tasks = shuffleTasks[stage];
		shuffleTasks[stage] = [];
		var i = tasks.length;
		while ( i-- ) { tasks[i](); }

		var register = registerQueue[stage];
		registerQueue[stage] = [];
		i = register.length;
		while ( i-- ) { register[i].model.register( register[i].item ); }
	}
}

function shuffle ( model, newIndices, link ) {
	model.shuffling = true;

	var i = newIndices.length;
	while ( i-- ) {
		var idx = newIndices[ i ];
		// nothing is actually changing, so move in the index and roll on
		if ( i === idx ) {
			continue;
		}

		// rebind the children on i to idx
		if ( i in model.childByKey ) { model.childByKey[ i ].rebind( !~idx ? undefined : model.joinKey( idx ), model.childByKey[ i ], true ); }

		if ( !~idx && model.keyModels[ i ] ) {
			model.keyModels[i].rebind( undefined, model.keyModels[i], false );
		} else if ( ~idx && model.keyModels[ i ] ) {
			if ( !model.keyModels[ idx ] ) { model.childByKey[ idx ].getKeyModel( idx ); }
			model.keyModels[i].rebind( model.keyModels[ idx ], model.keyModels[i], false );
		}
	}

	var upstream = model.source().length !== model.source().value.length;

	model.links.forEach( function (l) { return l.shuffle( newIndices ); } );
	if ( !link ) { fireShuffleTasks( 'early' ); }

	i = model.deps.length;
	while ( i-- ) {
		if ( model.deps[i].shuffle ) { model.deps[i].shuffle( newIndices ); }
	}

	model[ link ? 'marked' : 'mark' ]();
	if ( !link ) { fireShuffleTasks( 'mark' ); }

	if ( upstream ) { model.notifyUpstream(); }

	model.shuffling = false;
}

KeyModel.prototype.addShuffleTask = ModelBase.prototype.addShuffleTask;
KeyModel.prototype.addShuffleRegister = ModelBase.prototype.addShuffleRegister;
KeypathModel.prototype.addShuffleTask = ModelBase.prototype.addShuffleTask;
KeypathModel.prototype.addShuffleRegister = ModelBase.prototype.addShuffleRegister;

// this is the dry method of checking to see if a rebind applies to
// a particular keypath because in some cases, a dep may be bound
// directly to a particular keypath e.g. foo.bars.0.baz and need
// to avoid getting kicked to foo.bars.1.baz if foo.bars is unshifted
function rebindMatch ( template, next, previous, fragment ) {
	var keypath = template.r || template;

	// no valid keypath, go with next
	if ( !keypath || typeof keypath !== 'string' ) { return next; }

	// completely contextual ref, go with next
	if ( keypath === '.' || keypath[0] === '@' || ( next || previous ).isKey || ( next || previous ).isKeypath ) { return next; }

	var parts = keypath.split( '/' );
	var keys = splitKeypath( parts[ parts.length - 1 ] );
	var last = keys[ keys.length - 1 ];

	// check the keypath against the model keypath to see if it matches
	var model = next || previous;

	// check to see if this was an alias
	if ( model && keys.length === 1 && last !== model.key && fragment ) {
		keys = findAlias( last, fragment ) || keys;
	}

	var i = keys.length;
	var match = true;
	var shuffling = false;

	while ( model && i-- ) {
		if ( model.shuffling ) { shuffling = true; }
		// non-strict comparison to account for indices in keypaths
		if ( keys[i] != model.key ) { match = false; }
		model = model.parent;
	}

	// next is undefined, but keypath is shuffling and previous matches
	if ( !next && match && shuffling ) { return previous; }
	// next is defined, but doesn't match the keypath
	else if ( next && !match && shuffling ) { return previous; }
	else { return next; }
}

function findAlias ( name, fragment ) {
	while ( fragment ) {
		var z = fragment.aliases;
		if ( z && z[ name ] ) {
			var aliases = ( fragment.owner.iterations ? fragment.owner : fragment ).owner.template.z;
			for ( var i = 0; i < aliases.length; i++ ) {
				if ( aliases[i].n === name ) {
					var alias = aliases[i].x;
					if ( !alias.r ) { return false; }
					var parts = alias.r.split( '/' );
					return splitKeypath( parts[ parts.length - 1 ] );
				}
			}
			return;
		}

		fragment = fragment.componentParent || fragment.parent;
	}
}

// temporary placeholder target for detached implicit links
var Missing = {
	key: '@missing',
	animate: noop$1,
	applyValue: noop$1,
	get: noop$1,
	getKeypath: function getKeypath () { return this.key; },
	joinAll: function joinAll () { return this; },
	joinKey: function joinKey () { return this; },
	mark: noop$1,
	registerLink: noop$1,
	shufle: noop$1,
	set: noop$1,
	unregisterLink: noop$1
};
Missing.parent = Missing;

var LinkModel = (function (ModelBase$$1) {
	function LinkModel ( parent, owner, target, key ) {
		ModelBase$$1.call( this, parent );

		this.owner = owner;
		this.target = target;
		this.key = key === undefined ? owner.key : key;
		if ( owner.isLink ) { this.sourcePath = (owner.sourcePath) + "." + (this.key); }

		target.registerLink( this );

		if ( parent ) { this.isReadonly = parent.isReadonly; }

		this.isLink = true;
	}

	if ( ModelBase$$1 ) { LinkModel.__proto__ = ModelBase$$1; }
	LinkModel.prototype = Object.create( ModelBase$$1 && ModelBase$$1.prototype );
	LinkModel.prototype.constructor = LinkModel;

	LinkModel.prototype.animate = function animate ( from, to, options, interpolator ) {
		return this.target.animate( from, to, options, interpolator );
	};

	LinkModel.prototype.applyValue = function applyValue ( value ) {
		if ( this.boundValue ) { this.boundValue = null; }
		this.target.applyValue( value );
	};

	LinkModel.prototype.attach = function attach ( fragment ) {
		var model = resolveReference( fragment, this.key );
		if ( model ) {
			this.relinking( model, false );
		} else { // if there is no link available, move everything here to real models
			this.owner.unlink();
		}
	};

	LinkModel.prototype.detach = function detach () {
		this.relinking( Missing, false );
	};

	LinkModel.prototype.get = function get ( shouldCapture, opts ) {
		if ( opts === void 0 ) { opts = {}; }

		if ( shouldCapture ) {
			capture( this );

			// may need to tell the target to unwrap
			opts.unwrap = true;
		}

		var bind$$1 = 'shouldBind' in opts ? opts.shouldBind : true;
		opts.shouldBind = false;

		return maybeBind( this, this.target.get( false, opts ), bind$$1 );
	};

	LinkModel.prototype.getKeypath = function getKeypath ( ractive ) {
		if ( ractive && ractive !== this.root.ractive ) { return this.target.getKeypath( ractive ); }

		return ModelBase$$1.prototype.getKeypath.call( this, ractive );
	};

	LinkModel.prototype.getKeypathModel = function getKeypathModel ( ractive ) {
		if ( !this.keypathModel ) { this.keypathModel = new KeypathModel( this ); }
		if ( ractive && ractive !== this.root.ractive ) { return this.keypathModel.getChild( ractive ); }
		return this.keypathModel;
	};

	LinkModel.prototype.handleChange = function handleChange$1 () {
		this.deps.forEach( handleChange );
		this.links.forEach( handleChange );
		this.notifyUpstream();
	};

	LinkModel.prototype.isDetached = function isDetached () { return this.virtual && this.target === Missing; };

	LinkModel.prototype.joinKey = function joinKey ( key ) {
		// TODO: handle nested links
		if ( key === undefined || key === '' ) { return this; }

		if ( !this.childByKey.hasOwnProperty( key ) ) {
			var child = new LinkModel( this, this, this.target.joinKey( key ), key );
			this.children.push( child );
			this.childByKey[ key ] = child;
		}

		return this.childByKey[ key ];
	};

	LinkModel.prototype.mark = function mark$$1 ( force ) {
		this.target.mark( force );
	};

	LinkModel.prototype.marked = function marked$1 () {
		if ( this.boundValue ) { this.boundValue = null; }

		this.links.forEach( marked );

		this.deps.forEach( handleChange );
	};

	LinkModel.prototype.markedAll = function markedAll$1 () {
		this.children.forEach( markedAll );
		this.marked();
	};

	LinkModel.prototype.notifiedUpstream = function notifiedUpstream ( startPath, root ) {
		var this$1 = this;

		this.links.forEach( function (l) { return l.notifiedUpstream( startPath, this$1.root ); } );
		this.deps.forEach( handleChange );
		if ( startPath && this.rootLink && this.root !== root ) {
			var path = startPath.slice( 1 );
			path.unshift( this.key );
			this.notifyUpstream( path );
		}
	};

	LinkModel.prototype.relinked = function relinked () {
		this.target.registerLink( this );
		this.children.forEach( function (c) { return c.relinked(); } );
	};

	LinkModel.prototype.relinking = function relinking ( target, safe ) {
		var this$1 = this;

		if ( this.rootLink && this.sourcePath ) { target = rebindMatch( this.sourcePath, target, this.target ); }
		if ( !target || this.target === target ) { return; }

		this.target.unregisterLink( this );
		if ( this.keypathModel ) { this.keypathModel.rebindChildren( target ); }

		this.target = target;
		this.children.forEach( function (c) {
			c.relinking( target.joinKey( c.key ), safe );
		});

		if ( this.rootLink ) { this.addShuffleTask( function () {
			this$1.relinked();
			if ( !safe ) { this$1.notifyUpstream(); }
		}); }
	};

	LinkModel.prototype.set = function set ( value ) {
		if ( this.boundValue ) { this.boundValue = null; }
		this.target.set( value );
	};

	LinkModel.prototype.shuffle = function shuffle$1 ( newIndices ) {
		// watch for extra shuffles caused by a shuffle in a downstream link
		if ( this.shuffling ) { return; }

		// let the real model handle firing off shuffles
		if ( !this.target.shuffling ) {
			this.target.shuffle( newIndices );
		} else {
			shuffle( this, newIndices, true );
		}

	};

	LinkModel.prototype.source = function source () {
		if ( this.target.source ) { return this.target.source(); }
		else { return this.target; }
	};

	LinkModel.prototype.teardown = function teardown$1 () {
		if ( this._link ) { this._link.teardown(); }
		this.target.unregisterLink( this );
		this.children.forEach( teardown );
	};

	return LinkModel;
}(ModelBase));

ModelBase.prototype.link = function link ( model, keypath, options ) {
	var lnk = this._link || new LinkModel( this.parent, this, model, this.key );
	lnk.implicit = options && options.implicit;
	lnk.sourcePath = keypath;
	lnk.rootLink = true;
	if ( this._link ) { this._link.relinking( model, true, false ); }
	this.rebind( lnk, this, false );
	fireShuffleTasks();

	this._link = lnk;
	lnk.markedAll();

	this.notifyUpstream();
	return lnk;
};

ModelBase.prototype.unlink = function unlink () {
	if ( this._link ) {
		var ln = this._link;
		this._link = undefined;
		ln.rebind( this, this._link );
		fireShuffleTasks();
		ln.teardown();
		this.notifyUpstream();
	}
};

// TODO what happens if a transition is aborted?

var tickers = [];
var running = false;

function tick () {
	runloop.start();

	var now = performance.now();

	var i;
	var ticker;

	for ( i = 0; i < tickers.length; i += 1 ) {
		ticker = tickers[i];

		if ( !ticker.tick( now ) ) {
			// ticker is complete, remove it from the stack, and decrement i so we don't miss one
			tickers.splice( i--, 1 );
		}
	}

	runloop.end();

	if ( tickers.length ) {
		requestAnimationFrame( tick );
	} else {
		running = false;
	}
}

var Ticker = function Ticker ( options ) {
	this.duration = options.duration;
	this.step = options.step;
	this.complete = options.complete;
	this.easing = options.easing;

	this.start = performance.now();
	this.end = this.start + this.duration;

	this.running = true;

	tickers.push( this );
	if ( !running ) { requestAnimationFrame( tick ); }
};

Ticker.prototype.tick = function tick ( now ) {
	if ( !this.running ) { return false; }

	if ( now > this.end ) {
		if ( this.step ) { this.step( 1 ); }
		if ( this.complete ) { this.complete( 1 ); }

		return false;
	}

	var elapsed = now - this.start;
	var eased = this.easing( elapsed / this.duration );

	if ( this.step ) { this.step( eased ); }

	return true;
};

Ticker.prototype.stop = function stop () {
	if ( this.abort ) { this.abort(); }
	this.running = false;
};

var prefixers = {};

// TODO this is legacy. sooner we can replace the old adaptor API the better
function prefixKeypath ( obj, prefix ) {
	var prefixed = {};

	if ( !prefix ) {
		return obj;
	}

	prefix += '.';

	for ( var key in obj ) {
		if ( obj.hasOwnProperty( key ) ) {
			prefixed[ prefix + key ] = obj[ key ];
		}
	}

	return prefixed;
}

function getPrefixer ( rootKeypath ) {
	var rootDot;

	if ( !prefixers[ rootKeypath ] ) {
		rootDot = rootKeypath ? rootKeypath + '.' : '';

		prefixers[ rootKeypath ] = function ( relativeKeypath, value ) {
			var obj;

			if ( typeof relativeKeypath === 'string' ) {
				obj = {};
				obj[ rootDot + relativeKeypath ] = value;
				return obj;
			}

			if ( typeof relativeKeypath === 'object' ) {
				// 'relativeKeypath' is in fact a hash, not a keypath
				return rootDot ? prefixKeypath( relativeKeypath, rootKeypath ) : relativeKeypath;
			}
		};
	}

	return prefixers[ rootKeypath ];
}

var Model = (function (ModelBase$$1) {
	function Model ( parent, key ) {
		ModelBase$$1.call( this, parent );

		this.ticker = null;

		if ( parent ) {
			this.key = unescapeKey( key );
			this.isReadonly = parent.isReadonly;

			if ( parent.value ) {
				this.value = parent.value[ this.key ];
				if ( Array.isArray( this.value ) ) { this.length = this.value.length; }
				this.adapt();
			}
		}
	}

	if ( ModelBase$$1 ) { Model.__proto__ = ModelBase$$1; }
	Model.prototype = Object.create( ModelBase$$1 && ModelBase$$1.prototype );
	Model.prototype.constructor = Model;

	Model.prototype.adapt = function adapt () {
		var this$1 = this;

		var adaptors = this.root.adaptors;
		var len = adaptors.length;

		this.rewrap = false;

		// Exit early if no adaptors
		if ( len === 0 ) { return; }

		var value = this.wrapper ? ( 'newWrapperValue' in this ? this.newWrapperValue : this.wrapperValue ) : this.value;

		// TODO remove this legacy nonsense
		var ractive = this.root.ractive;
		var keypath = this.getKeypath();

		// tear previous adaptor down if present
		if ( this.wrapper ) {
			var shouldTeardown = this.wrapperValue === value ? false : !this.wrapper.reset || this.wrapper.reset( value ) === false;

			if ( shouldTeardown ) {
				this.wrapper.teardown();
				this.wrapper = null;

				// don't branch for undefined values
				if ( this.value !== undefined ) {
					var parentValue = this.parent.value || this.parent.createBranch( this.key );
					if ( parentValue[ this.key ] !== value ) { parentValue[ this.key ] = value; }
				}
			} else {
				delete this.newWrapperValue;
				this.wrapperValue = value;
				this.value = this.wrapper.get();
				return;
			}
		}

		var i;

		for ( i = 0; i < len; i += 1 ) {
			var adaptor = adaptors[i];
			if ( adaptor.filter( value, keypath, ractive ) ) {
				this$1.wrapper = adaptor.wrap( ractive, value, keypath, getPrefixer( keypath ) );
				this$1.wrapperValue = value;
				this$1.wrapper.__model = this$1; // massive temporary hack to enable array adaptor

				this$1.value = this$1.wrapper.get();

				break;
			}
		}
	};

	Model.prototype.animate = function animate ( from, to, options, interpolator ) {
		var this$1 = this;

		if ( this.ticker ) { this.ticker.stop(); }

		var fulfilPromise;
		var promise = new Promise( function (fulfil) { return fulfilPromise = fulfil; } );

		this.ticker = new Ticker({
			duration: options.duration,
			easing: options.easing,
			step: function (t) {
				var value = interpolator( t );
				this$1.applyValue( value );
				if ( options.step ) { options.step( t, value ); }
			},
			complete: function () {
				this$1.applyValue( to );
				if ( options.complete ) { options.complete( to ); }

				this$1.ticker = null;
				fulfilPromise();
			}
		});

		promise.stop = this.ticker.stop;
		return promise;
	};

	Model.prototype.applyValue = function applyValue ( value, notify ) {
		if ( notify === void 0 ) { notify = true; }

		if ( isEqual( value, this.value ) ) { return; }
		if ( this.boundValue ) { this.boundValue = null; }

		if ( this.parent.wrapper && this.parent.wrapper.set ) {
			this.parent.wrapper.set( this.key, value );
			this.parent.value = this.parent.wrapper.get();

			this.value = this.parent.value[ this.key ];
			if ( this.wrapper ) { this.newWrapperValue = this.value; }
			this.adapt();
		} else if ( this.wrapper ) {
			this.newWrapperValue = value;
			this.adapt();
		} else {
			var parentValue = this.parent.value || this.parent.createBranch( this.key );
			if ( isObjectLike( parentValue ) ) {
				parentValue[ this.key ] = value;
			} else {
				warnIfDebug( ("Attempted to set a property of a non-object '" + (this.getKeypath()) + "'") );
				return;
			}

			this.value = value;
			this.adapt();
		}

		// keep track of array stuff
		if ( Array.isArray( value ) ) {
			this.length = value.length;
			this.isArray = true;
		} else {
			this.isArray = false;
		}

		// notify dependants
		this.links.forEach( handleChange );
		this.children.forEach( mark );
		this.deps.forEach( handleChange );

		if ( notify ) { this.notifyUpstream(); }

		if ( this.parent.isArray ) {
			if ( this.key === 'length' ) { this.parent.length = value; }
			else { this.parent.joinKey( 'length' ).mark(); }
		}
	};

	Model.prototype.createBranch = function createBranch ( key ) {
		var branch = isNumeric( key ) ? [] : {};
		this.applyValue( branch, false );

		return branch;
	};

	Model.prototype.get = function get ( shouldCapture, opts ) {
		if ( this._link ) { return this._link.get( shouldCapture, opts ); }
		if ( shouldCapture ) { capture( this ); }
		// if capturing, this value needs to be unwrapped because it's for external use
		if ( opts && opts.virtual ) { return this.getVirtual( false ); }
		return maybeBind( this, ( ( opts && 'unwrap' in opts ) ? opts.unwrap !== false : shouldCapture ) && this.wrapper ? this.wrapperValue : this.value, !opts || opts.shouldBind !== false );
	};

	Model.prototype.getKeypathModel = function getKeypathModel () {
		if ( !this.keypathModel ) { this.keypathModel = new KeypathModel( this ); }
		return this.keypathModel;
	};

	Model.prototype.joinKey = function joinKey ( key, opts ) {
		if ( this._link ) {
			if ( opts && opts.lastLink !== false && ( key === undefined || key === '' ) ) { return this; }
			return this._link.joinKey( key );
		}

		if ( key === undefined || key === '' ) { return this; }


		if ( !this.childByKey.hasOwnProperty( key ) ) {
			var child = new Model( this, key );
			this.children.push( child );
			this.childByKey[ key ] = child;
		}

		if ( this.childByKey[ key ]._link && ( !opts || opts.lastLink !== false ) ) { return this.childByKey[ key ]._link; }
		return this.childByKey[ key ];
	};

	Model.prototype.mark = function mark$1 ( force ) {
		if ( this._link ) { return this._link.mark(); }

		var value = this.retrieve();

		if ( force || !isEqual( value, this.value ) ) {
			var old = this.value;
			this.value = value;
			if ( this.boundValue ) { this.boundValue = null; }

			// make sure the wrapper stays in sync
			if ( old !== value || this.rewrap ) {
				if ( this.wrapper ) { this.newWrapperValue = value; }
				this.adapt();
			}

			// keep track of array stuff
			if ( Array.isArray( value ) ) {
				this.length = value.length;
				this.isArray = true;
			} else {
				this.isArray = false;
			}

			this.children.forEach( mark );
			this.links.forEach( marked );

			this.deps.forEach( handleChange );
		}
	};

	Model.prototype.merge = function merge ( array, comparator ) {
		var oldArray = this.value;
		var newArray = array;
		if ( oldArray === newArray ) { oldArray = recreateArray( this ); }
		if ( comparator ) {
			oldArray = oldArray.map( comparator );
			newArray = newArray.map( comparator );
		}

		var oldLength = oldArray.length;

		var usedIndices = {};
		var firstUnusedIndex = 0;

		var newIndices = oldArray.map( function (item) {
			var index;
			var start = firstUnusedIndex;

			do {
				index = newArray.indexOf( item, start );

				if ( index === -1 ) {
					return -1;
				}

				start = index + 1;
			} while ( ( usedIndices[ index ] === true ) && start < oldLength );

			// keep track of the first unused index, so we don't search
			// the whole of newArray for each item in oldArray unnecessarily
			if ( index === firstUnusedIndex ) {
				firstUnusedIndex += 1;
			}
			// allow next instance of next "equal" to be found item
			usedIndices[ index ] = true;
			return index;
		});

		this.parent.value[ this.key ] = array;
		this.shuffle( newIndices );
	};

	Model.prototype.retrieve = function retrieve () {
		return this.parent.value ? this.parent.value[ this.key ] : undefined;
	};

	Model.prototype.set = function set ( value ) {
		if ( this.ticker ) { this.ticker.stop(); }
		this.applyValue( value );
	};

	Model.prototype.shuffle = function shuffle$1 ( newIndices ) {
		shuffle( this, newIndices, false );
	};

	Model.prototype.source = function source () { return this; };

	Model.prototype.teardown = function teardown$1 () {
		if ( this._link ) { this._link.teardown(); }
		this.children.forEach( teardown );
		if ( this.wrapper ) { this.wrapper.teardown(); }
		if ( this.keypathModel ) { this.keypathModel.teardown(); }
	};

	return Model;
}(ModelBase));

function recreateArray( model ) {
	var array = [];

	for ( var i = 0; i < model.length; i++ ) {
		array[ i ] = (model.childByKey[i] || {}).value;
	}

	return array;
}

/* global global */
var data = {};

var SharedModel = (function (Model$$1) {
	function SharedModel ( value, name ) {
		Model$$1.call( this, null, ("@" + name) );
		this.key = "@" + name;
		this.value = value;
		this.isRoot = true;
		this.root = this;
		this.adaptors = [];
	}

	if ( Model$$1 ) { SharedModel.__proto__ = Model$$1; }
	SharedModel.prototype = Object.create( Model$$1 && Model$$1.prototype );
	SharedModel.prototype.constructor = SharedModel;

	SharedModel.prototype.getKeypath = function getKeypath () {
		return this.key;
	};

	return SharedModel;
}(Model));

var SharedModel$1 = new SharedModel( data, 'shared' );

var GlobalModel = new SharedModel( typeof global !== 'undefined' ? global : window, 'global' );

function resolveReference ( fragment, ref ) {
	var initialFragment = fragment;
	// current context ref
	if ( ref === '.' ) { return fragment.findContext(); }

	// ancestor references
	if ( ref[0] === '~' ) { return fragment.ractive.viewmodel.joinAll( splitKeypath( ref.slice( 2 ) ) ); }

	// scoped references
	if ( ref[0] === '.' || ref[0] === '^' ) {
		var frag = fragment;
		var parts = ref.split( '/' );
		var explicitContext = parts[0] === '^^';
		var context$1 = explicitContext ? null : fragment.findContext();

		// account for the first context hop
		if ( explicitContext ) { parts.unshift( '^^' ); }

		// walk up the context chain
		while ( parts[0] === '^^' ) {
			parts.shift();
			context$1 = null;
			while ( frag && !context$1 ) {
				context$1 = frag.context;
				frag = frag.parent.component ? frag.parent.component.parentFragment : frag.parent;
			}
		}

		if ( !context$1 && explicitContext ) {
			throw new Error( ("Invalid context parent reference ('" + ref + "'). There is not context at that level.") );
		}

		// walk up the context path
		while ( parts[0] === '.' || parts[0] === '..' ) {
			var part = parts.shift();

			if ( part === '..' ) {
				context$1 = context$1.parent;
			}
		}

		ref = parts.join( '/' );

		// special case - `{{.foo}}` means the same as `{{./foo}}`
		if ( ref[0] === '.' ) { ref = ref.slice( 1 ); }
		return context$1.joinAll( splitKeypath( ref ) );
	}

	var keys = splitKeypath( ref );
	if ( !keys.length ) { return; }
	var base = keys.shift();

	// special refs
	if ( base[0] === '@' ) {
		// shorthand from outside the template
		// @this referring to local ractive instance
		if ( base === '@this' || base === '@' ) {
			return fragment.ractive.viewmodel.getRactiveModel().joinAll( keys );
		}

		// @index or @key referring to the nearest repeating index or key
		else if ( base === '@index' || base === '@key' ) {
			if ( keys.length ) { badReference( base ); }
			var repeater = fragment.findRepeatingFragment();
			// make sure the found fragment is actually an iteration
			if ( !repeater.isIteration ) { return; }
			return repeater.context.getKeyModel( repeater[ ref[1] === 'i' ? 'index' : 'key' ] );
		}

		// @global referring to window or global
		else if ( base === '@global' ) {
			return GlobalModel.joinAll( keys );
		}

		// @global referring to window or global
		else if ( base === '@shared' ) {
			return SharedModel$1.joinAll( keys );
		}

		// @keypath or @rootpath, the current keypath string
		else if ( base === '@keypath' || base === '@rootpath' ) {
			var root = ref[1] === 'r' ? fragment.ractive.root : null;
			var context$2 = fragment.findContext();

			// skip over component roots, which provide no context
			while ( root && context$2.isRoot && context$2.ractive.component ) {
				context$2 = context$2.ractive.component.parentFragment.findContext();
			}

			return context$2.getKeypathModel( root );
		}

		else if ( base === '@context' ) {
			return new ContextModel( fragment.getContext() );
		}

		// @context-local data
		else if ( base === '@local' ) {
			return fragment.getContext()._data.joinAll( keys );
		}

		// nope
		else {
			throw new Error( ("Invalid special reference '" + base + "'") );
		}
	}

	var context = fragment.findContext();

	// check immediate context for a match
	if ( context.has( base ) ) {
		return context.joinKey( base ).joinAll( keys );
	}

	// walk up the fragment hierarchy looking for a matching ref, alias, or key in a context
	var crossedComponentBoundary;
	var shouldWarn = fragment.ractive.warnAboutAmbiguity;

	while ( fragment ) {
		// repeated fragments
		if ( fragment.isIteration ) {
			if ( base === fragment.parent.keyRef ) {
				if ( keys.length ) { badReference( base ); }
				return fragment.context.getKeyModel( fragment.key );
			}

			if ( base === fragment.parent.indexRef ) {
				if ( keys.length ) { badReference( base ); }
				return fragment.context.getKeyModel( fragment.index );
			}
		}

		// alias node or iteration
		if ( fragment.aliases  && fragment.aliases.hasOwnProperty( base ) ) {
			var model = fragment.aliases[ base ];

			if ( keys.length === 0 ) { return model; }
			else if ( typeof model.joinAll === 'function' ) {
				return model.joinAll( keys );
			}
		}

		// check fragment context to see if it has the key we need
		if ( fragment.context && fragment.context.has( base ) ) {
			// this is an implicit mapping
			if ( crossedComponentBoundary ) {
				if ( shouldWarn ) { warnIfDebug( ("'" + ref + "' resolved but is ambiguous and will create a mapping to a parent component.") ); }
				return context.root.createLink( base, fragment.context.joinKey( base ), base, { implicit: true } ).joinAll( keys );
			}

			if ( shouldWarn ) { warnIfDebug( ("'" + ref + "' resolved but is ambiguous.") ); }
			return fragment.context.joinKey( base ).joinAll( keys );
		}

		if ( ( fragment.componentParent || ( !fragment.parent && fragment.ractive.component ) ) && !fragment.ractive.isolated ) {
			// ascend through component boundary
			fragment = fragment.componentParent || fragment.ractive.component.parentFragment;
			crossedComponentBoundary = true;
		} else {
			fragment = fragment.parent;
		}
	}

	// if enabled, check the instance for a match
	if ( initialFragment.ractive.resolveInstanceMembers ) {
		var model$1 = initialFragment.ractive.viewmodel.getRactiveModel();
		if ( model$1.has( base ) ) {
			return model$1.joinKey( base ).joinAll( keys );
		}
	}

	if ( shouldWarn ) {
		warnIfDebug( ("'" + ref + "' is ambiguous and did not resolve.") );
	}

	// didn't find anything, so go ahead and create the key on the local model
	return context.joinKey( base ).joinAll( keys );
}

function badReference ( key ) {
	throw new Error( ("An index or key reference (" + key + ") cannot have child properties") );
}

var ContextModel = function ContextModel ( context ) {
	this.context = context;
};

ContextModel.prototype.get = function get () { return this.context; };

// This function takes an array, the name of a mutator method, and the
// arguments to call that mutator method with, and returns an array that
// maps the old indices to their new indices.

// So if you had something like this...
//
//     array = [ 'a', 'b', 'c', 'd' ];
//     array.push( 'e' );
//
// ...you'd get `[ 0, 1, 2, 3 ]` - in other words, none of the old indices
// have changed. If you then did this...
//
//     array.unshift( 'z' );
//
// ...the indices would be `[ 1, 2, 3, 4, 5 ]` - every item has been moved
// one higher to make room for the 'z'. If you removed an item, the new index
// would be -1...
//
//     array.splice( 2, 2 );
//
// ...this would result in [ 0, 1, -1, -1, 2, 3 ].
//
// This information is used to enable fast, non-destructive shuffling of list
// sections when you do e.g. `ractive.splice( 'items', 2, 2 );

function getNewIndices ( length, methodName, args ) {
	var newIndices = [];

	var spliceArguments = getSpliceEquivalent( length, methodName, args );

	if ( !spliceArguments ) {
		return null; // TODO support reverse and sort?
	}

	var balance = ( spliceArguments.length - 2 ) - spliceArguments[1];

	var removeStart = Math.min( length, spliceArguments[0] );
	var removeEnd = removeStart + spliceArguments[1];
	newIndices.startIndex = removeStart;

	var i;
	for ( i = 0; i < removeStart; i += 1 ) {
		newIndices.push( i );
	}

	for ( ; i < removeEnd; i += 1 ) {
		newIndices.push( -1 );
	}

	for ( ; i < length; i += 1 ) {
		newIndices.push( i + balance );
	}

	// there is a net shift for the rest of the array starting with index + balance
	if ( balance !== 0 ) {
		newIndices.touchedFrom = spliceArguments[0];
	} else {
		newIndices.touchedFrom = length;
	}

	return newIndices;
}


// The pop, push, shift an unshift methods can all be represented
// as an equivalent splice
function getSpliceEquivalent ( length, methodName, args ) {
	switch ( methodName ) {
		case 'splice':
			if ( args[0] !== undefined && args[0] < 0 ) {
				args[0] = length + Math.max( args[0], -length );
			}

			if ( args[0] === undefined ) { args[0] = 0; }

			while ( args.length < 2 ) {
				args.push( length - args[0] );
			}

			if ( typeof args[1] !== 'number' ) {
				args[1] = length - args[0];
			}

			// ensure we only remove elements that exist
			args[1] = Math.min( args[1], length - args[0] );

			return args;

		case 'sort':
		case 'reverse':
			return null;

		case 'pop':
			if ( length ) {
				return [ length - 1, 1 ];
			}
			return [ 0, 0 ];

		case 'push':
			return [ length, 0 ].concat( args );

		case 'shift':
			return [ 0, length ? 1 : 0 ];

		case 'unshift':
			return [ 0, 0 ].concat( args );
	}
}

var arrayProto = Array.prototype;

var makeArrayMethod = function ( methodName ) {
	function path ( keypath ) {
		var arguments$1 = arguments;

		var args = [], len = arguments.length - 1;
		while ( len-- > 0 ) { args[ len ] = arguments$1[ len + 1 ]; }

		return model( this.viewmodel.joinAll( splitKeypath( keypath ) ), args );
	}

	function model ( mdl, args ) {
		var array = mdl.get();

		if ( !Array.isArray( array ) ) {
			if ( array === undefined ) {
				array = [];
				var result$1 = arrayProto[ methodName ].apply( array, args );
				var promise$1 = runloop.start( this, true ).then( function () { return result$1; } );
				mdl.set( array );
				runloop.end();
				return promise$1;
			} else {
				throw new Error( ("shuffle array method " + methodName + " called on non-array at " + (mdl.getKeypath())) );
			}
		}

		var newIndices = getNewIndices( array.length, methodName, args );
		var result = arrayProto[ methodName ].apply( array, args );

		var promise = runloop.start( this, true ).then( function () { return result; } );
		promise.result = result;

		if ( newIndices ) {
			mdl.shuffle( newIndices );
		} else {
			mdl.set( result );
		}

		runloop.end();

		return promise;
	}

	return { path: path, model: model };
};

var updateHook = new Hook( 'update' );

function update$1 ( ractive, model, options ) {
	// if the parent is wrapped, the adaptor will need to be updated before
	// updating on this keypath
	if ( model.parent && model.parent.wrapper ) {
		model.parent.adapt();
	}

	var promise = runloop.start( ractive, true );

	model.mark( options && options.force );

	// notify upstream of changes
	model.notifyUpstream();

	runloop.end();

	updateHook.fire( ractive, model );

	return promise;
}

function Ractive$update ( keypath, options ) {
	var opts, path;

	if ( typeof keypath === 'string' ) {
		path = splitKeypath( keypath );
		opts = options;
	} else {
		opts = keypath;
	}

	return update$1( this, path ? this.viewmodel.joinAll( path ) : this.viewmodel, opts );
}

var TEXT              = 1;
var INTERPOLATOR      = 2;
var TRIPLE            = 3;
var SECTION           = 4;
var INVERTED          = 5;
var CLOSING           = 6;
var ELEMENT           = 7;
var PARTIAL           = 8;
var COMMENT           = 9;
var DELIMCHANGE       = 10;
var ANCHOR            = 11;
var ATTRIBUTE         = 13;
var CLOSING_TAG       = 14;
var COMPONENT         = 15;
var YIELDER           = 16;
var INLINE_PARTIAL    = 17;
var DOCTYPE           = 18;
var ALIAS             = 19;

var NUMBER_LITERAL    = 20;
var STRING_LITERAL    = 21;
var ARRAY_LITERAL     = 22;
var OBJECT_LITERAL    = 23;
var BOOLEAN_LITERAL   = 24;
var REGEXP_LITERAL    = 25;

var GLOBAL            = 26;
var KEY_VALUE_PAIR    = 27;


var REFERENCE         = 30;
var REFINEMENT        = 31;
var MEMBER            = 32;
var PREFIX_OPERATOR   = 33;
var BRACKETED         = 34;
var CONDITIONAL       = 35;
var INFIX_OPERATOR    = 36;

var INVOCATION        = 40;

var SECTION_IF        = 50;
var SECTION_UNLESS    = 51;
var SECTION_EACH      = 52;
var SECTION_WITH      = 53;
var SECTION_IF_WITH   = 54;

var ELSE              = 60;
var ELSEIF            = 61;

var EVENT             = 70;
var DECORATOR         = 71;
var TRANSITION        = 72;
var BINDING_FLAG      = 73;
var DELEGATE_FLAG     = 74;

function findElement( start, orComponent, name ) {
	if ( orComponent === void 0 ) { orComponent = true; }

	while ( start && ( start.type !== ELEMENT || ( name && start.name !== name ) ) && ( !orComponent || ( start.type !== COMPONENT && start.type !== ANCHOR ) ) ) {
		// start is a fragment - look at the owner
		if ( start.owner ) { start = start.owner; }
		// start is a component or yielder - look at the container
		else if ( start.component ) { start = start.containerFragment || start.component.parentFragment; }
		// start is an item - look at the parent
		else if ( start.parent ) { start = start.parent; }
		// start is an item without a parent - look at the parent fragment
		else if ( start.parentFragment ) { start = start.parentFragment; }

		else { start = undefined; }
	}

	return start;
}

var modelPush = makeArrayMethod( 'push' ).model;
var modelPop = makeArrayMethod( 'pop' ).model;
var modelShift = makeArrayMethod( 'shift' ).model;
var modelUnshift = makeArrayMethod( 'unshift' ).model;
var modelSort = makeArrayMethod( 'sort' ).model;
var modelSplice = makeArrayMethod( 'splice' ).model;
var modelReverse = makeArrayMethod( 'reverse' ).model;

var ContextData = (function (Model$$1) {
	function ContextData ( options ) {
		Model$$1.call( this, null, null );

		this.isRoot = true;
		this.root = this;
		this.value = {};
		this.ractive = options.ractive;
		this.adaptors = [];
		this.context = options.context;
	}

	if ( Model$$1 ) { ContextData.__proto__ = Model$$1; }
	ContextData.prototype = Object.create( Model$$1 && Model$$1.prototype );
	ContextData.prototype.constructor = ContextData;

	ContextData.prototype.getKeypath = function getKeypath () {
		return '@context.data';
	};

	return ContextData;
}(Model));

var Context = function Context ( fragment, element ) {
	this.fragment = fragment;
	this.element = element || findElement( fragment );
	this.ractive = fragment.ractive;
	this.root = this;
};

var prototypeAccessors = { decorators: {},_data: {} };

prototypeAccessors.decorators.get = function () {
	var items = {};
	if ( !this.element ) { return items; }
	this.element.decorators.forEach( function (d) { return items[ d.name ] = d.intermediary; } );
	return items;
};

prototypeAccessors._data.get = function () {
	return this.model || ( this.root.model = new ContextData({ ractive: this.ractive, context: this.root }) );
};

// the usual mutation suspects
Context.prototype.add = function add ( keypath, d, options ) {
	var num = typeof d === 'number' ? +d : 1;
	var opts = typeof d === 'object' ? d : options;
	return set( this.ractive, build$1( this, keypath, num ).map( function (pair) {
		var model = pair[0];
			var val = pair[1];
		var value = model.get();
		if ( !isNumeric( val ) || !isNumeric( value ) ) { throw new Error( 'Cannot add non-numeric value' ); }
		return [ model, value + val ];
	}), opts );
};

Context.prototype.animate = function animate$$1 ( keypath, value, options ) {
	var model = findModel( this, keypath ).model;
	return animate( this.ractive, model, value, options );
};

// get relative keypaths and values
Context.prototype.get = function get ( keypath ) {
	if ( !keypath ) { return this.fragment.findContext().get( true ); }

	var ref = findModel( this, keypath );
		var model = ref.model;

	return model ? model.get( true ) : undefined;
};

Context.prototype.link = function link ( source, dest ) {
	var there = findModel( this, source ).model;
	var here = findModel( this, dest ).model;
	var promise = runloop.start( this.ractive, true );
	here.link( there, source );
	runloop.end();
	return promise;
};

Context.prototype.observe = function observe ( keypath, callback, options ) {
		if ( options === void 0 ) { options = {}; }

	if ( isObject( keypath ) ) { options = callback || {}; }
	options.fragment = this.fragment;
	return this.ractive.observe( keypath, callback, options );
};

Context.prototype.observeOnce = function observeOnce ( keypath, callback, options ) {
		if ( options === void 0 ) { options = {}; }

	if ( isObject( keypath ) ) { options = callback || {}; }
	options.fragment = this.fragment;
	return this.ractive.observeOnce( keypath, callback, options );
};

Context.prototype.pop = function pop ( keypath ) {
	return modelPop( findModel( this, keypath ).model, [] );
};

Context.prototype.push = function push ( keypath ) {
		var arguments$1 = arguments;

		var values = [], len = arguments.length - 1;
		while ( len-- > 0 ) { values[ len ] = arguments$1[ len + 1 ]; }

	return modelPush( findModel( this, keypath ).model, values );
};

Context.prototype.raise = function raise ( name, event ) {
		var arguments$1 = arguments;

		var args = [], len = arguments.length - 2;
		while ( len-- > 0 ) { args[ len ] = arguments$1[ len + 2 ]; }

	var element = this.element;

	while ( element ) {
		var events = element.events;
		for ( var i = 0; i < events.length; i++ ) {
			var ev = events[i];
			if ( ~ev.template.n.indexOf( name ) ) {
				ev.fire( ev.element.getContext( event ), args );
				return;
			}
		}

		element = element.parent;
	}
};

Context.prototype.readLink = function readLink ( keypath, options ) {
	return this.ractive.readLink( this.resolve( keypath ), options );
};

Context.prototype.resolve = function resolve ( path, ractive ) {
	var ref = findModel( this, path );
		var model = ref.model;
		var instance = ref.instance;
	return model ? model.getKeypath( ractive || instance ) : path;
};

Context.prototype.reverse = function reverse ( keypath ) {
	return modelReverse( findModel( this, keypath ).model, [] );
};

Context.prototype.set = function set$$1 ( keypath, value, options ) {
	return set( this.ractive, build$1( this, keypath, value ), options );
};

Context.prototype.shift = function shift ( keypath ) {
	return modelShift( findModel( this, keypath ).model, [] );
};

Context.prototype.splice = function splice ( keypath, index, drop ) {
		var arguments$1 = arguments;

		var add = [], len = arguments.length - 3;
		while ( len-- > 0 ) { add[ len ] = arguments$1[ len + 3 ]; }

	add.unshift( index, drop );
	return modelSplice( findModel( this, keypath ).model, add );
};

Context.prototype.sort = function sort ( keypath ) {
	return modelSort( findModel( this, keypath ).model, [] );
};

Context.prototype.subtract = function subtract ( keypath, d, options ) {
	var num = typeof d === 'number' ? d : 1;
	var opts = typeof d === 'object' ? d : options;
	return set( this.ractive, build$1( this, keypath, num ).map( function (pair) {
		var model = pair[0];
			var val = pair[1];
		var value = model.get();
		if ( !isNumeric( val ) || !isNumeric( value ) ) { throw new Error( 'Cannot add non-numeric value' ); }
		return [ model, value - val ];
	}), opts );
};

Context.prototype.toggle = function toggle ( keypath, options ) {
	var ref = findModel( this, keypath );
		var model = ref.model;
	return set( this.ractive, [ [ model, !model.get() ] ], options );
};

Context.prototype.unlink = function unlink ( dest ) {
	var here = findModel( this, dest ).model;
	var promise = runloop.start( this.ractive, true );
	if ( here.owner && here.owner._link ) { here.owner.unlink(); }
	runloop.end();
	return promise;
};

Context.prototype.unshift = function unshift ( keypath ) {
		var arguments$1 = arguments;

		var add = [], len = arguments.length - 1;
		while ( len-- > 0 ) { add[ len ] = arguments$1[ len + 1 ]; }

	return modelUnshift( findModel( this, keypath ).model, add );
};

Context.prototype.update = function update$$1 ( keypath, options ) {
	return update$1( this.ractive, findModel( this, keypath ).model, options );
};

Context.prototype.updateModel = function updateModel ( keypath, cascade ) {
	var ref = findModel( this, keypath );
		var model = ref.model;
	var promise = runloop.start( this.ractive, true );
	model.updateFromBindings( cascade );
	runloop.end();
	return promise;
};

// two-way binding related helpers
Context.prototype.isBound = function isBound () {
	var ref = this.getBindingModel( this );
		var model = ref.model;
	return !!model;
};

Context.prototype.getBindingPath = function getBindingPath ( ractive ) {
	var ref = this.getBindingModel( this );
		var model = ref.model;
		var instance = ref.instance;
	if ( model ) { return model.getKeypath( ractive || instance ); }
};

Context.prototype.getBinding = function getBinding () {
	var ref = this.getBindingModel( this );
		var model = ref.model;
	if ( model ) { return model.get( true ); }
};

Context.prototype.getBindingModel = function getBindingModel ( ctx ) {
	var el = ctx.element;
	return { model: el.binding && el.binding.model, instance: el.parentFragment.ractive };
};

Context.prototype.setBinding = function setBinding ( value ) {
	var ref = this.getBindingModel( this );
		var model = ref.model;
	return set( this.ractive, [ [ model, value ] ] );
};

Object.defineProperties( Context.prototype, prototypeAccessors );

Context.forRactive = getRactiveContext;
// circular deps are fun
extern.Context = Context;

// TODO: at some point perhaps this could support relative * keypaths?
function build$1 ( ctx, keypath, value ) {
	var sets = [];

	// set multiple keypaths in one go
	if ( isObject( keypath ) ) {
		for ( var k in keypath ) {
			if ( keypath.hasOwnProperty( k ) ) {
				sets.push( [ findModel( ctx, k ).model, keypath[k] ] );
			}
		}

	}
	// set a single keypath
	else {
		sets.push( [ findModel( ctx, keypath ).model, value ] );
	}

	return sets;
}

function findModel ( ctx, path ) {
	var frag = ctx.fragment;

	if ( typeof path !== 'string' ) {
		return { model: frag.findContext(), instance: path };
	}

	return { model: resolveReference( frag, path ), instance: frag.ractive };
}

function Ractive$fire ( eventName ) {
	var arguments$1 = arguments;

	var args = [], len = arguments.length - 1;
	while ( len-- > 0 ) { args[ len ] = arguments$1[ len + 1 ]; }

	// watch for reproxy
	if ( args[0] instanceof Context ) {
		var proto = args.shift();
		var ctx = Object.create( proto );
		Object.assign( ctx, proto );
		return fireEvent( this, eventName, ctx, args );
	} else {
		return fireEvent( this, eventName, Context.forRactive( this ), args );
	}
}

function Ractive$get ( keypath, opts ) {
	if ( typeof keypath !== 'string' ) { return this.viewmodel.get( true, keypath ); }

	var keys = splitKeypath( keypath );
	var key = keys[0];

	var model;

	if ( !this.viewmodel.has( key ) ) {
		// if this is an inline component, we may need to create
		// an implicit mapping
		if ( this.component && !this.isolated ) {
			model = resolveReference( this.component.parentFragment, key );

			if ( model ) {
				this.viewmodel.map( key, model, { implicit: true } );
			}
		}
	}

	model = this.viewmodel.joinAll( keys );
	return model.get( true, opts );
}

var query = doc && doc.querySelector;

var staticInfo = function( node ) {
	if ( typeof node === 'string' && query ) {
		node = query.call( document, node );
	}

	var instances;
	if ( node ) {
		if ( node._ractive ) {
			return node._ractive.proxy.getContext();
		} else if ( ( instances = node.__ractive_instances__ ) && instances.length === 1 ) {
			return getRactiveContext( instances[0] );
		}
	}
};

function getNodeInfo( node, options ) {
	if ( typeof node === 'string' ) {
		node = this.find( node, options );
	}

	return staticInfo( node );
}

var html   = 'http://www.w3.org/1999/xhtml';
var mathml = 'http://www.w3.org/1998/Math/MathML';
var svg$1    = 'http://www.w3.org/2000/svg';
var xlink  = 'http://www.w3.org/1999/xlink';
var xml    = 'http://www.w3.org/XML/1998/namespace';
var xmlns  = 'http://www.w3.org/2000/xmlns';

var namespaces = { html: html, mathml: mathml, svg: svg$1, xlink: xlink, xml: xml, xmlns: xmlns };

var createElement;
var matches;
var div;
var methodNames;
var unprefixed;
var prefixed;
var i;
var j;
var makeFunction;

// Test for SVG support
if ( !svg ) {
	createElement = function ( type, ns, extend ) {
		if ( ns && ns !== html ) {
			throw 'This browser does not support namespaces other than http://www.w3.org/1999/xhtml. The most likely cause of this error is that you\'re trying to render SVG in an older browser. See http://docs.ractivejs.org/latest/svg-and-older-browsers for more information';
		}

		return extend ?
			doc.createElement( type, extend ) :
			doc.createElement( type );
	};
} else {
	createElement = function ( type, ns, extend ) {
		if ( !ns || ns === html ) {
			return extend ?
				doc.createElement( type, extend ) :
				doc.createElement( type );
		}

		return extend ?
			doc.createElementNS( ns, type, extend ) :
			doc.createElementNS( ns, type );
	};
}

function createDocumentFragment () {
	return doc.createDocumentFragment();
}

function getElement ( input ) {
	var output;

	if ( !input || typeof input === 'boolean' ) { return; }

	if ( !win || !doc || !input ) {
		return null;
	}

	// We already have a DOM node - no work to do. (Duck typing alert!)
	if ( input.nodeType ) {
		return input;
	}

	// Get node from string
	if ( typeof input === 'string' ) {
		// try ID first
		output = doc.getElementById( input );

		// then as selector, if possible
		if ( !output && doc.querySelector ) {
			output = doc.querySelector( input );
		}

		// did it work?
		if ( output && output.nodeType ) {
			return output;
		}
	}

	// If we've been given a collection (jQuery, Zepto etc), extract the first item
	if ( input[0] && input[0].nodeType ) {
		return input[0];
	}

	return null;
}

if ( !isClient ) {
	matches = null;
} else {
	div = createElement( 'div' );
	methodNames = [ 'matches', 'matchesSelector' ];

	makeFunction = function ( methodName ) {
		return function ( node, selector ) {
			return node[ methodName ]( selector );
		};
	};

	i = methodNames.length;

	while ( i-- && !matches ) {
		unprefixed = methodNames[i];

		if ( div[ unprefixed ] ) {
			matches = makeFunction( unprefixed );
		} else {
			j = vendors.length;
			while ( j-- ) {
				prefixed = vendors[i] + unprefixed.substr( 0, 1 ).toUpperCase() + unprefixed.substring( 1 );

				if ( div[ prefixed ] ) {
					matches = makeFunction( prefixed );
					break;
				}
			}
		}
	}

	// IE8...
	if ( !matches ) {
		matches = function ( node, selector ) {
			var parentNode, i;

			parentNode = node.parentNode;

			if ( !parentNode ) {
				// empty dummy <div>
				div.innerHTML = '';

				parentNode = div;
				node = node.cloneNode();

				div.appendChild( node );
			}

			var nodes = parentNode.querySelectorAll( selector );

			i = nodes.length;
			while ( i-- ) {
				if ( nodes[i] === node ) {
					return true;
				}
			}

			return false;
		};
	}
}

function detachNode ( node ) {
	// stupid ie
	if ( node && typeof node.parentNode !== 'unknown' && node.parentNode ) { // eslint-disable-line valid-typeof
		node.parentNode.removeChild( node );
	}

	return node;
}

function safeToStringValue ( value ) {
	return ( value == null || !value.toString ) ? '' : '' + value;
}

function safeAttributeString ( string ) {
	return safeToStringValue( string )
		.replace( /&/g, '&amp;' )
		.replace( /"/g, '&quot;' )
		.replace( /'/g, '&#39;' );
}

var insertHook = new Hook( 'insert' );

function Ractive$insert ( target, anchor ) {
	if ( !this.fragment.rendered ) {
		// TODO create, and link to, documentation explaining this
		throw new Error( 'The API has changed - you must call `ractive.render(target[, anchor])` to render your Ractive instance. Once rendered you can use `ractive.insert()`.' );
	}

	target = getElement( target );
	anchor = getElement( anchor ) || null;

	if ( !target ) {
		throw new Error( 'You must specify a valid target to insert into' );
	}

	target.insertBefore( this.detach(), anchor );
	this.el = target;

	( target.__ractive_instances__ || ( target.__ractive_instances__ = [] ) ).push( this );
	this.isDetached = false;

	fireInsertHook( this );
}

function fireInsertHook( ractive ) {
	insertHook.fire( ractive );

	ractive.findAllComponents('*').forEach( function (child) {
		fireInsertHook( child.instance );
	});
}

function link( there, here, options ) {
	if ( here === there || (there + '.').indexOf( here + '.' ) === 0 || (here + '.').indexOf( there + '.' ) === 0 ) {
		throw new Error( 'A keypath cannot be linked to itself.' );
	}

	var promise = runloop.start();
	var model;
	var target = ( options && options.ractive ) || this;

	// may need to allow a mapping to resolve implicitly
	var sourcePath = splitKeypath( there );
	if ( !target.viewmodel.has( sourcePath[0] ) && target.component ) {
		model = resolveReference( target.component.parentFragment, sourcePath[0] );
		model = model.joinAll( sourcePath.slice( 1 ) );
	}

	this.viewmodel.joinAll( splitKeypath( here ), { lastLink: false } ).link( model || target.viewmodel.joinAll( sourcePath ), there );

	runloop.end();

	return promise;
}

var Observer = function Observer ( ractive, model, callback, options ) {
	this.context = options.context || ractive;
	this.callback = callback;
	this.ractive = ractive;
	this.keypath = options.keypath;
	this.options = options;

	if ( model ) { this.resolved( model ); }

	if ( typeof options.old === 'function' ) {
		this.oldContext = Object.create( ractive );
		this.old = options.old;
	} else {
		this.old = old;
	}

	if ( options.init !== false ) {
		this.dirty = true;
		this.dispatch();
	} else {
		this.oldValue = this.old.call( this.oldContext, undefined, this.newValue );
	}

	this.dirty = false;
};

Observer.prototype.cancel = function cancel () {
	this.cancelled = true;
	if ( this.model ) {
		this.model.unregister( this );
	} else {
		this.resolver.unbind();
	}
	removeFromArray( this.ractive._observers, this );
};

Observer.prototype.dispatch = function dispatch () {
	if ( !this.cancelled ) {
		this.callback.call( this.context, this.newValue, this.oldValue, this.keypath );
		this.oldValue = this.old.call( this.oldContext, this.oldValue, this.model ? this.model.get() : this.newValue );
		this.dirty = false;
	}
};

Observer.prototype.handleChange = function handleChange () {
		var this$1 = this;

	if ( !this.dirty ) {
		var newValue = this.model.get();
		if ( isEqual( newValue, this.oldValue ) ) { return; }

		this.newValue = newValue;

		if ( this.options.strict && this.newValue === this.oldValue ) { return; }

		runloop.addObserver( this, this.options.defer );
		this.dirty = true;

		if ( this.options.once ) { runloop.scheduleTask( function () { return this$1.cancel(); } ); }
	}
};

Observer.prototype.rebind = function rebind ( next, previous ) {
		var this$1 = this;

	next = rebindMatch( this.keypath, next, previous );
	// TODO: set up a resolver if next is undefined?
	if ( next === this.model ) { return false; }

	if ( this.model ) { this.model.unregister( this ); }
	if ( next ) { next.addShuffleTask( function () { return this$1.resolved( next ); } ); }
};

Observer.prototype.resolved = function resolved ( model ) {
	this.model = model;

	this.oldValue = undefined;
	this.newValue = model.get();

	model.register( this );
};

function old ( previous, next ) {
	return next;
}

var star$1 = /\*+/g;

var PatternObserver = function PatternObserver ( ractive, baseModel, keys, callback, options ) {
	var this$1 = this;

	this.context = options.context || ractive;
	this.ractive = ractive;
	this.baseModel = baseModel;
	this.keys = keys;
	this.callback = callback;

	var pattern = keys.join( '\\.' ).replace( star$1, '(.+)' );
	var baseKeypath = this.baseKeypath = baseModel.getKeypath( ractive );
	this.pattern = new RegExp( ("^" + (baseKeypath ? baseKeypath + '\\.' : '') + pattern + "$") );
	this.recursive = keys.length === 1 && keys[0] === '**';
	if ( this.recursive ) { this.keys = [ '*' ]; }

	this.oldValues = {};
	this.newValues = {};

	this.defer = options.defer;
	this.once = options.once;
	this.strict = options.strict;

	this.dirty = false;
	this.changed = [];
	this.partial = false;
	this.links = options.links;

	var models = baseModel.findMatches( this.keys );

	models.forEach( function (model) {
		this$1.newValues[ model.getKeypath( this$1.ractive ) ] = model.get();
	});

	if ( options.init !== false ) {
		this.dispatch();
	} else {
		this.oldValues = this.newValues;
	}

	baseModel.registerPatternObserver( this );
};

PatternObserver.prototype.cancel = function cancel () {
	this.baseModel.unregisterPatternObserver( this );
	removeFromArray( this.ractive._observers, this );
};

PatternObserver.prototype.dispatch = function dispatch () {
		var this$1 = this;

	var newValues = this.newValues;
	this.newValues = {};
	Object.keys( newValues ).forEach( function (keypath) {
		if ( this$1.newKeys && !this$1.newKeys[ keypath ] ) { return; }

		var newValue = newValues[ keypath ];
		var oldValue = this$1.oldValues[ keypath ];

		if ( this$1.strict && newValue === oldValue ) { return; }
		if ( isEqual( newValue, oldValue ) ) { return; }

		var args = [ newValue, oldValue, keypath ];
		if ( keypath ) {
			var wildcards = this$1.pattern.exec( keypath );
			if ( wildcards ) {
				args = args.concat( wildcards.slice( 1 ) );
			}
		}

		this$1.callback.apply( this$1.context, args );
	});

	if ( this.partial ) {
		for ( var k in newValues ) {
			this$1.oldValues[k] = newValues[k];
		}
	} else {
		this.oldValues = newValues;
	}

	this.newKeys = null;
	this.dirty = false;
};

PatternObserver.prototype.notify = function notify ( key ) {
	this.changed.push( key );
};

PatternObserver.prototype.shuffle = function shuffle ( newIndices ) {
		var this$1 = this;

	if ( !Array.isArray( this.baseModel.value ) ) { return; }

	var base = this.baseKeypath = this.baseModel.getKeypath( this.ractive );
	var max = this.baseModel.value.length;
	var suffix = this.keys.length > 1 ? '.' + this.keys.slice( 1 ).join( '.' ) : '';

	this.newKeys = {};
	for ( var i = 0; i < newIndices.length; i++ ) {
		if ( newIndices[ i ] === -1 || newIndices[ i ] === i ) { continue; }
		this$1.newKeys[ (base + "." + i + suffix) ] = true;
	}

	for ( var i$1 = newIndices.touchedFrom; i$1 < max; i$1++ ) {
		this$1.newKeys[ (base + "." + i$1 + suffix) ] = true;
	}
};

PatternObserver.prototype.handleChange = function handleChange () {
		var this$1 = this;

	if ( !this.dirty || this.changed.length ) {
		if ( !this.dirty ) { this.newValues = {}; }

		if ( !this.changed.length ) {
			this.baseModel.findMatches( this.keys ).forEach( function (model) {
				var keypath = model.getKeypath( this$1.ractive );
				this$1.newValues[ keypath ] = model.get();
			});
			this.partial = false;
		} else {
			var count = 0;

			if ( this.recursive ) {
				this.changed.forEach( function (keys) {
					var model = this$1.baseModel.joinAll( keys );
					if ( model.isLink && !this$1.links ) { return; }
					count++;
					this$1.newValues[ model.getKeypath( this$1.ractive ) ] = model.get();
				});
			} else {
				var ok = this.baseModel.isRoot ?
					this.changed.map( function (keys) { return keys.map( escapeKey ).join( '.' ); } ) :
					this.changed.map( function (keys) { return this$1.baseKeypath + '.' + keys.map( escapeKey ).join( '.' ); } );

				this.baseModel.findMatches( this.keys ).forEach( function (model) {
					var keypath = model.getKeypath( this$1.ractive );
					var check = function (k) {
						return ( k.indexOf( keypath ) === 0 && ( k.length === keypath.length || k[ keypath.length ] === '.' ) ) ||
							( keypath.indexOf( k ) === 0 && ( k.length === keypath.length || keypath[ k.length ] === '.' ) );

					};

					// is this model on a changed keypath?
					if ( ok.filter( check ).length ) {
						count++;
						this$1.newValues[ keypath ] = model.get();
					}
				});
			}

			// no valid change triggered, so bail to avoid breakage
			if ( !count ) { return; }

			this.partial = true;
		}

		runloop.addObserver( this, this.defer );
		this.dirty = true;
		this.changed.length = 0;

		if ( this.once ) { this.cancel(); }
	}
};

function negativeOne () {
	return -1;
}

var ArrayObserver = function ArrayObserver ( ractive, model, callback, options ) {
	this.ractive = ractive;
	this.model = model;
	this.keypath = model.getKeypath();
	this.callback = callback;
	this.options = options;

	this.pending = null;

	model.register( this );

	if ( options.init !== false ) {
		this.sliced = [];
		this.shuffle([]);
		this.dispatch();
	} else {
		this.sliced = this.slice();
	}
};

ArrayObserver.prototype.cancel = function cancel () {
	this.model.unregister( this );
	removeFromArray( this.ractive._observers, this );
};

ArrayObserver.prototype.dispatch = function dispatch () {
	this.callback( this.pending );
	this.pending = null;
	if ( this.options.once ) { this.cancel(); }
};

ArrayObserver.prototype.handleChange = function handleChange () {
	if ( this.pending ) {
		// post-shuffle
		runloop.addObserver( this, this.options.defer );
	} else {
		// entire array changed
		this.shuffle( this.sliced.map( negativeOne ) );
		this.handleChange();
	}
};

ArrayObserver.prototype.shuffle = function shuffle ( newIndices ) {
		var this$1 = this;

	var newValue = this.slice();

	var inserted = [];
	var deleted = [];
	var start;

	var hadIndex = {};

	newIndices.forEach( function ( newIndex, oldIndex ) {
		hadIndex[ newIndex ] = true;

		if ( newIndex !== oldIndex && start === undefined ) {
			start = oldIndex;
		}

		if ( newIndex === -1 ) {
			deleted.push( this$1.sliced[ oldIndex ] );
		}
	});

	if ( start === undefined ) { start = newIndices.length; }

	var len = newValue.length;
	for ( var i = 0; i < len; i += 1 ) {
		if ( !hadIndex[i] ) { inserted.push( newValue[i] ); }
	}

	this.pending = { inserted: inserted, deleted: deleted, start: start };
	this.sliced = newValue;
};

ArrayObserver.prototype.slice = function slice () {
	var value = this.model.get();
	return Array.isArray( value ) ? value.slice() : [];
};

function observe ( keypath, callback, options ) {
	var this$1 = this;

	var observers = [];
	var map;
	var opts;

	if ( isObject( keypath ) ) {
		map = keypath;
		opts = callback || {};
	} else {
		if ( typeof keypath === 'function' ) {
			map = { '': keypath };
			opts = callback || {};
		} else {
			map = {};
			map[ keypath ] = callback;
			opts = options || {};
		}
	}

	var silent = false;
	Object.keys( map ).forEach( function (keypath) {
		var callback = map[ keypath ];
		var caller = function () {
			var arguments$1 = arguments;

			var args = [], len = arguments.length;
			while ( len-- ) { args[ len ] = arguments$1[ len ]; }

			if ( silent ) { return; }
			return callback.apply( this, args );
		};

		var keypaths = keypath.split( ' ' );
		if ( keypaths.length > 1 ) { keypaths = keypaths.filter( function (k) { return k; } ); }

		keypaths.forEach( function (keypath) {
			opts.keypath = keypath;
			var observer = createObserver( this$1, keypath, caller, opts );
			if ( observer ) { observers.push( observer ); }
		});
	});

	// add observers to the Ractive instance, so they can be
	// cancelled on ractive.teardown()
	this._observers.push.apply( this._observers, observers );

	return {
		cancel: function () { return observers.forEach( function (o) { return o.cancel(); } ); },
		isSilenced: function () { return silent; },
		silence: function () { return silent = true; },
		resume: function () { return silent = false; }
	};
}

function createObserver ( ractive, keypath, callback, options ) {
	var keys = splitKeypath( keypath );
	var wildcardIndex = keys.indexOf( '*' );
	if ( !~wildcardIndex ) { wildcardIndex = keys.indexOf( '**' ); }

	options.fragment = options.fragment || ractive.fragment;

	var model;
	if ( !options.fragment ) {
		model = ractive.viewmodel.joinKey( keys[0] );
	} else {
		// .*.whatever relative wildcard is a special case because splitkeypath doesn't handle the leading .
		if ( ~keys[0].indexOf( '.*' ) ) {
			model = options.fragment.findContext();
			wildcardIndex = 0;
			keys[0] = keys[0].slice( 1 );
		} else {
			model = wildcardIndex === 0 ? options.fragment.findContext() : resolveReference( options.fragment, keys[0] );
		}
	}

	// the model may not exist key
	if ( !model ) { model = ractive.viewmodel.joinKey( keys[0] ); }

	if ( !~wildcardIndex ) {
		model = model.joinAll( keys.slice( 1 ) );
		if ( options.array ) {
			return new ArrayObserver( ractive, model, callback, options );
		} else {
			return new Observer( ractive, model, callback, options );
		}
	} else {
		var double = keys.indexOf( '**' );
		if ( ~double ) {
			if ( double + 1 !== keys.length || ~keys.indexOf( '*' ) ) {
				warnOnceIfDebug( "Recursive observers may only specify a single '**' at the end of the path." );
				return;
			}
		}

		model = model.joinAll( keys.slice( 1, wildcardIndex ) );

		return new PatternObserver( ractive, model, keys.slice( wildcardIndex ), callback, options );
	}
}

var onceOptions = { init: false, once: true };

function observeOnce ( keypath, callback, options ) {
	if ( isObject( keypath ) || typeof keypath === 'function' ) {
		options = Object.assign( callback || {}, onceOptions );
		return this.observe( keypath, options );
	}

	options = Object.assign( options || {}, onceOptions );
	return this.observe( keypath, callback, options );
}

var trim = function (str) { return str.trim(); };

var notEmptyString = function (str) { return str !== ''; };

function Ractive$off ( eventName, callback ) {
	var this$1 = this;

	// if no event is specified, remove _all_ event listeners
	if ( !eventName ) {
		this._subs = {};
	} else {
		// Handle multiple space-separated event names
		var eventNames = eventName.split( ' ' ).map( trim ).filter( notEmptyString );

		eventNames.forEach( function (event) {
			var subs = this$1._subs[ event ];
			// if given a specific callback to remove, remove only it
			if ( subs && callback ) {
				var entry = subs.find( function (s) { return s.callback === callback; } );
				if ( entry ) {
					removeFromArray( subs, entry );
					entry.off = true;

					if ( event.indexOf( '.' ) ) { this$1._nsSubs--; }
				}
			}

			// otherwise, remove all listeners for this event
			else if ( subs ) {
				if ( event.indexOf( '.' ) ) { this$1._nsSubs -= subs.length; }
				subs.length = 0;
			}
		});
	}

	return this;
}

function Ractive$on ( eventName, callback ) {
	var this$1 = this;

	// eventName may already be a map
	var map = typeof eventName === 'object' ? eventName : {};
	// or it may be a string along with a callback
	if ( typeof eventName === 'string' ) { map[ eventName ] = callback; }

	var silent = false;
	var events = [];

	var loop = function ( k ) {
		var callback$1 = map[k];
		var caller = function () {
			var arguments$1 = arguments;

			var args = [], len = arguments.length;
			while ( len-- ) { args[ len ] = arguments$1[ len ]; }

			if ( !silent ) { return callback$1.apply( this, args ); }
		};
		var entry = {
			callback: callback$1,
			handler: caller
		};

		if ( map.hasOwnProperty( k ) ) {
			var names = k.split( ' ' ).map( trim ).filter( notEmptyString );
			names.forEach( function (n) {
				( this$1._subs[ n ] || ( this$1._subs[ n ] = [] ) ).push( entry );
				if ( n.indexOf( '.' ) ) { this$1._nsSubs++; }
				events.push( [ n, entry ] );
			});
		}
	};

	for ( var k in map ) { loop( k ); }

	return {
		cancel: function () { return events.forEach( function (e) { return this$1.off( e[0], e[1].callback ); } ); },
		isSilenced: function () { return silent; },
		silence: function () { return silent = true; },
		resume: function () { return silent = false; }
	};
}

function Ractive$once ( eventName, handler ) {
	var listener = this.on( eventName, function () {
		handler.apply( this, arguments );
		listener.cancel();
	});

	// so we can still do listener.cancel() manually
	return listener;
}

var pop = makeArrayMethod( 'pop' ).path;

var push = makeArrayMethod( 'push' ).path;

function readLink ( keypath, options ) {
	if ( options === void 0 ) { options = {}; }

	var path = splitKeypath( keypath );

	if ( this.viewmodel.has( path[0] ) ) {
		var model = this.viewmodel.joinAll( path );

		if ( !model.isLink ) { return; }

		while ( ( model = model.target ) && options.canonical !== false ) {
			if ( !model.isLink ) { break; }
		}

		if ( model ) { return { ractive: model.root.ractive, keypath: model.getKeypath() }; }
	}
}

var PREFIX = '/* Ractive.js component styles */';

// Holds current definitions of styles.
var styleDefinitions = [];

// Flag to tell if we need to update the CSS
var isDirty = false;

// These only make sense on the browser. See additional setup below.
var styleElement = null;
var useCssText = null;

function addCSS( styleDefinition ) {
	styleDefinitions.push( styleDefinition );
	isDirty = true;
}

function applyCSS() {

	// Apply only seems to make sense when we're in the DOM. Server-side renders
	// can call toCSS to get the updated CSS.
	if ( !doc || !isDirty ) { return; }

	if ( useCssText ) {
		styleElement.styleSheet.cssText = getCSS( null );
	} else {
		styleElement.innerHTML = getCSS( null );
	}

	isDirty = false;
}

function getCSS( cssIds ) {

	var filteredStyleDefinitions = cssIds ? styleDefinitions.filter( function (style) { return ~cssIds.indexOf( style.id ); } ) : styleDefinitions;

	return filteredStyleDefinitions.reduce( function ( styles, style ) { return (styles + "\n\n/* {" + (style.id) + "} */\n" + (style.styles)); }, PREFIX );

}

// If we're on the browser, additional setup needed.
if ( doc && ( !styleElement || !styleElement.parentNode ) ) {

	styleElement = doc.createElement( 'style' );
	styleElement.type = 'text/css';

	doc.getElementsByTagName( 'head' )[ 0 ].appendChild( styleElement );

	useCssText = !!styleElement.styleSheet;
}

function fillGaps ( target ) {
	var arguments$1 = arguments;

	var sources = [], len = arguments.length - 1;
	while ( len-- > 0 ) { sources[ len ] = arguments$1[ len + 1 ]; }


	for (var i = 0; i < sources.length; i++){
		var source = sources[i];
		for ( var key in source ) {
			// Source can be a prototype-less object.
			if ( key in target || !Object.prototype.hasOwnProperty.call( source, key ) ) { continue; }
			target[ key ] = source[ key ];
		}
	}

	return target;
}

function toPairs ( obj ) {
	if ( obj === void 0 ) { obj = {}; }

	var pairs = [];
	for ( var key in obj ) {
		// Source can be a prototype-less object.
		if ( !Object.prototype.hasOwnProperty.call( obj, key ) ) { continue; }
		pairs.push( [ key, obj[ key ] ] );
	}
	return pairs;
}

var adaptConfigurator = {
	extend: function ( Parent, proto, options ) {
		proto.adapt = combine( proto.adapt, ensureArray( options.adapt ) );
	},

	init: function init () {}
};

var remove = /\/\*(?:[\s\S]*?)\*\//g;
var escape = /url\(\s*(['"])(?:\\[\s\S]|(?!\1).)*\1\s*\)|url\((?:\\[\s\S]|[^)])*\)|(['"])(?:\\[\s\S]|(?!\2).)*\2/gi;
var value = /\0(\d+)/g;

// Removes comments and strings from the given CSS to make it easier to parse.
// Callback receives the cleaned CSS and a function which can be used to put
// the removed strings back in place after parsing is done.
var cleanCss = function ( css, callback, additionalReplaceRules ) {
	if ( additionalReplaceRules === void 0 ) { additionalReplaceRules = []; }

	var values = [];
	var reconstruct = function (css) { return css.replace( value, function ( match, n ) { return values[ n ]; } ); };
	css = css.replace( escape, function (match) { return ("\u0000" + (values.push( match ) - 1)); }).replace( remove, '' );

	additionalReplaceRules.forEach( function ( pattern ) {
		css = css.replace( pattern, function (match) { return ("\u0000" + (values.push( match ) - 1)); } );
	});

	return callback( css, reconstruct );
};

var selectorsPattern = /(?:^|\}|\{)\s*([^\{\}\0]+)\s*(?=\{)/g;
var keyframesDeclarationPattern = /@keyframes\s+[^\{\}]+\s*\{(?:[^{}]+|\{[^{}]+})*}/gi;
var selectorUnitPattern = /((?:(?:\[[^\]]+\])|(?:[^\s\+\>~:]))+)((?:::?[^\s\+\>\~\(:]+(?:\([^\)]+\))?)*\s*[\s\+\>\~]?)\s*/g;
var excludePattern = /^(?:@|\d+%)/;
var dataRvcGuidPattern = /\[data-ractive-css~="\{[a-z0-9-]+\}"]/g;

function trim$1 ( str ) {
	return str.trim();
}

function extractString ( unit ) {
	return unit.str;
}

function transformSelector ( selector, parent ) {
	var selectorUnits = [];
	var match;

	while ( match = selectorUnitPattern.exec( selector ) ) {
		selectorUnits.push({
			str: match[0],
			base: match[1],
			modifiers: match[2]
		});
	}

	// For each simple selector within the selector, we need to create a version
	// that a) combines with the id, and b) is inside the id
	var base = selectorUnits.map( extractString );

	var transformed = [];
	var i = selectorUnits.length;

	while ( i-- ) {
		var appended = base.slice();

		// Pseudo-selectors should go after the attribute selector
		var unit = selectorUnits[i];
		appended[i] = unit.base + parent + unit.modifiers || '';

		var prepended = base.slice();
		prepended[i] = parent + ' ' + prepended[i];

		transformed.push( appended.join( ' ' ), prepended.join( ' ' ) );
	}

	return transformed.join( ', ' );
}

function transformCss ( css, id ) {
	var dataAttr = "[data-ractive-css~=\"{" + id + "}\"]";

	var transformed;

	if ( dataRvcGuidPattern.test( css ) ) {
		transformed = css.replace( dataRvcGuidPattern, dataAttr );
	} else {
		transformed = cleanCss( css, function ( css, reconstruct ) {
			css = css.replace( selectorsPattern, function ( match, $1 ) {
				// don't transform at-rules and keyframe declarations
				if ( excludePattern.test( $1 ) ) { return match; }

				var selectors = $1.split( ',' ).map( trim$1 );
				var transformed = selectors
					.map( function (selector) { return transformSelector( selector, dataAttr ); } )
					.join( ', ' ) + ' ';

				return match.replace( $1, transformed );
			});

			return reconstruct( css );
		}, [ keyframesDeclarationPattern ]);
	}

	return transformed;
}

function s4() {
	return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}

function uuid() {
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

var hasCurly = /\{/;
var cssConfigurator = {
	name: 'css',

	// Called when creating a new component definition
	extend: function ( Parent, proto, options ) {
		if ( !options.css ) { return; }
		var css = typeof options.css === 'string' && !hasCurly.test( options.css ) ?
			( getElement( options.css ) || options.css ) :
			options.css;

		var id = options.cssId || uuid();

		if ( typeof css === 'object' ) {
			css = 'textContent' in css ? css.textContent : css.innerHTML;
		}

		if ( !css ) { return; }

		var styles = options.noCssTransform ? css : transformCss( css, id );

		proto.cssId = id;

		addCSS( { id: id, styles: styles } );
	},

	// Called when creating a new component instance
	init: function ( Parent, target, options ) {
		if ( !options.css ) { return; }

		warnIfDebug( "\nThe css option is currently not supported on a per-instance basis and will be discarded. Instead, we recommend instantiating from a component definition with a css option.\n\nconst Component = Ractive.extend({\n\t...\n\tcss: '/* your css */',\n\t...\n});\n\nconst componentInstance = new Component({ ... })\n\t\t" );
	}

};

function validate ( data ) {
	// Warn if userOptions.data is a non-POJO
	if ( data && data.constructor !== Object ) {
		if ( typeof data === 'function' ) {
			// TODO do we need to support this in the new Ractive() case?
		} else if ( typeof data !== 'object' ) {
			fatal( ("data option must be an object or a function, `" + data + "` is not valid") );
		} else {
			warnIfDebug( 'If supplied, options.data should be a plain JavaScript object - using a non-POJO as the root object may work, but is discouraged' );
		}
	}
}

var dataConfigurator = {
	name: 'data',

	extend: function ( Parent, proto, options ) {
		var key;
		var value;

		// check for non-primitives, which could cause mutation-related bugs
		if ( options.data && isObject( options.data ) ) {
			for ( key in options.data ) {
				value = options.data[ key ];

				if ( value && typeof value === 'object' ) {
					if ( isObject( value ) || Array.isArray( value ) ) {
						warnIfDebug( "Passing a `data` option with object and array properties to Ractive.extend() is discouraged, as mutating them is likely to cause bugs. Consider using a data function instead:\n\n  // this...\n  data: function () {\n    return {\n      myObject: {}\n    };\n  })\n\n  // instead of this:\n  data: {\n    myObject: {}\n  }" );
					}
				}
			}
		}

		proto.data = combine$1( proto.data, options.data );
	},

	init: function ( Parent, ractive, options ) {
		var result = combine$1( Parent.prototype.data, options.data );

		if ( typeof result === 'function' ) { result = result.call( ractive ); }

		// bind functions to the ractive instance at the top level,
		// unless it's a non-POJO (in which case alarm bells should ring)
		if ( result && result.constructor === Object ) {
			for ( var prop in result ) {
				if ( typeof result[ prop ] === 'function' ) {
					var value = result[ prop ];
					result[ prop ] = bind$1( value, ractive );
					result[ prop ]._r_unbound = value;
				}
			}
		}

		return result || {};
	},

	reset: function reset ( ractive ) {
		var result = this.init( ractive.constructor, ractive, ractive.viewmodel );
		ractive.viewmodel.root.set( result );
		return true;
	}
};

function combine$1 ( parentValue, childValue ) {
	validate( childValue );

	var parentIsFn = typeof parentValue === 'function';
	var childIsFn = typeof childValue === 'function';

	// Very important, otherwise child instance can become
	// the default data object on Ractive or a component.
	// then ractive.set() ends up setting on the prototype!
	if ( !childValue && !parentIsFn ) {
		childValue = {};
	}

	// Fast path, where we just need to copy properties from
	// parent to child
	if ( !parentIsFn && !childIsFn ) {
		return fromProperties( childValue, parentValue );
	}

	return function () {
		var child = childIsFn ? callDataFunction( childValue, this ) : childValue;
		var parent = parentIsFn ? callDataFunction( parentValue, this ) : parentValue;

		return fromProperties( child, parent );
	};
}

function callDataFunction ( fn, context ) {
	var data = fn.call( context );

	if ( !data ) { return; }

	if ( typeof data !== 'object' ) {
		fatal( 'Data function must return an object' );
	}

	if ( data.constructor !== Object ) {
		warnOnceIfDebug( 'Data function returned something other than a plain JavaScript object. This might work, but is strongly discouraged' );
	}

	return data;
}

function fromProperties ( primary, secondary ) {
	if ( primary && secondary ) {
		for ( var key in secondary ) {
			if ( !( key in primary ) ) {
				primary[ key ] = secondary[ key ];
			}
		}

		return primary;
	}

	return primary || secondary;
}

var TEMPLATE_VERSION = 4;

var pattern = /\$\{([^\}]+)\}/g;

function fromExpression ( body, length ) {
	if ( length === void 0 ) { length = 0; }

	var args = new Array( length );

	while ( length-- ) {
		args[length] = "_" + length;
	}

	// Functions created directly with new Function() look like this:
	//     function anonymous (_0 /**/) { return _0*2 }
	//
	// With this workaround, we get a little more compact:
	//     function (_0){return _0*2}
	return new Function( [], ("return function (" + (args.join(',')) + "){return(" + body + ");};") )();
}

function fromComputationString ( str, bindTo ) {
	var hasThis;

	var functionBody = 'return (' + str.replace( pattern, function ( match, keypath ) {
		hasThis = true;
		return ("__ractive.get(\"" + keypath + "\")");
	}) + ');';

	if ( hasThis ) { functionBody = "var __ractive = this; " + functionBody; }
	var fn = new Function( functionBody );
	return hasThis ? fn.bind( bindTo ) : fn;
}

var functions = Object.create( null );

function getFunction ( str, i ) {
	if ( functions[ str ] ) { return functions[ str ]; }
	return functions[ str ] = createFunction( str, i );
}

function addFunctions( template ) {
	if ( !template ) { return; }

	var exp = template.e;

	if ( !exp ) { return; }

	Object.keys( exp ).forEach( function ( str ) {
		if ( functions[ str ] ) { return; }
		functions[ str ] = exp[ str ];
	});
}

var leadingWhitespace = /^\s+/;

var ParseError = function ( message ) {
	this.name = 'ParseError';
	this.message = message;
	try {
		throw new Error(message);
	} catch (e) {
		this.stack = e.stack;
	}
};

ParseError.prototype = Error.prototype;

var Parser = function ( str, options ) {
	var item;
	var lineStart = 0;

	this.str = str;
	this.options = options || {};
	this.pos = 0;

	this.lines = this.str.split( '\n' );
	this.lineEnds = this.lines.map( function (line) {
		var lineEnd = lineStart + line.length + 1; // +1 for the newline

		lineStart = lineEnd;
		return lineEnd;
	}, 0 );

	// Custom init logic
	if ( this.init ) { this.init( str, options ); }

	var items = [];

	while ( ( this.pos < this.str.length ) && ( item = this.read() ) ) {
		items.push( item );
	}

	this.leftover = this.remaining();
	this.result = this.postProcess ? this.postProcess( items, options ) : items;
};

Parser.prototype = {
	read: function read ( converters ) {
		var this$1 = this;

		var i, item;

		if ( !converters ) { converters = this.converters; }

		var pos = this.pos;

		var len = converters.length;
		for ( i = 0; i < len; i += 1 ) {
			this$1.pos = pos; // reset for each attempt

			if ( item = converters[i]( this$1 ) ) {
				return item;
			}
		}

		return null;
	},

	getContextMessage: function getContextMessage ( pos, message ) {
		var ref = this.getLinePos( pos );
		var lineNum = ref[0];
		var columnNum = ref[1];
		if ( this.options.contextLines === -1 ) {
			return [ lineNum, columnNum, (message + " at line " + lineNum + " character " + columnNum) ];
		}

		var line = this.lines[ lineNum - 1 ];

		var contextUp = '';
		var contextDown = '';
		if ( this.options.contextLines ) {
			var start = lineNum - 1 - this.options.contextLines < 0 ? 0 : lineNum - 1 - this.options.contextLines;
			contextUp = this.lines.slice( start, lineNum - 1 - start ).join( '\n' ).replace( /\t/g, '  ' );
			contextDown = this.lines.slice( lineNum, lineNum + this.options.contextLines ).join( '\n' ).replace( /\t/g, '  ' );
			if ( contextUp ) {
				contextUp += '\n';
			}
			if ( contextDown ) {
				contextDown = '\n' + contextDown;
			}
		}

		var numTabs = 0;
		var annotation = contextUp + line.replace( /\t/g, function ( match, char ) {
			if ( char < columnNum ) {
				numTabs += 1;
			}

			return '  ';
		}) + '\n' + new Array( columnNum + numTabs ).join( ' ' ) + '^----' + contextDown;

		return [ lineNum, columnNum, (message + " at line " + lineNum + " character " + columnNum + ":\n" + annotation) ];
	},

	getLinePos: function getLinePos ( char ) {
		var this$1 = this;

		var lineNum = 0;
		var lineStart = 0;

		while ( char >= this.lineEnds[ lineNum ] ) {
			lineStart = this$1.lineEnds[ lineNum ];
			lineNum += 1;
		}

		var columnNum = char - lineStart;
		return [ lineNum + 1, columnNum + 1, char ]; // line/col should be one-based, not zero-based!
	},

	error: function error ( message ) {
		var ref = this.getContextMessage( this.pos, message );
		var lineNum = ref[0];
		var columnNum = ref[1];
		var msg = ref[2];

		var error = new ParseError( msg );

		error.line = lineNum;
		error.character = columnNum;
		error.shortMessage = message;

		throw error;
	},

	matchString: function matchString ( string ) {
		if ( this.str.substr( this.pos, string.length ) === string ) {
			this.pos += string.length;
			return string;
		}
	},

	matchPattern: function matchPattern ( pattern ) {
		var match;

		if ( match = pattern.exec( this.remaining() ) ) {
			this.pos += match[0].length;
			return match[1] || match[0];
		}
	},

	allowWhitespace: function allowWhitespace () {
		this.matchPattern( leadingWhitespace );
	},

	remaining: function remaining () {
		return this.str.substring( this.pos );
	},

	nextChar: function nextChar () {
		return this.str.charAt( this.pos );
	},

	warn: function warn$$1 ( message ) {
		var msg = this.getContextMessage( this.pos, message )[2];

		warnIfDebug( msg );
	}
};

Parser.extend = function ( proto ) {
	var Parent = this;
	var Child = function ( str, options ) {
		Parser.call( this, str, options );
	};

	Child.prototype = Object.create( Parent.prototype );

	for ( var key in proto ) {
		if ( proto.hasOwnProperty( key ) ) {
			Child.prototype[ key ] = proto[ key ];
		}
	}

	Child.extend = Parser.extend;
	return Child;
};

var delimiterChangePattern = /^[^\s=]+/;
var whitespacePattern = /^\s+/;

function readDelimiterChange ( parser ) {
	if ( !parser.matchString( '=' ) ) {
		return null;
	}

	var start = parser.pos;

	// allow whitespace before new opening delimiter
	parser.allowWhitespace();

	var opening = parser.matchPattern( delimiterChangePattern );
	if ( !opening ) {
		parser.pos = start;
		return null;
	}

	// allow whitespace (in fact, it's necessary...)
	if ( !parser.matchPattern( whitespacePattern ) ) {
		return null;
	}

	var closing = parser.matchPattern( delimiterChangePattern );
	if ( !closing ) {
		parser.pos = start;
		return null;
	}

	// allow whitespace before closing '='
	parser.allowWhitespace();

	if ( !parser.matchString( '=' ) ) {
		parser.pos = start;
		return null;
	}

	return [ opening, closing ];
}

var regexpPattern = /^(\/(?:[^\n\r\u2028\u2029/\\[]|\\.|\[(?:[^\n\r\u2028\u2029\]\\]|\\.)*])+\/(?:([gimuy])(?![a-z]*\2))*(?![a-zA-Z_$0-9]))/;

function readNumberLiteral ( parser ) {
	var result;

	if ( result = parser.matchPattern( regexpPattern ) ) {
		return {
			t: REGEXP_LITERAL,
			v: result
		};
	}

	return null;
}

var pattern$1 = /[-/\\^$*+?.()|[\]{}]/g;

function escapeRegExp ( str ) {
	return str.replace( pattern$1, '\\$&' );
}

var regExpCache = {};

var getLowestIndex = function ( haystack, needles ) {
	return haystack.search( regExpCache[needles.join()] || ( regExpCache[needles.join()] = new RegExp( needles.map( escapeRegExp ).join( '|' ) ) ) );
};

// https://github.com/kangax/html-minifier/issues/63#issuecomment-37763316
var booleanAttributes = /^(allowFullscreen|async|autofocus|autoplay|checked|compact|controls|declare|default|defaultChecked|defaultMuted|defaultSelected|defer|disabled|enabled|formNoValidate|hidden|indeterminate|inert|isMap|itemScope|loop|multiple|muted|noHref|noResize|noShade|noValidate|noWrap|open|pauseOnExit|readOnly|required|reversed|scoped|seamless|selected|sortable|translate|trueSpeed|typeMustMatch|visible)$/i;
var voidElementNames = /^(?:area|base|br|col|command|doctype|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/i;

var htmlEntities = { quot: 34, amp: 38, apos: 39, lt: 60, gt: 62, nbsp: 160, iexcl: 161, cent: 162, pound: 163, curren: 164, yen: 165, brvbar: 166, sect: 167, uml: 168, copy: 169, ordf: 170, laquo: 171, not: 172, shy: 173, reg: 174, macr: 175, deg: 176, plusmn: 177, sup2: 178, sup3: 179, acute: 180, micro: 181, para: 182, middot: 183, cedil: 184, sup1: 185, ordm: 186, raquo: 187, frac14: 188, frac12: 189, frac34: 190, iquest: 191, Agrave: 192, Aacute: 193, Acirc: 194, Atilde: 195, Auml: 196, Aring: 197, AElig: 198, Ccedil: 199, Egrave: 200, Eacute: 201, Ecirc: 202, Euml: 203, Igrave: 204, Iacute: 205, Icirc: 206, Iuml: 207, ETH: 208, Ntilde: 209, Ograve: 210, Oacute: 211, Ocirc: 212, Otilde: 213, Ouml: 214, times: 215, Oslash: 216, Ugrave: 217, Uacute: 218, Ucirc: 219, Uuml: 220, Yacute: 221, THORN: 222, szlig: 223, agrave: 224, aacute: 225, acirc: 226, atilde: 227, auml: 228, aring: 229, aelig: 230, ccedil: 231, egrave: 232, eacute: 233, ecirc: 234, euml: 235, igrave: 236, iacute: 237, icirc: 238, iuml: 239, eth: 240, ntilde: 241, ograve: 242, oacute: 243, ocirc: 244, otilde: 245, ouml: 246, divide: 247, oslash: 248, ugrave: 249, uacute: 250, ucirc: 251, uuml: 252, yacute: 253, thorn: 254, yuml: 255, OElig: 338, oelig: 339, Scaron: 352, scaron: 353, Yuml: 376, fnof: 402, circ: 710, tilde: 732, Alpha: 913, Beta: 914, Gamma: 915, Delta: 916, Epsilon: 917, Zeta: 918, Eta: 919, Theta: 920, Iota: 921, Kappa: 922, Lambda: 923, Mu: 924, Nu: 925, Xi: 926, Omicron: 927, Pi: 928, Rho: 929, Sigma: 931, Tau: 932, Upsilon: 933, Phi: 934, Chi: 935, Psi: 936, Omega: 937, alpha: 945, beta: 946, gamma: 947, delta: 948, epsilon: 949, zeta: 950, eta: 951, theta: 952, iota: 953, kappa: 954, lambda: 955, mu: 956, nu: 957, xi: 958, omicron: 959, pi: 960, rho: 961, sigmaf: 962, sigma: 963, tau: 964, upsilon: 965, phi: 966, chi: 967, psi: 968, omega: 969, thetasym: 977, upsih: 978, piv: 982, ensp: 8194, emsp: 8195, thinsp: 8201, zwnj: 8204, zwj: 8205, lrm: 8206, rlm: 8207, ndash: 8211, mdash: 8212, lsquo: 8216, rsquo: 8217, sbquo: 8218, ldquo: 8220, rdquo: 8221, bdquo: 8222, dagger: 8224, Dagger: 8225, bull: 8226, hellip: 8230, permil: 8240, prime: 8242, Prime: 8243, lsaquo: 8249, rsaquo: 8250, oline: 8254, frasl: 8260, euro: 8364, image: 8465, weierp: 8472, real: 8476, trade: 8482, alefsym: 8501, larr: 8592, uarr: 8593, rarr: 8594, darr: 8595, harr: 8596, crarr: 8629, lArr: 8656, uArr: 8657, rArr: 8658, dArr: 8659, hArr: 8660, forall: 8704, part: 8706, exist: 8707, empty: 8709, nabla: 8711, isin: 8712, notin: 8713, ni: 8715, prod: 8719, sum: 8721, minus: 8722, lowast: 8727, radic: 8730, prop: 8733, infin: 8734, ang: 8736, and: 8743, or: 8744, cap: 8745, cup: 8746, int: 8747, there4: 8756, sim: 8764, cong: 8773, asymp: 8776, ne: 8800, equiv: 8801, le: 8804, ge: 8805, sub: 8834, sup: 8835, nsub: 8836, sube: 8838, supe: 8839, oplus: 8853, otimes: 8855, perp: 8869, sdot: 8901, lceil: 8968, rceil: 8969, lfloor: 8970, rfloor: 8971, lang: 9001, rang: 9002, loz: 9674, spades: 9824, clubs: 9827, hearts: 9829, diams: 9830	};
var controlCharacters = [ 8364, 129, 8218, 402, 8222, 8230, 8224, 8225, 710, 8240, 352, 8249, 338, 141, 381, 143, 144, 8216, 8217, 8220, 8221, 8226, 8211, 8212, 732, 8482, 353, 8250, 339, 157, 382, 376 ];
var entityPattern = new RegExp( '&(#?(?:x[\\w\\d]+|\\d+|' + Object.keys( htmlEntities ).join( '|' ) + '));?', 'g' );
var codePointSupport = typeof String.fromCodePoint === 'function';
var codeToChar = codePointSupport ? String.fromCodePoint : String.fromCharCode;

function decodeCharacterReferences ( html ) {
	return html.replace( entityPattern, function ( match, entity ) {
		var code;

		// Handle named entities
		if ( entity[0] !== '#' ) {
			code = htmlEntities[ entity ];
		} else if ( entity[1] === 'x' ) {
			code = parseInt( entity.substring( 2 ), 16 );
		} else {
			code = parseInt( entity.substring( 1 ), 10 );
		}

		if ( !code ) {
			return match;
		}

		return codeToChar( validateCode( code ) );
	});
}

var lessThan = /</g;
var greaterThan = />/g;
var amp = /&/g;
var invalid = 65533;

function escapeHtml ( str ) {
	return str
		.replace( amp, '&amp;' )
		.replace( lessThan, '&lt;' )
		.replace( greaterThan, '&gt;' );
}

// some code points are verboten. If we were inserting HTML, the browser would replace the illegal
// code points with alternatives in some cases - since we're bypassing that mechanism, we need
// to replace them ourselves
//
// Source: http://en.wikipedia.org/wiki/Character_encodings_in_HTML#Illegal_characters
function validateCode ( code ) {
	if ( !code ) {
		return invalid;
	}

	// line feed becomes generic whitespace
	if ( code === 10 ) {
		return 32;
	}

	// ASCII range. (Why someone would use HTML entities for ASCII characters I don't know, but...)
	if ( code < 128 ) {
		return code;
	}

	// code points 128-159 are dealt with leniently by browsers, but they're incorrect. We need
	// to correct the mistake or we'll end up with missing â‚¬ signs and so on
	if ( code <= 159 ) {
		return controlCharacters[ code - 128 ];
	}

	// basic multilingual plane
	if ( code < 55296 ) {
		return code;
	}

	// UTF-16 surrogate halves
	if ( code <= 57343 ) {
		return invalid;
	}

	// rest of the basic multilingual plane
	if ( code <= 65535 ) {
		return code;
	} else if ( !codePointSupport ) {
		return invalid;
	}

	// supplementary multilingual plane 0x10000 - 0x1ffff
	if ( code >= 65536 && code <= 131071 ) {
		return code;
	}

	// supplementary ideographic plane 0x20000 - 0x2ffff
	if ( code >= 131072 && code <= 196607 ) {
		return code;
	}

	return invalid;
}

var expectedExpression = 'Expected a JavaScript expression';
var expectedParen = 'Expected closing paren';

// bulletproof number regex from https://gist.github.com/Rich-Harris/7544330
var numberPattern = /^(?:[+-]?)0*(?:(?:(?:[1-9]\d*)?\.\d+)|(?:(?:0|[1-9]\d*)\.)|(?:0|[1-9]\d*))(?:[eE][+-]?\d+)?/;

function readNumberLiteral$1 ( parser ) {
	var result;

	if ( result = parser.matchPattern( numberPattern ) ) {
		return {
			t: NUMBER_LITERAL,
			v: result
		};
	}

	return null;
}

function readBooleanLiteral ( parser ) {
	var remaining = parser.remaining();

	if ( remaining.substr( 0, 4 ) === 'true' ) {
		parser.pos += 4;
		return {
			t: BOOLEAN_LITERAL,
			v: 'true'
		};
	}

	if ( remaining.substr( 0, 5 ) === 'false' ) {
		parser.pos += 5;
		return {
			t: BOOLEAN_LITERAL,
			v: 'false'
		};
	}

	return null;
}

// Match one or more characters until: ", ', \, or EOL/EOF.
// EOL/EOF is written as (?!.) (meaning there's no non-newline char next).
var stringMiddlePattern = /^(?=.)[^"'\\]+?(?:(?!.)|(?=["'\\]))/;

// Match one escape sequence, including the backslash.
var escapeSequencePattern = /^\\(?:[`'"\\bfnrt]|0(?![0-9])|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|(?=.)[^ux0-9])/;

// Match one ES5 line continuation (backslash + line terminator).
var lineContinuationPattern = /^\\(?:\r\n|[\u000A\u000D\u2028\u2029])/;

// Helper for defining getDoubleQuotedString and getSingleQuotedString.
var makeQuotedStringMatcher = function ( okQuote ) {
	return function ( parser ) {
		var literal = '"';
		var done = false;
		var next;

		while ( !done ) {
			next = ( parser.matchPattern( stringMiddlePattern ) || parser.matchPattern( escapeSequencePattern ) ||
				parser.matchString( okQuote ) );
			if ( next ) {
				if ( next === "\"" ) {
					literal += "\\\"";
				} else if ( next === "\\'" ) {
					literal += "'";
				} else {
					literal += next;
				}
			} else {
				next = parser.matchPattern( lineContinuationPattern );
				if ( next ) {
					// convert \(newline-like) into a \u escape, which is allowed in JSON
					literal += '\\u' + ( '000' + next.charCodeAt(1).toString(16) ).slice( -4 );
				} else {
					done = true;
				}
			}
		}

		literal += '"';

		// use JSON.parse to interpret escapes
		return JSON.parse( literal );
	};
};

var singleMatcher = makeQuotedStringMatcher( "\"" );
var doubleMatcher = makeQuotedStringMatcher( "'" );

var readStringLiteral = function ( parser ) {
	var start = parser.pos;
	var quote = parser.matchString( "'" ) || parser.matchString( "\"" );

	if ( quote ) {
		var string = ( quote === "'" ? singleMatcher : doubleMatcher )( parser );

		if ( !parser.matchString( quote ) ) {
			parser.pos = start;
			return null;
		}

		return {
			t: STRING_LITERAL,
			v: string
		};
	}

	return null;
};

// Match one or more characters until: ", ', or \
var stringMiddlePattern$1 = /^[^`"\\\$]+?(?:(?=[`"\\\$]))/;

var escapes = /[\r\n\t\b\f]/g;
function getString ( literal ) {
	return JSON.parse( ("\"" + (literal.replace( escapes, escapeChar )) + "\"") );
}

function escapeChar ( c ) {
	switch ( c ) {
		case '\n': return '\\n';
		case '\r': return '\\r';
		case '\t': return '\\t';
		case '\b': return '\\b';
		case '\f': return '\\f';
	}
}

function readTemplateStringLiteral ( parser ) {
	if ( !parser.matchString( '`' ) ) { return null; }

	var literal = '';
	var done = false;
	var next;
	var parts = [];

	while ( !done ) {
		next = parser.matchPattern( stringMiddlePattern$1 ) || parser.matchPattern( escapeSequencePattern ) ||
			parser.matchString( '$' ) || parser.matchString( '"' );
		if ( next ) {
			if ( next === "\"" ) {
				literal += "\\\"";
			} else if ( next === '\\`' ) {
				literal += '`';
			} else if ( next === '$' ) {
				if ( parser.matchString( '{' ) ) {
					parts.push({ t: STRING_LITERAL, v: getString( literal ) });
					literal = '';

					parser.allowWhitespace();
					var expr = readExpression( parser );

					if ( !expr ) { parser.error( 'Expected valid expression' ); }

					parts.push({ t: BRACKETED, x: expr });

					parser.allowWhitespace();
					if ( !parser.matchString( '}' ) ) { parser.error( "Expected closing '}' after interpolated expression" ); }
				} else {
					literal += '$';
				}
			} else {
				literal += next;
			}
		} else {
			next = parser.matchPattern( lineContinuationPattern );
			if ( next ) {
				// convert \(newline-like) into a \u escape, which is allowed in JSON
				literal += '\\u' + ( '000' + next.charCodeAt(1).toString(16) ).slice( -4 );
			} else {
				done = true;
			}
		}
	}

	if ( literal.length ) { parts.push({ t: STRING_LITERAL, v: getString( literal ) }); }

	if ( !parser.matchString( '`' ) ) { parser.error( "Expected closing '`'" ); }

	if ( parts.length === 1 ) {
		return parts[0];
	} else {
		var result = parts.pop();
		var part;

		while ( part = parts.pop() ) {
			result = {
				t: INFIX_OPERATOR,
				s: '+',
				o: [ part, result ]
			};
		}

		return {
			t: BRACKETED,
			x: result
		};
	}
}

var name = /^[a-zA-Z_$][a-zA-Z_$0-9]*/;
var spreadPattern = /^\s*\.{3}/;
var legalReference = /^(?:[a-zA-Z$_0-9]|\\\.)+(?:(?:\.(?:[a-zA-Z$_0-9]|\\\.)+)|(?:\[[0-9]+\]))*/;
var relaxedName = /^[a-zA-Z_$][-\/a-zA-Z_$0-9]*(?:\.(?:[a-zA-Z_$][-\/a-zA-Z_$0-9]*))*/;

var identifier = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/;

// http://mathiasbynens.be/notes/javascript-properties
// can be any name, string literal, or number literal
function readKey ( parser ) {
	var token;

	if ( token = readStringLiteral( parser ) ) {
		return identifier.test( token.v ) ? token.v : '"' + token.v.replace( /"/g, '\\"' ) + '"';
	}

	if ( token = readNumberLiteral$1( parser ) ) {
		return token.v;
	}

	if ( token = parser.matchPattern( name ) ) {
		return token;
	}

	return null;
}

function readKeyValuePair ( parser ) {
	var spread;
	var start = parser.pos;

	// allow whitespace between '{' and key
	parser.allowWhitespace();

	var refKey = parser.nextChar() !== '\'' && parser.nextChar() !== '"';
	if ( refKey ) { spread = parser.matchPattern( spreadPattern ); }

	var key = spread ? readExpression( parser ) : readKey( parser );
	if ( key === null ) {
		parser.pos = start;
		return null;
	}

	// allow whitespace between key and ':'
	parser.allowWhitespace();

	// es2015 shorthand property
	if ( refKey && ( parser.nextChar() === ',' || parser.nextChar() === '}' ) ) {
		if ( !spread && !name.test( key ) ) {
			parser.error( ("Expected a valid reference, but found '" + key + "' instead.") );
		}

		var pair = {
			t: KEY_VALUE_PAIR,
			k: key,
			v: {
				t: REFERENCE,
				n: key
			}
		};

		if ( spread ) {
			pair.p = true;
		}

		return pair;
	}


	// next character must be ':'
	if ( !parser.matchString( ':' ) ) {
		parser.pos = start;
		return null;
	}

	// allow whitespace between ':' and value
	parser.allowWhitespace();

	// next expression must be a, well... expression
	var value = readExpression( parser );
	if ( value === null ) {
		parser.pos = start;
		return null;
	}

	return {
		t: KEY_VALUE_PAIR,
		k: key,
		v: value
	};
}

function readKeyValuePairs ( parser ) {
	var start = parser.pos;

	var pair = readKeyValuePair( parser );
	if ( pair === null ) {
		return null;
	}

	var pairs = [ pair ];

	if ( parser.matchString( ',' ) ) {
		var keyValuePairs = readKeyValuePairs( parser );

		if ( !keyValuePairs ) {
			parser.pos = start;
			return null;
		}

		return pairs.concat( keyValuePairs );
	}

	return pairs;
}

var readObjectLiteral = function ( parser ) {
	var start = parser.pos;

	// allow whitespace
	parser.allowWhitespace();

	if ( !parser.matchString( '{' ) ) {
		parser.pos = start;
		return null;
	}

	var keyValuePairs = readKeyValuePairs( parser );

	// allow whitespace between final value and '}'
	parser.allowWhitespace();

	if ( !parser.matchString( '}' ) ) {
		parser.pos = start;
		return null;
	}

	return {
		t: OBJECT_LITERAL,
		m: keyValuePairs
	};
};

var readArrayLiteral = function ( parser ) {
	var start = parser.pos;

	// allow whitespace before '['
	parser.allowWhitespace();

	if ( !parser.matchString( '[' ) ) {
		parser.pos = start;
		return null;
	}

	var expressionList = readExpressionList( parser, true );

	if ( !parser.matchString( ']' ) ) {
		parser.pos = start;
		return null;
	}

	return {
		t: ARRAY_LITERAL,
		m: expressionList
	};
};

function readLiteral ( parser ) {
	return readNumberLiteral$1( parser )         ||
	       readBooleanLiteral( parser )        ||
	       readStringLiteral( parser )         ||
	       readTemplateStringLiteral( parser ) ||
	       readObjectLiteral( parser )         ||
	       readArrayLiteral( parser )          ||
	       readNumberLiteral( parser );
}

// if a reference is a browser global, we don't deference it later, so it needs special treatment
var globals = /^(?:Array|console|Date|RegExp|decodeURIComponent|decodeURI|encodeURIComponent|encodeURI|isFinite|isNaN|parseFloat|parseInt|JSON|Math|NaN|undefined|null|Object|Number|String|Boolean)\b/;

// keywords are not valid references, with the exception of `this`
var keywords = /^(?:break|case|catch|continue|debugger|default|delete|do|else|finally|for|function|if|in|instanceof|new|return|switch|throw|try|typeof|var|void|while|with)$/;

var prefixPattern = /^(?:\@\.|\@|~\/|(?:\^\^\/(?:\^\^\/)*(?:\.\.\/)*)|(?:\.\.\/)+|\.\/(?:\.\.\/)*|\.)/;
var specials = /^(key|index|keypath|rootpath|this|global|shared|context|event|node|local)/;

function readReference ( parser ) {
	var prefix, name$$1, global, reference, lastDotIndex;

	var startPos = parser.pos;

	prefix = parser.matchPattern( prefixPattern ) || '';
	name$$1 = ( !prefix && parser.relaxedNames && parser.matchPattern( relaxedName ) ) ||
			parser.matchPattern( legalReference );
	var actual = prefix.length + ( ( name$$1 && name$$1.length ) || 0 );

	if ( prefix === '@.' ) {
		prefix = '@';
		if ( name$$1 ) { name$$1 = 'this.' + name$$1; }
		else { name$$1 = 'this'; }
	}

	if ( !name$$1 && prefix ) {
		name$$1 = prefix;
		prefix = '';
	}

	if ( !name$$1 ) {
		return null;
	}

	if ( prefix === '@' ) {
		if ( !specials.test( name$$1 ) ) {
			parser.error( ("Unrecognized special reference @" + name$$1) );
		} else if ( ( ~name$$1.indexOf( 'event' ) || ~name$$1.indexOf( 'node' ) ) && !parser.inEvent ) {
			parser.error( "@event and @node are only valid references within an event directive" );
		} else if ( ~name$$1.indexOf( 'context' ) ) {
			parser.pos = parser.pos - ( name$$1.length - 7 );
			return {
				t: BRACKETED,
				x: {
					t: REFERENCE,
					n: '@context'
				}
			};
		}
	}

	// bug out if it's a keyword (exception for ancestor/restricted refs - see https://github.com/ractivejs/ractive/issues/1497)
	if ( !prefix && !parser.relaxedNames && keywords.test( name$$1 ) ) {
		parser.pos = startPos;
		return null;
	}

	// if this is a browser global, stop here
	if ( !prefix && globals.test( name$$1 ) ) {
		global = globals.exec( name$$1 )[0];
		parser.pos = startPos + global.length;

		return {
			t: GLOBAL,
			v: global
		};
	}

	reference = ( prefix || '' ) + normalise( name$$1 );

	if ( parser.matchString( '(' ) ) {
		// if this is a method invocation (as opposed to a function) we need
		// to strip the method name from the reference combo, else the context
		// will be wrong
		// but only if the reference was actually a member and not a refinement
		lastDotIndex = reference.lastIndexOf( '.' );
		if ( lastDotIndex !== -1 && name$$1[ name$$1.length - 1 ] !== ']' ) {
			var refLength = reference.length;
			reference = reference.substr( 0, lastDotIndex );
			parser.pos = startPos + ( actual - ( refLength - lastDotIndex ) );
		} else {
			parser.pos -= 1;
		}
	}

	return {
		t: REFERENCE,
		n: reference.replace( /^this\./, './' ).replace( /^this$/, '.' )
	};
}

function readBracketedExpression ( parser ) {
	if ( !parser.matchString( '(' ) ) { return null; }

	parser.allowWhitespace();

	var expr = readExpression( parser );

	if ( !expr ) { parser.error( expectedExpression ); }

	parser.allowWhitespace();

	if ( !parser.matchString( ')' ) ) { parser.error( expectedParen ); }

	return {
		t: BRACKETED,
		x: expr
	};
}

var readPrimary = function ( parser ) {
	return readLiteral( parser )
		|| readReference( parser )
		|| readBracketedExpression( parser );
};

function readRefinement ( parser ) {
	// some things call for strict refinement (partial names), meaning no space between reference and refinement
	if ( !parser.strictRefinement ) {
		parser.allowWhitespace();
	}

	// "." name
	if ( parser.matchString( '.' ) ) {
		parser.allowWhitespace();

		var name$$1 = parser.matchPattern( name );
		if ( name$$1 ) {
			return {
				t: REFINEMENT,
				n: name$$1
			};
		}

		parser.error( 'Expected a property name' );
	}

	// "[" expression "]"
	if ( parser.matchString( '[' ) ) {
		parser.allowWhitespace();

		var expr = readExpression( parser );
		if ( !expr ) { parser.error( expectedExpression ); }

		parser.allowWhitespace();

		if ( !parser.matchString( ']' ) ) { parser.error( "Expected ']'" ); }

		return {
			t: REFINEMENT,
			x: expr
		};
	}

	return null;
}

var readMemberOrInvocation = function ( parser ) {
	var expression = readPrimary( parser );

	if ( !expression ) { return null; }

	while ( expression ) {
		var refinement = readRefinement( parser );
		if ( refinement ) {
			expression = {
				t: MEMBER,
				x: expression,
				r: refinement
			};
		}

		else if ( parser.matchString( '(' ) ) {
			parser.allowWhitespace();
			var expressionList = readExpressionList( parser, true );

			parser.allowWhitespace();

			if ( !parser.matchString( ')' ) ) {
				parser.error( expectedParen );
			}

			expression = {
				t: INVOCATION,
				x: expression
			};

			if ( expressionList ) { expression.o = expressionList; }
		}

		else {
			break;
		}
	}

	return expression;
};

var readTypeOf;

var makePrefixSequenceMatcher = function ( symbol, fallthrough ) {
	return function ( parser ) {
		var expression;

		if ( expression = fallthrough( parser ) ) {
			return expression;
		}

		if ( !parser.matchString( symbol ) ) {
			return null;
		}

		parser.allowWhitespace();

		expression = readExpression( parser );
		if ( !expression ) {
			parser.error( expectedExpression );
		}

		return {
			s: symbol,
			o: expression,
			t: PREFIX_OPERATOR
		};
	};
};

// create all prefix sequence matchers, return readTypeOf
(function() {
	var i, len, matcher, fallthrough;

	var prefixOperators = '! ~ + - typeof'.split( ' ' );

	fallthrough = readMemberOrInvocation;
	for ( i = 0, len = prefixOperators.length; i < len; i += 1 ) {
		matcher = makePrefixSequenceMatcher( prefixOperators[i], fallthrough );
		fallthrough = matcher;
	}

	// typeof operator is higher precedence than multiplication, so provides the
	// fallthrough for the multiplication sequence matcher we're about to create
	// (we're skipping void and delete)
	readTypeOf = fallthrough;
}());

var readTypeof = readTypeOf;

var readLogicalOr;

var makeInfixSequenceMatcher = function ( symbol, fallthrough ) {
	return function ( parser ) {
		// > and / have to be quoted
		if ( parser.inUnquotedAttribute && ( symbol === '>' || symbol === '/' ) ) { return fallthrough( parser ); }

		var start, left, right;

		left = fallthrough( parser );
		if ( !left ) {
			return null;
		}

		// Loop to handle left-recursion in a case like `a * b * c` and produce
		// left association, i.e. `(a * b) * c`.  The matcher can't call itself
		// to parse `left` because that would be infinite regress.
		while ( true ) {
			start = parser.pos;

			parser.allowWhitespace();

			if ( !parser.matchString( symbol ) ) {
				parser.pos = start;
				return left;
			}

			// special case - in operator must not be followed by [a-zA-Z_$0-9]
			if ( symbol === 'in' && /[a-zA-Z_$0-9]/.test( parser.remaining().charAt( 0 ) ) ) {
				parser.pos = start;
				return left;
			}

			parser.allowWhitespace();

			// right operand must also consist of only higher-precedence operators
			right = fallthrough( parser );
			if ( !right ) {
				parser.pos = start;
				return left;
			}

			left = {
				t: INFIX_OPERATOR,
				s: symbol,
				o: [ left, right ]
			};

			// Loop back around.  If we don't see another occurrence of the symbol,
			// we'll return left.
		}
	};
};

// create all infix sequence matchers, and return readLogicalOr
(function() {
	var i, len, matcher, fallthrough;

	// All the infix operators on order of precedence (source: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Operators/Operator_Precedence)
	// Each sequence matcher will initially fall through to its higher precedence
	// neighbour, and only attempt to match if one of the higher precedence operators
	// (or, ultimately, a literal, reference, or bracketed expression) already matched
	var infixOperators = '* / % + - << >> >>> < <= > >= in instanceof == != === !== & ^ | && ||'.split( ' ' );

	// A typeof operator is higher precedence than multiplication
	fallthrough = readTypeof;
	for ( i = 0, len = infixOperators.length; i < len; i += 1 ) {
		matcher = makeInfixSequenceMatcher( infixOperators[i], fallthrough );
		fallthrough = matcher;
	}

	// Logical OR is the fallthrough for the conditional matcher
	readLogicalOr = fallthrough;
}());

var readLogicalOr$1 = readLogicalOr;

// The conditional operator is the lowest precedence operator, so we start here
function getConditional ( parser ) {
	var expression = readLogicalOr$1( parser );
	if ( !expression ) {
		return null;
	}

	var start = parser.pos;

	parser.allowWhitespace();

	if ( !parser.matchString( '?' ) ) {
		parser.pos = start;
		return expression;
	}

	parser.allowWhitespace();

	var ifTrue = readExpression( parser );
	if ( !ifTrue ) {
		parser.error( expectedExpression );
	}

	parser.allowWhitespace();

	if ( !parser.matchString( ':' ) ) {
		parser.error( 'Expected ":"' );
	}

	parser.allowWhitespace();

	var ifFalse = readExpression( parser );
	if ( !ifFalse ) {
		parser.error( expectedExpression );
	}

	return {
		t: CONDITIONAL,
		o: [ expression, ifTrue, ifFalse ]
	};
}

function readExpression ( parser ) {
	// The conditional operator is the lowest precedence operator (except yield,
	// assignment operators, and commas, none of which are supported), so we
	// start there. If it doesn't match, it 'falls through' to progressively
	// higher precedence operators, until it eventually matches (or fails to
	// match) a 'primary' - a literal or a reference. This way, the abstract syntax
	// tree has everything in its proper place, i.e. 2 + 3 * 4 === 14, not 20.
	return getConditional( parser );
}

function readExpressionList ( parser, spread ) {
	var isSpread;
	var expressions = [];

	var pos = parser.pos;

	do {
		parser.allowWhitespace();

		if ( spread ) {
			isSpread = parser.matchPattern( spreadPattern );
		}

		var expr = readExpression( parser );

		if ( expr === null && expressions.length ) {
			parser.error( expectedExpression );
		} else if ( expr === null ) {
			parser.pos = pos;
			return null;
		}

		if ( isSpread ) {
			expr.p = true;
		}

		expressions.push( expr );

		parser.allowWhitespace();
	} while ( parser.matchString( ',' ) );

	return expressions;
}

function readExpressionOrReference ( parser, expectedFollowers ) {
	var start = parser.pos;
	var expression = readExpression( parser );

	if ( !expression ) {
		// valid reference but invalid expression e.g. `{{new}}`?
		var ref = parser.matchPattern( /^(\w+)/ );
		if ( ref ) {
			return {
				t: REFERENCE,
				n: ref
			};
		}

		return null;
	}

	for ( var i = 0; i < expectedFollowers.length; i += 1 ) {
		if ( parser.remaining().substr( 0, expectedFollowers[i].length ) === expectedFollowers[i] ) {
			return expression;
		}
	}

	parser.pos = start;
	return readReference( parser );
}

function flattenExpression ( expression ) {
	var refs;
	var count = 0;

	extractRefs( expression, refs = [] );
	var stringified = stringify( expression );

	return {
		r: refs,
		s: getVars(stringified)
	};

	function getVars(expr) {
		var vars = [];
		for ( var i = count - 1; i >= 0; i-- ) {
			vars.push( ("x$" + i) );
		}
		return vars.length ? ("(function(){var " + (vars.join(',')) + ";return(" + expr + ");})()") : expr;
	}

	function stringify ( node ) {
		if ( typeof node === 'string' ) {
			return node;
		}

		switch ( node.t ) {
			case BOOLEAN_LITERAL:
			case GLOBAL:
			case NUMBER_LITERAL:
			case REGEXP_LITERAL:
				return node.v;

			case STRING_LITERAL:
				return JSON.stringify( String( node.v ) );

			case ARRAY_LITERAL:
				if ( node.m && hasSpread( node.m )) {
					return ("[].concat(" + (makeSpread( node.m, '[', ']', stringify )) + ")");
				} else {
					return '[' + ( node.m ? node.m.map( stringify ).join( ',' ) : '' ) + ']';
				}

			case OBJECT_LITERAL:
				if ( node.m && hasSpread( node.m ) ) {
					return ("Object.assign({}," + (makeSpread( node.m, '{', '}', stringifyPair)) + ")");
				} else {
					return '{' + ( node.m ? node.m.map( function (n) { return ((n.k) + ":" + (stringify( n.v ))); } ).join( ',' ) : '' ) + '}';
				}

			case PREFIX_OPERATOR:
				return ( node.s === 'typeof' ? 'typeof ' : node.s ) + stringify( node.o );

			case INFIX_OPERATOR:
				return stringify( node.o[0] ) + ( node.s.substr( 0, 2 ) === 'in' ? ' ' + node.s + ' ' : node.s ) + stringify( node.o[1] );

			case INVOCATION:
				if ( node.o && hasSpread( node.o ) ) {
					var id = count++;
					return ("(x$" + id + "=" + (stringify(node.x)) + ").apply(x$" + id + "," + (stringify({ t: ARRAY_LITERAL, m: node.o })) + ")");
				} else {
					return stringify( node.x ) + '(' + ( node.o ? node.o.map( stringify ).join( ',' ) : '' ) + ')';
				}

			case BRACKETED:
				return '(' + stringify( node.x ) + ')';

			case MEMBER:
				return stringify( node.x ) + stringify( node.r );

			case REFINEMENT:
				return ( node.n ? '.' + node.n : '[' + stringify( node.x ) + ']' );

			case CONDITIONAL:
				return stringify( node.o[0] ) + '?' + stringify( node.o[1] ) + ':' + stringify( node.o[2] );

			case REFERENCE:
				return '_' + refs.indexOf( node.n );

			default:
				throw new Error( 'Expected legal JavaScript' );
		}
	}

	function stringifyPair ( node ) { return node.p ? stringify( node.k ) : ((node.k) + ":" + (stringify( node.v ))); }

	function makeSpread ( list, open, close, fn ) {
		var out = list.reduce( function ( a, c ) {
			if ( c.p ) {
				a.str += "" + (a.open ? close + ',' : a.str.length ? ',' : '') + (fn( c ));
			} else {
				a.str += "" + (!a.str.length ? open : !a.open ? ',' + open : ',') + (fn( c ));
			}
			a.open = !c.p;
			return a;
		}, { open: false, str: '' } );
		if ( out.open ) { out.str += close; }
		return out.str;
	}
}

function hasSpread ( list ) {
	for ( var i = 0; i < list.length; i++ ) {
		if ( list[i].p ) { return true; }
	}

	return false;
}

// TODO maybe refactor this?
function extractRefs ( node, refs ) {
	if ( node.t === REFERENCE && typeof node.n === 'string' ) {
		if ( !~refs.indexOf( node.n ) ) {
			refs.unshift( node.n );
		}
	}

	var list = node.o || node.m;
	if ( list ) {
		if ( isObject( list ) ) {
			extractRefs( list, refs );
		} else {
			var i = list.length;
			while ( i-- ) {
				extractRefs( list[i], refs );
			}
		}
	}

	if ( node.k && node.t === KEY_VALUE_PAIR && typeof node.k !== 'string' ) {
		extractRefs( node.k, refs );
	}

	if ( node.x ) {
		extractRefs( node.x, refs );
	}

	if ( node.r ) {
		extractRefs( node.r, refs );
	}

	if ( node.v ) {
		extractRefs( node.v, refs );
	}
}

function refineExpression ( expression, mustache ) {
	var referenceExpression;

	if ( expression ) {
		while ( expression.t === BRACKETED && expression.x ) {
			expression = expression.x;
		}

		if ( expression.t === REFERENCE ) {
			var n = expression.n;
			if ( !~n.indexOf( '@context' ) ) {
				mustache.r = expression.n;
			} else {
				mustache.x = flattenExpression( expression );
			}
		} else {
			if ( referenceExpression = getReferenceExpression( expression ) ) {
				mustache.rx = referenceExpression;
			} else {
				mustache.x = flattenExpression( expression );
			}
		}

		return mustache;
	}
}

// TODO refactor this! it's bewildering
function getReferenceExpression ( expression ) {
	var members = [];
	var refinement;

	while ( expression.t === MEMBER && expression.r.t === REFINEMENT ) {
		refinement = expression.r;

		if ( refinement.x ) {
			if ( refinement.x.t === REFERENCE ) {
				members.unshift( refinement.x );
			} else {
				members.unshift( flattenExpression( refinement.x ) );
			}
		} else {
			members.unshift( refinement.n );
		}

		expression = expression.x;
	}

	if ( expression.t !== REFERENCE ) {
		return null;
	}

	return {
		r: expression.n,
		m: members
	};
}

var attributeNamePattern = /^[^\s"'>\/=]+/;
var onPattern = /^on/;
var eventPattern = /^on-([a-zA-Z\*\.$_]((?:[a-zA-Z\*\.$_0-9\-]|\\-)+))$/;
var reservedEventNames = /^(?:change|reset|teardown|update|construct|config|init|render|complete|unrender|detach|insert|destruct|attachchild|detachchild)$/;
var decoratorPattern = /^as-([a-z-A-Z][-a-zA-Z_0-9]*)$/;
var transitionPattern = /^([a-zA-Z](?:(?!-in-out)[-a-zA-Z_0-9])*)-(in|out|in-out)$/;
var boundPattern = /^((bind|class)-(([-a-zA-Z0-9_])+))$/;
var directives = {
	lazy: { t: BINDING_FLAG, v: 'l' },
	twoway: { t: BINDING_FLAG, v: 't' },
	'no-delegation': { t: DELEGATE_FLAG }
};
var unquotedAttributeValueTextPattern = /^[^\s"'=<>\/`]+/;
var proxyEvent = /^[^\s"'=<>@\[\]()]*/;
var whitespace = /^\s+/;

var slashes = /\\/g;
function splitEvent ( str ) {
	var result = [];
	var s = 0;

	for ( var i = 0; i < str.length; i++ ) {
		if ( str[i] === '-' && str[ i - 1 ] !== '\\' ) {
			result.push( str.substring( s, i ).replace( slashes, '' ) );
			s = i + 1;
		}
	}

	result.push( str.substring( s ).replace( slashes, '' ) );

	return result;
}

function readAttribute ( parser ) {
	var name, i, nearest, idx;

	parser.allowWhitespace();

	name = parser.matchPattern( attributeNamePattern );
	if ( !name ) {
		return null;
	}

	// check for accidental delimiter consumption e.g. <tag bool{{>attrs}} />
	nearest = name.length;
	for ( i = 0; i < parser.tags.length; i++ ) {
		if ( ~( idx = name.indexOf( parser.tags[ i ].open ) ) ) {
			if ( idx < nearest ) { nearest = idx; }
		}
	}
	if ( nearest < name.length ) {
		parser.pos -= name.length - nearest;
		name = name.substr( 0, nearest );
		if ( !name ) { return null; }
	}

	return { n: name };
}

function readAttributeValue ( parser ) {
	var start = parser.pos;

	// next character must be `=`, `/`, `>` or whitespace
	if ( !/[=\/>\s]/.test( parser.nextChar() ) ) {
		parser.error( 'Expected `=`, `/`, `>` or whitespace' );
	}

	parser.allowWhitespace();

	if ( !parser.matchString( '=' ) ) {
		parser.pos = start;
		return null;
	}

	parser.allowWhitespace();

	var valueStart = parser.pos;
	var startDepth = parser.sectionDepth;

	var value = readQuotedAttributeValue( parser, "'" ) ||
			readQuotedAttributeValue( parser, "\"" ) ||
			readUnquotedAttributeValue( parser );

	if ( value === null ) {
		parser.error( 'Expected valid attribute value' );
	}

	if ( parser.sectionDepth !== startDepth ) {
		parser.pos = valueStart;
		parser.error( 'An attribute value must contain as many opening section tags as closing section tags' );
	}

	if ( !value.length ) {
		return '';
	}

	if ( value.length === 1 && typeof value[0] === 'string' ) {
		return decodeCharacterReferences( value[0] );
	}

	return value;
}

function readUnquotedAttributeValueToken ( parser ) {
	var text, index;

	var start = parser.pos;

	text = parser.matchPattern( unquotedAttributeValueTextPattern );

	if ( !text ) {
		return null;
	}

	var haystack = text;
	var needles = parser.tags.map( function (t) { return t.open; } ); // TODO refactor... we do this in readText.js as well

	if ( ( index = getLowestIndex( haystack, needles ) ) !== -1 ) {
		text = text.substr( 0, index );
		parser.pos = start + text.length;
	}

	return text;
}

function readUnquotedAttributeValue ( parser ) {
	parser.inAttribute = true;

	var tokens = [];

	var token = readMustache( parser ) || readUnquotedAttributeValueToken( parser );
	while ( token ) {
		tokens.push( token );
		token = readMustache( parser ) || readUnquotedAttributeValueToken( parser );
	}

	if ( !tokens.length ) {
		return null;
	}

	parser.inAttribute = false;
	return tokens;
}

function readQuotedAttributeValue ( parser, quoteMark ) {
	var start = parser.pos;

	if ( !parser.matchString( quoteMark ) ) {
		return null;
	}

	parser.inAttribute = quoteMark;

	var tokens = [];

	var token = readMustache( parser ) || readQuotedStringToken( parser, quoteMark );
	while ( token !== null ) {
		tokens.push( token );
		token = readMustache( parser ) || readQuotedStringToken( parser, quoteMark );
	}

	if ( !parser.matchString( quoteMark ) ) {
		parser.pos = start;
		return null;
	}

	parser.inAttribute = false;

	return tokens;
}

function readQuotedStringToken ( parser, quoteMark ) {
	var haystack = parser.remaining();

	var needles = parser.tags.map( function (t) { return t.open; } ); // TODO refactor... we do this in readText.js as well
	needles.push( quoteMark );

	var index = getLowestIndex( haystack, needles );

	if ( index === -1 ) {
		parser.error( 'Quoted attribute value must have a closing quote' );
	}

	if ( !index ) {
		return null;
	}

	parser.pos += index;
	return haystack.substr( 0, index );
}

function readAttributeOrDirective ( parser ) {
	var match, directive;

	var attribute = readAttribute( parser, false );

	if ( !attribute ) { return null; }

		// lazy, twoway
	if ( directive = directives[ attribute.n ] ) {
		attribute.t = directive.t;
		if ( directive.v ) { attribute.v = directive.v; }
		delete attribute.n; // no name necessary
		parser.allowWhitespace();
		if ( parser.nextChar() === '=' ) { attribute.f = readAttributeValue( parser ); }
	}

		// decorators
	else if ( match = decoratorPattern.exec( attribute.n ) ) {
		attribute.n = match[1];
		attribute.t = DECORATOR;
		readArguments( parser, attribute );
	}

		// transitions
	else if ( match = transitionPattern.exec( attribute.n ) ) {
		attribute.n = match[1];
		attribute.t = TRANSITION;
		readArguments( parser, attribute );
		attribute.v = match[2] === 'in-out' ? 't0' : match[2] === 'in' ? 't1' : 't2';
	}

		// on-click etc
	else if ( match = eventPattern.exec( attribute.n ) ) {
		attribute.n = splitEvent( match[1] );
		attribute.t = EVENT;

		parser.inEvent = true;

			// check for a proxy event
		if ( !readProxyEvent( parser, attribute ) ) {
				// otherwise, it's an expression
			readArguments( parser, attribute, true );
		} else if ( reservedEventNames.test( attribute.f ) ) {
			parser.pos -= attribute.f.length;
			parser.error( 'Cannot use reserved event names (change, reset, teardown, update, construct, config, init, render, unrender, complete, detach, insert, destruct, attachchild, detachchild)' );
		}

		parser.inEvent = false;
	}

		// bound directives
	else if ( match = boundPattern.exec( attribute.n ) ){
		var bind = match[2] === 'bind';
		attribute.n = bind ? match[3] : match[1];
		attribute.t = ATTRIBUTE;
		readArguments( parser, attribute, false, true );

		if ( !attribute.f ) {
			if ( !bind ) {
				attribute.f = [{ t: INTERPOLATOR, x: { r: [], s: 'true' } }];
			} else {
				attribute.f = [{ t: INTERPOLATOR, r: match[3] }];
			}
		}
	}

	else {
		parser.allowWhitespace();
		var value = parser.nextChar() === '=' ? readAttributeValue( parser ) : null;
		attribute.f = value != null ? value : attribute.f;

		if ( parser.sanitizeEventAttributes && onPattern.test( attribute.n ) ) {
			return { exclude: true };
		} else {
			attribute.f = attribute.f || ( attribute.f === '' ? '' : 0 );
			attribute.t = ATTRIBUTE;
		}
	}

	return attribute;
}

function readProxyEvent ( parser, attribute ) {
	var start = parser.pos;
	if ( !parser.matchString( '=' ) ) { parser.error( "Missing required directive arguments" ); }

	var quote = parser.matchString( "'" ) || parser.matchString( "\"" );
	parser.allowWhitespace();
	var proxy = parser.matchPattern( proxyEvent );

	if ( proxy !== undefined ) {
		if ( quote ) {
			parser.allowWhitespace();
			if ( !parser.matchString( quote ) ) { parser.pos = start; }
			else { return ( attribute.f = proxy ) || true; }
		} else if ( !parser.matchPattern( whitespace ) ) {
			parser.pos = start;
		} else {
			return ( attribute.f = proxy ) || true;
		}
	} else {
		parser.pos = start;
	}
}

function readArguments ( parser, attribute, required, single ) {
	if ( required === void 0 ) { required = false; }
	if ( single === void 0 ) { single = false; }

	parser.allowWhitespace();
	if ( !parser.matchString( '=' ) ) {
		if ( required ) { parser.error( "Missing required directive arguments" ); }
		return;
	}
	parser.allowWhitespace();

	var quote = parser.matchString( '"' ) || parser.matchString( "'" );
	var spread = parser.spreadArgs;
	parser.spreadArgs = true;
	parser.inUnquotedAttribute = !quote;
	var expr = single ? readExpressionOrReference( parser, [ quote || ' ', '/', '>' ] ) : { m: readExpressionList( parser ), t: ARRAY_LITERAL };
	parser.inUnquotedAttribute = false;
	parser.spreadArgs = spread;

	if ( quote ) {
		parser.allowWhitespace();
		if ( parser.matchString( quote ) !== quote ) { parser.error( ("Expected matching quote '" + quote + "'") ); }
	}

	if ( single ) {
		var interpolator = { t: INTERPOLATOR };
		refineExpression( expr, interpolator );
		attribute.f = [interpolator];
	} else {
		attribute.f = flattenExpression( expr );
	}
}

var delimiterChangeToken = { t: DELIMCHANGE, exclude: true };

function readMustache ( parser ) {
	var mustache, i;

	// If we're inside a <script> or <style> tag, and we're not
	// interpolating, bug out
	if ( parser.interpolate[ parser.inside ] === false ) {
		return null;
	}

	for ( i = 0; i < parser.tags.length; i += 1 ) {
		if ( mustache = readMustacheOfType( parser, parser.tags[i] ) ) {
			return mustache;
		}
	}

	if ( parser.inTag && !parser.inAttribute ) {
		mustache = readAttributeOrDirective( parser );
		if ( mustache ) {
			parser.allowWhitespace();
			return mustache;
		}
	}
}

function readMustacheOfType ( parser, tag ) {
	var mustache, reader, i;

	var start = parser.pos;

	if ( parser.matchString( '\\' + tag.open ) ) {
		if ( start === 0 || parser.str[ start - 1 ] !== '\\' ) {
			return tag.open;
		}
	} else if ( !parser.matchString( tag.open ) ) {
		return null;
	}

	// delimiter change?
	if ( mustache = readDelimiterChange( parser ) ) {
		// find closing delimiter or abort...
		if ( !parser.matchString( tag.close ) ) {
			return null;
		}

		// ...then make the switch
		tag.open = mustache[0];
		tag.close = mustache[1];
		parser.sortMustacheTags();

		return delimiterChangeToken;
	}

	parser.allowWhitespace();

	// illegal section closer
	if ( parser.matchString( '/' ) ) {
		parser.pos -= 1;
		var rewind = parser.pos;
		if ( !readNumberLiteral( parser ) ) {
			parser.pos = rewind - ( tag.close.length );
			if ( parser.inAttribute ) {
				parser.pos = start;
				return null;
			} else {
				parser.error( 'Attempted to close a section that wasn\'t open' );
			}
		} else {
			parser.pos = rewind;
		}
	}

	for ( i = 0; i < tag.readers.length; i += 1 ) {
		reader = tag.readers[i];

		if ( mustache = reader( parser, tag ) ) {
			if ( tag.isStatic ) {
				mustache.s = 1;
			}

			if ( parser.includeLinePositions ) {
				mustache.p = parser.getLinePos( start );
			}

			return mustache;
		}
	}

	parser.pos = start;
	return null;
}

function readTriple ( parser, tag ) {
	var expression = readExpression( parser );

	if ( !expression ) {
		return null;
	}

	if ( !parser.matchString( tag.close ) ) {
		parser.error( ("Expected closing delimiter '" + (tag.close) + "'") );
	}

	var triple = { t: TRIPLE };
	refineExpression( expression, triple ); // TODO handle this differently - it's mysterious

	return triple;
}

function readUnescaped ( parser, tag ) {
	if ( !parser.matchString( '&' ) ) {
		return null;
	}

	parser.allowWhitespace();

	var expression = readExpression( parser );

	if ( !expression ) {
		return null;
	}

	if ( !parser.matchString( tag.close ) ) {
		parser.error( ("Expected closing delimiter '" + (tag.close) + "'") );
	}

	var triple = { t: TRIPLE };
	refineExpression( expression, triple ); // TODO handle this differently - it's mysterious

	return triple;
}

var legalAlias = /^(?:[a-zA-Z$_0-9]|\\\.)+(?:(?:(?:[a-zA-Z$_0-9]|\\\.)+)|(?:\[[0-9]+\]))*/;
var asRE = /^as/i;

function readAliases( parser ) {
	var aliases = [];
	var alias;
	var start = parser.pos;

	parser.allowWhitespace();

	alias = readAlias( parser );

	if ( alias ) {
		alias.x = refineExpression( alias.x, {} );
		aliases.push( alias );

		parser.allowWhitespace();

		while ( parser.matchString(',') ) {
			alias = readAlias( parser );

			if ( !alias ) {
				parser.error( 'Expected another alias.' );
			}

			alias.x = refineExpression( alias.x, {} );
			aliases.push( alias );

			parser.allowWhitespace();
		}

		return aliases;
	}

	parser.pos = start;
	return null;
}

function readAlias( parser ) {
	var start = parser.pos;

	parser.allowWhitespace();

	var expr = readExpression( parser, [] );

	if ( !expr ) {
		parser.pos = start;
		return null;
	}

	parser.allowWhitespace();

	if ( !parser.matchPattern( asRE ) ) {
		parser.pos = start;
		return null;
	}

	parser.allowWhitespace();

	var alias = parser.matchPattern( legalAlias );

	if ( !alias ) {
		parser.error( 'Expected a legal alias name.' );
	}

	return { n: alias, x: expr };
}

function readPartial ( parser, tag ) {
	var type = parser.matchString( '>' ) || parser.matchString( 'yield' );
	var partial = { t: type === '>' ? PARTIAL : YIELDER };
	var aliases;

	if ( !type ) { return null; }

	parser.allowWhitespace();

	if ( type === '>' || !( aliases = parser.matchString( 'with' ) ) ) {
		// Partial names can include hyphens, so we can't use readExpression
		// blindly. Instead, we use the `relaxedNames` flag to indicate that
		// `foo-bar` should be read as a single name, rather than 'subtract
		// bar from foo'
		parser.relaxedNames = parser.strictRefinement = true;
		var expression = readExpression( parser );
		parser.relaxedNames = parser.strictRefinement = false;

		if ( !expression && type === '>' ) { return null; }

		if ( expression ) {
			refineExpression( expression, partial ); // TODO...
			parser.allowWhitespace();
			if ( type !== '>' ) { aliases = parser.matchString( 'with' ); }
		}
	}

	parser.allowWhitespace();

	// check for alias context e.g. `{{>foo bar as bat, bip as bop}}`
	if ( aliases || type === '>' ) {
		aliases = readAliases( parser );
		if ( aliases && aliases.length ) {
			partial.z = aliases;
		}

		// otherwise check for literal context e.g. `{{>foo bar}}` then
		// turn it into `{{#with bar}}{{>foo}}{{/with}}`
		else if ( type === '>' ) {
			var context = readExpression( parser );
			if ( context) {
				partial.c = {};
				refineExpression( context, partial.c );
			}
		}

		else {
			// {{yield with}} requires some aliases
			parser.error( "Expected one or more aliases" );
		}
	}

	parser.allowWhitespace();

	if ( !parser.matchString( tag.close ) ) {
		parser.error( ("Expected closing delimiter '" + (tag.close) + "'") );
	}

	return partial;
}

function readComment ( parser, tag ) {
	if ( !parser.matchString( '!' ) ) {
		return null;
	}

	var index = parser.remaining().indexOf( tag.close );

	if ( index !== -1 ) {
		parser.pos += index + tag.close.length;
		return { t: COMMENT };
	}
}

function readInterpolator ( parser, tag ) {
	var expression, err;

	var start = parser.pos;

	// TODO would be good for perf if we could do away with the try-catch
	try {
		expression = readExpressionOrReference( parser, [ tag.close ] );
	} catch ( e ) {
		err = e;
	}

	if ( !expression ) {
		if ( parser.str.charAt( start ) === '!' ) {
			// special case - comment
			parser.pos = start;
			return null;
		}

		if ( err ) {
			throw err;
		}
	}

	if ( !parser.matchString( tag.close ) ) {
		parser.error( ("Expected closing delimiter '" + (tag.close) + "' after reference") );

		if ( !expression ) {
			// special case - comment
			if ( parser.nextChar() === '!' ) {
				return null;
			}

			parser.error( "Expected expression or legal reference" );
		}
	}

	var interpolator = { t: INTERPOLATOR };
	refineExpression( expression, interpolator ); // TODO handle this differently - it's mysterious

	return interpolator;
}

function readClosing ( parser, tag ) {
	var start = parser.pos;

	if ( !parser.matchString( tag.open ) ) {
		return null;
	}

	parser.allowWhitespace();

	if ( !parser.matchString( '/' ) ) {
		parser.pos = start;
		return null;
	}

	parser.allowWhitespace();

	var remaining = parser.remaining();
	var index = remaining.indexOf( tag.close );

	if ( index !== -1 ) {
		var closing = {
			t: CLOSING,
			r: remaining.substr( 0, index ).split( ' ' )[0]
		};

		parser.pos += index;

		if ( !parser.matchString( tag.close ) ) {
			parser.error( ("Expected closing delimiter '" + (tag.close) + "'") );
		}

		return closing;
	}

	parser.pos = start;
	return null;
}

var elsePattern = /^\s*else\s*/;

function readElse ( parser, tag ) {
	var start = parser.pos;

	if ( !parser.matchString( tag.open ) ) {
		return null;
	}

	if ( !parser.matchPattern( elsePattern ) ) {
		parser.pos = start;
		return null;
	}

	if ( !parser.matchString( tag.close ) ) {
		parser.error( ("Expected closing delimiter '" + (tag.close) + "'") );
	}

	return {
		t: ELSE
	};
}

var elsePattern$1 = /^\s*elseif\s+/;

function readElseIf ( parser, tag ) {
	var start = parser.pos;

	if ( !parser.matchString( tag.open ) ) {
		return null;
	}

	if ( !parser.matchPattern( elsePattern$1 ) ) {
		parser.pos = start;
		return null;
	}

	var expression = readExpression( parser );

	if ( !parser.matchString( tag.close ) ) {
		parser.error( ("Expected closing delimiter '" + (tag.close) + "'") );
	}

	return {
		t: ELSEIF,
		x: expression
	};
}

var handlebarsBlockCodes = {
	each:    SECTION_EACH,
	if:      SECTION_IF,
	with:    SECTION_IF_WITH,
	unless:  SECTION_UNLESS
};

var indexRefPattern = /^\s*:\s*([a-zA-Z_$][a-zA-Z_$0-9]*)/;
var keyIndexRefPattern = /^\s*,\s*([a-zA-Z_$][a-zA-Z_$0-9]*)/;
var handlebarsBlockPattern = new RegExp( '^(' + Object.keys( handlebarsBlockCodes ).join( '|' ) + ')\\b' );

function readSection ( parser, tag ) {
	var expression, section, child, children, hasElse, block, unlessBlock, closed, i, expectedClose;
	var aliasOnly = false;

	var start = parser.pos;

	if ( parser.matchString( '^' ) ) {
		// watch out for parent context refs - {{^^/^^/foo}}
		if ( parser.matchString( '^/' ) ){
			parser.pos = start;
			return null;
		}
		section = { t: SECTION, f: [], n: SECTION_UNLESS };
	} else if ( parser.matchString( '#' ) ) {
		section = { t: SECTION, f: [] };

		if ( parser.matchString( 'partial' ) ) {
			parser.pos = start - parser.standardDelimiters[0].length;
			parser.error( 'Partial definitions can only be at the top level of the template, or immediately inside components' );
		}

		if ( block = parser.matchPattern( handlebarsBlockPattern ) ) {
			expectedClose = block;
			section.n = handlebarsBlockCodes[ block ];
		}
	} else {
		return null;
	}

	parser.allowWhitespace();

	if ( block === 'with' ) {
		var aliases = readAliases( parser );
		if ( aliases ) {
			aliasOnly = true;
			section.z = aliases;
			section.t = ALIAS;
		}
	} else if ( block === 'each' ) {
		var alias = readAlias( parser );
		if ( alias ) {
			section.z = [ { n: alias.n, x: { r: '.' } } ];
			expression = alias.x;
		}
	}

	if ( !aliasOnly ) {
		if ( !expression ) { expression = readExpression( parser ); }

		if ( !expression ) {
			parser.error( 'Expected expression' );
		}

		// optional index and key references
		if ( i = parser.matchPattern( indexRefPattern ) ) {
			var extra;

			if ( extra = parser.matchPattern( keyIndexRefPattern ) ) {
				section.i = i + ',' + extra;
			} else {
				section.i = i;
			}
		}

		if ( !block && expression.n ) {
			expectedClose = expression.n;
		}
	}

	parser.allowWhitespace();

	if ( !parser.matchString( tag.close ) ) {
		parser.error( ("Expected closing delimiter '" + (tag.close) + "'") );
	}

	parser.sectionDepth += 1;
	children = section.f;

	var pos;
	do {
		pos = parser.pos;
		if ( child = readClosing( parser, tag ) ) {
			if ( expectedClose && child.r !== expectedClose ) {
				if ( !block ) {
					if ( child.r ) { parser.warn( ("Expected " + (tag.open) + "/" + expectedClose + (tag.close) + " but found " + (tag.open) + "/" + (child.r) + (tag.close)) ); }
				} else {
					parser.pos = pos;
					parser.error( ("Expected " + (tag.open) + "/" + expectedClose + (tag.close)) );
				}
			}

			parser.sectionDepth -= 1;
			closed = true;
		}

		else if ( !aliasOnly && ( child = readElseIf( parser, tag ) ) ) {
			if ( section.n === SECTION_UNLESS ) {
				parser.error( '{{else}} not allowed in {{#unless}}' );
			}

			if ( hasElse ) {
				parser.error( 'illegal {{elseif...}} after {{else}}' );
			}

			if ( !unlessBlock ) {
				unlessBlock = [];
			}

			var mustache = {
				t: SECTION,
				n: SECTION_IF,
				f: children = []
			};
			refineExpression( child.x, mustache );

			unlessBlock.push( mustache );
		}

		else if ( !aliasOnly && ( child = readElse( parser, tag ) ) ) {
			if ( section.n === SECTION_UNLESS ) {
				parser.error( '{{else}} not allowed in {{#unless}}' );
			}

			if ( hasElse ) {
				parser.error( 'there can only be one {{else}} block, at the end of a section' );
			}

			hasElse = true;

			// use an unless block if there's no elseif
			if ( !unlessBlock ) {
				unlessBlock = [];
			}

			unlessBlock.push({
				t: SECTION,
				n: SECTION_UNLESS,
				f: children = []
			});
		}

		else {
			child = parser.read( READERS );

			if ( !child ) {
				break;
			}

			children.push( child );
		}
	} while ( !closed );

	if ( unlessBlock ) {
		section.l = unlessBlock;
	}

	if ( !aliasOnly ) {
		refineExpression( expression, section );
	}

	// TODO if a section is empty it should be discarded. Don't do
	// that here though - we need to clean everything up first, as
	// it may contain removeable whitespace. As a temporary measure,
	// to pass the existing tests, remove empty `f` arrays
	if ( !section.f.length ) {
		delete section.f;
	}

	return section;
}

var OPEN_COMMENT = '<!--';
var CLOSE_COMMENT = '-->';

function readHtmlComment ( parser ) {
	var start = parser.pos;

	if ( parser.textOnlyMode || !parser.matchString( OPEN_COMMENT ) ) {
		return null;
	}

	var remaining = parser.remaining();
	var endIndex = remaining.indexOf( CLOSE_COMMENT );

	if ( endIndex === -1 ) {
		parser.error( 'Illegal HTML - expected closing comment sequence (\'-->\')' );
	}

	var content = remaining.substr( 0, endIndex );
	parser.pos += endIndex + 3;

	var comment = {
		t: COMMENT,
		c: content
	};

	if ( parser.includeLinePositions ) {
		comment.p = parser.getLinePos( start );
	}

	return comment;
}

var leadingLinebreak = /^[ \t\f\r\n]*\r?\n/;
var trailingLinebreak = /\r?\n[ \t\f\r\n]*$/;

var stripStandalones = function ( items ) {
	var i, current, backOne, backTwo, lastSectionItem;

	for ( i=1; i<items.length; i+=1 ) {
		current = items[i];
		backOne = items[i-1];
		backTwo = items[i-2];

		// if we're at the end of a [text][comment][text] sequence...
		if ( isString( current ) && isComment( backOne ) && isString( backTwo ) ) {

			// ... and the comment is a standalone (i.e. line breaks either side)...
			if ( trailingLinebreak.test( backTwo ) && leadingLinebreak.test( current ) ) {

				// ... then we want to remove the whitespace after the first line break
				items[i-2] = backTwo.replace( trailingLinebreak, '\n' );

				// and the leading line break of the second text token
				items[i] = current.replace( leadingLinebreak, '' );
			}
		}

		// if the current item is a section, and it is preceded by a linebreak, and
		// its first item is a linebreak...
		if ( isSection( current ) && isString( backOne ) ) {
			if ( trailingLinebreak.test( backOne ) && isString( current.f[0] ) && leadingLinebreak.test( current.f[0] ) ) {
				items[i-1] = backOne.replace( trailingLinebreak, '\n' );
				current.f[0] = current.f[0].replace( leadingLinebreak, '' );
			}
		}

		// if the last item was a section, and it is followed by a linebreak, and
		// its last item is a linebreak...
		if ( isString( current ) && isSection( backOne ) ) {
			lastSectionItem = lastItem( backOne.f );

			if ( isString( lastSectionItem ) && trailingLinebreak.test( lastSectionItem ) && leadingLinebreak.test( current ) ) {
				backOne.f[ backOne.f.length - 1 ] = lastSectionItem.replace( trailingLinebreak, '\n' );
				items[i] = current.replace( leadingLinebreak, '' );
			}
		}
	}

	return items;
};

function isString ( item ) {
	return typeof item === 'string';
}

function isComment ( item ) {
	return item.t === COMMENT || item.t === DELIMCHANGE;
}

function isSection ( item ) {
	return ( item.t === SECTION || item.t === INVERTED ) && item.f;
}

var trimWhitespace = function ( items, leadingPattern, trailingPattern ) {
	var item;

	if ( leadingPattern ) {
		item = items[0];
		if ( typeof item === 'string' ) {
			item = item.replace( leadingPattern, '' );

			if ( !item ) {
				items.shift();
			} else {
				items[0] = item;
			}
		}
	}

	if ( trailingPattern ) {
		item = lastItem( items );
		if ( typeof item === 'string' ) {
			item = item.replace( trailingPattern, '' );

			if ( !item ) {
				items.pop();
			} else {
				items[ items.length - 1 ] = item;
			}
		}
	}
};

var contiguousWhitespace = /[ \t\f\r\n]+/g;
var preserveWhitespaceElements = /^(?:pre|script|style|textarea)$/i;
var leadingWhitespace$1 = /^[ \t\f\r\n]+/;
var trailingWhitespace = /[ \t\f\r\n]+$/;
var leadingNewLine = /^(?:\r\n|\r|\n)/;
var trailingNewLine = /(?:\r\n|\r|\n)$/;

function cleanup ( items, stripComments, preserveWhitespace, removeLeadingWhitespace, removeTrailingWhitespace ) {
	if ( typeof items === 'string' ) { return; }

	var i,
		item,
		previousItem,
		nextItem,
		preserveWhitespaceInsideFragment,
		removeLeadingWhitespaceInsideFragment,
		removeTrailingWhitespaceInsideFragment;

	// First pass - remove standalones and comments etc
	stripStandalones( items );

	i = items.length;
	while ( i-- ) {
		item = items[i];

		// Remove delimiter changes, unsafe elements etc
		if ( item.exclude ) {
			items.splice( i, 1 );
		}

		// Remove comments, unless we want to keep them
		else if ( stripComments && item.t === COMMENT ) {
			items.splice( i, 1 );
		}
	}

	// If necessary, remove leading and trailing whitespace
	trimWhitespace( items, removeLeadingWhitespace ? leadingWhitespace$1 : null, removeTrailingWhitespace ? trailingWhitespace : null );

	i = items.length;
	while ( i-- ) {
		item = items[i];

		// Recurse
		if ( item.f ) {
			var isPreserveWhitespaceElement = item.t === ELEMENT && preserveWhitespaceElements.test( item.e );
			preserveWhitespaceInsideFragment = preserveWhitespace || isPreserveWhitespaceElement;

			if ( !preserveWhitespace && isPreserveWhitespaceElement ) {
				trimWhitespace( item.f, leadingNewLine, trailingNewLine );
			}

			if ( !preserveWhitespaceInsideFragment ) {
				previousItem = items[ i - 1 ];
				nextItem = items[ i + 1 ];

				// if the previous item was a text item with trailing whitespace,
				// remove leading whitespace inside the fragment
				if ( !previousItem || ( typeof previousItem === 'string' && trailingWhitespace.test( previousItem ) ) ) {
					removeLeadingWhitespaceInsideFragment = true;
				}

				// and vice versa
				if ( !nextItem || ( typeof nextItem === 'string' && leadingWhitespace$1.test( nextItem ) ) ) {
					removeTrailingWhitespaceInsideFragment = true;
				}
			}

			cleanup( item.f, stripComments, preserveWhitespaceInsideFragment, removeLeadingWhitespaceInsideFragment, removeTrailingWhitespaceInsideFragment );
		}

		// Split if-else blocks into two (an if, and an unless)
		if ( item.l ) {
			cleanup( item.l, stripComments, preserveWhitespace, removeLeadingWhitespaceInsideFragment, removeTrailingWhitespaceInsideFragment );

			item.l.forEach( function (s) { return s.l = 1; } );
			item.l.unshift( i + 1, 0 );
			items.splice.apply( items, item.l );
			delete item.l; // TODO would be nice if there was a way around this
		}

		// Clean up conditional attributes
		if ( item.m ) {
			cleanup( item.m, stripComments, preserveWhitespace, removeLeadingWhitespaceInsideFragment, removeTrailingWhitespaceInsideFragment );
			if ( item.m.length < 1 ) { delete item.m; }
		}
	}

	// final pass - fuse text nodes together
	i = items.length;
	while ( i-- ) {
		if ( typeof items[i] === 'string' ) {
			if ( typeof items[i+1] === 'string' ) {
				items[i] = items[i] + items[i+1];
				items.splice( i + 1, 1 );
			}

			if ( !preserveWhitespace ) {
				items[i] = items[i].replace( contiguousWhitespace, ' ' );
			}

			if ( items[i] === '' ) {
				items.splice( i, 1 );
			}
		}
	}
}

var closingTagPattern = /^([a-zA-Z]{1,}:?[a-zA-Z0-9\-]*)\s*\>/;

function readClosingTag ( parser ) {
	var tag;

	var start = parser.pos;

	// are we looking at a closing tag?
	if ( !parser.matchString( '</' ) ) {
		return null;
	}

	if ( tag = parser.matchPattern( closingTagPattern ) ) {
		if ( parser.inside && tag !== parser.inside ) {
			parser.pos = start;
			return null;
		}

		return {
			t: CLOSING_TAG,
			e: tag
		};
	}

	// We have an illegal closing tag, report it
	parser.pos -= 2;
	parser.error( 'Illegal closing tag' );
}

var tagNamePattern = /^[a-zA-Z]{1,}:?[a-zA-Z0-9\-]*/;
var anchorPattern = /^[a-zA-Z_$][-a-zA-Z0-9_$]*/;
var validTagNameFollower = /^[\s\n\/>]/;
var exclude = { exclude: true };

// based on http://developers.whatwg.org/syntax.html#syntax-tag-omission
var disallowedContents = {
	li: [ 'li' ],
	dt: [ 'dt', 'dd' ],
	dd: [ 'dt', 'dd' ],
	p: 'address article aside blockquote div dl fieldset footer form h1 h2 h3 h4 h5 h6 header hgroup hr main menu nav ol p pre section table ul'.split( ' ' ),
	rt: [ 'rt', 'rp' ],
	rp: [ 'rt', 'rp' ],
	optgroup: [ 'optgroup' ],
	option: [ 'option', 'optgroup' ],
	thead: [ 'tbody', 'tfoot' ],
	tbody: [ 'tbody', 'tfoot' ],
	tfoot: [ 'tbody' ],
	tr: [ 'tr', 'tbody' ],
	td: [ 'td', 'th', 'tr' ],
	th: [ 'td', 'th', 'tr' ]
};

function readElement$1 ( parser ) {
	var attribute, selfClosing, children, partials, hasPartials, child, closed, pos, remaining, closingTag, anchor;

	var start = parser.pos;

	if ( parser.inside || parser.inAttribute || parser.textOnlyMode ) {
		return null;
	}

	if ( !parser.matchString( '<' ) ) {
		return null;
	}

	// if this is a closing tag, abort straight away
	if ( parser.nextChar() === '/' ) {
		return null;
	}

	var element = {};
	if ( parser.includeLinePositions ) {
		element.p = parser.getLinePos( start );
	}

	// check for doctype decl
	if ( parser.matchString( '!' ) ) {
		element.t = DOCTYPE;
		if ( !parser.matchPattern( /^doctype/i ) ) {
			parser.error( 'Expected DOCTYPE declaration' );
		}

		element.a = parser.matchPattern( /^(.+?)>/ );
		return element;
	}
	// check for anchor
	else if ( anchor = parser.matchString( '#' ) ) {
		parser.allowWhitespace();
		element.t = ANCHOR;
		element.n = parser.matchPattern( anchorPattern );
	}
	// otherwise, it's an element/component
	else {
		element.t = ELEMENT;

		// element name
		element.e = parser.matchPattern( tagNamePattern );
		if ( !element.e ) {
			return null;
		}
	}

	// next character must be whitespace, closing solidus or '>'
	if ( !validTagNameFollower.test( parser.nextChar() ) ) {
		parser.error( 'Illegal tag name' );
	}

	parser.allowWhitespace();

	parser.inTag = true;

	// directives and attributes
	while ( attribute = readMustache( parser ) ) {
		if ( attribute !== false ) {
			if ( !element.m ) { element.m = []; }
			element.m.push( attribute );
		}

		parser.allowWhitespace();
	}

	parser.inTag = false;

	// allow whitespace before closing solidus
	parser.allowWhitespace();

	// self-closing solidus?
	if ( parser.matchString( '/' ) ) {
		selfClosing = true;
	}

	// closing angle bracket
	if ( !parser.matchString( '>' ) ) {
		return null;
	}

	var lowerCaseName = ( element.e || element.n ).toLowerCase();
	var preserveWhitespace = parser.preserveWhitespace;

	if ( !selfClosing && ( anchor || !voidElementNames.test( element.e ) ) ) {
		if ( !anchor ) {
			parser.elementStack.push( lowerCaseName );

			// Special case - if we open a script element, further tags should
			// be ignored unless they're a closing script element
			if ( lowerCaseName in parser.interpolate ) {
				parser.inside = lowerCaseName;
			}
		}

		children = [];
		partials = Object.create( null );

		do {
			pos = parser.pos;
			remaining = parser.remaining();

			if ( !remaining ) {
				parser.error( ("Missing end " + (parser.elementStack.length > 1 ? 'tags' : 'tag') + " (" + (parser.elementStack.reverse().map( function (x) { return ("</" + x + ">"); } ).join( '' )) + ")") );
			}

			// if for example we're in an <li> element, and we see another
			// <li> tag, close the first so they become siblings
			if ( !anchor && !canContain( lowerCaseName, remaining ) ) {
				closed = true;
			}

			// closing tag
			else if ( !anchor && ( closingTag = readClosingTag( parser ) ) ) {
				closed = true;

				var closingTagName = closingTag.e.toLowerCase();

				// if this *isn't* the closing tag for the current element...
				if ( closingTagName !== lowerCaseName ) {
					// rewind parser
					parser.pos = pos;

					// if it doesn't close a parent tag, error
					if ( !~parser.elementStack.indexOf( closingTagName ) ) {
						var errorMessage = 'Unexpected closing tag';

						// add additional help for void elements, since component names
						// might clash with them
						if ( voidElementNames.test( closingTagName ) ) {
							errorMessage += " (<" + closingTagName + "> is a void element - it cannot contain children)";
						}

						parser.error( errorMessage );
					}
				}
			}

			else if ( anchor && readAnchorClose( parser, element.n ) ) {
				closed = true;
			}

			// implicit close by closing section tag. TODO clean this up
			else if ( child = readClosing( parser, { open: parser.standardDelimiters[0], close: parser.standardDelimiters[1] } ) ) {
				closed = true;
				parser.pos = pos;
			}

			else {
				if ( child = parser.read( PARTIAL_READERS ) ) {
					if ( partials[ child.n ] ) {
						parser.pos = pos;
						parser.error( 'Duplicate partial definition' );
					}

					cleanup( child.f, parser.stripComments, preserveWhitespace, !preserveWhitespace, !preserveWhitespace );

					partials[ child.n ] = child.f;
					hasPartials = true;
				}

				else {
					if ( child = parser.read( READERS ) ) {
						children.push( child );
					} else {
						closed = true;
					}
				}
			}
		} while ( !closed );

		if ( children.length ) {
			element.f = children;
		}

		if ( hasPartials ) {
			element.p = partials;
		}

		parser.elementStack.pop();
	}

	parser.inside = null;

	if ( parser.sanitizeElements && parser.sanitizeElements.indexOf( lowerCaseName ) !== -1 ) {
		return exclude;
	}

	return element;
}

function canContain ( name, remaining ) {
	var match = /^<([a-zA-Z][a-zA-Z0-9]*)/.exec( remaining );
	var disallowed = disallowedContents[ name ];

	if ( !match || !disallowed ) {
		return true;
	}

	return !~disallowed.indexOf( match[1].toLowerCase() );
}

function readAnchorClose ( parser, name ) {
	var pos = parser.pos;
	if ( !parser.matchString( '</' ) ) {
		return null;
	}

	parser.matchString( '#' );
	parser.allowWhitespace();

	if ( !parser.matchString( name ) ) {
		parser.pos = pos;
		return null;
	}

	parser.allowWhitespace();

	if ( !parser.matchString( '>' ) ) {
		parser.pos = pos;
		return null;
	}

	return true;
}

function readText ( parser ) {
	var index, disallowed, barrier;

	var remaining = parser.remaining();

	if ( parser.textOnlyMode ) {
		disallowed = parser.tags.map( function (t) { return t.open; } );
		disallowed = disallowed.concat( parser.tags.map( function (t) { return '\\' + t.open; } ) );

		index = getLowestIndex( remaining, disallowed );
	} else {
		barrier = parser.inside ? '</' + parser.inside : '<';

		if ( parser.inside && !parser.interpolate[ parser.inside ] ) {
			index = remaining.indexOf( barrier );
		} else {
			disallowed = parser.tags.map( function (t) { return t.open; } );
			disallowed = disallowed.concat( parser.tags.map( function (t) { return '\\' + t.open; } ) );

			// http://developers.whatwg.org/syntax.html#syntax-attributes
			if ( parser.inAttribute === true ) {
				// we're inside an unquoted attribute value
				disallowed.push( "\"", "'", "=", "<", ">", '`' );
			} else if ( parser.inAttribute ) {
				// quoted attribute value
				disallowed.push( parser.inAttribute );
			} else {
				disallowed.push( barrier );
			}

			index = getLowestIndex( remaining, disallowed );
		}
	}

	if ( !index ) {
		return null;
	}

	if ( index === -1 ) {
		index = remaining.length;
	}

	parser.pos += index;

	if ( ( parser.inside && parser.inside !== 'textarea' ) || parser.textOnlyMode ) {
		return remaining.substr( 0, index );
	} else {
		return decodeCharacterReferences( remaining.substr( 0, index ) );
	}
}

var partialDefinitionSectionPattern = /^\s*#\s*partial\s+/;

function readPartialDefinitionSection ( parser ) {
	var child, closed;

	var start = parser.pos;

	var delimiters = parser.standardDelimiters;

	if ( !parser.matchString( delimiters[0] ) ) {
		return null;
	}

	if ( !parser.matchPattern( partialDefinitionSectionPattern ) ) {
		parser.pos = start;
		return null;
	}

	var name = parser.matchPattern( /^[a-zA-Z_$][a-zA-Z_$0-9\-\/]*/ );

	if ( !name ) {
		parser.error( 'expected legal partial name' );
	}

	parser.allowWhitespace();
	if ( !parser.matchString( delimiters[1] ) ) {
		parser.error( ("Expected closing delimiter '" + (delimiters[1]) + "'") );
	}

	var content = [];

	var open = delimiters[0];
	var close = delimiters[1];

	do {
		if ( child = readClosing( parser, { open: open, close: close }) ) {
			if ( child.r !== 'partial' ) {
				parser.error( ("Expected " + open + "/partial" + close) );
			}

			closed = true;
		}

		else {
			child = parser.read( READERS );

			if ( !child ) {
				parser.error( ("Expected " + open + "/partial" + close) );
			}

			content.push( child );
		}
	} while ( !closed );

	return {
		t: INLINE_PARTIAL,
		n: name,
		f: content
	};
}

function readTemplate ( parser ) {
	var fragment = [];
	var partials = Object.create( null );
	var hasPartials = false;

	var preserveWhitespace = parser.preserveWhitespace;

	while ( parser.pos < parser.str.length ) {
		var pos = parser.pos;
		var item = (void 0), partial = (void 0);

		if ( partial = parser.read( PARTIAL_READERS ) ) {
			if ( partials[ partial.n ] ) {
				parser.pos = pos;
				parser.error( 'Duplicated partial definition' );
			}

			cleanup( partial.f, parser.stripComments, preserveWhitespace, !preserveWhitespace, !preserveWhitespace );

			partials[ partial.n ] = partial.f;
			hasPartials = true;
		} else if ( item = parser.read( READERS ) ) {
			fragment.push( item );
		} else  {
			parser.error( 'Unexpected template content' );
		}
	}

	var result = {
		v: TEMPLATE_VERSION,
		t: fragment
	};

	if ( hasPartials ) {
		result.p = partials;
	}

	return result;
}

function insertExpressions ( obj, expr ) {

	Object.keys( obj ).forEach( function (key) {
		if  ( isExpression( key, obj ) ) { return addTo( obj, expr ); }

		var ref = obj[ key ];
		if ( hasChildren( ref ) ) { insertExpressions( ref, expr ); }
	});
}

function isExpression( key, obj ) {
	return key === 's' && Array.isArray( obj.r );
}

function addTo( obj, expr ) {
	var s = obj.s;
	var r = obj.r;
	if ( !expr[ s ] ) { expr[ s ] = fromExpression( s, r.length ); }
}

function hasChildren( ref ) {
	return Array.isArray( ref ) || isObject( ref );
}

var shared = {};

// See https://github.com/ractivejs/template-spec for information
// about the Ractive template specification

var STANDARD_READERS = [ readPartial, readUnescaped, readSection, readInterpolator, readComment ];
var TRIPLE_READERS = [ readTriple ];
var STATIC_READERS = [ readUnescaped, readSection, readInterpolator ]; // TODO does it make sense to have a static section?

var READERS = [ readMustache, readHtmlComment, readElement$1, readText ];
var PARTIAL_READERS = [ readPartialDefinitionSection ];

var defaultInterpolate = [ 'script', 'style', 'template' ];

var StandardParser = Parser.extend({
	init: function init ( str, options ) {
		var this$1 = this;

		var tripleDelimiters = options.tripleDelimiters || shared.defaults.tripleDelimiters;
		var staticDelimiters = options.staticDelimiters || shared.defaults.staticDelimiters;
		var staticTripleDelimiters = options.staticTripleDelimiters || shared.defaults.staticTripleDelimiters;

		this.standardDelimiters = options.delimiters || shared.defaults.delimiters;

		this.tags = [
			{ isStatic: false, isTriple: false, open: this.standardDelimiters[0], close: this.standardDelimiters[1], readers: STANDARD_READERS },
			{ isStatic: false, isTriple: true,  open: tripleDelimiters[0],        close: tripleDelimiters[1],        readers: TRIPLE_READERS },
			{ isStatic: true,  isTriple: false, open: staticDelimiters[0],        close: staticDelimiters[1],        readers: STATIC_READERS },
			{ isStatic: true,  isTriple: true,  open: staticTripleDelimiters[0],  close: staticTripleDelimiters[1],  readers: TRIPLE_READERS }
		];

		this.contextLines = options.contextLines || shared.defaults.contextLines;

		this.sortMustacheTags();

		this.sectionDepth = 0;
		this.elementStack = [];

		this.interpolate = Object.create( options.interpolate || shared.defaults.interpolate || {} );
		this.interpolate.textarea = true;
		defaultInterpolate.forEach( function (t) { return this$1.interpolate[ t ] = !options.interpolate || options.interpolate[ t ] !== false; } );

		if ( options.sanitize === true ) {
			options.sanitize = {
				// blacklist from https://code.google.com/p/google-caja/source/browse/trunk/src/com/google/caja/lang/html/html4-elements-whitelist.json
				elements: 'applet base basefont body frame frameset head html isindex link meta noframes noscript object param script style title'.split( ' ' ),
				eventAttributes: true
			};
		}

		this.stripComments = options.stripComments !== false;
		this.preserveWhitespace = options.preserveWhitespace;
		this.sanitizeElements = options.sanitize && options.sanitize.elements;
		this.sanitizeEventAttributes = options.sanitize && options.sanitize.eventAttributes;
		this.includeLinePositions = options.includeLinePositions;
		this.textOnlyMode = options.textOnlyMode;
		this.csp = options.csp;

		this.transforms = options.transforms || options.parserTransforms;
		if ( this.transforms ) {
			this.transforms = this.transforms.concat( shared.defaults.parserTransforms );
		} else {
			this.transforms = shared.defaults.parserTransforms;
		}
	},

	postProcess: function postProcess ( result ) {
		// special case - empty string
		if ( !result.length ) {
			return { t: [], v: TEMPLATE_VERSION };
		}

		if ( this.sectionDepth > 0 ) {
			this.error( 'A section was left open' );
		}

		cleanup( result[0].t, this.stripComments, this.preserveWhitespace, !this.preserveWhitespace, !this.preserveWhitespace );

		var transforms = this.transforms;
		if ( transforms.length ) {
			var tlen = transforms.length;
			var walk = function ( fragment ) {
				var len = fragment.length;

				for ( var i = 0; i < len; i++ ) {
					var node = fragment[i];

					if ( node.t === ELEMENT ) {
						for ( var j = 0; j < tlen; j++ ) {
							var res = transforms[j].call( shared.Ractive, node );
							if ( !res ) {
								continue;
							} else if ( res.remove ) {
								fragment.splice( i--, 1 );
								len--;
								break;
							} else if ( res.replace ) {
								if ( Array.isArray( res.replace ) ) {
									fragment.splice.apply( fragment, [ i--, 1 ].concat( res.replace ) );
									len += res.replace.length - 1;
								} else {
									fragment[i--] = node = res.replace;
								}

								break;
							}
						}

						// watch for partials
						if ( node.p ) {
							for ( var k in node.p ) { walk( node.p[k] ); }
						}
					}

					if ( node.f ) { walk( node.f ); }
				}
			};

			// process the root fragment
			walk( result[0].t );

			// watch for root partials
			if ( result[0].p ) {
				for ( var k in result[0].p ) { walk( result[0].p[k] ); }
			}
		}

		if ( this.csp !== false ) {
			var expr = {};
			insertExpressions( result[0].t, expr );
			if ( Object.keys( expr ).length ) { result[0].e = expr; }
		}

		return result[0];
	},

	converters: [
		readTemplate
	],

	sortMustacheTags: function sortMustacheTags () {
		// Sort in order of descending opening delimiter length (longer first),
		// to protect against opening delimiters being substrings of each other
		this.tags.sort( function ( a, b ) {
			return b.open.length - a.open.length;
		});
	}
});

function parse ( template, options ) {
	return new StandardParser( template, options || {} ).result;
}

var parseOptions = [
	'delimiters',
	'tripleDelimiters',
	'staticDelimiters',
	'staticTripleDelimiters',
	'csp',
	'interpolate',
	'preserveWhitespace',
	'sanitize',
	'stripComments',
	'contextLines'
];

var TEMPLATE_INSTRUCTIONS = "Either preparse or use a ractive runtime source that includes the parser. ";

var COMPUTATION_INSTRUCTIONS = "Either include a version of Ractive that can parse or convert your computation strings to functions.";


function throwNoParse ( method, error, instructions ) {
	if ( !method ) {
		fatal( ("Missing Ractive.parse - cannot parse " + error + ". " + instructions) );
	}
}

function createFunction ( body, length ) {
	throwNoParse( fromExpression, 'new expression function', TEMPLATE_INSTRUCTIONS );
	return fromExpression( body, length );
}

function createFunctionFromString ( str, bindTo ) {
	throwNoParse( fromComputationString, 'compution string "${str}"', COMPUTATION_INSTRUCTIONS );
	return fromComputationString( str, bindTo );
}

var parser = {

	fromId: function fromId ( id, options ) {
		if ( !doc ) {
			if ( options && options.noThrow ) { return; }
			throw new Error( ("Cannot retrieve template #" + id + " as Ractive is not running in a browser.") );
		}

		if ( id ) { id = id.replace( /^#/, '' ); }

		var template;

		if ( !( template = doc.getElementById( id ) )) {
			if ( options && options.noThrow ) { return; }
			throw new Error( ("Could not find template element with id #" + id) );
		}

		if ( template.tagName.toUpperCase() !== 'SCRIPT' ) {
			if ( options && options.noThrow ) { return; }
			throw new Error( ("Template element with id #" + id + ", must be a <script> element") );
		}

		return ( 'textContent' in template ? template.textContent : template.innerHTML );

	},

	isParsed: function isParsed ( template) {
		return !( typeof template === 'string' );
	},

	getParseOptions: function getParseOptions ( ractive ) {
		// Could be Ractive or a Component
		if ( ractive.defaults ) { ractive = ractive.defaults; }

		return parseOptions.reduce( function ( val, key ) {
			val[ key ] = ractive[ key ];
			return val;
		}, {});
	},

	parse: function parse$1 ( template, options ) {
		throwNoParse( parse, 'template', TEMPLATE_INSTRUCTIONS );
		var parsed = parse( template, options );
		addFunctions( parsed );
		return parsed;
	},

	parseFor: function parseFor( template, ractive ) {
		return this.parse( template, this.getParseOptions( ractive ) );
	}
};

var templateConfigurator = {
	name: 'template',

	extend: function extend ( Parent, proto, options ) {
		// only assign if exists
		if ( 'template' in options ) {
			var template = options.template;

			if ( typeof template === 'function' ) {
				proto.template = template;
			} else {
				proto.template = parseTemplate( template, proto );
			}
		}
	},

	init: function init ( Parent, ractive, options ) {
		// TODO because of prototypal inheritance, we might just be able to use
		// ractive.template, and not bother passing through the Parent object.
		// At present that breaks the test mocks' expectations
		var template = 'template' in options ? options.template : Parent.prototype.template;
		template = template || { v: TEMPLATE_VERSION, t: [] };

		if ( typeof template === 'function' ) {
			var fn = template;
			template = getDynamicTemplate( ractive, fn );

			ractive._config.template = {
				fn: fn,
				result: template
			};
		}

		template = parseTemplate( template, ractive );

		// TODO the naming of this is confusing - ractive.template refers to [...],
		// but Component.prototype.template refers to {v:1,t:[],p:[]}...
		// it's unnecessary, because the developer never needs to access
		// ractive.template
		ractive.template = template.t;

		if ( template.p ) {
			extendPartials( ractive.partials, template.p );
		}
	},

	reset: function reset ( ractive ) {
		var result = resetValue( ractive );

		if ( result ) {
			var parsed = parseTemplate( result, ractive );

			ractive.template = parsed.t;
			extendPartials( ractive.partials, parsed.p, true );

			return true;
		}
	}
};

function resetValue ( ractive ) {
	var initial = ractive._config.template;

	// If this isn't a dynamic template, there's nothing to do
	if ( !initial || !initial.fn ) {
		return;
	}

	var result = getDynamicTemplate( ractive, initial.fn );

	// TODO deep equality check to prevent unnecessary re-rendering
	// in the case of already-parsed templates
	if ( result !== initial.result ) {
		initial.result = result;
		return result;
	}
}

function getDynamicTemplate ( ractive, fn ) {
	return fn.call( ractive, {
		fromId: parser.fromId,
		isParsed: parser.isParsed,
		parse: function parse ( template, options ) {
			if ( options === void 0 ) { options = parser.getParseOptions( ractive ); }

			return parser.parse( template, options );
		}
	});
}

function parseTemplate ( template, ractive ) {
	if ( typeof template === 'string' ) {
		// parse will validate and add expression functions
		template = parseAsString( template, ractive );
	}
	else {
		// need to validate and add exp for already parsed template
		validate$1( template );
		addFunctions( template );
	}

	return template;
}

function parseAsString ( template, ractive ) {
	// ID of an element containing the template?
	if ( template[0] === '#' ) {
		template = parser.fromId( template );
	}

	return parser.parseFor( template, ractive );
}

function validate$1( template ) {

	// Check that the template even exists
	if ( template == undefined ) {
		throw new Error( ("The template cannot be " + template + ".") );
	}

	// Check the parsed template has a version at all
	else if ( typeof template.v !== 'number' ) {
		throw new Error( 'The template parser was passed a non-string template, but the template doesn\'t have a version.  Make sure you\'re passing in the template you think you are.' );
	}

	// Check we're using the correct version
	else if ( template.v !== TEMPLATE_VERSION ) {
		throw new Error( ("Mismatched template version (expected " + TEMPLATE_VERSION + ", got " + (template.v) + ") Please ensure you are using the latest version of Ractive.js in your build process as well as in your app") );
	}
}

function extendPartials ( existingPartials, newPartials, overwrite ) {
	if ( !newPartials ) { return; }

	// TODO there's an ambiguity here - we need to overwrite in the `reset()`
	// case, but not initially...

	for ( var key in newPartials ) {
		if ( overwrite || !existingPartials.hasOwnProperty( key ) ) {
			existingPartials[ key ] = newPartials[ key ];
		}
	}
}

var registryNames = [
	'adaptors',
	'components',
	'computed',
	'decorators',
	'easing',
	'events',
	'interpolators',
	'partials',
	'transitions'
];

var Registry = function Registry ( name, useDefaults ) {
	this.name = name;
	this.useDefaults = useDefaults;
};

Registry.prototype.extend = function extend ( Parent, proto, options ) {
	this.configure(
		this.useDefaults ? Parent.defaults : Parent,
		this.useDefaults ? proto : proto.constructor,
		options );
};

Registry.prototype.init = function init () {
	// noop
};

Registry.prototype.configure = function configure ( Parent, target, options ) {
	var name = this.name;
	var option = options[ name ];

	var registry = Object.create( Parent[name] );

	for ( var key in option ) {
		registry[ key ] = option[ key ];
	}

	target[ name ] = registry;
};

Registry.prototype.reset = function reset ( ractive ) {
	var registry = ractive[ this.name ];
	var changed = false;

	Object.keys( registry ).forEach( function (key) {
		var item = registry[ key ];

		if ( item._fn ) {
			if ( item._fn.isOwner ) {
				registry[key] = item._fn;
			} else {
				delete registry[key];
			}
			changed = true;
		}
	});

	return changed;
};

var registries = registryNames.map( function (name) { return new Registry( name, name === 'computed' ); } );

function wrap$1 ( parent, name, method ) {
	if ( !/_super/.test( method ) ) { return method; }

	function wrapper () {
		var superMethod = getSuperMethod( wrapper._parent, name );
		var hasSuper = '_super' in this;
		var oldSuper = this._super;

		this._super = superMethod;

		var result = method.apply( this, arguments );

		if ( hasSuper ) {
			this._super = oldSuper;
		} else {
			delete this._super;
		}

		return result;
	}

	wrapper._parent = parent;
	wrapper._method = method;

	return wrapper;
}

function getSuperMethod ( parent, name ) {
	if ( name in parent ) {
		var value = parent[ name ];

		return typeof value === 'function' ?
			value :
			function () { return value; };
	}

	return noop$1;
}

function getMessage( deprecated, correct, isError ) {
	return "options." + deprecated + " has been deprecated in favour of options." + correct + "."
		+ ( isError ? (" You cannot specify both options, please use options." + correct + ".") : '' );
}

function deprecateOption ( options, deprecatedOption, correct ) {
	if ( deprecatedOption in options ) {
		if( !( correct in options ) ) {
			warnIfDebug( getMessage( deprecatedOption, correct ) );
			options[ correct ] = options[ deprecatedOption ];
		} else {
			throw new Error( getMessage( deprecatedOption, correct, true ) );
		}
	}
}

function deprecate ( options ) {
	deprecateOption( options, 'beforeInit', 'onconstruct' );
	deprecateOption( options, 'init', 'onrender' );
	deprecateOption( options, 'complete', 'oncomplete' );
	deprecateOption( options, 'eventDefinitions', 'events' );

	// Using extend with Component instead of options,
	// like Human.extend( Spider ) means adaptors as a registry
	// gets copied to options. So we have to check if actually an array
	if ( Array.isArray( options.adaptors ) ) {
		deprecateOption( options, 'adaptors', 'adapt' );
	}
}

var custom = {
	adapt: adaptConfigurator,
	css: cssConfigurator,
	data: dataConfigurator,
	template: templateConfigurator
};

var defaultKeys = Object.keys( defaults );

var isStandardKey = makeObj( defaultKeys.filter( function (key) { return !custom[ key ]; } ) );

// blacklisted keys that we don't double extend
var isBlacklisted = makeObj( defaultKeys.concat( registries.map( function (r) { return r.name; } ), [ 'on', 'observe', 'attributes' ] ) );

var order = [].concat(
	defaultKeys.filter( function (key) { return !registries[ key ] && !custom[ key ]; } ),
	registries,
	//custom.data,
	custom.template,
	custom.css
);

var config$4 = {
	extend: function ( Parent, proto, options ) { return configure( 'extend', Parent, proto, options ); },

	init: function ( Parent, ractive, options ) { return configure( 'init', Parent, ractive, options ); },

	reset: function (ractive) {
		return order.filter( function (c) {
			return c.reset && c.reset( ractive );
		}).map( function (c) { return c.name; } );
	},

	// this defines the order. TODO this isn't used anywhere in the codebase,
	// only in the test suite - should get rid of it
	order: order
};

function configure ( method, Parent, target, options ) {
	deprecate( options );

	for ( var key in options ) {
		if ( isStandardKey.hasOwnProperty( key ) ) {
			var value = options[ key ];

			// warn the developer if they passed a function and ignore its value

			// NOTE: we allow some functions on "el" because we duck type element lists
			// and some libraries or ef'ed-up virtual browsers (phantomJS) return a
			// function object as the result of querySelector methods
			if ( key !== 'el' && typeof value === 'function' ) {
				warnIfDebug( (key + " is a Ractive option that does not expect a function and will be ignored"),
					method === 'init' ? target : null );
			}
			else {
				target[ key ] = value;
			}
		}
	}

	// disallow combination of `append` and `enhance`
	if ( options.append && options.enhance ) {
		throw new Error( 'Cannot use append and enhance at the same time' );
	}

	registries.forEach( function (registry) {
		registry[ method ]( Parent, target, options );
	});

	adaptConfigurator[ method ]( Parent, target, options );
	templateConfigurator[ method ]( Parent, target, options );
	cssConfigurator[ method ]( Parent, target, options );

	extendOtherMethods( Parent.prototype, target, options );
}

var _super = /\b_super\b/;
function extendOtherMethods ( parent, target, options ) {
	for ( var key in options ) {
		if ( !isBlacklisted[ key ] && options.hasOwnProperty( key ) ) {
			var member = options[ key ];

			// if this is a method that overwrites a method, wrap it:
			if ( typeof member === 'function' ) {
				if ( key in RactiveProto && !_super.test( member.toString() ) ) {
					warnIfDebug( ("Overriding Ractive prototype function '" + key + "' without calling the '" + _super + "' method can be very dangerous.") );
				}
				member = wrap$1( parent, key, member );
			}

			target[ key ] = member;
		}
	}
}

function makeObj ( array ) {
	var obj = {};
	array.forEach( function (x) { return obj[x] = true; } );
	return obj;
}

var Item = function Item ( options ) {
	this.parentFragment = options.parentFragment;
	this.ractive = options.parentFragment.ractive;

	this.template = options.template;
	this.index = options.index;
	this.type = options.template.t;

	this.dirty = false;
};

Item.prototype.bubble = function bubble () {
	if ( !this.dirty ) {
		this.dirty = true;
		this.parentFragment.bubble();
	}
};

Item.prototype.destroyed = function destroyed () {
	if ( this.fragment ) { this.fragment.destroyed(); }
};

Item.prototype.find = function find () {
	return null;
};

Item.prototype.findComponent = function findComponent () {
	return null;
};

Item.prototype.findNextNode = function findNextNode () {
	return this.parentFragment.findNextNode( this );
};

Item.prototype.shuffled = function shuffled () {
	if ( this.fragment ) { this.fragment.shuffled(); }
};

Item.prototype.valueOf = function valueOf () {
	return this.toString();
};

Item.prototype.findAll = noop$1;
Item.prototype.findAllComponents = noop$1;

var ContainerItem = (function (Item) {
	function ContainerItem ( options ) {
		Item.call( this, options );
	}

	if ( Item ) { ContainerItem.__proto__ = Item; }
	ContainerItem.prototype = Object.create( Item && Item.prototype );
	ContainerItem.prototype.constructor = ContainerItem;

	ContainerItem.prototype.detach = function detach () {
		return this.fragment ? this.fragment.detach() : createDocumentFragment();
	};

	ContainerItem.prototype.find = function find ( selector ) {
		if ( this.fragment ) {
			return this.fragment.find( selector );
		}
	};

	ContainerItem.prototype.findAll = function findAll ( selector, options ) {
		if ( this.fragment ) {
			this.fragment.findAll( selector, options );
		}
	};

	ContainerItem.prototype.findComponent = function findComponent ( name ) {
		if ( this.fragment ) {
			return this.fragment.findComponent( name );
		}
	};

	ContainerItem.prototype.findAllComponents = function findAllComponents ( name, options ) {
		if ( this.fragment ) {
			this.fragment.findAllComponents( name, options );
		}
	};

	ContainerItem.prototype.firstNode = function firstNode ( skipParent ) {
		return this.fragment && this.fragment.firstNode( skipParent );
	};

	ContainerItem.prototype.toString = function toString ( escape ) {
		return this.fragment ? this.fragment.toString( escape ) : '';
	};

	return ContainerItem;
}(Item));

var ComputationChild = (function (Model$$1) {
	function ComputationChild ( parent, key ) {
		Model$$1.call( this, parent, key );

		this.isReadonly = !this.root.ractive.syncComputedChildren;
		this.dirty = true;
	}

	if ( Model$$1 ) { ComputationChild.__proto__ = Model$$1; }
	ComputationChild.prototype = Object.create( Model$$1 && Model$$1.prototype );
	ComputationChild.prototype.constructor = ComputationChild;

	ComputationChild.prototype.applyValue = function applyValue ( value ) {
		Model$$1.prototype.applyValue.call( this, value );

		if ( !this.isReadonly ) {
			var source = this.parent;
			// computed models don't have a shuffle method
			while ( source && source.shuffle ) {
				source = source.parent;
			}

			if ( source ) {
				source.dependencies.forEach( mark );
			}
		}
	};

	ComputationChild.prototype.get = function get ( shouldCapture ) {
		if ( shouldCapture ) { capture( this ); }

		if ( this.dirty ) {
			this.dirty = false;
			var parentValue = this.parent.get();
			this.value = parentValue ? parentValue[ this.key ] : undefined;
		}

		return this.value;
	};

	ComputationChild.prototype.handleChange = function handleChange$1 () {
		this.dirty = true;

		if ( this.boundValue ) { this.boundValue = null; }

		this.links.forEach( marked );
		this.deps.forEach( handleChange );
		this.children.forEach( handleChange );
	};

	ComputationChild.prototype.joinKey = function joinKey ( key ) {
		if ( key === undefined || key === '' ) { return this; }

		if ( !this.childByKey.hasOwnProperty( key ) ) {
			var child = new ComputationChild( this, key );
			this.children.push( child );
			this.childByKey[ key ] = child;
		}

		return this.childByKey[ key ];
	};

	return ComputationChild;
}(Model));

/* global console */
/* eslint no-console:"off" */

var Computation = (function (Model$$1) {
	function Computation ( viewmodel, signature, key ) {
		Model$$1.call( this, null, null );

		this.root = this.parent = viewmodel;
		this.signature = signature;

		this.key = key; // not actually used, but helps with debugging
		this.isExpression = key && key[0] === '@';

		this.isReadonly = !this.signature.setter;

		this.context = viewmodel.computationContext;

		this.dependencies = [];

		this.children = [];
		this.childByKey = {};

		this.deps = [];

		this.dirty = true;

		// TODO: is there a less hackish way to do this?
		this.shuffle = undefined;
	}

	if ( Model$$1 ) { Computation.__proto__ = Model$$1; }
	Computation.prototype = Object.create( Model$$1 && Model$$1.prototype );
	Computation.prototype.constructor = Computation;

	Computation.prototype.get = function get ( shouldCapture ) {
		if ( shouldCapture ) { capture( this ); }

		if ( this.dirty ) {
			this.dirty = false;
			var old = this.value;
			this.value = this.getValue();
			if ( !isEqual( old, this.value ) ) { this.notifyUpstream(); }
			if ( this.wrapper ) { this.newWrapperValue = this.value; }
			this.adapt();
		}

		// if capturing, this value needs to be unwrapped because it's for external use
		return maybeBind( this, shouldCapture && this.wrapper ? this.wrapperValue : this.value );
	};

	Computation.prototype.getValue = function getValue () {
		startCapturing();
		var result;

		try {
			result = this.signature.getter.call( this.context );
		} catch ( err ) {
			warnIfDebug( ("Failed to compute " + (this.getKeypath()) + ": " + (err.message || err)) );

			// TODO this is all well and good in Chrome, but...
			// ...also, should encapsulate this stuff better, and only
			// show it if Ractive.DEBUG
			if ( hasConsole ) {
				if ( console.groupCollapsed ) { console.groupCollapsed( '%cshow details', 'color: rgb(82, 140, 224); font-weight: normal; text-decoration: underline;' ); }
				var sig = this.signature;
				console.error( ((err.name) + ": " + (err.message) + "\n\n" + (sig.getterString) + (sig.getterUseStack ? '\n\n' + err.stack : '')) );
				if ( console.groupCollapsed ) { console.groupEnd(); }
			}
		}

		var dependencies = stopCapturing();
		this.setDependencies( dependencies );

		return result;
	};

	Computation.prototype.mark = function mark () {
		this.handleChange();
	};

	Computation.prototype.rebind = function rebind ( next, previous ) {
		// computations will grab all of their deps again automagically
		if ( next !== previous ) { this.handleChange(); }
	};

	Computation.prototype.set = function set ( value ) {
		if ( this.isReadonly ) {
			throw new Error( ("Cannot set read-only computed value '" + (this.key) + "'") );
		}

		this.signature.setter( value );
		this.mark();
	};

	Computation.prototype.setDependencies = function setDependencies ( dependencies ) {
		var this$1 = this;

		// unregister any soft dependencies we no longer have
		var i = this.dependencies.length;
		while ( i-- ) {
			var model = this$1.dependencies[i];
			if ( !~dependencies.indexOf( model ) ) { model.unregister( this$1 ); }
		}

		// and add any new ones
		i = dependencies.length;
		while ( i-- ) {
			var model$1 = dependencies[i];
			if ( !~this$1.dependencies.indexOf( model$1 ) ) { model$1.register( this$1 ); }
		}

		this.dependencies = dependencies;
	};

	Computation.prototype.teardown = function teardown () {
		var this$1 = this;

		var i = this.dependencies.length;
		while ( i-- ) {
			if ( this$1.dependencies[i] ) { this$1.dependencies[i].unregister( this$1 ); }
		}
		if ( this.root.computations[this.key] === this ) { delete this.root.computations[this.key]; }
		Model$$1.prototype.teardown.call(this);
	};

	return Computation;
}(Model));

var prototype$1 = Computation.prototype;
var child = ComputationChild.prototype;
prototype$1.handleChange = child.handleChange;
prototype$1.joinKey = child.joinKey;

var ExpressionProxy = (function (Model$$1) {
	function ExpressionProxy ( fragment, template ) {
		var this$1 = this;

		Model$$1.call( this, fragment.ractive.viewmodel, null );

		this.fragment = fragment;
		this.template = template;

		this.isReadonly = true;
		this.dirty = true;

		this.fn = getFunction( template.s, template.r.length );

		this.models = this.template.r.map( function (ref) {
			return resolveReference( this$1.fragment, ref );
		});
		this.dependencies = [];

		this.shuffle = undefined;

		this.bubble();
	}

	if ( Model$$1 ) { ExpressionProxy.__proto__ = Model$$1; }
	ExpressionProxy.prototype = Object.create( Model$$1 && Model$$1.prototype );
	ExpressionProxy.prototype.constructor = ExpressionProxy;

	ExpressionProxy.prototype.bubble = function bubble ( actuallyChanged ) {
		if ( actuallyChanged === void 0 ) { actuallyChanged = true; }

		// refresh the keypath
		this.keypath = undefined;

		if ( actuallyChanged ) {
			this.handleChange();
		}
	};

	ExpressionProxy.prototype.getKeypath = function getKeypath () {
		var this$1 = this;

		if ( !this.template ) { return '@undefined'; }
		if ( !this.keypath ) {
			this.keypath = '@' + this.template.s.replace( /_(\d+)/g, function ( match, i ) {
				if ( i >= this$1.models.length ) { return match; }

				var model = this$1.models[i];
				return model ? model.getKeypath() : '@undefined';
			});
		}

		return this.keypath;
	};

	ExpressionProxy.prototype.getValue = function getValue () {
		var this$1 = this;

		startCapturing();
		var result;

		try {
			var params = this.models.map( function (m) { return m ? m.get( true ) : undefined; } );
			result = this.fn.apply( this.fragment.ractive, params );
		} catch ( err ) {
			warnIfDebug( ("Failed to compute " + (this.getKeypath()) + ": " + (err.message || err)) );
		}

		var dependencies = stopCapturing();
		// remove missing deps
		this.dependencies.filter( function (d) { return !~dependencies.indexOf( d ); } ).forEach( function (d) {
			d.unregister( this$1 );
			removeFromArray( this$1.dependencies, d );
		});
		// register new deps
		dependencies.filter( function (d) { return !~this$1.dependencies.indexOf( d ); } ).forEach( function (d) {
			d.register( this$1 );
			this$1.dependencies.push( d );
		});

		return result;
	};

	ExpressionProxy.prototype.rebind = function rebind ( next, previous, safe ) {
		var idx = this.models.indexOf( previous );

		if ( ~idx ) {
			next = rebindMatch( this.template.r[idx], next, previous );
			if ( next !== previous ) {
				previous.unregister( this );
				this.models.splice( idx, 1, next );
				if ( next ) { next.addShuffleRegister( this, 'mark' ); }
			}
		}
		this.bubble( !safe );
	};

	ExpressionProxy.prototype.retrieve = function retrieve () {
		return this.get();
	};

	ExpressionProxy.prototype.teardown = function teardown () {
		var this$1 = this;

		this.unbind();
		this.fragment = undefined;
		if ( this.dependencies ) { this.dependencies.forEach( function (d) { return d.unregister( this$1 ); } ); }
		Model$$1.prototype.teardown.call(this);
	};

	ExpressionProxy.prototype.unreference = function unreference () {
		Model$$1.prototype.unreference.call(this);
		if ( !this.deps.length && !this.refs ) { this.teardown(); }
	};

	ExpressionProxy.prototype.unregister = function unregister ( dep ) {
		Model$$1.prototype.unregister.call( this, dep );
		if ( !this.deps.length && !this.refs ) { this.teardown(); }
	};

	return ExpressionProxy;
}(Model));

var prototype = ExpressionProxy.prototype;
var computation = Computation.prototype;
prototype.get = computation.get;
prototype.handleChange = computation.handleChange;
prototype.joinKey = computation.joinKey;
prototype.mark = computation.mark;
prototype.unbind = noop$1;

var ReferenceExpressionChild = (function (Model$$1) {
	function ReferenceExpressionChild ( parent, key ) {
		Model$$1.call ( this, parent, key );
	}

	if ( Model$$1 ) { ReferenceExpressionChild.__proto__ = Model$$1; }
	ReferenceExpressionChild.prototype = Object.create( Model$$1 && Model$$1.prototype );
	ReferenceExpressionChild.prototype.constructor = ReferenceExpressionChild;

	ReferenceExpressionChild.prototype.applyValue = function applyValue ( value ) {
		if ( isEqual( value, this.value ) ) { return; }

		var parent = this.parent;
		var keys = [ this.key ];
		while ( parent ) {
			if ( parent.base ) {
				var target = parent.model.joinAll( keys );
				target.applyValue( value );
				break;
			}

			keys.unshift( parent.key );

			parent = parent.parent;
		}
	};

	ReferenceExpressionChild.prototype.joinKey = function joinKey ( key ) {
		if ( key === undefined || key === '' ) { return this; }

		if ( !this.childByKey.hasOwnProperty( key ) ) {
			var child = new ReferenceExpressionChild( this, key );
			this.children.push( child );
			this.childByKey[ key ] = child;
		}

		return this.childByKey[ key ];
	};

	ReferenceExpressionChild.prototype.retrieve = function retrieve () {
		var parent = this.parent.get();
		return parent && parent[ this.key ];
	};

	return ReferenceExpressionChild;
}(Model));

var ReferenceExpressionProxy = (function (Model$$1) {
	function ReferenceExpressionProxy ( fragment, template ) {
		var this$1 = this;

		Model$$1.call( this, null, null );
		this.dirty = true;
		this.root = fragment.ractive.viewmodel;
		this.template = template;

		this.base = resolve( fragment, template );

		var intermediary = this.intermediary = {
			handleChange: function () { return this$1.handleChange(); },
			rebind: function ( next, previous ) {
				if ( previous === this$1.base ) {
					next = rebindMatch( template, next, previous );
					if ( next !== this$1.base ) {
						this$1.base.unregister( intermediary );
						this$1.base = next;
					}
				} else {
					var idx = this$1.members.indexOf( previous );
					if ( ~idx ) {
						// only direct references will rebind... expressions handle themselves
						next = rebindMatch( template.m[idx].n, next, previous );
						if ( next !== this$1.members[idx] ) {
							this$1.members.splice( idx, 1, next );
						}
					}
				}

				if ( next !== previous ) { previous.unregister( intermediary ); }
				if ( next ) { next.addShuffleTask( function () { return next.register( intermediary ); } ); }

				this$1.bubble();
			}
		};

		this.members = template.m.map( function ( template ) {
			if ( typeof template === 'string' ) {
				return { get: function () { return template; } };
			}

			var model;

			if ( template.t === REFERENCE ) {
				model = resolveReference( fragment, template.n );
				model.register( intermediary );

				return model;
			}

			model = new ExpressionProxy( fragment, template );
			model.register( intermediary );
			return model;
		});

		this.bubble();
	}

	if ( Model$$1 ) { ReferenceExpressionProxy.__proto__ = Model$$1; }
	ReferenceExpressionProxy.prototype = Object.create( Model$$1 && Model$$1.prototype );
	ReferenceExpressionProxy.prototype.constructor = ReferenceExpressionProxy;

	ReferenceExpressionProxy.prototype.bubble = function bubble () {
		if ( !this.base ) { return; }
		if ( !this.dirty ) { this.handleChange(); }
	};

	ReferenceExpressionProxy.prototype.get = function get ( shouldCapture ) {
		if ( this.dirty ) {
			this.bubble();

			var keys = this.members.map( function (m) { return escapeKey( String( m.get() ) ); } );
			var model = this.base.joinAll( keys );

			if ( model !== this.model ) {
				if ( this.model ) {
					this.model.unregister( this );
					this.model.unregisterTwowayBinding( this );
				}

				this.model = model;
				this.parent = model.parent;
				this.model.register( this );
				this.model.registerTwowayBinding( this );

				if ( this.keypathModel ) { this.keypathModel.handleChange(); }
			}

			this.value = this.model.get( shouldCapture );
			this.dirty = false;
			this.mark();
			return this.value;
		} else {
			return this.model ? this.model.get( shouldCapture ) : undefined;
		}
	};

	// indirect two-way bindings
	ReferenceExpressionProxy.prototype.getValue = function getValue () {
		var this$1 = this;

		this.value = this.model ? this.model.get() : undefined;

		var i = this.bindings.length;
		while ( i-- ) {
			var value = this$1.bindings[i].getValue();
			if ( value !== this$1.value ) { return value; }
		}

		// check one-way bindings
		var oneway = findBoundValue( this.deps );
		if ( oneway ) { return oneway.value; }

		return this.value;
	};

	ReferenceExpressionProxy.prototype.getKeypath = function getKeypath () {
		return this.model ? this.model.getKeypath() : '@undefined';
	};

	ReferenceExpressionProxy.prototype.handleChange = function handleChange$$1 () {
		this.dirty = true;
		this.mark();
	};

	ReferenceExpressionProxy.prototype.joinKey = function joinKey ( key ) {
		if ( key === undefined || key === '' ) { return this; }

		if ( !this.childByKey.hasOwnProperty( key ) ) {
			var child = new ReferenceExpressionChild( this, key );
			this.children.push( child );
			this.childByKey[ key ] = child;
		}

		return this.childByKey[ key ];
	};

	ReferenceExpressionProxy.prototype.mark = function mark$1 () {
		if ( this.dirty ) {
			this.deps.forEach( handleChange );
		}

		this.links.forEach( marked );
		this.children.forEach( mark );
	};

	ReferenceExpressionProxy.prototype.retrieve = function retrieve () {
		return this.value;
	};

	ReferenceExpressionProxy.prototype.set = function set ( value ) {
		this.model.set( value );
	};

	ReferenceExpressionProxy.prototype.teardown = function teardown$$1 () {
		var this$1 = this;

		if ( this.model ) {
			this.model.unregister( this );
			this.model.unregisterTwowayBinding( this );
		}
		if ( this.members ) {
			this.members.forEach( function (m) { return m && m.unregister && m.unregister( this$1 ); } );
		}
	};

	ReferenceExpressionProxy.prototype.unreference = function unreference () {
		Model$$1.prototype.unreference.call(this);
		if ( !this.deps.length && !this.refs ) { this.teardown(); }
	};

	ReferenceExpressionProxy.prototype.unregister = function unregister ( dep ) {
		Model$$1.prototype.unregister.call( this, dep );
		if ( !this.deps.length && !this.refs ) { this.teardown(); }
	};

	return ReferenceExpressionProxy;
}(Model));

ReferenceExpressionProxy.prototype.rebind = noop$1;

function resolve ( fragment, template ) {
	if ( template.r ) {
		return resolveReference( fragment, template.r );
	}

	else if ( template.x ) {
		return new ExpressionProxy( fragment, template.x );
	}

	else if ( template.rx ) {
		return new ReferenceExpressionProxy( fragment, template.rx );
	}
}

function resolveAliases( aliases, fragment ) {
	var resolved = {};

	for ( var i = 0; i < aliases.length; i++ ) {
		resolved[ aliases[i].n ] = resolve( fragment, aliases[i].x );
	}

	for ( var k in resolved ) {
		resolved[k].reference();
	}

	return resolved;
}

var Alias = (function (ContainerItem$$1) {
	function Alias ( options ) {
		ContainerItem$$1.call( this, options );

		this.fragment = null;
	}

	if ( ContainerItem$$1 ) { Alias.__proto__ = ContainerItem$$1; }
	Alias.prototype = Object.create( ContainerItem$$1 && ContainerItem$$1.prototype );
	Alias.prototype.constructor = Alias;

	Alias.prototype.bind = function bind () {
		this.fragment = new Fragment({
			owner: this,
			template: this.template.f
		});

		this.fragment.aliases = resolveAliases( this.template.z, this.parentFragment );
		this.fragment.bind();
	};

	Alias.prototype.render = function render ( target ) {
		this.rendered = true;
		if ( this.fragment ) { this.fragment.render( target ); }
	};

	Alias.prototype.unbind = function unbind () {
		var this$1 = this;

		for ( var k in this$1.fragment.aliases ) {
			this$1.fragment.aliases[k].unreference();
		}

		this.fragment.aliases = {};
		if ( this.fragment ) { this.fragment.unbind(); }
	};

	Alias.prototype.unrender = function unrender ( shouldDestroy ) {
		if ( this.rendered && this.fragment ) { this.fragment.unrender( shouldDestroy ); }
		this.rendered = false;
	};

	Alias.prototype.update = function update () {
		if ( this.dirty ) {
			this.dirty = false;
			this.fragment.update();
		}
	};

	return Alias;
}(ContainerItem));

var space = /\s+/;

function readStyle ( css ) {
	if ( typeof css !== 'string' ) { return {}; }

	return cleanCss( css, function ( css, reconstruct ) {
		return css.split( ';' )
			.filter( function (rule) { return !!rule.trim(); } )
			.map( reconstruct )
			.reduce(function ( rules, rule ) {
				var i = rule.indexOf(':');
				var name = rule.substr( 0, i ).trim();
				rules[ name ] = rule.substr( i + 1 ).trim();
				return rules;
			}, {});
	});
}

function readClass ( str ) {
	var list = str.split( space );

  // remove any empty entries
	var i = list.length;
	while ( i-- ) {
		if ( !list[i] ) { list.splice( i, 1 ); }
	}

	return list;
}

var hyphenateCamel = function ( camelCaseStr ) {
	return camelCaseStr.replace( /([A-Z])/g, function ( match, $1 ) {
		return '-' + $1.toLowerCase();
	});
};

var textTypes = [ undefined, 'text', 'search', 'url', 'email', 'hidden', 'password', 'search', 'reset', 'submit' ];

function getUpdateDelegate ( attribute ) {
	var element = attribute.element;
	var name = attribute.name;

	if ( name === 'value' ) {
		if ( attribute.interpolator ) { attribute.interpolator.bound = true; }

		// special case - selects
		if ( element.name === 'select' && name === 'value' ) {
			return element.getAttribute( 'multiple' ) ? updateMultipleSelectValue : updateSelectValue;
		}

		if ( element.name === 'textarea' ) { return updateStringValue; }

		// special case - contenteditable
		if ( element.getAttribute( 'contenteditable' ) != null ) { return updateContentEditableValue; }

		// special case - <input>
		if ( element.name === 'input' ) {
			var type = element.getAttribute( 'type' );

			// type='file' value='{{fileList}}'>
			if ( type === 'file' ) { return noop$1; } // read-only

			// type='radio' name='{{twoway}}'
			if ( type === 'radio' && element.binding && element.binding.attribute.name === 'name' ) { return updateRadioValue; }

			if ( ~textTypes.indexOf( type ) ) { return updateStringValue; }
		}

		return updateValue;
	}

	var node = element.node;

	// special case - <input type='radio' name='{{twoway}}' value='foo'>
	if ( attribute.isTwoway && name === 'name' ) {
		if ( node.type === 'radio' ) { return updateRadioName; }
		if ( node.type === 'checkbox' ) { return updateCheckboxName; }
	}

	if ( name === 'style' ) { return updateStyleAttribute; }

	if ( name.indexOf( 'style-' ) === 0 ) { return updateInlineStyle; }

	// special case - class names. IE fucks things up, again
	if ( name === 'class' && ( !node.namespaceURI || node.namespaceURI === html ) ) { return updateClassName; }

	if ( name.indexOf( 'class-' ) === 0 ) { return updateInlineClass; }

	if ( attribute.isBoolean ) {
		var type$1 = element.getAttribute( 'type' );
		if ( attribute.interpolator && name === 'checked' && ( type$1 === 'checkbox' || type$1 === 'radio' ) ) { attribute.interpolator.bound = true; }
		return updateBoolean;
	}

	if ( attribute.namespace && attribute.namespace !== attribute.node.namespaceURI ) { return updateNamespacedAttribute; }

	return updateAttribute;
}

function updateMultipleSelectValue ( reset ) {
	var value = this.getValue();

	if ( !Array.isArray( value ) ) { value = [ value ]; }

	var options = this.node.options;
	var i = options.length;

	if ( reset ) {
		while ( i-- ) { options[i].selected = false; }
	} else {
		while ( i-- ) {
			var option = options[i];
			var optionValue = option._ractive ?
				option._ractive.value :
				option.value; // options inserted via a triple don't have _ractive

			option.selected = arrayContains( value, optionValue );
		}
	}
}

function updateSelectValue ( reset ) {
	var value = this.getValue();

	if ( !this.locked ) { // TODO is locked still a thing?
		this.node._ractive.value = value;

		var options = this.node.options;
		var i = options.length;
		var wasSelected = false;

		if ( reset ) {
			while ( i-- ) { options[i].selected = false; }
		} else {
			while ( i-- ) {
				var option = options[i];
				var optionValue = option._ractive ?
					option._ractive.value :
					option.value; // options inserted via a triple don't have _ractive
				if ( option.disabled && option.selected ) { wasSelected = true; }

				if ( optionValue == value ) { // double equals as we may be comparing numbers with strings
					option.selected = true;
					return;
				}
			}
		}

		if ( !wasSelected ) { this.node.selectedIndex = -1; }
	}
}


function updateContentEditableValue ( reset ) {
	var value = this.getValue();

	if ( !this.locked ) {
		if ( reset ) { this.node.innerHTML = ''; }
		else { this.node.innerHTML = value === undefined ? '' : value; }
	}
}

function updateRadioValue ( reset ) {
	var node = this.node;
	var wasChecked = node.checked;

	var value = this.getValue();

	if ( reset ) { return node.checked = false; }

	//node.value = this.element.getAttribute( 'value' );
	node.value = this.node._ractive.value = value;
	node.checked = this.element.compare( value, this.element.getAttribute( 'name' ) );

	// This is a special case - if the input was checked, and the value
	// changed so that it's no longer checked, the twoway binding is
	// most likely out of date. To fix it we have to jump through some
	// hoops... this is a little kludgy but it works
	if ( wasChecked && !node.checked && this.element.binding && this.element.binding.rendered ) {
		this.element.binding.group.model.set( this.element.binding.group.getValue() );
	}
}

function updateValue ( reset ) {
	if ( !this.locked ) {
		if ( reset ) {
			this.node.removeAttribute( 'value' );
			this.node.value = this.node._ractive.value = null;
		} else {
			var value = this.getValue();

			this.node.value = this.node._ractive.value = value;
			this.node.setAttribute( 'value', safeToStringValue( value ) );
		}
	}
}

function updateStringValue ( reset ) {
	if ( !this.locked ) {
		if ( reset ) {
			this.node._ractive.value = '';
			this.node.removeAttribute( 'value' );
		} else {
			var value = this.getValue();

			this.node._ractive.value = value;

			this.node.value = safeToStringValue( value );
			this.node.setAttribute( 'value', safeToStringValue( value ) );
		}
	}
}

function updateRadioName ( reset ) {
	if ( reset ) { this.node.checked = false; }
	else { this.node.checked = this.element.compare( this.getValue(), this.element.binding.getValue() ); }
}

function updateCheckboxName ( reset ) {
	var ref = this;
	var element = ref.element;
	var node = ref.node;
	var binding = element.binding;

	var value = this.getValue();
	var valueAttribute = element.getAttribute( 'value' );

	if ( reset ) {
		// TODO: WAT?
	}

	if ( !Array.isArray( value ) ) {
		binding.isChecked = node.checked = element.compare( value, valueAttribute );
	} else {
		var i = value.length;
		while ( i-- ) {
			if ( element.compare ( valueAttribute, value[i] ) ) {
				binding.isChecked = node.checked = true;
				return;
			}
		}
		binding.isChecked = node.checked = false;
	}
}

function updateStyleAttribute ( reset ) {
	var props = reset ? {} : readStyle( this.getValue() || '' );
	var style = this.node.style;
	var keys = Object.keys( props );
	var prev = this.previous || [];

	var i = 0;
	while ( i < keys.length ) {
		if ( keys[i] in style ) {
			var safe = props[ keys[i] ].replace( '!important', '' );
			style.setProperty( keys[i], safe, safe.length !== props[ keys[i] ].length ? 'important' : '' );
		}
		i++;
	}

	// remove now-missing attrs
	i = prev.length;
	while ( i-- ) {
		if ( !~keys.indexOf( prev[i] ) && prev[i] in style ) { style.setProperty( prev[i], '', '' ); }
	}

	this.previous = keys;
}

function updateInlineStyle ( reset ) {
	if ( !this.style ) {
		this.style = hyphenateCamel( this.name.substr( 6 ) );
	}

	var value = reset ? '' : safeToStringValue( this.getValue() );
	var safe = value.replace( '!important', '' );
	this.node.style.setProperty( this.style, safe, safe.length !== value.length ? 'important' : '' );
}

function updateClassName ( reset ) {
	var value = reset ? [] : readClass( safeToStringValue( this.getValue() ) );

	// watch out for werdo svg elements
	var cls = this.node.className;
	cls = cls.baseVal !== undefined ? cls.baseVal : cls;

	var attr = readClass( cls );
	var prev = this.previous || attr.slice( 0 );

	var className = value.concat( attr.filter( function (c) { return !~prev.indexOf( c ); } ) ).join( ' ' );

	if ( className !== cls ) {
		if ( typeof this.node.className !== 'string' ) {
			this.node.className.baseVal = className;
		} else {
			this.node.className = className;
		}
	}

	this.previous = value;
}

function updateInlineClass ( reset ) {
	var name = this.name.substr( 6 );

	// watch out for werdo svg elements
	var cls = this.node.className;
	cls = cls.baseVal !== undefined ? cls.baseVal : cls;

	var attr = readClass( cls );
	var value = reset ? false : this.getValue();

	if ( !this.inlineClass ) { this.inlineClass = name; }

	if ( value && !~attr.indexOf( name ) ) { attr.push( name ); }
	else if ( !value && ~attr.indexOf( name ) ) { attr.splice( attr.indexOf( name ), 1 ); }

	if ( typeof this.node.className !== 'string' ) {
		this.node.className.baseVal = attr.join( ' ' );
	} else {
		this.node.className = attr.join( ' ' );
	}
}

function updateBoolean ( reset ) {
	// with two-way binding, only update if the change wasn't initiated by the user
	// otherwise the cursor will often be sent to the wrong place
	if ( !this.locked ) {
		if ( reset ) {
			if ( this.useProperty ) { this.node[ this.propertyName ] = false; }
			this.node.removeAttribute( this.propertyName );
		} else {
			if ( this.useProperty ) {
				this.node[ this.propertyName ] = this.getValue();
			} else {
				if ( this.getValue() ) {
					this.node.setAttribute( this.propertyName, '' );
				} else {
					this.node.removeAttribute( this.propertyName );
				}
			}
		}
	}
}

function updateAttribute ( reset ) {
	if ( reset ) { this.node.removeAttribute( this.name ); }
	else { this.node.setAttribute( this.name, safeToStringValue( this.getString() ) ); }
}

function updateNamespacedAttribute ( reset ) {
	if ( reset ) { this.node.removeAttributeNS( this.namespace, this.name.slice( this.name.indexOf( ':' ) + 1 ) ); }
	else { this.node.setAttributeNS( this.namespace, this.name.slice( this.name.indexOf( ':' ) + 1 ), safeToStringValue( this.getString() ) ); }
}

var propertyNames = {
	'accept-charset': 'acceptCharset',
	accesskey: 'accessKey',
	bgcolor: 'bgColor',
	class: 'className',
	codebase: 'codeBase',
	colspan: 'colSpan',
	contenteditable: 'contentEditable',
	datetime: 'dateTime',
	dirname: 'dirName',
	for: 'htmlFor',
	'http-equiv': 'httpEquiv',
	ismap: 'isMap',
	maxlength: 'maxLength',
	novalidate: 'noValidate',
	pubdate: 'pubDate',
	readonly: 'readOnly',
	rowspan: 'rowSpan',
	tabindex: 'tabIndex',
	usemap: 'useMap'
};

var div$1 = doc ? createElement( 'div' ) : null;

var attributes = false;
function inAttributes() { return attributes; }
function doInAttributes( fn ) {
	attributes = true;
	fn();
	attributes = false;
}

var ConditionalAttribute = (function (Item$$1) {
	function ConditionalAttribute ( options ) {
		Item$$1.call( this, options );

		this.attributes = [];

		this.owner = options.owner;

		this.fragment = new Fragment({
			ractive: this.ractive,
			owner: this,
			template: this.template
		});
		// this fragment can't participate in node-y things
		this.fragment.findNextNode = noop$1;

		this.dirty = false;
	}

	if ( Item$$1 ) { ConditionalAttribute.__proto__ = Item$$1; }
	ConditionalAttribute.prototype = Object.create( Item$$1 && Item$$1.prototype );
	ConditionalAttribute.prototype.constructor = ConditionalAttribute;

	ConditionalAttribute.prototype.bind = function bind () {
		this.fragment.bind();
	};

	ConditionalAttribute.prototype.bubble = function bubble () {
		if ( !this.dirty ) {
			this.dirty = true;
			this.owner.bubble();
		}
	};

	ConditionalAttribute.prototype.render = function render () {
		this.node = this.owner.node;
		if ( this.node ) {
			this.isSvg = this.node.namespaceURI === svg$1;
		}

		attributes = true;
		if ( !this.rendered ) { this.fragment.render(); }

		this.rendered = true;
		this.dirty = true; // TODO this seems hacky, but necessary for tests to pass in browser AND node.js
		this.update();
		attributes = false;
	};

	ConditionalAttribute.prototype.toString = function toString () {
		return this.fragment.toString();
	};

	ConditionalAttribute.prototype.unbind = function unbind () {
		this.fragment.unbind();
	};

	ConditionalAttribute.prototype.unrender = function unrender () {
		this.rendered = false;
		this.fragment.unrender();
	};

	ConditionalAttribute.prototype.update = function update () {
		var this$1 = this;

		var str;
		var attrs;

		if ( this.dirty ) {
			this.dirty = false;

			var current = attributes;
			attributes = true;
			this.fragment.update();
			attributes = current || false;

			if ( this.rendered && this.node ) {
				str = this.fragment.toString();
				attrs = parseAttributes( str, this.isSvg );

				// any attributes that previously existed but no longer do
				// must be removed
				this.attributes.filter( function (a) { return notIn( attrs, a ); } ).forEach( function (a) {
					this$1.node.removeAttribute( a.name );
				});

				attrs.forEach( function (a) {
					this$1.node.setAttribute( a.name, a.value );
				});

				this.attributes = attrs;
			}
		}
	};

	return ConditionalAttribute;
}(Item));

function parseAttributes ( str, isSvg ) {
	var tagName = isSvg ? 'svg' : 'div';
	return str
		? (div$1.innerHTML = "<" + tagName + " " + str + "></" + tagName + ">") &&
			toArray(div$1.childNodes[0].attributes)
		: [];
}

function notIn ( haystack, needle ) {
	var i = haystack.length;

	while ( i-- ) {
		if ( haystack[i].name === needle.name ) {
			return false;
		}
	}

	return true;
}

function lookupNamespace ( node, prefix ) {
	var qualified = "xmlns:" + prefix;

	while ( node ) {
		if ( node.hasAttribute && node.hasAttribute( qualified ) ) { return node.getAttribute( qualified ); }
		node = node.parentNode;
	}

	return namespaces[ prefix ];
}

var attribute = false;
function inAttribute () { return attribute; }

var Attribute = (function (Item$$1) {
	function Attribute ( options ) {
		Item$$1.call( this, options );

		this.name = options.template.n;
		this.namespace = null;

		this.owner = options.owner || options.parentFragment.owner || options.element || findElement( options.parentFragment );
		this.element = options.element || (this.owner.attributeByName ? this.owner : findElement( options.parentFragment ) );
		this.parentFragment = options.parentFragment; // shared
		this.ractive = this.parentFragment.ractive;

		this.rendered = false;
		this.updateDelegate = null;
		this.fragment = null;

		this.element.attributeByName[ this.name ] = this;

		if ( !Array.isArray( options.template.f ) ) {
			this.value = options.template.f;
			if ( this.value === 0 ) {
				this.value = '';
			}
		} else {
			this.fragment = new Fragment({
				owner: this,
				template: options.template.f
			});
		}

		this.interpolator = this.fragment &&
			this.fragment.items.length === 1 &&
			this.fragment.items[0].type === INTERPOLATOR &&
			this.fragment.items[0];

		if ( this.interpolator ) { this.interpolator.owner = this; }
	}

	if ( Item$$1 ) { Attribute.__proto__ = Item$$1; }
	Attribute.prototype = Object.create( Item$$1 && Item$$1.prototype );
	Attribute.prototype.constructor = Attribute;

	Attribute.prototype.bind = function bind () {
		if ( this.fragment ) {
			this.fragment.bind();
		}
	};

	Attribute.prototype.bubble = function bubble () {
		if ( !this.dirty ) {
			this.parentFragment.bubble();
			this.element.bubble();
			this.dirty = true;
		}
	};

	Attribute.prototype.getString = function getString () {
		attribute = true;
		var value = this.fragment ?
			this.fragment.toString() :
			this.value != null ? '' + this.value : '';
		attribute = false;
		return value;
	};

	// TODO could getValue ever be called for a static attribute,
	// or can we assume that this.fragment exists?
	Attribute.prototype.getValue = function getValue () {
		attribute = true;
		var value = this.fragment ? this.fragment.valueOf() : booleanAttributes.test( this.name ) ? true : this.value;
		attribute = false;
		return value;
	};

	Attribute.prototype.render = function render () {
		var node = this.element.node;
		this.node = node;

		// should we use direct property access, or setAttribute?
		if ( !node.namespaceURI || node.namespaceURI === namespaces.html ) {
			this.propertyName = propertyNames[ this.name ] || this.name;

			if ( node[ this.propertyName ] !== undefined ) {
				this.useProperty = true;
			}

			// is attribute a boolean attribute or 'value'? If so we're better off doing e.g.
			// node.selected = true rather than node.setAttribute( 'selected', '' )
			if ( booleanAttributes.test( this.name ) || this.isTwoway ) {
				this.isBoolean = true;
			}

			if ( this.propertyName === 'value' ) {
				node._ractive.value = this.value;
			}
		}

		if ( node.namespaceURI ) {
			var index = this.name.indexOf( ':' );
			if ( index !== -1 ) {
				this.namespace = lookupNamespace( node, this.name.slice( 0, index ) );
			} else {
				this.namespace = node.namespaceURI;
			}
		}

		this.rendered = true;
		this.updateDelegate = getUpdateDelegate( this );
		this.updateDelegate();
	};

	Attribute.prototype.toString = function toString () {
		if ( inAttributes() ) { return ''; }
		attribute = true;

		var value = this.getValue();

		// Special case - select and textarea values (should not be stringified)
		if ( this.name === 'value' && ( this.element.getAttribute( 'contenteditable' ) !== undefined || ( this.element.name === 'select' || this.element.name === 'textarea' ) ) ) {
			return;
		}

		// Special case â€“ bound radio `name` attributes
		if ( this.name === 'name' && this.element.name === 'input' && this.interpolator && this.element.getAttribute( 'type' ) === 'radio' ) {
			return ("name=\"{{" + (this.interpolator.model.getKeypath()) + "}}\"");
		}

		// Special case - style and class attributes and directives
		if ( this.owner === this.element && ( this.name === 'style' || this.name === 'class' || this.style || this.inlineClass ) ) {
			return;
		}

		if ( !this.rendered && this.owner === this.element && ( !this.name.indexOf( 'style-' ) || !this.name.indexOf( 'class-' ) ) ) {
			if ( !this.name.indexOf( 'style-' ) ) {
				this.style = hyphenateCamel( this.name.substr( 6 ) );
			} else {
				this.inlineClass = this.name.substr( 6 );
			}

			return;
		}

		if ( booleanAttributes.test( this.name ) ) { return value ? this.name : ''; }
		if ( value == null ) { return ''; }

		var str = safeAttributeString( this.getString() );
		attribute = false;

		return str ?
			((this.name) + "=\"" + str + "\"") :
			this.name;
	};

	Attribute.prototype.unbind = function unbind () {
		if ( this.fragment ) { this.fragment.unbind(); }
	};

	Attribute.prototype.unrender = function unrender () {
		this.updateDelegate( true );

		this.rendered = false;
	};

	Attribute.prototype.update = function update () {
		if ( this.dirty ) {
			this.dirty = false;
			if ( this.fragment ) { this.fragment.update(); }
			if ( this.rendered ) { this.updateDelegate(); }
			if ( this.isTwoway && !this.locked ) {
				this.interpolator.twowayBinding.lastVal( true, this.interpolator.model.get() );
			}
		}
	};

	return Attribute;
}(Item));

var BindingFlag = (function (Item$$1) {
	function BindingFlag ( options ) {
		Item$$1.call( this, options );

		this.owner = options.owner || options.parentFragment.owner || findElement( options.parentFragment );
		this.element = this.owner.attributeByName ? this.owner : findElement( options.parentFragment );
		this.flag = options.template.v === 'l' ? 'lazy' : 'twoway';

		if ( this.element.type === ELEMENT ) {
			if ( Array.isArray( options.template.f ) ) {
				this.fragment = new Fragment({
					owner: this,
					template: options.template.f
				});
			}

			this.interpolator = this.fragment &&
								this.fragment.items.length === 1 &&
								this.fragment.items[0].type === INTERPOLATOR &&
								this.fragment.items[0];
		}
	}

	if ( Item$$1 ) { BindingFlag.__proto__ = Item$$1; }
	BindingFlag.prototype = Object.create( Item$$1 && Item$$1.prototype );
	BindingFlag.prototype.constructor = BindingFlag;

	BindingFlag.prototype.bind = function bind () {
		if ( this.fragment ) { this.fragment.bind(); }
		set$1( this, this.getValue(), true );
	};

	BindingFlag.prototype.bubble = function bubble () {
		if ( !this.dirty ) {
			this.element.bubble();
			this.dirty = true;
		}
	};

	BindingFlag.prototype.getValue = function getValue () {
		if ( this.fragment ) { return this.fragment.valueOf(); }
		else if ( 'value' in this ) { return this.value; }
		else if ( 'f' in this.template ) { return this.template.f; }
		else { return true; }
	};

	BindingFlag.prototype.render = function render () {
		set$1( this, this.getValue(), true );
	};

	BindingFlag.prototype.toString = function toString () { return ''; };

	BindingFlag.prototype.unbind = function unbind () {
		if ( this.fragment ) { this.fragment.unbind(); }

		delete this.element[ this.flag ];
	};

	BindingFlag.prototype.unrender = function unrender () {
		if ( this.element.rendered ) { this.element.recreateTwowayBinding(); }
	};

	BindingFlag.prototype.update = function update () {
		if ( this.dirty ) {
			if ( this.fragment ) { this.fragment.update(); }
			set$1( this, this.getValue(), true );
		}
	};

	return BindingFlag;
}(Item));

function set$1 ( flag, value, update ) {
	if ( value === 0 ) {
		flag.value = true;
	} else if ( value === 'true' ) {
		flag.value = true;
	} else if ( value === 'false' || value === '0' ) {
		flag.value = false;
	} else {
		flag.value = value;
	}

	var current = flag.element[ flag.flag ];
	flag.element[ flag.flag ] = flag.value;
	if ( update && !flag.element.attributes.binding && current !== flag.value ) {
		flag.element.recreateTwowayBinding();
	}

	return flag.value;
}

var RactiveModel = (function (Model$$1) {
	function RactiveModel ( ractive ) {
		Model$$1.call( this, null, '' );
		this.value = ractive;
		this.isRoot = true;
		this.root = this;
		this.adaptors = [];
		this.ractive = ractive;
	}

	if ( Model$$1 ) { RactiveModel.__proto__ = Model$$1; }
	RactiveModel.prototype = Object.create( Model$$1 && Model$$1.prototype );
	RactiveModel.prototype.constructor = RactiveModel;

	RactiveModel.prototype.joinKey = function joinKey ( key ) {
		var model = Model$$1.prototype.joinKey.call( this, key );

		if ( ( key === 'root' || key === 'parent' ) && !model.isLink ) { return initLink( model, key ); }
		else if ( key === 'data' ) { return this.ractive.viewmodel; }

		return model;
	};

	RactiveModel.prototype.getKeypath = function getKeypath () {
		return '@this';
	};

	RactiveModel.prototype.retrieve = function retrieve () {
		return this.ractive;
	};

	return RactiveModel;
}(Model));

function initLink ( model, key ) {
	model.applyValue = function ( value ) {
		this.parent.value[ key ] = value;
		if ( value && value.viewmodel ) {
			this.link( value.viewmodel.getRactiveModel(), key );
			this._link.markedAll();
		} else {
			this.link( Object.create( Missing ), key );
			this._link.markedAll();
		}
	};

	model.applyValue( model.parent.ractive[ key ], key );
	model._link.set = function (v) { return model.applyValue( v ); };
	model._link.applyValue = function (v) { return model.applyValue( v ); };
	return model._link;
}

var hasProp$1 = Object.prototype.hasOwnProperty;

var RootModel = (function (Model$$1) {
	function RootModel ( options ) {
		Model$$1.call( this, null, null );

		this.isRoot = true;
		this.root = this;
		this.ractive = options.ractive; // TODO sever this link

		this.value = options.data;
		this.adaptors = options.adapt;
		this.adapt();

		this.computationContext = options.ractive;
		this.computations = {};
	}

	if ( Model$$1 ) { RootModel.__proto__ = Model$$1; }
	RootModel.prototype = Object.create( Model$$1 && Model$$1.prototype );
	RootModel.prototype.constructor = RootModel;

	RootModel.prototype.attached = function attached ( fragment ) {
		attachImplicits( this, fragment );
	};

	RootModel.prototype.compute = function compute ( key, signature ) {
		var computation = new Computation( this, signature, key );
		this.computations[ escapeKey( key ) ] = computation;

		return computation;
	};

	RootModel.prototype.createLink = function createLink ( keypath, target, targetPath, options ) {
		var this$1 = this;

		var keys = splitKeypath( keypath );

		var model = this;
		while ( keys.length ) {
			var key = keys.shift();
			model = this$1.childByKey[ key ] || this$1.joinKey( key );
		}

		return model.link( target, targetPath, options );
	};

	RootModel.prototype.detached = function detached () {
		detachImplicits( this );
	};

	RootModel.prototype.get = function get ( shouldCapture, options ) {
		var this$1 = this;

		if ( shouldCapture ) { capture( this ); }

		if ( !options || options.virtual !== false ) {
			var result = this.getVirtual();
			var keys = Object.keys( this.computations );
			var i = keys.length;
			while ( i-- ) {
				result[ keys[i] ] = this$1.computations[ keys[i] ].get();
			}

			return result;
		} else {
			return this.value;
		}
	};

	RootModel.prototype.getKeypath = function getKeypath () {
		return '';
	};

	RootModel.prototype.getRactiveModel = function getRactiveModel () {
		return this.ractiveModel || ( this.ractiveModel = new RactiveModel( this.ractive ) );
	};

	RootModel.prototype.getValueChildren = function getValueChildren () {
		var this$1 = this;

		var children = Model$$1.prototype.getValueChildren.call( this, this.value );

		this.children.forEach( function (child) {
			if ( child._link ) {
				var idx = children.indexOf( child );
				if ( ~idx ) { children.splice( idx, 1, child._link ); }
				else { children.push( child._link ); }
			}
		});

		for ( var k in this$1.computations ) {
			children.push( this$1.computations[k] );
		}

		return children;
	};

	RootModel.prototype.has = function has ( key ) {
		var value = this.value;
		var unescapedKey = unescapeKey( key );

		if ( unescapedKey === '@this' || unescapedKey === '@global' || unescapedKey === '@shared' ) { return true; }
		if ( unescapedKey[0] === '~' && unescapedKey[1] === '/' ) { unescapedKey = unescapedKey.slice( 2 ); }
		if ( hasProp$1.call( value, unescapedKey ) ) { return true; }

		// mappings/links and computations
		if ( key in this.computations || this.childByKey[unescapedKey] && this.childByKey[unescapedKey]._link ) { return true; }

		// We climb up the constructor chain to find if one of them contains the unescapedKey
		var constructor = value.constructor;
		while ( constructor !== Function && constructor !== Array && constructor !== Object ) {
			if ( hasProp$1.call( constructor.prototype, unescapedKey ) ) { return true; }
			constructor = constructor.constructor;
		}

		return false;
	};

	RootModel.prototype.joinKey = function joinKey ( key, opts ) {
		if ( key[0] === '@' ) {
			if ( key === '@this' || key === '@' ) { return this.getRactiveModel(); }
			if ( key === '@global' ) { return GlobalModel; }
			if ( key === '@shared' ) { return SharedModel$1; }
			return;
		}

		if ( key[0] === '~' && key[1] === '/' ) { key = key.slice( 2 ); }

		return this.computations.hasOwnProperty( key ) ? this.computations[ key ] :
		       Model$$1.prototype.joinKey.call( this, key, opts );
	};

	// TODO: this should go away
	RootModel.prototype.map = function map ( localKey, origin, options ) {
		var local = this.joinKey( localKey );
		local.link( origin, localKey, options );
	};

	RootModel.prototype.set = function set ( value ) {
		// TODO wrapping root node is a baaaad idea. We should prevent this
		var wrapper = this.wrapper;
		if ( wrapper ) {
			var shouldTeardown = !wrapper.reset || wrapper.reset( value ) === false;

			if ( shouldTeardown ) {
				wrapper.teardown();
				this.wrapper = null;
				this.value = value;
				this.adapt();
			}
		} else {
			this.value = value;
			this.adapt();
		}

		this.deps.forEach( handleChange );
		this.children.forEach( mark );
	};

	RootModel.prototype.retrieve = function retrieve () {
		return this.wrapper ? this.wrapper.get() : this.value;
	};

	RootModel.prototype.teardown = function teardown$$1 () {
		var this$1 = this;

		Model$$1.prototype.teardown.call(this);
		for ( var k in this$1.computations ) {
			this$1.computations[ k ].teardown();
		}
	};

	return RootModel;
}(Model));

RootModel.prototype.update = noop$1;

function attachImplicits ( model, fragment ) {
	if ( model._link && model._link.implicit && model._link.isDetached() ) {
		model.attach( fragment );
	}

	// look for virtual children to relink and cascade
	for ( var k in model.childByKey ) {
		if ( k in model.value ) {
			attachImplicits( model.childByKey[k], fragment );
		} else if ( !model.childByKey[k]._link || model.childByKey[k]._link.isDetached() ) {
			var mdl = resolveReference( fragment, k );
			if ( mdl ) {
				model.childByKey[k].link( mdl, k, { implicit: true } );
			}
		}
	}
}

function detachImplicits ( model ) {
	if ( model._link && model._link.implicit ) {
		model.unlink();
	}

	for ( var k in model.childByKey ) {
		detachImplicits( model.childByKey[k] );
	}
}

function getComputationSignature ( ractive, key, signature ) {
	var getter;
	var setter;

	// useful for debugging
	var getterString;
	var getterUseStack;
	var setterString;

	if ( typeof signature === 'function' ) {
		getter = bind$1( signature, ractive );
		getterString = signature.toString();
		getterUseStack = true;
	}

	if ( typeof signature === 'string' ) {
		getter = createFunctionFromString( signature, ractive );
		getterString = signature;
	}

	if ( typeof signature === 'object' ) {
		if ( typeof signature.get === 'string' ) {
			getter = createFunctionFromString( signature.get, ractive );
			getterString = signature.get;
		} else if ( typeof signature.get === 'function' ) {
			getter = bind$1( signature.get, ractive );
			getterString = signature.get.toString();
			getterUseStack = true;
		} else {
			fatal( '`%s` computation must have a `get()` method', key );
		}

		if ( typeof signature.set === 'function' ) {
			setter = bind$1( signature.set, ractive );
			setterString = signature.set.toString();
		}
	}

	return {
		getter: getter,
		setter: setter,
		getterString: getterString,
		setterString: setterString,
		getterUseStack: getterUseStack
	};
}

var constructHook = new Hook( 'construct' );

var registryNames$1 = [
	'adaptors',
	'components',
	'decorators',
	'easing',
	'events',
	'interpolators',
	'partials',
	'transitions'
];

var uid = 0;

function construct ( ractive, options ) {
	if ( Ractive.DEBUG ) { welcome(); }

	initialiseProperties( ractive );
	handleAttributes( ractive );

	// if there's not a delegation setting, inherit from parent if it's not default
	if ( !options.hasOwnProperty( 'delegate' ) && ractive.parent && ractive.parent.delegate !== ractive.delegate ) {
		ractive.delegate = false;
	}

	// TODO don't allow `onconstruct` with `new Ractive()`, there's no need for it
	constructHook.fire( ractive, options );

	// Add registries
	var i = registryNames$1.length;
	while ( i-- ) {
		var name = registryNames$1[ i ];
		ractive[ name ] = Object.assign( Object.create( ractive.constructor[ name ] || null ), options[ name ] );
	}

	if ( ractive._attributePartial ) {
		ractive.partials['extra-attributes'] = ractive._attributePartial;
		delete ractive._attributePartial;
	}

	// Create a viewmodel
	var viewmodel = new RootModel({
		adapt: getAdaptors( ractive, ractive.adapt, options ),
		data: dataConfigurator.init( ractive.constructor, ractive, options ),
		ractive: ractive
	});

	ractive.viewmodel = viewmodel;

	// Add computed properties
	var computed = Object.assign( Object.create( ractive.constructor.prototype.computed ), options.computed );

	for ( var key in computed ) {
		if ( key === '__proto__' ) { continue; }
		var signature = getComputationSignature( ractive, key, computed[ key ] );
		viewmodel.compute( key, signature );
	}
}

function getAdaptors ( ractive, protoAdapt, options ) {
	protoAdapt = protoAdapt.map( lookup );
	var adapt = ensureArray( options.adapt ).map( lookup );

	var srcs = [ protoAdapt, adapt ];
	if ( ractive.parent && !ractive.isolated ) {
		srcs.push( ractive.parent.viewmodel.adaptors );
	}

	return combine.apply( null, srcs );

	function lookup ( adaptor ) {
		if ( typeof adaptor === 'string' ) {
			adaptor = findInViewHierarchy( 'adaptors', ractive, adaptor );

			if ( !adaptor ) {
				fatal( missingPlugin( adaptor, 'adaptor' ) );
			}
		}

		return adaptor;
	}
}

function initialiseProperties ( ractive ) {
	// Generate a unique identifier, for places where you'd use a weak map if it
	// existed
	ractive._guid = 'r-' + uid++;

	// events
	ractive._subs = Object.create( null );
	ractive._nsSubs = 0;

	// storage for item configuration from instantiation to reset,
	// like dynamic functions or original values
	ractive._config = {};

	// events
	ractive.event = null;
	ractive._eventQueue = [];

	// observers
	ractive._observers = [];

	// external children
	ractive._children = [];
	ractive._children.byName = {};
	ractive.children = ractive._children;

	if ( !ractive.component ) {
		ractive.root = ractive;
		ractive.parent = ractive.container = null; // TODO container still applicable?
	}
}

function handleAttributes ( ractive ) {
	var component = ractive.component;
	var attributes = ractive.constructor.attributes;

	if ( attributes && component ) {
		var tpl = component.template;
		var attrs = tpl.m ? tpl.m.slice() : [];

		// grab all of the passed attribute names
		var props = attrs.filter( function (a) { return a.t === ATTRIBUTE; } ).map( function (a) { return a.n; } );

		// warn about missing requireds
		attributes.required.forEach( function (p) {
			if ( !~props.indexOf( p ) ) {
				warnIfDebug( ("Component '" + (component.name) + "' requires attribute '" + p + "' to be provided") );
			}
		});

		// set up a partial containing non-property attributes
		var all = attributes.optional.concat( attributes.required );
		var partial = [];
		var i = attrs.length;
		while ( i-- ) {
			var a = attrs[i];
			if ( a.t === ATTRIBUTE && !~all.indexOf( a.n ) ) {
				if ( attributes.mapAll ) {
					// map the attribute if requested and make the extra attribute in the partial refer to the mapping
					partial.unshift({ t: ATTRIBUTE, n: a.n, f: [{ t: INTERPOLATOR, r: ("~/" + (a.n)) }] });
				} else {
					// transfer the attribute to the extra attributes partal
					partial.unshift( attrs.splice( i, 1 )[0] );
				}
			}
		}

		if ( partial.length ) { component.template = { t: tpl.t, e: tpl.e, f: tpl.f, m: attrs, p: tpl.p }; }
		ractive._attributePartial = partial;
	}
}

var teardownHook = new Hook( 'teardown' );
var destructHook = new Hook( 'destruct' );

// Teardown. This goes through the root fragment and all its children, removing observers
// and generally cleaning up after itself

function Ractive$teardown () {
	var this$1 = this;

	if ( this.torndown ) {
		warnIfDebug( 'ractive.teardown() was called on a Ractive instance that was already torn down' );
		return Promise.resolve();
	}

	this.shouldDestroy = true;
	return teardown$1( this, function () { return this$1.fragment.rendered ? this$1.unrender() : Promise.resolve(); } );
}

function teardown$1 ( instance, getPromise ) {
	instance.torndown = true;
	instance.viewmodel.teardown();
	instance.fragment.unbind();
	instance._observers.slice().forEach( cancel );

	if ( instance.el && instance.el.__ractive_instances__ ) {
		removeFromArray( instance.el.__ractive_instances__, instance );
	}

	var promise = getPromise();

	teardownHook.fire( instance );
	promise.then( function () { return destructHook.fire( instance ); } );

	return promise;
}

var Component = (function (Item$$1) {
	function Component ( options, ComponentConstructor ) {
		var this$1 = this;

		Item$$1.call( this, options );
		this.isAnchor = this.template.t === ANCHOR;
		this.type = this.isAnchor ? ANCHOR : COMPONENT; // override ELEMENT from super

		var partials = options.template.p || {};
		if ( !( 'content' in partials ) ) { partials.content = options.template.f || []; }
		this._partials = partials; // TEMP

		if ( this.isAnchor ) {
			this.name = options.template.n;

			this.addChild = addChild;
			this.removeChild = removeChild;
		} else {
			var instance = Object.create( ComponentConstructor.prototype );

			this.instance = instance;
			this.name = options.template.e;

			if ( instance.el ) {
				warnIfDebug( ("The <" + (this.name) + "> component has a default 'el' property; it has been disregarded") );
			}

			// find container
			var fragment = options.parentFragment;
			var container;
			while ( fragment ) {
				if ( fragment.owner.type === YIELDER ) {
					container = fragment.owner.container;
					break;
				}

				fragment = fragment.parent;
			}

			// add component-instance-specific properties
			instance.parent = this.parentFragment.ractive;
			instance.container = container || null;
			instance.root = instance.parent.root;
			instance.component = this;

			construct( this.instance, { partials: partials });

			// for hackability, this could be an open option
			// for any ractive instance, but for now, just
			// for components and just for ractive...
			instance._inlinePartials = partials;
		}

		this.attributeByName = {};

		this.events = [];
		this.attributes = [];
		var leftovers = [];
		( this.template.m || [] ).forEach( function (template) {
			switch ( template.t ) {
				case ATTRIBUTE:
				case EVENT:
					this$1.attributes.push( createItem({
						owner: this$1,
						parentFragment: this$1.parentFragment,
						template: template
					}) );
					break;

				case TRANSITION:
				case BINDING_FLAG:
				case DECORATOR:
					break;

				default:
					leftovers.push( template );
					break;
			}
		});

		if ( leftovers.length ) {
			this.attributes.push( new ConditionalAttribute({
				owner: this,
				parentFragment: this.parentFragment,
				template: leftovers
			}) );
		}

		this.eventHandlers = [];
	}

	if ( Item$$1 ) { Component.__proto__ = Item$$1; }
	Component.prototype = Object.create( Item$$1 && Item$$1.prototype );
	Component.prototype.constructor = Component;

	Component.prototype.bind = function bind$1 () {
		if ( !this.isAnchor ) {
			this.attributes.forEach( bind );

			initialise( this.instance, {
				partials: this._partials
			}, {
				cssIds: this.parentFragment.cssIds
			});

			this.eventHandlers.forEach( bind );

			this.bound = true;
		}
	};

	Component.prototype.bubble = function bubble () {
		if ( !this.dirty ) {
			this.dirty = true;
			this.parentFragment.bubble();
		}
	};

	Component.prototype.destroyed = function destroyed$$1 () {
		if ( !this.isAnchor && this.instance.fragment ) { this.instance.fragment.destroyed(); }
	};

	Component.prototype.detach = function detach () {
		if ( this.isAnchor ) {
			if ( this.instance ) { return this.instance.fragment.detach(); }
			return createDocumentFragment();
		}

		return this.instance.fragment.detach();
	};

	Component.prototype.find = function find ( selector, options ) {
		if ( this.instance ) { return this.instance.fragment.find( selector, options ); }
	};

	Component.prototype.findAll = function findAll ( selector, options ) {
		if ( this.instance ) { this.instance.fragment.findAll( selector, options ); }
	};

	Component.prototype.findComponent = function findComponent ( name, options ) {
		if ( !name || this.name === name ) { return this.instance; }

		if ( this.instance.fragment ) {
			return this.instance.fragment.findComponent( name, options );
		}
	};

	Component.prototype.findAllComponents = function findAllComponents ( name, options ) {
		var result = options.result;

		if ( this.instance && ( !name || this.name === name ) ) {
			result.push( this.instance );
		}

		if ( this.instance ) { this.instance.findAllComponents( name, options ); }
	};

	Component.prototype.firstNode = function firstNode ( skipParent ) {
		if ( this.instance ) { return this.instance.fragment.firstNode( skipParent ); }
	};

	Component.prototype.getContext = function getContext$$1 () {
		var arguments$1 = arguments;

		var assigns = [], len = arguments.length;
		while ( len-- ) { assigns[ len ] = arguments$1[ len ]; }

		assigns.unshift( this );
		return getRactiveContext.apply( null, assigns );
	};

	Component.prototype.render = function render$1$$1 ( target, occupants ) {
		if ( this.isAnchor ) {
			this.rendered = true;
			this.target = target;

			if ( !checking.length ) {
				checking.push( this.ractive );
				if ( occupants ) {
					this.occupants = occupants;
					checkAnchors();
					this.occupants = null;
				} else {
					runloop.scheduleTask( checkAnchors, true );
				}
			}
		} else {
			render$1( this.instance, target, null, occupants );

			this.attributes.forEach( render );
			this.eventHandlers.forEach( render );

			this.rendered = true;
		}
	};

	Component.prototype.toString = function toString$$1 () {
		if ( this.instance ) { return this.instance.toHTML(); }
	};

	Component.prototype.unbind = function unbind$1 () {
		if ( !this.isAnchor ) {
			this.bound = false;

			this.attributes.forEach( unbind );

			teardown$1( this.instance, function () { return runloop.promise(); } );
		}
	};

	Component.prototype.unrender = function unrender$1 ( shouldDestroy ) {
		this.shouldDestroy = shouldDestroy;

		if ( this.isAnchor ) {
			if ( this.item ) { unrenderItem( this, this.item ); }
			this.target = null;
			if ( !checking.length ) {
				checking.push( this.ractive );
				runloop.scheduleTask( checkAnchors, true );
			}
		} else {
			this.instance.unrender();
			this.instance.el = this.instance.target = null;
			this.attributes.forEach( unrender );
			this.eventHandlers.forEach( unrender );
		}

		this.rendered = false;
	};

	Component.prototype.update = function update$1 () {
		this.dirty = false;
		if ( this.instance ) {
			this.instance.fragment.update();
			this.attributes.forEach( update );
			this.eventHandlers.forEach( update );
		}
	};

	return Component;
}(Item));

function addChild ( meta ) {
	if ( this.item ) { this.removeChild( this.item ); }

	var child = meta.instance;
	meta.anchor = this;

	meta.parentFragment = this.parentFragment;
	meta.name = meta.nameOption || this.name;
	this.name = meta.name;


	if ( !child.isolated ) { child.viewmodel.attached( this.parentFragment ); }

	// render as necessary
	if ( this.rendered ) {
		renderItem( this, meta );
	}
}

function removeChild ( meta ) {
	// unrender as necessary
	if ( this.item === meta ) {
		unrenderItem( this, meta );
		this.name = this.template.n;
	}
}

function renderItem ( anchor, meta ) {
	if ( !anchor.rendered ) { return; }

	meta.shouldDestroy = false;
	meta.parentFragment = anchor.parentFragment;

	anchor.item = meta;
	anchor.instance = meta.instance;
	var nextNode = anchor.parentFragment.findNextNode( anchor );

	if ( meta.instance.fragment.rendered ) {
		meta.instance.unrender();
	}

	meta.partials = meta.instance.partials;
	meta.instance.partials = Object.assign( {}, meta.partials, anchor._partials );

	meta.instance.fragment.unbind();
	meta.instance.fragment.bind( meta.instance.viewmodel );

	anchor.attributes.forEach( bind );
	anchor.eventHandlers.forEach( bind );
	anchor.attributes.forEach( render );
	anchor.eventHandlers.forEach( render );

	var target = anchor.parentFragment.findParentNode();
	render$1( meta.instance, target, target.contains( nextNode ) ? nextNode : null, anchor.occupants );

	if ( meta.lastBound !== anchor ) {
		meta.lastBound = anchor;
	}
}

function unrenderItem ( anchor, meta ) {
	if ( !anchor.rendered ) { return; }

	meta.shouldDestroy = true;
	meta.instance.unrender();

	anchor.eventHandlers.forEach( unrender );
	anchor.attributes.forEach( unrender );
	anchor.eventHandlers.forEach( unbind );
	anchor.attributes.forEach( unbind );

	meta.instance.el = meta.instance.anchor = null;
	meta.parentFragment = null;
	meta.anchor = null;
	anchor.item = null;
	anchor.instance = null;
}

var checking = [];
function checkAnchors () {
	var list = checking;
	checking = [];

	list.forEach( updateAnchors );
}

function setupArgsFn ( item, template, fragment, opts ) {
	if ( opts === void 0 ) { opts = {}; }

	if ( template && template.f && template.f.s ) {
		item.fn = getFunction( template.f.s, template.f.r.length );
		if ( opts.register === true ) {
			item.models = resolveArgs( item, template, fragment, opts );
		}
	}
}

function resolveArgs ( item, template, fragment, opts ) {
	if ( opts === void 0 ) { opts = {}; }

	return template.f.r.map( function ( ref, i ) {
		var model;

		if ( opts.specialRef && ( model = opts.specialRef( ref, i ) ) ) { return model; }

		model = resolveReference( fragment, ref );
		if ( opts.register === true ) {
			model.register( item );
		}

		return model;
	});
}

function teardownArgsFn ( item, template ) {
	if ( template && template.f && template.f.s ) {
		if ( item.models ) { item.models.forEach( function (m) {
			if ( m && m.unregister ) { m.unregister( item ); }
		}); }
		item.models = null;
	}
}

var missingDecorator = {
	update: noop$1,
	teardown: noop$1
};

var Decorator = function Decorator ( options ) {
	this.owner = options.owner || options.parentFragment.owner || findElement( options.parentFragment );
	this.element = this.owner.attributeByName ? this.owner : findElement( options.parentFragment );
	this.parentFragment = this.owner.parentFragment;
	this.ractive = this.owner.ractive;
	var template = this.template = options.template;

	this.name = template.n;

	this.node = null;
	this.intermediary = null;

	this.element.decorators.push( this );
};

Decorator.prototype.bind = function bind () {
	setupArgsFn( this, this.template, this.parentFragment, { register: true } );
};

Decorator.prototype.bubble = function bubble () {
	if ( !this.dirty ) {
		this.dirty = true;
		this.owner.bubble();
	}
};

Decorator.prototype.destroyed = function destroyed () {
	if ( this.intermediary ) { this.intermediary.teardown(); }
	this.shouldDestroy = true;
};

Decorator.prototype.handleChange = function handleChange () { this.bubble(); };

Decorator.prototype.rebind = function rebind ( next, previous, safe ) {
	var idx = this.models.indexOf( previous );
	if ( !~idx ) { return; }

	next = rebindMatch( this.template.f.r[ idx ], next, previous );
	if ( next === previous ) { return; }

	previous.unregister( this );
	this.models.splice( idx, 1, next );
	if ( next ) { next.addShuffleRegister( this, 'mark' ); }

	if ( !safe ) { this.bubble(); }
};

Decorator.prototype.render = function render () {
		var this$1 = this;

	runloop.scheduleTask( function () {
		var fn = findInViewHierarchy( 'decorators', this$1.ractive, this$1.name );

		if ( !fn ) {
			warnOnce( missingPlugin( this$1.name, 'decorator' ) );
			this$1.intermediary = missingDecorator;
			return;
		}

		this$1.node = this$1.element.node;

		var args;
		if ( this$1.fn ) {
			args = this$1.models.map( function (model) {
				if ( !model ) { return undefined; }

				return model.get();
			});
			args = this$1.fn.apply( this$1.ractive, args );
		}

		this$1.intermediary = fn.apply( this$1.ractive, [ this$1.node ].concat( args ) );

		if ( !this$1.intermediary || !this$1.intermediary.teardown ) {
			throw new Error( ("The '" + (this$1.name) + "' decorator must return an object with a teardown method") );
		}

		// watch out for decorators that cause their host element to be unrendered
		if ( this$1.shouldDestroy ) { this$1.destroyed(); }
	}, true );
	this.rendered = true;
};

Decorator.prototype.toString = function toString () { return ''; };

Decorator.prototype.unbind = function unbind () {
	teardownArgsFn( this, this.template );
};

Decorator.prototype.unrender = function unrender ( shouldDestroy ) {
	if ( ( !shouldDestroy || this.element.rendered ) && this.intermediary ) { this.intermediary.teardown(); }
	this.rendered = false;
};

Decorator.prototype.update = function update () {
	if ( !this.dirty ) { return; }

	this.dirty = false;

	if ( this.intermediary ) {
		if ( !this.intermediary.update ) {
			this.unrender();
			this.render();
		}
		else {
			var args = this.models.map( function (model) { return model && model.get(); } );
			this.intermediary.update.apply( this.ractive, this.fn.apply( this.ractive, args ) );
		}
	}
};

var Doctype = (function (Item$$1) {
	function Doctype () {
		Item$$1.apply(this, arguments);
	}

	if ( Item$$1 ) { Doctype.__proto__ = Item$$1; }
	Doctype.prototype = Object.create( Item$$1 && Item$$1.prototype );
	Doctype.prototype.constructor = Doctype;

	Doctype.prototype.toString = function toString () {
		return '<!DOCTYPE' + this.template.a + '>';
	};

	return Doctype;
}(Item));

var proto$1$1 = Doctype.prototype;
proto$1$1.bind = proto$1$1.render = proto$1$1.teardown = proto$1$1.unbind = proto$1$1.unrender = proto$1$1.update = noop$1;

var Binding = function Binding ( element, name ) {
	if ( name === void 0 ) { name = 'value'; }

	this.element = element;
	this.ractive = element.ractive;
	this.attribute = element.attributeByName[ name ];

	var interpolator = this.attribute.interpolator;
	interpolator.twowayBinding = this;

	var model = interpolator.model;

	if ( model.isReadonly ) {
		var keypath = model.getKeypath().replace( /^@/, '' );
		warnOnceIfDebug( ("Cannot use two-way binding on <" + (element.name) + "> element: " + keypath + " is read-only. To suppress this warning use <" + (element.name) + " twoway='false'...>"), { ractive: this.ractive });
		return false;
	}

	this.attribute.isTwoway = true;
	this.model = model;

	// initialise value, if it's undefined
	var value = model.get();
	this.wasUndefined = value === undefined;

	if ( value === undefined && this.getInitialValue ) {
		value = this.getInitialValue();
		model.set( value );
	}
	this.lastVal( true, value );

	var parentForm = findElement( this.element, false, 'form' );
	if ( parentForm ) {
		this.resetValue = value;
		parentForm.formBindings.push( this );
	}
};

Binding.prototype.bind = function bind () {
	this.model.registerTwowayBinding( this );
};

Binding.prototype.handleChange = function handleChange () {
		var this$1 = this;

	var value = this.getValue();
	if ( this.lastVal() === value ) { return; }

	runloop.start( this.root );
	this.attribute.locked = true;
	this.model.set( value );
	this.lastVal( true, value );

	// if the value changes before observers fire, unlock to be updatable cause something weird and potentially freezy is up
	if ( this.model.get() !== value ) { this.attribute.locked = false; }
	else { runloop.scheduleTask( function () { return this$1.attribute.locked = false; } ); }

	runloop.end();
};

Binding.prototype.lastVal = function lastVal ( setting, value ) {
	if ( setting ) { this.lastValue = value; }
	else { return this.lastValue; }
};

Binding.prototype.rebind = function rebind ( next, previous ) {
		var this$1 = this;

	if ( this.model && this.model === previous ) { previous.unregisterTwowayBinding( this ); }
	if ( next ) {
		this.model = next;
		runloop.scheduleTask( function () { return next.registerTwowayBinding( this$1 ); } );
	}
};

Binding.prototype.render = function render () {
	this.node = this.element.node;
	this.node._ractive.binding = this;
	this.rendered = true; // TODO is this used anywhere?
};

Binding.prototype.setFromNode = function setFromNode ( node ) {
	this.model.set( node.value );
};

Binding.prototype.unbind = function unbind () {
	this.model.unregisterTwowayBinding( this );
};

Binding.prototype.unrender = noop$1;

// This is the handler for DOM events that would lead to a change in the model
// (i.e. change, sometimes, input, and occasionally click and keyup)
function handleDomEvent () {
	this._ractive.binding.handleChange();
}

var CheckboxBinding = (function (Binding$$1) {
	function CheckboxBinding ( element ) {
		Binding$$1.call( this, element, 'checked' );
	}

	if ( Binding$$1 ) { CheckboxBinding.__proto__ = Binding$$1; }
	CheckboxBinding.prototype = Object.create( Binding$$1 && Binding$$1.prototype );
	CheckboxBinding.prototype.constructor = CheckboxBinding;

	CheckboxBinding.prototype.render = function render () {
		Binding$$1.prototype.render.call(this);

		this.node.addEventListener( 'change', handleDomEvent, false );

		if ( this.node.attachEvent ) {
			this.node.addEventListener( 'click', handleDomEvent, false );
		}
	};

	CheckboxBinding.prototype.unrender = function unrender () {
		this.node.removeEventListener( 'change', handleDomEvent, false );
		this.node.removeEventListener( 'click', handleDomEvent, false );
	};

	CheckboxBinding.prototype.getInitialValue = function getInitialValue () {
		return !!this.element.getAttribute( 'checked' );
	};

	CheckboxBinding.prototype.getValue = function getValue () {
		return this.node.checked;
	};

	CheckboxBinding.prototype.setFromNode = function setFromNode ( node ) {
		this.model.set( node.checked );
	};

	return CheckboxBinding;
}(Binding));

function getBindingGroup ( group, model, getValue ) {
	var hash = group + "-bindingGroup";
	return model[hash] || ( model[ hash ] = new BindingGroup( hash, model, getValue ) );
}

var BindingGroup = function BindingGroup ( hash, model, getValue ) {
	var this$1 = this;

	this.model = model;
	this.hash = hash;
	this.getValue = function () {
		this$1.value = getValue.call(this$1);
		return this$1.value;
	};

	this.bindings = [];
};

BindingGroup.prototype.add = function add ( binding ) {
	this.bindings.push( binding );
};

BindingGroup.prototype.bind = function bind () {
	this.value = this.model.get();
	this.model.registerTwowayBinding( this );
	this.bound = true;
};

BindingGroup.prototype.remove = function remove ( binding ) {
	removeFromArray( this.bindings, binding );
	if ( !this.bindings.length ) {
		this.unbind();
	}
};

BindingGroup.prototype.unbind = function unbind () {
	this.model.unregisterTwowayBinding( this );
	this.bound = false;
	delete this.model[this.hash];
};

BindingGroup.prototype.rebind = Binding.prototype.rebind;

var push$1 = [].push;

function getValue() {
	var this$1 = this;

	var all = this.bindings.filter(function (b) { return b.node && b.node.checked; }).map(function (b) { return b.element.getAttribute( 'value' ); });
	var res = [];
	all.forEach(function (v) { if ( !this$1.bindings[0].arrayContains( res, v ) ) { res.push( v ); } });
	return res;
}

var CheckboxNameBinding = (function (Binding$$1) {
	function CheckboxNameBinding ( element ) {
		Binding$$1.call( this, element, 'name' );

		this.checkboxName = true; // so that ractive.updateModel() knows what to do with this

		// Each input has a reference to an array containing it and its
		// group, as two-way binding depends on being able to ascertain
		// the status of all inputs within the group
		this.group = getBindingGroup( 'checkboxes', this.model, getValue );
		this.group.add( this );

		if ( this.noInitialValue ) {
			this.group.noInitialValue = true;
		}

		// If no initial value was set, and this input is checked, we
		// update the model
		if ( this.group.noInitialValue && this.element.getAttribute( 'checked' ) ) {
			var existingValue = this.model.get();
			var bindingValue = this.element.getAttribute( 'value' );

			if ( !this.arrayContains( existingValue, bindingValue ) ) {
				push$1.call( existingValue, bindingValue ); // to avoid triggering runloop with array adaptor
			}
		}
	}

	if ( Binding$$1 ) { CheckboxNameBinding.__proto__ = Binding$$1; }
	CheckboxNameBinding.prototype = Object.create( Binding$$1 && Binding$$1.prototype );
	CheckboxNameBinding.prototype.constructor = CheckboxNameBinding;

	CheckboxNameBinding.prototype.bind = function bind () {
		if ( !this.group.bound ) {
			this.group.bind();
		}
	};

	CheckboxNameBinding.prototype.getInitialValue = function getInitialValue () {
		// This only gets called once per group (of inputs that
		// share a name), because it only gets called if there
		// isn't an initial value. By the same token, we can make
		// a note of that fact that there was no initial value,
		// and populate it using any `checked` attributes that
		// exist (which users should avoid, but which we should
		// support anyway to avoid breaking expectations)
		this.noInitialValue = true; // TODO are noInitialValue and wasUndefined the same thing?
		return [];
	};

	CheckboxNameBinding.prototype.getValue = function getValue () {
		return this.group.value;
	};

	CheckboxNameBinding.prototype.handleChange = function handleChange () {
		this.isChecked = this.element.node.checked;
		this.group.value = this.model.get();
		var value = this.element.getAttribute( 'value' );
		if ( this.isChecked && !this.arrayContains( this.group.value, value ) ) {
			this.group.value.push( value );
		} else if ( !this.isChecked && this.arrayContains( this.group.value, value ) ) {
			this.removeFromArray( this.group.value, value );
		}
		// make sure super knows there's a change
		this.lastValue = null;
		Binding$$1.prototype.handleChange.call(this);
	};

	CheckboxNameBinding.prototype.render = function render () {
		Binding$$1.prototype.render.call(this);

		var node = this.node;

		var existingValue = this.model.get();
		var bindingValue = this.element.getAttribute( 'value' );

		if ( Array.isArray( existingValue ) ) {
			this.isChecked = this.arrayContains( existingValue, bindingValue );
		} else {
			this.isChecked = this.element.compare( existingValue, bindingValue );
		}
		node.name = '{{' + this.model.getKeypath() + '}}';
		node.checked = this.isChecked;

		node.addEventListener( 'change', handleDomEvent, false );

		// in case of IE emergency, bind to click event as well
		if ( node.attachEvent ) {
			node.addEventListener( 'click', handleDomEvent, false );
		}
	};

	CheckboxNameBinding.prototype.setFromNode = function setFromNode ( node ) {
		this.group.bindings.forEach( function (binding) { return binding.wasUndefined = true; } );

		if ( node.checked ) {
			var valueSoFar = this.group.getValue();
			valueSoFar.push( this.element.getAttribute( 'value' ) );

			this.group.model.set( valueSoFar );
		}
	};

	CheckboxNameBinding.prototype.unbind = function unbind () {
		this.group.remove( this );
	};

	CheckboxNameBinding.prototype.unrender = function unrender () {
		var node = this.element.node;

		node.removeEventListener( 'change', handleDomEvent, false );
		node.removeEventListener( 'click', handleDomEvent, false );
	};

	CheckboxNameBinding.prototype.arrayContains = function arrayContains ( selectValue, optionValue ) {
		var this$1 = this;

		var i = selectValue.length;
		while ( i-- ) {
			if ( this$1.element.compare( optionValue, selectValue[i] ) ) { return true; }
		}
		return false;
	};

	CheckboxNameBinding.prototype.removeFromArray = function removeFromArray ( array, item ) {
		var this$1 = this;

		if (!array) { return; }
		var i = array.length;
		while( i-- ) {
			if ( this$1.element.compare( item, array[i] ) ) {
				array.splice( i, 1 );
			}
		}
	};

	return CheckboxNameBinding;
}(Binding));

var ContentEditableBinding = (function (Binding$$1) {
	function ContentEditableBinding () {
		Binding$$1.apply(this, arguments);
	}

	if ( Binding$$1 ) { ContentEditableBinding.__proto__ = Binding$$1; }
	ContentEditableBinding.prototype = Object.create( Binding$$1 && Binding$$1.prototype );
	ContentEditableBinding.prototype.constructor = ContentEditableBinding;

	ContentEditableBinding.prototype.getInitialValue = function getInitialValue () {
		return this.element.fragment ? this.element.fragment.toString() : '';
	};

	ContentEditableBinding.prototype.getValue = function getValue () {
		return this.element.node.innerHTML;
	};

	ContentEditableBinding.prototype.render = function render () {
		Binding$$1.prototype.render.call(this);

		var node = this.node;

		node.addEventListener( 'change', handleDomEvent, false );
		node.addEventListener( 'blur', handleDomEvent, false );

		if ( !this.ractive.lazy ) {
			node.addEventListener( 'input', handleDomEvent, false );

			if ( node.attachEvent ) {
				node.addEventListener( 'keyup', handleDomEvent, false );
			}
		}
	};

	ContentEditableBinding.prototype.setFromNode = function setFromNode ( node ) {
		this.model.set( node.innerHTML );
	};

	ContentEditableBinding.prototype.unrender = function unrender () {
		var node = this.node;

		node.removeEventListener( 'blur', handleDomEvent, false );
		node.removeEventListener( 'change', handleDomEvent, false );
		node.removeEventListener( 'input', handleDomEvent, false );
		node.removeEventListener( 'keyup', handleDomEvent, false );
	};

	return ContentEditableBinding;
}(Binding));

function handleBlur () {
	handleDomEvent.call( this );

	var value = this._ractive.binding.model.get();
	this.value = value == undefined ? '' : value;
}

function handleDelay ( delay ) {
	var timeout;

	return function () {
		var this$1 = this;

		if ( timeout ) { clearTimeout( timeout ); }

		timeout = setTimeout( function () {
			var binding = this$1._ractive.binding;
			if ( binding.rendered ) { handleDomEvent.call( this$1 ); }
			timeout = null;
		}, delay );
	};
}

var GenericBinding = (function (Binding$$1) {
	function GenericBinding () {
		Binding$$1.apply(this, arguments);
	}

	if ( Binding$$1 ) { GenericBinding.__proto__ = Binding$$1; }
	GenericBinding.prototype = Object.create( Binding$$1 && Binding$$1.prototype );
	GenericBinding.prototype.constructor = GenericBinding;

	GenericBinding.prototype.getInitialValue = function getInitialValue () {
		return '';
	};

	GenericBinding.prototype.getValue = function getValue () {
		return this.node.value;
	};

	GenericBinding.prototype.render = function render () {
		Binding$$1.prototype.render.call(this);

		// any lazy setting for this element overrides the root
		// if the value is a number, it's a timeout
		var lazy = this.ractive.lazy;
		var timeout = false;

		if ( 'lazy' in this.element ) {
			lazy = this.element.lazy;
		}

		if ( isNumeric( lazy ) ) {
			timeout = +lazy;
			lazy = false;
		}

		this.handler = timeout ? handleDelay( timeout ) : handleDomEvent;

		var node = this.node;

		node.addEventListener( 'change', handleDomEvent, false );

		if ( !lazy ) {
			node.addEventListener( 'input', this.handler, false );

			if ( node.attachEvent ) {
				node.addEventListener( 'keyup', this.handler, false );
			}
		}

		node.addEventListener( 'blur', handleBlur, false );
	};

	GenericBinding.prototype.unrender = function unrender () {
		var node = this.element.node;
		this.rendered = false;

		node.removeEventListener( 'change', handleDomEvent, false );
		node.removeEventListener( 'input', this.handler, false );
		node.removeEventListener( 'keyup', this.handler, false );
		node.removeEventListener( 'blur', handleBlur, false );
	};

	return GenericBinding;
}(Binding));

var FileBinding = (function (GenericBinding$$1) {
	function FileBinding () {
		GenericBinding$$1.apply(this, arguments);
	}

	if ( GenericBinding$$1 ) { FileBinding.__proto__ = GenericBinding$$1; }
	FileBinding.prototype = Object.create( GenericBinding$$1 && GenericBinding$$1.prototype );
	FileBinding.prototype.constructor = FileBinding;

	FileBinding.prototype.getInitialValue = function getInitialValue () {
		return undefined;
	};

	FileBinding.prototype.getValue = function getValue () {
		return this.node.files;
	};

	FileBinding.prototype.render = function render () {
		this.element.lazy = false;
		GenericBinding$$1.prototype.render.call(this);
	};

	FileBinding.prototype.setFromNode = function setFromNode ( node ) {
		this.model.set( node.files );
	};

	return FileBinding;
}(GenericBinding));

function getSelectedOptions ( select ) {
	return select.selectedOptions
		? toArray( select.selectedOptions )
		: select.options
			? toArray( select.options ).filter( function (option) { return option.selected; } )
			: [];
}

var MultipleSelectBinding = (function (Binding$$1) {
	function MultipleSelectBinding () {
		Binding$$1.apply(this, arguments);
	}

	if ( Binding$$1 ) { MultipleSelectBinding.__proto__ = Binding$$1; }
	MultipleSelectBinding.prototype = Object.create( Binding$$1 && Binding$$1.prototype );
	MultipleSelectBinding.prototype.constructor = MultipleSelectBinding;

	MultipleSelectBinding.prototype.getInitialValue = function getInitialValue () {
		return this.element.options
			.filter( function (option) { return option.getAttribute( 'selected' ); } )
			.map( function (option) { return option.getAttribute( 'value' ); } );
	};

	MultipleSelectBinding.prototype.getValue = function getValue () {
		var options = this.element.node.options;
		var len = options.length;

		var selectedValues = [];

		for ( var i = 0; i < len; i += 1 ) {
			var option = options[i];

			if ( option.selected ) {
				var optionValue = option._ractive ? option._ractive.value : option.value;
				selectedValues.push( optionValue );
			}
		}

		return selectedValues;
	};

	MultipleSelectBinding.prototype.handleChange = function handleChange () {
		var attribute = this.attribute;
		var previousValue = attribute.getValue();

		var value = this.getValue();

		if ( previousValue === undefined || !arrayContentsMatch( value, previousValue ) ) {
			Binding$$1.prototype.handleChange.call(this);
		}

		return this;
	};

	MultipleSelectBinding.prototype.render = function render () {
		Binding$$1.prototype.render.call(this);

		this.node.addEventListener( 'change', handleDomEvent, false );

		if ( this.model.get() === undefined ) {
			// get value from DOM, if possible
			this.handleChange();
		}
	};

	MultipleSelectBinding.prototype.setFromNode = function setFromNode ( node ) {
		var selectedOptions = getSelectedOptions( node );
		var i = selectedOptions.length;
		var result = new Array( i );

		while ( i-- ) {
			var option = selectedOptions[i];
			result[i] = option._ractive ? option._ractive.value : option.value;
		}

		this.model.set( result );
	};

	MultipleSelectBinding.prototype.unrender = function unrender () {
		this.node.removeEventListener( 'change', handleDomEvent, false );
	};

	return MultipleSelectBinding;
}(Binding));

var NumericBinding = (function (GenericBinding$$1) {
	function NumericBinding () {
		GenericBinding$$1.apply(this, arguments);
	}

	if ( GenericBinding$$1 ) { NumericBinding.__proto__ = GenericBinding$$1; }
	NumericBinding.prototype = Object.create( GenericBinding$$1 && GenericBinding$$1.prototype );
	NumericBinding.prototype.constructor = NumericBinding;

	NumericBinding.prototype.getInitialValue = function getInitialValue () {
		return undefined;
	};

	NumericBinding.prototype.getValue = function getValue () {
		var value = parseFloat( this.node.value );
		return isNaN( value ) ? undefined : value;
	};

	NumericBinding.prototype.setFromNode = function setFromNode ( node ) {
		var value = parseFloat( node.value );
		if ( !isNaN( value ) ) { this.model.set( value ); }
	};

	return NumericBinding;
}(GenericBinding));

var siblings = {};

function getSiblings ( hash ) {
	return siblings[ hash ] || ( siblings[ hash ] = [] );
}

var RadioBinding = (function (Binding$$1) {
	function RadioBinding ( element ) {
		Binding$$1.call( this, element, 'checked' );

		this.siblings = getSiblings( this.ractive._guid + this.element.getAttribute( 'name' ) );
		this.siblings.push( this );
	}

	if ( Binding$$1 ) { RadioBinding.__proto__ = Binding$$1; }
	RadioBinding.prototype = Object.create( Binding$$1 && Binding$$1.prototype );
	RadioBinding.prototype.constructor = RadioBinding;

	RadioBinding.prototype.getValue = function getValue () {
		return this.node.checked;
	};

	RadioBinding.prototype.handleChange = function handleChange () {
		runloop.start( this.root );

		this.siblings.forEach( function (binding) {
			binding.model.set( binding.getValue() );
		});

		runloop.end();
	};

	RadioBinding.prototype.render = function render () {
		Binding$$1.prototype.render.call(this);

		this.node.addEventListener( 'change', handleDomEvent, false );

		if ( this.node.attachEvent ) {
			this.node.addEventListener( 'click', handleDomEvent, false );
		}
	};

	RadioBinding.prototype.setFromNode = function setFromNode ( node ) {
		this.model.set( node.checked );
	};

	RadioBinding.prototype.unbind = function unbind () {
		removeFromArray( this.siblings, this );
	};

	RadioBinding.prototype.unrender = function unrender () {
		this.node.removeEventListener( 'change', handleDomEvent, false );
		this.node.removeEventListener( 'click', handleDomEvent, false );
	};

	return RadioBinding;
}(Binding));

function getValue$1() {
	var checked = this.bindings.filter( function (b) { return b.node.checked; } );
	if ( checked.length > 0 ) {
		return checked[0].element.getAttribute( 'value' );
	}
}

var RadioNameBinding = (function (Binding$$1) {
	function RadioNameBinding ( element ) {
		Binding$$1.call( this, element, 'name' );

		this.group = getBindingGroup( 'radioname', this.model, getValue$1 );
		this.group.add( this );

		if ( element.checked ) {
			this.group.value = this.getValue();
		}
	}

	if ( Binding$$1 ) { RadioNameBinding.__proto__ = Binding$$1; }
	RadioNameBinding.prototype = Object.create( Binding$$1 && Binding$$1.prototype );
	RadioNameBinding.prototype.constructor = RadioNameBinding;

	RadioNameBinding.prototype.bind = function bind () {
		var this$1 = this;

		if ( !this.group.bound ) {
			this.group.bind();
		}

		// update name keypath when necessary
		this.nameAttributeBinding = {
			handleChange: function () { return this$1.node.name = "{{" + (this$1.model.getKeypath()) + "}}"; },
			rebind: noop$1
		};

		this.model.getKeypathModel().register( this.nameAttributeBinding );
	};

	RadioNameBinding.prototype.getInitialValue = function getInitialValue () {
		if ( this.element.getAttribute( 'checked' ) ) {
			return this.element.getAttribute( 'value' );
		}
	};

	RadioNameBinding.prototype.getValue = function getValue () {
		return this.element.getAttribute( 'value' );
	};

	RadioNameBinding.prototype.handleChange = function handleChange () {
		// If this <input> is the one that's checked, then the value of its
		// `name` model gets set to its value
		if ( this.node.checked ) {
			this.group.value = this.getValue();
			Binding$$1.prototype.handleChange.call(this);
		}
	};

	RadioNameBinding.prototype.lastVal = function lastVal ( setting, value ) {
		if ( !this.group ) { return; }
		if ( setting ) { this.group.lastValue = value; }
		else { return this.group.lastValue; }
	};

	RadioNameBinding.prototype.render = function render () {
		Binding$$1.prototype.render.call(this);

		var node = this.node;

		node.name = "{{" + (this.model.getKeypath()) + "}}";
		node.checked = this.element.compare ( this.model.get(), this.element.getAttribute( 'value' ) );

		node.addEventListener( 'change', handleDomEvent, false );

		if ( node.attachEvent ) {
			node.addEventListener( 'click', handleDomEvent, false );
		}
	};

	RadioNameBinding.prototype.setFromNode = function setFromNode ( node ) {
		if ( node.checked ) {
			this.group.model.set( this.element.getAttribute( 'value' ) );
		}
	};

	RadioNameBinding.prototype.unbind = function unbind () {
		this.group.remove( this );

		this.model.getKeypathModel().unregister( this.nameAttributeBinding );
	};

	RadioNameBinding.prototype.unrender = function unrender () {
		var node = this.node;

		node.removeEventListener( 'change', handleDomEvent, false );
		node.removeEventListener( 'click', handleDomEvent, false );
	};

	return RadioNameBinding;
}(Binding));

var SingleSelectBinding = (function (Binding$$1) {
	function SingleSelectBinding () {
		Binding$$1.apply(this, arguments);
	}

	if ( Binding$$1 ) { SingleSelectBinding.__proto__ = Binding$$1; }
	SingleSelectBinding.prototype = Object.create( Binding$$1 && Binding$$1.prototype );
	SingleSelectBinding.prototype.constructor = SingleSelectBinding;

	SingleSelectBinding.prototype.forceUpdate = function forceUpdate () {
		var this$1 = this;

		var value = this.getValue();

		if ( value !== undefined ) {
			this.attribute.locked = true;
			runloop.scheduleTask( function () { return this$1.attribute.locked = false; } );
			this.model.set( value );
		}
	};

	SingleSelectBinding.prototype.getInitialValue = function getInitialValue () {
		if ( this.element.getAttribute( 'value' ) !== undefined ) {
			return;
		}

		var options = this.element.options;
		var len = options.length;

		if ( !len ) { return; }

		var value;
		var optionWasSelected;
		var i = len;

		// take the final selected option...
		while ( i-- ) {
			var option = options[i];

			if ( option.getAttribute( 'selected' ) ) {
				if ( !option.getAttribute( 'disabled' ) ) {
					value = option.getAttribute( 'value' );
				}

				optionWasSelected = true;
				break;
			}
		}

		// or the first non-disabled option, if none are selected
		if ( !optionWasSelected ) {
			while ( ++i < len ) {
				if ( !options[i].getAttribute( 'disabled' ) ) {
					value = options[i].getAttribute( 'value' );
					break;
				}
			}
		}

		// This is an optimisation (aka hack) that allows us to forgo some
		// other more expensive work
		// TODO does it still work? seems at odds with new architecture
		if ( value !== undefined ) {
			this.element.attributeByName.value.value = value;
		}

		return value;
	};

	SingleSelectBinding.prototype.getValue = function getValue () {
		var options = this.node.options;
		var len = options.length;

		var i;
		for ( i = 0; i < len; i += 1 ) {
			var option = options[i];

			if ( options[i].selected && !options[i].disabled ) {
				return option._ractive ? option._ractive.value : option.value;
			}
		}
	};

	SingleSelectBinding.prototype.render = function render () {
		Binding$$1.prototype.render.call(this);
		this.node.addEventListener( 'change', handleDomEvent, false );
	};

	SingleSelectBinding.prototype.setFromNode = function setFromNode ( node ) {
		var option = getSelectedOptions( node )[0];
		this.model.set( option._ractive ? option._ractive.value : option.value );
	};

	SingleSelectBinding.prototype.unrender = function unrender () {
		this.node.removeEventListener( 'change', handleDomEvent, false );
	};

	return SingleSelectBinding;
}(Binding));

function isBindable ( attribute ) {

	// The fragment must be a single non-string fragment
	if ( !attribute || !attribute.template.f || !attribute.template.f.length === 1 || attribute.template.f[0].s ) { return false; }

	// A binding is an interpolator `{{ }}`, yey.
	if ( attribute.template.f[0].t === INTERPOLATOR ) { return true; }

	// The above is probably the only true case. For the rest, show an appropriate
	// warning before returning false.

	// You can't bind a triple curly. HTML values on an attribute makes no sense.
	if ( attribute.template.f[0].t === TRIPLE ) { warnIfDebug( 'It is not possible create a binding using a triple mustache.' ); }

	return false;
}

function selectBinding ( element ) {
	var name = element.name;
	var attributes = element.attributeByName;
	var isBindableByValue = isBindable( attributes.value );
	var isBindableByContentEditable = isBindable( attributes.contenteditable );
	var isContentEditable =  element.getAttribute( 'contenteditable' );

	// contenteditable
	// Bind if the contenteditable is true or a binding that may become true.
	if ( ( isContentEditable || isBindableByContentEditable ) && isBindableByValue ) { return ContentEditableBinding; }

	// <input>
	if ( name === 'input' ) {
		var type = element.getAttribute( 'type' );

		if ( type === 'radio' ) {
			var isBindableByName = isBindable( attributes.name );
			var isBindableByChecked = isBindable( attributes.checked );

			// For radios we can either bind the name or checked, but not both.
			// Name binding is handed instead.
			if ( isBindableByName && isBindableByChecked ) {
				warnIfDebug( 'A radio input can have two-way binding on its name attribute, or its checked attribute - not both', { ractive: element.root });
				return RadioNameBinding;
			}

			if ( isBindableByName ) { return RadioNameBinding; }

			if ( isBindableByChecked ) { return RadioBinding; }

			// Dead end. Unknown binding on radio input.
			return null;
		}

		if ( type === 'checkbox' ) {
			var isBindableByName$1 = isBindable( attributes.name );
			var isBindableByChecked$1 = isBindable( attributes.checked );

			// A checkbox with bindings for both name and checked. Checked treated as
			// the checkbox value, name is treated as a regular binding.
			//
			// See https://github.com/ractivejs/ractive/issues/1749
			if ( isBindableByName$1 && isBindableByChecked$1 ) { return CheckboxBinding; }

			if ( isBindableByName$1 ) { return CheckboxNameBinding; }

			if ( isBindableByChecked$1 ) { return CheckboxBinding; }

			// Dead end. Unknown binding on checkbox input.
			return null;
		}

		if ( type === 'file' && isBindableByValue ) { return FileBinding; }

		if ( type === 'number' && isBindableByValue ) { return NumericBinding; }

		if ( type === 'range' && isBindableByValue ) { return NumericBinding; }

		// Some input of unknown type (browser usually falls back to text).
		if ( isBindableByValue ) { return GenericBinding; }

		// Dead end. Some unknown input and an unbindable.
		return null;
	}

	// <select>
	if ( name === 'select' && isBindableByValue ){
		return element.getAttribute( 'multiple' ) ? MultipleSelectBinding : SingleSelectBinding;
	}

	// <textarea>
	if ( name === 'textarea' && isBindableByValue ) { return GenericBinding; }

	// Dead end. Some unbindable element.
	return null;
}

var DOMEvent = function DOMEvent ( name, owner, delegate ) {
	if ( name.indexOf( '*' ) !== -1 ) {
		fatal( ("Only component proxy-events may contain \"*\" wildcards, <" + (owner.name) + " on-" + name + "=\"...\"/> is not valid") );
	}

	this.name = name;
	this.owner = owner;
	this.delegate = delegate;
	this.node = null;
	this.handler = null;
};

DOMEvent.prototype.listen = function listen ( directive ) {
	var node = this.node = this.owner.node;
	var name = this.name;

	// this is probably a custom event fired from a decorator or manually
	if ( !( ("on" + name) in node ) ) { return; }

	node.addEventListener( name, this.handler = function( event ) {
		directive.fire({
			node: node,
			original: event,
			event: event,
			name: name
		});
	}, this.delegate );
};

DOMEvent.prototype.unlisten = function unlisten () {
	if ( this.handler ) { this.node.removeEventListener( this.name, this.handler, false ); }
};

var CustomEvent = function CustomEvent ( eventPlugin, owner, name ) {
	this.eventPlugin = eventPlugin;
	this.owner = owner;
	this.name = name;
	this.handler = null;
};

CustomEvent.prototype.listen = function listen ( directive ) {
		var this$1 = this;

	var node = this.owner.node;

	this.handler = this.eventPlugin( node, function ( event ) {
			if ( event === void 0 ) { event = {}; }

		if ( event.original ) { event.event = event.original; }
		else { event.original = event.event; }

		event.name = this$1.name;
		event.node = event.node || node;
		directive.fire( event );
	});
};

CustomEvent.prototype.unlisten = function unlisten () {
	this.handler.teardown();
};

var RactiveEvent = function RactiveEvent ( component, name ) {
	this.component = component;
	this.name = name;
	this.handler = null;
};

RactiveEvent.prototype.listen = function listen ( directive ) {
	var ractive = this.component.instance;

	this.handler = ractive.on( this.name, function () {
			var arguments$1 = arguments;

			var args = [], len = arguments.length;
			while ( len-- ) { args[ len ] = arguments$1[ len ]; }

		// watch for reproxy
		if ( args[0] instanceof Context ) {
			var ctx = args.shift();
			ctx.component = ractive;
			directive.fire( ctx, args );
		} else {
			directive.fire( {}, args );
		}

		// cancel bubbling
		return false;
	});
};

RactiveEvent.prototype.unlisten = function unlisten () {
	this.handler.cancel();
};

var specialPattern = /^(event|arguments|@node|@event|@context)(\..+)?$/;
var dollarArgsPattern = /^\$(\d+)(\..+)?$/;

var DelegateProxy = {
	fire: function fire ( event, args ) {
		if ( args === void 0 ) { args = []; }

		if ( event && event.event ) {
			var ev = event.event;

			// TODO if IE<9 needs to be supported here, could probably walk to the element with a ractive proxy with a delegates property
			var end = ev.currentTarget;
			var node = ev.target;
			var name = event.name;
			var bubble = true;

			// starting with the origin node, walk up the DOM looking for ractive nodes with a matching event listener
			while ( bubble && node && node !== end ) {
				var el = node._ractive && node._ractive.proxy;

				if ( el ) {
					// set up the context for the handler
					event.node = el.node;
					event.name = name;

					el.events.forEach( function (ev) {
						if ( ev.delegate && ~ev.template.n.indexOf( name ) ) {
							bubble = ev.fire( event, args ) !== false && bubble;
						}
					});
				}

				node = node.parentNode;
			}

			return bubble;
		}
	}
};

var EventDirective = function EventDirective ( options ) {
	var this$1 = this;

	this.owner = options.owner || options.parentFragment.owner || findElement( options.parentFragment );
	this.element = this.owner.attributeByName ? this.owner : findElement( options.parentFragment, true );
	this.template = options.template;
	this.parentFragment = options.parentFragment;
	this.ractive = options.parentFragment.ractive;
	var delegate = this.delegate = this.ractive.delegate && options.parentFragment.delegate;
	this.events = [];

	if ( this.element.type === COMPONENT || this.element.type === ANCHOR ) {
		this.template.n.forEach( function (n) {
			this$1.events.push( new RactiveEvent( this$1.element, n ) );
		});
	} else {
		// make sure the delegate element has a storag object
		if ( delegate && !delegate.delegates ) { delegate.delegates = {}; }

		this.template.n.forEach( function (n) {
			var fn = findInViewHierarchy( 'events', this$1.ractive, n );
			if ( fn ) {
				this$1.events.push( new CustomEvent( fn, this$1.element, n ) );
			} else {
				if ( delegate ) {
					if ( !delegate.delegates[n] ) {
						var ev = new DOMEvent( n, delegate, true );
						delegate.delegates[n] = ev;
						// if the element is already rendered, render the event too
						if ( delegate.rendered ) { ev.listen( DelegateProxy ); }
					}
				} else {
					this$1.events.push( new DOMEvent( n, this$1.element ) );
				}
			}
		});
	}

	// method calls
	this.models = null;
};

EventDirective.prototype.bind = function bind () {
	addToArray( this.element.events, this );

	setupArgsFn( this, this.template );
	if ( !this.fn ) { this.action = this.template.f; }
};

EventDirective.prototype.destroyed = function destroyed () {
	this.events.forEach( function (e) { return e.unlisten(); } );
};

EventDirective.prototype.fire = function fire ( event, args ) {
		var this$1 = this;
		if ( args === void 0 ) { args = []; }

	var context = this.element.getContext( event );

	if ( this.fn ) {
		var values = [];

		var models = resolveArgs( this, this.template, this.parentFragment, {
			specialRef: function specialRef ( ref ) {
				var specialMatch = specialPattern.exec( ref );
				if ( specialMatch ) {
					// on-click="foo(event.node)"
					return {
						special: specialMatch[1],
						keys: specialMatch[2] ? splitKeypath( specialMatch[2].substr(1) ) : []
					};
				}

				var dollarMatch = dollarArgsPattern.exec( ref );
				if ( dollarMatch ) {
					// on-click="foo($1)"
					return {
						special: 'arguments',
						keys: [ dollarMatch[1] - 1 ].concat( dollarMatch[2] ? splitKeypath( dollarMatch[2].substr( 1 ) ) : [] )
					};
				}
			}
		});

		if ( models ) {
			models.forEach( function (model) {
				if ( !model ) { return values.push( undefined ); }

				if ( model.special ) {
					var which = model.special;
					var obj;

					if ( which === '@node' ) {
						obj = this$1.element.node;
					} else if ( which === '@event' ) {
						obj = event && event.event;
					} else if ( which === 'event' ) {
						warnOnceIfDebug( "The event reference available to event directives is deprecated and should be replaced with @context and @event" );
						obj = context;
					} else if ( which === '@context' ) {
						obj = context;
					} else {
						obj = args;
					}

					var keys = model.keys.slice();

					while ( obj && keys.length ) { obj = obj[ keys.shift() ]; }
					return values.push( obj );
				}

				if ( model.wrapper ) {
					return values.push( model.wrapperValue );
				}

				values.push( model.get() );
			});
		}

		// make event available as `this.event`
		var ractive = this.ractive;
		var oldEvent = ractive.event;

		ractive.event = context;
		var returned = this.fn.apply( ractive, values );
		var result = returned.pop();

		// Auto prevent and stop if return is explicitly false
		if ( result === false ) {
			var original = event ? event.original : undefined;
			if ( original ) {
				original.preventDefault && original.preventDefault();
				original.stopPropagation && original.stopPropagation();
			} else {
				warnOnceIfDebug( ("handler '" + (this.template.n.join( ' ' )) + "' returned false, but there is no event available to cancel") );
			}
		}

		// watch for proxy events
		else if ( !returned.length && Array.isArray( result ) && typeof result[0] === 'string' ) {
			result = fireEvent( this.ractive, result.shift(), context, result );
		}

		ractive.event = oldEvent;

		return result;
	}

	else {
		return fireEvent( this.ractive, this.action, context, args);
	}
};

EventDirective.prototype.handleChange = function handleChange () {};

EventDirective.prototype.render = function render () {
		var this$1 = this;

	// render events after everything else, so they fire after bindings
	runloop.scheduleTask( function () { return this$1.events.forEach( function (e) { return e.listen( this$1 ); }, true ); } );
};

EventDirective.prototype.toString = function toString () { return ''; };

EventDirective.prototype.unbind = function unbind () {
	removeFromArray( this.element.events, this );
};

EventDirective.prototype.unrender = function unrender () {
	this.events.forEach( function (e) { return e.unlisten(); } );
};

EventDirective.prototype.update = noop$1;

var endsWithSemi = /;\s*$/;

var Element = (function (ContainerItem$$1) {
	function Element ( options ) {
		var this$1 = this;

		ContainerItem$$1.call( this, options );

		this.name = options.template.e.toLowerCase();
		this.isVoid = voidElementNames.test( this.name );

		// find parent element
		this.parent = findElement( this.parentFragment, false );

		if ( this.parent && this.parent.name === 'option' ) {
			throw new Error( ("An <option> element cannot contain other elements (encountered <" + (this.name) + ">)") );
		}

		this.decorators = [];
		this.events = [];

		// create attributes
		this.attributeByName = {};

		this.attributes = [];
		var leftovers = [];
		( this.template.m || [] ).forEach( function (template) {
			switch ( template.t ) {
				case ATTRIBUTE:
				case BINDING_FLAG:
				case DECORATOR:
				case EVENT:
				case TRANSITION:
					this$1.attributes.push( createItem({
						owner: this$1,
						parentFragment: this$1.parentFragment,
						template: template
					}) );
					break;

				case DELEGATE_FLAG:
				  this$1.delegate = false;
					break;

				default:
					leftovers.push( template );
					break;
			}
		});

		if ( leftovers.length ) {
			this.attributes.push( new ConditionalAttribute({
				owner: this,
				parentFragment: this.parentFragment,
				template: leftovers
			}) );
		}

		this.attributes.sort( sortAttributes );

		// create children
		if ( options.template.f && !options.deferContent ) {
			this.fragment = new Fragment({
				template: options.template.f,
				owner: this,
				cssIds: null
			});
		}

		this.binding = null; // filled in later
	}

	if ( ContainerItem$$1 ) { Element.__proto__ = ContainerItem$$1; }
	Element.prototype = Object.create( ContainerItem$$1 && ContainerItem$$1.prototype );
	Element.prototype.constructor = Element;

	Element.prototype.bind = function bind$1 () {
		this.attributes.binding = true;
		this.attributes.forEach( bind );
		this.attributes.binding = false;

		if ( this.fragment ) { this.fragment.bind(); }

		// create two-way binding if necessary
		if ( !this.binding ) { this.recreateTwowayBinding(); }
	};

	Element.prototype.createTwowayBinding = function createTwowayBinding () {
		if ( 'twoway' in this ? this.twoway : this.ractive.twoway ) {
			var Binding = selectBinding( this );
			if ( Binding ) {
				var binding = new Binding( this );
				if ( binding && binding.model ) { return binding; }
			}
		}
	};

	Element.prototype.destroyed = function destroyed$1 () {
		var this$1 = this;

		this.attributes.forEach( destroyed );
		for ( var ev in this$1.delegates ) {
			this$1.delegates[ev].unlisten();
		}
		if ( this.fragment ) { this.fragment.destroyed(); }
	};

	Element.prototype.detach = function detach () {
		// if this element is no longer rendered, the transitions are complete and the attributes can be torn down
		if ( !this.rendered ) { this.destroyed(); }

		return detachNode( this.node );
	};

	Element.prototype.find = function find ( selector, options ) {
		if ( this.node && matches( this.node, selector ) ) { return this.node; }
		if ( this.fragment ) {
			return this.fragment.find( selector, options );
		}
	};

	Element.prototype.findAll = function findAll ( selector, options ) {
		var result = options.result;

		if ( matches( this.node, selector ) ) {
			result.push( this.node );
		}

		if ( this.fragment ) {
			this.fragment.findAll( selector, options );
		}
	};

	Element.prototype.findNextNode = function findNextNode () {
		return null;
	};

	Element.prototype.firstNode = function firstNode () {
		return this.node;
	};

	Element.prototype.getAttribute = function getAttribute ( name ) {
		var attribute = this.attributeByName[ name ];
		return attribute ? attribute.getValue() : undefined;
	};

	Element.prototype.getContext = function getContext () {
		var arguments$1 = arguments;

		var assigns = [], len = arguments.length;
		while ( len-- ) { assigns[ len ] = arguments$1[ len ]; }

		if ( this.fragment ) { return (ref = this.fragment).getContext.apply( ref, assigns ); }

		if ( !this.ctx ) { this.ctx = new Context( this.parentFragment, this ); }
		assigns.unshift( Object.create( this.ctx ) );
		return Object.assign.apply( null, assigns );
		var ref;
	};

	Element.prototype.recreateTwowayBinding = function recreateTwowayBinding () {
		if ( this.binding ) {
			this.binding.unbind();
			this.binding.unrender();
		}

		if ( this.binding = this.createTwowayBinding() ) {
			this.binding.bind();
			if ( this.rendered ) { this.binding.render(); }
		}
	};

	Element.prototype.render = function render$1 ( target, occupants ) {
		var this$1 = this;

		// TODO determine correct namespace
		this.namespace = getNamespace( this );

		var node;
		var existing = false;

		if ( occupants ) {
			var n;
			while ( ( n = occupants.shift() ) ) {
				if ( n.nodeName.toUpperCase() === this$1.template.e.toUpperCase() && n.namespaceURI === this$1.namespace ) {
					this$1.node = node = n;
					existing = true;
					break;
				} else {
					detachNode( n );
				}
			}
		}

		if ( !node ) {
			var name = this.template.e;
			node = createElement( this.namespace === html ? name.toLowerCase() : name, this.namespace, this.getAttribute( 'is' ) );
			this.node = node;
		}

		// tie the node to this vdom element
		Object.defineProperty( node, '_ractive', {
			value: {
				proxy: this
			}
		});

		// Is this a top-level node of a component? If so, we may need to add
		// a data-ractive-css attribute, for CSS encapsulation
		if ( this.parentFragment.cssIds ) {
			node.setAttribute( 'data-ractive-css', this.parentFragment.cssIds.map( function (x) { return ("{" + x + "}"); } ).join( ' ' ) );
		}

		if ( existing && this.foundNode ) { this.foundNode( node ); }

		// register intro before rendering content so children can find the intro
		var intro = this.intro;
		if ( intro && intro.shouldFire( 'intro' ) ) {
			intro.isIntro = true;
			intro.isOutro = false;
			runloop.registerTransition( intro );
		}

		if ( this.fragment ) {
			var children = existing ? toArray( node.childNodes ) : undefined;

			this.fragment.render( node, children );

			// clean up leftover children
			if ( children ) {
				children.forEach( detachNode );
			}
		}

		if ( existing ) {
			// store initial values for two-way binding
			if ( this.binding && this.binding.wasUndefined ) { this.binding.setFromNode( node ); }
			// remove unused attributes
			var i = node.attributes.length;
			while ( i-- ) {
				var name$1 = node.attributes[i].name;
				if ( !( name$1 in this$1.attributeByName ) ){ node.removeAttribute( name$1 ); }
			}
		}

		this.attributes.forEach( render );
		if ( this.delegates ) {
			for ( var ev in this$1.delegates ) {
				this$1.delegates[ev].listen( DelegateProxy );
			}
		}

		if ( this.binding ) { this.binding.render(); }

		if ( !existing ) {
			target.appendChild( node );
		}

		this.rendered = true;
	};

	Element.prototype.toString = function toString$$1 () {
		var tagName = this.template.e;

		var attrs = this.attributes.map( stringifyAttribute ).join( '' );

		// Special case - selected options
		if ( this.name === 'option' && this.isSelected() ) {
			attrs += ' selected';
		}

		// Special case - two-way radio name bindings
		if ( this.name === 'input' && inputIsCheckedRadio( this ) ) {
			attrs += ' checked';
		}

		// Special case style and class attributes and directives
		var style, cls;
		this.attributes.forEach( function (attr) {
			if ( attr.name === 'class' ) {
				cls = ( cls || '' ) + ( cls ? ' ' : '' ) + safeAttributeString( attr.getString() );
			} else if ( attr.name === 'style' ) {
				style = ( style || '' ) + ( style ? ' ' : '' ) + safeAttributeString( attr.getString() );
				if ( style && !endsWithSemi.test( style ) ) { style += ';'; }
			} else if ( attr.style ) {
				style = ( style || '' ) + ( style ? ' ' : '' ) +  (attr.style) + ": " + (safeAttributeString( attr.getString() )) + ";";
			} else if ( attr.inlineClass && attr.getValue() ) {
				cls = ( cls || '' ) + ( cls ? ' ' : '' ) + attr.inlineClass;
			}
		});
		// put classes first, then inline style
		if ( style !== undefined ) { attrs = ' style' + ( style ? ("=\"" + style + "\"") : '' ) + attrs; }
		if ( cls !== undefined ) { attrs = ' class' + (cls ? ("=\"" + cls + "\"") : '') + attrs; }

		if ( this.parentFragment.cssIds ) {
			attrs += " data-ractive-css=\"" + (this.parentFragment.cssIds.map( function (x) { return ("{" + x + "}"); } ).join( ' ' )) + "\"";
		}

		var str = "<" + tagName + attrs + ">";

		if ( this.isVoid ) { return str; }

		// Special case - textarea
		if ( this.name === 'textarea' && this.getAttribute( 'value' ) !== undefined ) {
			str += escapeHtml( this.getAttribute( 'value' ) );
		}

		// Special case - contenteditable
		else if ( this.getAttribute( 'contenteditable' ) !== undefined ) {
			str += ( this.getAttribute( 'value' ) || '' );
		}

		if ( this.fragment ) {
			str += this.fragment.toString( !/^(?:script|style)$/i.test( this.template.e ) ); // escape text unless script/style
		}

		str += "</" + tagName + ">";
		return str;
	};

	Element.prototype.unbind = function unbind$1 () {
		this.attributes.unbinding = true;
		this.attributes.forEach( unbind );
		this.attributes.unbinding = false;

		if ( this.binding ) { this.binding.unbind(); }
		if ( this.fragment ) { this.fragment.unbind(); }
	};

	Element.prototype.unrender = function unrender$$1 ( shouldDestroy ) {
		if ( !this.rendered ) { return; }
		this.rendered = false;

		// unrendering before intro completed? complete it now
		// TODO should be an API for aborting transitions
		var transition = this.intro;
		if ( transition && transition.complete ) { transition.complete(); }

		// Detach as soon as we can
		if ( this.name === 'option' ) {
			// <option> elements detach immediately, so that
			// their parent <select> element syncs correctly, and
			// since option elements can't have transitions anyway
			this.detach();
		} else if ( shouldDestroy ) {
			runloop.detachWhenReady( this );
		}

		// outro transition
		var outro = this.outro;
		if ( outro && outro.shouldFire( 'outro' ) ) {
			outro.isIntro = false;
			outro.isOutro = true;
			runloop.registerTransition( outro );
		}

		if ( this.fragment ) { this.fragment.unrender(); }

		if ( this.binding ) { this.binding.unrender(); }
	};

	Element.prototype.update = function update$1 () {
		if ( this.dirty ) {
			this.dirty = false;

			this.attributes.forEach( update );

			if ( this.fragment ) { this.fragment.update(); }
		}
	};

	return Element;
}(ContainerItem));

var toFront = [ 'min', 'max', 'class', 'type' ];
function sortAttributes ( left, right ) {
	left = left.name;
	right = right.name;
	var l = left === 'value' ? 1 : ~toFront.indexOf( left );
	var r = right === 'value' ? 1 : ~toFront.indexOf( right );
	return l < r ? -1 : l > r ? 1 : 0;
}

function inputIsCheckedRadio ( element ) {
	var nameAttr = element.attributeByName.name;
	return element.getAttribute( 'type' ) === 'radio' &&
		( nameAttr || {} ).interpolator &&
		element.getAttribute( 'value' ) === nameAttr.interpolator.model.get();
}

function stringifyAttribute ( attribute ) {
	var str = attribute.toString();
	return str ? ' ' + str : '';
}

function getNamespace ( element ) {
	// Use specified namespace...
	var xmlns$$1 = element.getAttribute( 'xmlns' );
	if ( xmlns$$1 ) { return xmlns$$1; }

	// ...or SVG namespace, if this is an <svg> element
	if ( element.name === 'svg' ) { return svg$1; }

	var parent = element.parent;

	if ( parent ) {
		// ...or HTML, if the parent is a <foreignObject>
		if ( parent.name === 'foreignobject' ) { return html; }

		// ...or inherit from the parent node
		return parent.node.namespaceURI;
	}

	return element.ractive.el.namespaceURI;
}

var Form = (function (Element$$1) {
	function Form ( options ) {
		Element$$1.call( this, options );
		this.formBindings = [];
	}

	if ( Element$$1 ) { Form.__proto__ = Element$$1; }
	Form.prototype = Object.create( Element$$1 && Element$$1.prototype );
	Form.prototype.constructor = Form;

	Form.prototype.render = function render ( target, occupants ) {
		Element$$1.prototype.render.call( this, target, occupants );
		this.node.addEventListener( 'reset', handleReset, false );
	};

	Form.prototype.unrender = function unrender ( shouldDestroy ) {
		this.node.removeEventListener( 'reset', handleReset, false );
		Element$$1.prototype.unrender.call( this, shouldDestroy );
	};

	return Form;
}(Element));

function handleReset () {
	var element = this._ractive.proxy;

	runloop.start();
	element.formBindings.forEach( updateModel );
	runloop.end();
}

function updateModel ( binding ) {
	binding.model.set( binding.resetValue );
}

function progressiveText ( item, target, occupants, text ) {
	if ( occupants ) {
		var n = occupants[0];
		if ( n && n.nodeType === 3 ) {
			var idx = n.nodeValue.indexOf( text );
			occupants.shift();

			if ( idx === 0 ) {
				if ( n.nodeValue.length !== text.length ) {
					occupants.unshift( n.splitText( text.length ) );
				}
			} else {
				n.nodeValue = text;
			}
		} else {
			n = item.node = doc.createTextNode( text );
			if ( occupants[0] ) {
				target.insertBefore( n, occupants[0] );
			} else {
				target.appendChild( n );
			}
		}

		item.node = n;
	} else {
		if ( !item.node ) { item.node = doc.createTextNode( text ); }
		target.appendChild( item.node );
	}
}

var Mustache = (function (Item$$1) {
	function Mustache ( options ) {
		Item$$1.call( this, options );

		this.parentFragment = options.parentFragment;
		this.template = options.template;
		this.index = options.index;
		if ( options.owner ) { this.parent = options.owner; }

		this.isStatic = !!options.template.s;

		this.model = null;
		this.dirty = false;
	}

	if ( Item$$1 ) { Mustache.__proto__ = Item$$1; }
	Mustache.prototype = Object.create( Item$$1 && Item$$1.prototype );
	Mustache.prototype.constructor = Mustache;

	Mustache.prototype.bind = function bind () {
		// yield mustaches should resolve in container context
		var start = this.containerFragment || this.parentFragment;
		// try to find a model for this view
		var model = resolve( start, this.template );

		if ( model ) {
			var value = model.get();

			if ( this.isStatic ) {
				this.model = { get: function () { return value; } };
				return;
			}

			model.register( this );
			this.model = model;
		}
	};

	Mustache.prototype.handleChange = function handleChange () {
		this.bubble();
	};

	Mustache.prototype.rebind = function rebind ( next, previous, safe ) {
		next = rebindMatch( this.template, next, previous, this.parentFragment );
		if ( next === this.model ) { return false; }

		if ( this.model ) {
			this.model.unregister( this );
		}
		if ( next ) { next.addShuffleRegister( this, 'mark' ); }
		this.model = next;
		if ( !safe ) { this.handleChange(); }
		return true;
	};

	Mustache.prototype.unbind = function unbind () {
		if ( !this.isStatic ) {
			this.model && this.model.unregister( this );
			this.model = undefined;
		}
	};

	return Mustache;
}(Item));

var MustacheContainer = (function (ContainerItem$$1) {
	function MustacheContainer ( options ) {
		ContainerItem$$1.call( this, options );
	}

	if ( ContainerItem$$1 ) { MustacheContainer.__proto__ = ContainerItem$$1; }
	MustacheContainer.prototype = Object.create( ContainerItem$$1 && ContainerItem$$1.prototype );
	MustacheContainer.prototype.constructor = MustacheContainer;

	return MustacheContainer;
}(ContainerItem));
var proto$2 = MustacheContainer.prototype;
var mustache = Mustache.prototype;
proto$2.bind = mustache.bind;
proto$2.handleChange = mustache.handleChange;
proto$2.rebind = mustache.rebind;
proto$2.unbind = mustache.unbind;

var Interpolator = (function (Mustache$$1) {
	function Interpolator () {
		Mustache$$1.apply(this, arguments);
	}

	if ( Mustache$$1 ) { Interpolator.__proto__ = Mustache$$1; }
	Interpolator.prototype = Object.create( Mustache$$1 && Mustache$$1.prototype );
	Interpolator.prototype.constructor = Interpolator;

	Interpolator.prototype.bubble = function bubble () {
		if ( this.owner ) { this.owner.bubble(); }
		Mustache$$1.prototype.bubble.call(this);
	};

	Interpolator.prototype.detach = function detach () {
		return detachNode( this.node );
	};

	Interpolator.prototype.firstNode = function firstNode () {
		return this.node;
	};

	Interpolator.prototype.getString = function getString () {
		return this.model ? safeToStringValue( this.model.get() ) : '';
	};

	Interpolator.prototype.render = function render ( target, occupants ) {
		if ( inAttributes() ) { return; }
		var value = this.getString();

		this.rendered = true;

		progressiveText( this, target, occupants, value );
	};

	Interpolator.prototype.toString = function toString ( escape ) {
		var string = this.getString();
		return escape ? escapeHtml( string ) : string;
	};

	Interpolator.prototype.unrender = function unrender ( shouldDestroy ) {
		if ( shouldDestroy ) { this.detach(); }
		this.rendered = false;
	};

	Interpolator.prototype.update = function update () {
		if ( this.dirty ) {
			this.dirty = false;
			if ( this.rendered ) {
				this.node.data = this.getString();
			}
		}
	};

	Interpolator.prototype.valueOf = function valueOf () {
		return this.model ? this.model.get() : undefined;
	};

	return Interpolator;
}(Mustache));

var Input = (function (Element$$1) {
	function Input () {
		Element$$1.apply(this, arguments);
	}

	if ( Element$$1 ) { Input.__proto__ = Element$$1; }
	Input.prototype = Object.create( Element$$1 && Element$$1.prototype );
	Input.prototype.constructor = Input;

	Input.prototype.render = function render ( target, occupants ) {
		Element$$1.prototype.render.call( this, target, occupants );
		this.node.defaultValue = this.node.value;
	};
	Input.prototype.compare = function compare ( value, attrValue ) {
		var comparator = this.getAttribute( 'value-comparator' );
		if ( comparator ) {
			if ( typeof comparator === 'function' ) {
				return comparator( value, attrValue );
			}
			if (value && attrValue) {
				return value[comparator] == attrValue[comparator];
			}
		}
		return value == attrValue;
	};

	return Input;
}(Element));

// simple JSON parser, without the restrictions of JSON parse
// (i.e. having to double-quote keys).
//
// If passed a hash of values as the second argument, ${placeholders}
// will be replaced with those values

var specials$1 = {
	true: true,
	false: false,
	null: null,
	undefined: undefined
};

var specialsPattern = new RegExp( '^(?:' + Object.keys( specials$1 ).join( '|' ) + ')' );
var numberPattern$1 = /^(?:[+-]?)(?:(?:(?:0|[1-9]\d*)?\.\d+)|(?:(?:0|[1-9]\d*)\.)|(?:0|[1-9]\d*))(?:[eE][+-]?\d+)?/;
var placeholderPattern = /\$\{([^\}]+)\}/g;
var placeholderAtStartPattern = /^\$\{([^\}]+)\}/;
var onlyWhitespace = /^\s*$/;

var JsonParser = Parser.extend({
	init: function init ( str, options ) {
		this.values = options.values;
		this.allowWhitespace();
	},

	postProcess: function postProcess ( result ) {
		if ( result.length !== 1 || !onlyWhitespace.test( this.leftover ) ) {
			return null;
		}

		return { value: result[0].v };
	},

	converters: [
		function getPlaceholder ( parser ) {
			if ( !parser.values ) { return null; }

			var placeholder = parser.matchPattern( placeholderAtStartPattern );

			if ( placeholder && ( parser.values.hasOwnProperty( placeholder ) ) ) {
				return { v: parser.values[ placeholder ] };
			}
		},

		function getSpecial ( parser ) {
			var special = parser.matchPattern( specialsPattern );
			if ( special ) { return { v: specials$1[ special ] }; }
		},

		function getNumber ( parser ) {
			var number = parser.matchPattern( numberPattern$1 );
			if ( number ) { return { v: +number }; }
		},

		function getString ( parser ) {
			var stringLiteral = readStringLiteral( parser );
			var values = parser.values;

			if ( stringLiteral && values ) {
				return {
					v: stringLiteral.v.replace( placeholderPattern, function ( match, $1 ) { return ( $1 in values ? values[ $1 ] : $1 ); } )
				};
			}

			return stringLiteral;
		},

		function getObject ( parser ) {
			if ( !parser.matchString( '{' ) ) { return null; }

			var result = {};

			parser.allowWhitespace();

			if ( parser.matchString( '}' ) ) {
				return { v: result };
			}

			var pair;
			while ( pair = getKeyValuePair( parser ) ) {
				result[ pair.key ] = pair.value;

				parser.allowWhitespace();

				if ( parser.matchString( '}' ) ) {
					return { v: result };
				}

				if ( !parser.matchString( ',' ) ) {
					return null;
				}
			}

			return null;
		},

		function getArray ( parser ) {
			if ( !parser.matchString( '[' ) ) { return null; }

			var result = [];

			parser.allowWhitespace();

			if ( parser.matchString( ']' ) ) {
				return { v: result };
			}

			var valueToken;
			while ( valueToken = parser.read() ) {
				result.push( valueToken.v );

				parser.allowWhitespace();

				if ( parser.matchString( ']' ) ) {
					return { v: result };
				}

				if ( !parser.matchString( ',' ) ) {
					return null;
				}

				parser.allowWhitespace();
			}

			return null;
		}
	]
});

function getKeyValuePair ( parser ) {
	parser.allowWhitespace();

	var key = readKey( parser );

	if ( !key ) { return null; }

	var pair = { key: key };

	parser.allowWhitespace();
	if ( !parser.matchString( ':' ) ) {
		return null;
	}
	parser.allowWhitespace();

	var valueToken = parser.read();

	if ( !valueToken ) { return null; }

	pair.value = valueToken.v;
	return pair;
}

var parseJSON = function ( str, values ) {
	var parser = new JsonParser( str, { values: values });
	return parser.result;
};

var Mapping = (function (Item$$1) {
	function Mapping ( options ) {
		Item$$1.call( this, options );

		this.name = options.template.n;

		this.owner = options.owner || options.parentFragment.owner || options.element || findElement( options.parentFragment );
		this.element = options.element || (this.owner.attributeByName ? this.owner : findElement( options.parentFragment ) );
		this.parentFragment = this.element.parentFragment; // shared
		this.ractive = this.parentFragment.ractive;

		this.fragment = null;

		this.element.attributeByName[ this.name ] = this;

		this.value = options.template.f;
	}

	if ( Item$$1 ) { Mapping.__proto__ = Item$$1; }
	Mapping.prototype = Object.create( Item$$1 && Item$$1.prototype );
	Mapping.prototype.constructor = Mapping;

	Mapping.prototype.bind = function bind () {
		if ( this.fragment ) {
			this.fragment.bind();
		}

		var template = this.template.f;
		var viewmodel = this.element.instance.viewmodel;

		if ( template === 0 ) {
			// empty attributes are `true`
			viewmodel.joinKey( this.name ).set( true );
		}

		else if ( typeof template === 'string' ) {
			var parsed = parseJSON( template );
			viewmodel.joinKey( this.name ).set( parsed ? parsed.value : template );
		}

		else if ( Array.isArray( template ) ) {
			createMapping( this, true );
		}
	};

	Mapping.prototype.render = function render () {};

	Mapping.prototype.unbind = function unbind () {
		if ( this.fragment ) { this.fragment.unbind(); }
		if ( this.model ) { this.model.unregister( this ); }
		if ( this.boundFragment ) { this.boundFragment.unbind(); }

		if ( this.element.bound ) {
			if ( this.link.target === this.model ) { this.link.owner.unlink(); }
		}
	};

	Mapping.prototype.unrender = function unrender () {};

	Mapping.prototype.update = function update () {
		if ( this.dirty ) {
			this.dirty = false;
			if ( this.fragment ) { this.fragment.update(); }
			if ( this.boundFragment ) { this.boundFragment.update(); }
			if ( this.rendered ) { this.updateDelegate(); }
		}
	};

	return Mapping;
}(Item));

function createMapping ( item ) {
	var template = item.template.f;
	var viewmodel = item.element.instance.viewmodel;
	var childData = viewmodel.value;

	if ( template.length === 1 && template[0].t === INTERPOLATOR ) {
		var model = resolve( item.parentFragment, template[0] );
		var val = model.get( false );

		// if the interpolator is not static
		if ( !template[0].s ) {
			item.model = model;
			item.link = viewmodel.createLink( item.name, model, template[0].r );

			// initialize parent side of the mapping from child data
			if ( val === undefined && !model.isReadonly && item.name in childData ) {
				model.set( childData[ item.name ] );
			}
		}

		// copy non-object, non-computed vals through
		else if ( typeof val !== 'object' || template[0].x ) {
			viewmodel.joinKey( item.name ).set( val );
		}

		// warn about trying to copy an object
		else {
			warnIfDebug( ("Cannot copy non-computed object value from static mapping '" + (item.name) + "'") );
		}
	}

	else {
		item.boundFragment = new Fragment({
			owner: item,
			template: template
		}).bind();

		item.model = viewmodel.joinKey( item.name );
		item.model.set( item.boundFragment.valueOf() );

		// item is a *bit* of a hack
		item.boundFragment.bubble = function () {
			Fragment.prototype.bubble.call( item.boundFragment );
			// defer this to avoid mucking around model deps if there happens to be an expression involved
			runloop.scheduleTask(function () {
				item.boundFragment.update();
				item.model.set( item.boundFragment.valueOf() );
			});
		};
	}
}

var Option = (function (Element$$1) {
	function Option ( options ) {
		var template = options.template;
		if ( !template.a ) { template.a = {}; }

		// If the value attribute is missing, use the element's content,
		// as long as it isn't disabled
		if ( template.a.value === undefined && !( 'disabled' in template.a ) ) {
			template.a.value = template.f || '';
		}

		Element$$1.call( this, options );

		this.select = findElement( this.parent || this.parentFragment, false, 'select' );
	}

	if ( Element$$1 ) { Option.__proto__ = Element$$1; }
	Option.prototype = Object.create( Element$$1 && Element$$1.prototype );
	Option.prototype.constructor = Option;

	Option.prototype.bind = function bind () {
		if ( !this.select ) {
			Element$$1.prototype.bind.call(this);
			return;
		}

		// If the select has a value, it overrides the `selected` attribute on
		// this option - so we delete the attribute
		var selectedAttribute = this.attributeByName.selected;
		if ( selectedAttribute && this.select.getAttribute( 'value' ) !== undefined ) {
			var index = this.attributes.indexOf( selectedAttribute );
			this.attributes.splice( index, 1 );
			delete this.attributeByName.selected;
		}

		Element$$1.prototype.bind.call(this);
		this.select.options.push( this );
	};

	Option.prototype.bubble = function bubble () {
		// if we're using content as value, may need to update here
		var value = this.getAttribute( 'value' );
		if ( this.node && this.node.value !== value ) {
			this.node._ractive.value = value;
		}
		Element$$1.prototype.bubble.call(this);
	};

	Option.prototype.getAttribute = function getAttribute ( name ) {
		var attribute = this.attributeByName[ name ];
		return attribute ? attribute.getValue() : name === 'value' && this.fragment ? this.fragment.valueOf() : undefined;
	};

	Option.prototype.isSelected = function isSelected () {
		var this$1 = this;

		var optionValue = this.getAttribute( 'value' );

		if ( optionValue === undefined || !this.select ) {
			return false;
		}

		var selectValue = this.select.getAttribute( 'value' );

		if ( this.select.compare( selectValue, optionValue ) ) {
			return true;
		}

		if ( this.select.getAttribute( 'multiple' ) && Array.isArray( selectValue ) ) {
			var i = selectValue.length;
			while ( i-- ) {
				if ( this$1.select.compare( selectValue[i], optionValue ) ) {
					return true;
				}
			}
		}
	};

	Option.prototype.render = function render ( target, occupants ) {
		Element$$1.prototype.render.call( this, target, occupants );

		if ( !this.attributeByName.value ) {
			this.node._ractive.value = this.getAttribute( 'value' );
		}
	};

	Option.prototype.unbind = function unbind () {
		Element$$1.prototype.unbind.call(this);

		if ( this.select ) {
			removeFromArray( this.select.options, this );
		}
	};

	return Option;
}(Element));

function getPartialTemplate ( ractive, name, parentFragment ) {
	// If the partial in instance or view heirarchy instances, great
	var partial = getPartialFromRegistry( ractive, name, parentFragment || {} );
	if ( partial ) { return partial; }

	// Does it exist on the page as a script tag?
	partial = parser.fromId( name, { noThrow: true } );
	if ( partial ) {
		// parse and register to this ractive instance
		var parsed = parser.parseFor( partial, ractive );

		// register extra partials on the ractive instance if they don't already exist
		if ( parsed.p ) { fillGaps( ractive.partials, parsed.p ); }

		// register (and return main partial if there are others in the template)
		return ractive.partials[ name ] = parsed.t;
	}
}

function getPartialFromRegistry ( ractive, name, parentFragment ) {
	// if there was an instance up-hierarchy, cool
	var partial = findParentPartial( name, parentFragment.owner );
	if ( partial ) { return partial; }

	// find first instance in the ractive or view hierarchy that has this partial
	var instance = findInstance( 'partials', ractive, name );

	if ( !instance ) { return; }

	partial = instance.partials[ name ];

	// partial is a function?
	var fn;
	if ( typeof partial === 'function' ) {
		fn = partial.bind( instance );
		fn.isOwner = instance.partials.hasOwnProperty(name);
		partial = fn.call( ractive, parser );
	}

	if ( !partial && partial !== '' ) {
		warnIfDebug( noRegistryFunctionReturn, name, 'partial', 'partial', { ractive: ractive });
		return;
	}

	// If this was added manually to the registry,
	// but hasn't been parsed, parse it now
	if ( !parser.isParsed( partial ) ) {
		// use the parseOptions of the ractive instance on which it was found
		var parsed = parser.parseFor( partial, instance );

		// Partials cannot contain nested partials!
		// TODO add a test for this
		if ( parsed.p ) {
			warnIfDebug( 'Partials ({{>%s}}) cannot contain nested inline partials', name, { ractive: ractive });
		}

		// if fn, use instance to store result, otherwise needs to go
		// in the correct point in prototype chain on instance or constructor
		var target = fn ? instance : findOwner( instance, name );

		// may be a template with partials, which need to be registered and main template extracted
		target.partials[ name ] = partial = parsed.t;
	}

	// store for reset
	if ( fn ) { partial._fn = fn; }

	return partial.v ? partial.t : partial;
}

function findOwner ( ractive, key ) {
	return ractive.partials.hasOwnProperty( key )
		? ractive
		: findConstructor( ractive.constructor, key);
}

function findConstructor ( constructor, key ) {
	if ( !constructor ) { return; }
	return constructor.partials.hasOwnProperty( key )
		? constructor
		: findConstructor( constructor._Parent, key );
}

function findParentPartial( name, parent ) {
	if ( parent ) {
		if ( parent.template && parent.template.p && parent.template.p[name] ) {
			return parent.template.p[name];
		} else if ( parent.parentFragment && parent.parentFragment.owner ) {
			return findParentPartial( name, parent.parentFragment.owner );
		}
	}
}

var Partial = (function (MustacheContainer$$1) {
	function Partial ( options ) {
		MustacheContainer$$1.call( this, options );

		this.yielder = options.template.t === YIELDER;

		if ( this.yielder ) {
			this.container = options.parentFragment.ractive;
			this.component = this.container.component;

			this.containerFragment = options.parentFragment;
			this.parentFragment = this.component.parentFragment;

			// {{yield}} is equivalent to {{yield content}}
			if ( !options.template.r && !options.template.rx && !options.template.x ) { options.template.r = 'content'; }
		}
	}

	if ( MustacheContainer$$1 ) { Partial.__proto__ = MustacheContainer$$1; }
	Partial.prototype = Object.create( MustacheContainer$$1 && MustacheContainer$$1.prototype );
	Partial.prototype.constructor = Partial;

	Partial.prototype.bind = function bind () {
		var this$1 = this;

		// keep track of the reference name for future resets
		this.refName = this.template.r;

		// name matches take priority over expressions
		var template = this.refName ? getPartialTemplate( this.ractive, this.refName, this.parentFragment ) || null : null;
		var templateObj;

		if ( template ) {
			this.named = true;
			this.setTemplate( this.template.r, template );
		}

		if ( !template ) {
			MustacheContainer$$1.prototype.bind.call(this);
			if ( ( templateObj = this.model.get() ) && typeof templateObj === 'object' && ( typeof templateObj.template === 'string' || Array.isArray( templateObj.t ) ) ) {
				if ( templateObj.template ) {
					this.source = templateObj.template;
					templateObj = parsePartial( this.template.r, templateObj.template, this.ractive );
				} else {
					this.source = templateObj.t;
				}
				this.setTemplate( this.template.r, templateObj.t );
			} else if ( typeof this.model.get() !== 'string' && this.refName ) {
				this.setTemplate( this.refName, template );
			} else {
				this.setTemplate( this.model.get() );
			}
		}

		var options = {
			owner: this,
			template: this.partialTemplate
		};

		if ( this.template.c ) {
			options.template = [{ t: SECTION, n: SECTION_WITH, f: options.template }];
			for ( var k in this$1.template.c ) {
				options.template[0][k] = this$1.template.c[k];
			}
		}

		if ( this.yielder ) {
			options.ractive = this.container.parent;
		}

		this.fragment = new Fragment(options);
		if ( this.template.z ) {
			this.fragment.aliases = resolveAliases( this.template.z, this.yielder ? this.containerFragment : this.parentFragment );
		}
		this.fragment.bind();
	};

	Partial.prototype.bubble = function bubble () {
		if ( this.yielder && !this.dirty ) {
			this.containerFragment.bubble();
			this.dirty = true;
		} else {
			MustacheContainer$$1.prototype.bubble.call(this);
		}
	};

	Partial.prototype.findNextNode = function findNextNode () {
		return this.yielder ? this.containerFragment.findNextNode( this ) : MustacheContainer$$1.prototype.findNextNode.call(this);
	};

	Partial.prototype.forceResetTemplate = function forceResetTemplate () {
		var this$1 = this;

		this.partialTemplate = undefined;

		// on reset, check for the reference name first
		if ( this.refName ) {
			this.partialTemplate = getPartialTemplate( this.ractive, this.refName, this.parentFragment );
		}

		// then look for the resolved name
		if ( !this.partialTemplate ) {
			this.partialTemplate = getPartialTemplate( this.ractive, this.name, this.parentFragment );
		}

		if ( !this.partialTemplate ) {
			warnOnceIfDebug( ("Could not find template for partial '" + (this.name) + "'") );
			this.partialTemplate = [];
		}

		if ( this.inAttribute ) {
			doInAttributes( function () { return this$1.fragment.resetTemplate( this$1.partialTemplate ); } );
		} else {
			this.fragment.resetTemplate( this.partialTemplate );
		}

		this.bubble();
	};

	Partial.prototype.render = function render ( target, occupants ) {
		return this.fragment.render( target, occupants );
	};

	Partial.prototype.setTemplate = function setTemplate ( name, template ) {
		this.name = name;

		if ( !template && template !== null ) { template = getPartialTemplate( this.ractive, name, this.parentFragment ); }

		if ( !template ) {
			warnOnceIfDebug( ("Could not find template for partial '" + name + "'") );
		}

		this.partialTemplate = template || [];
	};

	Partial.prototype.unbind = function unbind () {
		MustacheContainer$$1.prototype.unbind.call(this);
		this.fragment.aliases = {};
		this.fragment.unbind();
	};

	Partial.prototype.unrender = function unrender ( shouldDestroy ) {
		this.fragment.unrender( shouldDestroy );
	};

	Partial.prototype.update = function update () {
		var template;

		if ( this.dirty ) {
			this.dirty = false;

			if ( !this.named ) {
				if ( this.model ) {
					template = this.model.get();
				}

				if ( template && typeof template === 'string' && template !== this.name ) {
					this.setTemplate( template );
					this.fragment.resetTemplate( this.partialTemplate );
				} else if ( template && typeof template === 'object' && ( typeof template.template === 'string' || Array.isArray( template.t ) ) ) {
					if ( template.t !== this.source && template.template !== this.source ) {
						if ( template.template ) {
							this.source = template.template;
							template = parsePartial( this.name, template.template, this.ractive );
						} else {
							this.source = template.t;
						}
						this.setTemplate( this.name, template.t );
						this.fragment.resetTemplate( this.partialTemplate );
					}
				}
			}

			this.fragment.update();
		}
	};

	return Partial;
}(MustacheContainer));

function parsePartial( name, partial, ractive ) {
	var parsed;

	try {
		parsed = parser.parse( partial, parser.getParseOptions( ractive ) );
	} catch (e) {
		warnIfDebug( ("Could not parse partial from expression '" + name + "'\n" + (e.message)) );
	}

	return parsed || { t: [] };
}

var RepeatedFragment = function RepeatedFragment ( options ) {
	this.parent = options.owner.parentFragment;

	// bit of a hack, so reference resolution works without another
	// layer of indirection
	this.parentFragment = this;
	this.owner = options.owner;
	this.ractive = this.parent.ractive;
	this.delegate = this.parent.delegate || findElement( options.owner );
	// delegation disabled by directive
	if ( this.delegate && this.delegate.delegate === false ) { this.delegate = false; }

	// encapsulated styles should be inherited until they get applied by an element
	this.cssIds = 'cssIds' in options ? options.cssIds : ( this.parent ? this.parent.cssIds : null );

	this.context = null;
	this.rendered = false;
	this.iterations = [];

	this.template = options.template;

	this.indexRef = options.indexRef;
	this.keyRef = options.keyRef;

	this.pendingNewIndices = null;
	this.previousIterations = null;

	// track array versus object so updates of type rest
	this.isArray = false;
};

RepeatedFragment.prototype.bind = function bind$$1 ( context ) {
		var this$1 = this;

	this.context = context;
	var value = context.get();

	// {{#each array}}...
	if ( this.isArray = Array.isArray( value ) ) {
		// we can't use map, because of sparse arrays
		this.iterations = [];
		var max = value.length;
		for ( var i = 0; i < max; i += 1 ) {
			this$1.iterations[i] = this$1.createIteration( i, i );
		}
	}

	// {{#each object}}...
	else if ( isObject( value ) ) {
		this.isArray = false;

		// TODO this is a dreadful hack. There must be a neater way
		if ( this.indexRef ) {
			var refs = this.indexRef.split( ',' );
			this.keyRef = refs[0];
			this.indexRef = refs[1];
		}

		this.iterations = Object.keys( value ).map( function ( key, index ) {
			return this$1.createIteration( key, index );
		});
	}

	return this;
};

RepeatedFragment.prototype.bubble = function bubble ( index ) {
	if  ( !this.bubbled ) { this.bubbled = []; }
	this.bubbled.push( index );

	this.owner.bubble();
};

RepeatedFragment.prototype.createIteration = function createIteration ( key, index ) {
	var fragment = new Fragment({
		owner: this,
		template: this.template
	});

	fragment.key = key;
	fragment.index = index;
	fragment.isIteration = true;
	fragment.delegate = this.delegate;

	var model = this.context.joinKey( key );

	// set up an iteration alias if there is one
	if ( this.owner.template.z ) {
		fragment.aliases = {};
		fragment.aliases[ this.owner.template.z[0].n ] = model;
	}

	return fragment.bind( model );
};

RepeatedFragment.prototype.destroyed = function destroyed$1 () {
	this.iterations.forEach( destroyed );
};

RepeatedFragment.prototype.detach = function detach () {
	var docFrag = createDocumentFragment();
	this.iterations.forEach( function (fragment) { return docFrag.appendChild( fragment.detach() ); } );
	return docFrag;
};

RepeatedFragment.prototype.find = function find ( selector, options ) {
	return findMap( this.iterations, function (i) { return i.find( selector, options ); } );
};

RepeatedFragment.prototype.findAll = function findAll ( selector, options ) {
	return this.iterations.forEach( function (i) { return i.findAll( selector, options ); } );
};

RepeatedFragment.prototype.findComponent = function findComponent ( name, options ) {
	return findMap( this.iterations, function (i) { return i.findComponent( name, options ); } );
};

RepeatedFragment.prototype.findAllComponents = function findAllComponents ( name, options ) {
	return this.iterations.forEach( function (i) { return i.findAllComponents( name, options ); } );
};

RepeatedFragment.prototype.findNextNode = function findNextNode ( iteration ) {
		var this$1 = this;

	if ( iteration.index < this.iterations.length - 1 ) {
		for ( var i = iteration.index + 1; i < this.iterations.length; i++ ) {
			var node = this$1.iterations[ i ].firstNode( true );
			if ( node ) { return node; }
		}
	}

	return this.owner.findNextNode();
};

RepeatedFragment.prototype.firstNode = function firstNode ( skipParent ) {
	return this.iterations[0] ? this.iterations[0].firstNode( skipParent ) : null;
};

RepeatedFragment.prototype.rebind = function rebind ( next ) {
		var this$1 = this;

	this.context = next;
	this.iterations.forEach( function (fragment) {
		var model = next ? next.joinKey( fragment.key ) : undefined;
		fragment.context = model;
		if ( this$1.owner.template.z ) {
			fragment.aliases = {};
			fragment.aliases[ this$1.owner.template.z[0].n ] = model;
		}
	});
};

RepeatedFragment.prototype.render = function render$$1 ( target, occupants ) {
	// TODO use docFrag.cloneNode...

	var xs = this.iterations;
	if ( xs ) {
		var len = xs.length;
		for ( var i = 0; i < len; i++ ) {
			xs[i].render( target, occupants );
		}
	}

	this.rendered = true;
};

RepeatedFragment.prototype.shuffle = function shuffle ( newIndices ) {
		var this$1 = this;

	if ( !this.pendingNewIndices ) { this.previousIterations = this.iterations.slice(); }

	if ( !this.pendingNewIndices ) { this.pendingNewIndices = []; }

	this.pendingNewIndices.push( newIndices );

	var iterations = [];

	newIndices.forEach( function ( newIndex, oldIndex ) {
		if ( newIndex === -1 ) { return; }

		var fragment = this$1.iterations[ oldIndex ];
		iterations[ newIndex ] = fragment;

		if ( newIndex !== oldIndex && fragment ) { fragment.dirty = true; }
	});

	this.iterations = iterations;

	this.bubble();
};

RepeatedFragment.prototype.shuffled = function shuffled$1 () {
	this.iterations.forEach( shuffled );
};

RepeatedFragment.prototype.toString = function toString$1$$1 ( escape ) {
	return this.iterations ?
		this.iterations.map( escape ? toEscapedString : toString$1$1 ).join( '' ) :
		'';
};

RepeatedFragment.prototype.unbind = function unbind$1 () {
	this.iterations.forEach( unbind );
	return this;
};

RepeatedFragment.prototype.unrender = function unrender$1 ( shouldDestroy ) {
	this.iterations.forEach( shouldDestroy ? unrenderAndDestroy : unrender );
	if ( this.pendingNewIndices && this.previousIterations ) {
		this.previousIterations.forEach( function (fragment) {
			if ( fragment.rendered ) { shouldDestroy ? unrenderAndDestroy( fragment ) : unrender( fragment ); }
		});
	}
	this.rendered = false;
};

// TODO smart update
RepeatedFragment.prototype.update = function update$1 () {
		var this$1 = this;

	// skip dirty check, since this is basically just a facade

	if ( this.pendingNewIndices ) {
		this.bubbled.length = 0;
		this.updatePostShuffle();
		return;
	}

	if ( this.updating ) { return; }
	this.updating = true;

	var value = this.context.get();
	var wasArray = this.isArray;

	var toRemove;
	var oldKeys;
	var reset = true;
	var i;

	if ( this.isArray = Array.isArray( value ) ) {
		if ( wasArray ) {
			reset = false;
			if ( this.iterations.length > value.length ) {
				toRemove = this.iterations.splice( value.length );
			}
		}
	} else if ( isObject( value ) && !wasArray ) {
		reset = false;
		toRemove = [];
		oldKeys = {};
		i = this.iterations.length;

		while ( i-- ) {
			var fragment$1 = this$1.iterations[i];
			if ( fragment$1.key in value ) {
				oldKeys[ fragment$1.key ] = true;
			} else {
				this$1.iterations.splice( i, 1 );
				toRemove.push( fragment$1 );
			}
		}
	}

	if ( reset ) {
		toRemove = this.iterations;
		this.iterations = [];
	}

	if ( toRemove ) {
		toRemove.forEach( function (fragment) {
			fragment.unbind();
			fragment.unrender( true );
		});
	}

	// update the remaining ones
	if ( !reset && this.isArray && this.bubbled && this.bubbled.length ) {
		this.bubbled.forEach( function (i) { return this$1.iterations[i] && this$1.iterations[i].update(); } );
	} else {
		this.iterations.forEach( update );
	}

	if ( this.bubbled ) { this.bubbled.length = 0; }

	// add new iterations
	var newLength = Array.isArray( value ) ?
		value.length :
		isObject( value ) ?
			Object.keys( value ).length :
			0;

	var docFrag;
	var fragment;

	if ( newLength > this.iterations.length ) {
		docFrag = this.rendered ? createDocumentFragment() : null;
		i = this.iterations.length;

		if ( Array.isArray( value ) ) {
			while ( i < value.length ) {
				fragment = this$1.createIteration( i, i );

				this$1.iterations.push( fragment );
				if ( this$1.rendered ) { fragment.render( docFrag ); }

				i += 1;
			}
		}

		else if ( isObject( value ) ) {
			// TODO this is a dreadful hack. There must be a neater way
			if ( this.indexRef && !this.keyRef ) {
				var refs = this.indexRef.split( ',' );
				this.keyRef = refs[0];
				this.indexRef = refs[1];
			}

			Object.keys( value ).forEach( function (key) {
				if ( !oldKeys || !( key in oldKeys ) ) {
					fragment = this$1.createIteration( key, i );

					this$1.iterations.push( fragment );
					if ( this$1.rendered ) { fragment.render( docFrag ); }

					i += 1;
				}
			});
		}

		if ( this.rendered ) {
			var parentNode = this.parent.findParentNode();
			var anchor = this.parent.findNextNode( this.owner );

			parentNode.insertBefore( docFrag, anchor );
		}
	}

	this.updating = false;
};

RepeatedFragment.prototype.updatePostShuffle = function updatePostShuffle () {
		var this$1 = this;

	var newIndices = this.pendingNewIndices[ 0 ];

	// map first shuffle through
	this.pendingNewIndices.slice( 1 ).forEach( function (indices) {
		newIndices.forEach( function ( newIndex, oldIndex ) {
			newIndices[ oldIndex ] = indices[ newIndex ];
		});
	});

	// This algorithm (for detaching incorrectly-ordered fragments from the DOM and
	// storing them in a document fragment for later reinsertion) seems a bit hokey,
	// but it seems to work for now
	var len = this.context.get().length;
	var oldLen = this.previousIterations.length;
	var removed = {};
	var i;

	newIndices.forEach( function ( newIndex, oldIndex ) {
		var fragment = this$1.previousIterations[ oldIndex ];
		this$1.previousIterations[ oldIndex ] = null;

		if ( newIndex === -1 ) {
			removed[ oldIndex ] = fragment;
		} else if ( fragment.index !== newIndex ) {
			var model = this$1.context.joinKey( newIndex );
			fragment.index = fragment.key = newIndex;
			fragment.context = model;
			if ( this$1.owner.template.z ) {
				fragment.aliases = {};
				fragment.aliases[ this$1.owner.template.z[0].n ] = model;
			}
		}
	});

	// if the array was spliced outside of ractive, sometimes there are leftover fragments not in the newIndices
	this.previousIterations.forEach( function ( frag, i ) {
		if ( frag ) { removed[ i ] = frag; }
	});

	// create new/move existing iterations
	var docFrag = this.rendered ? createDocumentFragment() : null;
	var parentNode = this.rendered ? this.parent.findParentNode() : null;

	var contiguous = 'startIndex' in newIndices;
	i = contiguous ? newIndices.startIndex : 0;

	for ( i; i < len; i++ ) {
		var frag = this$1.iterations[i];

		if ( frag && contiguous ) {
			// attach any built-up iterations
			if ( this$1.rendered ) {
				if ( removed[i] ) { docFrag.appendChild( removed[i].detach() ); }
				if ( docFrag.childNodes.length  ) { parentNode.insertBefore( docFrag, frag.firstNode() ); }
			}
			continue;
		}

		if ( !frag ) { this$1.iterations[i] = this$1.createIteration( i, i ); }

		if ( this$1.rendered ) {
			if ( removed[i] ) { docFrag.appendChild( removed[i].detach() ); }

			if ( frag ) { docFrag.appendChild( frag.detach() ); }
			else {
				this$1.iterations[i].render( docFrag );
			}
		}
	}

	// append any leftovers
	if ( this.rendered ) {
		for ( i = len; i < oldLen; i++ ) {
			if ( removed[i] ) { docFrag.appendChild( removed[i].detach() ); }
		}

		if ( docFrag.childNodes.length ) {
			parentNode.insertBefore( docFrag, this.owner.findNextNode() );
		}
	}

	// trigger removal on old nodes
	Object.keys( removed ).forEach( function (k) { return removed[k].unbind().unrender( true ); } );

	this.iterations.forEach( update );

	this.pendingNewIndices = null;

	this.shuffled();
};

function isEmpty ( value ) {
	return !value ||
	       ( Array.isArray( value ) && value.length === 0 ) ||
		   ( isObject( value ) && Object.keys( value ).length === 0 );
}

function getType ( value, hasIndexRef ) {
	if ( hasIndexRef || Array.isArray( value ) ) { return SECTION_EACH; }
	if ( isObject( value ) || typeof value === 'function' ) { return SECTION_IF_WITH; }
	if ( value === undefined ) { return null; }
	return SECTION_IF;
}

var Section = (function (MustacheContainer$$1) {
	function Section ( options ) {
		MustacheContainer$$1.call( this, options );

		this.sectionType = options.template.n || null;
		this.templateSectionType = this.sectionType;
		this.subordinate = options.template.l === 1;
		this.fragment = null;
	}

	if ( MustacheContainer$$1 ) { Section.__proto__ = MustacheContainer$$1; }
	Section.prototype = Object.create( MustacheContainer$$1 && MustacheContainer$$1.prototype );
	Section.prototype.constructor = Section;

	Section.prototype.bind = function bind () {
		MustacheContainer$$1.prototype.bind.call(this);

		if ( this.subordinate ) {
			this.sibling = this.parentFragment.items[ this.parentFragment.items.indexOf( this ) - 1 ];
			this.sibling.nextSibling = this;
		}

		// if we managed to bind, we need to create children
		if ( this.model ) {
			this.dirty = true;
			this.update();
		} else if ( this.sectionType && this.sectionType === SECTION_UNLESS && ( !this.sibling || !this.sibling.isTruthy() ) ) {
			this.fragment = new Fragment({
				owner: this,
				template: this.template.f
			}).bind();
		}
	};

	Section.prototype.detach = function detach () {
		var frag = this.fragment || this.detached;
		return frag ? frag.detach() : MustacheContainer$$1.prototype.detach.call(this);
	};

	Section.prototype.isTruthy = function isTruthy () {
		if ( this.subordinate && this.sibling.isTruthy() ) { return true; }
		var value = !this.model ? undefined : this.model.isRoot ? this.model.value : this.model.get();
		return !!value && ( this.templateSectionType === SECTION_IF_WITH || !isEmpty( value ) );
	};

	Section.prototype.rebind = function rebind ( next, previous, safe ) {
		if ( MustacheContainer$$1.prototype.rebind.call( this, next, previous, safe ) ) {
			if ( this.fragment && this.sectionType !== SECTION_IF && this.sectionType !== SECTION_UNLESS ) {
				this.fragment.rebind( next );
			}
		}
	};

	Section.prototype.render = function render ( target, occupants ) {
		this.rendered = true;
		if ( this.fragment ) { this.fragment.render( target, occupants ); }
	};

	Section.prototype.shuffle = function shuffle ( newIndices ) {
		if ( this.fragment && this.sectionType === SECTION_EACH ) {
			this.fragment.shuffle( newIndices );
		}
	};

	Section.prototype.unbind = function unbind () {
		MustacheContainer$$1.prototype.unbind.call(this);
		if ( this.fragment ) { this.fragment.unbind(); }
	};

	Section.prototype.unrender = function unrender ( shouldDestroy ) {
		if ( this.rendered && this.fragment ) { this.fragment.unrender( shouldDestroy ); }
		this.rendered = false;
	};

	Section.prototype.update = function update () {
		var this$1 = this;

		if ( !this.dirty ) { return; }

		if ( this.fragment && this.sectionType !== SECTION_IF && this.sectionType !== SECTION_UNLESS ) {
			this.fragment.context = this.model;
		}

		if ( !this.model && this.sectionType !== SECTION_UNLESS ) { return; }

		this.dirty = false;

		var value = !this.model ? undefined : this.model.isRoot ? this.model.value : this.model.get();
		var siblingFalsey = !this.subordinate || !this.sibling.isTruthy();
		var lastType = this.sectionType;

		// watch for switching section types
		if ( this.sectionType === null || this.templateSectionType === null ) { this.sectionType = getType( value, this.template.i ); }
		if ( lastType && lastType !== this.sectionType && this.fragment ) {
			if ( this.rendered ) {
				this.fragment.unbind().unrender( true );
			}

			this.fragment = null;
		}

		var newFragment;

		var fragmentShouldExist = this.sectionType === SECTION_EACH || // each always gets a fragment, which may have no iterations
		                            this.sectionType === SECTION_WITH || // with (partial context) always gets a fragment
		                            ( siblingFalsey && ( this.sectionType === SECTION_UNLESS ? !this.isTruthy() : this.isTruthy() ) ); // if, unless, and if-with depend on siblings and the condition

		if ( fragmentShouldExist ) {
			if ( !this.fragment ) { this.fragment = this.detached; }

			if ( this.fragment ) {
				// check for detached fragment
				if ( this.detached ) {
					attach( this, this.fragment );
					this.detached = false;
					this.rendered = true;
				}

				this.fragment.update();
			} else {
				if ( this.sectionType === SECTION_EACH ) {
					newFragment = new RepeatedFragment({
						owner: this,
						template: this.template.f,
						indexRef: this.template.i
					}).bind( this.model );
				} else {
					// only with and if-with provide context - if and unless do not
					var context = this.sectionType !== SECTION_IF && this.sectionType !== SECTION_UNLESS ? this.model : null;
					newFragment = new Fragment({
						owner: this,
						template: this.template.f
					}).bind( context );
				}
			}
		} else {
			if ( this.fragment && this.rendered ) {
				if ( keep !== true ) {
					this.fragment.unbind().unrender( true );
				} else {
					this.unrender( false );
					this.detached = this.fragment;
					runloop.scheduleTask( function () { return this$1.detach(); } );
				}
			} else if ( this.fragment ) {
				this.fragment.unbind();
			}

			this.fragment = null;
		}

		if ( newFragment ) {
			if ( this.rendered ) {
				attach( this, newFragment );
			}

			this.fragment = newFragment;
		}

		if ( this.nextSibling ) {
			this.nextSibling.dirty = true;
			this.nextSibling.update();
		}
	};

	return Section;
}(MustacheContainer));

function attach ( section, fragment ) {
	var anchor = section.parentFragment.findNextNode( section );

	if ( anchor ) {
		var docFrag = createDocumentFragment();
		fragment.render( docFrag );

		anchor.parentNode.insertBefore( docFrag, anchor );
	} else {
		fragment.render( section.parentFragment.findParentNode() );
	}
}

var Select = (function (Element$$1) {
	function Select ( options ) {
		Element$$1.call( this, options );
		this.options = [];
	}

	if ( Element$$1 ) { Select.__proto__ = Element$$1; }
	Select.prototype = Object.create( Element$$1 && Element$$1.prototype );
	Select.prototype.constructor = Select;

	Select.prototype.foundNode = function foundNode ( node ) {
		if ( this.binding ) {
			var selectedOptions = getSelectedOptions( node );

			if ( selectedOptions.length > 0 ) {
				this.selectedOptions = selectedOptions;
			}
		}
	};

	Select.prototype.render = function render ( target, occupants ) {
		Element$$1.prototype.render.call( this, target, occupants );
		this.sync();

		var node = this.node;

		var i = node.options.length;
		while ( i-- ) {
			node.options[i].defaultSelected = node.options[i].selected;
		}

		this.rendered = true;
	};

	Select.prototype.sync = function sync () {
		var this$1 = this;

		var selectNode = this.node;

		if ( !selectNode ) { return; }

		var options = toArray( selectNode.options );

		if ( this.selectedOptions ) {
			options.forEach( function (o) {
				if ( this$1.selectedOptions.indexOf( o ) >= 0 ) { o.selected = true; }
				else { o.selected = false; }
			});
			this.binding.setFromNode( selectNode );
			delete this.selectedOptions;
			return;
		}

		var selectValue = this.getAttribute( 'value' );
		var isMultiple = this.getAttribute( 'multiple' );
		var array = isMultiple && Array.isArray( selectValue );

		// If the <select> has a specified value, that should override
		// these options
		if ( selectValue !== undefined ) {
			var optionWasSelected;

			options.forEach( function (o) {
				var optionValue = o._ractive ? o._ractive.value : o.value;
				var shouldSelect = isMultiple ?
					array && this$1.valueContains( selectValue, optionValue ) :
					this$1.compare( selectValue, optionValue );

				if ( shouldSelect ) {
					optionWasSelected = true;
				}

				o.selected = shouldSelect;
			});

			if ( !optionWasSelected && !isMultiple ) {
				if ( this.binding ) {
					this.binding.forceUpdate();
				}
			}
		}

		// Otherwise the value should be initialised according to which
		// <option> element is selected, if twoway binding is in effect
		else if ( this.binding ) {
			this.binding.forceUpdate();
		}
	};
	Select.prototype.valueContains = function valueContains ( selectValue, optionValue ) {
		var this$1 = this;

		var i = selectValue.length;
		while ( i-- ) {
			if ( this$1.compare( optionValue, selectValue[i] ) ) { return true; }
		}
	};
	Select.prototype.compare = function compare (optionValue, selectValue) {
		var comparator = this.getAttribute( 'value-comparator' );
		if ( comparator ) {
			if (typeof comparator === 'function') {
				return comparator( selectValue, optionValue );
			}
			if ( selectValue && optionValue ) {
				return selectValue[comparator] == optionValue[comparator];
			}
		}
		return selectValue == optionValue;
	};
	Select.prototype.update = function update () {
		Element$$1.prototype.update.call(this);
		this.sync();
	};

	return Select;
}(Element));

var Textarea = (function (Input$$1) {
	function Textarea( options ) {
		var template = options.template;

		options.deferContent = true;

		Input$$1.call( this, options );

		// check for single interpolator binding
		if ( !this.attributeByName.value ) {
			if ( template.f && isBindable( { template: template } ) ) {
				this.attributes.push( createItem( {
					owner: this,
					template: { t: ATTRIBUTE, f: template.f, n: 'value' },
					parentFragment: this.parentFragment
				} ) );
			} else {
				this.fragment = new Fragment({ owner: this, cssIds: null, template: template.f });
			}
		}
	}

	if ( Input$$1 ) { Textarea.__proto__ = Input$$1; }
	Textarea.prototype = Object.create( Input$$1 && Input$$1.prototype );
	Textarea.prototype.constructor = Textarea;

	Textarea.prototype.bubble = function bubble () {
		var this$1 = this;

		if ( !this.dirty ) {
			this.dirty = true;

			if ( this.rendered && !this.binding && this.fragment ) {
				runloop.scheduleTask( function () {
					this$1.dirty = false;
					this$1.node.value = this$1.fragment.toString();
				});
			}

			this.parentFragment.bubble(); // default behaviour
		}
	};

	return Textarea;
}(Input));

var Text = (function (Item$$1) {
	function Text ( options ) {
		Item$$1.call( this, options );
		this.type = TEXT;
	}

	if ( Item$$1 ) { Text.__proto__ = Item$$1; }
	Text.prototype = Object.create( Item$$1 && Item$$1.prototype );
	Text.prototype.constructor = Text;

	Text.prototype.detach = function detach () {
		return detachNode( this.node );
	};

	Text.prototype.firstNode = function firstNode () {
		return this.node;
	};

	Text.prototype.render = function render ( target, occupants ) {
		if ( inAttributes() ) { return; }
		this.rendered = true;

		progressiveText( this, target, occupants, this.template );
	};

	Text.prototype.toString = function toString ( escape ) {
		return escape ? escapeHtml( this.template ) : this.template;
	};

	Text.prototype.unrender = function unrender ( shouldDestroy ) {
		if ( this.rendered && shouldDestroy ) { this.detach(); }
		this.rendered = false;
	};

	Text.prototype.valueOf = function valueOf () {
		return this.template;
	};

	return Text;
}(Item));

var proto$3 = Text.prototype;
proto$3.bind = proto$3.unbind = proto$3.update = noop$1;

var camelizeHyphenated = function ( hyphenatedStr ) {
	return hyphenatedStr.replace( /-([a-zA-Z])/g, function ( match, $1 ) {
		return $1.toUpperCase();
	});
};

var prefix;

if ( !isClient ) {
	prefix = null;
} else {
	var prefixCache = {};
	var testStyle = createElement( 'div' ).style;

	prefix = function ( prop ) {
		prop = camelizeHyphenated( prop );

		if ( !prefixCache[ prop ] ) {
			if ( testStyle[ prop ] !== undefined ) {
				prefixCache[ prop ] = prop;
			}

			else {
				// test vendors...
				var capped = prop.charAt( 0 ).toUpperCase() + prop.substring( 1 );

				var i = vendors.length;
				while ( i-- ) {
					var vendor = vendors[i];
					if ( testStyle[ vendor + capped ] !== undefined ) {
						prefixCache[ prop ] = vendor + capped;
						break;
					}
				}
			}
		}

		return prefixCache[ prop ];
	};
}

var prefix$1 = prefix;

var visible;
var hidden = 'hidden';

if ( doc ) {
	var prefix$2;

	if ( hidden in doc ) {
		prefix$2 = '';
	} else {
		var i$1 = vendors.length;
		while ( i$1-- ) {
			var vendor = vendors[i$1];
			hidden = vendor + 'Hidden';

			if ( hidden in doc ) {
				prefix$2 = vendor;
				break;
			}
		}
	}

	if ( prefix$2 !== undefined ) {
		doc.addEventListener( prefix$2 + 'visibilitychange', onChange );
		onChange();
	} else {
		// gah, we're in an old browser
		if ( 'onfocusout' in doc ) {
			doc.addEventListener( 'focusout', onHide );
			doc.addEventListener( 'focusin', onShow );
		}

		else {
			win.addEventListener( 'pagehide', onHide );
			win.addEventListener( 'blur', onHide );

			win.addEventListener( 'pageshow', onShow );
			win.addEventListener( 'focus', onShow );
		}

		visible = true; // until proven otherwise. Not ideal but hey
	}
}

function onChange () {
	visible = !doc[ hidden ];
}

function onHide () {
	visible = false;
}

function onShow () {
	visible = true;
}

var unprefixPattern = new RegExp( '^-(?:' + vendors.join( '|' ) + ')-' );

var unprefix = function ( prop ) {
	return prop.replace( unprefixPattern, '' );
};

var vendorPattern = new RegExp( '^(?:' + vendors.join( '|' ) + ')([A-Z])' );

var hyphenate = function ( str ) {
	if ( !str ) { return ''; } // edge case

	if ( vendorPattern.test( str ) ) { str = '-' + str; }

	return str.replace( /[A-Z]/g, function (match) { return '-' + match.toLowerCase(); } );
};

var createTransitions;

if ( !isClient ) {
	createTransitions = null;
} else {
	var testStyle$1 = createElement( 'div' ).style;
	var linear$1 = function (x) { return x; };

	var canUseCssTransitions = {};
	var cannotUseCssTransitions = {};

	// determine some facts about our environment
	var TRANSITION$1;
	var TRANSITIONEND;
	var CSS_TRANSITIONS_ENABLED;
	var TRANSITION_DURATION;
	var TRANSITION_PROPERTY;
	var TRANSITION_TIMING_FUNCTION;

	if ( testStyle$1.transition !== undefined ) {
		TRANSITION$1 = 'transition';
		TRANSITIONEND = 'transitionend';
		CSS_TRANSITIONS_ENABLED = true;
	} else if ( testStyle$1.webkitTransition !== undefined ) {
		TRANSITION$1 = 'webkitTransition';
		TRANSITIONEND = 'webkitTransitionEnd';
		CSS_TRANSITIONS_ENABLED = true;
	} else {
		CSS_TRANSITIONS_ENABLED = false;
	}

	if ( TRANSITION$1 ) {
		TRANSITION_DURATION = TRANSITION$1 + 'Duration';
		TRANSITION_PROPERTY = TRANSITION$1 + 'Property';
		TRANSITION_TIMING_FUNCTION = TRANSITION$1 + 'TimingFunction';
	}

	createTransitions = function ( t, to, options, changedProperties, resolve ) {

		// Wait a beat (otherwise the target styles will be applied immediately)
		// TODO use a fastdom-style mechanism?
		setTimeout( function () {
			var jsTransitionsComplete;
			var cssTransitionsComplete;
			var cssTimeout; // eslint-disable-line prefer-const

			function transitionDone () { clearTimeout( cssTimeout ); }

			function checkComplete () {
				if ( jsTransitionsComplete && cssTransitionsComplete ) {
					t.unregisterCompleteHandler( transitionDone );
					// will changes to events and fire have an unexpected consequence here?
					t.ractive.fire( t.name + ':end', t.node, t.isIntro );
					resolve();
				}
			}

			// this is used to keep track of which elements can use CSS to animate
			// which properties
			var hashPrefix = ( t.node.namespaceURI || '' ) + t.node.tagName;

			// need to reset transition properties
			var style = t.node.style;
			var previous = {
				property: style[ TRANSITION_PROPERTY ],
				timing: style[ TRANSITION_TIMING_FUNCTION ],
				duration: style[ TRANSITION_DURATION ]
			};

			style[ TRANSITION_PROPERTY ] = changedProperties.map( prefix$1 ).map( hyphenate ).join( ',' );
			var easingName = hyphenate( options.easing || 'linear' );
			style[ TRANSITION_TIMING_FUNCTION ] = easingName;
			var cssTiming = style[ TRANSITION_TIMING_FUNCTION ] === easingName;
			style[ TRANSITION_DURATION ] = ( options.duration / 1000 ) + 's';

			function transitionEndHandler ( event ) {
				var index = changedProperties.indexOf( camelizeHyphenated( unprefix( event.propertyName ) ) );

				if ( index !== -1 ) {
					changedProperties.splice( index, 1 );
				}

				if ( changedProperties.length ) {
					// still transitioning...
					return;
				}

				clearTimeout( cssTimeout );
				cssTransitionsDone();
			}

			function cssTransitionsDone () {
				style[ TRANSITION_PROPERTY ] = previous.property;
				style[ TRANSITION_TIMING_FUNCTION ] = previous.duration;
				style[ TRANSITION_DURATION ] = previous.timing;

				t.node.removeEventListener( TRANSITIONEND, transitionEndHandler, false );

				cssTransitionsComplete = true;
				checkComplete();
			}

			t.node.addEventListener( TRANSITIONEND, transitionEndHandler, false );

			// safety net in case transitionend never fires
			cssTimeout = setTimeout( function () {
				changedProperties = [];
				cssTransitionsDone();
			}, options.duration + ( options.delay || 0 ) + 50 );
			t.registerCompleteHandler( transitionDone );

			setTimeout( function () {
				var i = changedProperties.length;
				var hash;
				var originalValue;
				var index;
				var propertiesToTransitionInJs = [];
				var prop;
				var suffix;
				var interpolator;

				while ( i-- ) {
					prop = changedProperties[i];
					hash = hashPrefix + prop;

					if ( cssTiming && CSS_TRANSITIONS_ENABLED && !cannotUseCssTransitions[ hash ] ) {
						style[ prefix$1( prop ) ] = to[ prop ];

						// If we're not sure if CSS transitions are supported for
						// this tag/property combo, find out now
						if ( !canUseCssTransitions[ hash ] ) {
							originalValue = t.getStyle( prop );

							// if this property is transitionable in this browser,
							// the current style will be different from the target style
							canUseCssTransitions[ hash ] = ( t.getStyle( prop ) != to[ prop ] );
							cannotUseCssTransitions[ hash ] = !canUseCssTransitions[ hash ];

							// Reset, if we're going to use timers after all
							if ( cannotUseCssTransitions[ hash ] ) {
								style[ prefix$1( prop ) ] = originalValue;
							}
						}
					}

					if ( !cssTiming || !CSS_TRANSITIONS_ENABLED || cannotUseCssTransitions[ hash ] ) {
						// we need to fall back to timer-based stuff
						if ( originalValue === undefined ) {
							originalValue = t.getStyle( prop );
						}

						// need to remove this from changedProperties, otherwise transitionEndHandler
						// will get confused
						index = changedProperties.indexOf( prop );
						if ( index === -1 ) {
							warnIfDebug( 'Something very strange happened with transitions. Please raise an issue at https://github.com/ractivejs/ractive/issues - thanks!', { node: t.node });
						} else {
							changedProperties.splice( index, 1 );
						}

						// TODO Determine whether this property is animatable at all

						suffix = /[^\d]*$/.exec( to[ prop ] )[0];
						interpolator = interpolate( parseFloat( originalValue ), parseFloat( to[ prop ] ) ) || ( function () { return to[ prop ]; } );

						// ...then kick off a timer-based transition
						propertiesToTransitionInJs.push({
							name: prefix$1( prop ),
							interpolator: interpolator,
							suffix: suffix
						});
					}
				}

				// javascript transitions
				if ( propertiesToTransitionInJs.length ) {
					var easing;

					if ( typeof options.easing === 'string' ) {
						easing = t.ractive.easing[ options.easing ];

						if ( !easing ) {
							warnOnceIfDebug( missingPlugin( options.easing, 'easing' ) );
							easing = linear$1;
						}
					} else if ( typeof options.easing === 'function' ) {
						easing = options.easing;
					} else {
						easing = linear$1;
					}

					new Ticker({
						duration: options.duration,
						easing: easing,
						step: function step ( pos ) {
							var i = propertiesToTransitionInJs.length;
							while ( i-- ) {
								var prop = propertiesToTransitionInJs[i];
								t.node.style[ prop.name ] = prop.interpolator( pos ) + prop.suffix;
							}
						},
						complete: function complete () {
							jsTransitionsComplete = true;
							checkComplete();
						}
					});
				} else {
					jsTransitionsComplete = true;
				}

				if ( !changedProperties.length ) {
					// We need to cancel the transitionEndHandler, and deal with
					// the fact that it will never fire
					t.node.removeEventListener( TRANSITIONEND, transitionEndHandler, false );
					cssTransitionsComplete = true;
					checkComplete();
				}
			}, 0 );
		}, options.delay || 0 );
	};
}

var createTransitions$1 = createTransitions;

function resetStyle ( node, style ) {
	if ( style ) {
		node.setAttribute( 'style', style );
	} else {
		// Next line is necessary, to remove empty style attribute!
		// See http://stackoverflow.com/a/7167553
		node.getAttribute( 'style' );
		node.removeAttribute( 'style' );
	}
}

var getComputedStyle$1 = win && win.getComputedStyle;
var resolved = Promise.resolve();

var names = {
	t0: 'intro-outro',
	t1: 'intro',
	t2: 'outro'
};

var Transition = function Transition ( options ) {
	this.owner = options.owner || options.parentFragment.owner || findElement( options.parentFragment );
	this.element = this.owner.attributeByName ? this.owner : findElement( options.parentFragment );
	this.ractive = this.owner.ractive;
	this.template = options.template;
	this.parentFragment = options.parentFragment;
	this.options = options;
	this.onComplete = [];
};

Transition.prototype.animateStyle = function animateStyle ( style, value, options ) {
		var this$1 = this;

	if ( arguments.length === 4 ) {
		throw new Error( 't.animateStyle() returns a promise - use .then() instead of passing a callback' );
	}

	// Special case - page isn't visible. Don't animate anything, because
	// that way you'll never get CSS transitionend events
	if ( !visible ) {
		this.setStyle( style, value );
		return resolved;
	}

	var to;

	if ( typeof style === 'string' ) {
		to = {};
		to[ style ] = value;
	} else {
		to = style;

		// shuffle arguments
		options = value;
	}

	// As of 0.3.9, transition authors should supply an `option` object with
	// `duration` and `easing` properties (and optional `delay`), plus a
	// callback function that gets called after the animation completes

	// TODO remove this check in a future version
	if ( !options ) {
		warnOnceIfDebug( 'The "%s" transition does not supply an options object to `t.animateStyle()`. This will break in a future version of Ractive. For more info see https://github.com/RactiveJS/Ractive/issues/340', this.name );
		options = this;
	}

	return new Promise( function (fulfil) {
		// Edge case - if duration is zero, set style synchronously and complete
		if ( !options.duration ) {
			this$1.setStyle( to );
			fulfil();
			return;
		}

		// Get a list of the properties we're animating
		var propertyNames = Object.keys( to );
		var changedProperties = [];

		// Store the current styles
		var computedStyle = getComputedStyle$1( this$1.node );

		var i = propertyNames.length;
		while ( i-- ) {
			var prop = propertyNames[i];
			var current = computedStyle[ prefix$1( prop ) ];

			if ( current === '0px' ) { current = 0; }

			// we need to know if we're actually changing anything
			if ( current != to[ prop ] ) { // use != instead of !==, so we can compare strings with numbers
				changedProperties.push( prop );

				// make the computed style explicit, so we can animate where
				// e.g. height='auto'
				this$1.node.style[ prefix$1( prop ) ] = current;
			}
		}

		// If we're not actually changing anything, the transitionend event
		// will never fire! So we complete early
		if ( !changedProperties.length ) {
			fulfil();
			return;
		}

		createTransitions$1( this$1, to, options, changedProperties, fulfil );
	});
};

Transition.prototype.bind = function bind () {
	var options = this.options;
	var type = options.template && options.template.v;
	if ( type ) {
		if ( type === 't0' || type === 't1' ) { this.element.intro = this; }
		if ( type === 't0' || type === 't2' ) { this.element.outro = this; }
		this.eventName = names[ type ];
	}

	var ractive = this.owner.ractive;

	this.name = options.name || options.template.n;

	if ( options.params ) {
		this.params = options.params;
	}

	if ( typeof this.name === 'function' ) {
		this._fn = this.name;
		this.name = this._fn.name;
	} else {
		this._fn = findInViewHierarchy( 'transitions', ractive, this.name );
	}

	if ( !this._fn ) {
		warnOnceIfDebug( missingPlugin( this.name, 'transition' ), { ractive: ractive });
	}

	setupArgsFn( this, options.template );
};

Transition.prototype.getParams = function getParams () {
	if ( this.params ) { return this.params; }

	// get expression args if supplied
	if ( this.fn ) {
		var values = resolveArgs( this, this.template, this.parentFragment ).map( function (model) {
			if ( !model ) { return undefined; }

			return model.get();
		});
		return this.fn.apply( this.ractive, values );
	}
};

Transition.prototype.getStyle = function getStyle ( props ) {
	var computedStyle = getComputedStyle$1( this.node );

	if ( typeof props === 'string' ) {
		var value = computedStyle[ prefix$1( props ) ];
		return value === '0px' ? 0 : value;
	}

	if ( !Array.isArray( props ) ) {
		throw new Error( 'Transition$getStyle must be passed a string, or an array of strings representing CSS properties' );
	}

	var styles = {};

	var i = props.length;
	while ( i-- ) {
		var prop = props[i];
		var value$1 = computedStyle[ prefix$1( prop ) ];

		if ( value$1 === '0px' ) { value$1 = 0; }
		styles[ prop ] = value$1;
	}

	return styles;
};

Transition.prototype.processParams = function processParams ( params, defaults ) {
	if ( typeof params === 'number' ) {
		params = { duration: params };
	}

	else if ( typeof params === 'string' ) {
		if ( params === 'slow' ) {
			params = { duration: 600 };
		} else if ( params === 'fast' ) {
			params = { duration: 200 };
		} else {
			params = { duration: 400 };
		}
	} else if ( !params ) {
		params = {};
	}

	return Object.assign( {}, defaults, params );
};

Transition.prototype.registerCompleteHandler = function registerCompleteHandler ( fn ) {
	addToArray( this.onComplete, fn );
};

Transition.prototype.setStyle = function setStyle ( style, value ) {
		var this$1 = this;

	if ( typeof style === 'string' ) {
		this.node.style[ prefix$1( style ) ] = value;
	}

	else {
		var prop;
		for ( prop in style ) {
			if ( style.hasOwnProperty( prop ) ) {
				this$1.node.style[ prefix$1( prop ) ] = style[ prop ];
			}
		}
	}

	return this;
};

Transition.prototype.shouldFire = function shouldFire ( type ) {
	if ( !this.ractive.transitionsEnabled ) { return false; }

	// check for noIntro and noOutro cases, which only apply when the owner ractive is rendering and unrendering, respectively
	if ( type === 'intro' && this.ractive.rendering && nearestProp( 'noIntro', this.ractive, true ) ) { return false; }
	if ( type === 'outro' && this.ractive.unrendering && nearestProp( 'noOutro', this.ractive, false ) ) { return false; }

	var params = this.getParams(); // this is an array, the params object should be the first member
	// if there's not a parent element, this can't be nested, so roll on
	if ( !this.element.parent ) { return true; }

	// if there is a local param, it takes precedent
	if ( params && params[0] && 'nested' in params[0] ) {
		if ( params[0].nested !== false ) { return true; }
	} else { // use the nearest instance setting
		// find the nearest instance that actually has a nested setting
		if ( nearestProp( 'nestedTransitions', this.ractive ) !== false ) { return true; }
	}

	// check to see if this is actually a nested transition
	var el = this.element.parent;
	while ( el ) {
		if ( el[type] && el[type].starting ) { return false; }
		el = el.parent;
	}

	return true;
};

Transition.prototype.start = function start () {
		var this$1 = this;

	var node = this.node = this.element.node;
	var originalStyle = node.getAttribute( 'style' );

	var completed;
	var args = this.getParams();

	// create t.complete() - we don't want this on the prototype,
	// because we don't want `this` silliness when passing it as
	// an argument
	this.complete = function (noReset) {
		this$1.starting = false;
		if ( completed ) {
			return;
		}

		this$1.onComplete.forEach( function (fn) { return fn(); } );
		if ( !noReset && this$1.isIntro ) {
			resetStyle( node, originalStyle);
		}

		this$1._manager.remove( this$1 );

		completed = true;
	};

	// If the transition function doesn't exist, abort
	if ( !this._fn ) {
		this.complete();
		return;
	}

	var promise = this._fn.apply( this.ractive, [ this ].concat( args ) );
	if ( promise ) { promise.then( this.complete ); }
};

Transition.prototype.toString = function toString () { return ''; };

Transition.prototype.unbind = function unbind () {
	if ( !this.element.attributes.unbinding ) {
		var type = this.options && this.options.template && this.options.template.v;
		if ( type === 't0' || type === 't1' ) { this.element.intro = null; }
		if ( type === 't0' || type === 't2' ) { this.element.outro = null; }
	}
};

Transition.prototype.unregisterCompleteHandler = function unregisterCompleteHandler ( fn ) {
	removeFromArray( this.onComplete, fn );
};

var proto$4 = Transition.prototype;
proto$4.destroyed = proto$4.render = proto$4.unrender = proto$4.update = noop$1;

function nearestProp ( prop, ractive, rendering ) {
	var instance = ractive;
	while ( instance ) {
		if ( instance.hasOwnProperty( prop ) && ( rendering === undefined || rendering ? instance.rendering : instance.unrendering ) ) { return instance[ prop ]; }
		instance = instance.component && instance.component.ractive;
	}

	return ractive[ prop ];
}

var elementCache = {};

var ieBug;
var ieBlacklist;

try {
	createElement( 'table' ).innerHTML = 'foo';
} catch ( err ) {
	ieBug = true;

	ieBlacklist = {
		TABLE:  [ '<table class="x">', '</table>' ],
		THEAD:  [ '<table><thead class="x">', '</thead></table>' ],
		TBODY:  [ '<table><tbody class="x">', '</tbody></table>' ],
		TR:     [ '<table><tr class="x">', '</tr></table>' ],
		SELECT: [ '<select class="x">', '</select>' ]
	};
}

var insertHtml = function ( html$$1, node ) {
	var nodes = [];

	// render 0 and false
	if ( html$$1 == null || html$$1 === '' ) { return nodes; }

	var container;
	var wrapper;
	var selectedOption;

	if ( ieBug && ( wrapper = ieBlacklist[ node.tagName ] ) ) {
		container = element( 'DIV' );
		container.innerHTML = wrapper[0] + html$$1 + wrapper[1];
		container = container.querySelector( '.x' );

		if ( container.tagName === 'SELECT' ) {
			selectedOption = container.options[ container.selectedIndex ];
		}
	}

	else if ( node.namespaceURI === svg$1 ) {
		container = element( 'DIV' );
		container.innerHTML = '<svg class="x">' + html$$1 + '</svg>';
		container = container.querySelector( '.x' );
	}

	else if ( node.tagName === 'TEXTAREA' ) {
		container = createElement( 'div' );

		if ( typeof container.textContent !== 'undefined' ) {
			container.textContent = html$$1;
		} else {
			container.innerHTML = html$$1;
		}
	}

	else {
		container = element( node.tagName );
		container.innerHTML = html$$1;

		if ( container.tagName === 'SELECT' ) {
			selectedOption = container.options[ container.selectedIndex ];
		}
	}

	var child;
	while ( child = container.firstChild ) {
		nodes.push( child );
		container.removeChild( child );
	}

	// This is really annoying. Extracting <option> nodes from the
	// temporary container <select> causes the remaining ones to
	// become selected. So now we have to deselect them. IE8, you
	// amaze me. You really do
	// ...and now Chrome too
	var i;
	if ( node.tagName === 'SELECT' ) {
		i = nodes.length;
		while ( i-- ) {
			if ( nodes[i] !== selectedOption ) {
				nodes[i].selected = false;
			}
		}
	}

	return nodes;
};

function element ( tagName ) {
	return elementCache[ tagName ] || ( elementCache[ tagName ] = createElement( tagName ) );
}

var Triple = (function (Mustache$$1) {
	function Triple ( options ) {
		Mustache$$1.call( this, options );
	}

	if ( Mustache$$1 ) { Triple.__proto__ = Mustache$$1; }
	Triple.prototype = Object.create( Mustache$$1 && Mustache$$1.prototype );
	Triple.prototype.constructor = Triple;

	Triple.prototype.detach = function detach () {
		var docFrag = createDocumentFragment();
		if ( this.nodes ) { this.nodes.forEach( function (node) { return docFrag.appendChild( node ); } ); }
		return docFrag;
	};

	Triple.prototype.find = function find ( selector ) {
		var this$1 = this;

		var len = this.nodes.length;
		var i;

		for ( i = 0; i < len; i += 1 ) {
			var node = this$1.nodes[i];

			if ( node.nodeType !== 1 ) { continue; }

			if ( matches( node, selector ) ) { return node; }

			var queryResult = node.querySelector( selector );
			if ( queryResult ) { return queryResult; }
		}

		return null;
	};

	Triple.prototype.findAll = function findAll ( selector, options ) {
		var this$1 = this;

		var result = options.result;
		var len = this.nodes.length;
		var i;

		for ( i = 0; i < len; i += 1 ) {
			var node = this$1.nodes[i];

			if ( node.nodeType !== 1 ) { continue; }

			if ( matches( node, selector ) ) { result.push( node ); }

			var queryAllResult = node.querySelectorAll( selector );
			if ( queryAllResult ) {
				result.push.apply( result, queryAllResult );
			}
		}
	};

	Triple.prototype.findComponent = function findComponent () {
		return null;
	};

	Triple.prototype.firstNode = function firstNode () {
		return this.rendered && this.nodes[0];
	};

	Triple.prototype.render = function render ( target, occupants ) {
		var this$1 = this;

		var parentNode = this.parentFragment.findParentNode();

		if ( !this.nodes ) {
			var html = this.model ? this.model.get() : '';
			this.nodes = insertHtml( html, this.parentFragment.findParentNode(), target );
		}

		var nodes = this.nodes;
		var anchor = this.parentFragment.findNextNode( this );

		// progressive enhancement
		if ( occupants ) {
			var i = -1;
			var next;

			// start with the first node that should be rendered
			while ( occupants.length && ( next = this.nodes[ i + 1 ] ) ) {
				var n = (void 0);
				// look through the occupants until a matching node is found
				while ( n = occupants.shift() ) {
					var t = n.nodeType;

					if ( t === next.nodeType && ( ( t === 1 && n.outerHTML === next.outerHTML ) || ( ( t === 3 || t === 8 ) && n.nodeValue === next.nodeValue ) ) ) {
						this$1.nodes.splice( ++i, 1, n ); // replace the generated node with the existing one
						break;
					} else {
						target.removeChild( n ); // remove the non-matching existing node
					}
				}
			}

			if ( i >= 0 ) {
				// update the list of remaining nodes to attach, excluding any that were replaced by existing nodes
				nodes = this.nodes.slice( i );
			}

			// update the anchor to be the next occupant
			if ( occupants.length ) { anchor = occupants[0]; }
		}

		// attach any remainging nodes to the parent
		if ( nodes.length ) {
			var frag = createDocumentFragment();
			nodes.forEach( function (n) { return frag.appendChild( n ); } );

			if ( anchor ) {
				anchor.parentNode.insertBefore( frag, anchor );
			} else {
				parentNode.appendChild( frag );
			}
		}

		this.rendered = true;
	};

	Triple.prototype.toString = function toString () {
		var value = this.model && this.model.get();
		value = value != null ? '' + value : '';

		return inAttribute() ? decodeCharacterReferences( value ) : value;
	};

	Triple.prototype.unrender = function unrender () {
		if ( this.nodes ) { this.nodes.forEach( function (node) { return detachNode( node ); } ); }
		this.rendered = false;
		this.nodes = null;
	};

	Triple.prototype.update = function update () {
		if ( this.rendered && this.dirty ) {
			this.dirty = false;

			this.unrender();
			this.render();
		} else {
			// make sure to reset the dirty flag even if not rendered
			this.dirty = false;
		}
	};

	return Triple;
}(Mustache));

// finds the component constructor in the registry or view hierarchy registries
function getComponentConstructor ( ractive, name ) {
	var instance = findInstance( 'components', ractive, name );
	var Component;

	if ( instance ) {
		Component = instance.components[ name ];

		// best test we have for not Ractive.extend
		if ( Component && !Component._Parent ) {
			// function option, execute and store for reset
			var fn = Component.bind( instance );
			fn.isOwner = instance.components.hasOwnProperty( name );
			Component = fn();

			if ( !Component ) {
				warnIfDebug( noRegistryFunctionReturn, name, 'component', 'component', { ractive: ractive });
				return;
			}

			if ( typeof Component === 'string' ) {
				// allow string lookup
				Component = getComponentConstructor( ractive, Component );
			}

			Component._fn = fn;
			instance.components[ name ] = Component;
		}
	}

	return Component;
}

//import Yielder from './Yielder';
var constructors = {};
constructors[ ALIAS ] = Alias;
constructors[ ANCHOR ] = Component;
constructors[ DOCTYPE ] = Doctype;
constructors[ INTERPOLATOR ] = Interpolator;
constructors[ PARTIAL ] = Partial;
constructors[ SECTION ] = Section;
constructors[ TRIPLE ] = Triple;
constructors[ YIELDER ] = Partial;

constructors[ ATTRIBUTE ] = Attribute;
constructors[ BINDING_FLAG ] = BindingFlag;
constructors[ DECORATOR ] = Decorator;
constructors[ EVENT ] = EventDirective;
constructors[ TRANSITION ] = Transition;

var specialElements = {
	doctype: Doctype,
	form: Form,
	input: Input,
	option: Option,
	select: Select,
	textarea: Textarea
};

function createItem ( options ) {
	if ( typeof options.template === 'string' ) {
		return new Text( options );
	}

	if ( options.template.t === ELEMENT ) {
		// could be component or element
		var ComponentConstructor = getComponentConstructor( options.parentFragment.ractive, options.template.e );
		if ( ComponentConstructor ) {
			return new Component( options, ComponentConstructor );
		}

		var tagName = options.template.e.toLowerCase();

		var ElementConstructor = specialElements[ tagName ] || Element;
		return new ElementConstructor( options );
	}

	var Item;

	// component mappings are a special case of attribute
	if ( options.template.t === ATTRIBUTE ) {
		var el = options.owner;
		if ( !el || ( el.type !== ANCHOR && el.type !== COMPONENT && el.type !== ELEMENT ) ) {
			el = findElement( options.parentFragment );
		}
		options.element = el;

		Item = el.type === COMPONENT || el.type === ANCHOR ? Mapping : Attribute;
	} else {
		Item = constructors[ options.template.t ];
	}

	if ( !Item ) { throw new Error( ("Unrecognised item type " + (options.template.t)) ); }

	return new Item( options );
}

// TODO all this code needs to die
function processItems ( items, values, guid, counter ) {
	if ( counter === void 0 ) { counter = 0; }

	return items.map( function (item) {
		if ( item.type === TEXT ) {
			return item.template;
		}

		if ( item.fragment ) {
			if ( item.fragment.iterations ) {
				return item.fragment.iterations.map( function (fragment) {
					return processItems( fragment.items, values, guid, counter );
				}).join( '' );
			} else {
				return processItems( item.fragment.items, values, guid, counter );
			}
		}

		var placeholderId = guid + "-" + (counter++);
		var model = item.model || item.newModel;

		values[ placeholderId ] = model ?
			model.wrapper ?
				model.wrapperValue :
				model.get() :
			undefined;

		return '${' + placeholderId + '}';
	}).join( '' );
}

function unrenderAndDestroy$1 ( item ) {
	item.unrender( true );
}

var Fragment = function Fragment ( options ) {
	this.owner = options.owner; // The item that owns this fragment - an element, section, partial, or attribute

	this.isRoot = !options.owner.parentFragment;
	this.parent = this.isRoot ? null : this.owner.parentFragment;
	this.ractive = options.ractive || ( this.isRoot ? options.owner : this.parent.ractive );

	this.componentParent = ( this.isRoot && this.ractive.component ) ? this.ractive.component.parentFragment : null;
	this.delegate = ( this.parent ? this.parent.delegate : ( this.componentParent && this.componentParent.delegate ) ) ||
		( this.owner.containerFragment && this.owner.containerFragment.delegate );

	this.context = null;
	this.rendered = false;

	// encapsulated styles should be inherited until they get applied by an element
	this.cssIds = 'cssIds' in options ? options.cssIds : ( this.parent ? this.parent.cssIds : null );

	this.dirty = false;
	this.dirtyValue = true; // used for attribute values

	this.template = options.template || [];
	this.createItems();
};

Fragment.prototype.bind = function bind$1 ( context ) {
	this.context = context;
	this.items.forEach( bind );
	this.bound = true;

	// in rare cases, a forced resolution (or similar) will cause the
	// fragment to be dirty before it's even finished binding. In those
	// cases we update immediately
	if ( this.dirty ) { this.update(); }

	return this;
};

Fragment.prototype.bubble = function bubble () {
	this.dirtyValue = true;

	if ( !this.dirty ) {
		this.dirty = true;

		if ( this.isRoot ) { // TODO encapsulate 'is component root, but not overall root' check?
			if ( this.ractive.component ) {
				this.ractive.component.bubble();
			} else if ( this.bound ) {
				runloop.addFragment( this );
			}
		} else {
			this.owner.bubble( this.index );
		}
	}
};

Fragment.prototype.createItems = function createItems () {
		var this$1 = this;

	// this is a hot code path
	var max = this.template.length;
	this.items = [];
	for ( var i = 0; i < max; i++ ) {
		this$1.items[i] = createItem({ parentFragment: this$1, template: this$1.template[i], index: i });
	}
};

Fragment.prototype.destroyed = function destroyed$1 () {
	this.items.forEach( destroyed );
};

Fragment.prototype.detach = function detach () {
	var docFrag = createDocumentFragment();
	var xs = this.items;
	var len = xs.length;
	for ( var i = 0; i < len; i++ ) {
		docFrag.appendChild( xs[i].detach() );
	}
	return docFrag;
};

Fragment.prototype.find = function find ( selector, options ) {
	return findMap( this.items, function (i) { return i.find( selector, options ); } );
};

Fragment.prototype.findAll = function findAll ( selector, options ) {
	if ( this.items ) {
		this.items.forEach( function (i) { return i.findAll && i.findAll( selector, options ); } );
	}
};

Fragment.prototype.findComponent = function findComponent ( name, options ) {
	return findMap( this.items, function (i) { return i.findComponent( name, options ); } );
};

Fragment.prototype.findAllComponents = function findAllComponents ( name, options ) {
	if ( this.items ) {
		this.items.forEach( function (i) { return i.findAllComponents && i.findAllComponents( name, options ); } );
	}
};

Fragment.prototype.findContext = function findContext () {
	var fragment = this;
	while ( fragment && !fragment.context ) { fragment = fragment.parent; }
	if ( !fragment ) { return this.ractive.viewmodel; }
	else { return fragment.context; }
};

Fragment.prototype.findNextNode = function findNextNode ( item ) {
		var this$1 = this;

	// search for the next node going forward
	if ( item ) {
		for ( var i = item.index + 1; i < this.items.length; i++ ) {
			if ( !this$1.items[ i ] ) { continue; }

			var node = this$1.items[ i ].firstNode( true );
			if ( node ) { return node; }
		}
	}

	// if this is the root fragment, and there are no more items,
	// it means we're at the end...
	if ( this.isRoot ) {
		if ( this.ractive.component ) {
			return this.ractive.component.parentFragment.findNextNode( this.ractive.component );
		}

		// TODO possible edge case with other content
		// appended to this.ractive.el?
		return null;
	}

	if ( this.parent ) { return this.owner.findNextNode( this ); } // the argument is in case the parent is a RepeatedFragment
};

Fragment.prototype.findParentNode = function findParentNode () {
	var fragment = this;

	do {
		if ( fragment.owner.type === ELEMENT ) {
			return fragment.owner.node;
		}

		if ( fragment.isRoot && !fragment.ractive.component ) { // TODO encapsulate check
			return fragment.ractive.el;
		}

		if ( fragment.owner.type === YIELDER ) {
			fragment = fragment.owner.containerFragment;
		} else {
			fragment = fragment.componentParent || fragment.parent; // TODO ugh
		}
	} while ( fragment );

	throw new Error( 'Could not find parent node' ); // TODO link to issue tracker
};

Fragment.prototype.findRepeatingFragment = function findRepeatingFragment () {
	var fragment = this;
	// TODO better check than fragment.parent.iterations
	while ( ( fragment.parent || fragment.componentParent ) && !fragment.isIteration ) {
		fragment = fragment.parent || fragment.componentParent;
	}

	return fragment;
};

Fragment.prototype.firstNode = function firstNode ( skipParent ) {
	var node = findMap( this.items, function (i) { return i.firstNode( true ); } );
	if ( node ) { return node; }
	if ( skipParent ) { return null; }

	return this.parent.findNextNode( this.owner );
};

Fragment.prototype.rebind = function rebind ( next ) {
	this.context = next;
};

Fragment.prototype.render = function render$$1 ( target, occupants ) {
	if ( this.rendered ) { throw new Error( 'Fragment is already rendered!' ); }
	this.rendered = true;

	var xs = this.items;
	var len = xs.length;
	for ( var i = 0; i < len; i++ ) {
		xs[i].render( target, occupants );
	}
};

Fragment.prototype.resetTemplate = function resetTemplate ( template ) {
	var wasBound = this.bound;
	var wasRendered = this.rendered;

	// TODO ensure transitions are disabled globally during reset

	if ( wasBound ) {
		if ( wasRendered ) { this.unrender( true ); }
		this.unbind();
	}

	this.template = template;
	this.createItems();

	if ( wasBound ) {
		this.bind( this.context );

		if ( wasRendered ) {
			var parentNode = this.findParentNode();
			var anchor = this.findNextNode();

			if ( anchor ) {
				var docFrag = createDocumentFragment();
				this.render( docFrag );
				parentNode.insertBefore( docFrag, anchor );
			} else {
				this.render( parentNode );
			}
		}
	}
};

Fragment.prototype.shuffled = function shuffled$1 () {
	this.items.forEach( shuffled );
};

Fragment.prototype.toString = function toString$1$$1 ( escape ) {
	return this.items.map( escape ? toEscapedString : toString$1$1 ).join( '' );
};

Fragment.prototype.unbind = function unbind$1 () {
	this.context = null;
	this.items.forEach( unbind );
	this.bound = false;

	return this;
};

Fragment.prototype.unrender = function unrender$1 ( shouldDestroy ) {
	this.items.forEach( shouldDestroy ? unrenderAndDestroy$1 : unrender );
	this.rendered = false;
};

Fragment.prototype.update = function update$1 () {
	if ( this.dirty ) {
		if ( !this.updating ) {
			this.dirty = false;
			this.updating = true;
			this.items.forEach( update );
			this.updating = false;
		} else if ( this.isRoot ) {
			runloop.addFragmentToRoot( this );
		}
	}
};

Fragment.prototype.valueOf = function valueOf () {
	if ( this.items.length === 1 ) {
		return this.items[0].valueOf();
	}

	if ( this.dirtyValue ) {
		var values = {};
		var source = processItems( this.items, values, this.ractive._guid );
		var parsed = parseJSON( source, values );

		this.value = parsed ?
			parsed.value :
			this.toString();

		this.dirtyValue = false;
	}

	return this.value;
};

Fragment.prototype.getContext = getContext;

function getChildQueue ( queue, ractive ) {
	return queue[ ractive._guid ] || ( queue[ ractive._guid ] = [] );
}

function fire ( hookQueue, ractive ) {
	var childQueue = getChildQueue( hookQueue.queue, ractive );

	hookQueue.hook.fire( ractive );

	// queue is "live" because components can end up being
	// added while hooks fire on parents that modify data values.
	while ( childQueue.length ) {
		fire( hookQueue, childQueue.shift() );
	}

	delete hookQueue.queue[ ractive._guid ];
}

var HookQueue = function HookQueue ( event ) {
	this.hook = new Hook( event );
	this.inProcess = {};
	this.queue = {};
};

HookQueue.prototype.begin = function begin ( ractive ) {
	this.inProcess[ ractive._guid ] = true;
};

HookQueue.prototype.end = function end ( ractive ) {
	var parent = ractive.parent;

	// If this is *isn't* a child of a component that's in process,
	// it should call methods or fire at this point
	if ( !parent || !this.inProcess[ parent._guid ] ) {
		fire( this, ractive );
	}
	// elsewise, handoff to parent to fire when ready
	else {
		getChildQueue( this.queue, parent ).push( ractive );
	}

	delete this.inProcess[ ractive._guid ];
};

var configHook = new Hook( 'config' );
var initHook = new HookQueue( 'init' );

function initialise ( ractive, userOptions, options ) {
	Object.keys( ractive.viewmodel.computations ).forEach( function (key) {
		var computation = ractive.viewmodel.computations[ key ];

		if ( ractive.viewmodel.value.hasOwnProperty( key ) ) {
			computation.set( ractive.viewmodel.value[ key ] );
		}
	});

	// set up event subscribers
	subscribe( ractive, userOptions, 'on' );

	// init config from Parent and options
	config$4.init( ractive.constructor, ractive, userOptions );

	configHook.fire( ractive );

	// general config done, set up observers
	subscribe( ractive, userOptions, 'observe' );

	initHook.begin( ractive );

	var fragment = ractive.fragment = createFragment( ractive, options );
	if ( fragment ) { fragment.bind( ractive.viewmodel ); }

	initHook.end( ractive );

	if ( fragment ) {
		// render automatically ( if `el` is specified )
		var el = getElement( ractive.el || ractive.target );
		if ( el ) {
			var promise = ractive.render( el, ractive.append );

			if ( Ractive.DEBUG_PROMISES ) {
				promise.catch( function (err) {
					warnOnceIfDebug( 'Promise debugging is enabled, to help solve errors that happen asynchronously. Some browsers will log unhandled promise rejections, in which case you can safely disable promise debugging:\n  Ractive.DEBUG_PROMISES = false;' );
					warnIfDebug( 'An error happened during rendering', { ractive: ractive });
					logIfDebug( err );

					throw err;
				});
			}
		}
	}
}

function createFragment ( ractive, options ) {
	if ( options === void 0 ) { options = {}; }

	if ( ractive.template ) {
		var cssIds;

		if ( options.cssIds || ractive.cssId ) {
			cssIds = options.cssIds ? options.cssIds.slice() : [];

			if ( ractive.cssId ) {
				cssIds.push( ractive.cssId );
			}
		}

		return new Fragment({
			owner: ractive,
			template: ractive.template,
			cssIds: cssIds
		});
	}
}

function subscribe ( instance, options, type ) {
	var subs = ( instance.constructor[ ("_" + type) ] || [] ).concat( toPairs( options[ type ] || [] ) );
	var single = type === 'on' ? 'once' : (type + "Once");

	subs.forEach( function (ref) {
		var target = ref[0];
		var config$$1 = ref[1];

		if ( typeof config$$1 === 'function' ) {
			instance[type]( target, config$$1 );
		} else if ( typeof config$$1 === 'object' && typeof config$$1.handler === 'function' ) {
			instance[ config$$1.once ? single : type ]( target, config$$1.handler, config$$1 );
		}
	});
}

var renderHook = new Hook( 'render' );
var completeHook = new Hook( 'complete' );

function render$1 ( ractive, target, anchor, occupants ) {
	// set a flag to let any transitions know that this instance is currently rendering
	ractive.rendering = true;

	var promise = runloop.start( ractive, true );
	runloop.scheduleTask( function () { return renderHook.fire( ractive ); }, true );

	if ( ractive.fragment.rendered ) {
		throw new Error( 'You cannot call ractive.render() on an already rendered instance! Call ractive.unrender() first' );
	}

	if ( ractive.destroyed ) {
		ractive.destroyed = false;
		ractive.fragment = createFragment( ractive ).bind( ractive.viewmodel );
	}

	anchor = getElement( anchor ) || ractive.anchor;

	ractive.el = ractive.target = target;
	ractive.anchor = anchor;

	// ensure encapsulated CSS is up-to-date
	if ( ractive.cssId ) { applyCSS(); }

	if ( target ) {
		( target.__ractive_instances__ || ( target.__ractive_instances__ = [] ) ).push( ractive );

		if ( anchor ) {
			var docFrag = doc.createDocumentFragment();
			ractive.fragment.render( docFrag );
			target.insertBefore( docFrag, anchor );
		} else {
			ractive.fragment.render( target, occupants );
		}
	}

	runloop.end();
	ractive.rendering = false;

	return promise.then( function () {
		if (ractive.torndown) { return; }

		completeHook.fire( ractive );
	});
}

function Ractive$render ( target, anchor ) {
	if ( this.torndown ) {
		warnIfDebug( 'ractive.render() was called on a Ractive instance that was already torn down' );
		return Promise.resolve();
	}

	target = getElement( target ) || this.el;

	if ( !this.append && target ) {
		// Teardown any existing instances *before* trying to set up the new one -
		// avoids certain weird bugs
		var others = target.__ractive_instances__;
		if ( others ) { others.forEach( teardown ); }

		// make sure we are the only occupants
		if ( !this.enhance ) {
			target.innerHTML = ''; // TODO is this quicker than removeChild? Initial research inconclusive
		}
	}

	var occupants = this.enhance ? toArray( target.childNodes ) : null;
	var promise = render$1( this, target, anchor, occupants );

	if ( occupants ) {
		while ( occupants.length ) { target.removeChild( occupants.pop() ); }
	}

	return promise;
}

var shouldRerender = [ 'template', 'partials', 'components', 'decorators', 'events' ];

var completeHook$1 = new Hook( 'complete' );
var resetHook = new Hook( 'reset' );
var renderHook$1 = new Hook( 'render' );
var unrenderHook = new Hook( 'unrender' );

function Ractive$reset ( data ) {
	data = data || {};

	if ( typeof data !== 'object' ) {
		throw new Error( 'The reset method takes either no arguments, or an object containing new data' );
	}

	// TEMP need to tidy this up
	data = dataConfigurator.init( this.constructor, this, { data: data });

	var promise = runloop.start( this, true );

	// If the root object is wrapped, try and use the wrapper's reset value
	var wrapper = this.viewmodel.wrapper;
	if ( wrapper && wrapper.reset ) {
		if ( wrapper.reset( data ) === false ) {
			// reset was rejected, we need to replace the object
			this.viewmodel.set( data );
		}
	} else {
		this.viewmodel.set( data );
	}

	// reset config items and track if need to rerender
	var changes = config$4.reset( this );
	var rerender;

	var i = changes.length;
	while ( i-- ) {
		if ( shouldRerender.indexOf( changes[i] ) > -1 ) {
			rerender = true;
			break;
		}
	}

	if ( rerender ) {
		unrenderHook.fire( this );
		this.fragment.resetTemplate( this.template );
		renderHook$1.fire( this );
		completeHook$1.fire( this );
	}

	runloop.end();

	resetHook.fire( this, data );

	return promise;
}

function collect( source, name, attr, dest ) {
	source.forEach( function (item) {
		// queue to rerender if the item is a partial and the current name matches
		if ( item.type === PARTIAL && ( item.refName ===  name || item.name === name ) ) {
			item.inAttribute = attr;
			dest.push( item );
			return; // go no further
		}

		// if it has a fragment, process its items
		if ( item.fragment ) {
			collect( item.fragment.iterations || item.fragment.items, name, attr, dest );
		}

		// or if it is itself a fragment, process its items
		else if ( Array.isArray( item.items ) ) {
			collect( item.items, name, attr, dest );
		}

		// or if it is a component, step in and process its items
		else if ( item.type === COMPONENT && item.instance ) {
			// ...unless the partial is shadowed
			if ( item.instance.partials[ name ] ) { return; }
			collect( item.instance.fragment.items, name, attr, dest );
		}

		// if the item is an element, process its attributes too
		if ( item.type === ELEMENT ) {
			if ( Array.isArray( item.attributes ) ) {
				collect( item.attributes, name, true, dest );
			}
		}
	});
}

function forceResetTemplate ( partial ) {
	partial.forceResetTemplate();
}

var resetPartial = function ( name, partial ) {
	var collection = [];
	collect( this.fragment.items, name, false, collection );

	var promise = runloop.start( this, true );

	this.partials[ name ] = partial;
	collection.forEach( forceResetTemplate );

	runloop.end();

	return promise;
};

// TODO should resetTemplate be asynchronous? i.e. should it be a case
// of outro, update template, intro? I reckon probably not, since that
// could be achieved with unrender-resetTemplate-render. Also, it should
// conceptually be similar to resetPartial, which couldn't be async

function Ractive$resetTemplate ( template ) {
	templateConfigurator.init( null, this, { template: template });

	var transitionsEnabled = this.transitionsEnabled;
	this.transitionsEnabled = false;

	// Is this is a component, we need to set the `shouldDestroy`
	// flag, otherwise it will assume by default that a parent node
	// will be detached, and therefore it doesn't need to bother
	// detaching its own nodes
	var component = this.component;
	if ( component ) { component.shouldDestroy = true; }
	this.unrender();
	if ( component ) { component.shouldDestroy = false; }

	var promise = runloop.start();

	// remove existing fragment and create new one
	this.fragment.unbind().unrender( true );

	this.fragment = new Fragment({
		template: this.template,
		root: this,
		owner: this
	});

	var docFrag = createDocumentFragment();
	this.fragment.bind( this.viewmodel ).render( docFrag );

	// if this is a component, its el may not be valid, so find a
	// target based on the component container
	if ( component && !component.external ) {
		this.fragment.findParentNode().insertBefore( docFrag, component.findNextNode() );
	} else {
		this.el.insertBefore( docFrag, this.anchor );
	}

	runloop.end();

	this.transitionsEnabled = transitionsEnabled;

	return promise;
}

var reverse = makeArrayMethod( 'reverse' ).path;

function Ractive$set ( keypath, value, options ) {
	var ractive = this;

	var opts = typeof keypath === 'object' ? value : options;

	return set( ractive, build( ractive, keypath, value ), opts );
}

var shift = makeArrayMethod( 'shift' ).path;

var sort = makeArrayMethod( 'sort' ).path;

var splice = makeArrayMethod( 'splice' ).path;

function Ractive$subtract ( keypath, d, options ) {
	var num = typeof d === 'number' ? -d : -1;
	var opts = typeof d === 'object' ? d : options;
	return add( this, keypath, num, opts );
}

function Ractive$toggle ( keypath, options ) {
	if ( typeof keypath !== 'string' ) {
		throw new TypeError( badArguments );
	}

	return set( this, gather( this, keypath ).map( function (m) { return [ m, !m.get() ]; } ), options );
}

function Ractive$toCSS() {
	var cssIds = [ this.cssId ].concat( this.findAllComponents().map( function (c) { return c.cssId; } ) );
	var uniqueCssIds = Object.keys(cssIds.reduce( function ( ids, id ) { return (ids[id] = true, ids); }, {}));
	return getCSS( uniqueCssIds );
}

function Ractive$toHTML () {
	return this.fragment.toString( true );
}

function toText () {
	return this.fragment.toString( false );
}

function Ractive$transition ( name, node, params ) {

	if ( node instanceof HTMLElement ) {
		// good to go
	}
	else if ( isObject( node ) ) {
		// omitted, use event node
		params = node;
	}

	// if we allow query selector, then it won't work
	// simple params like "fast"

	// else if ( typeof node === 'string' ) {
	// 	// query selector
	// 	node = this.find( node )
	// }

	node = node || this.event.node;

	if ( !node || !node._ractive ) {
		fatal( ("No node was supplied for transition " + name) );
	}

	params = params || {};
	var owner = node._ractive.proxy;
	var transition = new Transition({ owner: owner, parentFragment: owner.parentFragment, name: name, params: params });
	transition.bind();

	var promise = runloop.start( this, true );
	runloop.registerTransition( transition );
	runloop.end();

	promise.then( function () { return transition.unbind(); } );
	return promise;
}

function unlink( here ) {
	var promise = runloop.start();
	this.viewmodel.joinAll( splitKeypath( here ), { lastLink: false } ).unlink();
	runloop.end();
	return promise;
}

var unrenderHook$1 = new Hook( 'unrender' );

function Ractive$unrender () {
	if ( !this.fragment.rendered ) {
		warnIfDebug( 'ractive.unrender() was called on a Ractive instance that was not rendered' );
		return Promise.resolve();
	}

	this.unrendering = true;
	var promise = runloop.start( this, true );

	// If this is a component, and the component isn't marked for destruction,
	// don't detach nodes from the DOM unnecessarily
	var shouldDestroy = !this.component || ( this.component.anchor || {} ).shouldDestroy || this.component.shouldDestroy || this.shouldDestroy;
	this.fragment.unrender( shouldDestroy );
	if ( shouldDestroy ) { this.destroyed = true; }

	removeFromArray( this.el.__ractive_instances__, this );

	unrenderHook$1.fire( this );

	runloop.end();
	this.unrendering = false;

	return promise;
}

var unshift = makeArrayMethod( 'unshift' ).path;

function Ractive$updateModel ( keypath, cascade ) {
	var promise = runloop.start( this, true );

	if ( !keypath ) {
		this.viewmodel.updateFromBindings( true );
	} else {
		this.viewmodel.joinAll( splitKeypath( keypath ) ).updateFromBindings( cascade !== false );
	}

	runloop.end();

	return promise;
}

var RactiveProto = {
	add: Ractive$add,
	animate: Ractive$animate,
	attachChild: attachChild,
	detach: Ractive$detach,
	detachChild: detachChild,
	find: Ractive$find,
	findAll: Ractive$findAll,
	findAllComponents: Ractive$findAllComponents,
	findComponent: Ractive$findComponent,
	findContainer: Ractive$findContainer,
	findParent: Ractive$findParent,
	fire: Ractive$fire,
	get: Ractive$get,
	getNodeInfo: getNodeInfo,
	insert: Ractive$insert,
	link: link,
	observe: observe,
	observeOnce: observeOnce,
	off: Ractive$off,
	on: Ractive$on,
	once: Ractive$once,
	pop: pop,
	push: push,
	readLink: readLink,
	render: Ractive$render,
	reset: Ractive$reset,
	resetPartial: resetPartial,
	resetTemplate: Ractive$resetTemplate,
	reverse: reverse,
	set: Ractive$set,
	shift: shift,
	sort: sort,
	splice: splice,
	subtract: Ractive$subtract,
	teardown: Ractive$teardown,
	toggle: Ractive$toggle,
	toCSS: Ractive$toCSS,
	toCss: Ractive$toCSS,
	toHTML: Ractive$toHTML,
	toHtml: Ractive$toHTML,
	toText: toText,
	transition: Ractive$transition,
	unlink: unlink,
	unrender: Ractive$unrender,
	unshift: unshift,
	update: Ractive$update,
	updateModel: Ractive$updateModel
};

var callsSuper = /super\s\(|\.call\s*\(\s*this/;

function extend () {
	var arguments$1 = arguments;

	var options = [], len = arguments.length;
	while ( len-- ) { options[ len ] = arguments$1[ len ]; }

	if( !options.length ) {
		return extendOne( this );
	} else {
		return options.reduce( extendOne, this );
	}
}

function extendWith ( Class, options ) {
	if ( options === void 0 ) { options = {}; }

	return extendOne( this, options, Class );
}

function extendOne ( Parent, options, Target ) {
	if ( options === void 0 ) { options = {}; }

	var proto;
	var Child = typeof Target === 'function' && Target;

	if ( options.prototype instanceof Ractive ) {
		throw new Error( "Ractive no longer supports multiple inheritance." );
	}

	if ( Child ) {
		if ( !( Child.prototype instanceof Parent ) ) {
			throw new Error( "Only classes that inherit the appropriate prototype may be used with extend" );
		}
		if ( !callsSuper.test( Child.toString() ) ) {
			throw new Error( "Only classes that call super in their constructor may be used with extend" );
		}

		proto = Child.prototype;
	} else {
		Child = function ( options ) {
			if ( !( this instanceof Child ) ) { return new Child( options ); }

			construct( this, options || {} );
			initialise( this, options || {}, {} );
		};

		proto = Object.create( Parent.prototype );
		proto.constructor = Child;

		Child.prototype = proto;
	}

	// Static properties
	Object.defineProperties( Child, {
		// alias prototype as defaults
		defaults: { value: proto },

		// extendable
		extend: { value: extend, writable: true, configurable: true },
		extendClass: { value: extendWith, writable: true, configurable: true },

		// Parent - for IE8, can't use Object.getPrototypeOf
		_Parent: { value: Parent }
	});

	// extend configuration
	config$4.extend( Parent, proto, options );

	// store event and observer registries on the constructor when extending
	Child._on = ( Parent._on || [] ).concat( toPairs( options.on ) );
	Child._observe = ( Parent._observe || [] ).concat( toPairs( options.observe ) );

	// attribute defs are not inherited, but they need to be stored
	if ( options.attributes ) {
		var attrs;

		// allow an array of optional props or an object with arrays for optional and required props
		if ( Array.isArray( options.attributes ) ) {
			attrs = { optional: options.attributes, required: [] };
		} else {
			attrs = options.attributes;
		}

		// make sure the requisite keys actually store arrays
		if ( !Array.isArray( attrs.required ) ) { attrs.required = []; }
		if ( !Array.isArray( attrs.optional ) ) { attrs.optional = []; }

		Child.attributes = attrs;
	}

	dataConfigurator.extend( Parent, proto, options );

	if ( options.computed ) {
		proto.computed = Object.assign( Object.create( Parent.prototype.computed ), options.computed );
	}

	return Child;
}

function joinKeys () {
	var arguments$1 = arguments;

	var keys = [], len = arguments.length;
	while ( len-- ) { keys[ len ] = arguments$1[ len ]; }

	return keys.map( escapeKey ).join( '.' );
}

function splitKeypath$1 ( keypath ) {
	return splitKeypath( keypath ).map( unescapeKey );
}

function Ractive ( options ) {
	if ( !( this instanceof Ractive ) ) { return new Ractive( options ); }

	construct( this, options || {} );
	initialise( this, options || {}, {} );
}

// check to see if we're being asked to force Ractive as a global for some weird environments
if ( win && !win.Ractive ) {
	var opts = '';
	var script = document.currentScript || document.querySelector( 'script[data-ractive-options]' );

	if ( script ) { opts = script.getAttribute( 'data-ractive-options' ) || ''; }

	if ( ~opts.indexOf( 'ForceGlobal' ) ) { win.Ractive = Ractive; }
}

Object.assign( Ractive.prototype, RactiveProto, defaults );
Ractive.prototype.constructor = Ractive;

// alias prototype as `defaults`
Ractive.defaults = Ractive.prototype;

// share defaults with the parser
shared.defaults = Ractive.defaults;
shared.Ractive = Ractive;

// static properties
Object.defineProperties( Ractive, {

	// debug flag
	DEBUG:          { writable: true, value: true },
	DEBUG_PROMISES: { writable: true, value: true },

	// static methods:
	extend:         { value: extend },
	extendWith:     { value: extendWith },
	escapeKey:      { value: escapeKey },
	getNodeInfo:    { value: staticInfo },
	joinKeys:       { value: joinKeys },
	parse:          { value: parse },
	splitKeypath:   { value: splitKeypath$1 },
	unescapeKey:    { value: unescapeKey },
	getCSS:         { value: getCSS },

	// support
	enhance:        { writable: true, value: false },
	svg:            { value: svg },

	// version
	VERSION:        { value: '0.9.0-edge' },

	// plugins
	adaptors:       { writable: true, value: {} },
	components:     { writable: true, value: {} },
	decorators:     { writable: true, value: {} },
	easing:         { writable: true, value: easing },
	events:         { writable: true, value: {} },
	interpolators:  { writable: true, value: interpolators },
	partials:       { writable: true, value: {} },
	transitions:    { writable: true, value: {} }
});

var DEFAULTS = {
	delay: 0,
	duration: 300,
	easing: 'linear'
};

function fade( t, params ) {
	var targetOpacity;

	params = t.processParams( params, DEFAULTS );

	if ( t.isIntro ) {
		targetOpacity = t.getStyle( 'opacity' );
		t.setStyle( 'opacity', 0 );
	} else {
		targetOpacity = 0;
	}

	t.animateStyle( 'opacity', targetOpacity, params ).then( t.complete );
}

/* http://prismjs.com/download.html?themes=prism&languages=markup+css+clike+javascript+properties&plugins=line-highlight+line-numbers+file-highlight */
var _self = (typeof window !== 'undefined')
	? window   // if in browser
	: (
		(typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)
		? self // if in worker
		: {}   // if in node js
	);

/**
 * Prism: Lightweight, robust, elegant syntax highlighting
 * MIT license http://www.opensource.org/licenses/mit-license.php/
 * @author Lea Verou http://lea.verou.me
 */

var Prism$1 = (function(){

// Private helper vars
var lang = /\blang(?:uage)?-(\w+)\b/i;
var uniqueId = 0;

var _ = _self.Prism = {
	manual: _self.Prism && _self.Prism.manual,
	util: {
		encode: function (tokens) {
			if (tokens instanceof Token) {
				return new Token(tokens.type, _.util.encode(tokens.content), tokens.alias);
			} else if (_.util.type(tokens) === 'Array') {
				return tokens.map(_.util.encode);
			} else {
				return tokens.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
			}
		},

		type: function (o) {
			return Object.prototype.toString.call(o).match(/\[object (\w+)\]/)[1];
		},

		objId: function (obj) {
			if (!obj['__id']) {
				Object.defineProperty(obj, '__id', { value: ++uniqueId });
			}
			return obj['__id'];
		},

		// Deep clone a language definition (e.g. to extend it)
		clone: function (o) {
			var type = _.util.type(o);

			switch (type) {
				case 'Object':
					var clone = {};

					for (var key in o) {
						if (o.hasOwnProperty(key)) {
							clone[key] = _.util.clone(o[key]);
						}
					}

					return clone;

				case 'Array':
					// Check for existence for IE8
					return o.map && o.map(function(v) { return _.util.clone(v); });
			}

			return o;
		}
	},

	languages: {
		extend: function (id, redef) {
			var lang = _.util.clone(_.languages[id]);

			for (var key in redef) {
				lang[key] = redef[key];
			}

			return lang;
		},

		/**
		 * Insert a token before another token in a language literal
		 * As this needs to recreate the object (we cannot actually insert before keys in object literals),
		 * we cannot just provide an object, we need anobject and a key.
		 * @param inside The key (or language id) of the parent
		 * @param before The key to insert before. If not provided, the function appends instead.
		 * @param insert Object with the key/value pairs to insert
		 * @param root The object that contains `inside`. If equal to Prism.languages, it can be omitted.
		 */
		insertBefore: function (inside, before, insert, root) {
			root = root || _.languages;
			var grammar = root[inside];

			if (arguments.length == 2) {
				insert = arguments[1];

				for (var newToken in insert) {
					if (insert.hasOwnProperty(newToken)) {
						grammar[newToken] = insert[newToken];
					}
				}

				return grammar;
			}

			var ret = {};

			for (var token in grammar) {

				if (grammar.hasOwnProperty(token)) {

					if (token == before) {

						for (var newToken in insert) {

							if (insert.hasOwnProperty(newToken)) {
								ret[newToken] = insert[newToken];
							}
						}
					}

					ret[token] = grammar[token];
				}
			}

			// Update references in other language definitions
			_.languages.DFS(_.languages, function(key, value) {
				if (value === root[inside] && key != inside) {
					this[key] = ret;
				}
			});

			return root[inside] = ret;
		},

		// Traverse a language definition with Depth First Search
		DFS: function(o, callback, type, visited) {
			visited = visited || {};
			for (var i in o) {
				if (o.hasOwnProperty(i)) {
					callback.call(o, i, o[i], type || i);

					if (_.util.type(o[i]) === 'Object' && !visited[_.util.objId(o[i])]) {
						visited[_.util.objId(o[i])] = true;
						_.languages.DFS(o[i], callback, null, visited);
					}
					else if (_.util.type(o[i]) === 'Array' && !visited[_.util.objId(o[i])]) {
						visited[_.util.objId(o[i])] = true;
						_.languages.DFS(o[i], callback, i, visited);
					}
				}
			}
		}
	},
	plugins: {},

	highlightAll: function(async, callback) {
		var env = {
			callback: callback,
			selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
		};

		_.hooks.run("before-highlightall", env);

		var elements = env.elements || document.querySelectorAll(env.selector);

		for (var i=0, element; element = elements[i++];) {
			_.highlightElement(element, async === true, env.callback);
		}
	},

	highlightElement: function(element, async, callback) {
		// Find language
		var language, grammar, parent = element;

		while (parent && !lang.test(parent.className)) {
			parent = parent.parentNode;
		}

		if (parent) {
			language = (parent.className.match(lang) || [,''])[1].toLowerCase();
			grammar = _.languages[language];
		}

		// Set language on the element, if not present
		element.className = element.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;

		// Set language on the parent, for styling
		parent = element.parentNode;

		if (/pre/i.test(parent.nodeName)) {
			parent.className = parent.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;
		}

		var code = element.textContent;

		var env = {
			element: element,
			language: language,
			grammar: grammar,
			code: code
		};

		_.hooks.run('before-sanity-check', env);

		if (!env.code || !env.grammar) {
			if (env.code) {
				env.element.textContent = env.code;
			}
			_.hooks.run('complete', env);
			return;
		}

		_.hooks.run('before-highlight', env);

		if (async && _self.Worker) {
			var worker = new Worker(_.filename);

			worker.onmessage = function(evt) {
				env.highlightedCode = evt.data;

				_.hooks.run('before-insert', env);

				env.element.innerHTML = env.highlightedCode;

				callback && callback.call(env.element);
				_.hooks.run('after-highlight', env);
				_.hooks.run('complete', env);
			};

			worker.postMessage(JSON.stringify({
				language: env.language,
				code: env.code,
				immediateClose: true
			}));
		}
		else {
			env.highlightedCode = _.highlight(env.code, env.grammar, env.language);

			_.hooks.run('before-insert', env);

			env.element.innerHTML = env.highlightedCode;

			callback && callback.call(element);

			_.hooks.run('after-highlight', env);
			_.hooks.run('complete', env);
		}
	},

	highlight: function (text, grammar, language) {
		var tokens = _.tokenize(text, grammar);
		return Token.stringify(_.util.encode(tokens), language);
	},

	tokenize: function(text, grammar, language) {
		var Token = _.Token;

		var strarr = [text];

		var rest = grammar.rest;

		if (rest) {
			for (var token in rest) {
				grammar[token] = rest[token];
			}

			delete grammar.rest;
		}

		tokenloop: for (var token in grammar) {
			if(!grammar.hasOwnProperty(token) || !grammar[token]) {
				continue;
			}

			var patterns = grammar[token];
			patterns = (_.util.type(patterns) === "Array") ? patterns : [patterns];

			for (var j = 0; j < patterns.length; ++j) {
				var pattern = patterns[j],
					inside = pattern.inside,
					lookbehind = !!pattern.lookbehind,
					greedy = !!pattern.greedy,
					lookbehindLength = 0,
					alias = pattern.alias;

				if (greedy && !pattern.pattern.global) {
					// Without the global flag, lastIndex won't work
					var flags = pattern.pattern.toString().match(/[imuy]*$/)[0];
					pattern.pattern = RegExp(pattern.pattern.source, flags + "g");
				}

				pattern = pattern.pattern || pattern;

				// Don’t cache length as it changes during the loop
				for (var i=0, pos = 0; i<strarr.length; pos += strarr[i].length, ++i) {

					var str = strarr[i];

					if (strarr.length > text.length) {
						// Something went terribly wrong, ABORT, ABORT!
						break tokenloop;
					}

					if (str instanceof Token) {
						continue;
					}

					pattern.lastIndex = 0;

					var match = pattern.exec(str),
					    delNum = 1;

					// Greedy patterns can override/remove up to two previously matched tokens
					if (!match && greedy && i != strarr.length - 1) {
						pattern.lastIndex = pos;
						match = pattern.exec(text);
						if (!match) {
							break;
						}

						var from = match.index + (lookbehind ? match[1].length : 0),
						    to = match.index + match[0].length,
						    k = i,
						    p = pos;

						for (var len = strarr.length; k < len && p < to; ++k) {
							p += strarr[k].length;
							// Move the index i to the element in strarr that is closest to from
							if (from >= p) {
								++i;
								pos = p;
							}
						}

						/*
						 * If strarr[i] is a Token, then the match starts inside another Token, which is invalid
						 * If strarr[k - 1] is greedy we are in conflict with another greedy pattern
						 */
						if (strarr[i] instanceof Token || strarr[k - 1].greedy) {
							continue;
						}

						// Number of tokens to delete and replace with the new match
						delNum = k - i;
						str = text.slice(pos, p);
						match.index -= pos;
					}

					if (!match) {
						continue;
					}

					if(lookbehind) {
						lookbehindLength = match[1].length;
					}

					var from = match.index + lookbehindLength,
					    match = match[0].slice(lookbehindLength),
					    to = from + match.length,
					    before = str.slice(0, from),
					    after = str.slice(to);

					var args = [i, delNum];

					if (before) {
						args.push(before);
					}

					var wrapped = new Token(token, inside? _.tokenize(match, inside) : match, alias, match, greedy);

					args.push(wrapped);

					if (after) {
						args.push(after);
					}

					Array.prototype.splice.apply(strarr, args);
				}
			}
		}

		return strarr;
	},

	hooks: {
		all: {},

		add: function (name, callback) {
			var hooks = _.hooks.all;

			hooks[name] = hooks[name] || [];

			hooks[name].push(callback);
		},

		run: function (name, env) {
			var callbacks = _.hooks.all[name];

			if (!callbacks || !callbacks.length) {
				return;
			}

			for (var i=0, callback; callback = callbacks[i++];) {
				callback(env);
			}
		}
	}
};

var Token = _.Token = function(type, content, alias, matchedStr, greedy) {
	this.type = type;
	this.content = content;
	this.alias = alias;
	// Copy of the full string this token was created from
	this.length = (matchedStr || "").length|0;
	this.greedy = !!greedy;
};

Token.stringify = function(o, language, parent) {
	if (typeof o == 'string') {
		return o;
	}

	if (_.util.type(o) === 'Array') {
		return o.map(function(element) {
			return Token.stringify(element, language, o);
		}).join('');
	}

	var env = {
		type: o.type,
		content: Token.stringify(o.content, language, parent),
		tag: 'span',
		classes: ['token', o.type],
		attributes: {},
		language: language,
		parent: parent
	};

	if (env.type == 'comment') {
		env.attributes['spellcheck'] = 'true';
	}

	if (o.alias) {
		var aliases = _.util.type(o.alias) === 'Array' ? o.alias : [o.alias];
		Array.prototype.push.apply(env.classes, aliases);
	}

	_.hooks.run('wrap', env);

	var attributes = Object.keys(env.attributes).map(function(name) {
		return name + '="' + (env.attributes[name] || '').replace(/"/g, '&quot;') + '"';
	}).join(' ');

	return '<' + env.tag + ' class="' + env.classes.join(' ') + '"' + (attributes ? ' ' + attributes : '') + '>' + env.content + '</' + env.tag + '>';

};

if (!_self.document) {
	if (!_self.addEventListener) {
		// in Node.js
		return _self.Prism;
	}
 	// In worker
	_self.addEventListener('message', function(evt) {
		var message = JSON.parse(evt.data),
		    lang = message.language,
		    code = message.code,
		    immediateClose = message.immediateClose;

		_self.postMessage(_.highlight(code, _.languages[lang], lang));
		if (immediateClose) {
			_self.close();
		}
	}, false);

	return _self.Prism;
}

//Get current script and highlight
var script = document.currentScript || [].slice.call(document.getElementsByTagName("script")).pop();

if (script) {
	_.filename = script.src;

	if (document.addEventListener && !_.manual && !script.hasAttribute('data-manual')) {
		if(document.readyState !== "loading") {
			if (window.requestAnimationFrame) {
				window.requestAnimationFrame(_.highlightAll);
			} else {
				window.setTimeout(_.highlightAll, 16);
			}
		}
		else {
			document.addEventListener('DOMContentLoaded', _.highlightAll);
		}
	}
}

return _self.Prism;

})();

if (typeof module !== 'undefined' && module.exports) {
	module.exports = Prism$1;
}

// hack for components to work correctly in node.js
if (typeof global !== 'undefined') {
	global.Prism = Prism$1;
}

Prism$1.languages.markup = {
	'comment': /<!--[\w\W]*?-->/,
	'prolog': /<\?[\w\W]+?\?>/,
	'doctype': /<!DOCTYPE[\w\W]+?>/i,
	'cdata': /<!\[CDATA\[[\w\W]*?]]>/i,
	'tag': {
		pattern: /<\/?(?!\d)[^\s>\/=$<]+(?:\s+[^\s>\/=]+(?:=(?:("|')(?:\\\1|\\?(?!\1)[\w\W])*\1|[^\s'">=]+))?)*\s*\/?>/i,
		inside: {
			'tag': {
				pattern: /^<\/?[^\s>\/]+/i,
				inside: {
					'punctuation': /^<\/?/,
					'namespace': /^[^\s>\/:]+:/
				}
			},
			'attr-value': {
				pattern: /=(?:('|")[\w\W]*?(\1)|[^\s>]+)/i,
				inside: {
					'punctuation': /[=>"']/
				}
			},
			'punctuation': /\/?>/,
			'attr-name': {
				pattern: /[^\s>\/]+/,
				inside: {
					'namespace': /^[^\s>\/:]+:/
				}
			}

		}
	},
	'entity': /&#?[\da-z]{1,8};/i
};

// Plugin to make entity title show the real entity, idea by Roman Komarov
Prism$1.hooks.add('wrap', function(env) {

	if (env.type === 'entity') {
		env.attributes['title'] = env.content.replace(/&amp;/, '&');
	}
});

Prism$1.languages.xml = Prism$1.languages.markup;
Prism$1.languages.html = Prism$1.languages.markup;
Prism$1.languages.mathml = Prism$1.languages.markup;
Prism$1.languages.svg = Prism$1.languages.markup;

Prism$1.languages.css = {
	'comment': /\/\*[\w\W]*?\*\//,
	'atrule': {
		pattern: /@[\w-]+?.*?(;|(?=\s*\{))/i,
		inside: {
			'rule': /@[\w-]+/
			// See rest below
		}
	},
	'url': /url\((?:(["'])(\\(?:\r\n|[\w\W])|(?!\1)[^\\\r\n])*\1|.*?)\)/i,
	'selector': /[^\{\}\s][^\{\};]*?(?=\s*\{)/,
	'string': {
		pattern: /("|')(\\(?:\r\n|[\w\W])|(?!\1)[^\\\r\n])*\1/,
		greedy: true
	},
	'property': /(\b|\B)[\w-]+(?=\s*:)/i,
	'important': /\B!important\b/i,
	'function': /[-a-z0-9]+(?=\()/i,
	'punctuation': /[(){};:]/
};

Prism$1.languages.css['atrule'].inside.rest = Prism$1.util.clone(Prism$1.languages.css);

if (Prism$1.languages.markup) {
	Prism$1.languages.insertBefore('markup', 'tag', {
		'style': {
			pattern: /(<style[\w\W]*?>)[\w\W]*?(?=<\/style>)/i,
			lookbehind: true,
			inside: Prism$1.languages.css,
			alias: 'language-css'
		}
	});
	
	Prism$1.languages.insertBefore('inside', 'attr-value', {
		'style-attr': {
			pattern: /\s*style=("|').*?\1/i,
			inside: {
				'attr-name': {
					pattern: /^\s*style/i,
					inside: Prism$1.languages.markup.tag.inside
				},
				'punctuation': /^\s*=\s*['"]|['"]\s*$/,
				'attr-value': {
					pattern: /.+/i,
					inside: Prism$1.languages.css
				}
			},
			alias: 'language-css'
		}
	}, Prism$1.languages.markup.tag);
}
Prism$1.languages.clike = {
	'comment': [
		{
			pattern: /(^|[^\\])\/\*[\w\W]*?\*\//,
			lookbehind: true
		},
		{
			pattern: /(^|[^\\:])\/\/.*/,
			lookbehind: true
		}
	],
	'string': {
		pattern: /(["'])(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
		greedy: true
	},
	'class-name': {
		pattern: /((?:\b(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[a-z0-9_\.\\]+/i,
		lookbehind: true,
		inside: {
			punctuation: /(\.|\\)/
		}
	},
	'keyword': /\b(if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,
	'boolean': /\b(true|false)\b/,
	'function': /[a-z0-9_]+(?=\()/i,
	'number': /\b-?(?:0x[\da-f]+|\d*\.?\d+(?:e[+-]?\d+)?)\b/i,
	'operator': /--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&?|\|\|?|\?|\*|\/|~|\^|%/,
	'punctuation': /[{}[\];(),.:]/
};

Prism$1.languages.javascript = Prism$1.languages.extend('clike', {
	'keyword': /\b(as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|var|void|while|with|yield)\b/,
	'number': /\b-?(0x[\dA-Fa-f]+|0b[01]+|0o[0-7]+|\d*\.?\d+([Ee][+-]?\d+)?|NaN|Infinity)\b/,
	// Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
	'function': /[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*(?=\()/i,
	'operator': /--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&?|\|\|?|\?|\*\*?|\/|~|\^|%|\.{3}/
});

Prism$1.languages.insertBefore('javascript', 'keyword', {
	'regex': {
		pattern: /(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\\\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})]))/,
		lookbehind: true,
		greedy: true
	}
});

Prism$1.languages.insertBefore('javascript', 'string', {
	'template-string': {
		pattern: /`(?:\\\\|\\?[^\\])*?`/,
		greedy: true,
		inside: {
			'interpolation': {
				pattern: /\$\{[^}]+\}/,
				inside: {
					'interpolation-punctuation': {
						pattern: /^\$\{|\}$/,
						alias: 'punctuation'
					},
					rest: Prism$1.languages.javascript
				}
			},
			'string': /[\s\S]+/
		}
	}
});

if (Prism$1.languages.markup) {
	Prism$1.languages.insertBefore('markup', 'tag', {
		'script': {
			pattern: /(<script[\w\W]*?>)[\w\W]*?(?=<\/script>)/i,
			lookbehind: true,
			inside: Prism$1.languages.javascript,
			alias: 'language-javascript'
		}
	});
}

Prism$1.languages.js = Prism$1.languages.javascript;
Prism$1.languages.properties = {
	'comment': /^[ \t]*[#!].*$/m,
	'attr-value': {
		pattern: /(^[ \t]*(?:\\(?:\r\n|[\s\S])|[^\\\s:=])+?(?: *[=:] *| ))(?:\\(?:\r\n|[\s\S])|.)+/m,
		lookbehind: true
	},
	'attr-name': /^[ \t]*(?:\\(?:\r\n|[\s\S])|[^\\\s:=])+?(?= *[ =:]| )/m,
	'punctuation': /[=:]/
};
(function(){

if (typeof self === 'undefined' || !self.Prism || !self.document || !document.querySelector) {
	return;
}

function $$(expr, con) {
	return Array.prototype.slice.call((con || document).querySelectorAll(expr));
}

function hasClass(element, className) {
  className = " " + className + " ";
  return (" " + element.className + " ").replace(/[\n\t]/g, " ").indexOf(className) > -1
}

// Some browsers round the line-height, others don't.
// We need to test for it to position the elements properly.
var isLineHeightRounded = (function() {
	var res;
	return function() {
		if(typeof res === 'undefined') {
			var d = document.createElement('div');
			d.style.fontSize = '13px';
			d.style.lineHeight = '1.5';
			d.style.padding = 0;
			d.style.border = 0;
			d.innerHTML = '&nbsp;<br />&nbsp;';
			document.body.appendChild(d);
			// Browsers that round the line-height should have offsetHeight === 38
			// The others should have 39.
			res = d.offsetHeight === 38;
			document.body.removeChild(d);
		}
		return res;
	}
}());

function highlightLines(pre, lines, classes) {
	var ranges = lines.replace(/\s+/g, '').split(','),
	    offset = +pre.getAttribute('data-line-offset') || 0;

	var parseMethod = isLineHeightRounded() ? parseInt : parseFloat;
	var lineHeight = parseMethod(getComputedStyle(pre).lineHeight);

	for (var i=0, range; range = ranges[i++];) {
		range = range.split('-');

		var start = +range[0],
		    end = +range[1] || start;

		var line = document.createElement('div');

		line.textContent = Array(end - start + 2).join(' \n');
		line.setAttribute('aria-hidden', 'true');
		line.className = (classes || '') + ' line-highlight';

		//if the line-numbers plugin is enabled, then there is no reason for this plugin to display the line numbers
		if(!hasClass(pre, 'line-numbers')) {
			line.setAttribute('data-start', start);

			if(end > start) {
				line.setAttribute('data-end', end);
			}
		}

		line.style.top = (start - offset - 1) * lineHeight + 'px';

		//allow this to play nicely with the line-numbers plugin
		if(hasClass(pre, 'line-numbers')) {
			//need to attack to pre as when line-numbers is enabled, the code tag is relatively which screws up the positioning
			pre.appendChild(line);
		} else {
			(pre.querySelector('code') || pre).appendChild(line);
		}
	}
}

function applyHash() {
	var hash = location.hash.slice(1);

	// Remove pre-existing temporary lines
	$$('.temporary.line-highlight').forEach(function (line) {
		line.parentNode.removeChild(line);
	});

	var range = (hash.match(/\.([\d,-]+)$/) || [,''])[1];

	if (!range || document.getElementById(hash)) {
		return;
	}

	var id = hash.slice(0, hash.lastIndexOf('.')),
	    pre = document.getElementById(id);

	if (!pre) {
		return;
	}

	if (!pre.hasAttribute('data-line')) {
		pre.setAttribute('data-line', '');
	}

	highlightLines(pre, range, 'temporary ');

	document.querySelector('.temporary.line-highlight').scrollIntoView();
}

var fakeTimer = 0; // Hack to limit the number of times applyHash() runs

Prism$1.hooks.add('before-sanity-check', function(env) {
	var pre = env.element.parentNode;
	var lines = pre && pre.getAttribute('data-line');

	if (!pre || !lines || !/pre/i.test(pre.nodeName)) {
		return;
	}

	/*
	 * Cleanup for other plugins (e.g. autoloader).
	 *
	 * Sometimes <code> blocks are highlighted multiple times. It is necessary
	 * to cleanup any left-over tags, because the whitespace inside of the <div>
	 * tags change the content of the <code> tag.
	 */
	var num = 0;
	$$('.line-highlight', pre).forEach(function (line) {
		num += line.textContent.length;
		line.parentNode.removeChild(line);
	});

	// Remove extra whitespace
	if (num && /^( \n)+$/.test(env.code.slice(-num))) {
		env.code = env.code.slice(0, -num);
	}
});

Prism$1.hooks.add('complete', function(env) {
	var pre = env.element.parentNode;
	var lines = pre && pre.getAttribute('data-line');

	if (!pre || !lines || !/pre/i.test(pre.nodeName)) {
		return;
	}

	clearTimeout(fakeTimer);

	highlightLines(pre, lines);

	fakeTimer = setTimeout(applyHash, 1);
});

if(window.addEventListener) {
	window.addEventListener('hashchange', applyHash);
}

})();

(function() {

if (typeof self === 'undefined' || !self.Prism || !self.document) {
	return;
}

Prism$1.hooks.add('complete', function (env) {
	if (!env.code) {
		return;
	}

	// works only for <code> wrapped inside <pre> (not inline)
	var pre = env.element.parentNode;
	var clsReg = /\s*\bline-numbers\b\s*/;
	if (
		!pre || !/pre/i.test(pre.nodeName) ||
			// Abort only if nor the <pre> nor the <code> have the class
		(!clsReg.test(pre.className) && !clsReg.test(env.element.className))
	) {
		return;
	}

	if (env.element.querySelector(".line-numbers-rows")) {
		// Abort if line numbers already exists
		return;
	}

	if (clsReg.test(env.element.className)) {
		// Remove the class "line-numbers" from the <code>
		env.element.className = env.element.className.replace(clsReg, '');
	}
	if (!clsReg.test(pre.className)) {
		// Add the class "line-numbers" to the <pre>
		pre.className += ' line-numbers';
	}

	var match = env.code.match(/\n(?!$)/g);
	var linesNum = match ? match.length + 1 : 1;
	var lineNumbersWrapper;

	var lines = new Array(linesNum + 1);
	lines = lines.join('<span></span>');

	lineNumbersWrapper = document.createElement('span');
	lineNumbersWrapper.setAttribute('aria-hidden', 'true');
	lineNumbersWrapper.className = 'line-numbers-rows';
	lineNumbersWrapper.innerHTML = lines;

	if (pre.hasAttribute('data-start')) {
		pre.style.counterReset = 'linenumber ' + (parseInt(pre.getAttribute('data-start'), 10) - 1);
	}

	env.element.appendChild(lineNumbersWrapper);

});

}());
(function () {
	if (typeof self === 'undefined' || !self.Prism || !self.document || !document.querySelector) {
		return;
	}

	self.Prism.fileHighlight = function() {

		var Extensions = {
			'js': 'javascript',
			'py': 'python',
			'rb': 'ruby',
			'ps1': 'powershell',
			'psm1': 'powershell',
			'sh': 'bash',
			'bat': 'batch',
			'h': 'c',
			'tex': 'latex'
		};

		if(Array.prototype.forEach) { // Check to prevent error in IE8
			Array.prototype.slice.call(document.querySelectorAll('pre[data-src]')).forEach(function (pre) {
				var src = pre.getAttribute('data-src');

				var language, parent = pre;
				var lang = /\blang(?:uage)?-(?!\*)(\w+)\b/i;
				while (parent && !lang.test(parent.className)) {
					parent = parent.parentNode;
				}

				if (parent) {
					language = (pre.className.match(lang) || [, ''])[1];
				}

				if (!language) {
					var extension = (src.match(/\.(\w+)$/) || [, ''])[1];
					language = Extensions[extension] || extension;
				}

				var code = document.createElement('code');
				code.className = 'language-' + language;

				pre.textContent = '';

				code.textContent = 'Loading…';

				pre.appendChild(code);

				var xhr = new XMLHttpRequest();

				xhr.open('GET', src, true);

				xhr.onreadystatechange = function () {
					if (xhr.readyState == 4) {

						if (xhr.status < 400 && xhr.responseText) {
							code.textContent = xhr.responseText;

							Prism$1.highlightElement(code);
						}
						else if (xhr.status >= 400) {
							code.textContent = '✖ Error ' + xhr.status + ' while fetching file: ' + xhr.statusText;
						}
						else {
							code.textContent = '✖ Error: File does not exist or is empty';
						}
					}
				};

				xhr.send(null);
			});
		}

	};

	//document.addEventListener('DOMContentLoaded', self.Prism.fileHighlight);

})();

var template = "<div class=\"container\" fade-in={duration:1500}>\n    <div class=\"row\">\n  \n        <div class=\"col-md-12\">\n            \n            <h1 style=\"padding-top:30px; padding-bottom:0px;\"><span id=\"home-welcome\" class=\"animated bounceInLeft\">Welcome to Journey</span> <span id=\"home-demo\" class=\"animated highlightLetter invisible\">Demos</span></h1>\n\n            <div class=\"animated bounceInUp\" id=\"home-content\">\n                <p>Journey is a SPA Router that can be learned in a couple of minutes. Documentation is available\n                    <a href=\"https://github.com/kudujs/kudu\" class=\"link\" target=\"_blank\">here</a>.</p>\n                <p>Kudu combines the best of breed libraries (\n                    <a href='http://ractivejs.org' target='_blank' class='link'>Ractive</a>,\n                    <a href='http://requirejs.org/' target='_blank' class='link'>RequireJS</a>) \n                    to create a productive environment for writing single-page applications.</p>\n                <button type=\"button\" class=\"search btn btn-success\"  on-click=\"@.start()\"><i class=\"icon-search\"></i> Let's start</button>\n            </div>\n        </div>\n\n    </div>\n</div>";

var home = {

	enter: function ( route, prevRoute, options ) {
		console.log("HOME enter:", arguments);
		route.path = "js/app/views/home/home";
		route.view = new Ractive( {
			el: options.target,
			template: template,

			start: function () {
				journey.goto( "#basic?b=2#a=b", { x: "1234" } );
			}
		} );

	},

	leave: function ( route, nextRoute ) {
		route.view.teardown();
	}

};

var template$1 = "<div class=\"container\" fade-in={duration:200}>\r\n\r\n    <div class=\"row\">\r\n\r\n        <div class=\"col-md-12\">\r\n            <h1 style=\"padding-top:30px; padding-bottom:0px;\">Basic <span class=\"highlightLetter\">View</span></h1>\r\n        </div>\r\n    </div>\r\n\r\n\r\n    <div class=\"row\">\r\n        <div class=\"col-md-12\">\r\n            <p>Views in Kudu are implemented as AMD modules that must return a <span class=\"fun\">Controller</span></p>\r\n\r\n            <p><span class=\"fun\">Controllers</span> are plain Javascript objects but must implement an <span class=\"met\">onInit</span> method that returns a\r\n                <a href='http://ractivejs.org' target='_blank' class='link'>Ractive</a>\r\n                instance. <span class=\"ln\">Ractive</span> is a library that binds HTML templates to data objects. To get started\r\n                with Ractive see  <a href='http://docs.ractivejs.org/latest/get-started' target='_blank' class='link'>here</a>. A tutorial on Ractive is\r\n                available <a href='http://learn.ractivejs.org' target='_blank' class='link'>here</a>.\r\n            </p>\r\n            <p>Controllers have an associated HTML template, which are <a href=\"https://mustache.github.io/\" target=\"_blank\" class=\"link\">mustache</a> based.\r\n                Mustache is a logicless templating engine, and Ractive has great support for binding mustaches to data variables.\r\n            </p>\r\n            <p>\r\n                Let's look at our first Kudu Controller below, <em class=\"ln\">basic.js</em>:\r\n            </p>\r\n\r\n            <pre><code  class=\"line-numbers language-js\">define(function (require) { // A normal AMD define declaration\r\n\r\n\tvar template = require(\"rvc!./basic\"); // Import the Controller's HTML template, basic.html\r\n\r\n\t// Our controller object\r\n\tvar basicCtrl = {};\r\n\r\n\t// We add the required onInit method that returns a Ractive view instance\r\n\tbasicCtrl.onInit = function (options) {\r\n\r\n\t\treturn new template(); // We create and return a new Ractive view from the template\r\n\t};\r\n\r\n\treturn basicCtrl;\r\n}); </code></pre>\r\n\r\n            <p>In <span class=\"ln\">line 3</span>, we use the <span class=\"var\">rvc</span> plugin to load and compile the <em>view.html</em> template. The result of this plugin\r\n                is a fully compiled Ractive object that can be instantiated using <em>new</em>.\r\n            </p>\r\n            <p>In <span class=\"ln\">line 9</span> we implement the <strong>required</strong> <em>onInit</em> method that must return a Ractive view instance.\r\n            </p>\r\n\r\n            <p>In <span class=\"ln\">line 11</span>, we create a and return a new Ractive view instance from the compiled template from\r\n                <span class=\"ln\">line 3</span>.\r\n            </p>\r\n\r\n            <p>That's it, a basic Kudu view! Test it below!\r\n            </p>\r\n\r\n            <button type=\"button\" class=\"btn btn-success\"  on-click=\"loadView()\">Test view</button> (this will reload the current view!)\r\n\r\n            <p>Use the menus above to explore other examples and features provided by Kudu.\r\n\r\n            </p>\r\n\r\n        </div>\r\n\r\n    </div>\r\n</div>\r\n";

var basic = {
	
		enter: function(route, prevRoute, options) {
			route.path = "js/app/views/basics/controller/basic";
			route.view = new Ractive({
				el: options.target,
				template: template$1,
				loadView: function () {
					var random = new Date().getMilliseconds();
					journey.goto("/basic?random=" + random);
				}
			});
		},
		
		leave: function ( route, nextRoute, options ) {
			return route.view.teardown();
		}
	};

var template$2 = "<div class=\"container\" fade-in={duration:1500}>\r\n    <div class=\"row\">\r\n\r\n        <div class=\"col-md-12\">\r\n            <h1 style=\"padding-top:30px; padding-bottom:0px;\">Method <span class=\"highlightLetter\">Calls</span></h1>\r\n        </div>\r\n    </div>\r\n\r\n\r\n    <div class=\"row\">\r\n        <div class=\"col-md-12\">\r\n            <p>Ractive provides <a href=\"http://docs.ractivejs.org/latest/method-calls\" class=\"link\">Method Calls</a> as a way to invoke\r\n                Javascript methods from HTML templates.\r\n            </p>\r\n\r\n            <p>Let's look at the most basic example.</p>\r\n\r\n            <em class=\"ln\">methods.html</em>:\r\n            <pre><code  class=\"line-numbers language-markup\">&lt;a on-click=\"@this.test()\" href='#'>test&lt;a>\r\n</code></pre>\r\n            <p>In <span class=\"ln\">line 1</span> above, we register an <span class=\"var\">on-click</span> listener that calls the\r\n                <span class=\"met\">@this.test()</span> method below.\r\n            </p>\r\n\r\n            <em class=\"ln\">methods.js</em>:\r\n            <pre><code  class=\"line-numbers language-js\">...\r\nthat.onInit = function (options) {\r\n    var view = new template({});        \r\n\r\n    // Add a test() method to the Ractive view\r\n    view.test = function () {\r\n        console.log(\"test() invoked!\");\r\n        return false; //returning false cancels the original event, the link that was clicked\r\n    };\r\n    return view;\r\n};\r\n</code></pre>\r\n\r\n            <p>Let's test the above code. Click <a href='#' on-click='@this.test()' class=\"link\">here</a>, and view the output in your\r\n                browser console.</p>\r\n\r\n            <p>Next, let's look at an example showing <span class=\"var\">this</span> in action.</p>\r\n\r\n            <p>Inside the methods, Ractive binds <span class=\"var\">this</span> to the ractive instance, <span class=\"var\">this.event</span>\r\n                references the <a href=\"http://docs.ractivejs.org/latest/proxy-events\" target=\"_blank\" class=\"link\">ractive event</a>,\r\n                and <span class=\"var\">this.event.original</span> references the DOM event.\r\n            </p>\r\n\r\n            <p>Let's look at an example.</p>\r\n\r\n            <em class=\"ln\">methods.html</em>:\r\n            <pre><code  class=\"line-numbers language-markup\">&lt;a on-click=\"@.testThis()\" href='#'>test&lt;a>\r\n</code></pre>\r\n\r\n            <em class=\"ln\">methods.js</em>:\r\n            <pre><code  class=\"line-numbers language-js\">...\r\nthat.onInit = function (options) {\r\n    var view = new template({});        \r\n\r\n    // Add a testThis() method to the Ractive view\r\n    view.testThis = function () {\r\n        // 'this' refers to the Ractive instance\r\n        console.log(\"[ractive instance]:\", this);\r\n\r\n        // 'this.event' refers to the Ractive event\r\n        console.log(\"[ractive event]:\", this.event);\r\n\r\n        // 'this.event.original' refers to the DOM event, the link that was clicked\r\n        console.log(\"[DOM 'click' event]:\", this.event.original);\r\n        return false; //returning false cancels the original event, the link that was clicked\r\n    };\r\n    return view;\r\n};\r\n</code></pre>\r\n\r\n            <p>Let's test the above code. Click <a href='#' on-click='@.testThis()' class=\"link\">here</a>, and view the output in your\r\n                browser console.\r\n            </p>\r\n\r\n            <p>Next, let's look at an example showing how to pass <span class=\"var\">arguments</span> from the HTML template to the <span class=\"met\">method</span>.\r\n            </p>\r\n\r\n            <p>You can pass as many arguments to the methods as you like. Strings need to be quoted.\r\n            </p>\r\n\r\n            <p>Let's look at an example, where we loop over items in an array and render a <span class=\"ln\">link</span> to print information\r\n                about the item.</p>\r\n\r\n            <em class=\"ln\">methods.html</em>:\r\n            <pre><code  class=\"line-numbers language-markup\">\r\n&lt;ul>\r\n    \\{{#each items :i}}\r\n        &lt;li>\r\n            Click &lt;a href='#' on-click=\"@.testArgs(this, @event, 'hello', true, {key: 'value'})\" class=\"link\">\\{{name}}&lt;/a>, and view the output in your \r\nbrowser console.\r\n        &lt;/li>\r\n    \\{{/each}}\r\n&lt;/ul>\r\n</code></pre>\r\n\r\n            <em class=\"ln\">methods.js</em>:\r\n            <pre><code  class=\"line-numbers language-js\">...\r\nthat.onInit = function (options) {\r\n\t\t\tvar view = createView();\r\n\t\t\treturn view;\r\n\t\t};\r\n\r\n    function createView() {\r\n\r\n        var view = new template({\r\n            data: {\r\n                // an array of items\r\n                items: [ {name: 'Item 1'}, {name: 'Item 2'}, {name: 'Item 3'} ]\r\n            },\r\n\r\n            // Our testArgs method that will be called for each item in the array\r\n            // It accepts a reference to the 'this' object, the ractive event that is passed in explicitly, a string, a boolean and an object\r\n            testArgs: function (currentInstance, event, str, bool, obj) {\r\n                console.log(\"arg this\", currentInstance);\r\n                console.log(\"arg event\", event);\r\n                console.log(\"arg str\", str);\r\n                console.log(\"arg bool\", bool);\r\n                console.log(\"arg object\", obj);\r\n                return false;\r\n            }\r\n        });\r\n        return view;\r\n    }\r\n</code></pre>\r\n\r\n            <p>Let's test the above code. \r\n            </p>\r\n            <ul>\r\n\r\n                {{#each items :i}}\r\n                <li>\r\n                Click <a href='#' on-click=\"@.testArgs(this, @event, 'hello', true, {key: 'value'})\" class=\"link\">{{name}}</a>, and view the output in your\r\n                browser console.\r\n                </li>\r\n                {{/each}}\r\n\r\n            </ul>\r\n\r\n\r\n        </div>\r\n    </div>\r\n\r\n</div>\r\n";

var methods = {	
	enter: function ( route, prevRoute, options ) {
		route.path = "js/app/views/basics/methods/methods";
		route.view = createView( options.target );
	},

	leave: function ( route, nextRoute, options ) {
		route.view.teardown();
	}
};

function createView( target ) {

	var view = new Ractive( {

		el: target,
		template: template$2,

		data: {
			items: [
				{ name: 'Item 1' },
				{ name: 'Item 2' },
				{ name: 'Item 3' } ]
		},

		test: function ( ) {
			console.log( "test() invoked!" );
			return false; //returning false cancels the original event, the link that was clicked
		},

		testThis: function ( ) {
			// 'this' refers to the Ractive instance
			console.log( "testThis invoked!" );
			console.log( "	[ractive instance]:", this );
			// 'this.event' refers to the Ractive event, see: http://docs.ractivejs.org/latest/proxy-events
			console.log( "	[ractive event]:", this.event );
			// 'this.event.original' refers to the DOM event, the link that was clicked
			console.log( "	[DOM 'click' event]:", this.event.original );
			return false;
		},
		testArgs: function ( currentInstance, event, str, bool, obj ) {
			console.log( "arg currentInstance", currentInstance );
			console.log( "arg event", event );
			console.log( "arg str", str );
			console.log( "arg bool", bool );
			console.log( "arg object", obj );
			return false;
		}
	} );
	return view;
}

var template$3 = "<div class=\"container\" fade-in={duration:1500}>\r\n    <div class=\"row\">\r\n\r\n        <div class=\"col-md-12\">\r\n            <h1 style=\"padding-top:30px; padding-bottom:0px;\">Binding <span class=\"highlightLetter\"></span></h1>\r\n        </div>\r\n\r\n    </div>\r\n\r\n    <div class=\"row\">\r\n        <div class=\"col-md-12\">\r\n\r\n            <span class=\"ln\">binding.html</span>\r\n            <pre><code  class=\"line-numbers language-js\">&lt;input value=\"\\{{name}}\">\r\n&lt;div>Hello \\{{name}}&lt;/div>\r\n&lt;button on-click=\"resetData()\">Set to original value&lt;/button> </code></pre>\r\n\r\n            <p><span class=\"ln\">Line 1</span> adds a two-way binding to the input value to the <span class=\"var\">name</span> variable through the <span class=\"var\">\\{{name}}</span>\r\n                mustache.</p>\r\n            <p><span class=\"ln\">Line 2</span> adds a one-way binding to the &lt;div&gt; element through the <span class=\"var\">\\{{name}}</span>\r\n                mustache.</p>\r\n            <p><span class=\"ln\">Line 3</span> adds a an <span class=\"met\">on-click</span> listener to the button which calls the method <span class=\"met\">resetData()</span>.\r\n                The resetData() method uses the Ractive.set() method to reset the <span class=\"var\">name</span> variable, see <span class=\"ln\">line 8</span> below.\r\n            </p>\r\n\r\n\r\n            <span class=\"ln\">binding.js</span>\r\n            <pre><code  class=\"line-numbers language-js\">\tfunction createView() {\r\n\r\n\t\t\tvar view = new template({\r\n\t\t\t\t\r\n\t\t\t\tdata: {\"name\": \"World!\"},\r\n\t\t\t\t\r\n\t\t\t\tresetData: function() {\r\n\t\t\t\t\tthis.set(\"name\", \"World!\");\r\n\t\t\t\t}\r\n\t\t\t});\r\n\t\t\treturn view;\r\n\t\t}\r\n}); </code></pre>\r\n\r\n        </div>\r\n    </div>\r\n\r\n    <div class=\"row\">\r\n        <div class=\"col-md-12\">\r\n            <form class=\"form-inline\">\r\n\r\n\r\n                <div class=\"form-group col-md-12\" style=\"margin-top: 20px\">\r\n                    <label>Enter name</label>\r\n                    <input style=\"color:#000\" value=\"{{name}}\">\r\n                    <div>Hello <strong>{{name}}</strong></div>\r\n                </div>\r\n                <div class=\"form-group col-md-3\" style=\"margin-top: 20px\">\r\n                    <button type=\"button\" class=\"btn btn-success\"  on-click=\"@.resetData()\">Set programmatically to original value</button>\r\n                </div>\r\n            </form>\r\n        </div>\r\n    </div>\r\n</div>\r\n";

var binding = {

	enter: function ( route, prevRoute, options ) {
		route.path = "js/app/views/basics/binding/binding";
		route.view = createView$1( options.target );
	},
	
	leave: function ( route, nextRoute, options ) {
		route.view.teardown( );
	}
};

function createView$1( target ){

	var view = new Ractive( {
		el: target,
		template: template$3,

		data: { "name": "World!" },
		resetData: function ( ) {
			this.set( "name", "World!" );
		}
	} );
	return view;
}

var template$4 = "<div class=\"container\">\r\n    <div class=\"row\">\r\n\r\n        <div class=\"col-md-12\">\r\n            <h1 style=\"padding-top:30px; padding-bottom:0px;\">Navigation <span class=\"highlightLetter\">Demos</span></h1>\r\n        </div>\r\n    </div>\r\n\r\n    <div class=\"row\">\r\n        <div class=\"col-md-12\">\r\n\r\n            <h2>Navigate Programatically</h2>\r\n            <div class=\"set1-color1 searchBox searchBoxCenter\" id=\"trackClaimBox\"> \r\n\r\n                <div class=\"content\">     \r\n                    <pre><code  class=\"line-numbers language-js\">var kudu = require(\"kudu\");\r\nvar myCtrl = require(\"myctrl\");\r\n\r\nkudu.go({\r\n    ctrl: myCtrl,\r\n    routeParams: {'id': 1, 'name': 'Bob'},\r\n    args: {'myargs': ['one', 'two', 'three']}\r\n});\r\n                        </code></pre>\r\n                </div>\r\n                <button type=\"button\" class=\"search btn btn-home\"  on-click=\"@.gotoNewView()\"><i class=\"fa fa-search\"></i> Go</button>\r\n\r\n            </div>            \r\n                <br>\r\n        </div>\r\n    </div>\r\n\r\n    <div class=\"row\">\r\n        <div class=\"col-md-12\">\r\n            \r\n            <h2>Navigate Declaratively</h2>\r\n\r\n            <div class=\"set1-color2 searchBox searchBoxCenter\" id=\"trackClaimBox\"> \r\n\r\n\r\n                <div class=\"home-text\" ></div>\r\n\r\n                <div class=\"content\">     \r\n                    <pre><code  class=\"line-numbers language-markup\">&lt;!-- To navigate declaratively, set the path you want to navigate to as the href url hash -->\r\n&lt;a href=\"/navTarget\">Go&lt;/a></code></pre>\r\n                </div>\r\n                <a class=\"search btn btn-home\" href=\"/navTarget\" style=\"text-decoration: underline\"><i class=\"fa fa-search\"></i> Go</a>\r\n\r\n            </div>            \r\n        </div>\r\n    </div>\r\n\r\n</div>";

var nav = {

	enter: function ( route, prevRoute, options ) {
		route.path = "js/app/views/nav/nav";
		
		route.view = new Ractive( {
			el: options.target,
			template: template$4,
			gotoNewView: function () {

				var args = { 'myArray': [ 'one', 'two', 'three' ] };
				journey.goto( "/navTargetParams/1?name=Bob", { args: args } );
			}
		} );

	},

	leave: function ( route, nextRoute ) {
		route.view.teardown();
	}
};

var template$5 = "<div class=\"container\">\r\n    <div class=\"row\">\r\n\r\n        <div class=\"col-md-12\">\r\n            <h1 style=\"padding-top:30px; padding-bottom:0px;\">Navigation <span class=\"highlightLetter\">Successful!</span></h1>\r\n        </div>\r\n    </div>\r\n\r\n    <div class=\"row\">\r\n        <div class=\"col-md-6\">\r\n            <a href=\"/nav\" class=\"link\">Go back</a>\r\n        </div>\r\n    </div>\r\n    \r\n</div>";

var navTarget = {
	
	enter: function ( route, prevRoute, options ) {
		route.path = "js/app/views/nav/navTarget";
		
		route.view = new Ractive({
			el: options.target,
			template: template$5
		});
	},
	
	leave: function ( route, nextRoute, options ) {
		route.view.teardown();
		
	}
};

var template$6 = "<div class=\"container\">\r\n    <div class=\"row\">\r\n\r\n        <div class=\"col-md-12\">\r\n            <h1 style=\"padding-top:30px; padding-bottom:0px;\">Navigation with parameters<span class=\"highlightLetter\"> successful!</span></h1>\r\n        </div>\r\n    </div>\r\n    \r\n    <div class=\"row\">\r\n\r\n        <div class=\"col-md-12\">\r\n            The following <em>params</em> was received:\r\n            <pre><code class=\"language-js\">{{JSON.stringify(params, null, 2)}}</code></pre>\r\n        </div>\r\n    </div>\r\n\r\n    <div class=\"row\">\r\n\r\n        <div class=\"col-md-12\">\r\n            The following <em>query string</em> was received:\r\n            <pre><code class=\"language-js\">{{JSON.stringify(query, null, 2)}}</code></pre>\r\n        </div>\r\n    </div>\r\n    \r\n    <div class=\"row\">\r\n\r\n        <div class=\"col-md-12\">\r\n            The following <em>arguments</em> was received:\r\n            <pre><code class=\"language-js\">{{JSON.stringify(args, null, 2)}}</code></pre>\r\n        </div>\r\n    </div>\r\n\r\n    <div class=\"row\">\r\n        <div class=\"col-md-6\">\r\n            <a href=\"/nav\" class=\"link\">Go back</a>\r\n        </div>\r\n    </div>\r\n\r\n</div>";

var navTargetParams = {

	enter: function ( route, prevRoute, options ) {
		route.path = "js/app/views/nav/navTargetParams";

		route.view = new Ractive( {
			el: options.target,
			template: template$6,
			data: {
				params: route.params,
				args: options.args,
				query: route.query
			},
			start: function ( ) {
				journey.goto( "/basic", { x: "1234" } );
			}
		} );
	},
	leave: function ( route, nextRoute ) {
		route.view.teardown( );
	}
};

var template$7 = "<h1>Page not found!</h1>\r\n";

var notFound = {

	enter: function (route, prevRoute, options) {
		route.path = "js/app/views/notfound/notFound";
		
		route.view = new Ractive({
			el: options.target,
			template: template$7
		});
		
		
	},
	
	leave: function (route, nextRoute, options) {
		route.view.teardown();
	}
};

var template$8 = "<div class=\"container\">\r\n    <div class=\"row\">\r\n\r\n        <div class=\"col-md-12\">\r\n            <h1 style=\"padding-top:30px; padding-bottom:0px;\">Redirect <span class=\"highlightLetter\">Demo</span></h1>\r\n        </div>\r\n    </div>\r\n\r\n    <div class=\"row\">\r\n        <div class=\"col-md-12\">\r\n\r\n            <h2>Redirecting to another view</h2>\r\n\r\n            <p>Sometimes you want to redirect to a different view, if certain validations are not in place, or certain permissions are missing.</p>\r\n\r\n            <p>When creating a view with <span class=\"met\">Ctroller.onInit</span>, it is possible to navigate to a different view, through\r\n                <span class=\"var\">kudu.go(...)</span>, and <span class=\"met\">return null</span>. By <span class=\"met\">returning null</span>\r\n                from <span class=\"met\">Controller.onInit</span>, kudu will stop the initialization process of that view.                \r\n            </p>\r\n\r\n            <p>For example:</p>\r\n\r\n            <div class=\"content\">     \r\n                <pre><code  class=\"line-numbers language-js\">that.onInit = function(options) {\r\n\r\n    // Check if typeId parameter is present. This view requires a typeId to function\r\n    if (options.typeId == null) {\r\n\r\n        // redirect to a different view to pick a type\r\n        kudu.go( {ctrl: CarTypeController} )\r\n        return null;\r\n    }\r\n\r\n    // typeId parameter is present so we create the view for this controller and return it\r\n    var view = createView();\r\n    return view;\r\n    \r\n} </code></pre>\r\n            </div>\r\n        </div>\r\n    </div>\r\n\r\n</div>";

var redirect = {

	enter: function ( route, prevRoute, options ) {
		route.path = "js/app/views/nav/redirect/redirect";
		
		if ( route.query.typeId == null ) {
			journey.goto( "/redirectTarget" );
			return;

		} else {

			route.view = new Ractive( {
				el: options.target,
				template: template$8
			} );
		}
	},

	leave: function ( route, nextRoute, options ) {
		if ( route.view == null ) {
			return;
		}
		route.view.teardown();
	}
};

var template$9 = "<div class=\"container\">\r\n    <div class=\"row\">\r\n\r\n        <div class=\"col-md-12\">\r\n            <h1 style=\"padding-top:30px; padding-bottom:0px;\">Redirect Target <span class=\"highlightLetter\">Demo</span></h1>\r\n        </div>\r\n    </div>\r\n\r\n    <div class=\"row\">\r\n        <div class=\"col-md-12\">\r\n\r\n            <h2><a href=\"/redirect?typeId=1\" style=\"text-decoration: underline\">Navigate to redirect</a></h2>\r\n        </div>\r\n    </div>\r\n\r\n</div>";

var redirectTarget = {
	
	enter: function ( route, prevRoute, options ) {
		route.path = "js/app/views/nav/redirect/redirectTarget";
		
		route.view = new Ractive( {
			el: options.target,
			template: template$9
		} );
	},
	
	leave: function ( route, nextRoute, options ) {
		route.view.teardown();
	}
};

var template$10 = "<div class=\"container\" fade-in={duration:1500}>\r\n    <div class=\"row\">\r\n\r\n        <div class=\"col-md-12\">\r\n            <h1 style=\"padding-top:30px; padding-bottom:0px;\">Basic <span class=\"highlightLetter\">Form</span></h1>\r\n        </div>\r\n    </div>\r\n\r\n    <div class=\"row\">\r\n        <div class=\"col-md-12\">\r\n            <div class=\"bs-callout bs-callout-info hidden\">\r\n                <h4>Success!</h4>\r\n                <p>Form submitted!</p>\r\n            </div>\r\n        </div>\r\n    </div>\r\n\r\n\r\n    <div class=\"row\">\r\n        <div class=\"col-md-12\">\r\n\r\n            <div class=\"well\">\r\n\r\n                <form autocomplete=\"off\" novalidate>\r\n                    <div class=\"form-group label-floating\">\r\n                        <label for=\"exampleInputEmail1\" class=\"control-label\">Email address</label>\r\n                        <input type=\"email\" class=\"form-control\" id=\"exampleInputEmail1\">\r\n                    </div>\r\n                    <div class=\"form-group label-floating\">\r\n                        <label for=\"exampleInputPassword1\" class=\"control-label\">Password</label>\r\n                        <input type=\"password\" class=\"form-control\" id=\"exampleInputPassword1\">\r\n                    </div>\r\n\r\n                   <div class=\"form-group\">\r\n                    <label for=\"exampleInputFile\">File input</label>\r\n                    <input type=\"file\" id=\"exampleInputFile\">\r\n                    <p class=\"help-block\">Example block-level help text here.</p>\r\n                </div>\r\n                \r\n\r\n                    <div class=\"checkbox\">\r\n                        <label>\r\n                            <input type=\"checkbox\" name=\"check\" checked=\"{{check}}\"> Check me out</label>\r\n                    </div>\r\n\r\n                    <button type=\"submit\" class=\"btn btn-raised btn-primary\" on-click=\"@.submit()\">Submit</button>\r\n                    <button type=\"reset\" class=\"btn btn-raised btn-default\" on-click=\"@.resetData()\">Reset</button>\r\n                </form>\r\n            </div>\r\n        </div>\r\n\r\n    </div>\r\n</div>";

var basicForm = {

	enter: function ( route, prevRoute, options ) {
		route.path = "js/app/views/forms/basic/basicForm";
		route.view = new Ractive( {

			el: options.target,

			template: template$10,

			data: {
				check: true
			},

			submit: function () {
				$( '.bs-callout-info' ).removeClass( 'hidden' );
				return false;
			},

			resetData: function () {
				$( '.bs-callout-info' ).addClass( 'hidden' );
			}
		} );
	},

	leave: function ( route, nextRoute, options ) {
		route.view.teardown();
	}
};

var template$11 = "<div class=\"container\" fade-in={duration:1500}>\r\n    <div class=\"row\">\r\n\r\n        <div class=\"col-md-12\">\r\n            <h1 style=\"padding-top:30px; padding-bottom:0px;\">Form <span class=\"highlightLetter\">Validation</span></h1>\r\n        </div>\r\n    </div>\r\n\r\n\r\n    <div class=\"row\">\r\n        <div class=\"col-md-12\">\r\n            <div class=\"bs-callout bs-callout-warning hidden\">\r\n                <h4>Oh snap!</h4>\r\n                <p>This form seems to be invalid :(</p>\r\n            </div>\r\n\r\n            <div class=\"bs-callout bs-callout-info hidden\">\r\n                <h4>Yay!</h4>\r\n                <p>Everything seems to be ok :)</p>\r\n            </div>\r\n        </div>\r\n    </div>\r\n\r\n    <div class=\"row\">\r\n\r\n        <div class=\"col-md-12\">\r\n\r\n            <div class=\"well\">\r\n                <form name=\"form\" novalidate>\r\n                    <div class=\"form-group label-floating\">\r\n                        <label class=\"control-label\" for=\"exampleInputEmail1\" >Name <span class=\"required\">*</span></label>\r\n                        <input type=\"text\" name=\"name\" class=\"form-control\" placeholder=\"Name\" id=\"name\"  required=\"\">\r\n                    </div>\r\n                    <div class=\"form-group label-floating\">\r\n                        <label class=\"control-label\" for=\"exampleInputEmail1\">Email address</label>\r\n                        <input type=\"text\" name=\"email\" class=\"form-control\" id=\"exampleInputEmail1\" data-parsley-type=\"email\" placeholder=\"Email\">\r\n                    </div>\r\n                    <div class=\"form-group label-floating\">\r\n                        <label class=\"control-label\" for=\"password\" >Password <span class=\"required\">*</span></label>\r\n                        <input type=\"password\" placeholder=\"Password\" class=\"form-control\" id=\"password\"  required=\"\">\r\n                    </div>\r\n                    <div class=\"form-group label-floating\">\r\n                        <label class=\"control-label\" for=\"confirmPassword\">Confirm password <span class=\"required\">*</span></label>\r\n                        <input type=\"password\" class=\"form-control\" id=\"confirmPassword\" data-parsley-equalto=\"#password\" placeholder=\"Confirm Password\" \r\n                               data-parsley-equalto-message=\"Password confirmation must match the password.\" required=\"\">\r\n                    </div>\r\n\r\n                    <div class=\"checkbox\">\r\n                        <label>\r\n                            <input type=\"checkbox\" name=\"chk\"> Checkbox\r\n                        </label>\r\n                    </div>\r\n\r\n\r\n                    <button type=\"submit\" class=\"btn btn-primary\" on-click=\"@.submit()\">Submit</button>\r\n                    <button type=\"reset\" class=\"btn btn-default\" on-click=\"@.resetData()\">Reset</button>\r\n\r\n                </form>\r\n            </div>\r\n\r\n        </div>\r\n    </div>\r\n</div>";

/*!
* Parsley.js
* Version 2.7.0 - built Wed, Mar 1st 2017, 3:53 pm
* http://parsleyjs.org
* Guillaume Potier - <guillaume@wisembly.com>
* Marc-Andre Lafortune - <petroselinum@marc-andre.ca>
* MIT Licensed
*/

// The source code below is generated by babel as
// Parsley is written in ECMAScript 6
//
var _slice = Array.prototype.slice;

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) { break; } } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) { _i['return'](); } } finally { if (_d) { throw _e; } } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('jquery')) : typeof define === 'function' && define.amd ? define(['jquery'], factory) : global.parsley = factory(global.jQuery);
})(undefined || window, function ($) {
  'use strict';

  var globalID = 1;
  var pastWarnings = {};

  var Utils__Utils = {
    // Parsley DOM-API
    // returns object from dom attributes and values
    attr: function attr($element, namespace, obj) {
      var this$1 = this;

      var i;
      var attribute;
      var attributes;
      var regex = new RegExp('^' + namespace, 'i');

      if ('undefined' === typeof obj) { obj = {}; }else {
        // Clear all own properties. This won't affect prototype's values
        for (i in obj) {
          if (obj.hasOwnProperty(i)) { delete obj[i]; }
        }
      }

      if ('undefined' === typeof $element || 'undefined' === typeof $element[0]) { return obj; }

      attributes = $element[0].attributes;
      for (i = attributes.length; i--;) {
        attribute = attributes[i];

        if (attribute && attribute.specified && regex.test(attribute.name)) {
          obj[this$1.camelize(attribute.name.slice(namespace.length))] = this$1.deserializeValue(attribute.value);
        }
      }

      return obj;
    },

    checkAttr: function checkAttr($element, namespace, _checkAttr) {
      return $element.is('[' + namespace + _checkAttr + ']');
    },

    setAttr: function setAttr($element, namespace, attr, value) {
      $element[0].setAttribute(this.dasherize(namespace + attr), String(value));
    },

    generateID: function generateID() {
      return '' + globalID++;
    },

    /** Third party functions **/
    // Zepto deserialize function
    deserializeValue: function deserializeValue(value) {
      var num;

      try {
        return value ? value == "true" || (value == "false" ? false : value == "null" ? null : !isNaN(num = Number(value)) ? num : /^[\[\{]/.test(value) ? $.parseJSON(value) : value) : value;
      } catch (e) {
        return value;
      }
    },

    // Zepto camelize function
    camelize: function camelize(str) {
      return str.replace(/-+(.)?/g, function (match, chr) {
        return chr ? chr.toUpperCase() : '';
      });
    },

    // Zepto dasherize function
    dasherize: function dasherize(str) {
      return str.replace(/::/g, '/').replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2').replace(/([a-z\d])([A-Z])/g, '$1_$2').replace(/_/g, '-').toLowerCase();
    },

    warn: function warn() {
      var _window$console;

      if (window.console && 'function' === typeof window.console.warn) { (_window$console = window.console).warn.apply(_window$console, arguments); }
    },

    warnOnce: function warnOnce(msg) {
      if (!pastWarnings[msg]) {
        pastWarnings[msg] = true;
        this.warn.apply(this, arguments);
      }
    },

    _resetWarnings: function _resetWarnings() {
      pastWarnings = {};
    },

    trimString: function trimString(string) {
      return string.replace(/^\s+|\s+$/g, '');
    },

    parse: {
      date: function date(string) {
        var parsed = string.match(/^(\d{4,})-(\d\d)-(\d\d)$/);
        if (!parsed) { return null; }

        var _parsed$map = parsed.map(function (x) {
          return parseInt(x, 10);
        });

        var _parsed$map2 = _slicedToArray(_parsed$map, 4);

        var _ = _parsed$map2[0];
        var year = _parsed$map2[1];
        var month = _parsed$map2[2];
        var day = _parsed$map2[3];

        var date = new Date(year, month - 1, day);
        if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) { return null; }
        return date;
      },
      string: function string(_string) {
        return _string;
      },
      integer: function integer(string) {
        if (isNaN(string)) { return null; }
        return parseInt(string, 10);
      },
      number: function number(string) {
        if (isNaN(string)) { throw null; }
        return parseFloat(string);
      },
      'boolean': function _boolean(string) {
        return !/^\s*false\s*$/i.test(string);
      },
      object: function object(string) {
        return Utils__Utils.deserializeValue(string);
      },
      regexp: function regexp(_regexp) {
        var flags = '';

        // Test if RegExp is literal, if not, nothing to be done, otherwise, we need to isolate flags and pattern
        if (/^\/.*\/(?:[gimy]*)$/.test(_regexp)) {
          // Replace the regexp literal string with the first match group: ([gimy]*)
          // If no flag is present, this will be a blank string
          flags = _regexp.replace(/.*\/([gimy]*)$/, '$1');
          // Again, replace the regexp literal string with the first match group:
          // everything excluding the opening and closing slashes and the flags
          _regexp = _regexp.replace(new RegExp('^/(.*?)/' + flags + '$'), '$1');
        } else {
          // Anchor regexp:
          _regexp = '^' + _regexp + '$';
        }
        return new RegExp(_regexp, flags);
      }
    },

    parseRequirement: function parseRequirement(requirementType, string) {
      var converter = this.parse[requirementType || 'string'];
      if (!converter) { throw 'Unknown requirement specification: "' + requirementType + '"'; }
      var converted = converter(string);
      if (converted === null) { throw 'Requirement is not a ' + requirementType + ': "' + string + '"'; }
      return converted;
    },

    namespaceEvents: function namespaceEvents(events, namespace) {
      events = this.trimString(events || '').split(/\s+/);
      if (!events[0]) { return ''; }
      return $.map(events, function (evt) {
        return evt + '.' + namespace;
      }).join(' ');
    },

    difference: function difference(array, remove) {
      // This is O(N^2), should be optimized
      var result = [];
      $.each(array, function (_, elem) {
        if (remove.indexOf(elem) == -1) { result.push(elem); }
      });
      return result;
    },

    // Alter-ego to native Promise.all, but for jQuery
    all: function all(promises) {
      // jQuery treats $.when() and $.when(singlePromise) differently; let's avoid that and add spurious elements
      return $.when.apply($, _toConsumableArray(promises).concat([42, 42]));
    },

    // Object.create polyfill, see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create#Polyfill
    objectCreate: Object.create || (function () {
      var Object = function Object() {};
      return function (prototype) {
        if (arguments.length > 1) {
          throw Error('Second argument not supported');
        }
        if (typeof prototype != 'object') {
          throw TypeError('Argument must be an object');
        }
        Object.prototype = prototype;
        var result = new Object();
        Object.prototype = null;
        return result;
      };
    })(),

    _SubmitSelector: 'input[type="submit"], button:submit'
  };

  var Utils__default = Utils__Utils;

  // All these options could be overriden and specified directly in DOM using
  // `data-parsley-` default DOM-API
  // eg: `inputs` can be set in DOM using `data-parsley-inputs="input, textarea"`
  // eg: `data-parsley-stop-on-first-failing-constraint="false"`

  var Defaults = {
    // ### General

    // Default data-namespace for DOM API
    namespace: 'data-parsley-',

    // Supported inputs by default
    inputs: 'input, textarea, select',

    // Excluded inputs by default
    excluded: 'input[type=button], input[type=submit], input[type=reset], input[type=hidden]',

    // Stop validating field on highest priority failing constraint
    priorityEnabled: true,

    // ### Field only

    // identifier used to group together inputs (e.g. radio buttons...)
    multiple: null,

    // identifier (or array of identifiers) used to validate only a select group of inputs
    group: null,

    // ### UI
    // Enable\Disable error messages
    uiEnabled: true,

    // Key events threshold before validation
    validationThreshold: 3,

    // Focused field on form validation error. 'first'|'last'|'none'
    focus: 'first',

    // event(s) that will trigger validation before first failure. eg: `input`...
    trigger: false,

    // event(s) that will trigger validation after first failure.
    triggerAfterFailure: 'input',

    // Class that would be added on every failing validation Parsley field
    errorClass: 'parsley-error',

    // Same for success validation
    successClass: 'parsley-success',

    // Return the `$element` that will receive these above success or error classes
    // Could also be (and given directly from DOM) a valid selector like `'#div'`
    classHandler: function classHandler(Field) {},

    // Return the `$element` where errors will be appended
    // Could also be (and given directly from DOM) a valid selector like `'#div'`
    errorsContainer: function errorsContainer(Field) {},

    // ul elem that would receive errors' list
    errorsWrapper: '<ul class="parsley-errors-list"></ul>',

    // li elem that would receive error message
    errorTemplate: '<li></li>'
  };

  var Base = function Base() {
    this.__id__ = Utils__default.generateID();
  };

  Base.prototype = {
    asyncSupport: true, // Deprecated

    _pipeAccordingToValidationResult: function _pipeAccordingToValidationResult() {
      var _this = this;

      var pipe = function pipe() {
        var r = $.Deferred();
        if (true !== _this.validationResult) { r.reject(); }
        return r.resolve().promise();
      };
      return [pipe, pipe];
    },

    actualizeOptions: function actualizeOptions() {
      Utils__default.attr(this.$element, this.options.namespace, this.domOptions);
      if (this.parent && this.parent.actualizeOptions) { this.parent.actualizeOptions(); }
      return this;
    },

    _resetOptions: function _resetOptions(initOptions) {
      var this$1 = this;

      this.domOptions = Utils__default.objectCreate(this.parent.options);
      this.options = Utils__default.objectCreate(this.domOptions);
      // Shallow copy of ownProperties of initOptions:
      for (var i in initOptions) {
        if (initOptions.hasOwnProperty(i)) { this$1.options[i] = initOptions[i]; }
      }
      this.actualizeOptions();
    },

    _listeners: null,

    // Register a callback for the given event name
    // Callback is called with context as the first argument and the `this`
    // The context is the current parsley instance, or window.Parsley if global
    // A return value of `false` will interrupt the calls
    on: function on(name, fn) {
      this._listeners = this._listeners || {};
      var queue = this._listeners[name] = this._listeners[name] || [];
      queue.push(fn);

      return this;
    },

    // Deprecated. Use `on` instead
    subscribe: function subscribe(name, fn) {
      $.listenTo(this, name.toLowerCase(), fn);
    },

    // Unregister a callback (or all if none is given) for the given event name
    off: function off(name, fn) {
      var queue = this._listeners && this._listeners[name];
      if (queue) {
        if (!fn) {
          delete this._listeners[name];
        } else {
          for (var i = queue.length; i--;) { if (queue[i] === fn) { queue.splice(i, 1); } }
        }
      }
      return this;
    },

    // Deprecated. Use `off`
    unsubscribe: function unsubscribe(name, fn) {
      $.unsubscribeTo(this, name.toLowerCase());
    },

    // Trigger an event of the given name
    // A return value of `false` interrupts the callback chain
    // Returns false if execution was interrupted
    trigger: function trigger(name, target, extraArg) {
      target = target || this;
      var queue = this._listeners && this._listeners[name];
      var result;
      var parentResult;
      if (queue) {
        for (var i = queue.length; i--;) {
          result = queue[i].call(target, target, extraArg);
          if (result === false) { return result; }
        }
      }
      if (this.parent) {
        return this.parent.trigger(name, target, extraArg);
      }
      return true;
    },

    asyncIsValid: function asyncIsValid(group, force) {
      Utils__default.warnOnce("asyncIsValid is deprecated; please use whenValid instead");
      return this.whenValid({ group: group, force: force });
    },

    _findRelated: function _findRelated() {
      return this.options.multiple ? this.parent.$element.find('[' + this.options.namespace + 'multiple="' + this.options.multiple + '"]') : this.$element;
    }
  };

  var convertArrayRequirement = function convertArrayRequirement(string, length) {
    var m = string.match(/^\s*\[(.*)\]\s*$/);
    if (!m) { throw 'Requirement is not an array: "' + string + '"'; }
    var values = m[1].split(',').map(Utils__default.trimString);
    if (values.length !== length) { throw 'Requirement has ' + values.length + ' values when ' + length + ' are needed'; }
    return values;
  };

  var convertExtraOptionRequirement = function convertExtraOptionRequirement(requirementSpec, string, extraOptionReader) {
    var main = null;
    var extra = {};
    for (var key in requirementSpec) {
      if (key) {
        var value = extraOptionReader(key);
        if ('string' === typeof value) { value = Utils__default.parseRequirement(requirementSpec[key], value); }
        extra[key] = value;
      } else {
        main = Utils__default.parseRequirement(requirementSpec[key], string);
      }
    }
    return [main, extra];
  };

  // A Validator needs to implement the methods `validate` and `parseRequirements`

  var Validator = function Validator(spec) {
    $.extend(true, this, spec);
  };

  Validator.prototype = {
    // Returns `true` iff the given `value` is valid according the given requirements.
    validate: function validate(value, requirementFirstArg) {
      if (this.fn) {
        // Legacy style validator

        if (arguments.length > 3) // If more args then value, requirement, instance...
          { requirementFirstArg = [].slice.call(arguments, 1, -1); } // Skip first arg (value) and last (instance), combining the rest
        return this.fn(value, requirementFirstArg);
      }

      if ($.isArray(value)) {
        if (!this.validateMultiple) { throw 'Validator `' + this.name + '` does not handle multiple values'; }
        return this.validateMultiple.apply(this, arguments);
      } else {
        var instance = arguments[arguments.length - 1];
        if (this.validateDate && instance._isDateInput()) {
          arguments[0] = Utils__default.parse.date(arguments[0]);
          if (arguments[0] === null) { return false; }
          return this.validateDate.apply(this, arguments);
        }
        if (this.validateNumber) {
          if (isNaN(value)) { return false; }
          arguments[0] = parseFloat(arguments[0]);
          return this.validateNumber.apply(this, arguments);
        }
        if (this.validateString) {
          return this.validateString.apply(this, arguments);
        }
        throw 'Validator `' + this.name + '` only handles multiple values';
      }
    },

    // Parses `requirements` into an array of arguments,
    // according to `this.requirementType`
    parseRequirements: function parseRequirements(requirements, extraOptionReader) {
      if ('string' !== typeof requirements) {
        // Assume requirement already parsed
        // but make sure we return an array
        return $.isArray(requirements) ? requirements : [requirements];
      }
      var type = this.requirementType;
      if ($.isArray(type)) {
        var values = convertArrayRequirement(requirements, type.length);
        for (var i = 0; i < values.length; i++) { values[i] = Utils__default.parseRequirement(type[i], values[i]); }
        return values;
      } else if ($.isPlainObject(type)) {
        return convertExtraOptionRequirement(type, requirements, extraOptionReader);
      } else {
        return [Utils__default.parseRequirement(type, requirements)];
      }
    },
    // Defaults:
    requirementType: 'string',

    priority: 2

  };

  var ValidatorRegistry = function ValidatorRegistry(validators, catalog) {
    this.__class__ = 'ValidatorRegistry';

    // Default Parsley locale is en
    this.locale = 'en';

    this.init(validators || {}, catalog || {});
  };

  var typeTesters = {
    email: /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i,

    // Follow https://www.w3.org/TR/html5/infrastructure.html#floating-point-numbers
    number: /^-?(\d*\.)?\d+(e[-+]?\d+)?$/i,

    integer: /^-?\d+$/,

    digits: /^\d+$/,

    alphanum: /^\w+$/i,

    date: {
      test: function test(value) {
        return Utils__default.parse.date(value) !== null;
      }
    },

    url: new RegExp("^" +
    // protocol identifier
    "(?:(?:https?|ftp)://)?" + // ** mod: make scheme optional
    // user:pass authentication
    "(?:\\S+(?::\\S*)?@)?" + "(?:" +
    // IP address exclusion
    // private & local networks
    // "(?!(?:10|127)(?:\\.\\d{1,3}){3})" +   // ** mod: allow local networks
    // "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +  // ** mod: allow local networks
    // "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +  // ** mod: allow local networks
    // IP address dotted notation octets
    // excludes loopback network 0.0.0.0
    // excludes reserved space >= 224.0.0.0
    // excludes network & broacast addresses
    // (first & last IP address of each class)
    "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" + "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" + "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" + "|" +
    // host name
    '(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)' +
    // domain name
    '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*' +
    // TLD identifier
    '(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))' + ")" +
    // port number
    "(?::\\d{2,5})?" +
    // resource path
    "(?:/\\S*)?" + "$", 'i')
  };
  typeTesters.range = typeTesters.number;

  // See http://stackoverflow.com/a/10454560/8279
  var decimalPlaces = function decimalPlaces(num) {
    var match = ('' + num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
    if (!match) {
      return 0;
    }
    return Math.max(0,
    // Number of digits right of decimal point.
    (match[1] ? match[1].length : 0) - (
    // Adjust for scientific notation.
    match[2] ? +match[2] : 0));
  };

  // parseArguments('number', ['1', '2']) => [1, 2]
  var ValidatorRegistry__parseArguments = function ValidatorRegistry__parseArguments(type, args) {
    return args.map(Utils__default.parse[type]);
  };
  // operatorToValidator returns a validating function for an operator function, applied to the given type
  var ValidatorRegistry__operatorToValidator = function ValidatorRegistry__operatorToValidator(type, operator) {
    return function (value) {
      var arguments$1 = arguments;

      for (var _len = arguments.length, requirementsAndInput = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        requirementsAndInput[_key - 1] = arguments$1[_key];
      }

      requirementsAndInput.pop(); // Get rid of `input` argument
      return operator.apply(undefined, [value].concat(_toConsumableArray(ValidatorRegistry__parseArguments(type, requirementsAndInput))));
    };
  };

  var ValidatorRegistry__comparisonOperator = function ValidatorRegistry__comparisonOperator(operator) {
    return {
      validateDate: ValidatorRegistry__operatorToValidator('date', operator),
      validateNumber: ValidatorRegistry__operatorToValidator('number', operator),
      requirementType: operator.length <= 2 ? 'string' : ['string', 'string'], // Support operators with a 1 or 2 requirement(s)
      priority: 30
    };
  };

  ValidatorRegistry.prototype = {
    init: function init(validators, catalog) {
      var this$1 = this;

      this.catalog = catalog;
      // Copy prototype's validators:
      this.validators = $.extend({}, this.validators);

      for (var name in validators) { this$1.addValidator(name, validators[name].fn, validators[name].priority); }

      window.Parsley.trigger('parsley:validator:init');
    },

    // Set new messages locale if we have dictionary loaded in ParsleyConfig.i18n
    setLocale: function setLocale(locale) {
      if ('undefined' === typeof this.catalog[locale]) { throw new Error(locale + ' is not available in the catalog'); }

      this.locale = locale;

      return this;
    },

    // Add a new messages catalog for a given locale. Set locale for this catalog if set === `true`
    addCatalog: function addCatalog(locale, messages, set) {
      if ('object' === typeof messages) { this.catalog[locale] = messages; }

      if (true === set) { return this.setLocale(locale); }

      return this;
    },

    // Add a specific message for a given constraint in a given locale
    addMessage: function addMessage(locale, name, message) {
      if ('undefined' === typeof this.catalog[locale]) { this.catalog[locale] = {}; }

      this.catalog[locale][name] = message;

      return this;
    },

    // Add messages for a given locale
    addMessages: function addMessages(locale, nameMessageObject) {
      var this$1 = this;

      for (var name in nameMessageObject) { this$1.addMessage(locale, name, nameMessageObject[name]); }

      return this;
    },

    // Add a new validator
    //
    //    addValidator('custom', {
    //        requirementType: ['integer', 'integer'],
    //        validateString: function(value, from, to) {},
    //        priority: 22,
    //        messages: {
    //          en: "Hey, that's no good",
    //          fr: "Aye aye, pas bon du tout",
    //        }
    //    })
    //
    // Old API was addValidator(name, function, priority)
    //
    addValidator: function addValidator(name, arg1, arg2) {
      if (this.validators[name]) { Utils__default.warn('Validator "' + name + '" is already defined.'); }else if (Defaults.hasOwnProperty(name)) {
        Utils__default.warn('"' + name + '" is a restricted keyword and is not a valid validator name.');
        return;
      }
      return this._setValidator.apply(this, arguments);
    },

    updateValidator: function updateValidator(name, arg1, arg2) {
      if (!this.validators[name]) {
        Utils__default.warn('Validator "' + name + '" is not already defined.');
        return this.addValidator.apply(this, arguments);
      }
      return this._setValidator.apply(this, arguments);
    },

    removeValidator: function removeValidator(name) {
      if (!this.validators[name]) { Utils__default.warn('Validator "' + name + '" is not defined.'); }

      delete this.validators[name];

      return this;
    },

    _setValidator: function _setValidator(name, validator, priority) {
      var this$1 = this;

      if ('object' !== typeof validator) {
        // Old style validator, with `fn` and `priority`
        validator = {
          fn: validator,
          priority: priority
        };
      }
      if (!validator.validate) {
        validator = new Validator(validator);
      }
      this.validators[name] = validator;

      for (var locale in validator.messages || {}) { this$1.addMessage(locale, name, validator.messages[locale]); }

      return this;
    },

    getErrorMessage: function getErrorMessage(constraint) {
      var message;

      // Type constraints are a bit different, we have to match their requirements too to find right error message
      if ('type' === constraint.name) {
        var typeMessages = this.catalog[this.locale][constraint.name] || {};
        message = typeMessages[constraint.requirements];
      } else { message = this.formatMessage(this.catalog[this.locale][constraint.name], constraint.requirements); }

      return message || this.catalog[this.locale].defaultMessage || this.catalog.en.defaultMessage;
    },

    // Kind of light `sprintf()` implementation
    formatMessage: function formatMessage(string, parameters) {
      var this$1 = this;

      if ('object' === typeof parameters) {
        for (var i in parameters) { string = this$1.formatMessage(string, parameters[i]); }

        return string;
      }

      return 'string' === typeof string ? string.replace(/%s/i, parameters) : '';
    },

    // Here is the Parsley default validators list.
    // A validator is an object with the following key values:
    //  - priority: an integer
    //  - requirement: 'string' (default), 'integer', 'number', 'regexp' or an Array of these
    //  - validateString, validateMultiple, validateNumber: functions returning `true`, `false` or a promise
    // Alternatively, a validator can be a function that returns such an object
    //
    validators: {
      notblank: {
        validateString: function validateString(value) {
          return (/\S/.test(value)
          );
        },
        priority: 2
      },
      required: {
        validateMultiple: function validateMultiple(values) {
          return values.length > 0;
        },
        validateString: function validateString(value) {
          return (/\S/.test(value)
          );
        },
        priority: 512
      },
      type: {
        validateString: function validateString(value, type) {
          var _ref = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

          var _ref$step = _ref.step;
          var step = _ref$step === undefined ? 'any' : _ref$step;
          var _ref$base = _ref.base;
          var base = _ref$base === undefined ? 0 : _ref$base;

          var tester = typeTesters[type];
          if (!tester) {
            throw new Error('validator type `' + type + '` is not supported');
          }
          if (!tester.test(value)) { return false; }
          if ('number' === type) {
            if (!/^any$/i.test(step || '')) {
              var nb = Number(value);
              var decimals = Math.max(decimalPlaces(step), decimalPlaces(base));
              if (decimalPlaces(nb) > decimals) // Value can't have too many decimals
                { return false; }
              // Be careful of rounding errors by using integers.
              var toInt = function toInt(f) {
                return Math.round(f * Math.pow(10, decimals));
              };
              if ((toInt(nb) - toInt(base)) % toInt(step) != 0) { return false; }
            }
          }
          return true;
        },
        requirementType: {
          '': 'string',
          step: 'string',
          base: 'number'
        },
        priority: 256
      },
      pattern: {
        validateString: function validateString(value, regexp) {
          return regexp.test(value);
        },
        requirementType: 'regexp',
        priority: 64
      },
      minlength: {
        validateString: function validateString(value, requirement) {
          return value.length >= requirement;
        },
        requirementType: 'integer',
        priority: 30
      },
      maxlength: {
        validateString: function validateString(value, requirement) {
          return value.length <= requirement;
        },
        requirementType: 'integer',
        priority: 30
      },
      length: {
        validateString: function validateString(value, min, max) {
          return value.length >= min && value.length <= max;
        },
        requirementType: ['integer', 'integer'],
        priority: 30
      },
      mincheck: {
        validateMultiple: function validateMultiple(values, requirement) {
          return values.length >= requirement;
        },
        requirementType: 'integer',
        priority: 30
      },
      maxcheck: {
        validateMultiple: function validateMultiple(values, requirement) {
          return values.length <= requirement;
        },
        requirementType: 'integer',
        priority: 30
      },
      check: {
        validateMultiple: function validateMultiple(values, min, max) {
          return values.length >= min && values.length <= max;
        },
        requirementType: ['integer', 'integer'],
        priority: 30
      },
      min: ValidatorRegistry__comparisonOperator(function (value, requirement) {
        return value >= requirement;
      }),
      max: ValidatorRegistry__comparisonOperator(function (value, requirement) {
        return value <= requirement;
      }),
      range: ValidatorRegistry__comparisonOperator(function (value, min, max) {
        return value >= min && value <= max;
      }),
      equalto: {
        validateString: function validateString(value, refOrValue) {
          var $reference = $(refOrValue);
          if ($reference.length) { return value === $reference.val(); }else { return value === refOrValue; }
        },
        priority: 256
      }
    }
  };

  var UI = {};

  var diffResults = function diffResults(newResult, oldResult, deep) {
    var added = [];
    var kept = [];

    for (var i = 0; i < newResult.length; i++) {
      var found = false;

      for (var j = 0; j < oldResult.length; j++) { if (newResult[i].assert.name === oldResult[j].assert.name) {
        found = true;
        break;
      } }

      if (found) { kept.push(newResult[i]); }else { added.push(newResult[i]); }
    }

    return {
      kept: kept,
      added: added,
      removed: !deep ? diffResults(oldResult, newResult, true).added : []
    };
  };

  UI.Form = {

    _actualizeTriggers: function _actualizeTriggers() {
      var _this2 = this;

      this.$element.on('submit.Parsley', function (evt) {
        _this2.onSubmitValidate(evt);
      });
      this.$element.on('click.Parsley', Utils__default._SubmitSelector, function (evt) {
        _this2.onSubmitButton(evt);
      });

      // UI could be disabled
      if (false === this.options.uiEnabled) { return; }

      this.$element.attr('novalidate', '');
    },

    focus: function focus() {
      var this$1 = this;

      this._focusedField = null;

      if (true === this.validationResult || 'none' === this.options.focus) { return null; }

      for (var i = 0; i < this.fields.length; i++) {
        var field = this$1.fields[i];
        if (true !== field.validationResult && field.validationResult.length > 0 && 'undefined' === typeof field.options.noFocus) {
          this$1._focusedField = field.$element;
          if ('first' === this$1.options.focus) { break; }
        }
      }

      if (null === this._focusedField) { return null; }

      return this._focusedField.focus();
    },

    _destroyUI: function _destroyUI() {
      // Reset all event listeners
      this.$element.off('.Parsley');
    }

  };

  UI.Field = {

    _reflowUI: function _reflowUI() {
      this._buildUI();

      // If this field doesn't have an active UI don't bother doing something
      if (!this._ui) { return; }

      // Diff between two validation results
      var diff = diffResults(this.validationResult, this._ui.lastValidationResult);

      // Then store current validation result for next reflow
      this._ui.lastValidationResult = this.validationResult;

      // Handle valid / invalid / none field class
      this._manageStatusClass();

      // Add, remove, updated errors messages
      this._manageErrorsMessages(diff);

      // Triggers impl
      this._actualizeTriggers();

      // If field is not valid for the first time, bind keyup trigger to ease UX and quickly inform user
      if ((diff.kept.length || diff.added.length) && !this._failedOnce) {
        this._failedOnce = true;
        this._actualizeTriggers();
      }
    },

    // Returns an array of field's error message(s)
    getErrorsMessages: function getErrorsMessages() {
      var this$1 = this;

      // No error message, field is valid
      if (true === this.validationResult) { return []; }

      var messages = [];

      for (var i = 0; i < this.validationResult.length; i++) { messages.push(this$1.validationResult[i].errorMessage || this$1._getErrorMessage(this$1.validationResult[i].assert)); }

      return messages;
    },

    // It's a goal of Parsley that this method is no longer required [#1073]
    addError: function addError(name) {
      var _ref2 = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var message = _ref2.message;
      var assert = _ref2.assert;
      var _ref2$updateClass = _ref2.updateClass;
      var updateClass = _ref2$updateClass === undefined ? true : _ref2$updateClass;

      this._buildUI();
      this._addError(name, { message: message, assert: assert });

      if (updateClass) { this._errorClass(); }
    },

    // It's a goal of Parsley that this method is no longer required [#1073]
    updateError: function updateError(name) {
      var _ref3 = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var message = _ref3.message;
      var assert = _ref3.assert;
      var _ref3$updateClass = _ref3.updateClass;
      var updateClass = _ref3$updateClass === undefined ? true : _ref3$updateClass;

      this._buildUI();
      this._updateError(name, { message: message, assert: assert });

      if (updateClass) { this._errorClass(); }
    },

    // It's a goal of Parsley that this method is no longer required [#1073]
    removeError: function removeError(name) {
      var _ref4 = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var _ref4$updateClass = _ref4.updateClass;
      var updateClass = _ref4$updateClass === undefined ? true : _ref4$updateClass;

      this._buildUI();
      this._removeError(name);

      // edge case possible here: remove a standard Parsley error that is still failing in this.validationResult
      // but highly improbable cuz' manually removing a well Parsley handled error makes no sense.
      if (updateClass) { this._manageStatusClass(); }
    },

    _manageStatusClass: function _manageStatusClass() {
      if (this.hasConstraints() && this.needsValidation() && true === this.validationResult) { this._successClass(); }else if (this.validationResult.length > 0) { this._errorClass(); }else { this._resetClass(); }
    },

    _manageErrorsMessages: function _manageErrorsMessages(diff) {
      var this$1 = this;

      if ('undefined' !== typeof this.options.errorsMessagesDisabled) { return; }

      // Case where we have errorMessage option that configure an unique field error message, regardless failing validators
      if ('undefined' !== typeof this.options.errorMessage) {
        if (diff.added.length || diff.kept.length) {
          this._insertErrorWrapper();

          if (0 === this._ui.$errorsWrapper.find('.parsley-custom-error-message').length) { this._ui.$errorsWrapper.append($(this.options.errorTemplate).addClass('parsley-custom-error-message')); }

          return this._ui.$errorsWrapper.addClass('filled').find('.parsley-custom-error-message').html(this.options.errorMessage);
        }

        return this._ui.$errorsWrapper.removeClass('filled').find('.parsley-custom-error-message').remove();
      }

      // Show, hide, update failing constraints messages
      for (var i = 0; i < diff.removed.length; i++) { this$1._removeError(diff.removed[i].assert.name); }

      for (i = 0; i < diff.added.length; i++) { this$1._addError(diff.added[i].assert.name, { message: diff.added[i].errorMessage, assert: diff.added[i].assert }); }

      for (i = 0; i < diff.kept.length; i++) { this$1._updateError(diff.kept[i].assert.name, { message: diff.kept[i].errorMessage, assert: diff.kept[i].assert }); }
    },

    _addError: function _addError(name, _ref5) {
      var message = _ref5.message;
      var assert = _ref5.assert;

      this._insertErrorWrapper();
      this._ui.$errorsWrapper.addClass('filled').append($(this.options.errorTemplate).addClass('parsley-' + name).html(message || this._getErrorMessage(assert)));
    },

    _updateError: function _updateError(name, _ref6) {
      var message = _ref6.message;
      var assert = _ref6.assert;

      this._ui.$errorsWrapper.addClass('filled').find('.parsley-' + name).html(message || this._getErrorMessage(assert));
    },

    _removeError: function _removeError(name) {
      this._ui.$errorsWrapper.removeClass('filled').find('.parsley-' + name).remove();
    },

    _getErrorMessage: function _getErrorMessage(constraint) {
      var customConstraintErrorMessage = constraint.name + 'Message';

      if ('undefined' !== typeof this.options[customConstraintErrorMessage]) { return window.Parsley.formatMessage(this.options[customConstraintErrorMessage], constraint.requirements); }

      return window.Parsley.getErrorMessage(constraint);
    },

    _buildUI: function _buildUI() {
      // UI could be already built or disabled
      if (this._ui || false === this.options.uiEnabled) { return; }

      var _ui = {};

      // Give field its Parsley id in DOM
      this.$element.attr(this.options.namespace + 'id', this.__id__);

      /** Generate important UI elements and store them in this **/
      // $errorClassHandler is the $element that woul have parsley-error and parsley-success classes
      _ui.$errorClassHandler = this._manageClassHandler();

      // $errorsWrapper is a div that would contain the various field errors, it will be appended into $errorsContainer
      _ui.errorsWrapperId = 'parsley-id-' + (this.options.multiple ? 'multiple-' + this.options.multiple : this.__id__);
      _ui.$errorsWrapper = $(this.options.errorsWrapper).attr('id', _ui.errorsWrapperId);

      // ValidationResult UI storage to detect what have changed bwt two validations, and update DOM accordingly
      _ui.lastValidationResult = [];
      _ui.validationInformationVisible = false;

      // Store it in this for later
      this._ui = _ui;
    },

    // Determine which element will have `parsley-error` and `parsley-success` classes
    _manageClassHandler: function _manageClassHandler() {
      // An element selector could be passed through DOM with `data-parsley-class-handler=#foo`
      if ('string' === typeof this.options.classHandler && $(this.options.classHandler).length) { return $(this.options.classHandler); }

      // Class handled could also be determined by function given in Parsley options
      var $handler = this.options.classHandler.call(this, this);

      // If this function returned a valid existing DOM element, go for it
      if ('undefined' !== typeof $handler && $handler.length) { return $handler; }

      return this._inputHolder();
    },

    _inputHolder: function _inputHolder() {
      // if simple element (input, texatrea, select...) it will perfectly host the classes and precede the error container
      if (!this.options.multiple || this.$element.is('select')) { return this.$element; }

      // But if multiple element (radio, checkbox), that would be their parent
      return this.$element.parent();
    },

    _insertErrorWrapper: function _insertErrorWrapper() {
      var $errorsContainer;

      // Nothing to do if already inserted
      if (0 !== this._ui.$errorsWrapper.parent().length) { return this._ui.$errorsWrapper.parent(); }

      if ('string' === typeof this.options.errorsContainer) {
        if ($(this.options.errorsContainer).length) { return $(this.options.errorsContainer).append(this._ui.$errorsWrapper); }else { Utils__default.warn('The errors container `' + this.options.errorsContainer + '` does not exist in DOM'); }
      } else if ('function' === typeof this.options.errorsContainer) { $errorsContainer = this.options.errorsContainer.call(this, this); }

      if ('undefined' !== typeof $errorsContainer && $errorsContainer.length) { return $errorsContainer.append(this._ui.$errorsWrapper); }

      return this._inputHolder().after(this._ui.$errorsWrapper);
    },

    _actualizeTriggers: function _actualizeTriggers() {
      var _this3 = this;

      var $toBind = this._findRelated();
      var trigger;

      // Remove Parsley events already bound on this field
      $toBind.off('.Parsley');
      if (this._failedOnce) { $toBind.on(Utils__default.namespaceEvents(this.options.triggerAfterFailure, 'Parsley'), function () {
        _this3._validateIfNeeded();
      }); }else if (trigger = Utils__default.namespaceEvents(this.options.trigger, 'Parsley')) {
        $toBind.on(trigger, function (event) {
          _this3._validateIfNeeded(event);
        });
      }
    },

    _validateIfNeeded: function _validateIfNeeded(event) {
      var _this4 = this;

      // For keyup, keypress, keydown, input... events that could be a little bit obstrusive
      // do not validate if val length < min threshold on first validation. Once field have been validated once and info
      // about success or failure have been displayed, always validate with this trigger to reflect every yalidation change.
      if (event && /key|input/.test(event.type)) { if (!(this._ui && this._ui.validationInformationVisible) && this.getValue().length <= this.options.validationThreshold) { return; } }

      if (this.options.debounce) {
        window.clearTimeout(this._debounced);
        this._debounced = window.setTimeout(function () {
          return _this4.validate();
        }, this.options.debounce);
      } else { this.validate(); }
    },

    _resetUI: function _resetUI() {
      // Reset all event listeners
      this._failedOnce = false;
      this._actualizeTriggers();

      // Nothing to do if UI never initialized for this field
      if ('undefined' === typeof this._ui) { return; }

      // Reset all errors' li
      this._ui.$errorsWrapper.removeClass('filled').children().remove();

      // Reset validation class
      this._resetClass();

      // Reset validation flags and last validation result
      this._ui.lastValidationResult = [];
      this._ui.validationInformationVisible = false;
    },

    _destroyUI: function _destroyUI() {
      this._resetUI();

      if ('undefined' !== typeof this._ui) { this._ui.$errorsWrapper.remove(); }

      delete this._ui;
    },

    _successClass: function _successClass() {
      this._ui.validationInformationVisible = true;
      this._ui.$errorClassHandler.removeClass(this.options.errorClass).addClass(this.options.successClass);
    },
    _errorClass: function _errorClass() {
      this._ui.validationInformationVisible = true;
      this._ui.$errorClassHandler.removeClass(this.options.successClass).addClass(this.options.errorClass);
    },
    _resetClass: function _resetClass() {
      this._ui.$errorClassHandler.removeClass(this.options.successClass).removeClass(this.options.errorClass);
    }
  };

  var Form = function Form(element, domOptions, options) {
    this.__class__ = 'Form';

    this.$element = $(element);
    this.domOptions = domOptions;
    this.options = options;
    this.parent = window.Parsley;

    this.fields = [];
    this.validationResult = null;
  };

  var Form__statusMapping = { pending: null, resolved: true, rejected: false };

  Form.prototype = {
    onSubmitValidate: function onSubmitValidate(event) {
      var _this5 = this;

      // This is a Parsley generated submit event, do not validate, do not prevent, simply exit and keep normal behavior
      if (true === event.parsley) { return; }

      // If we didn't come here through a submit button, use the first one in the form
      var $submitSource = this._$submitSource || this.$element.find(Utils__default._SubmitSelector).first();
      this._$submitSource = null;
      this.$element.find('.parsley-synthetic-submit-button').prop('disabled', true);
      if ($submitSource.is('[formnovalidate]')) { return; }

      var promise = this.whenValidate({ event: event });

      if ('resolved' === promise.state() && false !== this._trigger('submit')) {
        // All good, let event go through. We make this distinction because browsers
        // differ in their handling of `submit` being called from inside a submit event [#1047]
      } else {
          // Rejected or pending: cancel this submit
          event.stopImmediatePropagation();
          event.preventDefault();
          if ('pending' === promise.state()) { promise.done(function () {
            _this5._submit($submitSource);
          }); }
        }
    },

    onSubmitButton: function onSubmitButton(event) {
      this._$submitSource = $(event.currentTarget);
    },
    // internal
    // _submit submits the form, this time without going through the validations.
    // Care must be taken to "fake" the actual submit button being clicked.
    _submit: function _submit($submitSource) {
      if (false === this._trigger('submit')) { return; }
      // Add submit button's data
      if ($submitSource) {
        var $synthetic = this.$element.find('.parsley-synthetic-submit-button').prop('disabled', false);
        if (0 === $synthetic.length) { $synthetic = $('<input class="parsley-synthetic-submit-button" type="hidden">').appendTo(this.$element); }
        $synthetic.attr({
          name: $submitSource.attr('name'),
          value: $submitSource.attr('value')
        });
      }

      this.$element.trigger($.extend($.Event('submit'), { parsley: true }));
    },

    // Performs validation on fields while triggering events.
    // @returns `true` if all validations succeeds, `false`
    // if a failure is immediately detected, or `null`
    // if dependant on a promise.
    // Consider using `whenValidate` instead.
    validate: function validate(options) {
      if (arguments.length >= 1 && !$.isPlainObject(options)) {
        Utils__default.warnOnce('Calling validate on a parsley form without passing arguments as an object is deprecated.');

        var _arguments = _slice.call(arguments);

        var group = _arguments[0];
        var force = _arguments[1];
        var event = _arguments[2];

        options = { group: group, force: force, event: event };
      }
      return Form__statusMapping[this.whenValidate(options).state()];
    },

    whenValidate: function whenValidate() {
      var _Utils__default$all$done$fail$always,
          _this6 = this;

      var _ref7 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var group = _ref7.group;
      var force = _ref7.force;
      var event = _ref7.event;

      this.submitEvent = event;
      if (event) {
        this.submitEvent = $.extend({}, event, { preventDefault: function preventDefault() {
            Utils__default.warnOnce("Using `this.submitEvent.preventDefault()` is deprecated; instead, call `this.validationResult = false`");
            _this6.validationResult = false;
          } });
      }
      this.validationResult = true;

      // fire validate event to eventually modify things before every validation
      this._trigger('validate');

      // Refresh form DOM options and form's fields that could have changed
      this._refreshFields();

      var promises = this._withoutReactualizingFormOptions(function () {
        return $.map(_this6.fields, function (field) {
          return field.whenValidate({ force: force, group: group });
        });
      });

      return (_Utils__default$all$done$fail$always = Utils__default.all(promises).done(function () {
        _this6._trigger('success');
      }).fail(function () {
        _this6.validationResult = false;
        _this6.focus();
        _this6._trigger('error');
      }).always(function () {
        _this6._trigger('validated');
      })).pipe.apply(_Utils__default$all$done$fail$always, _toConsumableArray(this._pipeAccordingToValidationResult()));
    },

    // Iterate over refreshed fields, and stop on first failure.
    // Returns `true` if all fields are valid, `false` if a failure is detected
    // or `null` if the result depends on an unresolved promise.
    // Prefer using `whenValid` instead.
    isValid: function isValid(options) {
      if (arguments.length >= 1 && !$.isPlainObject(options)) {
        Utils__default.warnOnce('Calling isValid on a parsley form without passing arguments as an object is deprecated.');

        var _arguments2 = _slice.call(arguments);

        var group = _arguments2[0];
        var force = _arguments2[1];

        options = { group: group, force: force };
      }
      return Form__statusMapping[this.whenValid(options).state()];
    },

    // Iterate over refreshed fields and validate them.
    // Returns a promise.
    // A validation that immediately fails will interrupt the validations.
    whenValid: function whenValid() {
      var _this7 = this;

      var _ref8 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var group = _ref8.group;
      var force = _ref8.force;

      this._refreshFields();

      var promises = this._withoutReactualizingFormOptions(function () {
        return $.map(_this7.fields, function (field) {
          return field.whenValid({ group: group, force: force });
        });
      });
      return Utils__default.all(promises);
    },

    // Reset UI
    reset: function reset() {
      var this$1 = this;

      // Form case: emit a reset event for each field
      for (var i = 0; i < this.fields.length; i++) { this$1.fields[i].reset(); }

      this._trigger('reset');
    },

    // Destroy Parsley instance (+ UI)
    destroy: function destroy() {
      var this$1 = this;

      // Field case: emit destroy event to clean UI and then destroy stored instance
      this._destroyUI();

      // Form case: destroy all its fields and then destroy stored instance
      for (var i = 0; i < this.fields.length; i++) { this$1.fields[i].destroy(); }

      this.$element.removeData('Parsley');
      this._trigger('destroy');
    },

    _refreshFields: function _refreshFields() {
      return this.actualizeOptions()._bindFields();
    },

    _bindFields: function _bindFields() {
      var _this8 = this;

      var oldFields = this.fields;

      this.fields = [];
      this.fieldsMappedById = {};

      this._withoutReactualizingFormOptions(function () {
        _this8.$element.find(_this8.options.inputs).not(_this8.options.excluded).each(function (_, element) {
          var fieldInstance = new window.Parsley.Factory(element, {}, _this8);

          // Only add valid and not excluded `Field` and `FieldMultiple` children
          if (('Field' === fieldInstance.__class__ || 'FieldMultiple' === fieldInstance.__class__) && true !== fieldInstance.options.excluded) {
            var uniqueId = fieldInstance.__class__ + '-' + fieldInstance.__id__;
            if ('undefined' === typeof _this8.fieldsMappedById[uniqueId]) {
              _this8.fieldsMappedById[uniqueId] = fieldInstance;
              _this8.fields.push(fieldInstance);
            }
          }
        });

        $.each(Utils__default.difference(oldFields, _this8.fields), function (_, field) {
          field.reset();
        });
      });
      return this;
    },

    // Internal only.
    // Looping on a form's fields to do validation or similar
    // will trigger reactualizing options on all of them, which
    // in turn will reactualize the form's options.
    // To avoid calling actualizeOptions so many times on the form
    // for nothing, _withoutReactualizingFormOptions temporarily disables
    // the method actualizeOptions on this form while `fn` is called.
    _withoutReactualizingFormOptions: function _withoutReactualizingFormOptions(fn) {
      var oldActualizeOptions = this.actualizeOptions;
      this.actualizeOptions = function () {
        return this;
      };
      var result = fn();
      this.actualizeOptions = oldActualizeOptions;
      return result;
    },

    // Internal only.
    // Shortcut to trigger an event
    // Returns true iff event is not interrupted and default not prevented.
    _trigger: function _trigger(eventName) {
      return this.trigger('form:' + eventName);
    }

  };

  var Constraint = function Constraint(parsleyField, name, requirements, priority, isDomConstraint) {
    var validatorSpec = window.Parsley._validatorRegistry.validators[name];
    var validator = new Validator(validatorSpec);

    $.extend(this, {
      validator: validator,
      name: name,
      requirements: requirements,
      priority: priority || parsleyField.options[name + 'Priority'] || validator.priority,
      isDomConstraint: true === isDomConstraint
    });
    this._parseRequirements(parsleyField.options);
  };

  var capitalize = function capitalize(str) {
    var cap = str[0].toUpperCase();
    return cap + str.slice(1);
  };

  Constraint.prototype = {
    validate: function validate(value, instance) {
      var _validator;

      return (_validator = this.validator).validate.apply(_validator, [value].concat(_toConsumableArray(this.requirementList), [instance]));
    },

    _parseRequirements: function _parseRequirements(options) {
      var _this9 = this;

      this.requirementList = this.validator.parseRequirements(this.requirements, function (key) {
        return options[_this9.name + capitalize(key)];
      });
    }
  };

  var Field = function Field(field, domOptions, options, parsleyFormInstance) {
    this.__class__ = 'Field';

    this.$element = $(field);

    // Set parent if we have one
    if ('undefined' !== typeof parsleyFormInstance) {
      this.parent = parsleyFormInstance;
    }

    this.options = options;
    this.domOptions = domOptions;

    // Initialize some properties
    this.constraints = [];
    this.constraintsByName = {};
    this.validationResult = true;

    // Bind constraints
    this._bindConstraints();
  };

  var parsley_field__statusMapping = { pending: null, resolved: true, rejected: false };

  Field.prototype = {
    // # Public API
    // Validate field and trigger some events for mainly `UI`
    // @returns `true`, an array of the validators that failed, or
    // `null` if validation is not finished. Prefer using whenValidate
    validate: function validate(options) {
      if (arguments.length >= 1 && !$.isPlainObject(options)) {
        Utils__default.warnOnce('Calling validate on a parsley field without passing arguments as an object is deprecated.');
        options = { options: options };
      }
      var promise = this.whenValidate(options);
      if (!promise) // If excluded with `group` option
        { return true; }
      switch (promise.state()) {
        case 'pending':
          return null;
        case 'resolved':
          return true;
        case 'rejected':
          return this.validationResult;
      }
    },

    // Validate field and trigger some events for mainly `UI`
    // @returns a promise that succeeds only when all validations do
    // or `undefined` if field is not in the given `group`.
    whenValidate: function whenValidate() {
      var _whenValid$always$done$fail$always,
          _this10 = this;

      var _ref9 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var force = _ref9.force;
      var group = _ref9.group;

      // do not validate a field if not the same as given validation group
      this.refreshConstraints();
      if (group && !this._isInGroup(group)) { return; }

      this.value = this.getValue();

      // Field Validate event. `this.value` could be altered for custom needs
      this._trigger('validate');

      return (_whenValid$always$done$fail$always = this.whenValid({ force: force, value: this.value, _refreshed: true }).always(function () {
        _this10._reflowUI();
      }).done(function () {
        _this10._trigger('success');
      }).fail(function () {
        _this10._trigger('error');
      }).always(function () {
        _this10._trigger('validated');
      })).pipe.apply(_whenValid$always$done$fail$always, _toConsumableArray(this._pipeAccordingToValidationResult()));
    },

    hasConstraints: function hasConstraints() {
      return 0 !== this.constraints.length;
    },

    // An empty optional field does not need validation
    needsValidation: function needsValidation(value) {
      if ('undefined' === typeof value) { value = this.getValue(); }

      // If a field is empty and not required, it is valid
      // Except if `data-parsley-validate-if-empty` explicitely added, useful for some custom validators
      if (!value.length && !this._isRequired() && 'undefined' === typeof this.options.validateIfEmpty) { return false; }

      return true;
    },

    _isInGroup: function _isInGroup(group) {
      if ($.isArray(this.options.group)) { return -1 !== $.inArray(group, this.options.group); }
      return this.options.group === group;
    },

    // Just validate field. Do not trigger any event.
    // Returns `true` iff all constraints pass, `false` if there are failures,
    // or `null` if the result can not be determined yet (depends on a promise)
    // See also `whenValid`.
    isValid: function isValid(options) {
      if (arguments.length >= 1 && !$.isPlainObject(options)) {
        Utils__default.warnOnce('Calling isValid on a parsley field without passing arguments as an object is deprecated.');

        var _arguments3 = _slice.call(arguments);

        var force = _arguments3[0];
        var value = _arguments3[1];

        options = { force: force, value: value };
      }
      var promise = this.whenValid(options);
      if (!promise) // Excluded via `group`
        { return true; }
      return parsley_field__statusMapping[promise.state()];
    },

    // Just validate field. Do not trigger any event.
    // @returns a promise that succeeds only when all validations do
    // or `undefined` if the field is not in the given `group`.
    // The argument `force` will force validation of empty fields.
    // If a `value` is given, it will be validated instead of the value of the input.
    whenValid: function whenValid() {
      var _this11 = this;

      var _ref10 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var _ref10$force = _ref10.force;
      var force = _ref10$force === undefined ? false : _ref10$force;
      var value = _ref10.value;
      var group = _ref10.group;
      var _refreshed = _ref10._refreshed;

      // Recompute options and rebind constraints to have latest changes
      if (!_refreshed) { this.refreshConstraints(); }
      // do not validate a field if not the same as given validation group
      if (group && !this._isInGroup(group)) { return; }

      this.validationResult = true;

      // A field without constraint is valid
      if (!this.hasConstraints()) { return $.when(); }

      // Value could be passed as argument, needed to add more power to 'field:validate'
      if ('undefined' === typeof value || null === value) { value = this.getValue(); }

      if (!this.needsValidation(value) && true !== force) { return $.when(); }

      var groupedConstraints = this._getGroupedConstraints();
      var promises = [];
      $.each(groupedConstraints, function (_, constraints) {
        // Process one group of constraints at a time, we validate the constraints
        // and combine the promises together.
        var promise = Utils__default.all($.map(constraints, function (constraint) {
          return _this11._validateConstraint(value, constraint);
        }));
        promises.push(promise);
        if (promise.state() === 'rejected') { return false; } // Interrupt processing if a group has already failed
      });
      return Utils__default.all(promises);
    },

    // @returns a promise
    _validateConstraint: function _validateConstraint(value, constraint) {
      var _this12 = this;

      var result = constraint.validate(value, this);
      // Map false to a failed promise
      if (false === result) { result = $.Deferred().reject(); }
      // Make sure we return a promise and that we record failures
      return Utils__default.all([result]).fail(function (errorMessage) {
        if (!(_this12.validationResult instanceof Array)) { _this12.validationResult = []; }
        _this12.validationResult.push({
          assert: constraint,
          errorMessage: 'string' === typeof errorMessage && errorMessage
        });
      });
    },

    // @returns Parsley field computed value that could be overrided or configured in DOM
    getValue: function getValue() {
      var value;

      // Value could be overriden in DOM or with explicit options
      if ('function' === typeof this.options.value) { value = this.options.value(this); }else if ('undefined' !== typeof this.options.value) { value = this.options.value; }else { value = this.$element.val(); }

      // Handle wrong DOM or configurations
      if ('undefined' === typeof value || null === value) { return ''; }

      return this._handleWhitespace(value);
    },

    // Reset UI
    reset: function reset() {
      this._resetUI();
      return this._trigger('reset');
    },

    // Destroy Parsley instance (+ UI)
    destroy: function destroy() {
      // Field case: emit destroy event to clean UI and then destroy stored instance
      this._destroyUI();
      this.$element.removeData('Parsley');
      this.$element.removeData('FieldMultiple');
      this._trigger('destroy');
    },

    // Actualize options that could have change since previous validation
    // Re-bind accordingly constraints (could be some new, removed or updated)
    refreshConstraints: function refreshConstraints() {
      return this.actualizeOptions()._bindConstraints();
    },

    /**
    * Add a new constraint to a field
    *
    * @param {String}   name
    * @param {Mixed}    requirements      optional
    * @param {Number}   priority          optional
    * @param {Boolean}  isDomConstraint   optional
    */
    addConstraint: function addConstraint(name, requirements, priority, isDomConstraint) {

      if (window.Parsley._validatorRegistry.validators[name]) {
        var constraint = new Constraint(this, name, requirements, priority, isDomConstraint);

        // if constraint already exist, delete it and push new version
        if ('undefined' !== this.constraintsByName[constraint.name]) { this.removeConstraint(constraint.name); }

        this.constraints.push(constraint);
        this.constraintsByName[constraint.name] = constraint;
      }

      return this;
    },

    // Remove a constraint
    removeConstraint: function removeConstraint(name) {
      var this$1 = this;

      for (var i = 0; i < this.constraints.length; i++) { if (name === this$1.constraints[i].name) {
        this$1.constraints.splice(i, 1);
        break;
      } }
      delete this.constraintsByName[name];
      return this;
    },

    // Update a constraint (Remove + re-add)
    updateConstraint: function updateConstraint(name, parameters, priority) {
      return this.removeConstraint(name).addConstraint(name, parameters, priority);
    },

    // # Internals

    // Internal only.
    // Bind constraints from config + options + DOM
    _bindConstraints: function _bindConstraints() {
      var this$1 = this;

      var constraints = [];
      var constraintsByName = {};

      // clean all existing DOM constraints to only keep javascript user constraints
      for (var i = 0; i < this.constraints.length; i++) { if (false === this$1.constraints[i].isDomConstraint) {
        constraints.push(this$1.constraints[i]);
        constraintsByName[this$1.constraints[i].name] = this$1.constraints[i];
      } }

      this.constraints = constraints;
      this.constraintsByName = constraintsByName;

      // then re-add Parsley DOM-API constraints
      for (var name in this$1.options) { this$1.addConstraint(name, this$1.options[name], undefined, true); }

      // finally, bind special HTML5 constraints
      return this._bindHtml5Constraints();
    },

    // Internal only.
    // Bind specific HTML5 constraints to be HTML5 compliant
    _bindHtml5Constraints: function _bindHtml5Constraints() {
      // html5 required
      if (this.$element.attr('required')) { this.addConstraint('required', true, undefined, true); }

      // html5 pattern
      if ('string' === typeof this.$element.attr('pattern')) { this.addConstraint('pattern', this.$element.attr('pattern'), undefined, true); }

      // range
      if ('undefined' !== typeof this.$element.attr('min') && 'undefined' !== typeof this.$element.attr('max')) { this.addConstraint('range', [this.$element.attr('min'), this.$element.attr('max')], undefined, true); }

      // HTML5 min
      else if ('undefined' !== typeof this.$element.attr('min')) { this.addConstraint('min', this.$element.attr('min'), undefined, true); }

        // HTML5 max
        else if ('undefined' !== typeof this.$element.attr('max')) { this.addConstraint('max', this.$element.attr('max'), undefined, true); }

      // length
      if ('undefined' !== typeof this.$element.attr('minlength') && 'undefined' !== typeof this.$element.attr('maxlength')) { this.addConstraint('length', [this.$element.attr('minlength'), this.$element.attr('maxlength')], undefined, true); }

      // HTML5 minlength
      else if ('undefined' !== typeof this.$element.attr('minlength')) { this.addConstraint('minlength', this.$element.attr('minlength'), undefined, true); }

        // HTML5 maxlength
        else if ('undefined' !== typeof this.$element.attr('maxlength')) { this.addConstraint('maxlength', this.$element.attr('maxlength'), undefined, true); }

      // html5 types
      var type = this.$element.attr('type');

      if ('undefined' === typeof type) { return this; }

      // Small special case here for HTML5 number: integer validator if step attribute is undefined or an integer value, number otherwise
      if ('number' === type) {
        return this.addConstraint('type', ['number', {
          step: this.$element.attr('step') || '1',
          base: this.$element.attr('min') || this.$element.attr('value')
        }], undefined, true);
        // Regular other HTML5 supported types
      } else if (/^(email|url|range|date)$/i.test(type)) {
          return this.addConstraint('type', type, undefined, true);
        }
      return this;
    },

    // Internal only.
    // Field is required if have required constraint without `false` value
    _isRequired: function _isRequired() {
      if ('undefined' === typeof this.constraintsByName.required) { return false; }

      return false !== this.constraintsByName.required.requirements;
    },

    // Internal only.
    // Shortcut to trigger an event
    _trigger: function _trigger(eventName) {
      return this.trigger('field:' + eventName);
    },

    // Internal only
    // Handles whitespace in a value
    // Use `data-parsley-whitespace="squish"` to auto squish input value
    // Use `data-parsley-whitespace="trim"` to auto trim input value
    _handleWhitespace: function _handleWhitespace(value) {
      if (true === this.options.trimValue) { Utils__default.warnOnce('data-parsley-trim-value="true" is deprecated, please use data-parsley-whitespace="trim"'); }

      if ('squish' === this.options.whitespace) { value = value.replace(/\s{2,}/g, ' '); }

      if ('trim' === this.options.whitespace || 'squish' === this.options.whitespace || true === this.options.trimValue) { value = Utils__default.trimString(value); }

      return value;
    },

    _isDateInput: function _isDateInput() {
      var c = this.constraintsByName.type;
      return c && c.requirements === 'date';
    },

    // Internal only.
    // Returns the constraints, grouped by descending priority.
    // The result is thus an array of arrays of constraints.
    _getGroupedConstraints: function _getGroupedConstraints() {
      var this$1 = this;

      if (false === this.options.priorityEnabled) { return [this.constraints]; }

      var groupedConstraints = [];
      var index = {};

      // Create array unique of priorities
      for (var i = 0; i < this.constraints.length; i++) {
        var p = this$1.constraints[i].priority;
        if (!index[p]) { groupedConstraints.push(index[p] = []); }
        index[p].push(this$1.constraints[i]);
      }
      // Sort them by priority DESC
      groupedConstraints.sort(function (a, b) {
        return b[0].priority - a[0].priority;
      });

      return groupedConstraints;
    }

  };

  var parsley_field = Field;

  var Multiple = function Multiple() {
    this.__class__ = 'FieldMultiple';
  };

  Multiple.prototype = {
    // Add new `$element` sibling for multiple field
    addElement: function addElement($element) {
      this.$elements.push($element);

      return this;
    },

    // See `Field.refreshConstraints()`
    refreshConstraints: function refreshConstraints() {
      var this$1 = this;

      var fieldConstraints;

      this.constraints = [];

      // Select multiple special treatment
      if (this.$element.is('select')) {
        this.actualizeOptions()._bindConstraints();

        return this;
      }

      // Gather all constraints for each input in the multiple group
      for (var i = 0; i < this.$elements.length; i++) {

        // Check if element have not been dynamically removed since last binding
        if (!$('html').has(this$1.$elements[i]).length) {
          this$1.$elements.splice(i, 1);
          continue;
        }

        fieldConstraints = this$1.$elements[i].data('FieldMultiple').refreshConstraints().constraints;

        for (var j = 0; j < fieldConstraints.length; j++) { this$1.addConstraint(fieldConstraints[j].name, fieldConstraints[j].requirements, fieldConstraints[j].priority, fieldConstraints[j].isDomConstraint); }
      }

      return this;
    },

    // See `Field.getValue()`
    getValue: function getValue() {
      // Value could be overriden in DOM
      if ('function' === typeof this.options.value) { return this.options.value(this); }else if ('undefined' !== typeof this.options.value) { return this.options.value; }

      // Radio input case
      if (this.$element.is('input[type=radio]')) { return this._findRelated().filter(':checked').val() || ''; }

      // checkbox input case
      if (this.$element.is('input[type=checkbox]')) {
        var values = [];

        this._findRelated().filter(':checked').each(function () {
          values.push($(this).val());
        });

        return values;
      }

      // Select multiple case
      if (this.$element.is('select') && null === this.$element.val()) { return []; }

      // Default case that should never happen
      return this.$element.val();
    },

    _init: function _init() {
      this.$elements = [this.$element];

      return this;
    }
  };

  var Factory = function Factory(element, options, parsleyFormInstance) {
    this.$element = $(element);

    // If the element has already been bound, returns its saved Parsley instance
    var savedparsleyFormInstance = this.$element.data('Parsley');
    if (savedparsleyFormInstance) {

      // If the saved instance has been bound without a Form parent and there is one given in this call, add it
      if ('undefined' !== typeof parsleyFormInstance && savedparsleyFormInstance.parent === window.Parsley) {
        savedparsleyFormInstance.parent = parsleyFormInstance;
        savedparsleyFormInstance._resetOptions(savedparsleyFormInstance.options);
      }

      if ('object' === typeof options) {
        $.extend(savedparsleyFormInstance.options, options);
      }

      return savedparsleyFormInstance;
    }

    // Parsley must be instantiated with a DOM element or jQuery $element
    if (!this.$element.length) { throw new Error('You must bind Parsley on an existing element.'); }

    if ('undefined' !== typeof parsleyFormInstance && 'Form' !== parsleyFormInstance.__class__) { throw new Error('Parent instance must be a Form instance'); }

    this.parent = parsleyFormInstance || window.Parsley;
    return this.init(options);
  };

  Factory.prototype = {
    init: function init(options) {
      this.__class__ = 'Parsley';
      this.__version__ = '2.7.0';
      this.__id__ = Utils__default.generateID();

      // Pre-compute options
      this._resetOptions(options);

      // A Form instance is obviously a `<form>` element but also every node that is not an input and has the `data-parsley-validate` attribute
      if (this.$element.is('form') || Utils__default.checkAttr(this.$element, this.options.namespace, 'validate') && !this.$element.is(this.options.inputs)) { return this.bind('parsleyForm'); }

      // Every other element is bound as a `Field` or `FieldMultiple`
      return this.isMultiple() ? this.handleMultiple() : this.bind('parsleyField');
    },

    isMultiple: function isMultiple() {
      return this.$element.is('input[type=radio], input[type=checkbox]') || this.$element.is('select') && 'undefined' !== typeof this.$element.attr('multiple');
    },

    // Multiples fields are a real nightmare :(
    // Maybe some refactoring would be appreciated here...
    handleMultiple: function handleMultiple() {
      var this$1 = this;

      var _this13 = this;

      var name;
      var multiple;
      var parsleyMultipleInstance;

      // Handle multiple name
      if (this.options.multiple) {  } // We already have our 'multiple' identifier
      else if ('undefined' !== typeof this.$element.attr('name') && this.$element.attr('name').length) { this.options.multiple = name = this.$element.attr('name'); }else if ('undefined' !== typeof this.$element.attr('id') && this.$element.attr('id').length) { this.options.multiple = this.$element.attr('id'); }

      // Special select multiple input
      if (this.$element.is('select') && 'undefined' !== typeof this.$element.attr('multiple')) {
        this.options.multiple = this.options.multiple || this.__id__;
        return this.bind('parsleyFieldMultiple');

        // Else for radio / checkboxes, we need a `name` or `data-parsley-multiple` to properly bind it
      } else if (!this.options.multiple) {
          Utils__default.warn('To be bound by Parsley, a radio, a checkbox and a multiple select input must have either a name or a multiple option.', this.$element);
          return this;
        }

      // Remove special chars
      this.options.multiple = this.options.multiple.replace(/(:|\.|\[|\]|\{|\}|\$)/g, '');

      // Add proper `data-parsley-multiple` to siblings if we have a valid multiple name
      if ('undefined' !== typeof name) {
        $('input[name="' + name + '"]').each(function (i, input) {
          if ($(input).is('input[type=radio], input[type=checkbox]')) { $(input).attr(_this13.options.namespace + 'multiple', _this13.options.multiple); }
        });
      }

      // Check here if we don't already have a related multiple instance saved
      var $previouslyRelated = this._findRelated();
      for (var i = 0; i < $previouslyRelated.length; i++) {
        parsleyMultipleInstance = $($previouslyRelated.get(i)).data('Parsley');
        if ('undefined' !== typeof parsleyMultipleInstance) {

          if (!this$1.$element.data('FieldMultiple')) {
            parsleyMultipleInstance.addElement(this$1.$element);
          }

          break;
        }
      }

      // Create a secret Field instance for every multiple field. It will be stored in `data('FieldMultiple')`
      // And will be useful later to access classic `Field` stuff while being in a `FieldMultiple` instance
      this.bind('parsleyField', true);

      return parsleyMultipleInstance || this.bind('parsleyFieldMultiple');
    },

    // Return proper `Form`, `Field` or `FieldMultiple`
    bind: function bind(type, doNotStore) {
      var parsleyInstance;

      switch (type) {
        case 'parsleyForm':
          parsleyInstance = $.extend(new Form(this.$element, this.domOptions, this.options), new Base(), window.ParsleyExtend)._bindFields();
          break;
        case 'parsleyField':
          parsleyInstance = $.extend(new parsley_field(this.$element, this.domOptions, this.options, this.parent), new Base(), window.ParsleyExtend);
          break;
        case 'parsleyFieldMultiple':
          parsleyInstance = $.extend(new parsley_field(this.$element, this.domOptions, this.options, this.parent), new Multiple(), new Base(), window.ParsleyExtend)._init();
          break;
        default:
          throw new Error(type + 'is not a supported Parsley type');
      }

      if (this.options.multiple) { Utils__default.setAttr(this.$element, this.options.namespace, 'multiple', this.options.multiple); }

      if ('undefined' !== typeof doNotStore) {
        this.$element.data('FieldMultiple', parsleyInstance);

        return parsleyInstance;
      }

      // Store the freshly bound instance in a DOM element for later access using jQuery `data()`
      this.$element.data('Parsley', parsleyInstance);

      // Tell the world we have a new Form or Field instance!
      parsleyInstance._actualizeTriggers();
      parsleyInstance._trigger('init');

      return parsleyInstance;
    }
  };

  var vernums = $.fn.jquery.split('.');
  if (parseInt(vernums[0]) <= 1 && parseInt(vernums[1]) < 8) {
    throw "The loaded version of jQuery is too old. Please upgrade to 1.8.x or better.";
  }
  if (!vernums.forEach) {
    Utils__default.warn('Parsley requires ES5 to run properly. Please include https://github.com/es-shims/es5-shim');
  }
  // Inherit `on`, `off` & `trigger` to Parsley:
  var Parsley = $.extend(new Base(), {
    $element: $(document),
    actualizeOptions: null,
    _resetOptions: null,
    Factory: Factory,
    version: '2.7.0'
  });

  // Supplement Field and Form with Base
  // This way, the constructors will have access to those methods
  $.extend(parsley_field.prototype, UI.Field, Base.prototype);
  $.extend(Form.prototype, UI.Form, Base.prototype);
  // Inherit actualizeOptions and _resetOptions:
  $.extend(Factory.prototype, Base.prototype);

  // ### jQuery API
  // `$('.elem').parsley(options)` or `$('.elem').psly(options)`
  $.fn.parsley = $.fn.psly = function (options) {
    if (this.length > 1) {
      var instances = [];

      this.each(function () {
        instances.push($(this).parsley(options));
      });

      return instances;
    }

    // Return undefined if applied to non existing DOM element
    if (!$(this).length) {
      Utils__default.warn('You must bind Parsley on an existing element.');

      return;
    }

    return new Factory(this, options);
  };

  // ### Field and Form extension
  // Ensure the extension is now defined if it wasn't previously
  if ('undefined' === typeof window.ParsleyExtend) { window.ParsleyExtend = {}; }

  // ### Parsley config
  // Inherit from ParsleyDefault, and copy over any existing values
  Parsley.options = $.extend(Utils__default.objectCreate(Defaults), window.ParsleyConfig);
  window.ParsleyConfig = Parsley.options; // Old way of accessing global options

  // ### Globals
  window.Parsley = window.psly = Parsley;
  Parsley.Utils = Utils__default;
  window.ParsleyUtils = {};
  $.each(Utils__default, function (key, value) {
    if ('function' === typeof value) {
      window.ParsleyUtils[key] = function () {
        Utils__default.warnOnce('Accessing `window.ParsleyUtils` is deprecated. Use `window.Parsley.Utils` instead.');
        return Utils__default[key].apply(Utils__default, arguments);
      };
    }
  });

  // ### Define methods that forward to the registry, and deprecate all access except through window.Parsley
  var registry = window.Parsley._validatorRegistry = new ValidatorRegistry(window.ParsleyConfig.validators, window.ParsleyConfig.i18n);
  window.ParsleyValidator = {};
  $.each('setLocale addCatalog addMessage addMessages getErrorMessage formatMessage addValidator updateValidator removeValidator'.split(' '), function (i, method) {
    window.Parsley[method] = $.proxy(registry, method);
    window.ParsleyValidator[method] = function () {
      var _window$Parsley;

      Utils__default.warnOnce('Accessing the method \'' + method + '\' through Validator is deprecated. Simply call \'window.Parsley.' + method + '(...)\'');
      return (_window$Parsley = window.Parsley)[method].apply(_window$Parsley, arguments);
    };
  });

  // ### UI
  // Deprecated global object
  window.Parsley.UI = UI;
  window.ParsleyUI = {
    removeError: function removeError(instance, name, doNotUpdateClass) {
      var updateClass = true !== doNotUpdateClass;
      Utils__default.warnOnce('Accessing UI is deprecated. Call \'removeError\' on the instance directly. Please comment in issue 1073 as to your need to call this method.');
      return instance.removeError(name, { updateClass: updateClass });
    },
    getErrorsMessages: function getErrorsMessages(instance) {
      Utils__default.warnOnce('Accessing UI is deprecated. Call \'getErrorsMessages\' on the instance directly.');
      return instance.getErrorsMessages();
    }
  };
  $.each('addError updateError'.split(' '), function (i, method) {
    window.ParsleyUI[method] = function (instance, name, message, assert, doNotUpdateClass) {
      var updateClass = true !== doNotUpdateClass;
      Utils__default.warnOnce('Accessing UI is deprecated. Call \'' + method + '\' on the instance directly. Please comment in issue 1073 as to your need to call this method.');
      return instance[method](name, { message: message, assert: assert, updateClass: updateClass });
    };
  });

  // ### PARSLEY auto-binding
  // Prevent it by setting `ParsleyConfig.autoBind` to `false`
  if (false !== window.ParsleyConfig.autoBind) {
    $(function () {
      // Works only on `data-parsley-validate`.
      if ($('[data-parsley-validate]').length) { $('[data-parsley-validate]').parsley(); }
    });
  }

  var o = $({});
  var deprecated = function deprecated() {
    Utils__default.warnOnce("Parsley's pubsub module is deprecated; use the 'on' and 'off' methods on parsley instances or window.Parsley");
  };

  // Returns an event handler that calls `fn` with the arguments it expects
  function adapt(fn, context) {
    // Store to allow unbinding
    if (!fn.parsleyAdaptedCallback) {
      fn.parsleyAdaptedCallback = function () {
        var args = Array.prototype.slice.call(arguments, 0);
        args.unshift(this);
        fn.apply(context || o, args);
      };
    }
    return fn.parsleyAdaptedCallback;
  }

  var eventPrefix = 'parsley:';
  // Converts 'parsley:form:validate' into 'form:validate'
  function eventName(name) {
    if (name.lastIndexOf(eventPrefix, 0) === 0) { return name.substr(eventPrefix.length); }
    return name;
  }

  // $.listen is deprecated. Use Parsley.on instead.
  $.listen = function (name, callback) {
    var context;
    deprecated();
    if ('object' === typeof arguments[1] && 'function' === typeof arguments[2]) {
      context = arguments[1];
      callback = arguments[2];
    }

    if ('function' !== typeof callback) { throw new Error('Wrong parameters'); }

    window.Parsley.on(eventName(name), adapt(callback, context));
  };

  $.listenTo = function (instance, name, fn) {
    deprecated();
    if (!(instance instanceof parsley_field) && !(instance instanceof Form)) { throw new Error('Must give Parsley instance'); }

    if ('string' !== typeof name || 'function' !== typeof fn) { throw new Error('Wrong parameters'); }

    instance.on(eventName(name), adapt(fn));
  };

  $.unsubscribe = function (name, fn) {
    deprecated();
    if ('string' !== typeof name || 'function' !== typeof fn) { throw new Error('Wrong arguments'); }
    window.Parsley.off(eventName(name), fn.parsleyAdaptedCallback);
  };

  $.unsubscribeTo = function (instance, name) {
    deprecated();
    if (!(instance instanceof parsley_field) && !(instance instanceof Form)) { throw new Error('Must give Parsley instance'); }
    instance.off(eventName(name));
  };

  $.unsubscribeAll = function (name) {
    deprecated();
    window.Parsley.off(eventName(name));
    $('form,input,textarea,select').each(function () {
      var instance = $(this).data('Parsley');
      if (instance) {
        instance.off(eventName(name));
      }
    });
  };

  // $.emit is deprecated. Use jQuery events instead.
  $.emit = function (name, instance) {
    var _instance;

    deprecated();
    var instanceGiven = instance instanceof parsley_field || instance instanceof Form;
    var args = Array.prototype.slice.call(arguments, instanceGiven ? 2 : 1);
    args.unshift(eventName(name));
    if (!instanceGiven) {
      instance = window.Parsley;
    }
    (_instance = instance).trigger.apply(_instance, _toConsumableArray(args));
  };

  var pubsub = {};

  $.extend(true, Parsley, {
    asyncValidators: {
      'default': {
        fn: function fn(xhr) {
          // By default, only status 2xx are deemed successful.
          // Note: we use status instead of state() because responses with status 200
          // but invalid messages (e.g. an empty body for content type set to JSON) will
          // result in state() === 'rejected'.
          return xhr.status >= 200 && xhr.status < 300;
        },
        url: false
      },
      reverse: {
        fn: function fn(xhr) {
          // If reverse option is set, a failing ajax request is considered successful
          return xhr.status < 200 || xhr.status >= 300;
        },
        url: false
      }
    },

    addAsyncValidator: function addAsyncValidator(name, fn, url, options) {
      Parsley.asyncValidators[name] = {
        fn: fn,
        url: url || false,
        options: options || {}
      };

      return this;
    }

  });

  Parsley.addValidator('remote', {
    requirementType: {
      '': 'string',
      'validator': 'string',
      'reverse': 'boolean',
      'options': 'object'
    },

    validateString: function validateString(value, url, options, instance) {
      var data = {};
      var ajaxOptions;
      var csr;
      var validator = options.validator || (true === options.reverse ? 'reverse' : 'default');

      if ('undefined' === typeof Parsley.asyncValidators[validator]) { throw new Error('Calling an undefined async validator: `' + validator + '`'); }

      url = Parsley.asyncValidators[validator].url || url;

      // Fill current value
      if (url.indexOf('{value}') > -1) {
        url = url.replace('{value}', encodeURIComponent(value));
      } else {
        data[instance.$element.attr('name') || instance.$element.attr('id')] = value;
      }

      // Merge options passed in from the function with the ones in the attribute
      var remoteOptions = $.extend(true, options.options || {}, Parsley.asyncValidators[validator].options);

      // All `$.ajax(options)` could be overridden or extended directly from DOM in `data-parsley-remote-options`
      ajaxOptions = $.extend(true, {}, {
        url: url,
        data: data,
        type: 'GET'
      }, remoteOptions);

      // Generate store key based on ajax options
      instance.trigger('field:ajaxoptions', instance, ajaxOptions);

      csr = $.param(ajaxOptions);

      // Initialise querry cache
      if ('undefined' === typeof Parsley._remoteCache) { Parsley._remoteCache = {}; }

      // Try to retrieve stored xhr
      var xhr = Parsley._remoteCache[csr] = Parsley._remoteCache[csr] || $.ajax(ajaxOptions);

      var handleXhr = function handleXhr() {
        var result = Parsley.asyncValidators[validator].fn.call(instance, xhr, url, options);
        if (!result) // Map falsy results to rejected promise
          { result = $.Deferred().reject(); }
        return $.when(result);
      };

      return xhr.then(handleXhr, handleXhr);
    },

    priority: -1
  });

  Parsley.on('form:submit', function () {
    Parsley._remoteCache = {};
  });

  window.ParsleyExtend.addAsyncValidator = function () {
    Utils.warnOnce('Accessing the method `addAsyncValidator` through an instance is deprecated. Simply call `Parsley.addAsyncValidator(...)`');
    return Parsley.addAsyncValidator.apply(Parsley, arguments);
  };

  // This is included with the Parsley library itself,
  // thus there is no use in adding it to your project.
  Parsley.addMessages('en', {
    defaultMessage: "This value seems to be invalid.",
    type: {
      email: "This value should be a valid email.",
      url: "This value should be a valid url.",
      number: "This value should be a valid number.",
      integer: "This value should be a valid integer.",
      digits: "This value should be digits.",
      alphanum: "This value should be alphanumeric."
    },
    notblank: "This value should not be blank.",
    required: "This value is required.",
    pattern: "This value seems to be invalid.",
    min: "This value should be greater than or equal to %s.",
    max: "This value should be lower than or equal to %s.",
    range: "This value should be between %s and %s.",
    minlength: "This value is too short. It should have %s characters or more.",
    maxlength: "This value is too long. It should have %s characters or fewer.",
    length: "This value length is invalid. It should be between %s and %s characters long.",
    mincheck: "You must select at least %s choices.",
    maxcheck: "You must select %s choices or fewer.",
    check: "You must select between %s and %s choices.",
    equalto: "This value should be the same."
  });

  Parsley.setLocale('en');

  /**
   * inputevent - Alleviate browser bugs for input events
   * https://github.com/marcandre/inputevent
   * @version v0.0.3 - (built Thu, Apr 14th 2016, 5:58 pm)
   * @author Marc-Andre Lafortune <github@marc-andre.ca>
   * @license MIT
   */

  function InputEvent() {
    var _this14 = this;

    var globals = window || global;

    // Slightly odd way construct our object. This way methods are force bound.
    // Used to test for duplicate library.
    $.extend(this, {

      // For browsers that do not support isTrusted, assumes event is native.
      isNativeEvent: function isNativeEvent(evt) {
        return evt.originalEvent && evt.originalEvent.isTrusted !== false;
      },

      fakeInputEvent: function fakeInputEvent(evt) {
        if (_this14.isNativeEvent(evt)) {
          $(evt.target).trigger('input');
        }
      },

      misbehaves: function misbehaves(evt) {
        if (_this14.isNativeEvent(evt)) {
          _this14.behavesOk(evt);
          $(document).on('change.inputevent', evt.data.selector, _this14.fakeInputEvent);
          _this14.fakeInputEvent(evt);
        }
      },

      behavesOk: function behavesOk(evt) {
        if (_this14.isNativeEvent(evt)) {
          $(document) // Simply unbinds the testing handler
          .off('input.inputevent', evt.data.selector, _this14.behavesOk).off('change.inputevent', evt.data.selector, _this14.misbehaves);
        }
      },

      // Bind the testing handlers
      install: function install() {
        if (globals.inputEventPatched) {
          return;
        }
        globals.inputEventPatched = '0.0.3';
        var _arr = ['select', 'input[type="checkbox"]', 'input[type="radio"]', 'input[type="file"]'];
        for (var _i = 0; _i < _arr.length; _i++) {
          var selector = _arr[_i];
          $(document).on('input.inputevent', selector, { selector: selector }, _this14.behavesOk).on('change.inputevent', selector, { selector: selector }, _this14.misbehaves);
        }
      },

      uninstall: function uninstall() {
        delete globals.inputEventPatched;
        $(document).off('.inputevent');
      }

    });
  }

  var inputevent = new InputEvent();

  inputevent.install();

  var parsley = Parsley;

  return parsley;
});
//# sourceMappingURL=parsley.js.map

var parsley;

var validatingForm = {

	enter: function ( route, prevRoute, options ) {
		route.path = "js/app/views/forms/validate/validatingForm";
		route.view = new Ractive( {
			el: options.target,
			template: template$11,
			
			oncomplete: function() {
				console.log("FORM: oncomplete!");
				setupParsley();
			},
			
			onteardown: function() {
				console.log("FORM: onteardown!");
			},
			
			ondestruct: function() {
				console.log("FORM: ondestruct!");
			},

			submit: function () {
				var valid = parsley.validate();
				return false;
			},
			resetData: function () {
				$( '.bs-callout-info' ).addClass( 'hidden' );
				$( '.bs-callout-warning' ).addClass( 'hidden' );
			}
		} );


	},

	leave: function ( route, nextRoute, options ) {
		route.view.teardown();
	}
};

function setupParsley( ) {
		parsley = $( 'form' ).parsley( {
		/*
		 // This comment shows how to use bootstrap's error highlighting
		 }
		 successClass: "has-success",
		 errorClass: "has-error",
		 classHandler: function (field) {
		 return field.$element.closest(".form-group");
		 },
		 errorsWrapper: "<span class='help-block parsley-errors-list'></span>",
		 errorTemplate: "<span></span>"
		 */
		} );
				parsley.on( 'form:validated', function ( form ) {

				// If you want all fields automatically tracked for errors after form submission, uncomment line below
				//setFieldsInvalid(form);
				showFormValidationFeedback( form );
				} );
				parsley.on( 'field:validated', function ( field ) {
				showFormValidationFeedback( field.parent );
				} );
		}

function showFormValidationFeedback( form ) {
var ok = form.isValid( );
		$( '.bs-callout-info' ).toggleClass( 'hidden', !ok );
		$( '.bs-callout-warning' ).toggleClass( 'hidden', ok );
}

var template$12 = "<div class=\"container\" fade-in-out={duration:1500}>\r\n    <div class=\"row\">\r\n\r\n        <div class=\"col-md-12\">\r\n            <h1 style=\"padding-top:30px; padding-bottom:0px;\">Lifecycle <span class=\"highlightLetter\">Events</span></h1>\r\n        </div>\r\n\r\n    </div>\r\n\r\n\r\n    <div class=\"row\">\r\n        <div class=\"col-md-12\">\r\n            Controllers provide a number of lifecycle hooks for you to take action in. To add a hook, simply declare the function on your\r\n            controller: <span class=\"fun\">controller.onInit</span> as shown below.\r\n\r\n            <pre><code  class=\"line-numbers language-js\">function myController() {\r\n\r\n\t\tvar that = {};\r\n\r\n\t\tthat.onInit = function (options) {\r\n        console.log(\"onInit called\", options);\r\n        return new template();\r\n    };\r\n\r\n    that.onRender = function(options) {\r\n        console.log(\"onRender called\", options);\r\n    }\r\n\r\n    that.onComplete = function(options) {\r\n        console.log(\"onComplete called\", options);\r\n    }\r\n\r\n    that.onRemove = function(options) {\r\n        console.log(\"onRemove called\", options);\r\n    }\r\n} </code></pre>\r\n\r\n        </div>\r\n    </div>\r\n    \r\n      <div class=\"row\">\r\n        <div class=\"col-md-12 \">\r\n            <p>Here is the list of controller lifecycle events available and the order in which they are invoked:</p>\r\n            <ul>\r\n                <li><span class=\"met\">onInit</span></li>\r\n                <li><span class=\"met\">onRender</span></li>\r\n                <li><span class=\"met\">onComplete</span></li>\r\n                <li><span class=\"met\">onRemove</span></li>\r\n                <li><span class=\"met\">onUnrender</span></li>\r\n            </ul>\r\n        </div>\r\n    </div>\r\n    \r\n    <div class=\"row\">\r\n        <div class=\"col-md-12 \">\r\n\r\n            <p style=\"margin-top: 20px\">\r\n                <strong>Note:</strong> open the browser console and click\r\n                the <span class='var'>Reload view</span> button below, to see the order of events called.\r\n            </p>\r\n            <p style=\"margin-top: 1 0px\">\r\n                \r\n                <button class=\"btn btn-success\" on-click=\"@.toggle( 'isListening' )\">{{isListening ? \"Stop\" : \"Start\"}} listening</button>\r\n\r\n                <!-- Below we use JS expression to call journey.goto() -->\r\n                <button class=\"btn btn-success\" on-click=\"@.journey.goto('/events', {forceReload: true})\">Reload view</button>\r\n                \r\n                <!-- We invoke -->\r\n                <button class=\"btn btn-success\" on-click=\"@.updateView()\">Update view</button>\r\n\r\n        </div>\r\n    </div>\r\n</div>";

var isListening = false;

var view;

var lifecycleEvents = {

	enter: function ( route, prevRoute, options ) {
		route.path = "js/app/views/lifecycle/events/events";

		// example of a Ractive instance events (oninit and onrender)
		view = route.view = new Ractive( {
			template: template$12,
			el: options.target,
			journey: journey,

			data: { isListening: isListening },

			reloadView: function () {
				journey.goto( "/events", { forceReload: true } );
			},

			updateView: function () {
				var random = Math.random() * 1000;
				journey.goto( "/events?random=" + random );
			},

			onrender: function () {
				// apply code highlighting as soon as DOM is ready, before animation finish
				Prism.highlightAll();
			}
		} );


		route.view.observe( "isListening", function ( newValue, oldValue, keypath ) {
			isListening = newValue;
			isListening ? startListening() : stopListening();
		}, { init: false } );
	},

	leave: function ( route, nextRoute, options ) {
		return route.view.teardown();
	},

	beforeenter: function ( route, prevRoute, options ) {
		// Noop method for demo purposes
	},

	update: function ( route, prevRoute, options ) {
		// Noop method for demo purposes
	}
};

function startListening() {

	journey.on( events.BEFORE_ENTER, function ( options ) {
		console.log( "onBeforeenter", options );
	} );

	journey.on( events.BEFORE_ENTER_COMPLETE, function ( options ) {
		console.log( "onBeforeenterComplete", options );
	} );

	journey.on( events.ENTER, function ( options ) {
		console.log( "onEnter:", options );
	} );

	journey.on( events.ENTERED, function ( options ) {
		console.log( "onEntered", options );
	} );

	journey.on( events.UPDATE, function ( options ) {
		console.log( "onUpdate", options );
	} );

	journey.on( events.UPDATED, function ( options ) {
		console.log( "onUpdated", options );
	} );

	journey.on( events.LEAVE, function ( options ) {
		console.log( "onLeave", options );
	} );

	journey.on( events.LEFT, function ( options ) {
		console.log( "onLeft", options );
	} );

	journey.on( events.ERROR, function ( options ) {
		console.log( "onError", options );
	} );
}

function stopListening() {
	journey.off( events.BEFORE_ENTER );
	journey.off( events.BEFORE_ENTER_COMLETE );
	journey.off( events.ENTER );
	journey.off( events.ENTERED );
	journey.off( events.UPDATE );
	journey.off( events.UPDATED );
	journey.off( events.LEAVE );
	journey.off( events.LEFT );
	journey.off( events.ERROR );
}

var template$13 = "<div class=\"container\" fade-in={duration:1500}>\r\n    <div class=\"row\">\r\n\r\n        <div class=\"col-md-12\">\r\n            <h1 style=\"padding-top:30px; padding-bottom:0px;\">Basic <span class=\"highlightLetter\">Ajax</span></h1>\r\n        </div>\r\n    </div>\r\n    \r\n     <div class=\"row\">\r\n\r\n        <div class=\"col-md-12\">\r\n            <p>In this demo, we show how to perform an Ajax call to fetch data for the view.</p>\r\n            <p>Below is the response returned from the Ajax request:</p>\r\n            \r\n            <pre><code  class=\"line-numbers language-js\">{{response}}</code></pre>\r\n        </div>\r\n    </div>\r\n\r\n    <div class=\"row\">\r\n\r\n        <div class=\"col-md-12\">\r\n            <p>We want to make an Ajax request <span class=\"var\">before</span> we render the view. So, instead of returning a view from the\r\n                <span class=\"met\">onInit</span> method, we return a <span class=\"met\">Promise</span> which <span class=\"var\">resolves</span>\r\n                to the view we want to render. By returning a <span class=\"met\">Promise</span>, we can wait for the Ajax request to complete,\r\n                and pass the response to the view to render. If the ajax call fails, we can <span class=\"var\">reject</span> the promise,\r\n                and the view will not be rendered.\r\n            </p>\r\n            \r\n            <p>\r\n                Below is the code:\r\n            </p>\r\n            \r\n            <pre><code  class=\"line-numbers language-js\">\tthat.onInit = function (options) {\r\n\r\n\t\t\tvar promise = new Promise(function (resolve, reject) {\r\n\r\n\t\t\t\t$.getJSON(\"/data\").then(function (data) {\r\n\t\t\t\t\tvar view = createView(data);\r\n\t\t\t\t\tresolve(view);\r\n\t\t\t\t}, function () {\r\n\t\t\t\t\treject(\"Could not load data for BasicAjax\");\r\n\t\t\t\t});\r\n\t\t\t});\r\n\r\n\t\t\treturn promise;\r\n\t\t};\r\n}); </code></pre>\r\n            \r\n             <p>In <span class=\"ln\">line 3</span> we create a ES6 Promise, which receives the <span class=\"var\">resolve</span> and \r\n                <span class=\"var\">reject</span> callbacks.</p>\r\n            <p>In <span class=\"ln\">line 5</span>, we use jQuery to fetch a <span class=\"var\">JSON</span> file from the server. Once\r\n                the Ajax request is completed, it passes in the response, <span class=\"var\">data</span>.</p>\r\n            <p><span class=\"ln\">Line 6</span> creates the view and passes the data to render.</p>\r\n            <p>Finally in <span class=\"ln\">line 7</span> the promise is <span class=\"var\">resolved</span>, passing the view as argument.</p>\r\n            <p>If the Ajax call failed for some reason, <span class=\"ln\">line 9</span> <span class=\"var\">rejects</span> the promise, \r\n                and the view is not rendered, in other words, we stay at the current view.</p>\r\n            \r\n        </div>\r\n    </div>\r\n\r\n    <div class=\"row\">\r\n        <div class=\"col-md-2\">\r\n            <button class=\"btn btn-success\" on-click=\"@.reload()\">Reload View</button>\r\n        </div>\r\n    </div>\r\n</div>";

var config$5;

var rejectRequest = false;

var basicAjax = {
	
	beforeenter: function ( route, prevRoute, options ) {
		// Return promise for beforeenter
		return $.getJSON( "data/hello.json?delay=2000&reject=" + rejectRequest ).then( function ( response ) {
			return route.data = JSON.stringify( response );

		} ).catch( function ( err ) {
			return route.data = "Could not load data for BasicAjax: [" + err.status + ":" + err.statusText + "]";
		} );
	},

	enter: function ( route, prevRoute, options ) {
		route.path = "js/app/views/ajax/basic/basicAjax";
		config$5 = options;

		route.view = createView$4( route.data );
	},

	leave: function ( route, nextRoute, options ) {
		route.view.teardown( );
	}
};

function createView$4( json ) {

	// Convert the JSON data object to a string representation
	var view = new Ractive( {
		el: config$5.target,
		data: { response: json },
		template: template$13,
		reload: function ( ) {
			journey.go( "/basicAjax", {forceReload: true} );
		}
	} );

	return view;
}

var template$14 = "<div class=\"container\" fade-in={duration:1500}>\r\n    <div class=\"row\">\r\n\r\n        <div class=\"col-md-12\">\r\n            <h1 style=\"padding-top:30px; padding-bottom:0px;\">Ajax <span class=\"highlightLetter\">File Upload</span></h1>\r\n        </div>\r\n    </div>\r\n\r\n    <div class=\"row\">\r\n\r\n        <div class=\"col-md-12\">\r\n            <p>In this demo, we show how to perform an Ajax call to fetch data for the view.</p>\r\n            <p>Below is the response returned from the Ajax request:</p>\r\n\r\n            <div style=\"background-color:#303030;border:none;color:#fff;margin-bottom: 10px\">\r\n                {{#display}}\r\n                <span fade-in=\"{duration:200}\" >{{response}}</span>\r\n                {{else}}\r\n                <span fade-in=\"{duration:200}\">{{msg}}</span>\r\n                {{/display}}\r\n            </div>\r\n        </div>\r\n    </div>\r\n\r\n        <div class=\"row\">\r\n            <div class=\"col-md-12\">\r\n\r\n                <div class=\"well\">\r\n\r\n                    <form>\r\n\r\n                        <div class=\"form-group\">\r\n                            <label for=\"file\">File input</label>\r\n                            <input type=\"file\" id=\"file\">\r\n                        </div>\r\n\r\n                        <button type=\"submit\" class=\"btn btn-raised btn-primary\" on-click=\"@.submit()\">Submit</button>\r\n                        <button type=\"reset\" class=\"btn btn-raised btn-default\" on-click=\"@.resetData()\">Reset</button>\r\n                    </form>\r\n                </div>\r\n            </div>\r\n        </div>\r\n    </div>\r\n";

var config$6;

var view$1;

var upload = {

	enter: function ( route, prevRoute, options ) {
		config$6 = options;
		route.path = "js/app/views/ajax/upload/upload";

		route.view = createView$5( route.data );
	},

	leave: function ( route, nextRoute, options ) {
		route.view.teardown( );
	}
};

function createView$5( json ) {

	// Convert the JSON data objectr to a string representation
	view$1 = new Ractive( {
		el: config$6.target,
		data: { response: json, msg: "Upload a file" },
		template: template$14,
		submit: function ( ) {
			submitForm();
			return false;
		}
	} );

	return view$1;
}

function submitForm( ) {
	view$1.set("display", false);
	view$1.set("msg", "Busy uploading...");

	var files = $( "#file" )[0].files;
	if (files.length === 0) {
		view$1.set("msg", "Please select a file");
		return;
	}

	var data = new FormData();

	$.each( files, function ( key, value ) {
		data.append( key, value );
	} );

	var promise = $.ajax( {
		url: 'data/submitForm?delay=2000',
		type: 'POST',
		data: data,
		cache: false,
		dataType: 'json',
		processData: false, // Don't process the files
		contentType: false // Set content type to false as jQuery will tell the server its a query string request
	} );

	promise.then( function ( data, textStatus, jqXHR ) {
		view$1.set("display", true);
		view$1.set("response", data.msg);

	} ).catch( function ( jqXHR, textStatus, errorThrown ) {
		view$1.set("display", true);
		view$1.set("response", errorThrown);
	} );
}

var template$15 = "<div class=\"container\" fade-in={duration:200}>\r\n    <div class=\"row\">\r\n\r\n        <div class=\"col-md-12\">\r\n            <h1 style=\"padding-top:30px; padding-bottom:0px;\">Basic <span class=\"highlightLetter\">Partial</span></h1>\r\n        </div>\r\n\r\n    </div>\r\n\r\n    <div class=\"row\">\r\n        <div class=\"col-md-12\">\r\n            <p>Partials are template snippets that can be embedded into other templates. See <a href=\"http://docs.ractivejs.org/latest/partials\" class=\"link\">here</a> for details.</p>\r\n            \r\n            <p>Below is an example partial                \r\n            </p>\r\n            \r\n             {{>hello}} \r\n\r\n             <p>Below is the javascript code:</p>\r\n             <pre><code  class=\"line-numbers language-js\"> var helloPartial = require(\"rv!./partial\");\r\n\r\nfunction createView() {\r\n\r\n    var view = new template({\t\t\t\t\r\n        partials: {hello: helloPartial}\r\n    });\r\n    return view;\r\n}</code></pre>\r\n             \r\n             \r\n             <p>In <span class=\"ln\">line 1</span> we <span class=\"fun\">require</span> a partial called <span class=\"var\">helloPartial</span>.\r\n                 Note: we use the <span class=\"var\">rv!</span> plugin instead of the <span class=\"var\">rvc!</span> plugin since we simply\r\n                 want the template, not a component. The <span class=\"var\">rv!</span> plugin compiles the template ready for Ractive to comsume.</p>\r\n             <p><span class=\"ln\">Line 6</span> we register the <span class=\"var\">hello</span> partial which references the <span class=\"var\">helloPartial</span>.</p>\r\n             \r\n             <p>Next we show the template to render a partial:</p>\r\n                 <pre><code  class=\"line-numbers language-markup\"> \\{{>hello}} \r\n</code></pre>\r\n             <p>In <span class=\"ln\">line 1</span> we use <span class=\"var\">></span> character inside a <span class=\"met\">mustache</span>\r\n                 to reference the <span class=\"var\">hello</span> partial.\r\n             </p>\r\n             \r\n             <p>Finally we show the actual partial below:</p>\r\n             \r\n             <pre><code  class=\"line-numbers language-markup\">&lt;h3 class=\"partial\">\r\n    Hi, I am a partial!\r\n&lt;/h3>\r\n</code></pre>\r\n             \r\n        </div>\r\n    </div>\r\n</div>\r\n";

var helloPartial = "<h3 class=\"partial\">\r\n    Hi, I am a partial!\r\n</h3>";

var basicPartial = {
	
	enter: function ( route, prevRoute, options ) {
		route.path = "js/app/views/partial/basic/basicPartial";
		route.view = new Ractive( {
			el: options.target,
			template: template$15,
			partials: {hello: helloPartial}
		} );
	},
	
	leave: function ( route, nextRoute, options ) {
		route.view.teardown();
	}
};

var template$16 = "<div class=\"container\" fade-in={duration:200}>\r\n    <div class=\"row\">\r\n\r\n        <div class=\"col-md-12\">\r\n            <h1 style=\"padding-top:30px; padding-bottom:0px;\">Basic <span class=\"highlightLetter\">Component</span></h1>\r\n        </div>\r\n    </div>\r\n\r\n    <div class=\"row\">\r\n\r\n        <div class=\"col-md-12\">\r\n            <p>In this demo, we show how to create a basic component. While components are really a Ractive feature, \r\n                we will be showcasing it here as well.</p>\r\n\r\n            <p>In this demo we create a very simple <span class=\"fun\">component</span>:\r\n                a <span class=\"var\">&lt;div></span> tag with a <span class=\"var\">label</span> and a\r\n                <span class=\"met\">click</span> action that <span class=\"met\">alerts</span>\r\n                the user.\r\n            </p>\r\n            <p>Below is the component in action!</p>\r\n\r\n            \r\n            <simple message='I am a Component. You can click me!'/>\r\n            \r\n            <div class=\"bs-callout bs-callout-info\" class-hidden=\"hidden\" >{{feedback}}</div>\r\n\r\n        </div>\r\n    </div>\r\n\r\n    <div class=\"row\">\r\n\r\n        <div class=\"col-md-12\">\r\n            <p>Below is the code to create the component:\r\n            </p>\r\n\r\n            <pre><code  class=\"line-numbers language-js\">function createComponent() {\r\n            \r\n\t\t\t var comp = ractive.extend({\r\n                template: '&lt;div on-click=\"activate()\"> \\{{message}} &lt;/div>',\r\n                activate: function() {\r\n                    alert(\"Active!\");\r\n                },\r\n                data: {\r\n                    // A default message if none is provided\r\n                    message: 'No message specified, using the default'\r\n                }\r\n            });\r\n};</code></pre>\r\n            \r\n            <p>Looking at the code above, you'll note that a Ractive <span class=\"fun\">component</span>\r\n                is just a normal Ractive instance. <span class=\"ln\">Line 4</span>\r\n                shows the <span class=\"var\">template</span>, <span class=\"ln\">line 5</span>\r\n                a <span class=\"fun\">method</span> to invoke, and <span class=\"ln\">line 8</span> a \r\n                <span class=\"var\">data</span> object.\r\n            </p>\r\n            \r\n            <p>What turns a ractive instance into a <span class=\"fun\">component</span>\r\n            is when it referenced inside another ractive instance, as show below:</p>\r\n            \r\n                        <pre><code  class=\"line-numbers language-js\">function createView() {\r\n    var comp = createComponent():\r\n    var view = new template({\r\n        components: {\r\n            simple: comp\r\n        }\r\n    });\r\n};\r\n</code></pre>\r\n            \r\n            <p><span class=\"ln\">Line 4</span> registers the ractive\r\n            components, as key/value pairs.</p>\r\n            <p><span class=\"ln\">Line 5</span> we register a component called\r\n                <span class=\"var\">simple</span> which references the <span class=\"fun\">comp</span>\r\n                instance. <span class=\"var\">simple</span> becomes a new <span class=\"var\">tag</span>\r\n                that we can reference in our template:\r\n            </p>\r\n            \r\n            <pre><code  class=\"line-numbers language-markup\">&lt;simple message='Click to activate!'/>\r\n</code></pre>\r\n            <p><span class=\"ln\">Line 1</span> shows how to specify the component\r\n            in our html markup. The name of the tag is the same used when\r\n            registering our component.\r\n            </p>\r\n            <p>We can set the component <span class=\"var\">message</span> as an\r\n            attribute.</p>            \r\n\r\n        </div>\r\n    </div>\r\n</div>";

var basicComp = {

	enter: function ( route, prevRoute, options ) {
		route.path = "js/app/views/comp/basic/basicComp";
		route.view = createView$6( options );
	},

	leave: function ( route, nextRoute, options ) {
		route.view.teardown();
	}
};

function createView$6( options ) {

	var component = Ractive.extend( {
		template: '<div on-click="@.activate()" class="comp" style="cursor: pointer">{{message}}</div>',

		activate: function activate () {
			// We reference the parent ractive instance through "comp.parent" and set the parent data variables, hidden and feedback
			this.root.set( "hidden", false );
			this.root.set( "feedback", "Component clicked!" );
		}
	} );

	var view = new Ractive( {
		el: options.target,
		template: template$16,
		data: { hidden: true },

		// We register our component as "simple"
		components: {
			simple: component
		}
	} );
	
	//view.attachChild(component, {target: "simple"});

	return view;
}

var template$17 = "<div class=\"container\" fade-in={duration:200}>\r\n    <div class=\"row\">\r\n\r\n        <div class=\"col-md-12\">\r\n            <h1 style=\"padding-top:30px; padding-bottom:0px;\">Multiple <span class=\"highlightLetter\">Components</span></h1>\r\n        </div>\r\n    </div>\r\n\r\n    <div class=\"row\">\r\n\r\n        <div class=\"col-md-12\">\r\n            <p>This demo shows how to switch between multiple components.</p>\r\n\r\n            <p>It is rather simple, as Ractive does all the heavy lifting.\r\n            </p>\r\n            <p>Below are two components in action. Click the buttons to switch between the components.</p>\r\n\r\n            <p>\r\n                <#components />\r\n            \r\n            </p>\r\n            \r\n            <p>\r\n            <button class=\"btn btn-success\" on-click=\"@.swap('compA')\">Render Component A</button>\r\n            \r\n            <button class=\"btn btn-danger\" on-click=\"@.swap('compB')\">Render Component B</button>\r\n            </p>\r\n            \r\n        </div>\r\n    </div>\r\n\r\n    <div class=\"row\">\r\n\r\n        <div class=\"col-md-12\">\r\n            <p>All we do is put the two components in a <span class=\"var\">conditional mustacache</span>\r\n                and Ractive will switch between the two components.\r\n            </p>\r\n            <p>Below is the Javascript:</p>\r\n\r\n            <pre><code  class=\"line-numbers language-js\"> function createView(data) {\r\n            \r\n            var compA = ractive.extend({\r\n                template: '&lt;div class=\"comp\">I am component A&lt;/div>'\r\n            });\r\n            \r\n            var compB = ractive.extend({\r\n                template: '&lt;div class=\"comp compB\">I am component B&lt;/div>'\r\n            });\r\n\r\n            var view = new template({\r\n\r\n                components: {\r\n                    compA: compA,\r\n                    compB: compB\r\n                },\r\n                \r\n                data: {\r\n                    componentName: 'A'\r\n                }\r\n            });\r\n\r\n            return view;\r\n        }</code></pre>\r\n            \r\n            <p>We create two components, <span class=\"fun\">compA</span> and <span class=\"fun\">compB</span>\r\n                in <span class=\"ln\">lines 3 & 7</span> respectively.                \r\n            </p>\r\n            <p>In <span class=\"ln\">lines 14 & 15</span> we register the two components with\r\n                the view.\r\n            </p>\r\n            <p><span class=\"ln\">Line 19</span> sets the <span class=\"var\">componentName</span>\r\n                data variable to <span class=\"var\">'A'</span>.\r\n            </p>\r\n            \r\n            <p>Below is the html template:</p>\r\n            \r\n            <pre><code  class=\"line-numbers language-markup\">\\{{#if componentName == 'A'}}\r\n    &lt;compA/>\r\n\\{{else}}\r\n    &lt;compB/>\r\n\\{{/if}}\r\n\r\n&lt;button on-click=\"set('componentName', 'A')\">Render Component A&lt;/button>\r\n            \r\n&lt;button on-click=\"set('componentName', 'B')\">Render Component B&lt;/button>\r\n</code></pre>\r\n            <p>In <span class=\"ln\">line 1</span> we use a conditional statement to\r\n                check the value of <span class=\"var\">componentName</span>.\r\n                \r\n            <p><span class=\"ln\">Line 2</span> we render <span class=\"var\">compA</span>\r\n                otherwise in <span class=\"ln\">line 4</span> we render <span class=\"var\">compB</span>.\r\n            </p>\r\n            \r\n            <p><span class=\"ln\">Line 7 & 9</span> shows two buttons, that when clicked\r\n                <span class=\"fun\">sets</span> the value of the <span class=\"var\">componentName</span>\r\n                variable to either <span class=\"var\">'A'</span> or <span class=\"var\">'B'</span>.\r\n            <p>Changing the value of the <span class=\"var\">componentName</span> variable\r\n                will render either <span class=\"var\">compA</span> or <span class=\"var\">compB</span>.\r\n            </p>\r\n      \r\n\r\n        </div>\r\n    </div>\r\n</div>";

var multipleComp = {

	enter: function ( route, prevRoute, options ) {
		route.path = "js/app/views/comp/multiple/multipleComp";

		route.view = createView$7( options );
	},

	leave: function ( route, nextRoute, options ) {
		route.view.teardown();
	}
};

function createView$7( options ) {

	var compA = new Ractive( {
		template: '<div class="comp">I am component A</div>'
	} );

	var compB = new Ractive( {
		template: '<div class="comp compB">I am component B</div>'
	} );

	var components = {
		"compA": compA,
		"compB": compB
	};
	
	var comp;

	var view = new Ractive( {
		el: options.target,
		template: template$17,

		swap: function swap( name ) {

			if (comp) { this.detachChild( comp ); }
			comp = components[name];
			this.attachChild( comp, { target: "components", insertAt: 0 } );
		}
	} );

	return view;
}

var template$18 = "<div class=\"container\">\r\n    <div class=\"row\">\r\n\r\n        <div class=\"col-md-12\">\r\n            <h1 style=\"padding-top:30px; padding-bottom:0px;\">Publish/Subscribe for <span class=\"highlightLetter\">Components</span></h1>\r\n        </div>\r\n    </div>\r\n\r\n    <div class=\"row\">\r\n\r\n        <div class=\"col-md-12\">\r\n            <p>This demo shows a variety of ways one can listen to events fired from a component.\r\n\r\n            <p>In this demo we create a <span class=\"var\">Grid</span> <span class=\"fun\">component</span> with two actions (buttons), one to\r\n                <span class=\"met\">add</span> a new row, the other to <span class=\"met\">remove</span> an existing\r\n                row. The <span class=\"var\">Grid</span> <span class=\"met\">publishes (fires)</span> two events in correspondence to <span class=\"met\">add</span>\r\n                and <span class=\"met\">remove</span> actions, namely the <span class=\"var\">public.add</span> event and the <span class=\"var\">public.remove</span>\r\n                event. Listeners can subscribe to these events using <a href=\"http://docs.ractivejs.org/edge/ractive-on\" target=\"_blank\" class=\"link\">ractive.on</a>.\r\n            </p>\r\n            <p>Note: The <span class=\"met\">.public</span> namespace is not a best practice, but simply to illustrate that the events are for \r\n                public use by subscribers of the grid component.\r\n            </p>\r\n\r\n            <p>Let's see the component in action. Open your browser console to see the events fired from the [component] and received by the [parent] view:</p>\r\n\r\n            <grid on-public.add=\"@.handleAdd($0)\"/>\r\n            \r\n            \r\n            <p>Let's look at some code.</p>\r\n            \r\n            <p>Grid.js</p>\r\n            \r\n            <pre><code  class=\"line-numbers language-js\"> var data = {\r\n    rows: [\r\n        {name: \"Bob\", age: 20, id: 11},\r\n        {name: \"Steve\", age: 30, id: 12},\r\n        {name: \"James\", age: 40, id: 13},\r\n        {name: \"Henry\", age: 50, id: 14}\r\n    ]\r\n};\r\n\r\n var grid = template.extend({\r\n\r\n    // The onrender lifecycle event\r\n    onrender: function () {\r\n\r\n        // public.remove and public.add are public events that subscribers can listen to,\r\n        // even the grid component itself\r\n                \r\n        // Here we subscribe to the remove event\r\n        this.on(\"public.remove\", function (id, index) {\r\n            var row = data.rows[index];\r\n\r\n            // We remove the row from data rows array\r\n            this.splice(\"rows\", index, 1);\r\n        });\r\n    },\r\n            \r\n    // Unlike subscribing to the remove event, we declare an 'add' method\r\n    // for the template to call and then 'fire' the public.add event\r\n    add: function (row) {\r\n\r\n    // We add the new row to the data rows array\r\n    this.push(\"rows\", row);\r\n\r\n    // Fire public.add event for listeners to act upon\r\n        this.fire(\"public.add\", row);\r\n    },\r\n\r\n    data: function () {\r\n        return data;\r\n    }\r\n});</code></pre>\r\n            \r\n            <p>In <span class=\"ln\">line 10</span> we create a grid component.\r\n            </p>\r\n            <p><span class=\"ln\">line 19</span> we register to the <span class=\"var\">public.remove</span> event.\r\n                This event is published (fired) in the <span class=\"var\">Grid.html</span> template, below. The <span class=\"var\">public.remove</span>\r\n                event is passed two arguments, <span class=\"var\">id</span> of the person, and <span class=\"var\">index</span> of the person in the data array to remove.\r\n            </p>\r\n            <p>In <span class=\"ln\">Line 29</span>, instead of subscribing to the <span class=\"var\">public.add</span> event as we did above, we call the \r\n                <span class=\"met\">add</span> method directly from the <span class=\"var\">Grid.html</span> template below. This is how we have been invoking methods from templates\r\n                in the previous examples. \r\n            </p>\r\n            <p>We want to alert users of our grid component to receive the add event as well, so in <span class=\"ln\">Line 35</span>, we publish the <span class=\"var\">public.add</span>\r\n                event and pass the row as an argument.\r\n            </p>\r\n            \r\n            <p>Grid.html</p>\r\n            \r\n<pre><code  class=\"line-numbers language-markup\"> \r\n&lt;table class='table'>\r\n    &lt;thead>\r\n        &lt;tr>\r\n\r\n            &lt;th>Name&lt;/th>\r\n            &lt;th>Age&lt;/th>                \r\n            &lt;th>Delete&lt;/th>  \r\n        &lt;/tr>\r\n    &lt;/thead>\r\n\r\n    &lt;tbody>\r\n        \\{{#rows:i}}\r\n        &lt;tr>\r\n            &lt;td>{{name}}&lt;/td>\r\n            &lt;td>{{age}}v/td>\r\n            &lt;td>\r\n                &lt;button class=\"btn btn-danger\" on-click=\"fire('public.remove', id, i)\">Remove&lt;/button>\r\n            &lt;/td>\r\n        &lt;/tr>\r\n        \\{{/rows}}\r\n    &lt;/tbody>\r\n&lt;/table>\r\n\r\n&lt;button class=\"btn btn-success\" on-click=\"add({name: 'Default', age: 10})\">Add row&lt;/button>\r\n</code></pre>\r\n            \r\n            <p>In <span class=\"ln\">line 18</span> we <span class=\"met\">fire</span> the <span class=\"var\">public.remove</span>\r\n                event and pass in <span class=\"met\">id</span> and <span class=\"met\">index of the row</span> as arguments.\r\n                Because we <span class=\"met\">fire</span> the event, anyone can subscribe (listen) to the event, event the <span class=\"var\">Grid</span>\r\n                component itself, as is done <span class=\"ln\">line 19</span> of the previous code snippet.\r\n            </p>\r\n            <p>In <span class=\"ln\">line 25</span> instead of firing an event we call the <span class=\"met\">add</span>\r\n                method of the <span class=\"var\">Grid</span> component, passing the a row object consisting of a <span class=\"fun\">name</span>\r\n                and <span class=\"fun\">id</span>.\r\n            </p>\r\n\r\n        </div>\r\n    </div>\r\n\r\n    <div class=\"row\">\r\n\r\n        <div class=\"col-md-12\">\r\n            <p>Below is the view where we use the grid.\r\n            </p>\r\n            <p>comp-pusub.js:</p>\r\n\r\n            <pre><code  class=\"line-numbers language-js\"> function createView() {\r\n\r\n    var view = new template({\r\n        components: {\r\n            grid: gridComponent\r\n        },\r\n\r\n        handleAdd: function (row) {\r\n            // handleAddRow is called from the template as: on-public.add=\"handleAdd($1)\r\n            // $1 is a mapping to the first argument that the grid component 'public.add' event passed along\r\n            // Other arguments would be mapped as $2, $3 or all with (...arguments)\r\n\r\n            // If we want to invoke API on the grid, we can get a reference to the\r\n            // component as follows:\r\n            var comp = this.findComponent(\"grid\");\r\n        }\r\n    });\r\n\r\n    // Subscribe to the public.remove event fired by the Grid component, note we use the 'grid.' namespace to\r\n    // listen to the public.remove event of the grid component\r\n    view.on(\"grid.public.remove\", function (id, index) {\r\n        console.log(\"[parent] on('grid.public.remove') invoked with arguments, id:\", id, \"index:\", index);\r\n    });\r\n\r\n    // We can also subsribe to all public.remove events from all components using the '*.' notation.\r\n        view.on(\"*.public.remove\", function (id, index) {\r\n            console.log(\"[parent] on('*.public.remove') invoked with arguments:, id:\", id, \"index:\", index);\r\n        });\r\n\r\n    return view;\r\n}</code></pre>\r\n            <p>Above we show a number of ways we can <span class=\"met\">subscribe</span> to events <span class=\"met\">published</span> by the grid component.</p>\r\n            \r\n            <p>In <span class=\"ln\">line 5</span> we register the <span class=\"var\">grid</span> component\r\n                on the view.\r\n            </p>\r\n            <p><span class=\"ln\">Line 8</span> is a method which is called from the view template directly based on the <span class=\"var\">public.add</span>\r\n                published from the grid. See the <span class=\"met\">comp-pubsub.html</span> template below on how this method is called.</p>\r\n            <p><span class=\"ln\">Line 21</span> shows how to subscribe to the <span class=\"var\">public.remove</span> event using <span class=\"ln\">ractie.on</span>.\r\n                Note that we use the namespace, <span class=\"var\">grid.</span>, to specify where the <span class=\"var\">public.remove</span> event comes from.\r\n            </p>\r\n            <p>\r\n                <span class=\"ln\">Line 26</span> we show how to subscribe to the <span class=\"var\">public.remove</span> event using the\r\n                <span class=\"var\">*.</span> namespace. <span class=\"var\">*.</span> allows us to listen to any <span class=\"var\">public.remove</span>\r\n                event, fired from any component in our view.                \r\n            </p>\r\n\r\n            <p>Here is the view markup, comp-pubsub.html:</p>            \r\n          \r\n            <pre><code  class=\"line-numbers language-markup\">&lt;grid on-public.add=\"handleAdd($1)\"/>\r\n</code></pre>\r\n            <p><span class=\"ln\">Line 1</span> shows the markup to render the grid. We can use the attribute <span class=\"var\">on-&lt;event></span>\r\n                to listen to events published (fired) from components.\r\n            </p>\r\n            <p>Since the grid component fires the event <span class=\"var\">public.add</span> we can set an attribute <span class=\"var\">on-public.add</span>\r\n                to handle the event. In this case we invoke the <span class=\"met\">handleAdd</span> method of our view. Note that since the <span class=\"var\">public.add</span>\r\n                event passes an argument, we need to map that argument to our method, otherwise the argument won't be passed along.\r\n            </p>\r\n            <p>We use the <span class=\"var\">$1</span> placeholder to mark the first argument from the <span class=\"var\">public.add</span> method to pass \r\n                to the <span class=\"met\">handleAdd</span> method. Other arguments can be marked as, <span class=\"var\">$2</span>, <span class=\"var\">$3</span> etc.\r\n                The argument placeholders can be reordered to fit your handler function.\r\n            </p>\r\n            \r\n            <p>Just like the spread operator in Javascript, we can use <span class=\"var\">...arguments</span> to reference all arguments.</p>\r\n        </div>\r\n    </div>\r\n</div>";

var template$19 = "<div class=\"row\">\r\n    <div class=\"col-md-2\">\r\n        <table class='table'>\r\n            <thead>\r\n                <tr>\r\n\r\n                    <th>Name</th>\r\n                    <th>Age</th>                \r\n                    <th>Delete</th>  \r\n                </tr>\r\n            </thead>\r\n\r\n            <tbody>\r\n                {{#rows:i}}\r\n                <tr>\r\n                    <td>{{name}}</td>\r\n                    <td>{{age}}</td>\r\n                    <td>\r\n                        <button class=\"btn btn-danger\" on-click=\"@.fire('public.remove', @context, id, i)\">Remove</button>\r\n                    </td>\r\n\r\n                </tr>\r\n\r\n\r\n                {{/rows}}\r\n            </tbody>\r\n        </table>\r\n    </div>\r\n</div>\r\n\r\n<div class=\"row\">\r\n    <div class=\"col-md-2\">\r\n        <button class=\"btn btn-success\" on-click=\"addRow({name: 'Default', age: 10})\">Add row</button>\r\n    </div>\r\n</div>\r\n";

var data$1 = {
	rows: [
		{ name: "Bob", age: 20, id: 11 },
		{ name: "Steve", age: 30, id: 12 },
		{ name: "James", age: 40, id: 13 },
		{ name: "Henry", age: 50, id: 14 }
	]
};
var component = Ractive.extend( {
	template: template$19,
	onrender: function () {

		// public.remove and public.add are public events that subscribers can listen to,
		// even the grid component itself

		// Here we subscribe to the remove event
		this.on( "public.remove", function ( ctx, id, index ) {
			var row = data$1.rows[index];
			// The component can listen on the public remove event
			console.log( "[component] on('public.remove') invoked with arguments:", row );
			this.splice( "rows", index, 1 );
		} );
	},

	// Unlike subscribing to the remove event, we declare an 'add' method
	// for the template to call and then 'fire' the public.addRow event
	addRow: function ( row ) {
		console.log( "[component] add(row) method invoked wih arguments:", row );
		this.push( "rows", row );
		console.log( "[component] firing 'public.add' event for subscribers, with arguments:", row );
		// Fire event for listeners to act upon
		this.fire( "public.addRow", row );
	},
	data: function () {
		return data$1;
	}
} );

var compPubSub = {

	enter: function ( route, prevRoute, options ) {
		route.path = "js/app/views/comp/pubsub/compPubSub";
		route.view = createView$8( options );
	},

	leave: function ( route, nextRoute, options ) {
		route.view.teardown();
	}
};


function createView$8(options) {

	var view = new Ractive( {
		el: options.target,
		template: template$18,
		components: {
			grid: component
		},
		handleAdd: function ( row ) {
			// handleAddRow is called from the template as: on-public.add="handleAdd($1)
			// $1 is a mapping to the first argument that the grid component 'public.add' event passed along
			// Other arguments would be mapped as $2, $3 or all with (...arguments)
			console.log( "[parent] <grid on-public.add=\"handleAddRow($1)\>: invoked with arguments:", row );

			// If we want to invoke API on the grid, we can get a reference to the
			// component as follows:
			var comp = this.findComponent( "grid" );
		}
	} );

	// Subscribe to the public.remove event fired by the Grid component, note we use the 'grid.' namespace to
	// listen to the public.remove event of the grid component
	view.on( "grid.public.remove", function ( ctx, id, index ) {
		console.log( "[parent] on('grid.public.remove') invoked with arguments, id:", id, "index:", index );
	} );

	// We can also subsribe to all public.remove events from all components using the '*.' notation.
	view.on( "*.public.remove", function ( ctx, id, index ) {
		console.log( "[parent] on('*.public.remove') invoked with arguments:, id:", id, "index:", index );
	} );


	return view;
}

var template$20 = "<div class=\"container\" >\r\n\r\n    <div class=\"row\">\r\n\r\n        <div class=\"col-md-12\" fade-in-out>\r\n            <h1 style=\"padding-top:30px; padding-bottom:0px;\">Basic <span class=\"highlightLetter\">Transition (fade)</span></h1>\r\n        </div>\r\n    </div>\r\n\r\n\r\n    <div class=\"row\">\r\n        <div class=\"col-md-12\">\r\n            \r\n            <button type=\"button\" class=\"btn btn-success\"  on-click=\"@.loadView()\">Test view</button> (this will reload the current view!)           \r\n        </div>\r\n\r\n    </div>\r\n</div>\r\n";

var basicTransition = {

	enter: function ( route, prevRoute, options ) {
		route.path = "js/app/views/transition/basic/basicTransition";
		route.view = new Ractive( {
			el: options.target,
			template: template$20, loadView: function () {
				journey.goto( "/basicTransition", { forceReload: true } );
			},
			transitions: {
				fade: fade
			}
		} );
	},

	leave: function ( route, nextRoute, options ) {
		route.view.teardown();
	}
};

home.path = "js/app/views/home/home";
journey.add("/home", home);
journey.add("/basic", basic);
journey.add("/methods", methods);
journey.add("/binding", binding);
journey.add("/navTargetParams/:id", navTargetParams);	
journey.add("/navTarget", navTarget);
journey.add("/redirect", redirect);
journey.add("/redirectTarget", redirectTarget);
journey.add("/nav", nav);
journey.add("/", home);
journey.add("/notFound", notFound);
journey.add("/basicForm", basicForm);
journey.add("/validatingForm", validatingForm);
journey.add("/events", lifecycleEvents);
journey.add("/basicAjax", basicAjax);
journey.add("/upload", upload);
journey.add("/basicPartial", basicPartial);
journey.add("/basicComp", basicComp);
journey.add("/multipleComp", multipleComp);
journey.add("/pubSubComp", compPubSub);
journey.add("/pubSubComp", compPubSub);
journey.add("/basicTransition", basicTransition);


///export default routes;

(function() {
  var AjaxMonitor, Bar, DocumentMonitor, ElementMonitor, ElementTracker, EventLagMonitor, Evented, Events, NoTargetError, Pace, RequestIntercept, SOURCE_KEYS, Scaler, SocketRequestTracker, XHRRequestTracker, animation, avgAmplitude, bar, cancelAnimation, cancelAnimationFrame, defaultOptions, extend, extendNative, getFromDOM, getIntercept, handlePushState, ignoreStack, init, now, options, requestAnimationFrame, result, runAnimation, scalers, shouldIgnoreURL, shouldTrack, source, sources, uniScaler, _WebSocket, _XDomainRequest, _XMLHttpRequest, _i, _intercept, _len, _pushState, _ref, _ref1, _replaceState,
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) { child[key] = parent[key]; } } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) {
    var this$1 = this;
 for (var i = 0, l = this.length; i < l; i++) { if (i in this$1 && this$1[i] === item) { return i; } } return -1; };

  defaultOptions = {
    catchupTime: 100,
    initialRate: .03,
    minTime: 250,
    ghostTime: 100,
    maxProgressPerFrame: 20,
    easeFactor: 1.25,
    startOnPageLoad: true,
    restartOnPushState: true,
    restartOnRequestAfter: 500,
    target: 'body',
    elements: {
      checkInterval: 100,
      selectors: ['body']
    },
    eventLag: {
      minSamples: 10,
      sampleCount: 3,
      lagThreshold: 3
    },
    ajax: {
      trackMethods: ['GET'],
      trackWebSockets: true,
      ignoreURLs: []
    }
  };

  now = function() {
    var _ref;
    return (_ref = typeof performance !== "undefined" && performance !== null ? typeof performance.now === "function" ? performance.now() : void 0 : void 0) != null ? _ref : +(new Date);
  };

  requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

  cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

  if (requestAnimationFrame == null) {
    requestAnimationFrame = function(fn) {
      return setTimeout(fn, 50);
    };
    cancelAnimationFrame = function(id) {
      return clearTimeout(id);
    };
  }

  runAnimation = function(fn) {
    var last, tick;
    last = now();
    tick = function() {
      var diff;
      diff = now() - last;
      if (diff >= 33) {
        last = now();
        return fn(diff, function() {
          return requestAnimationFrame(tick);
        });
      } else {
        return setTimeout(tick, 33 - diff);
      }
    };
    return tick();
  };

  result = function() {
    var args, key, obj;
    obj = arguments[0], key = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
    if (typeof obj[key] === 'function') {
      return obj[key].apply(obj, args);
    } else {
      return obj[key];
    }
  };

  extend = function() {
    var key, out, source, sources, val, _i, _len;
    out = arguments[0], sources = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    for (_i = 0, _len = sources.length; _i < _len; _i++) {
      source = sources[_i];
      if (source) {
        for (key in source) {
          if (!__hasProp.call(source, key)) { continue; }
          val = source[key];
          if ((out[key] != null) && typeof out[key] === 'object' && (val != null) && typeof val === 'object') {
            extend(out[key], val);
          } else {
            out[key] = val;
          }
        }
      }
    }
    return out;
  };

  avgAmplitude = function(arr) {
    var count, sum, v, _i, _len;
    sum = count = 0;
    for (_i = 0, _len = arr.length; _i < _len; _i++) {
      v = arr[_i];
      sum += Math.abs(v);
      count++;
    }
    return sum / count;
  };

  getFromDOM = function(key, json) {
    var data, e, el;
    if (key == null) {
      key = 'options';
    }
    if (json == null) {
      json = true;
    }
    el = document.querySelector("[data-pace-" + key + "]");
    if (!el) {
      return;
    }
    data = el.getAttribute("data-pace-" + key);
    if (!json) {
      return data;
    }
    try {
      return JSON.parse(data);
    } catch (_error) {
      e = _error;
      return typeof console !== "undefined" && console !== null ? console.error("Error parsing inline pace options", e) : void 0;
    }
  };

  Evented = (function() {
    function Evented() {}

    Evented.prototype.on = function(event, handler, ctx, once) {
      var _base;
      if (once == null) {
        once = false;
      }
      if (this.bindings == null) {
        this.bindings = {};
      }
      if ((_base = this.bindings)[event] == null) {
        _base[event] = [];
      }
      return this.bindings[event].push({
        handler: handler,
        ctx: ctx,
        once: once
      });
    };

    Evented.prototype.once = function(event, handler, ctx) {
      return this.on(event, handler, ctx, true);
    };

    Evented.prototype.off = function(event, handler) {
      var this$1 = this;

      var i, _ref, _results;
      if (((_ref = this.bindings) != null ? _ref[event] : void 0) == null) {
        return;
      }
      if (handler == null) {
        return delete this.bindings[event];
      } else {
        i = 0;
        _results = [];
        while (i < this.bindings[event].length) {
          if (this$1.bindings[event][i].handler === handler) {
            _results.push(this$1.bindings[event].splice(i, 1));
          } else {
            _results.push(i++);
          }
        }
        return _results;
      }
    };

    Evented.prototype.trigger = function() {
      var this$1 = this;

      var args, ctx, event, handler, i, once, _ref, _ref1, _results;
      event = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if ((_ref = this.bindings) != null ? _ref[event] : void 0) {
        i = 0;
        _results = [];
        while (i < this.bindings[event].length) {
          _ref1 = this$1.bindings[event][i], handler = _ref1.handler, ctx = _ref1.ctx, once = _ref1.once;
          handler.apply(ctx != null ? ctx : this$1, args);
          if (once) {
            _results.push(this$1.bindings[event].splice(i, 1));
          } else {
            _results.push(i++);
          }
        }
        return _results;
      }
    };

    return Evented;

  })();

  Pace = window.Pace || {};

  window.Pace = Pace;

  extend(Pace, Evented.prototype);

  options = Pace.options = extend({}, defaultOptions, window.paceOptions, getFromDOM());

  _ref = ['ajax', 'document', 'eventLag', 'elements'];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    source = _ref[_i];
    if (options[source] === true) {
      options[source] = defaultOptions[source];
    }
  }

  NoTargetError = (function(_super) {
    __extends(NoTargetError, _super);

    function NoTargetError() {
      _ref1 = NoTargetError.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    return NoTargetError;

  })(Error);

  Bar = (function() {
    function Bar() {
      this.progress = 0;
    }

    Bar.prototype.getElement = function() {
      var targetElement;
      if (this.el == null) {
        targetElement = document.querySelector(options.target);
        if (!targetElement) {
          throw new NoTargetError;
        }
        this.el = document.createElement('div');
        this.el.className = "pace pace-active";
        document.body.className = document.body.className.replace(/pace-done/g, '');
        document.body.className += ' pace-running';
        this.el.innerHTML = '<div class="pace-progress">\n  <div class="pace-progress-inner"></div>\n</div>\n<div class="pace-activity"></div>';
        if (targetElement.firstChild != null) {
          targetElement.insertBefore(this.el, targetElement.firstChild);
        } else {
          targetElement.appendChild(this.el);
        }
      }
      return this.el;
    };

    Bar.prototype.finish = function() {
      var el;
      el = this.getElement();
      el.className = el.className.replace('pace-active', '');
      el.className += ' pace-inactive';
      document.body.className = document.body.className.replace('pace-running', '');
      return document.body.className += ' pace-done';
    };

    Bar.prototype.update = function(prog) {
      this.progress = prog;
      return this.render();
    };

    Bar.prototype.destroy = function() {
      try {
        this.getElement().parentNode.removeChild(this.getElement());
      } catch (_error) {
        NoTargetError = _error;
      }
      return this.el = void 0;
    };

    Bar.prototype.render = function() {
      var el, key, progressStr, transform, _j, _len1, _ref2;
      if (document.querySelector(options.target) == null) {
        return false;
      }
      el = this.getElement();
      transform = "translate3d(" + this.progress + "%, 0, 0)";
      _ref2 = ['webkitTransform', 'msTransform', 'transform'];
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        key = _ref2[_j];
        el.children[0].style[key] = transform;
      }
      if (!this.lastRenderedProgress || this.lastRenderedProgress | 0 !== this.progress | 0) {
        el.children[0].setAttribute('data-progress-text', "" + (this.progress | 0) + "%");
        if (this.progress >= 100) {
          progressStr = '99';
        } else {
          progressStr = this.progress < 10 ? "0" : "";
          progressStr += this.progress | 0;
        }
        el.children[0].setAttribute('data-progress', "" + progressStr);
      }
      return this.lastRenderedProgress = this.progress;
    };

    Bar.prototype.done = function() {
      return this.progress >= 100;
    };

    return Bar;

  })();

  Events = (function() {
    function Events() {
      this.bindings = {};
    }

    Events.prototype.trigger = function(name, val) {
      var this$1 = this;

      var binding, _j, _len1, _ref2, _results;
      if (this.bindings[name] != null) {
        _ref2 = this.bindings[name];
        _results = [];
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
          binding = _ref2[_j];
          _results.push(binding.call(this$1, val));
        }
        return _results;
      }
    };

    Events.prototype.on = function(name, fn) {
      var _base;
      if ((_base = this.bindings)[name] == null) {
        _base[name] = [];
      }
      return this.bindings[name].push(fn);
    };

    return Events;

  })();

  _XMLHttpRequest = window.XMLHttpRequest;

  _XDomainRequest = window.XDomainRequest;

  _WebSocket = window.WebSocket;

  extendNative = function(to, from) {
    var e, key, _results;
    _results = [];
    for (key in from.prototype) {
      try {
        if ((to[key] == null) && typeof from[key] !== 'function') {
          if (typeof Object.defineProperty === 'function') {
            _results.push(Object.defineProperty(to, key, {
              get: function() {
                return from.prototype[key];
              },
              configurable: true,
              enumerable: true
            }));
          } else {
            _results.push(to[key] = from.prototype[key]);
          }
        } else {
          _results.push(void 0);
        }
      } catch (_error) {
        e = _error;
      }
    }
    return _results;
  };

  ignoreStack = [];

  Pace.ignore = function() {
    var args, fn, ret;
    fn = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    ignoreStack.unshift('ignore');
    ret = fn.apply(null, args);
    ignoreStack.shift();
    return ret;
  };

  Pace.track = function() {
    var args, fn, ret;
    fn = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    ignoreStack.unshift('track');
    ret = fn.apply(null, args);
    ignoreStack.shift();
    return ret;
  };

  shouldTrack = function(method) {
    var _ref2;
    if (method == null) {
      method = 'GET';
    }
    if (ignoreStack[0] === 'track') {
      return 'force';
    }
    if (!ignoreStack.length && options.ajax) {
      if (method === 'socket' && options.ajax.trackWebSockets) {
        return true;
      } else if (_ref2 = method.toUpperCase(), __indexOf.call(options.ajax.trackMethods, _ref2) >= 0) {
        return true;
      }
    }
    return false;
  };

  RequestIntercept = (function(_super) {
    __extends(RequestIntercept, _super);

    function RequestIntercept() {
      var monitorXHR,
        _this = this;
      RequestIntercept.__super__.constructor.apply(this, arguments);
      monitorXHR = function(req) {
        var _open;
        _open = req.open;
        return req.open = function(type, url, async) {
          if (shouldTrack(type)) {
            _this.trigger('request', {
              type: type,
              url: url,
              request: req
            });
          }
          return _open.apply(req, arguments);
        };
      };
      window.XMLHttpRequest = function(flags) {
        var req;
        req = new _XMLHttpRequest(flags);
        monitorXHR(req);
        return req;
      };
      try {
        extendNative(window.XMLHttpRequest, _XMLHttpRequest);
      } catch (_error) {}
      if (_XDomainRequest != null) {
        window.XDomainRequest = function() {
          var req;
          req = new _XDomainRequest;
          monitorXHR(req);
          return req;
        };
        try {
          extendNative(window.XDomainRequest, _XDomainRequest);
        } catch (_error) {}
      }
      if ((_WebSocket != null) && options.ajax.trackWebSockets) {
        window.WebSocket = function(url, protocols) {
          var req;
          if (protocols != null) {
            req = new _WebSocket(url, protocols);
          } else {
            req = new _WebSocket(url);
          }
          if (shouldTrack('socket')) {
            _this.trigger('request', {
              type: 'socket',
              url: url,
              protocols: protocols,
              request: req
            });
          }
          return req;
        };
        try {
          extendNative(window.WebSocket, _WebSocket);
        } catch (_error) {}
      }
    }

    return RequestIntercept;

  })(Events);

  _intercept = null;

  getIntercept = function() {
    if (_intercept == null) {
      _intercept = new RequestIntercept;
    }
    return _intercept;
  };

  shouldIgnoreURL = function(url) {
    var pattern, _j, _len1, _ref2;
    _ref2 = options.ajax.ignoreURLs;
    for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
      pattern = _ref2[_j];
      if (typeof pattern === 'string') {
        if (url.indexOf(pattern) !== -1) {
          return true;
        }
      } else {
        if (pattern.test(url)) {
          return true;
        }
      }
    }
    return false;
  };

  getIntercept().on('request', function(_arg) {
    var after, args, request, type, url;
    type = _arg.type, request = _arg.request, url = _arg.url;
    if (shouldIgnoreURL(url)) {
      return;
    }
    if (!Pace.running && (options.restartOnRequestAfter !== false || shouldTrack(type) === 'force')) {
      args = arguments;
      after = options.restartOnRequestAfter || 0;
      if (typeof after === 'boolean') {
        after = 0;
      }
      return setTimeout(function() {
        var stillActive, _j, _len1, _ref2, _ref3, _results;
        if (type === 'socket') {
          stillActive = request.readyState < 2;
        } else {
          stillActive = (0 < (_ref2 = request.readyState) && _ref2 < 4);
        }
        if (stillActive) {
          Pace.restart();
          _ref3 = Pace.sources;
          _results = [];
          for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
            source = _ref3[_j];
            if (source instanceof AjaxMonitor) {
              source.watch.apply(source, args);
              break;
            } else {
              _results.push(void 0);
            }
          }
          return _results;
        }
      }, after);
    }
  });

  AjaxMonitor = (function() {
    function AjaxMonitor() {
      var _this = this;
      this.elements = [];
      getIntercept().on('request', function() {
        return _this.watch.apply(_this, arguments);
      });
    }

    AjaxMonitor.prototype.watch = function(_arg) {
      var request, tracker, type, url;
      type = _arg.type, request = _arg.request, url = _arg.url;
      if (shouldIgnoreURL(url)) {
        return;
      }
      if (type === 'socket') {
        tracker = new SocketRequestTracker(request);
      } else {
        tracker = new XHRRequestTracker(request);
      }
      return this.elements.push(tracker);
    };

    return AjaxMonitor;

  })();

  XHRRequestTracker = (function() {
    function XHRRequestTracker(request) {
      var event, size, _j, _len1, _onreadystatechange, _ref2,
        _this = this;
      this.progress = 0;
      if (window.ProgressEvent != null) {
        size = null;
        request.addEventListener('progress', function(evt) {
          if (evt.lengthComputable) {
            return _this.progress = 100 * evt.loaded / evt.total;
          } else {
            return _this.progress = _this.progress + (100 - _this.progress) / 2;
          }
        }, false);
        _ref2 = ['load', 'abort', 'timeout', 'error'];
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
          event = _ref2[_j];
          request.addEventListener(event, function() {
            return _this.progress = 100;
          }, false);
        }
      } else {
        _onreadystatechange = request.onreadystatechange;
        request.onreadystatechange = function() {
          var _ref3;
          if ((_ref3 = request.readyState) === 0 || _ref3 === 4) {
            _this.progress = 100;
          } else if (request.readyState === 3) {
            _this.progress = 50;
          }
          return typeof _onreadystatechange === "function" ? _onreadystatechange.apply(null, arguments) : void 0;
        };
      }
    }

    return XHRRequestTracker;

  })();

  SocketRequestTracker = (function() {
    function SocketRequestTracker(request) {
      var event, _j, _len1, _ref2,
        _this = this;
      this.progress = 0;
      _ref2 = ['error', 'open'];
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        event = _ref2[_j];
        request.addEventListener(event, function() {
          return _this.progress = 100;
        }, false);
      }
    }

    return SocketRequestTracker;

  })();

  ElementMonitor = (function() {
    function ElementMonitor(options) {
      var this$1 = this;

      var selector, _j, _len1, _ref2;
      if (options == null) {
        options = {};
      }
      this.elements = [];
      if (options.selectors == null) {
        options.selectors = [];
      }
      _ref2 = options.selectors;
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        selector = _ref2[_j];
        this$1.elements.push(new ElementTracker(selector));
      }
    }

    return ElementMonitor;

  })();

  ElementTracker = (function() {
    function ElementTracker(selector) {
      this.selector = selector;
      this.progress = 0;
      this.check();
    }

    ElementTracker.prototype.check = function() {
      var _this = this;
      if (document.querySelector(this.selector)) {
        return this.done();
      } else {
        return setTimeout((function() {
          return _this.check();
        }), options.elements.checkInterval);
      }
    };

    ElementTracker.prototype.done = function() {
      return this.progress = 100;
    };

    return ElementTracker;

  })();

  DocumentMonitor = (function() {
    DocumentMonitor.prototype.states = {
      loading: 0,
      interactive: 50,
      complete: 100
    };

    function DocumentMonitor() {
      var _onreadystatechange, _ref2,
        _this = this;
      this.progress = (_ref2 = this.states[document.readyState]) != null ? _ref2 : 100;
      _onreadystatechange = document.onreadystatechange;
      document.onreadystatechange = function() {
        if (_this.states[document.readyState] != null) {
          _this.progress = _this.states[document.readyState];
        }
        return typeof _onreadystatechange === "function" ? _onreadystatechange.apply(null, arguments) : void 0;
      };
    }

    return DocumentMonitor;

  })();

  EventLagMonitor = (function() {
    function EventLagMonitor() {
      var avg, interval, last, points, samples,
        _this = this;
      this.progress = 0;
      avg = 0;
      samples = [];
      points = 0;
      last = now();
      interval = setInterval(function() {
        var diff;
        diff = now() - last - 50;
        last = now();
        samples.push(diff);
        if (samples.length > options.eventLag.sampleCount) {
          samples.shift();
        }
        avg = avgAmplitude(samples);
        if (++points >= options.eventLag.minSamples && avg < options.eventLag.lagThreshold) {
          _this.progress = 100;
          return clearInterval(interval);
        } else {
          return _this.progress = 100 * (3 / (avg + 3));
        }
      }, 50);
    }

    return EventLagMonitor;

  })();

  Scaler = (function() {
    function Scaler(source) {
      this.source = source;
      this.last = this.sinceLastUpdate = 0;
      this.rate = options.initialRate;
      this.catchup = 0;
      this.progress = this.lastProgress = 0;
      if (this.source != null) {
        this.progress = result(this.source, 'progress');
      }
    }

    Scaler.prototype.tick = function(frameTime, val) {
      var scaling;
      if (val == null) {
        val = result(this.source, 'progress');
      }
      if (val >= 100) {
        this.done = true;
      }
      if (val === this.last) {
        this.sinceLastUpdate += frameTime;
      } else {
        if (this.sinceLastUpdate) {
          this.rate = (val - this.last) / this.sinceLastUpdate;
        }
        this.catchup = (val - this.progress) / options.catchupTime;
        this.sinceLastUpdate = 0;
        this.last = val;
      }
      if (val > this.progress) {
        this.progress += this.catchup * frameTime;
      }
      scaling = 1 - Math.pow(this.progress / 100, options.easeFactor);
      this.progress += scaling * this.rate * frameTime;
      this.progress = Math.min(this.lastProgress + options.maxProgressPerFrame, this.progress);
      this.progress = Math.max(0, this.progress);
      this.progress = Math.min(100, this.progress);
      this.lastProgress = this.progress;
      return this.progress;
    };

    return Scaler;

  })();

  sources = null;

  scalers = null;

  bar = null;

  uniScaler = null;

  animation = null;

  cancelAnimation = null;

  Pace.running = false;

  handlePushState = function() {
    if (options.restartOnPushState) {
      return Pace.restart();
    }
  };

  if (window.history.pushState != null) {
    _pushState = window.history.pushState;
    window.history.pushState = function() {
      handlePushState();
      return _pushState.apply(window.history, arguments);
    };
  }

  if (window.history.replaceState != null) {
    _replaceState = window.history.replaceState;
    window.history.replaceState = function() {
      handlePushState();
      return _replaceState.apply(window.history, arguments);
    };
  }

  SOURCE_KEYS = {
    ajax: AjaxMonitor,
    elements: ElementMonitor,
    document: DocumentMonitor,
    eventLag: EventLagMonitor
  };

  (init = function() {
    var type, _j, _k, _len1, _len2, _ref2, _ref3, _ref4;
    Pace.sources = sources = [];
    _ref2 = ['ajax', 'elements', 'document', 'eventLag'];
    for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
      type = _ref2[_j];
      if (options[type] !== false) {
        sources.push(new SOURCE_KEYS[type](options[type]));
      }
    }
    _ref4 = (_ref3 = options.extraSources) != null ? _ref3 : [];
    for (_k = 0, _len2 = _ref4.length; _k < _len2; _k++) {
      source = _ref4[_k];
      sources.push(new source(options));
    }
    Pace.bar = bar = new Bar;
    scalers = [];
    return uniScaler = new Scaler;
  })();

  Pace.stop = function() {
    Pace.trigger('stop');
    Pace.running = false;
    bar.destroy();
    cancelAnimation = true;
    if (animation != null) {
      if (typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(animation);
      }
      animation = null;
    }
    return init();
  };

  Pace.restart = function() {
    Pace.trigger('restart');
    Pace.stop();
    return Pace.start();
  };

  Pace.go = function() {
    var start;
    Pace.running = true;
    bar.render();
    start = now();
    cancelAnimation = false;
    return animation = runAnimation(function(frameTime, enqueueNextFrame) {
      var avg, count, done, element, elements, i, j, remaining, scaler, scalerList, sum, _j, _k, _len1, _len2, _ref2;
      remaining = 100 - bar.progress;
      count = sum = 0;
      done = true;
      for (i = _j = 0, _len1 = sources.length; _j < _len1; i = ++_j) {
        source = sources[i];
        scalerList = scalers[i] != null ? scalers[i] : scalers[i] = [];
        elements = (_ref2 = source.elements) != null ? _ref2 : [source];
        for (j = _k = 0, _len2 = elements.length; _k < _len2; j = ++_k) {
          element = elements[j];
          scaler = scalerList[j] != null ? scalerList[j] : scalerList[j] = new Scaler(element);
          done &= scaler.done;
          if (scaler.done) {
            continue;
          }
          count++;
          sum += scaler.tick(frameTime);
        }
      }
      avg = sum / count;
      bar.update(uniScaler.tick(frameTime, avg));
      if (bar.done() || done || cancelAnimation) {
        bar.update(100);
        Pace.trigger('done');
        return setTimeout(function() {
          bar.finish();
          Pace.running = false;
          return Pace.trigger('hide');
        }, Math.max(options.ghostTime, Math.max(options.minTime - (now() - start), 0)));
      } else {
        return enqueueNextFrame();
      }
    });
  };

  Pace.start = function(_options) {
    extend(options, _options);
    Pace.running = true;
    try {
      bar.render();
    } catch (_error) {
      NoTargetError = _error;
    }
    if (!document.querySelector('.pace')) {
      return setTimeout(Pace.start, 50);
    } else {
      Pace.trigger('start');
      return Pace.go();
    }
  };

  if (typeof define === 'function' && define.amd) {
    define(['pace'], function() {
      return Pace;
    });
  } else if (typeof exports === 'object') {
    module.exports = Pace;
  } else {
    if (options.startOnPageLoad) {
      Pace.start();
    }
  }

}).call(undefined);

var template$21 = "<nav class=\"navbar navbar-default\">\r\n    <div class=\"container-fluid\">\r\n        <!-- Brand and toggle get grouped for better mobile display -->\r\n        <div class=\"navbar-header\">\r\n            <a class=\"navbar-brand\">Kudu Demos</a>\r\n        </div>\r\n\r\n        <!-- Collect the nav links, forms, and other content for toggling -->\r\n        <div class=\"collapse navbar-collapse\">\r\n\r\n            <ul class=\"nav navbar-nav\" id=\"navbar\">\r\n                \r\n                <div id=\"nav-ind\"></div>\r\n                <li ><a href=\"/home\" id=\"menu-home\">Home</a></li>\r\n<!--                <li><a href=\"/basic\">Basic controller demo</a></li>-->\r\n\r\n                <li class=\"dropdown\">\r\n                    <a href=\"#\" class=\"dropdown-toggle\" data-toggle=\"dropdown\" role=\"button\" aria-haspopup=\"true\" aria-expanded=\"false\">Basics <span class=\"caret\"></span></a>\r\n                    <ul class=\"dropdown-menu\">\r\n                        <li><a href=\"#basic?x=y\" id=\"menu-basic\">Basic controller demo</a></li>\r\n                        <li role=\"separator\" class=\"divider\"></li>\r\n                        <li><a href=\"/methods\">Method calls</a></li>\r\n                        <li><a href=\"/binding\">Binding</a></li>\r\n                    </ul>\r\n                </li>\r\n\r\n                <li class=\"dropdown\">\r\n                    <a href=\"#\" class=\"dropdown-toggle\" data-toggle=\"dropdown\" role=\"button\" aria-haspopup=\"true\" aria-expanded=\"false\">Navigation <span class=\"caret\"></span></a>\r\n                    <ul class=\"dropdown-menu\">\r\n                        <li><a href=\"/nav\">Navigate to views</a></li>\r\n                        <li role=\"separator\" class=\"divider\"></li>\r\n                        <li><a href=\"/navTargetParams/1?name=Bob\" id=\"menu-navTargetParams\">Navigate to view and pass URL parameters</a></li>\r\n                        <li role=\"separator\" class=\"divider\"></li>\r\n                        <li><a href=\"/redirect\" id=\"menu-redirectTarget\">Redirect to another view</a></li>\r\n                    </ul>\r\n                </li>\r\n\r\n                <li class=\"dropdown\">\r\n                    <a href=\"#\" class=\"dropdown-toggle\" data-toggle=\"dropdown\" role=\"button\" aria-haspopup=\"true\" aria-expanded=\"false\">Forms <span class=\"caret\"></span></a>\r\n                    <ul class=\"dropdown-menu\">\r\n                        <li><a href=\"/basicForm\">Basic Form</a></li>\r\n                        <li><a href=\"/validatingForm\">Form Validation (using Parsley)</a></li>\r\n                    </ul>\r\n                </li>\r\n\r\n\r\n                <li class=\"dropdown\">\r\n                    <a href=\"#\" class=\"dropdown-toggle\" data-toggle=\"dropdown\" role=\"button\" aria-haspopup=\"true\" aria-expanded=\"false\">Life cycle <span class=\"caret\"></span></a>\r\n                    <ul class=\"dropdown-menu\">\r\n                        <li><a href=\"/events\" on-click='gotoEvents(@event)'> lifecycle events</a></li>\r\n                    </ul>\r\n                </li>\r\n\r\n                <li class=\"dropdown\">\r\n                    <a href=\"#\" class=\"dropdown-toggle\" data-toggle=\"dropdown\" role=\"button\" aria-haspopup=\"true\" aria-expanded=\"false\">Ajax <span class=\"caret\"></span></a>\r\n                    <ul class=\"dropdown-menu\">\r\n                        <li><a href=\"/basicAjax\">Basic Ajax</a></li>\r\n                        <li><a href=\"/upload\">Upload</a></li>\r\n                    </ul>\r\n                </li>\r\n\r\n                <li class=\"dropdown\">\r\n                    <a href=\"#\" class=\"dropdown-toggle\" data-toggle=\"dropdown\" role=\"button\" aria-haspopup=\"true\" aria-expanded=\"false\">Partials <span class=\"caret\"></span></a>\r\n                    <ul class=\"dropdown-menu\">\r\n                        <li><a href=\"/basicPartial\">Basic Partial</a></li>\r\n                    </ul>\r\n                </li>\r\n\r\n                <li class=\"dropdown\">\r\n                    <a href=\"#\" class=\"dropdown-toggle\" data-toggle=\"dropdown\" role=\"button\" aria-haspopup=\"true\" aria-expanded=\"false\">Components <span class=\"caret\"></span></a>\r\n                    <ul class=\"dropdown-menu\">\r\n                        <li><a href=\"/basicComp\">Basic Component</a></li>\r\n                        <li><a href=\"/pubSubComp\">Publish/Subscribe to Components</a></li>\r\n                        <li><a href=\"/multipleComp\">Multiple Components</a></li>\r\n                    </ul>\r\n                </li>\r\n\r\n                <li class=\"dropdown\">\r\n                    <a href=\"#\" class=\"dropdown-toggle\" data-toggle=\"dropdown\" role=\"button\" aria-haspopup=\"true\" aria-expanded=\"false\">Transitions <span class=\"caret\"></span></a>\r\n                    <ul class=\"dropdown-menu\">\r\n                        <li><a href=\"/basicTransition\">Basic transtion (fade)</a></li>\r\n                    </ul>\r\n                </li>\r\n\r\n                <li><a id=\"showJs\" href=\"#\" on-click='showJavascript()'>Show Javascript</a></li>\r\n                <li><a id=\"showHtml\" href=\"#\" on-click='showHtml()'>Show Html</a></li>\r\n\r\n            </ul>\r\n\r\n        </div><!-- /.navbar-collapse -->\r\n    </div><!-- /.container-fluid -->\r\n</nav>";

var template$22 = "<div class=\"cd-panel from-right {{ visible ? \"is-visible\" : \"\" }}\" on-click='@.close()'>\r\n    <header class=\"cd-panel-header\">\r\n        <h1>{{title}}</h1>\r\n        <a href=\"#\" class=\"cd-panel-close\" on-click='@.close()'>Close</a>\r\n    </header>\r\n\r\n    <div class=\"cd-panel-container\">\r\n        <div class=\"cd-panel-content\">\r\n           \r\n            <pre class=\"line-numbers\"  data-src=\"{{code}}\"></pre>\r\n          \r\n        </div> <!-- cd-panel-content -->\r\n    </div> <!-- cd-panel-container -->\r\n</div> <!-- cd-panel -->     ";

var panel;

function sidePanel( target ) {

	panel = new Ractive( {

		el: target,

		template: template$22,

		close: function () {
			var event = this.event.original;
			close( event );
			return false;
		}
	} );

	$( "body" ).off( "click", handleBodyClick );
	$( "body" ).on( "click", handleBodyClick );

	// Public 
	panel.show = function ( options ) {
		show(options);
	};

	return panel;
}

function show( options ) {
	if ( options === void 0 ) options = {};

	var path = options.path || getUrlPath();
	var ext = options.ext || "";
	panel.set( "visible", true );

	panel.set( "code", path + "." + ext );
	panel.set( "title", path + "." + ext );
	Prism.fileHighlight();
	var $element = $( '.cd-panel-content' );
	//Prism.highlightElement( $element[0] );
}

function close( event ) {
	if ( $( event.target ).is( '.cd-panel' ) || $( event.target ).is( '.cd-panel-close' ) ) {
		panel.set( "visible", false );
	}
}

function getUrlPath() {
	var route = journey.getCurrentRoute();
	return route.path;
}

// Private 
function handleBodyClick( e ) {
	if ( panel.get( "visible" ) === true ) {

		if ( $( e.target ).is( 'a' ) ) {
			panel.set( "visible", false );

			$( ".cd-panel" ).css( "transitionProperty", "none" );
			setTimeout( function () {
				$( ".cd-panel" ).css( "transitionProperty", "all" );
			} );
		}
	}
}

var windowResizeTimeoutId;

var menuSlider = {

	init: function init( options ) {
		setupWindowResizeListener();

		setupMenuListener();
		/*
		 let $fallbackMenu = $( options.fallbackMenu );
		 let $initialLi = $fallbackMenu.parent();
		 setSliderOnActiveMenu( $initialLi );*/
	},

	updateSlider: function updateSlider( $li ) {
		// Parent dropdown menus should be skipped and handled by the child menu when selected
		if ( $li.length == 0 ) {
			return;
		}

		updateMenu( $li );

		slideToMenu( $li );
	}
};

function setupMenuListener() {

	journey.on( "entered", function (options) {
		var viewName = getViewName( options );
		console.log( "viewname:", viewName );

		var $li = getMenu( viewName );

		if ( hasActiveMenu() ) {
			menuSlider.updateSlider( $li );

		} else {
			updateMenu( $li );						
			initializeSlider( $li );
		}
	} );

//	$( '.navbar li' ).click( function ( e ) {
//		var $li = $( this );
//
//		menuSlider.updateSlider( $li );
//	} );
}

function updateMenu( $li ) {

	if ( hasParent( $li ) ) {
		var $parent = getParent( $li );
		updateChild( $parent, $li );
		//slideToActiveMenu( $parent );

	} else {
		updateLeaf( $li );
		//slideToActiveMenu( $li );
	}
	//}

	return $li;
}

function updateLeaf( $li ) {
	$( '.navbar li.active' ).removeClass( 'active' );
	$li.addClass( 'active' );
}

function updateChild( $parent, $leaf ) {
	$( '.navbar li.active' ).removeClass( 'active' );
	$parent.addClass( 'active' );

	$( "#navbar .sub-active" ).removeClass( "sub-active" );
	$leaf.addClass( "sub-active" );
}

function slideToMenu( $li ) {
	if ( hasParent( $li ) ) {
		$li = getParent( $li );
	}

	if ( $( "#nav-ind" ).is( ":visible" ) ) {
		// Only navigate to the menu if the menu has not collapsed yet ie is less than 768px
		var location = getActiveMenuLocation( $li );
		$( '#nav-ind' ).animate( location, 'fast', 'linear' );
	}
}

function initializeSlider( $li ) {
	if ( hasParent( $li ) ) {
		$li = getParent( $li );
	}
	//$liItem.addClass( "active" );
	var loc = getActiveMenuLocation( $li );
	$( '#nav-ind' ).css( loc );
}

function hasActiveMenu() {
	var $li = $( ".navbar li.active" );
	return $li.length > 0;
}

function setupWindowResizeListener() {
	$( window ).resize( function () {
		clearTimeout( windowResizeTimeoutId );
		windowResizeTimeoutId = setTimeout( windowResized, 0 );
	} );

	windowResized();
}

function windowResized() {
	if ( window.matchMedia( '(min-width: 768px)' ).matches ) {
		var $activeMenu = $( "#navbar li.active" );
		if ( $activeMenu.length > 0 ) {
			var location = getActiveMenuLocation( $activeMenu );
			$( '#nav-ind' ).css( location );
		}
	}
}

function getActiveMenuLocation( $li ) {
	var offsetTop = 60;
	var offsetLeft = 0;
	var offsetLeft = 0;
	if ( $li.length ) {
		var $navbar = $( '#navbar' );
		var navbarOffset = $navbar.offset();
		var itemOffset = $li.offset();
		offsetLeft = itemOffset.left - navbarOffset.left;
	}

	var width = $( '#navbar' ).width();
	var liWidth = $( $li ).width();
	var navbarHeight = $( '#navbar' ).height();
	var liHeight = $li.height();

	var location = {
		top: offsetTop,
		left: offsetLeft,
		right: width - liWidth - offsetLeft,
		bottom: navbarHeight - liHeight - offsetTop
	};
	return location;
}

function getParent( $li ) {
	var $parent = $li.closest( '.dropdown' );
	return $parent;
}

function hasParent( $li ) {
	var $parent = getParent( $li );
	if ( $parent.length == 1 ) {
		return true;
	}
	return false;
}

function getViewName( options ) {
	var route = options.to;
	var path = route.path;
	if ( path == null ) {
		return "";
	}

	var start = path.lastIndexOf( "/" );
	var name = path.slice( start + 1 );
	return name;
}

function getMenu( viewName ) {
	
	var selector = "#menu-" + viewName;
	var $li = $( selector ).parent();

	if ( $li.length == 0 ) {
		$li = $( ".navbar [href='/" + viewName + "'], .navbar [href='#" + viewName + "'], .navbar [href='" + viewName + "']" ).parent( );
	}
	return $li;
}

var sidePanelObj;

var menu = {

	init: function ( options ) {

		// Create menu view instance
		new Ractive( {
			el: options.target,

			template: template$21,

			gotoEvents: function ( e ) {
				journey.goto( "/events" );
				e.preventDefault();
			},

			showJavascript: function ( routeName ) {

				sidePanelObj.show( {
					ext: "js"
				} );
				// Cancel the click event by returning false, otherwise the link function would execute ie. follow the link href
				return false;
			},

			showHtml: function ( routeName ) {
				sidePanelObj.show( {
					ext: "html"

				} );
				// Cancel the click event by returning false, otherwise the link function would execute ie. follow the link href
				return false;
			}
		} );

		// Create sidePanel instance

		sidePanelObj = sidePanel( '#side-panel' );

		// Add highlighting slider to menu
		menuSlider.init( { fallbackMenu: options.fallbackMenu } );

		Pace.stop();

		journey.on( "entered", function () {
			Pace.stop();
		} );
	},

	updateSlider: function (selector) {
		var $li = $( selector );
		menuSlider.updateSlider( $li );
	}
};

/*!
 * Bootstrap v3.3.7 (http://getbootstrap.com)
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under the MIT license
 */

if (typeof jQuery === 'undefined') {
  throw new Error('Bootstrap\'s JavaScript requires jQuery')
}

+function ($) {
  'use strict';
  var version = $.fn.jquery.split(' ')[0].split('.');
  if ((version[0] < 2 && version[1] < 9) || (version[0] == 1 && version[1] == 9 && version[2] < 1) || (version[0] > 3)) {
    throw new Error('Bootstrap\'s JavaScript requires jQuery version 1.9.1 or higher, but lower than version 4')
  }
}(jQuery);

/* ========================================================================
 * Bootstrap: transition.js v3.3.7
 * http://getbootstrap.com/javascript/#transitions
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // CSS TRANSITION SUPPORT (Shoutout: http://www.modernizr.com/)
  // ============================================================

  function transitionEnd() {
    var el = document.createElement('bootstrap');

    var transEndEventNames = {
      WebkitTransition : 'webkitTransitionEnd',
      MozTransition    : 'transitionend',
      OTransition      : 'oTransitionEnd otransitionend',
      transition       : 'transitionend'
    };

    for (var name in transEndEventNames) {
      if (el.style[name] !== undefined) {
        return { end: transEndEventNames[name] }
      }
    }

    return false // explicit for ie8 (  ._.)
  }

  // http://blog.alexmaccaw.com/css-transitions
  $.fn.emulateTransitionEnd = function (duration) {
    var called = false;
    var $el = this;
    $(this).one('bsTransitionEnd', function () { called = true; });
    var callback = function () { if (!called) { $($el).trigger($.support.transition.end); } };
    setTimeout(callback, duration);
    return this
  };

  $(function () {
    $.support.transition = transitionEnd();

    if (!$.support.transition) { return }

    $.event.special.bsTransitionEnd = {
      bindType: $.support.transition.end,
      delegateType: $.support.transition.end,
      handle: function (e) {
        if ($(e.target).is(this)) { return e.handleObj.handler.apply(this, arguments) }
      }
    };
  });

}(jQuery);

/* ========================================================================
 * Bootstrap: alert.js v3.3.7
 * http://getbootstrap.com/javascript/#alerts
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // ALERT CLASS DEFINITION
  // ======================

  var dismiss = '[data-dismiss="alert"]';
  var Alert   = function (el) {
    $(el).on('click', dismiss, this.close);
  };

  Alert.VERSION = '3.3.7';

  Alert.TRANSITION_DURATION = 150;

  Alert.prototype.close = function (e) {
    var $this    = $(this);
    var selector = $this.attr('data-target');

    if (!selector) {
      selector = $this.attr('href');
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, ''); // strip for ie7
    }

    var $parent = $(selector === '#' ? [] : selector);

    if (e) { e.preventDefault(); }

    if (!$parent.length) {
      $parent = $this.closest('.alert');
    }

    $parent.trigger(e = $.Event('close.bs.alert'));

    if (e.isDefaultPrevented()) { return }

    $parent.removeClass('in');

    function removeElement() {
      // detach from parent, fire event then clean up data
      $parent.detach().trigger('closed.bs.alert').remove();
    }

    $.support.transition && $parent.hasClass('fade') ?
      $parent
        .one('bsTransitionEnd', removeElement)
        .emulateTransitionEnd(Alert.TRANSITION_DURATION) :
      removeElement();
  };


  // ALERT PLUGIN DEFINITION
  // =======================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data  = $this.data('bs.alert');

      if (!data) { $this.data('bs.alert', (data = new Alert(this))); }
      if (typeof option == 'string') { data[option].call($this); }
    })
  }

  var old = $.fn.alert;

  $.fn.alert             = Plugin;
  $.fn.alert.Constructor = Alert;


  // ALERT NO CONFLICT
  // =================

  $.fn.alert.noConflict = function () {
    $.fn.alert = old;
    return this
  };


  // ALERT DATA-API
  // ==============

  $(document).on('click.bs.alert.data-api', dismiss, Alert.prototype.close);

}(jQuery);

/* ========================================================================
 * Bootstrap: button.js v3.3.7
 * http://getbootstrap.com/javascript/#buttons
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // BUTTON PUBLIC CLASS DEFINITION
  // ==============================

  var Button = function (element, options) {
    this.$element  = $(element);
    this.options   = $.extend({}, Button.DEFAULTS, options);
    this.isLoading = false;
  };

  Button.VERSION  = '3.3.7';

  Button.DEFAULTS = {
    loadingText: 'loading...'
  };

  Button.prototype.setState = function (state) {
    var d    = 'disabled';
    var $el  = this.$element;
    var val  = $el.is('input') ? 'val' : 'html';
    var data = $el.data();

    state += 'Text';

    if (data.resetText == null) { $el.data('resetText', $el[val]()); }

    // push to event loop to allow forms to submit
    setTimeout($.proxy(function () {
      $el[val](data[state] == null ? this.options[state] : data[state]);

      if (state == 'loadingText') {
        this.isLoading = true;
        $el.addClass(d).attr(d, d).prop(d, true);
      } else if (this.isLoading) {
        this.isLoading = false;
        $el.removeClass(d).removeAttr(d).prop(d, false);
      }
    }, this), 0);
  };

  Button.prototype.toggle = function () {
    var changed = true;
    var $parent = this.$element.closest('[data-toggle="buttons"]');

    if ($parent.length) {
      var $input = this.$element.find('input');
      if ($input.prop('type') == 'radio') {
        if ($input.prop('checked')) { changed = false; }
        $parent.find('.active').removeClass('active');
        this.$element.addClass('active');
      } else if ($input.prop('type') == 'checkbox') {
        if (($input.prop('checked')) !== this.$element.hasClass('active')) { changed = false; }
        this.$element.toggleClass('active');
      }
      $input.prop('checked', this.$element.hasClass('active'));
      if (changed) { $input.trigger('change'); }
    } else {
      this.$element.attr('aria-pressed', !this.$element.hasClass('active'));
      this.$element.toggleClass('active');
    }
  };


  // BUTTON PLUGIN DEFINITION
  // ========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this);
      var data    = $this.data('bs.button');
      var options = typeof option == 'object' && option;

      if (!data) { $this.data('bs.button', (data = new Button(this, options))); }

      if (option == 'toggle') { data.toggle(); }
      else if (option) { data.setState(option); }
    })
  }

  var old = $.fn.button;

  $.fn.button             = Plugin;
  $.fn.button.Constructor = Button;


  // BUTTON NO CONFLICT
  // ==================

  $.fn.button.noConflict = function () {
    $.fn.button = old;
    return this
  };


  // BUTTON DATA-API
  // ===============

  $(document)
    .on('click.bs.button.data-api', '[data-toggle^="button"]', function (e) {
      var $btn = $(e.target).closest('.btn');
      Plugin.call($btn, 'toggle');
      if (!($(e.target).is('input[type="radio"], input[type="checkbox"]'))) {
        // Prevent double click on radios, and the double selections (so cancellation) on checkboxes
        e.preventDefault();
        // The target component still receive the focus
        if ($btn.is('input,button')) { $btn.trigger('focus'); }
        else { $btn.find('input:visible,button:visible').first().trigger('focus'); }
      }
    })
    .on('focus.bs.button.data-api blur.bs.button.data-api', '[data-toggle^="button"]', function (e) {
      $(e.target).closest('.btn').toggleClass('focus', /^focus(in)?$/.test(e.type));
    });

}(jQuery);

/* ========================================================================
 * Bootstrap: carousel.js v3.3.7
 * http://getbootstrap.com/javascript/#carousel
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // CAROUSEL CLASS DEFINITION
  // =========================

  var Carousel = function (element, options) {
    this.$element    = $(element);
    this.$indicators = this.$element.find('.carousel-indicators');
    this.options     = options;
    this.paused      = null;
    this.sliding     = null;
    this.interval    = null;
    this.$active     = null;
    this.$items      = null;

    this.options.keyboard && this.$element.on('keydown.bs.carousel', $.proxy(this.keydown, this));

    this.options.pause == 'hover' && !('ontouchstart' in document.documentElement) && this.$element
      .on('mouseenter.bs.carousel', $.proxy(this.pause, this))
      .on('mouseleave.bs.carousel', $.proxy(this.cycle, this));
  };

  Carousel.VERSION  = '3.3.7';

  Carousel.TRANSITION_DURATION = 600;

  Carousel.DEFAULTS = {
    interval: 5000,
    pause: 'hover',
    wrap: true,
    keyboard: true
  };

  Carousel.prototype.keydown = function (e) {
    if (/input|textarea/i.test(e.target.tagName)) { return }
    switch (e.which) {
      case 37: this.prev(); break
      case 39: this.next(); break
      default: return
    }

    e.preventDefault();
  };

  Carousel.prototype.cycle = function (e) {
    e || (this.paused = false);

    this.interval && clearInterval(this.interval);

    this.options.interval
      && !this.paused
      && (this.interval = setInterval($.proxy(this.next, this), this.options.interval));

    return this
  };

  Carousel.prototype.getItemIndex = function (item) {
    this.$items = item.parent().children('.item');
    return this.$items.index(item || this.$active)
  };

  Carousel.prototype.getItemForDirection = function (direction, active) {
    var activeIndex = this.getItemIndex(active);
    var willWrap = (direction == 'prev' && activeIndex === 0)
                || (direction == 'next' && activeIndex == (this.$items.length - 1));
    if (willWrap && !this.options.wrap) { return active }
    var delta = direction == 'prev' ? -1 : 1;
    var itemIndex = (activeIndex + delta) % this.$items.length;
    return this.$items.eq(itemIndex)
  };

  Carousel.prototype.to = function (pos) {
    var that        = this;
    var activeIndex = this.getItemIndex(this.$active = this.$element.find('.item.active'));

    if (pos > (this.$items.length - 1) || pos < 0) { return }

    if (this.sliding)       { return this.$element.one('slid.bs.carousel', function () { that.to(pos); }) } // yes, "slid"
    if (activeIndex == pos) { return this.pause().cycle() }

    return this.slide(pos > activeIndex ? 'next' : 'prev', this.$items.eq(pos))
  };

  Carousel.prototype.pause = function (e) {
    e || (this.paused = true);

    if (this.$element.find('.next, .prev').length && $.support.transition) {
      this.$element.trigger($.support.transition.end);
      this.cycle(true);
    }

    this.interval = clearInterval(this.interval);

    return this
  };

  Carousel.prototype.next = function () {
    if (this.sliding) { return }
    return this.slide('next')
  };

  Carousel.prototype.prev = function () {
    if (this.sliding) { return }
    return this.slide('prev')
  };

  Carousel.prototype.slide = function (type, next) {
    var $active   = this.$element.find('.item.active');
    var $next     = next || this.getItemForDirection(type, $active);
    var isCycling = this.interval;
    var direction = type == 'next' ? 'left' : 'right';
    var that      = this;

    if ($next.hasClass('active')) { return (this.sliding = false) }

    var relatedTarget = $next[0];
    var slideEvent = $.Event('slide.bs.carousel', {
      relatedTarget: relatedTarget,
      direction: direction
    });
    this.$element.trigger(slideEvent);
    if (slideEvent.isDefaultPrevented()) { return }

    this.sliding = true;

    isCycling && this.pause();

    if (this.$indicators.length) {
      this.$indicators.find('.active').removeClass('active');
      var $nextIndicator = $(this.$indicators.children()[this.getItemIndex($next)]);
      $nextIndicator && $nextIndicator.addClass('active');
    }

    var slidEvent = $.Event('slid.bs.carousel', { relatedTarget: relatedTarget, direction: direction }); // yes, "slid"
    if ($.support.transition && this.$element.hasClass('slide')) {
      $next.addClass(type);
      $next[0].offsetWidth; // force reflow
      $active.addClass(direction);
      $next.addClass(direction);
      $active
        .one('bsTransitionEnd', function () {
          $next.removeClass([type, direction].join(' ')).addClass('active');
          $active.removeClass(['active', direction].join(' '));
          that.sliding = false;
          setTimeout(function () {
            that.$element.trigger(slidEvent);
          }, 0);
        })
        .emulateTransitionEnd(Carousel.TRANSITION_DURATION);
    } else {
      $active.removeClass('active');
      $next.addClass('active');
      this.sliding = false;
      this.$element.trigger(slidEvent);
    }

    isCycling && this.cycle();

    return this
  };


  // CAROUSEL PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this);
      var data    = $this.data('bs.carousel');
      var options = $.extend({}, Carousel.DEFAULTS, $this.data(), typeof option == 'object' && option);
      var action  = typeof option == 'string' ? option : options.slide;

      if (!data) { $this.data('bs.carousel', (data = new Carousel(this, options))); }
      if (typeof option == 'number') { data.to(option); }
      else if (action) { data[action](); }
      else if (options.interval) { data.pause().cycle(); }
    })
  }

  var old = $.fn.carousel;

  $.fn.carousel             = Plugin;
  $.fn.carousel.Constructor = Carousel;


  // CAROUSEL NO CONFLICT
  // ====================

  $.fn.carousel.noConflict = function () {
    $.fn.carousel = old;
    return this
  };


  // CAROUSEL DATA-API
  // =================

  var clickHandler = function (e) {
    var href;
    var $this   = $(this);
    var $target = $($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')); // strip for ie7
    if (!$target.hasClass('carousel')) { return }
    var options = $.extend({}, $target.data(), $this.data());
    var slideIndex = $this.attr('data-slide-to');
    if (slideIndex) { options.interval = false; }

    Plugin.call($target, options);

    if (slideIndex) {
      $target.data('bs.carousel').to(slideIndex);
    }

    e.preventDefault();
  };

  $(document)
    .on('click.bs.carousel.data-api', '[data-slide]', clickHandler)
    .on('click.bs.carousel.data-api', '[data-slide-to]', clickHandler);

  $(window).on('load', function () {
    $('[data-ride="carousel"]').each(function () {
      var $carousel = $(this);
      Plugin.call($carousel, $carousel.data());
    });
  });

}(jQuery);

/* ========================================================================
 * Bootstrap: collapse.js v3.3.7
 * http://getbootstrap.com/javascript/#collapse
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

/* jshint latedef: false */

+function ($) {
  'use strict';

  // COLLAPSE PUBLIC CLASS DEFINITION
  // ================================

  var Collapse = function (element, options) {
    this.$element      = $(element);
    this.options       = $.extend({}, Collapse.DEFAULTS, options);
    this.$trigger      = $('[data-toggle="collapse"][href="#' + element.id + '"],' +
                           '[data-toggle="collapse"][data-target="#' + element.id + '"]');
    this.transitioning = null;

    if (this.options.parent) {
      this.$parent = this.getParent();
    } else {
      this.addAriaAndCollapsedClass(this.$element, this.$trigger);
    }

    if (this.options.toggle) { this.toggle(); }
  };

  Collapse.VERSION  = '3.3.7';

  Collapse.TRANSITION_DURATION = 350;

  Collapse.DEFAULTS = {
    toggle: true
  };

  Collapse.prototype.dimension = function () {
    var hasWidth = this.$element.hasClass('width');
    return hasWidth ? 'width' : 'height'
  };

  Collapse.prototype.show = function () {
    if (this.transitioning || this.$element.hasClass('in')) { return }

    var activesData;
    var actives = this.$parent && this.$parent.children('.panel').children('.in, .collapsing');

    if (actives && actives.length) {
      activesData = actives.data('bs.collapse');
      if (activesData && activesData.transitioning) { return }
    }

    var startEvent = $.Event('show.bs.collapse');
    this.$element.trigger(startEvent);
    if (startEvent.isDefaultPrevented()) { return }

    if (actives && actives.length) {
      Plugin.call(actives, 'hide');
      activesData || actives.data('bs.collapse', null);
    }

    var dimension = this.dimension();

    this.$element
      .removeClass('collapse')
      .addClass('collapsing')[dimension](0)
      .attr('aria-expanded', true);

    this.$trigger
      .removeClass('collapsed')
      .attr('aria-expanded', true);

    this.transitioning = 1;

    var complete = function () {
      this.$element
        .removeClass('collapsing')
        .addClass('collapse in')[dimension]('');
      this.transitioning = 0;
      this.$element
        .trigger('shown.bs.collapse');
    };

    if (!$.support.transition) { return complete.call(this) }

    var scrollSize = $.camelCase(['scroll', dimension].join('-'));

    this.$element
      .one('bsTransitionEnd', $.proxy(complete, this))
      .emulateTransitionEnd(Collapse.TRANSITION_DURATION)[dimension](this.$element[0][scrollSize]);
  };

  Collapse.prototype.hide = function () {
    if (this.transitioning || !this.$element.hasClass('in')) { return }

    var startEvent = $.Event('hide.bs.collapse');
    this.$element.trigger(startEvent);
    if (startEvent.isDefaultPrevented()) { return }

    var dimension = this.dimension();

    this.$element[dimension](this.$element[dimension]())[0].offsetHeight;

    this.$element
      .addClass('collapsing')
      .removeClass('collapse in')
      .attr('aria-expanded', false);

    this.$trigger
      .addClass('collapsed')
      .attr('aria-expanded', false);

    this.transitioning = 1;

    var complete = function () {
      this.transitioning = 0;
      this.$element
        .removeClass('collapsing')
        .addClass('collapse')
        .trigger('hidden.bs.collapse');
    };

    if (!$.support.transition) { return complete.call(this) }

    this.$element
      [dimension](0)
      .one('bsTransitionEnd', $.proxy(complete, this))
      .emulateTransitionEnd(Collapse.TRANSITION_DURATION);
  };

  Collapse.prototype.toggle = function () {
    this[this.$element.hasClass('in') ? 'hide' : 'show']();
  };

  Collapse.prototype.getParent = function () {
    return $(this.options.parent)
      .find('[data-toggle="collapse"][data-parent="' + this.options.parent + '"]')
      .each($.proxy(function (i, element) {
        var $element = $(element);
        this.addAriaAndCollapsedClass(getTargetFromTrigger($element), $element);
      }, this))
      .end()
  };

  Collapse.prototype.addAriaAndCollapsedClass = function ($element, $trigger) {
    var isOpen = $element.hasClass('in');

    $element.attr('aria-expanded', isOpen);
    $trigger
      .toggleClass('collapsed', !isOpen)
      .attr('aria-expanded', isOpen);
  };

  function getTargetFromTrigger($trigger) {
    var href;
    var target = $trigger.attr('data-target')
      || (href = $trigger.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, ''); // strip for ie7

    return $(target)
  }


  // COLLAPSE PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this);
      var data    = $this.data('bs.collapse');
      var options = $.extend({}, Collapse.DEFAULTS, $this.data(), typeof option == 'object' && option);

      if (!data && options.toggle && /show|hide/.test(option)) { options.toggle = false; }
      if (!data) { $this.data('bs.collapse', (data = new Collapse(this, options))); }
      if (typeof option == 'string') { data[option](); }
    })
  }

  var old = $.fn.collapse;

  $.fn.collapse             = Plugin;
  $.fn.collapse.Constructor = Collapse;


  // COLLAPSE NO CONFLICT
  // ====================

  $.fn.collapse.noConflict = function () {
    $.fn.collapse = old;
    return this
  };


  // COLLAPSE DATA-API
  // =================

  $(document).on('click.bs.collapse.data-api', '[data-toggle="collapse"]', function (e) {
    var $this   = $(this);

    if (!$this.attr('data-target')) { e.preventDefault(); }

    var $target = getTargetFromTrigger($this);
    var data    = $target.data('bs.collapse');
    var option  = data ? 'toggle' : $this.data();

    Plugin.call($target, option);
  });

}(jQuery);

/* ========================================================================
 * Bootstrap: dropdown.js v3.3.7
 * http://getbootstrap.com/javascript/#dropdowns
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // DROPDOWN CLASS DEFINITION
  // =========================

  var backdrop = '.dropdown-backdrop';
  var toggle   = '[data-toggle="dropdown"]';
  var Dropdown = function (element) {
    $(element).on('click.bs.dropdown', this.toggle);
  };

  Dropdown.VERSION = '3.3.7';

  function getParent($this) {
    var selector = $this.attr('data-target');

    if (!selector) {
      selector = $this.attr('href');
      selector = selector && /#[A-Za-z]/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, ''); // strip for ie7
    }

    var $parent = selector && $(selector);

    return $parent && $parent.length ? $parent : $this.parent()
  }

  function clearMenus(e) {
    if (e && e.which === 3) { return }
    $(backdrop).remove();
    $(toggle).each(function () {
      var $this         = $(this);
      var $parent       = getParent($this);
      var relatedTarget = { relatedTarget: this };

      if (!$parent.hasClass('open')) { return }

      if (e && e.type == 'click' && /input|textarea/i.test(e.target.tagName) && $.contains($parent[0], e.target)) { return }

      $parent.trigger(e = $.Event('hide.bs.dropdown', relatedTarget));

      if (e.isDefaultPrevented()) { return }

      $this.attr('aria-expanded', 'false');
      $parent.removeClass('open').trigger($.Event('hidden.bs.dropdown', relatedTarget));
    });
  }

  Dropdown.prototype.toggle = function (e) {
    var $this = $(this);

    if ($this.is('.disabled, :disabled')) { return }

    var $parent  = getParent($this);
    var isActive = $parent.hasClass('open');

    clearMenus();

    if (!isActive) {
      if ('ontouchstart' in document.documentElement && !$parent.closest('.navbar-nav').length) {
        // if mobile we use a backdrop because click events don't delegate
        $(document.createElement('div'))
          .addClass('dropdown-backdrop')
          .insertAfter($(this))
          .on('click', clearMenus);
      }

      var relatedTarget = { relatedTarget: this };
      $parent.trigger(e = $.Event('show.bs.dropdown', relatedTarget));

      if (e.isDefaultPrevented()) { return }

      $this
        .trigger('focus')
        .attr('aria-expanded', 'true');

      $parent
        .toggleClass('open')
        .trigger($.Event('shown.bs.dropdown', relatedTarget));
    }

    return false
  };

  Dropdown.prototype.keydown = function (e) {
    if (!/(38|40|27|32)/.test(e.which) || /input|textarea/i.test(e.target.tagName)) { return }

    var $this = $(this);

    e.preventDefault();
    e.stopPropagation();

    if ($this.is('.disabled, :disabled')) { return }

    var $parent  = getParent($this);
    var isActive = $parent.hasClass('open');

    if (!isActive && e.which != 27 || isActive && e.which == 27) {
      if (e.which == 27) { $parent.find(toggle).trigger('focus'); }
      return $this.trigger('click')
    }

    var desc = ' li:not(.disabled):visible a';
    var $items = $parent.find('.dropdown-menu' + desc);

    if (!$items.length) { return }

    var index = $items.index(e.target);

    if (e.which == 38 && index > 0)                 { index--; }         // up
    if (e.which == 40 && index < $items.length - 1) { index++; }         // down
    if (!~index)                                    { index = 0; }

    $items.eq(index).trigger('focus');
  };


  // DROPDOWN PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data  = $this.data('bs.dropdown');

      if (!data) { $this.data('bs.dropdown', (data = new Dropdown(this))); }
      if (typeof option == 'string') { data[option].call($this); }
    })
  }

  var old = $.fn.dropdown;

  $.fn.dropdown             = Plugin;
  $.fn.dropdown.Constructor = Dropdown;


  // DROPDOWN NO CONFLICT
  // ====================

  $.fn.dropdown.noConflict = function () {
    $.fn.dropdown = old;
    return this
  };


  // APPLY TO STANDARD DROPDOWN ELEMENTS
  // ===================================

  $(document)
    .on('click.bs.dropdown.data-api', clearMenus)
    .on('click.bs.dropdown.data-api', '.dropdown form', function (e) { e.stopPropagation(); })
    .on('click.bs.dropdown.data-api', toggle, Dropdown.prototype.toggle)
    .on('keydown.bs.dropdown.data-api', toggle, Dropdown.prototype.keydown)
    .on('keydown.bs.dropdown.data-api', '.dropdown-menu', Dropdown.prototype.keydown);

}(jQuery);

/* ========================================================================
 * Bootstrap: modal.js v3.3.7
 * http://getbootstrap.com/javascript/#modals
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // MODAL CLASS DEFINITION
  // ======================

  var Modal = function (element, options) {
    this.options             = options;
    this.$body               = $(document.body);
    this.$element            = $(element);
    this.$dialog             = this.$element.find('.modal-dialog');
    this.$backdrop           = null;
    this.isShown             = null;
    this.originalBodyPad     = null;
    this.scrollbarWidth      = 0;
    this.ignoreBackdropClick = false;

    if (this.options.remote) {
      this.$element
        .find('.modal-content')
        .load(this.options.remote, $.proxy(function () {
          this.$element.trigger('loaded.bs.modal');
        }, this));
    }
  };

  Modal.VERSION  = '3.3.7';

  Modal.TRANSITION_DURATION = 300;
  Modal.BACKDROP_TRANSITION_DURATION = 150;

  Modal.DEFAULTS = {
    backdrop: true,
    keyboard: true,
    show: true
  };

  Modal.prototype.toggle = function (_relatedTarget) {
    return this.isShown ? this.hide() : this.show(_relatedTarget)
  };

  Modal.prototype.show = function (_relatedTarget) {
    var that = this;
    var e    = $.Event('show.bs.modal', { relatedTarget: _relatedTarget });

    this.$element.trigger(e);

    if (this.isShown || e.isDefaultPrevented()) { return }

    this.isShown = true;

    this.checkScrollbar();
    this.setScrollbar();
    this.$body.addClass('modal-open');

    this.escape();
    this.resize();

    this.$element.on('click.dismiss.bs.modal', '[data-dismiss="modal"]', $.proxy(this.hide, this));

    this.$dialog.on('mousedown.dismiss.bs.modal', function () {
      that.$element.one('mouseup.dismiss.bs.modal', function (e) {
        if ($(e.target).is(that.$element)) { that.ignoreBackdropClick = true; }
      });
    });

    this.backdrop(function () {
      var transition = $.support.transition && that.$element.hasClass('fade');

      if (!that.$element.parent().length) {
        that.$element.appendTo(that.$body); // don't move modals dom position
      }

      that.$element
        .show()
        .scrollTop(0);

      that.adjustDialog();

      if (transition) {
        that.$element[0].offsetWidth; // force reflow
      }

      that.$element.addClass('in');

      that.enforceFocus();

      var e = $.Event('shown.bs.modal', { relatedTarget: _relatedTarget });

      transition ?
        that.$dialog // wait for modal to slide in
          .one('bsTransitionEnd', function () {
            that.$element.trigger('focus').trigger(e);
          })
          .emulateTransitionEnd(Modal.TRANSITION_DURATION) :
        that.$element.trigger('focus').trigger(e);
    });
  };

  Modal.prototype.hide = function (e) {
    if (e) { e.preventDefault(); }

    e = $.Event('hide.bs.modal');

    this.$element.trigger(e);

    if (!this.isShown || e.isDefaultPrevented()) { return }

    this.isShown = false;

    this.escape();
    this.resize();

    $(document).off('focusin.bs.modal');

    this.$element
      .removeClass('in')
      .off('click.dismiss.bs.modal')
      .off('mouseup.dismiss.bs.modal');

    this.$dialog.off('mousedown.dismiss.bs.modal');

    $.support.transition && this.$element.hasClass('fade') ?
      this.$element
        .one('bsTransitionEnd', $.proxy(this.hideModal, this))
        .emulateTransitionEnd(Modal.TRANSITION_DURATION) :
      this.hideModal();
  };

  Modal.prototype.enforceFocus = function () {
    $(document)
      .off('focusin.bs.modal') // guard against infinite focus loop
      .on('focusin.bs.modal', $.proxy(function (e) {
        if (document !== e.target &&
            this.$element[0] !== e.target &&
            !this.$element.has(e.target).length) {
          this.$element.trigger('focus');
        }
      }, this));
  };

  Modal.prototype.escape = function () {
    if (this.isShown && this.options.keyboard) {
      this.$element.on('keydown.dismiss.bs.modal', $.proxy(function (e) {
        e.which == 27 && this.hide();
      }, this));
    } else if (!this.isShown) {
      this.$element.off('keydown.dismiss.bs.modal');
    }
  };

  Modal.prototype.resize = function () {
    if (this.isShown) {
      $(window).on('resize.bs.modal', $.proxy(this.handleUpdate, this));
    } else {
      $(window).off('resize.bs.modal');
    }
  };

  Modal.prototype.hideModal = function () {
    var that = this;
    this.$element.hide();
    this.backdrop(function () {
      that.$body.removeClass('modal-open');
      that.resetAdjustments();
      that.resetScrollbar();
      that.$element.trigger('hidden.bs.modal');
    });
  };

  Modal.prototype.removeBackdrop = function () {
    this.$backdrop && this.$backdrop.remove();
    this.$backdrop = null;
  };

  Modal.prototype.backdrop = function (callback) {
    var that = this;
    var animate = this.$element.hasClass('fade') ? 'fade' : '';

    if (this.isShown && this.options.backdrop) {
      var doAnimate = $.support.transition && animate;

      this.$backdrop = $(document.createElement('div'))
        .addClass('modal-backdrop ' + animate)
        .appendTo(this.$body);

      this.$element.on('click.dismiss.bs.modal', $.proxy(function (e) {
        if (this.ignoreBackdropClick) {
          this.ignoreBackdropClick = false;
          return
        }
        if (e.target !== e.currentTarget) { return }
        this.options.backdrop == 'static'
          ? this.$element[0].focus()
          : this.hide();
      }, this));

      if (doAnimate) { this.$backdrop[0].offsetWidth; } // force reflow

      this.$backdrop.addClass('in');

      if (!callback) { return }

      doAnimate ?
        this.$backdrop
          .one('bsTransitionEnd', callback)
          .emulateTransitionEnd(Modal.BACKDROP_TRANSITION_DURATION) :
        callback();

    } else if (!this.isShown && this.$backdrop) {
      this.$backdrop.removeClass('in');

      var callbackRemove = function () {
        that.removeBackdrop();
        callback && callback();
      };
      $.support.transition && this.$element.hasClass('fade') ?
        this.$backdrop
          .one('bsTransitionEnd', callbackRemove)
          .emulateTransitionEnd(Modal.BACKDROP_TRANSITION_DURATION) :
        callbackRemove();

    } else if (callback) {
      callback();
    }
  };

  // these following methods are used to handle overflowing modals

  Modal.prototype.handleUpdate = function () {
    this.adjustDialog();
  };

  Modal.prototype.adjustDialog = function () {
    var modalIsOverflowing = this.$element[0].scrollHeight > document.documentElement.clientHeight;

    this.$element.css({
      paddingLeft:  !this.bodyIsOverflowing && modalIsOverflowing ? this.scrollbarWidth : '',
      paddingRight: this.bodyIsOverflowing && !modalIsOverflowing ? this.scrollbarWidth : ''
    });
  };

  Modal.prototype.resetAdjustments = function () {
    this.$element.css({
      paddingLeft: '',
      paddingRight: ''
    });
  };

  Modal.prototype.checkScrollbar = function () {
    var fullWindowWidth = window.innerWidth;
    if (!fullWindowWidth) { // workaround for missing window.innerWidth in IE8
      var documentElementRect = document.documentElement.getBoundingClientRect();
      fullWindowWidth = documentElementRect.right - Math.abs(documentElementRect.left);
    }
    this.bodyIsOverflowing = document.body.clientWidth < fullWindowWidth;
    this.scrollbarWidth = this.measureScrollbar();
  };

  Modal.prototype.setScrollbar = function () {
    var bodyPad = parseInt((this.$body.css('padding-right') || 0), 10);
    this.originalBodyPad = document.body.style.paddingRight || '';
    if (this.bodyIsOverflowing) { this.$body.css('padding-right', bodyPad + this.scrollbarWidth); }
  };

  Modal.prototype.resetScrollbar = function () {
    this.$body.css('padding-right', this.originalBodyPad);
  };

  Modal.prototype.measureScrollbar = function () { // thx walsh
    var scrollDiv = document.createElement('div');
    scrollDiv.className = 'modal-scrollbar-measure';
    this.$body.append(scrollDiv);
    var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    this.$body[0].removeChild(scrollDiv);
    return scrollbarWidth
  };


  // MODAL PLUGIN DEFINITION
  // =======================

  function Plugin(option, _relatedTarget) {
    return this.each(function () {
      var $this   = $(this);
      var data    = $this.data('bs.modal');
      var options = $.extend({}, Modal.DEFAULTS, $this.data(), typeof option == 'object' && option);

      if (!data) { $this.data('bs.modal', (data = new Modal(this, options))); }
      if (typeof option == 'string') { data[option](_relatedTarget); }
      else if (options.show) { data.show(_relatedTarget); }
    })
  }

  var old = $.fn.modal;

  $.fn.modal             = Plugin;
  $.fn.modal.Constructor = Modal;


  // MODAL NO CONFLICT
  // =================

  $.fn.modal.noConflict = function () {
    $.fn.modal = old;
    return this
  };


  // MODAL DATA-API
  // ==============

  $(document).on('click.bs.modal.data-api', '[data-toggle="modal"]', function (e) {
    var $this   = $(this);
    var href    = $this.attr('href');
    var $target = $($this.attr('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, ''))); // strip for ie7
    var option  = $target.data('bs.modal') ? 'toggle' : $.extend({ remote: !/#/.test(href) && href }, $target.data(), $this.data());

    if ($this.is('a')) { e.preventDefault(); }

    $target.one('show.bs.modal', function (showEvent) {
      if (showEvent.isDefaultPrevented()) { return } // only register focus restorer if modal will actually get shown
      $target.one('hidden.bs.modal', function () {
        $this.is(':visible') && $this.trigger('focus');
      });
    });
    Plugin.call($target, option, this);
  });

}(jQuery);

/* ========================================================================
 * Bootstrap: tooltip.js v3.3.7
 * http://getbootstrap.com/javascript/#tooltip
 * Inspired by the original jQuery.tipsy by Jason Frame
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // TOOLTIP PUBLIC CLASS DEFINITION
  // ===============================

  var Tooltip = function (element, options) {
    this.type       = null;
    this.options    = null;
    this.enabled    = null;
    this.timeout    = null;
    this.hoverState = null;
    this.$element   = null;
    this.inState    = null;

    this.init('tooltip', element, options);
  };

  Tooltip.VERSION  = '3.3.7';

  Tooltip.TRANSITION_DURATION = 150;

  Tooltip.DEFAULTS = {
    animation: true,
    placement: 'top',
    selector: false,
    template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
    trigger: 'hover focus',
    title: '',
    delay: 0,
    html: false,
    container: false,
    viewport: {
      selector: 'body',
      padding: 0
    }
  };

  Tooltip.prototype.init = function (type, element, options) {
    var this$1 = this;

    this.enabled   = true;
    this.type      = type;
    this.$element  = $(element);
    this.options   = this.getOptions(options);
    this.$viewport = this.options.viewport && $($.isFunction(this.options.viewport) ? this.options.viewport.call(this, this.$element) : (this.options.viewport.selector || this.options.viewport));
    this.inState   = { click: false, hover: false, focus: false };

    if (this.$element[0] instanceof document.constructor && !this.options.selector) {
      throw new Error('`selector` option must be specified when initializing ' + this.type + ' on the window.document object!')
    }

    var triggers = this.options.trigger.split(' ');

    for (var i = triggers.length; i--;) {
      var trigger = triggers[i];

      if (trigger == 'click') {
        this$1.$element.on('click.' + this$1.type, this$1.options.selector, $.proxy(this$1.toggle, this$1));
      } else if (trigger != 'manual') {
        var eventIn  = trigger == 'hover' ? 'mouseenter' : 'focusin';
        var eventOut = trigger == 'hover' ? 'mouseleave' : 'focusout';

        this$1.$element.on(eventIn  + '.' + this$1.type, this$1.options.selector, $.proxy(this$1.enter, this$1));
        this$1.$element.on(eventOut + '.' + this$1.type, this$1.options.selector, $.proxy(this$1.leave, this$1));
      }
    }

    this.options.selector ?
      (this._options = $.extend({}, this.options, { trigger: 'manual', selector: '' })) :
      this.fixTitle();
  };

  Tooltip.prototype.getDefaults = function () {
    return Tooltip.DEFAULTS
  };

  Tooltip.prototype.getOptions = function (options) {
    options = $.extend({}, this.getDefaults(), this.$element.data(), options);

    if (options.delay && typeof options.delay == 'number') {
      options.delay = {
        show: options.delay,
        hide: options.delay
      };
    }

    return options
  };

  Tooltip.prototype.getDelegateOptions = function () {
    var options  = {};
    var defaults = this.getDefaults();

    this._options && $.each(this._options, function (key, value) {
      if (defaults[key] != value) { options[key] = value; }
    });

    return options
  };

  Tooltip.prototype.enter = function (obj) {
    var self = obj instanceof this.constructor ?
      obj : $(obj.currentTarget).data('bs.' + this.type);

    if (!self) {
      self = new this.constructor(obj.currentTarget, this.getDelegateOptions());
      $(obj.currentTarget).data('bs.' + this.type, self);
    }

    if (obj instanceof $.Event) {
      self.inState[obj.type == 'focusin' ? 'focus' : 'hover'] = true;
    }

    if (self.tip().hasClass('in') || self.hoverState == 'in') {
      self.hoverState = 'in';
      return
    }

    clearTimeout(self.timeout);

    self.hoverState = 'in';

    if (!self.options.delay || !self.options.delay.show) { return self.show() }

    self.timeout = setTimeout(function () {
      if (self.hoverState == 'in') { self.show(); }
    }, self.options.delay.show);
  };

  Tooltip.prototype.isInStateTrue = function () {
    var this$1 = this;

    for (var key in this$1.inState) {
      if (this$1.inState[key]) { return true }
    }

    return false
  };

  Tooltip.prototype.leave = function (obj) {
    var self = obj instanceof this.constructor ?
      obj : $(obj.currentTarget).data('bs.' + this.type);

    if (!self) {
      self = new this.constructor(obj.currentTarget, this.getDelegateOptions());
      $(obj.currentTarget).data('bs.' + this.type, self);
    }

    if (obj instanceof $.Event) {
      self.inState[obj.type == 'focusout' ? 'focus' : 'hover'] = false;
    }

    if (self.isInStateTrue()) { return }

    clearTimeout(self.timeout);

    self.hoverState = 'out';

    if (!self.options.delay || !self.options.delay.hide) { return self.hide() }

    self.timeout = setTimeout(function () {
      if (self.hoverState == 'out') { self.hide(); }
    }, self.options.delay.hide);
  };

  Tooltip.prototype.show = function () {
    var e = $.Event('show.bs.' + this.type);

    if (this.hasContent() && this.enabled) {
      this.$element.trigger(e);

      var inDom = $.contains(this.$element[0].ownerDocument.documentElement, this.$element[0]);
      if (e.isDefaultPrevented() || !inDom) { return }
      var that = this;

      var $tip = this.tip();

      var tipId = this.getUID(this.type);

      this.setContent();
      $tip.attr('id', tipId);
      this.$element.attr('aria-describedby', tipId);

      if (this.options.animation) { $tip.addClass('fade'); }

      var placement = typeof this.options.placement == 'function' ?
        this.options.placement.call(this, $tip[0], this.$element[0]) :
        this.options.placement;

      var autoToken = /\s?auto?\s?/i;
      var autoPlace = autoToken.test(placement);
      if (autoPlace) { placement = placement.replace(autoToken, '') || 'top'; }

      $tip
        .detach()
        .css({ top: 0, left: 0, display: 'block' })
        .addClass(placement)
        .data('bs.' + this.type, this);

      this.options.container ? $tip.appendTo(this.options.container) : $tip.insertAfter(this.$element);
      this.$element.trigger('inserted.bs.' + this.type);

      var pos          = this.getPosition();
      var actualWidth  = $tip[0].offsetWidth;
      var actualHeight = $tip[0].offsetHeight;

      if (autoPlace) {
        var orgPlacement = placement;
        var viewportDim = this.getPosition(this.$viewport);

        placement = placement == 'bottom' && pos.bottom + actualHeight > viewportDim.bottom ? 'top'    :
                    placement == 'top'    && pos.top    - actualHeight < viewportDim.top    ? 'bottom' :
                    placement == 'right'  && pos.right  + actualWidth  > viewportDim.width  ? 'left'   :
                    placement == 'left'   && pos.left   - actualWidth  < viewportDim.left   ? 'right'  :
                    placement;

        $tip
          .removeClass(orgPlacement)
          .addClass(placement);
      }

      var calculatedOffset = this.getCalculatedOffset(placement, pos, actualWidth, actualHeight);

      this.applyPlacement(calculatedOffset, placement);

      var complete = function () {
        var prevHoverState = that.hoverState;
        that.$element.trigger('shown.bs.' + that.type);
        that.hoverState = null;

        if (prevHoverState == 'out') { that.leave(that); }
      };

      $.support.transition && this.$tip.hasClass('fade') ?
        $tip
          .one('bsTransitionEnd', complete)
          .emulateTransitionEnd(Tooltip.TRANSITION_DURATION) :
        complete();
    }
  };

  Tooltip.prototype.applyPlacement = function (offset, placement) {
    var $tip   = this.tip();
    var width  = $tip[0].offsetWidth;
    var height = $tip[0].offsetHeight;

    // manually read margins because getBoundingClientRect includes difference
    var marginTop = parseInt($tip.css('margin-top'), 10);
    var marginLeft = parseInt($tip.css('margin-left'), 10);

    // we must check for NaN for ie 8/9
    if (isNaN(marginTop))  { marginTop  = 0; }
    if (isNaN(marginLeft)) { marginLeft = 0; }

    offset.top  += marginTop;
    offset.left += marginLeft;

    // $.fn.offset doesn't round pixel values
    // so we use setOffset directly with our own function B-0
    $.offset.setOffset($tip[0], $.extend({
      using: function (props) {
        $tip.css({
          top: Math.round(props.top),
          left: Math.round(props.left)
        });
      }
    }, offset), 0);

    $tip.addClass('in');

    // check to see if placing tip in new offset caused the tip to resize itself
    var actualWidth  = $tip[0].offsetWidth;
    var actualHeight = $tip[0].offsetHeight;

    if (placement == 'top' && actualHeight != height) {
      offset.top = offset.top + height - actualHeight;
    }

    var delta = this.getViewportAdjustedDelta(placement, offset, actualWidth, actualHeight);

    if (delta.left) { offset.left += delta.left; }
    else { offset.top += delta.top; }

    var isVertical          = /top|bottom/.test(placement);
    var arrowDelta          = isVertical ? delta.left * 2 - width + actualWidth : delta.top * 2 - height + actualHeight;
    var arrowOffsetPosition = isVertical ? 'offsetWidth' : 'offsetHeight';

    $tip.offset(offset);
    this.replaceArrow(arrowDelta, $tip[0][arrowOffsetPosition], isVertical);
  };

  Tooltip.prototype.replaceArrow = function (delta, dimension, isVertical) {
    this.arrow()
      .css(isVertical ? 'left' : 'top', 50 * (1 - delta / dimension) + '%')
      .css(isVertical ? 'top' : 'left', '');
  };

  Tooltip.prototype.setContent = function () {
    var $tip  = this.tip();
    var title = this.getTitle();

    $tip.find('.tooltip-inner')[this.options.html ? 'html' : 'text'](title);
    $tip.removeClass('fade in top bottom left right');
  };

  Tooltip.prototype.hide = function (callback) {
    var that = this;
    var $tip = $(this.$tip);
    var e    = $.Event('hide.bs.' + this.type);

    function complete() {
      if (that.hoverState != 'in') { $tip.detach(); }
      if (that.$element) { // TODO: Check whether guarding this code with this `if` is really necessary.
        that.$element
          .removeAttr('aria-describedby')
          .trigger('hidden.bs.' + that.type);
      }
      callback && callback();
    }

    this.$element.trigger(e);

    if (e.isDefaultPrevented()) { return }

    $tip.removeClass('in');

    $.support.transition && $tip.hasClass('fade') ?
      $tip
        .one('bsTransitionEnd', complete)
        .emulateTransitionEnd(Tooltip.TRANSITION_DURATION) :
      complete();

    this.hoverState = null;

    return this
  };

  Tooltip.prototype.fixTitle = function () {
    var $e = this.$element;
    if ($e.attr('title') || typeof $e.attr('data-original-title') != 'string') {
      $e.attr('data-original-title', $e.attr('title') || '').attr('title', '');
    }
  };

  Tooltip.prototype.hasContent = function () {
    return this.getTitle()
  };

  Tooltip.prototype.getPosition = function ($element) {
    $element   = $element || this.$element;

    var el     = $element[0];
    var isBody = el.tagName == 'BODY';

    var elRect    = el.getBoundingClientRect();
    if (elRect.width == null) {
      // width and height are missing in IE8, so compute them manually; see https://github.com/twbs/bootstrap/issues/14093
      elRect = $.extend({}, elRect, { width: elRect.right - elRect.left, height: elRect.bottom - elRect.top });
    }
    var isSvg = window.SVGElement && el instanceof window.SVGElement;
    // Avoid using $.offset() on SVGs since it gives incorrect results in jQuery 3.
    // See https://github.com/twbs/bootstrap/issues/20280
    var elOffset  = isBody ? { top: 0, left: 0 } : (isSvg ? null : $element.offset());
    var scroll    = { scroll: isBody ? document.documentElement.scrollTop || document.body.scrollTop : $element.scrollTop() };
    var outerDims = isBody ? { width: $(window).width(), height: $(window).height() } : null;

    return $.extend({}, elRect, scroll, outerDims, elOffset)
  };

  Tooltip.prototype.getCalculatedOffset = function (placement, pos, actualWidth, actualHeight) {
    return placement == 'bottom' ? { top: pos.top + pos.height,   left: pos.left + pos.width / 2 - actualWidth / 2 } :
           placement == 'top'    ? { top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2 } :
           placement == 'left'   ? { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth } :
        /* placement == 'right' */ { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width }

  };

  Tooltip.prototype.getViewportAdjustedDelta = function (placement, pos, actualWidth, actualHeight) {
    var delta = { top: 0, left: 0 };
    if (!this.$viewport) { return delta }

    var viewportPadding = this.options.viewport && this.options.viewport.padding || 0;
    var viewportDimensions = this.getPosition(this.$viewport);

    if (/right|left/.test(placement)) {
      var topEdgeOffset    = pos.top - viewportPadding - viewportDimensions.scroll;
      var bottomEdgeOffset = pos.top + viewportPadding - viewportDimensions.scroll + actualHeight;
      if (topEdgeOffset < viewportDimensions.top) { // top overflow
        delta.top = viewportDimensions.top - topEdgeOffset;
      } else if (bottomEdgeOffset > viewportDimensions.top + viewportDimensions.height) { // bottom overflow
        delta.top = viewportDimensions.top + viewportDimensions.height - bottomEdgeOffset;
      }
    } else {
      var leftEdgeOffset  = pos.left - viewportPadding;
      var rightEdgeOffset = pos.left + viewportPadding + actualWidth;
      if (leftEdgeOffset < viewportDimensions.left) { // left overflow
        delta.left = viewportDimensions.left - leftEdgeOffset;
      } else if (rightEdgeOffset > viewportDimensions.right) { // right overflow
        delta.left = viewportDimensions.left + viewportDimensions.width - rightEdgeOffset;
      }
    }

    return delta
  };

  Tooltip.prototype.getTitle = function () {
    var title;
    var $e = this.$element;
    var o  = this.options;

    title = $e.attr('data-original-title')
      || (typeof o.title == 'function' ? o.title.call($e[0]) :  o.title);

    return title
  };

  Tooltip.prototype.getUID = function (prefix) {
    do { prefix += ~~(Math.random() * 1000000); }
    while (document.getElementById(prefix))
    return prefix
  };

  Tooltip.prototype.tip = function () {
    if (!this.$tip) {
      this.$tip = $(this.options.template);
      if (this.$tip.length != 1) {
        throw new Error(this.type + ' `template` option must consist of exactly 1 top-level element!')
      }
    }
    return this.$tip
  };

  Tooltip.prototype.arrow = function () {
    return (this.$arrow = this.$arrow || this.tip().find('.tooltip-arrow'))
  };

  Tooltip.prototype.enable = function () {
    this.enabled = true;
  };

  Tooltip.prototype.disable = function () {
    this.enabled = false;
  };

  Tooltip.prototype.toggleEnabled = function () {
    this.enabled = !this.enabled;
  };

  Tooltip.prototype.toggle = function (e) {
    var self = this;
    if (e) {
      self = $(e.currentTarget).data('bs.' + this.type);
      if (!self) {
        self = new this.constructor(e.currentTarget, this.getDelegateOptions());
        $(e.currentTarget).data('bs.' + this.type, self);
      }
    }

    if (e) {
      self.inState.click = !self.inState.click;
      if (self.isInStateTrue()) { self.enter(self); }
      else { self.leave(self); }
    } else {
      self.tip().hasClass('in') ? self.leave(self) : self.enter(self);
    }
  };

  Tooltip.prototype.destroy = function () {
    var that = this;
    clearTimeout(this.timeout);
    this.hide(function () {
      that.$element.off('.' + that.type).removeData('bs.' + that.type);
      if (that.$tip) {
        that.$tip.detach();
      }
      that.$tip = null;
      that.$arrow = null;
      that.$viewport = null;
      that.$element = null;
    });
  };


  // TOOLTIP PLUGIN DEFINITION
  // =========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this);
      var data    = $this.data('bs.tooltip');
      var options = typeof option == 'object' && option;

      if (!data && /destroy|hide/.test(option)) { return }
      if (!data) { $this.data('bs.tooltip', (data = new Tooltip(this, options))); }
      if (typeof option == 'string') { data[option](); }
    })
  }

  var old = $.fn.tooltip;

  $.fn.tooltip             = Plugin;
  $.fn.tooltip.Constructor = Tooltip;


  // TOOLTIP NO CONFLICT
  // ===================

  $.fn.tooltip.noConflict = function () {
    $.fn.tooltip = old;
    return this
  };

}(jQuery);

/* ========================================================================
 * Bootstrap: popover.js v3.3.7
 * http://getbootstrap.com/javascript/#popovers
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // POPOVER PUBLIC CLASS DEFINITION
  // ===============================

  var Popover = function (element, options) {
    this.init('popover', element, options);
  };

  if (!$.fn.tooltip) { throw new Error('Popover requires tooltip.js') }

  Popover.VERSION  = '3.3.7';

  Popover.DEFAULTS = $.extend({}, $.fn.tooltip.Constructor.DEFAULTS, {
    placement: 'right',
    trigger: 'click',
    content: '',
    template: '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
  });


  // NOTE: POPOVER EXTENDS tooltip.js
  // ================================

  Popover.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype);

  Popover.prototype.constructor = Popover;

  Popover.prototype.getDefaults = function () {
    return Popover.DEFAULTS
  };

  Popover.prototype.setContent = function () {
    var $tip    = this.tip();
    var title   = this.getTitle();
    var content = this.getContent();

    $tip.find('.popover-title')[this.options.html ? 'html' : 'text'](title);
    $tip.find('.popover-content').children().detach().end()[ // we use append for html objects to maintain js events
      this.options.html ? (typeof content == 'string' ? 'html' : 'append') : 'text'
    ](content);

    $tip.removeClass('fade top bottom left right in');

    // IE8 doesn't accept hiding via the `:empty` pseudo selector, we have to do
    // this manually by checking the contents.
    if (!$tip.find('.popover-title').html()) { $tip.find('.popover-title').hide(); }
  };

  Popover.prototype.hasContent = function () {
    return this.getTitle() || this.getContent()
  };

  Popover.prototype.getContent = function () {
    var $e = this.$element;
    var o  = this.options;

    return $e.attr('data-content')
      || (typeof o.content == 'function' ?
            o.content.call($e[0]) :
            o.content)
  };

  Popover.prototype.arrow = function () {
    return (this.$arrow = this.$arrow || this.tip().find('.arrow'))
  };


  // POPOVER PLUGIN DEFINITION
  // =========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this);
      var data    = $this.data('bs.popover');
      var options = typeof option == 'object' && option;

      if (!data && /destroy|hide/.test(option)) { return }
      if (!data) { $this.data('bs.popover', (data = new Popover(this, options))); }
      if (typeof option == 'string') { data[option](); }
    })
  }

  var old = $.fn.popover;

  $.fn.popover             = Plugin;
  $.fn.popover.Constructor = Popover;


  // POPOVER NO CONFLICT
  // ===================

  $.fn.popover.noConflict = function () {
    $.fn.popover = old;
    return this
  };

}(jQuery);

/* ========================================================================
 * Bootstrap: scrollspy.js v3.3.7
 * http://getbootstrap.com/javascript/#scrollspy
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // SCROLLSPY CLASS DEFINITION
  // ==========================

  function ScrollSpy(element, options) {
    this.$body          = $(document.body);
    this.$scrollElement = $(element).is(document.body) ? $(window) : $(element);
    this.options        = $.extend({}, ScrollSpy.DEFAULTS, options);
    this.selector       = (this.options.target || '') + ' .nav li > a';
    this.offsets        = [];
    this.targets        = [];
    this.activeTarget   = null;
    this.scrollHeight   = 0;

    this.$scrollElement.on('scroll.bs.scrollspy', $.proxy(this.process, this));
    this.refresh();
    this.process();
  }

  ScrollSpy.VERSION  = '3.3.7';

  ScrollSpy.DEFAULTS = {
    offset: 10
  };

  ScrollSpy.prototype.getScrollHeight = function () {
    return this.$scrollElement[0].scrollHeight || Math.max(this.$body[0].scrollHeight, document.documentElement.scrollHeight)
  };

  ScrollSpy.prototype.refresh = function () {
    var that          = this;
    var offsetMethod  = 'offset';
    var offsetBase    = 0;

    this.offsets      = [];
    this.targets      = [];
    this.scrollHeight = this.getScrollHeight();

    if (!$.isWindow(this.$scrollElement[0])) {
      offsetMethod = 'position';
      offsetBase   = this.$scrollElement.scrollTop();
    }

    this.$body
      .find(this.selector)
      .map(function () {
        var $el   = $(this);
        var href  = $el.data('target') || $el.attr('href');
        var $href = /^#./.test(href) && $(href);

        return ($href
          && $href.length
          && $href.is(':visible')
          && [[$href[offsetMethod]().top + offsetBase, href]]) || null
      })
      .sort(function (a, b) { return a[0] - b[0] })
      .each(function () {
        that.offsets.push(this[0]);
        that.targets.push(this[1]);
      });
  };

  ScrollSpy.prototype.process = function () {
    var this$1 = this;

    var scrollTop    = this.$scrollElement.scrollTop() + this.options.offset;
    var scrollHeight = this.getScrollHeight();
    var maxScroll    = this.options.offset + scrollHeight - this.$scrollElement.height();
    var offsets      = this.offsets;
    var targets      = this.targets;
    var activeTarget = this.activeTarget;
    var i;

    if (this.scrollHeight != scrollHeight) {
      this.refresh();
    }

    if (scrollTop >= maxScroll) {
      return activeTarget != (i = targets[targets.length - 1]) && this.activate(i)
    }

    if (activeTarget && scrollTop < offsets[0]) {
      this.activeTarget = null;
      return this.clear()
    }

    for (i = offsets.length; i--;) {
      activeTarget != targets[i]
        && scrollTop >= offsets[i]
        && (offsets[i + 1] === undefined || scrollTop < offsets[i + 1])
        && this$1.activate(targets[i]);
    }
  };

  ScrollSpy.prototype.activate = function (target) {
    this.activeTarget = target;

    this.clear();

    var selector = this.selector +
      '[data-target="' + target + '"],' +
      this.selector + '[href="' + target + '"]';

    var active = $(selector)
      .parents('li')
      .addClass('active');

    if (active.parent('.dropdown-menu').length) {
      active = active
        .closest('li.dropdown')
        .addClass('active');
    }

    active.trigger('activate.bs.scrollspy');
  };

  ScrollSpy.prototype.clear = function () {
    $(this.selector)
      .parentsUntil(this.options.target, '.active')
      .removeClass('active');
  };


  // SCROLLSPY PLUGIN DEFINITION
  // ===========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this);
      var data    = $this.data('bs.scrollspy');
      var options = typeof option == 'object' && option;

      if (!data) { $this.data('bs.scrollspy', (data = new ScrollSpy(this, options))); }
      if (typeof option == 'string') { data[option](); }
    })
  }

  var old = $.fn.scrollspy;

  $.fn.scrollspy             = Plugin;
  $.fn.scrollspy.Constructor = ScrollSpy;


  // SCROLLSPY NO CONFLICT
  // =====================

  $.fn.scrollspy.noConflict = function () {
    $.fn.scrollspy = old;
    return this
  };


  // SCROLLSPY DATA-API
  // ==================

  $(window).on('load.bs.scrollspy.data-api', function () {
    $('[data-spy="scroll"]').each(function () {
      var $spy = $(this);
      Plugin.call($spy, $spy.data());
    });
  });

}(jQuery);

/* ========================================================================
 * Bootstrap: tab.js v3.3.7
 * http://getbootstrap.com/javascript/#tabs
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // TAB CLASS DEFINITION
  // ====================

  var Tab = function (element) {
    // jscs:disable requireDollarBeforejQueryAssignment
    this.element = $(element);
    // jscs:enable requireDollarBeforejQueryAssignment
  };

  Tab.VERSION = '3.3.7';

  Tab.TRANSITION_DURATION = 150;

  Tab.prototype.show = function () {
    var $this    = this.element;
    var $ul      = $this.closest('ul:not(.dropdown-menu)');
    var selector = $this.data('target');

    if (!selector) {
      selector = $this.attr('href');
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, ''); // strip for ie7
    }

    if ($this.parent('li').hasClass('active')) { return }

    var $previous = $ul.find('.active:last a');
    var hideEvent = $.Event('hide.bs.tab', {
      relatedTarget: $this[0]
    });
    var showEvent = $.Event('show.bs.tab', {
      relatedTarget: $previous[0]
    });

    $previous.trigger(hideEvent);
    $this.trigger(showEvent);

    if (showEvent.isDefaultPrevented() || hideEvent.isDefaultPrevented()) { return }

    var $target = $(selector);

    this.activate($this.closest('li'), $ul);
    this.activate($target, $target.parent(), function () {
      $previous.trigger({
        type: 'hidden.bs.tab',
        relatedTarget: $this[0]
      });
      $this.trigger({
        type: 'shown.bs.tab',
        relatedTarget: $previous[0]
      });
    });
  };

  Tab.prototype.activate = function (element, container, callback) {
    var $active    = container.find('> .active');
    var transition = callback
      && $.support.transition
      && ($active.length && $active.hasClass('fade') || !!container.find('> .fade').length);

    function next() {
      $active
        .removeClass('active')
        .find('> .dropdown-menu > .active')
          .removeClass('active')
        .end()
        .find('[data-toggle="tab"]')
          .attr('aria-expanded', false);

      element
        .addClass('active')
        .find('[data-toggle="tab"]')
          .attr('aria-expanded', true);

      if (transition) {
        element[0].offsetWidth; // reflow for transition
        element.addClass('in');
      } else {
        element.removeClass('fade');
      }

      if (element.parent('.dropdown-menu').length) {
        element
          .closest('li.dropdown')
            .addClass('active')
          .end()
          .find('[data-toggle="tab"]')
            .attr('aria-expanded', true);
      }

      callback && callback();
    }

    $active.length && transition ?
      $active
        .one('bsTransitionEnd', next)
        .emulateTransitionEnd(Tab.TRANSITION_DURATION) :
      next();

    $active.removeClass('in');
  };


  // TAB PLUGIN DEFINITION
  // =====================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data  = $this.data('bs.tab');

      if (!data) { $this.data('bs.tab', (data = new Tab(this))); }
      if (typeof option == 'string') { data[option](); }
    })
  }

  var old = $.fn.tab;

  $.fn.tab             = Plugin;
  $.fn.tab.Constructor = Tab;


  // TAB NO CONFLICT
  // ===============

  $.fn.tab.noConflict = function () {
    $.fn.tab = old;
    return this
  };


  // TAB DATA-API
  // ============

  var clickHandler = function (e) {
    e.preventDefault();
    Plugin.call($(this), 'show');
  };

  $(document)
    .on('click.bs.tab.data-api', '[data-toggle="tab"]', clickHandler)
    .on('click.bs.tab.data-api', '[data-toggle="pill"]', clickHandler);

}(jQuery);

/* ========================================================================
 * Bootstrap: affix.js v3.3.7
 * http://getbootstrap.com/javascript/#affix
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // AFFIX CLASS DEFINITION
  // ======================

  var Affix = function (element, options) {
    this.options = $.extend({}, Affix.DEFAULTS, options);

    this.$target = $(this.options.target)
      .on('scroll.bs.affix.data-api', $.proxy(this.checkPosition, this))
      .on('click.bs.affix.data-api',  $.proxy(this.checkPositionWithEventLoop, this));

    this.$element     = $(element);
    this.affixed      = null;
    this.unpin        = null;
    this.pinnedOffset = null;

    this.checkPosition();
  };

  Affix.VERSION  = '3.3.7';

  Affix.RESET    = 'affix affix-top affix-bottom';

  Affix.DEFAULTS = {
    offset: 0,
    target: window
  };

  Affix.prototype.getState = function (scrollHeight, height, offsetTop, offsetBottom) {
    var scrollTop    = this.$target.scrollTop();
    var position     = this.$element.offset();
    var targetHeight = this.$target.height();

    if (offsetTop != null && this.affixed == 'top') { return scrollTop < offsetTop ? 'top' : false }

    if (this.affixed == 'bottom') {
      if (offsetTop != null) { return (scrollTop + this.unpin <= position.top) ? false : 'bottom' }
      return (scrollTop + targetHeight <= scrollHeight - offsetBottom) ? false : 'bottom'
    }

    var initializing   = this.affixed == null;
    var colliderTop    = initializing ? scrollTop : position.top;
    var colliderHeight = initializing ? targetHeight : height;

    if (offsetTop != null && scrollTop <= offsetTop) { return 'top' }
    if (offsetBottom != null && (colliderTop + colliderHeight >= scrollHeight - offsetBottom)) { return 'bottom' }

    return false
  };

  Affix.prototype.getPinnedOffset = function () {
    if (this.pinnedOffset) { return this.pinnedOffset }
    this.$element.removeClass(Affix.RESET).addClass('affix');
    var scrollTop = this.$target.scrollTop();
    var position  = this.$element.offset();
    return (this.pinnedOffset = position.top - scrollTop)
  };

  Affix.prototype.checkPositionWithEventLoop = function () {
    setTimeout($.proxy(this.checkPosition, this), 1);
  };

  Affix.prototype.checkPosition = function () {
    if (!this.$element.is(':visible')) { return }

    var height       = this.$element.height();
    var offset       = this.options.offset;
    var offsetTop    = offset.top;
    var offsetBottom = offset.bottom;
    var scrollHeight = Math.max($(document).height(), $(document.body).height());

    if (typeof offset != 'object')         { offsetBottom = offsetTop = offset; }
    if (typeof offsetTop == 'function')    { offsetTop    = offset.top(this.$element); }
    if (typeof offsetBottom == 'function') { offsetBottom = offset.bottom(this.$element); }

    var affix = this.getState(scrollHeight, height, offsetTop, offsetBottom);

    if (this.affixed != affix) {
      if (this.unpin != null) { this.$element.css('top', ''); }

      var affixType = 'affix' + (affix ? '-' + affix : '');
      var e         = $.Event(affixType + '.bs.affix');

      this.$element.trigger(e);

      if (e.isDefaultPrevented()) { return }

      this.affixed = affix;
      this.unpin = affix == 'bottom' ? this.getPinnedOffset() : null;

      this.$element
        .removeClass(Affix.RESET)
        .addClass(affixType)
        .trigger(affixType.replace('affix', 'affixed') + '.bs.affix');
    }

    if (affix == 'bottom') {
      this.$element.offset({
        top: scrollHeight - height - offsetBottom
      });
    }
  };


  // AFFIX PLUGIN DEFINITION
  // =======================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this);
      var data    = $this.data('bs.affix');
      var options = typeof option == 'object' && option;

      if (!data) { $this.data('bs.affix', (data = new Affix(this, options))); }
      if (typeof option == 'string') { data[option](); }
    })
  }

  var old = $.fn.affix;

  $.fn.affix             = Plugin;
  $.fn.affix.Constructor = Affix;


  // AFFIX NO CONFLICT
  // =================

  $.fn.affix.noConflict = function () {
    $.fn.affix = old;
    return this
  };


  // AFFIX DATA-API
  // ==============

  $(window).on('load', function () {
    $('[data-spy="affix"]').each(function () {
      var $spy = $(this);
      var data = $spy.data();

      data.offset = data.offset || {};

      if (data.offsetBottom != null) { data.offset.bottom = data.offsetBottom; }
      if (data.offsetTop    != null) { data.offset.top    = data.offsetTop; }

      Plugin.call($spy, data);
    });
  });

}(jQuery);

journey.on( "routeAbuseStart", function ( ) {
	Ractive.defaults.transitionsEnabled = false;
	console.log( "* Animation disabled" );
} );
journey.on( "routeAbuseEnd", function ( ) {
	Ractive.defaults.transitionsEnabled = true;
	console.log( "** Renabling animations" );
} );

//let contextPath = "/dist";
var contextPath = "/journey-examples";
//let contextPath = "";

menu.init( { target: "#menu", fallbackMenu: "#menu-home" } );

Ractive.transitions = {
	fade: fade
};

journey.on( "entered", function ( options ) {
	Prism.highlightAll();
} );

journey.start( {
	target: "#container",
	debug: Ractive.DEBUG = true,
	fallback: '/notFound',
	base: contextPath,
	defaultRoute: '/home',
	useOnHashChange: false,
	useHash: false,
	hash: '#!'
} );

}());
//# sourceMappingURL=app.js.map
