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
(function ($, global, undefined) {
	'use strict';

	/**
	 * Format the passed arguments and the displayed message
	 * @name argsToObject
	 * @method
	 * @memberof debug
	 * @param {Object} arg
	 * @returns {Object} Formated object
	 * @private
	 */
	var argsToObject = function (arg) {
		// ensure that args is an array
		if (!!arg.args && !$.isArray(arg.args)) {
			arg.args = [arg.args];
		}

		// our copy
		var a = {
			args: arg.args || arguments,
			fx: arg.fx || 'warn',
			me: arg.me || 'App'
		},
			t1 = $.type(a.args[0]);

		if (t1 === 'string' || t1 === 'number' || t1 == 'boolean') {
			// append me before a.args[0]
			a.args[0] = '[' + a.me + '] ' + a.args[0];
		}
		return a;
	};

	var logs = [];

	/**
	 * Log the recived data with the appropriate effect (log, error, info...)
	 * @name log
	 * @method
	 * @memberof debug
	 * @param {Array} arg
	 * @private
	 */
	var log = function (arg) {
		// no args, exit
		if (!arg) {
			return this;
		}

		var a = argsToObject(arg);

		if (App.debug()) {
			// make sure fx exists
			if (!$.isFunction(console[a.fx])) {
				a.fx = 'log';
			}
			// call it
			if (!!window.console[a.fx].apply) {
				window.console[a.fx].apply(window.console, a.args);
			} else {
				$.each(a.args, function logArgs (index, arg) {
					window.console[a.fx](arg);
				});
			}
		}
		logs.push(a);

		return this;
	};

	/** Public Interfaces **/
	global.App = $.extend(global.App, {

		/**
		 * Log the recived data with the appropriate effect (log, error, info...)
		 * @name this
		 * @method
		 * @memberof log
		 * @param {Array} arg
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

})(jQuery, window);
