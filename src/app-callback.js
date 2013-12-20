/**
 * @author Deux Huit Huit
 * 
 * App Callback functionnality
 *
 */
(function ($, global, undefined) {

	'use strict';
	
	/** Utility **/
	var callback = function (fx, args) {
		try {
			if ($.isFunction(fx)) {
				// IE8 does not allow null/undefined args
				return fx.apply(this, args || []);
			}
		} catch (err) {
			var stack = err.stack;
			var msg = (err.message || err) + '\n' + (stack || '');
			
			App.log({args: [msg, err], fx: 'error'});
		}
		return null;
	};
	
	/** Public Interfaces **/
	global.App = $.extend(global.App, {
		
		// callback utility
		callback: callback
		
	});
	
})(jQuery, window);
