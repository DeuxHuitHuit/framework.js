/**
 * App Loaded functionality
 *
 * @fileoverview Defines and exports loaded
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 *
 * @namespace loaded
 * @memberof App
 * @requires App
 */
(function (global, undefined) {
	'use strict';

	/**
	 * Check if a resource is loaded and callback when it is.
	 * @name loaded
	 * @method
	 * @memberof loaded
	 * @param {*} v Resource to test
	 * @param {Function} fx Callback to execute when the resource is loaded
	 * @param {Integer} delay Delay between each checks in ms
	 * @param {Integer} maxRetriesCount Max checks for a resource
	 * @param {Integer} counter Memo for the recursive function
	 * @private
	 */
	const loaded = function (v, fx, delay, maxRetriesCount, counter) {
		delay = Math.max(delay || 0, 100);
		maxRetriesCount = maxRetriesCount || 10;
		counter = counter || 1;
		// get the value
		const value = App.callback(v, [counter]);
		// if the value exists
		if (!!value) {
			// call the function, with the value, but always async
			window.setTimeout(function () {
				App.callback(fx, [value, counter]);
			}, 0);
		} else if (counter < maxRetriesCount) {
			// recurse
			window.setTimeout(loaded, delay, v, fx, delay, maxRetriesCount, counter + 1);
		} else if (!!App.log) {
			App.log({
				fx: 'error',
				args: ['App.loaded timed out after %s attempts.', counter]
			});
		}
	};

	/** Public Interfaces **/
	global.App = Object.assign({}, global.App, {
		/**
		 * Check if a ressource is loaded and callback when it is.
		 * @name this
		 * @method
		 * @memberof loaded
		 * @param {*} v Ressource to test
		 * @param {Function} fx Callback to execute when the ressource is loaded
		 * @param {Integer} delay Delay between each checks in ms
		 * @param {Integer} maxRetriesCount Max checks for a ressource
		 * @param {Integer} counter Memo for the recursive function
		 * @public
		 */
		loaded: loaded
	});

})(window);
