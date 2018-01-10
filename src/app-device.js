/**
 * App device detector
 * 
 * @fileoverview Analyse the user agent
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 * 
 * @namespace App.device
 * @requires App
 */
(function ($, global, undefined) {
	'use strict';
	
	/**
	 * Factory for the query string parser
	 * @return {Object} accessible methods
	 */
	var queryStringParser = (function () {
		var a = /\+/g; // Regex for replacing addition symbol with a space
		var r = /([^&=]+)=?([^&]*)/gi;
		var d = function (s) {
			return decodeURIComponent(s.replace(a, ' '));
		};
		
		/**
		 * Format the querystring into an object
		 * @name prase
		 * @memberof App.routing
		 * @method
		 * @param {String} qs
		 * @returns {Object}
		 * @public
		 */
		var parse = function (qs) {
			var u = {};
			var e, q;
			
			//if we dont have the parameter qs, use the window location search value
			if (qs !== '' && !qs) {
				qs = window.location.search;
			}
			
			//remove the first caracter (?)
			q = qs.substring(1);

			while ((e = r.exec(q))) {
				u[d(e[1])] = d(e[2]);
			}
			
			return u;
		};
		
		/**
		 * Format the object into a valid query string
		 * @name stringify
		 * @memberof App.routing
		 * @method
		 * @param {Object} qs Object needed to be transformed into a string
		 * @returns {String} Result
		 * @public
		 */
		var stringify = function (qs) {
			var aqs = [];
			$.each(qs, function (k, v) {
				if (!!v) {
					aqs.push(k + '=' + global.encodeURIComponent(v));
				}
			});
			if (!aqs.length) {
				return '';
			}
			return '?' + aqs.join('&');
		};
		
		return {
			parse: parse,
			stringify: stringify
		};
	})();
	
	/**
	 * Factory for the browser detector
	 * @name browserDetector
	 * @memberof App.device
	 * @method
	 * @returns {Object} accessible functions
	 * @private
	 */
	var browserDetector = (function () {

		/**
		 * Get the user agent
		 * @name getUserAgent
		 * @memberof App.device
		 * @method
		 * @param {String} userAgent
		 * @returns {String} user agent
		 * @private
		 */
		var getUserAgent = function (userAgent) {
			if (!userAgent) {
				return window.navigator.userAgent;
			}
			return userAgent;
		};
		
		/**
		 * Test the user agent with the given regular expression
		 * @name testUserAgent
		 * @memberof App.device
		 * @method
		 * @param {RegExp} regexp 
		 * @param {String} userAgent
		 * @returns {Boolean} if the test passed or not
		 * @private
		 */
		var testUserAgent = function (regexp, userAgent) {
			userAgent = getUserAgent(userAgent);
			return regexp.test(userAgent);
		};
		
		var detector = {
		
			/**
			 * Check if the device is a mobile one and not an iPhone
			 * @name isTablet
			 * @memberof App.device
			 * @method
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isTablet: function (userAgent) {
				return detector.isMobile(userAgent) &&
					!detector.isPhone(userAgent);
			},
			
			/** @deprecated */
			isTablette: function (userAgent) {
				return this.isTablet(userAgent);
			},
			
			/**
			 * Check if the device is an iPhone or an iPad
			 * @name isIos
			 * @method
			 * @memberof App.device
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isIos: function (userAgent) {
				return detector.isIphone(userAgent) ||
					detector.isIpad(userAgent);
			},
			
			/**
			 * Check if the user agent contains the word 'iPhone' or 'iPod'
			 * @name isIphone
			 * @method
			 * @memberof App.device
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isIphone: function (userAgent) {
				return !detector.isIpad(userAgent) &&
					(testUserAgent(/iPhone/i, userAgent) || testUserAgent(/iPod/i, userAgent));
			},
			
			/**
			 * Check if the user agent contains the word 'iPad'
			 * @name isIpad
			 * @method
			 * @memberof App.device
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isIpad: function (userAgent) {
				return testUserAgent(/iPad/i, userAgent);
			},
			
			/**
			 * Check if the user agent contains the word 'Android'
			 * @name isAndroid
			 * @method
			 * @memberof App.device
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isAndroid: function (userAgent) {
				return testUserAgent(/Android/i, userAgent);
			},
			
			/**
			 * Check if the device runs on Android
			 * and the user agent contains the word 'mobile'
			 * @name isAndroidPhone
			 * @method
			 * @memberof App.device
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isAndroidPhone: function (userAgent) {
				return detector.isAndroid(userAgent) &&
					testUserAgent(/mobile/i, userAgent);
			},
			
			/**
			 * Check if the device is a phone
			 * @name isPhone
			 * @method
			 * @memberof isIphone
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isPhone: function (userAgent) {
				return !detector.isIpad(userAgent) && (
					detector.isOtherPhone(userAgent) ||
					detector.isAndroidPhone(userAgent) ||
					detector.isIphone(userAgent));
			},
			
			/**
			 * Check if the user agent contains the word 'phone'
			 * @name isOtherPhone
			 * @method
			 * @memberof App.device
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isOtherPhone: function (userAgent) {
				return testUserAgent(/phone/i, userAgent);
			},
			
			/**
			 * Check if the user agent contains the word 'mobile'
			 * of if it's another phone
			 * @name isOtherMobile
			 * @method
			 * @memberof App.device
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isOtherMobile: function (userAgent) {
				return testUserAgent(/mobile/i, userAgent) ||
					detector.isOtherPhone(userAgent);
			},
			
			/**
			 * Check if the device runs on Android, iOs or other mobile
			 * @name isMobile
			 * @method
			 * @memberof App.device
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isMobile: function (userAgent) {
				return detector.isIos(userAgent) ||
					detector.isAndroid(userAgent) ||
					detector.isOtherMobile(userAgent);
			},
			
			/**
			 * Check if the user agent contains the word 'msie' or 'trident'
			 * @name isMsie
			 * @method
			 * @memberof App.device
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isMsie: function (userAgent) {
				return testUserAgent(/msie/mi, userAgent) ||
					testUserAgent(/trident/mi, userAgent);
			},

			/**
			 * Check if the user agent contains the word 'Safari' and does not
			 * contain the word 'Chrome'
			 * @name isSafari
			 * @method
			 * @memberof App.device
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isSafari: function (userAgent) {
				return !(testUserAgent(/Chrome/i, userAgent)) &&
					testUserAgent(/Safari/i, userAgent);
			},

			/**
			 * Check if the user agent contains the word 'Firefox'
			 * @name isFirefox
			 * @method
			 * @memberof isFirefox
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isFirefox: function (userAgent) {
				return testUserAgent(/Firefox/i, userAgent);
			},

			/**
			 * Check if the user agent contains the word 'Edge'
			 * @name isEdge
			 * @method
			 * @memberof App.device
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isEdge: function (userAgent) {
				return testUserAgent(/Edge/i, userAgent);
			},

			/**
			 * Check if the user agent contains the word 'Chrome' and it's not Edge
			 * @name isChrome
			 * @method
			 * @memberof App.device
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isChrome: function (userAgent) {
				return testUserAgent(/Chrome/i, userAgent) && !detector.isEdge();
			}

			/*isUnsupported : function (userAgent) {
				var
				b;
				userAgent = getUserAgent(userAgent);
				b = $.uaMatch(userAgent);
				
				return b.browser === "" || (b.browser == 'msie' && parseInt(b.version,10)) < 9;
			}*/
		};
		
		// return newly created object
		return detector;
	})();
	
	/** Public Interfaces **/
	global.App = $.extend(global.App, {
		routing: {
			querystring: queryStringParser
		},
		
		device: {

			/**
			 * Object with all the device detection methods
			 * @name detector
			 * @public
			 * @memberof App.device
			 * @returns {Object} Detector
			 */
			detector: browserDetector,

			/**
			 * Check if the device is an iPhone
			 * @name iphone
			 * @constant
			 * @public
			 * @memberof App.device
			 */
			iphone: browserDetector.isIphone(),

			/**
			 * Check if the device is an iPad
			 * @name ipad
			 * @constant
			 * @public
			 * @memberof App.device
			 */
			ipad: browserDetector.isIpad(),

			/**
			 * Check if the device run on iOs
			 * @name ios
			 * @constant
			 * @public
			 * @memberof App.device
			 */
			ios: browserDetector.isIos(),

			/**
			 * Check if the device run on Android
			 * @name android
			 * @constant
			 * @public
			 * @memberof App.device
			 */
			android: browserDetector.isAndroid(),

			/**
			 * Check if the device is a mobile
			 * @name mobile
			 * @constant
			 * @public
			 * @memberof App.device
			 */
			mobile: browserDetector.isMobile(),

			/**
			 * Check if the device is a phone
			 * @name phone
			 * @constant
			 * @public
			 * @memberof App.device
			 */
			phone: browserDetector.isPhone(),

			/**
			 * Check if the device is a tablet
			 * @name tablet
			 * @constant
			 * @public
			 * @memberof App.device
			 */
			tablet: browserDetector.isTablet(),

			/**
			 * Check if the browser is Chrome
			 * @name chrome
			 * @constant
			 * @public
			 * @memberof App.device
			 */
			chrome: browserDetector.isChrome(),

			/**
			 * Check if the browser is Firefox
			 * @name firefox
			 * @constant
			 * @public
			 * @memberof App.device
			 */
			firefox: browserDetector.isFirefox(),

			/**
			 * Check if the browser is Safari
			 * @name safari
			 * @constant
			 * @public
			 * @memberof App.device
			 */
			safari: browserDetector.isSafari(),

			/**
			 * Check if the browser is Internet Explorer
			 * @name internetexplorer
			 * @constant
			 * @public
			 * @memberof App.device
			 */
			internetexplorer: browserDetector.isMsie(),

			/**
			 * Check if the browser is Edge
			 * @name edge
			 * @constant
			 * @public
			 * @memberof App.device
			 */
			edge: browserDetector.isEdge(),

			/**
			 * @name events
			 * @constant
			 * @public
			 * @memberof App.device
			 * @property {String} click Click event
			 * @property {String} enter 'pointerenter' equivalent
			 * @property {String} up 'pointerup' equivalent
			 * @property {String} down 'pointerdown' equivalent
			 * @property {String} move 'pointermove' equivalent
			 * @property {String} over 'pointerover' equivalent
			 * @property {String} out 'pointerout' equivalent
			 * @property {String} leave 'pointerleave' equivalent
			 */
			events: {
				click: 'click',
				enter: 'pointerenter',
				up: 'pointerup',
				down: 'pointerdown',
				move: 'pointermove',
				over: 'pointerover',
				out: 'pointerout',
				leave: 'pointerleave'
			}
		}
	});
	
	/* @deprecated values */
	
	// Query string Parser
	// http://stackoverflow.com/questions/901115/get-query-string-values-in-javascript
	
	global.QueryStringParser = queryStringParser;
	
	//Parse the query string and store a copy of the result in the global object
	global.QS = queryStringParser.parse();
	
	// Browser detector
	global.BrowserDetector = browserDetector;
	
	// User Agent short-hands
	$.chrome = browserDetector.isChrome();
	$.firefox = browserDetector.isFirefox();
	$.safari = browserDetector.isSafari();
	$.internetexplorer = browserDetector.isMsie();
	$.edge = browserDetector.isEdge();
	$.iphone = browserDetector.isIphone();
	$.ipad = browserDetector.isIpad();
	$.ios = browserDetector.isIos();
	$.mobile = browserDetector.isMobile();
	$.android = browserDetector.isAndroid();
	$.phone = browserDetector.isPhone();
	$.tablet = browserDetector.isTablet();
	$.touch = $.ios || $.android;
	$.click = App.device.events.click;
	
})(jQuery, window);
