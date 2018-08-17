/**
 * App device detector
 *
 * @fileoverview Analyse the user agent
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 *
 * @namespace device
 * @memberof App
 * @requires App
 */
(function ($, global, undefined) {
	'use strict';
	
	/**
	 * Factory for the browser detector
	 * @name browserDetector
	 * @memberof device
	 * @method
	 * @returns {Object} accessible functions
	 * @private
	 */
	var browserDetector = (function () {

		/**
		 * Get the user agent
		 * @name getUserAgent
		 * @memberof device
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
		 * @memberof device
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
			 * @memberof device
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
			 * @memberof device
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
			 * @memberof device
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
			 * @memberof device
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
			 * @memberof device
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
			 * @memberof device
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
			 * @memberof device
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
			 * @memberof device
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
			 * @memberof device
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
			 * @memberof device
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
			 * @memberof device
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
			 * @memberof device
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
			 * @memberof device
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isChrome: function (userAgent) {
				return testUserAgent(/Chrome/i, userAgent) && !detector.isEdge();
			}
		};
		
		// return newly created object
		return detector;
	})();
	
	/** Public Interfaces **/
	global.App = $.extend(global.App, {
		device: {

			/**
			 * Object with all the device detection methods
			 * @name detector
			 * @public
			 * @memberof device
			 * @returns {Object} Detector
			 */
			detector: browserDetector,

			/**
			 * Check if the device is an iPhone
			 * @name iphone
			 * @constant
			 * @public
			 * @memberof device
			 */
			iphone: browserDetector.isIphone(),

			/**
			 * Check if the device is an iPad
			 * @name ipad
			 * @constant
			 * @public
			 * @memberof device
			 */
			ipad: browserDetector.isIpad(),

			/**
			 * Check if the device run on iOs
			 * @name ios
			 * @constant
			 * @public
			 * @memberof device
			 */
			ios: browserDetector.isIos(),

			/**
			 * Check if the device run on Android
			 * @name android
			 * @constant
			 * @public
			 * @memberof device
			 */
			android: browserDetector.isAndroid(),

			/**
			 * Check if the device is a mobile
			 * @name mobile
			 * @constant
			 * @public
			 * @memberof device
			 */
			mobile: browserDetector.isMobile(),

			/**
			 * Check if the device is a phone
			 * @name phone
			 * @constant
			 * @public
			 * @memberof device
			 */
			phone: browserDetector.isPhone(),

			/**
			 * Check if the device is a tablet
			 * @name tablet
			 * @constant
			 * @public
			 * @memberof device
			 */
			tablet: browserDetector.isTablet(),

			/**
			 * Check if the browser is Chrome
			 * @name chrome
			 * @constant
			 * @public
			 * @memberof device
			 */
			chrome: browserDetector.isChrome(),

			/**
			 * Check if the browser is Firefox
			 * @name firefox
			 * @constant
			 * @public
			 * @memberof device
			 */
			firefox: browserDetector.isFirefox(),

			/**
			 * Check if the browser is Safari
			 * @name safari
			 * @constant
			 * @public
			 * @memberof device
			 */
			safari: browserDetector.isSafari(),

			/**
			 * Check if the browser is Internet Explorer
			 * @name internetexplorer
			 * @constant
			 * @public
			 * @memberof device
			 */
			internetexplorer: browserDetector.isMsie(),

			/**
			 * Check if the browser is Edge
			 * @name edge
			 * @constant
			 * @public
			 * @memberof device
			 */
			edge: browserDetector.isEdge(),

			/**
			 * @name events
			 * @constant
			 * @public
			 * @memberof device
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
	
})(jQuery, window);
