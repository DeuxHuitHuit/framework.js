/**
 * @author Deux Huit Huit
 */

/**
 * Browser Support/Detection
 */
(function ($, global, undefined) {
	'use strict';
	
	var queryStringParser = (function () {
		var a = /\+/g; // Regex for replacing addition symbol with a space
		var r = /([^&=]+)=?([^&]*)/gi;
		var d = function (s) {
			return decodeURIComponent(s.replace(a, ' '));
		};
		
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
	
	var browserDetector = (function () {
		var getUserAgent = function (userAgent) {
			if (!userAgent) {
				return window.navigator.userAgent;
			}
			return userAgent;
		};
		
		var testUserAgent = function (regexp, userAgent) {
			userAgent = getUserAgent(userAgent);
			return regexp.test(userAgent);
		};
		
		var detector = {
		
			isTablet: function (userAgent) {
				return detector.isMobile(userAgent) &&
					!detector.isPhone(userAgent);
			},
			
			/* @deprecated */
			isTablette: function (userAgent) {
				return this.isTablet(userAgent);
			},
			
			isIos: function (userAgent) {
				return detector.isIphone(userAgent) ||
					detector.isIpad(userAgent);
			},
			
			isIphone: function (userAgent) {
				return !detector.isIpad(userAgent) &&
					(testUserAgent(/iPhone/i, userAgent) || testUserAgent(/iPod/i, userAgent));
			},
			
			isIpad: function (userAgent) {
				return testUserAgent(/iPad/i, userAgent);
			},
			
			isAndroid: function (userAgent) {
				return testUserAgent(/Android/i, userAgent);
			},
			
			isAndroidPhone: function (userAgent) {
				return detector.isAndroid(userAgent) &&
					testUserAgent(/mobile/i, userAgent);
			},
			
			isPhone: function (userAgent) {
				return !detector.isIpad(userAgent) && (
					detector.isOtherPhone(userAgent) ||
					detector.isAndroidPhone(userAgent) ||
					detector.isIphone(userAgent));
			},
			
			isOtherPhone: function (userAgent) {
				return testUserAgent(/phone/i, userAgent);
			},
			
			isOtherMobile: function (userAgent) {
				return testUserAgent(/mobile/i, userAgent) ||
					detector.isOtherPhone(userAgent);
			},
			
			isMobile: function (userAgent) {
				return detector.isIos(userAgent) ||
					detector.isAndroid(userAgent) ||
					detector.isOtherMobile(userAgent);
			},
			
			isMsie: function (userAgent) {
				return testUserAgent(/msie/mi, userAgent) ||
					testUserAgent(/trident/mi, userAgent);
			},

			isSafari: function (userAgent) {
				return !(testUserAgent(/Chrome/i, userAgent)) &&
					testUserAgent(/Safari/i, userAgent);
			},

			isChrome: function (userAgent) {
				return testUserAgent(/Chrome/i, userAgent);
			},

			isFirefox: function (userAgent) {
				return testUserAgent(/Firefox/i, userAgent);
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
