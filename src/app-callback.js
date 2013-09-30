/**
 * @author Deux Huit Huit
 * 
 * App Callback functionnality
 *
 */
;(function ($, undefined) {

	"use strict";
	
	var 
	
	/** Utility **/
	callback = function (fx, args) {
		try {
			if ($.isFunction(fx)) {
				return fx.apply(this, args || []); // IE8 does not allow null/undefined args
			}
		} catch (err) {
			if(!window.App || !$.isFunction(window.App.debug)) {
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
	window.App = $.extend(window.App, {
		
		// callback utility
		callback: callback
		
	});
	
})(jQuery);
