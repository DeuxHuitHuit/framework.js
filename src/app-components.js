/**
 * @author Deux Huit Huit
 * 
 * Components
 * Components are factory method that will generate a instance of a component.
 */
(function ($, global, undefined) {

	'use strict';
	
	/** Components **/
	var components = {};
	
	var _createAbstractComponent = function () {
		return {
			init: $.noop
		};
	};
	
	var extendComponent = function (component) {
		return $.extend(_createAbstractComponent(), component);
	};
	
	var exportComponent = function (key, component, override) {
		if (!!components[key] && !override) {
			App.log({args: ['Overwriting component key %s is not allowed', key], fx: 'error'});
		} else {
			components[key] = component;
		}
		return components[key];
	};
	
	var createComponent = function (key, options) {
		if (!components[key]) {
			App.log({args: ['Component %s is not found', key], fx: 'error'});
		}
		
		var c = components[key];
		
		if (!$.isFunction(c)) {
			App.log({args: ['Component %s is not a function', key], fx: 'error'});
			return  extendComponent({});
		}
		
		return extendComponent(c.call(c, options));
	};
	
	/** Public Interfaces **/
	global.App = $.extend(global.App, {
		
		// Components
		components: {
			
			// private
			models: function () {
				return components;
			},
			
			create: createComponent,
			
			exports: exportComponent
		}
	
	});
	
})(jQuery, window);