/**
 * @author Deux Huit Huit
 * 
 * App Callback functionnality
 *
 */
(function ($, global, undefined) {

	'use strict';
	
	/** Utility **/
	var argsToArray = function (args) {
		if (args === null || // null is valid
		    ( // or
		        args !== undefined && // not undefined
		        !$.isArray(args) && // not an array
		        // not the 'arguments' type
		       (!$.isNumeric(args.length) || // no .length
		         $.type(args) === 'string' || // or not string
		         !!args.jquery) // or jQuery Object
		    )
		) {
			// put single parameter inside an array
			args = [args];
		}
		return args;
	};
	
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
	
	// external lib load check
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
