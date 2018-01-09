/**
 * @author Deux Huit Huit
 */

/**
 * Browser Support/Detection
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
		 * @param {String} qs
		 * @returns {Object}
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
		 * @param {Object} qs 
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
	 * @returns {Object} accessible functions
	 */
	var browserDetector = (function () {

		/**
		 * Get the user agent
		 * @param {String} userAgent
		 * @returns {String} user agent
		 */
		var getUserAgent = function (userAgent) {
			if (!userAgent) {
				return window.navigator.userAgent;
			}
			return userAgent;
		};
		
		/**
		 * Test the user agent with the given regular expression
		 * @param {RegExp} regexp 
		 * @param {String} userAgent
		 * @returns {Boolean} if the test passed or not
		 */
		var testUserAgent = function (regexp, userAgent) {
			userAgent = getUserAgent(userAgent);
			return regexp.test(userAgent);
		};
		
		var detector = {
		
			/**
			 * Check if the device is a mobile one and not an iPhone
			 * @param {String} userAgent the browser user agent
			 * @returns {Boolean}
			 */
			isTablet: function (userAgent) {
				return detector.isMobile(userAgent) &&
					!detector.isPhone(userAgent);
			},
			
			/* @deprecated */
			isTablette: function (userAgent) {
				return this.isTablet(userAgent);
			},
			
			/**
			 * Check if the device is an iPhone or an iPad
			 * @param {String} userAgent the browser user agent
			 * @returns {Boolean}
			 */
			isIos: function (userAgent) {
				return detector.isIphone(userAgent) ||
					detector.isIpad(userAgent);
			},
			
			/**
			 * Check if the user agent contains the word 'iPhone' or 'iPod'
			 * @param {String} userAgent the browser user agent
			 * @returns {Boolean}
			 */
			isIphone: function (userAgent) {
				return !detector.isIpad(userAgent) &&
					(testUserAgent(/iPhone/i, userAgent) || testUserAgent(/iPod/i, userAgent));
			},
			
			/**
			 * Check if the user agent contains the word 'iPad'
			 * @param {String} userAgent the browser user agent
			 * @returns {Boolean}
			 */
			isIpad: function (userAgent) {
				return testUserAgent(/iPad/i, userAgent);
			},
			
			/**
			 * Check if the user agent contains the word 'Android'
			 * @param {String} userAgent the browser user agent
			 * @returns {Boolean}
			 */
			isAndroid: function (userAgent) {
				return testUserAgent(/Android/i, userAgent);
			},
			
			/**
			 * Check if the device runs on Android
			 * and the user agent contains the word 'mobile'
			 * @param {String} userAgent the browser user agent
			 * @returns {Boolean}
			 */
			isAndroidPhone: function (userAgent) {
				return detector.isAndroid(userAgent) &&
					testUserAgent(/mobile/i, userAgent);
			},
			
			/**
			 * Check if the device is a phone
			 * @param {String} userAgent the browser user agent
			 * @returns {Boolean}
			 */
			isPhone: function (userAgent) {
				return !detector.isIpad(userAgent) && (
					detector.isOtherPhone(userAgent) ||
					detector.isAndroidPhone(userAgent) ||
					detector.isIphone(userAgent));
			},
			
			/**
			 * Check if the user agent contains the word 'phone'
			 * @param {String} userAgent the browser user agent
			 * @returns {Boolean}
			 */
			isOtherPhone: function (userAgent) {
				return testUserAgent(/phone/i, userAgent);
			},
			
			/**
			 * Check if the user agent contains the word 'mobile'
			 * of if it's another phone
			 * @param {String} userAgent the browser user agent
			 * @returns {Boolean}
			 */
			isOtherMobile: function (userAgent) {
				return testUserAgent(/mobile/i, userAgent) ||
					detector.isOtherPhone(userAgent);
			},
			
			/**
			 * Check if the device runs on Android, iOs or other mobile
			 * @param {String} userAgent the browser user agent
			 * @returns {Boolean}
			 */
			isMobile: function (userAgent) {
				return detector.isIos(userAgent) ||
					detector.isAndroid(userAgent) ||
					detector.isOtherMobile(userAgent);
			},
			
			/**
			 * Check if the user agent contains the word 'msie' or 'trident'
			 * @param {String} userAgent the browser user agent
			 * @returns {Boolean}
			 */
			isMsie: function (userAgent) {
				return testUserAgent(/msie/mi, userAgent) ||
					testUserAgent(/trident/mi, userAgent);
			},

			/**
			 * Check if the user agent contains the word 'Safari' and does not
			 * contain the word 'Chrome'
			 * @param {String} userAgent the browser user agent
			 * @returns {Boolean}
			 */
			isSafari: function (userAgent) {
				return !(testUserAgent(/Chrome/i, userAgent)) &&
					testUserAgent(/Safari/i, userAgent);
			},

			/**
			 * Check if the user agent contains the word 'Firefox'
			 * @param {String} userAgent the browser user agent
			 * @returns {Boolean}
			 */
			isFirefox: function (userAgent) {
				return testUserAgent(/Firefox/i, userAgent);
			},

			/**
			 * Check if the user agent contains the word 'Edge'
			 * @param {String} userAgent the browser user agent
			 * @returns {Boolean}
			 */
			isEdge: function (userAgent) {
				return testUserAgent(/Edge/i, userAgent);
			},

			/**
			 * Check if the user agent contains the word 'Chrome' and it's not Edge
			 * @param {String} userAgent the browser user agent
			 * @returns {Boolean}
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
			detector: browserDetector,
			iphone: browserDetector.isIphone(),
			ipad: browserDetector.isIpad(),
			ios: browserDetector.isIos(),
			android: browserDetector.isAndroid(),
			mobile: browserDetector.isMobile(),
			phone: browserDetector.isPhone(),
			tablet: browserDetector.isTablet(),
			chrome: browserDetector.isChrome(),
			firefox: browserDetector.isFirefox(),
			safari: browserDetector.isSafari(),
			internetexplorer: browserDetector.isMsie(),
			edge: browserDetector.isEdge(),
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
