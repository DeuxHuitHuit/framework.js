/**
 * App Callback functionnality
 *
 * @fileoverview Defines and exports callback
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 *
 * @namespace callback
 * @memberof App
 * @requires App
 */
(function (global, undefined) {
	'use strict';
	
	/**
	 * Put the args value in a array if it isn't one already
	 * @name argsToArray
	 * @method
	 * @memberof callback
	 * @param {*} args
	 * @return {Array}
	 * @private
	 */
	var argsToArray = function (args) {
		var isNull = (args === null);
		var isNotUndefined = (args !== undefined);
		var isNotAnArray = !Array.isArray(args);
		var noLength = !!args && !isNaN(args.length);
		var isString = typeof args === 'string';

		if (isNull || (isNotUndefined && isNotAnArray && (noLength || isString))) {
			// put single parameter inside an array
			args = [args];
		}
		return args;
	};
	
	/**
	 * Execute the method received with the arguments received.
	 * Returns what the method returned.
	 * @name callback
	 * @method
	 * @memberof callback
	 * @this App
	 * @param {function} fx
	 * @param {*} args
	 * @return {*}
	 * @private
	 */
	var callback = function (fx, args) {
		try {
			args = argsToArray(args);
			
			if (typeof fx === 'function') {
				// IE8 does not allow null/undefined args
				return fx.apply(this, args || []);
				
			} else if (typeof fx === 'object') {
				return fx;
			}
		} catch (err) {
			var stack = err.stack;
			var msg = (err.message || err) + '\n' + (stack || '');
			
			App.log({args: [msg, err], fx: 'error'});
		}
		return undefined;
	};
	
	/** Public Interfaces **/
	global.App = Object.assign({}, global.App, {
		
		/**
		 * Execute the method received with the arguments received
		 * @name this
		 * @method
		 * @memberof callback
		 * @this App
		 * @param {function} fx
		 * @param {*} args
		 * @return undefined
		 * @public
		 */
		callback: callback
	});
	
})(window);
