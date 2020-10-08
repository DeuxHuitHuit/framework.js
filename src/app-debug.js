/**
 * App Debug
 *
 * @fileoverview Defines and exports debug
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 *
 * @namespace debug
 * @memberof App
 * @requires App
 */
(function (global, undefined) {
	'use strict';
	
	/** Debug **/
	var isDebugging = false;
	
	/**
	 * Set or get the debug flag for the App
	 * @name debug
	 * @method
	 * @memberof debug
	 * @param {Boolean=} value
	 * @private
	 */
	var debug = function (value) {
		if (value === true || value === false) {
			isDebugging = value;
		} else if (value === '!') {
			isDebugging = !isDebugging;
		}
		return isDebugging;
	};
	
	/** Public Interfaces **/
	global.App = Object.assign({}, global.App, {
		
		/**
		 * Set or get the debug flag for the App
		 * @name debug
		 * @method
		 * @memberof debug
		 * @param {Boolean=} value
		 * @public
		 */
		debug: debug
	});
	
})(window);
