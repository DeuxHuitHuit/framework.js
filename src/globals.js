/**
 * General customization alongside the framework
 *
 * @author Deux Huit Huit <http://deuxhuithuit.com>
 * @license MIT <http://deuxhuithuit.mit-license.org>
 *
 * @requires jQuery
 * @requires App
 */
(function ($, global, undefined) {
	'use strict';

	var deviceClasses = [
		'iphone', 'ipad', 'ios',
		'android',
		'mobile', 'phone', 'tablet', 'touch',
		'chrome', 'firefox', 'safari', 'internetexplorer', 'edge'
	];
	$.each(deviceClasses, function (i, c) {
		if (!!$[c]) {
			$('html').addClass(c);
		}
	});
	// easing support
	$.easing.def = ($.mobile ? 'linear' : 'easeOutQuad');

	/**
	 * Patching console object.
	 * @see https://developers.google.com/chrome-developer-tools/docs/console-api
	 */
	var consoleFx = ['assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error', 'group',
		'group', 'group', 'info', 'log', 'profile', 'profile', 'time', 'time', 'time',
		'trace', 'warn'];
	
	/**
	 * Console support
	 * @global
	 */
	if (!global.console) {
		global.console = {};
	}
	
	$.each(consoleFx, function (i, key) {
		global.console[key] = global.console[key] || $.noop;
	});
	

	
	/**
	 * Facade to stop the propagation of events
	 * @param {Event} e Event object
	 * @param {Boolean} stopPropagation Flag to stop the event propagation or not
	 * @returns {Boolean} false, always.
	 * @global
	 */
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
