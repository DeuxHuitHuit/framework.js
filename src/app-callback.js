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
			App.log({args:err.message || err, fx:'error'});
		}
		return null;
	};
	
	if(!!!window.App || !$.isFunction(window.App.debug)) {
		window.alert('App-debug is needed for App-callback');
	}else {
		/** Public Interfaces **/
		window.App = $.extend(window.App, {
			
			// callback utility
			callback: callback
			
		});
	}
	
})(jQuery);
