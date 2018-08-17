/**
 * Module are singleton that lives across pages
 *
 * @fileoverview Defines and exports components
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 *
 * @namespace modules
 * @memberof App
 * @requires App
 */
(function ($, global, undefined) {

	'use strict';
	
	/** Modules **/
	var modules = {};
	
	/**
	 * Create a basic module with the minimum required methods
	 * @name _createAbstractModule
	 * @method
	 * @memberof modules
	 * @returns {Object}
	 * @private
	 */
	var _createAbstractModule = function () {
		return {
			actions: $.noop,
			init: $.noop
		};
	};
	
	/**
	 * Merge the module with the basic one
	 * to be sure the minimum required methods are present
	 * @name createModule
	 * @method
	 * @memberof modules
	 * @param {Object} module ModuleObject
	 * @private
	 */
	var createModule = function (module) {
		return $.extend(_createAbstractModule(), module);
	};
	
	/**
	 * Register the module and make sure his key is unique
	 * @name exportModule
	 * @method
	 * @memberof modules
	 * @param {String} key Module's unique identifier
	 * @param {Object} module
	 * @param {Boolean} override
	 * @private
	 */
	var exportModule = function (key, module, override) {
		if (!$.type(key)) {
			App.log({args: ['`key` must be a string', key], fx: 'error'});
		} else if (!!modules[key] && !override) {
			App.log({args: ['Overwriting module key %s is not allowed', key], fx: 'error'});
		} else {
			modules[key] = createModule(module);
		}
		return modules[key];
	};
	
	/**
	 * Execute _callAction on all modules
	 * @name notifyModules
	 * @method
	 * @memberof modules
	 * @param {String} key Notify key
	 * @param {Object=} data Bag of data
	 * @param {Function} cb Callback executed after all the notifications
	 * @this App
	 * @returns this
	 * @private
	 */
	var notifyModules = function (key, data, cb) {
		if ($.isFunction(data) && !cb) {
			cb = data;
			data = undefined;
		}
		$.each(modules, function actionToAllModules (index) {
			var res = App._callAction(this.actions, key, data, cb);
			if (res !== undefined) {
				App.callback(cb, [index, res]);
			}
		});
		return this;
	};
	
	/** Public Interfaces **/
	global.App = $.extend(global.App, {
		
		// Modules
		modules: {
			
			/**
			 * Returns all the modules
			 * @name models
			 * @method
			 * @memberof modules
			 * @returns {Object} All modules models
			 * @public
			 */
			models: function () {
				return modules;
			},
			
			//create: createModule,
			
			/**
			 * Register the module and make sure his key is unique
			 * @name exports
			 * @method
			 * @memberof modules
			 * @param {String} key Module's unique identifier
			 * @param {Object} module
			 * @param {Boolean} override
			 * @public
			 */
			exports: exportModule,
			
			/**
			 * Execute _callAction on all modules
			 * @name notify
			 * @method
			 * @memberof modules
			 * @param {String} key Notify key
			 * @param {Object=} data Bag of data
			 * @param {Function} cb Callback executed after all the notifications
			 * @this App
			 * @returns this
			 * @public
			 */
			notify: notifyModules
		}
	
	});
	
})(jQuery, window);
