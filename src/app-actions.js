/**
 * Actions
 *
 * @fileoverview Defines the App Actions
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 *
 * @requires jQuery
 * @namespace App.actions
 */
(function ($, global, undefined) {
	'use strict';
	var keys = {};
	var innerCall = false;
	var stack = [];

	/**
	 * Find the methods that matches with the notify key
	 * @name resolve
	 * @memberof App.actions
	 * @method
	 * @param {Function|Object} actions Object of methods that can be matches with the key's value
	 * @param {String} key Action key
	 * @param {Object} data Bag of data
	 * @returns {Function} The function corresponding to the key, if it exists in actions object
	 * @private
	 */
	var resolve = function (actions, key, data) {
		if ($.isFunction(actions)) {
			actions = actions();
		}
		if (!!actions) {
			// Try the whole key
			var tempFx = actions[key];
			// If not, try JSONPath style...
			if (!$.isFunction(tempFx)) {
				var paths = keys[key] || key.split('.');
				if (paths.length < 2) {
					return;
				}
				keys[key] = paths;
				tempFx = actions;
				$.each(paths, function eachPath () {
					tempFx = tempFx[this];
					if (!$.isPlainObject(tempFx)) {
						return false; // exit
					}
					return true;
				});
			}
			if ($.isFunction(tempFx)) {
				return tempFx;
			}
		}
	};

	/**
	 * Executes all read and write operations present in the actions array.
	 * @name execute
	 * @memberof App.actions
	 * @method
	 * @param {Array} actions Array of read/write objects
	 * @param {String} key Action key
	 * @param {Object} data Bag of data
	 * @returns {undefined}
	 * @private
	 */
	var execute = function (actions, key, data, cb) {
		var sp = 0;
		var outerCall = false;
		var read = function (f) {
			if ($.isFunction(f.read)) {
				f.read(key, data);
			}
		};
		var write = function (f) {
			f.write(key, data);
		};
		if (!innerCall) {
			innerCall = true;
			outerCall = true;
		}
		if (!$.isArray(actions)) {
			actions = [actions];
		}
		if ($.isFunction(data) && !cb) {
			cb = data;
			data = undefined;
		}
		// Push all resolved actions to the stack
		actions.forEach(function eachAction (a, index) {
			var retValue = App.callback(a, [key, data]);
			if (!!cb && retValue !== undefined) {
				App.callback(cb, [index, retValue]);
			}
			if ($.isFunction(retValue)) {
				retValue = {
					read: null,
					write: retValue
				};
			}
			if ($.isPlainObject(retValue) && $.isFunction(retValue.write)) {
				if (App.debug() && !retValue.key) {
					retValue.key = key;
				}
				stack.push(retValue);
			}
		});
		// If outerCall, empty the stack
		while (outerCall && stack.length > sp) {
			// Capture current end
			var sLen = stack.length;
			// Process current range only
			for (var x = sp; x < sLen; x++) {
				read(stack[x]);
			}
			for (x = sp; x < sLen; x++) {
				write(stack[x]);
			}
			// Advance the stack pointer
			sp = sLen;
		}
		if (outerCall) {
			// clean up
			innerCall = false;
			stack = [];
		}
	};

	/** Public Interfaces **/
	global.App = $.extend(global.App, { // todo, add true everywhere
		/**
		 * @namespace actions
		 * @memberof App
		 */
		actions: {
			/**
			 * Find the methods that matches with the notify key
			 * @name resolve
			 * @memberof App.actions
			 * @method
			 * @param {Function|Object} actions Object of methods that can be matches
			 *   with the key's value
			 * @param {String} key Action key
			 * @param {Object} data Bag of data
			 * @returns {Function} The function corresponding to the key, if it exists
			 * @public
			 */
			resolve: resolve,

			/**
			 * Executes all read and write operations present in the actions array.
			 * @name execute
			 * @memberof App.actions
			 * @method
			 * @param {Array} actions Array of read/write objects
			 * @param {String} key Action key
			 * @param {Object} data Bag of data
			 * @returns {undefined}
			 * @public
			 */
			execute: execute,

			/**
			 * @name stack
			 * @memberof App.actions
			 * @method
			 * @returns {Array} All the operations currently in the stack.
			 *   Stack operations can already be executed but still in the stack.
			 * @public
			 */
			stack: function () {
				return stack;
			}
		}
	});
})(jQuery, window);
