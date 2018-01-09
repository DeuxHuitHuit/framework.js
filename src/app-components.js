/**
 * Components are factory method that will generate a instance of a component.
 *
 * @fileoverview Defines and exports components
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 *
 * @namespace App.components
 * @requires App
 */
(function ($, global, undefined) {

	'use strict';
	
	/** Components **/
	var components = {};

	/**
	 * Create a default model of a component with an init function
	 * @name _createAbstractComponent
	 * @method
	 * @memberof App.components
	 * @private
	 * @return {Object}
	 */
	var _createAbstractComponent = function () {
		return {
			init: $.noop
		};
	};

	/**
	 * Merge the created component with the default model
	 * just to be sure there's an init method
	 * @name extendComponent
	 * @method
	 * @memberof App.components
	 * @param {Object} component
	 * @return {Object} component
	 * @private
	 */
	var extendComponent = function (component) {
		return $.extend(_createAbstractComponent(), component);
	};

	/**
	 * Make sure the component is unique by key verification
	 * and stores it with all the other components
	 * @name exports
	 * @method
	 * @memberof App.components
	 * @param {String} key unique identifier
	 * @param {Function} component model of the component
	 * @param {Boolean} override fake news
	 * @public
	 */
	var exportComponent = function (key, component, override) {
		if (!$.type(key)) {
			App.log({args: ['`key` must be a string', key], fx: 'error'});
		} else if (!!components[key] && !override) {
			App.log({args: ['Overwriting component key %s is not allowed', key], fx: 'error'});
		} else {
			components[key] = component;
			return component;
		}
		return false;
	};

	/**
	 * Create an instence of the component
	 * @name create
	 * @method
	 * @memberof App.components
	 * @param {String} key unique identifier
	 * @param {Object} options object passed to the component's code
	 * @return {Object} Merged component with the default model and the acual component code
	 * @public
	 */
	var createComponent = function (key, options) {
		if (!components[key]) {
			App.log({args: ['Component %s is not found', key], fx: 'error'});
			return extendComponent({});
		}
		
		var c = components[key];
		
		if (!$.isFunction(c)) {
			App.log({args: ['Component %s is not a function', key], fx: 'error'});
			return extendComponent({});
		}
		
		return extendComponent(c.call(c, options));
	};
	
	/** Public Interfaces **/
	global.App = $.extend(global.App, {
		
		// Components
		components: {
			
			/**
			 * Get all components models
			 * @public
			 * @name models
			 * @method
			 * @memberof App.components
			 * @returns {Objects}
			 */
			models: function () {
				return components;
			},
			
			create: createComponent,
			
			exports: exportComponent
		}
	
	});
	
})(jQuery, window);
