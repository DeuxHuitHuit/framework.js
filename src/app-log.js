/**
 * App  Log
 *
 * @fileoverview Defines and exports log
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 *
 * @namespace log
 * @memberof App
 * @requires App
 */
(function (global, undefined) {
	'use strict';

	/**
	 * Format the passed arguments and the displayed message
	 * @name argsToObject
	 * @method
	 * @memberof debug
	 * @param {String|Object|Array} arg The value or values to log
	 * @returns {Object} Formated object
	 * @private
	 */
	const argsToObject = function (arg) {
		// ensure that args is an array
		if (!!arg.args && !Array.isArray(arg.args)) {
			arg.args = [arg.args];
		}

		// our copy
		const a = {
			args: arg.args || arguments,
			fx: arg.fx || 'warn',
			me: arg.me || 'App'
		},
			t1 = typeof a.args[0];

		if (t1 === 'string' || t1 === 'number' || t1 === 'boolean') {
			// append me before a.args[0]
			a.args[0] = '[' + a.me + '] ' + a.args[0];
		}
		return a;
	};

	const logs = [];

	/**
	 * Log the received data with the appropriate effect (log, error, info...)
	 * @name log
	 * @method
	 * @memberof debug
	 * @param {String|Object|Array} arg The value or values to log
	 * @private
	 */
	const log = function (arg) {
		// no args, exit
		if (!arg) {
			return this;
		}

		const a = argsToObject(arg);

		if (App.debug()) {
			// make sure fx exists
			if (typeof console[a.fx] !== 'function') {
				a.fx = 'log';
			}
			// call it
			if (!!window.console[a.fx].apply) {
				window.console[a.fx].apply(window.console, a.args);
			} else {
				a.args.forEach(function logArgs (arg) {
					window.console[a.fx](arg);
				});
			}
		}
		logs.push(a);

		return this;
	};

	/** Public Interfaces **/
	global.App = Object.assign({}, global.App, {

		/**
		 * Log the received data with the appropriate effect (log, error, info...)
		 * @name this
		 * @method
		 * @memberof log
		 * @param {String|Object|Array} arg The value or values to log
		 * @public
		 */
		log: log,

		/**
		 * Get all the logs
		 * @name logs
		 * @method
		 * @memberof log
		 * @returns {Array} All the logs
		 * @public
		 */
		logs: function () {
			return logs;
		}
	});

})(window);
