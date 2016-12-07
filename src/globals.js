/**
 * @author Deux Huit Huit
 */

/**
 * General customization
 */
(function ($, global, undefined) {
	'use strict';

	/*
	 * Cheap modrnzr
	 */

	// add mobile css class to html
	var mobileClasses = ['iphone', 'ipad', 'ios', 'mobile', 'android', 'phone', 'tablet', 'touch'];
	$.each(mobileClasses, function (i, c) {
		if (!!$[c]) {
			$('html').addClass(c);
		}
	});
	
	// easing support
	$.easing.def = ($.mobile ? 'linear' : 'easeOutQuad');
	
	// touch support: removing the 300ms delay
	if ($.touch) {
		var didMove = false;
		var preventNextClick = false;
		var lastTouch = {x: 0, y: 0};
		
		var preventNextClickExternal = function (target, e) {
			var ret = true;
			if ($.isFunction(global.preventNextClick)) {
				ret = global.preventNextClick.call(target, e);
			}
			return ret;
		};
		
		var getMinMoveValue = function () {
			var value = 0;
			if ($.isNumeric(global.deviceMinMoveValue)) {
				value = parseInt(global.deviceMinMoveValue, 10);
			} else if ($.isFunction(global.deviceMinMoveValue)) {
				value = parseInt(global.deviceMinMoveValue());
			}
			return value || 10; // default value
		};
		
		var minMove = 0;
		
		$(document).on('touchstart', function (e) {
			didMove = false;
			var touch = e.originalEvent.touches[0];
			lastTouch.x = touch.screenX;
			lastTouch.y = touch.screenY;
			App.log('touchstart', lastTouch);
		}).on('touchmove', function (e) {
			var touch = e.originalEvent.changedTouches[0];
			if (!minMove) {
				minMove = getMinMoveValue() * (window.devicePixelRatio || 1);
			}
			// only count move when one finger is used
			didMove = e.originalEvent.changedTouches.length === 1 &&
				// and if the gesture was more than accidental
				(Math.abs(lastTouch.x - touch.screenX) > minMove ||
				Math.abs(lastTouch.y - touch.screenY) > minMove);
				
			App.log('touchmove', lastTouch, didMove, touch.screenX, touch.screenY);
		}).on('touchend', function (e) {
			App.log('touchend', lastTouch, didMove);
			
			var t = $(e.target);
			// do not count inputs
			var ignoreInputs = 'input, select, textarea';
			// special ignore class
			var ignoreClass = '.ignore-mobile-click, .ignore-mobile-click *';
			// store de result
			var mustBeIgnored = t.is(ignoreInputs) || t.is(ignoreClass);
			
			// prevent click only if not ignored
			preventNextClick = $.ios && !mustBeIgnored;
			
			if (!didMove && !mustBeIgnored) {
				
				// create a new click event
				var clickEvent = $.Event($.click);
				
				// raise it
				$(e.target).trigger(clickEvent);
				
				// let others prevent defaults...
				if (clickEvent.isDefaultPrevented()) {
					// and do the same
					global.pd(e, clickEvent.isPropagationStopped());
				}
				// or stop propagation
				else if (clickEvent.isPropagationStopped()) {
					e.stopPropagation();
				}
				
				if (e.isDefaultPrevented()) {
					App.log('touchend prevented');
					return false;
				}
			}
		}).on('click', 'a', function (e) {
			App.log('real click');
			
			var isNextClickPrevented = preventNextClick && preventNextClickExternal(this, e);
			preventNextClick = false;
			
			if (isNextClickPrevented) {
				App.log('click prevented');
				global.pd(e);
				return false;
			}
		});
	}
	
	/*
	 * Patching console object.
	 * See: https://developers.google.com/chrome-developer-tools/docs/console-api
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
	if (!global.console) {
		global.console = {};
	}
	
	$.each(consoleFx, function (i, key) {
		global.console[key] = global.console[key] || $.noop;
	});
	
	/*
	 * Global tools
	 */
	
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
