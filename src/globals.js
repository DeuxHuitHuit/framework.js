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
	// add device css class to html
	var deviceClasses = deviceClasses = ['iphone', 'ipad', 'ios', 'mobile', 'android',
		'phone', 'tablet', 'touch', 'chrome', 'firefox', 'safari', 'internetexplorer', 'edge'];
	$.each(deviceClasses, function (i, c) {
		if (!!$[c]) {
			$('html').addClass(c);
		}
	});
	// easing support
	$.easing.def = ($.mobile ? 'linear' : 'easeOutQuad');
	
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
