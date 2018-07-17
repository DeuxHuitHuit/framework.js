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
	 * @param {Object} module The module object
	 * @param {Boolean} override Flag to control overwriting a module
	 * @returns {Object} The newly created module
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
	 * Resolves the key action on all modules
	 * @name resolveActions
	 * @method
	 * @memberof modules
	 * @param {String} key Notify key
	 * @param {Object} data Bag of data
	 * @returns {Array} Array of read/write objects for all modules
	 * @private
	 */
	var resolveActions = function (key, data) {
		return Object.keys(modules).map(function resolveAction (k) {
			return App.actions.resolve(modules[k].actions, key, data);
		}).filter(function (a) {
			return !!a;
		});
	};

	/**
	 * Resolves and execute the action on all modules
	 * @name notifyModules
	 * @method
	 * @memberof modules
	 * @param {String} key Notify key
	 * @param {Object} data Bag of data
	 * @param {Function} cb Callback executed after each App.actions.execute executions
	 * @this App
	 * @returns this
	 * @private
	 */
	var notifyModules = function (key, data, cb) {
		var actions = resolveActions(key, data);
		App.actions.execute(actions, key, data, cb);
		return this;
	};
	
	/** Public Interfaces **/
	global.App = $.extend(global.App, {
		/**
		 * @namespace modules
		 * @memberof App
		 */
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
			
			/**
			 * Register the module and make sure his key is unique
			 * @name exports
			 * @method
			 * @memberof modules
			 * @param {String} key Module's unique identifier
			 * @param {Object} module The module object
			 * @param {Boolean} override Flag to control overwriting a module
			 * @returns {Object} The newly created module
			 * @public
			 */
			exports: exportModule,
			
			/**
			 * Resolves and execute the action on all modules
			 * @name notify
			 * @method
			 * @memberof modules
			 * @param {String} key Notify key
			 * @param {Object} data Bag of data
			 * @param {Function} cb Callback executed after each App.actions.execute executions
			 * @this App
			 * @returns this
			 * @public
			 */
			notify: notifyModules,

			/**
			 * Resolves the key action on all modules
			 * @name resolve
			 * @method
			 * @memberof modules
			 * @param {String} key Notify key
			 * @param {Object} data Bag of data
			 * @returns {Array} Array of read/write objects for all modules
			 * @public
			 */
			resolve: resolveActions
		}
	
	});
	
})(jQuery, window);
