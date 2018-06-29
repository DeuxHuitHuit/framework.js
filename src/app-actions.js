/**
 * Actions
 *
 * @fileoverview Defines the App Actions
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 *
 * @requires jQuery
 * @namespace App.actions
 */
(function ($, global, undefined) {
	'use strict';

	/**
	 * Find and execute the methods that matches with the notify key
	 * @name callAction
	 * @memberof App.actions
	 * @method
	 * @param {Function|Object} actions Object of methods that can be matches with the key's value
	 * @param {String} key Action key
	 * @param {Object} data Bag of data
	 * @returns {*} Callback's result
	 * @private
	 */
	var callAction = function (actions, key, data) {
		if ($.isFunction(actions)) {
			actions = actions();
		}
		if (!!actions) {
			var tempFx = actions[key];
			
			if (!$.isFunction(tempFx) && !!~key.indexOf('.')) {
				tempFx = actions;
				// try JSONPath style...
				var paths = key.split('.');
				$.each(paths, function eachPath () {
					tempFx = tempFx[this];
					if (!$.isPlainObject(tempFx)) {
						return false; // exit
					}
					return true;
				});
			}
			
			return App.callback(tempFx, [key, data]);
		}
	};

	/** Public Interfaces **/
	global.App = $.extend(global.App, {
		/**
		 * @namespace actions
		 * @memberof App
		 */
		actions: {
			/**
			 * Find and execute the methods that matches with the notify key
			 * @name callAction
			 * @memberof App.actions
			 * @method
			 * @param {Function|Object} actions Object of methods that can be matches
			 *   with the key's value
			 * @param {String} key Action key
			 * @param {Object} data Bag of data
			 * @returns {*} Callback's result
			 * @public
			 */
			callAction: callAction
		}
	});
})(jQuery, window);
