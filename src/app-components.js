/**
 * Components are factory method that will generate a instance of a component.
 *
 * @fileoverview Defines and exports components
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 *
 * @namespace components
 * @memberof App
 * @requires App
 */
(function (global, undefined) {
	'use strict';
	
	/** Components **/
	var components = {};

	/**
	 * Create a default model of a component with an init function
	 * @name createAbstractComponent
	 * @method
	 * @memberof components
	 * @private
	 * @return {Object}
	 */
	var createAbstractComponent = function () {
		return {
			init: () => {}
		};
	};

	/**
	 * Merge the created component with the default model
	 * just to be sure there's an init method
	 * @name extendComponent
	 * @method
	 * @memberof components
	 * @param {Object} component
	 * @return {Object} component
	 * @private
	 */
	var extendComponent = function (component) {
		return Object.assign({}, createAbstractComponent(), component);
	};

	/**
	 * Make sure the component is unique by key verification
	 * and stores it with all the other components
	 * @name exportComponent
	 * @method
	 * @memberof components
	 * @param {String} key unique identifier
	 * @param {Function} component model of the component
	 * @param {Boolean} override fake news
	 * @private
	 */
	var exportComponent = function (key, component, override) {
		if (typeof key !== 'string') {
			App.log({args: ['`key` must be a string', key], fx: 'error'});
		} else if (!!components[key] && !override) {
			App.log({args: ['Overwriting component key %s is not allowed', key], fx: 'error'});
		} else {
			components[key] = Object.freeze(component);
			return component;
		}
		return false;
	};

	/**
	 * Create an instance of the component
	 * @name createComponent
	 * @method
	 * @memberof components
	 * @param {String} key unique identifier
	 * @param {Object} options object passed to the component's code
	 * @return {Object} Merged component with the default model and the actual component code
	 * @private
	 */
	var createComponent = function (key, options) {
		if (!components[key]) {
			App.log({args: ['Component %s is not found', key], fx: 'error'});
			return Object.freeze(extendComponent({}));
		}
		
		var c = components[key];
		
		if (typeof c !== 'function') {
			App.log({args: ['Component %s is not a function', key], fx: 'error'});
			return Object.freeze(extendComponent({}));
		}
		
		return Object.freeze(extendComponent(c.call(c, options)));
	};
	
	/** Public Interfaces **/
	global.App = Object.assign({}, global.App, {
		
		// Components
		components: {
			
			/**
			 * Get all components models
			 * @public
			 * @name models
			 * @method
			 * @memberof components
			 * @returns {Objects}
			 */
			models: function () {
				return components;
			},
			
			/**
			 * Create an instance of the component
			 * @name create
			 * @method
			 * @memberof components
			 * @param {String} key unique identifier
			 * @param {Object} options object passed to the component's code
			 * @return {Object} Merged component with the default model and the
			 *  actual component code
			 * @public
			 */
			create: createComponent,

			/**
			 * Make sure the component is unique by key verification
			 * and stores it with all the other components
			 * @name exports
			 * @method
			 * @memberof components
			 * @param {String} key unique identifier
			 * @param {Function} component model of the component
			 * @param {Boolean} override fake news
			 * @public
			 */
			exports: exportComponent
		}
	
	});
	
})(window);
