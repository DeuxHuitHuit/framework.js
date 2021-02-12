/**
 * Functions
 *
 * @fileoverview Defines the App Fx
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 *
 * @namespace App.fx
 */
(function (global, undefined) {
	'use strict';
	const bindings = {};

	/**
	 * Defines a custom name property on the fx object, if debugging is enabled.
	 * Ignores any errors.
	 * @memberof App.fx
	 * @name setFxName
	 * @method
	 * @param {String} key Action key
	 * @param {Function} fx The function
	 * @private
	 */
	const setFxName = function (key, fx) {
		if (!!App.debug() && Object.defineProperty) {
			try {
				Object.defineProperty(fx, 'name', { value: key });
			} catch (ex) { }
		}
	};

	/**
	 * Executes all read and write operations for the key function
	 * @name notify
	 * @memberof App.fx
	 * @method
	 * @param {String} key Action key
	 * @param {Object} data Bag of data
	 * @param {Function} cb Callback executed after each App.actions.execute execution
	 * @this fx
	 * @returns this
	 * @private
	 */
	const notify = function (key, data, cb) {
		const fx = bindings[key];
		if (!fx) {
			App.log({ args: ['Function key %s did not resolve to anything', key], fx: 'warn' });
		} else {
			App.actions.execute(fx, key, data, cb);
		}
		return this;
	};

	/**
	 * Register the function and make sure his key is unique
	 * @name exportsFx
	 * @method
	 * @memberof App.fx
	 * @param {String} key Module's unique identifier
	 * @param {Function} fx The function
	 * @param {Boolean} override Flag to control overwriting a function
	 * @returns {Object} The newly created function
	 * @private
	 */
	const exportsFx = function (key, fx, override) {
		if (typeof key !== 'string') {
			App.log({ args: ['`key` must be a string', key], fx: 'error' });
		} else if (!!bindings[key] && !override) {
			App.log({ args: ['Overwriting function key %s is not allowed', key], fx: 'error' });
		} else if (typeof fx !== 'function') {
			App.log({ args: ['Function key %s is not a function', key], fx: 'error' });
		} else {
			// Try to set the name of the function
			setFxName(fx);
			bindings[key] = Object.freeze(fx);
		}
		return bindings[key];
	};

	/** Public Interfaces **/
	global.App = Object.assign({}, global.App, {
		/**
		 * @namespace fx
		 * @memberof App
		 */
		fx: {
			/**
			 * Executes all read and write operations present in the actions array.
			 * @name notify
			 * @memberof App.fx
			 * @method
			 * @param {String} key Action key
			 * @param {Object} data Bag of data
			 * @param {Function} cb Callback executed after each App.actions.execute execution
			 * @this fx
			 * @returns this
			 * @public
			 */
			notify: notify,

			/**
			 * Register the function and make sure his key is unique
			 * @name exports
			 * @method
			 * @memberof App.fx
			 * @param {String} key Module's unique identifier
			 * @param {Function} fx The function
			 * @param {Boolean} override Flag to control overwriting a function
			 * @returns {Object} The newly created function
			 * @private
			 */
			exports: exportsFx
		}
	});
})(window);
