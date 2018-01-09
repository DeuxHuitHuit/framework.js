/**
* App Callback functionnality
*
* @fileoverview Defines and exports callback and loaded
*
* @author Deux Huit Huit <https://deuxhuithuit.com>
* @license MIT <https://deuxhuithuit.mit-license.org>
*
* @namespace App.callback
* @requires App
*/
(function ($, global, undefined) {

	'use strict';
	
	/**
	 * Put the args value in a array if it isn't one already
	 * @name argsToArray
	 * @method
	 * @memberof App.callback
	 * @param {*} args
	 * @return {Array}
	 * @private
	 */
	var argsToArray = function (args) {
		var isNull = (args === null);
		var isNotUndefined = (args !== undefined);
		var isNotAnArray = !$.isArray(args);
		var noLength = !!args && !$.isNumeric(args.length);
		var isString = $.type(args) === 'string';
		var isjQuery = !!args && !!args.jquery;
		
		if (isNull || (isNotUndefined && isNotAnArray && (noLength || isString || isjQuery))) {
			// put single parameter inside an array
			args = [args];
		}
		return args;
	};
	
	/**
	 * Execute the method recived with the arguments recived
	 * @name callback
	 * @method
	 * @memberof App.callback
	 * @this App
	 * @param {function} fx 
	 * @param {*} args
	 * @return undefined
	 * @public
	 */
	var callback = function (fx, args) {
		try {
			args = argsToArray(args);
			
			if ($.isFunction(fx)) {
				// IE8 does not allow null/undefined args
				return fx.apply(this, args || []);
				
			} else if ($.isPlainObject(fx)) {
				return fx;
			}
		} catch (err) {
			var stack = err.stack;
			var msg = (err.message || err) + '\n' + (stack || '');
			
			App.log({args: [msg, err], fx: 'error'});
		}
		return undefined;
	};
	
	/**
	 * Check if a ressource is loaded and callback when it is.
	 * @name loaded
	 * @method
	 * @memberof App.callback
	 * @param {*} v Ressource to test
	 * @param {Function} fx Callback to execute when the ressource is loaded
	 * @param {Integer} delay Delay between each checks in ms
	 * @param {Integer} maxRetriesCount Max checks for a ressource
	 * @param {Integer} counter Memo for the recursive function
	 * @public
	 */
	var loaded = function (v, fx, delay, maxRetriesCount, counter) {
		delay = Math.max(delay || 0, 100);
		maxRetriesCount = maxRetriesCount || 10;
		counter = counter || 1;
		// get the value
		var value = callback(v, [counter]);
		// if the value exists
		if (!!value) {
			// call the function, with the value
			return callback(fx, [value, counter]);
		} else if (counter < maxRetriesCount) {
			// recurse
			setTimeout(loaded, delay, v, fx, delay, maxRetriesCount, counter + 1);
		}
	};
	
	/** Public Interfaces **/
	global.App = $.extend(global.App, {
		
		// callback utility
		callback: callback,
		
		// loaded utility
		loaded: loaded
	});
	
})(jQuery, window);
