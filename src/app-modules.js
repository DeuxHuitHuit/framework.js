/**
 * Module are singleton that lives across pages
 *
 * @fileoverview Defines and exports components
 *
 * @author Deux Huit Huit <http://deuxhuithuit.com>
 * @license MIT <http://deuxhuithuit.mit-license.org>
 *
 * @module App.modules
 * @requires App
 */
(function ($, global, undefined) {

	'use strict';
	
	/** Modules **/
	var modules = {};
	
	/**
	 * Create a basic module with the minimum required methods
	 * @returns {Object}
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
	 * @param {Object} module 
	 */
	var createModule = function (module) {
		return $.extend(_createAbstractModule(), module);
	};
	
	/**
	 * Register the module and make sure his key is unique
	 * @param {String} key Module's unique identifier
	 * @param {Object} module
	 * @param {Boolean} override
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
	 * @param {String} key Notify key
	 * @param {Object=} data Bag of data
	 * @param {Function} cb Callback executed after all the notifications
	 * @this App
	 * @returns this
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
			
			// private
			models: function () {
				return modules;
			},
			
			//create: createModule,
			
			exports: exportModule,
			
			notify: notifyModules
		}
	
	});
	
})(jQuery, window);
