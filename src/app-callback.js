/**
 * @author Deux Huit Huit
 * 
 * App Callback functionnality
 *
 */
;(function ($, global, undefined) {

	"use strict";
	
	var 
	
	/** Utility **/
	callback = function (fx, args) {
		try {
			if ($.isFunction(fx)) {
				return fx.apply(this, args || []); // IE8 does not allow null/undefined args
			}
		} catch (err) {
			if(!global.App || !$.isFunction(global.App.debug)) {
				window.alert(err.message || err);
			}else {
				var 
				stack = App.debug() && err.stack,
				msg = (err.message || err) +  (stack || '');
				
				App.log({args:[msg, err], fx:'error'});
			}
		}
		return null;
	};
	
	/** Public Interfaces **/
	global.App = $.extend(global.App, {
		
		// callback utility
		callback: callback
		
	});
	
})(jQuery, window);
