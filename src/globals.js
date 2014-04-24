/**
 * @author Deux Huit Huit
 */
 
 /*
 * Browser Support/Detection
 */
(function ($, global, undefined) {
	
	'use strict';
	
	var queryStringParser = function () {
		var
		a = /\+/g,  // Regex for replacing addition symbol with a space
		r = /([^&=]+)=?([^&]*)/gi,
		d = function (s) { return decodeURIComponent(s.replace(a, ' ')); },
		
		_parse = function (qs) {
			var 
			u = {},
			e,
			q;
			
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
		
		return {
			parse : _parse
		};
	};
	
	var browserDetector = function () {
		var getUserAgent = function (userAgent) {
			if (userAgent !== '' && !userAgent) {
				userAgent = navigator.userAgent;
			}
			return userAgent;
		};
		
		return {
			isIos : function (userAgent) {
				return global.BrowserDetector.isIphone(userAgent) || 
					global.BrowserDetector.isIpad(userAgent);
			},
			
			isIphone : function (userAgent) {
				userAgent = getUserAgent(userAgent);
				return !!(userAgent.match(/iPhone/i) || userAgent.match(/iPod/i));
			},
			
			isIpad : function (userAgent) {
				userAgent = getUserAgent(userAgent);
				return !!(userAgent.match(/iPad/i));
			},
			
			isAndroid : function (userAgent) {
				userAgent = getUserAgent(userAgent);
				return !!(userAgent.match(/Android/i));
			},
			
			isAndroidPhone: function (userAgent) {
				userAgent = getUserAgent(userAgent);
				return global.BrowserDetector.isAndroid(userAgent) && 
					!!(userAgent.match(/mobile/i));
			},
			
			isPhone : function (userAgent) {
				userAgent = getUserAgent(userAgent);
				return global.BrowserDetector.isOtherPhone(userAgent) || 
					global.BrowserDetector.isAndroidPhone(userAgent) ||
					global.BrowserDetector.isIphone(userAgent);
			},
			
			isOtherPhone : function (userAgent) {
				userAgent = getUserAgent(userAgent);
				return !!(userAgent.match(/phone/i));
			},
			
			isOtherMobile : function (userAgent) {
				userAgent = getUserAgent(userAgent);
				return !!(userAgent.match(/mobile/i)) ||
					global.BrowserDetector.isOtherPhone(userAgent);
			},
			
			isMobile : function (userAgent) {
				return global.BrowserDetector.isIos(userAgent) || 
					global.BrowserDetector.isAndroid(userAgent) || 
					global.BrowserDetector.isOtherMobile(userAgent);
			},
			
			isMsie : function (userAgent) {
				userAgent = getUserAgent(userAgent);
				return userAgent.match(/msie/gi) || userAgent.match(/trident/gi);
			}
			
			/*isUnsupported : function (userAgent) {
				var 
				b;
				userAgent = getUserAgent(userAgent);
				b = $.uaMatch(userAgent);
				
				return b.browser === "" || (b.browser == 'msie' && parseInt(b.version,10)) < 9;
			}*/
		};
	};
	
	// Query string Parser
	// http://stackoverflowindow.com/questions/901115/get-query-string-values-in-javascript
	global.QueryStringParser = queryStringParser();
	
	//Parse the query string and store a copy of the result in the window object
	global.QS = global.QueryStringParser.parse();
	
	// Browser detector
	global.BrowserDetector = browserDetector();
	
	// User Agent parsing
	$.iphone = global.BrowserDetector.isIphone();
	
	$.ipad = global.BrowserDetector.isIpad();
	
	$.ios = global.BrowserDetector.isIos();
	
	$.mobile = global.BrowserDetector.isMobile();
	
	$.android = global.BrowserDetector.isAndroid();
	
	$.phone = global.BrowserDetector.isPhone();
	
	$.touchClick = $.ios || $.android;
	
	$.click = $.touchClick ? 'mobile-click' : 'click';
	
/**
 * General customization for mobile and default easing
 */
	
	// add mobile css class to html
	$.each(['iphone', 'ipad', 'ios', 'mobile', 'android'], function (i, c) {
		if (!!$[c]) {
			$('html').addClass(c);
		}
	});
	
	// easing support
	$.easing.def = ($.mobile ? 'linear' : 'easeOutQuad');
	
	// touch support
	if ($.touchClick) {
		var didMove = false;
		var preventNextClick = false;
		var lastTouch = {x: 0, y: 0};
		var minMove = 10 * (window.devicePixelRatio || 1);
		$(document).on('touchstart', function (e) {
			didMove = false;
			var touch = e.originalEvent.touches[0];
			lastTouch.x = touch.screenX;
			lastTouch.y = touch.screenY;
			App.log('touchstart', lastTouch);
		}).on('touchmove', function (e) {
			var touch = e.originalEvent.changedTouches[0];
			// only count move when one finger is used
			didMove = e.originalEvent.changedTouches.length === 1 &&
				// and if the gesture was more than accidental
				(Math.abs(lastTouch.x - touch.screenX) > minMove ||
				Math.abs(lastTouch.y - touch.screenY) > minMove);
				
			App.log('touchmove', lastTouch, didMove, touch.screenX, touch.screenY);
		}).on('touchend', function (e) {
			App.log('touchend', lastTouch, didMove);
			var t = $(e.target);
			var ignoreInputs = 'input, select, textarea';
			var ignoreClass = '.ignore-mobile-click, .ignore-mobile-click *';
			var mustBeIgnored = t.is(ignoreInputs) || t.is(ignoreClass);
			
			// prevent click only if not ignored
			preventNextClick = $.ios && !mustBeIgnored;
			
			// do not count inputs
			if (!didMove && !mustBeIgnored) {
				// prevent default right now
				global.pd(e);
				$(e.target).trigger($.click);
				return false;
			}
		}).on('click', function (e) {
			App.log('real click');
			var isNextClickPrevented = preventNextClick;
			preventNextClick = false;
			if (isNextClickPrevented) {
				App.log('click prevented');
				global.pd(e);
			}
			return !isNextClickPrevented;
		});
	}
	
	
/**
 * Patching console object.
 */
	
	// see: https://developers.google.com/chrome-developer-tools/docs/console-api
	/*
	 * Snippet
	var c=[];
	$('ol.toc li').each(function () {
		var r = /console\.([a-z]+)/.exec($(this).text());r && c.push(r[1])
	});
	console.log(c);
	 */
	
	var consoleFx = ['assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error', 'group', 
		'group', 'group', 'info', 'log', 'profile', 'profile', 'time', 'time', 'time', 
		'trace', 'warn'];
	
	// console support
	if (!window.console) {
		window.console = {};
	}
	
	$.each(consoleFx, function (i, key) {
		window.console[key] = window.console[key] || $.noop;
	});
	

/**
 * Global window tools
 */
	
	var hex = function (x) {
		return ('0' + parseInt(x, 10).toString(16)).slice(-2);
	};
		
	global.rgb2hex = function (rgb) {
		var hexa = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
		if (!hexa) {
			return rgb;
		}
		return hex(hexa[1]) + hex(hexa[2]) + hex(hexa[3]);
	};
	
	// prevent default macro
	global.pd = function (e, stopPropagation) {
		if (!!e) {
			if ($.isFunction(e.preventDefault)) {
				e.preventDefault();
			}
			if (stopPropagation !== false && $.isFunction(e.stopPropagation)) {
				e.stopPropagation();
			}
		}
		return false;
	};
	
})(jQuery, window);
