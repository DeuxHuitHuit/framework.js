/**
 * General customization alongside the framework
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 *
 * @requires App
 */
(function (global, undefined) {
	'use strict';

	if (!!global.App && !!global.App.device) {
		(function (h, deviceClasses) {
			deviceClasses.forEach(function (c) {
				if (!!App.device[c]) {
					h.classList.add(c);
				}
			});
		})(document.querySelector('html'), [
			'iphone', 'ipad', 'ios',
			'android',
			'mobile', 'phone', 'tablet', 'touch',
			'chrome', 'firefox', 'safari', 'internetexplorer', 'edge'
		]);
	}

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

	consoleFx.forEach(function (key) {
		global.console[key] = global.console[key] || (() => {});
	});

	/**
	 * Facade to stop the propagation of events
	 * @name pd
	 * @method
	 * @param {Event} e Event object
	 * @param {Boolean} stopPropagation Flag to stop the event propagation or not
	 * @returns {Boolean} false, always.
	 * @global
	 * @public
	 */
	global.pd = function (e, stopPropagation) {
		if (!!e) {
			if (typeof e.preventDefault === 'function') {
				e.preventDefault();
			}
			if (stopPropagation !== false && typeof e.stopPropagation === 'function') {
				e.stopPropagation();
			}
		}
		return false;
	};

	const sorry = (type) => {
		const orig = window.history[type];
		return function () {
			let data = {};

			if (!!arguments.length && typeof arguments[0] === 'object') {
				data = arguments[0].data || {};
				delete(arguments[0].data);
			}

			const rv = orig.apply(this, arguments);
			const e = new window.Event(type);

			e.arguments = arguments;
			e.state = arguments[0] || undefined;
			e.data = data;
			window.dispatchEvent(e);

			return rv;
		};
	};

	global.history.pushState = sorry('pushState');
	global.history.replaceState = sorry('replaceState');

})(window);
