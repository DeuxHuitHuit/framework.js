/**
 * @author Deux Huit Huit
 * 
 * Pages
 */
(function ($, global, undefined) {

	'use strict';
	
	var pageModels = {};
	var pageInstances = {};
	
	var _createPageModel = function (key, model, override) {
		var ftrue = function () {
			return true;
		};
		
		var _enterLeave = function (next) {
			App.callback(next);
		};
		
		var base = {
			actions: $.noop,
			init: $.noop,
			enter: _enterLeave,
			leave: _enterLeave,
			canEnter: ftrue,
			canLeave: ftrue
		};
		
		// This is the method that creates page instances
		var factory = function (pageData) {
		
			var _pageData = pageData;
			var modelRef;
			
			if ($.isPlainObject(model)) {
				modelRef = model;
			} else if ($.isFunction(model)) {
				modelRef = model.call(this, key, _pageData, override);
				if (!$.isPlainObject(modelRef)) {
					App.log({
						args: [
							'The exported page model function must return an object, ' + 
							'`%s` given (%s)', $.type(modelRef), modelRef
						],
						fx: 'error'
					});
					return null;
				}
			} else {
				App.log({
					args: [
						'The exported page model must be an object or a function, ' + 
						'`%s` given (%s)', $.type(model), model
					],
					fx: 'error'
				});
				return null;
			}
			
			var _key = function () {
				return _pageData.key;
			};
			
			var _routes = function () {
				return _pageData.routes;
			};
			
			var _loaded = function () {
				return !!$(_key()).length;
			};
			
			// recuperate extra params...
			var _data = function () {
				return _pageData;
			};
			
			 // insure this can't be overriden
			var overwrites = {
				key: _key, // css selector
				loaded: _loaded,
				routes: _routes,
				data: _data
			};
			
			// New deep copy object
			return $.extend(true, {}, base, modelRef, overwrites);
		};
		
		return factory;
	};
	
	var createPage = function (pageData, keyModel, override) {
		//Find the page model associated
		var pageModel = pageModels[keyModel];
		var pageInst;
		
		if (!pageModel) {
			App.log({args: ['Model `%s` not found', keyModel], fx: 'error'});
		} else {
			//Check to not overide an existing page
			if (!!pageInstances[pageData.key] && !override) {
				App.log({
					args: ['Overwriting page key `%s` is not allowed', pageData.key],
					fx: 'error'
				});
			} else {
				pageInst = pageModel(pageData);
				if (!!pageInst) {
					pageInstances[pageData.key] = pageInst;
				}
				return pageInst;
			}
		}
		return false;
	};
	
	var registerPageModel = function (key, pageModel, override) {
		var keyType = $.type(key);
		if (keyType !== 'string') {
			App.log({
				args: ['`key` must be a string, `%s` given (%s).', keyType, key],
				fx: 'error'
			});
		// Found an existing page and cannot override it
		} else if (!!pageModels[key] && !override) {
			//error, should not override an existing key
			App.log({
				args: ['Overwriting page model key `%s` is not allowed', key],
				fx: 'error'
			});
		} else {
			// Store page to the list
			pageModels[key] = pageModel;
			return pageModel;
		}
		return false;
	};
	
	// Create a function to create a new page
	var exportPage = function (key, model, override) {
		// Pass all args to the factory
		var pageModel = _createPageModel(key, model, override);
		// Only work with pageModel afterwards
		return registerPageModel(key, pageModel, override);
	};
	
	 // Validation
	var _validateRoute = function (route) {
		var result = false;
		
		if (!route) {
			App.log({args: 'No route set.', fx: 'error'});
		} else {
			result = true;
		}
		
		return result;
	};
	
	var _matchRoute = function (route, routes) {
		var index = -1;
		var found = function (i) {
			index = i;
			return false; // exit each
		};
		
		if ($.type(route) !== 'string') {
			App.log({args: '`route` must be a string', fx: 'error'});
			return index;
		}
		
		if (!!~route.indexOf('?')) {
			route = route.split('?')[0];
		}
		
		if (!!route && !!routes) {
			$.each(routes, function _matchOneRoute(i) {
				var regex,
					testRoute = this,
					routeType = $.type(testRoute);
				
				if (routeType == 'regexp') {
					if (testRoute.test(route)) {
						return found(i);
					}
					
				} else if (routeType == 'string') {
				
					// be sure to escape uri
					route = decodeURIComponent(route);
					
					// be sure we do not have hashed in the route
					route = route.split('#')[0];
					
					// avoid RegExp if possible
					if (testRoute == route) {
						return found(i);
					}
					
					// assure we are testing from the beginning
					if (testRoute.indexOf('^') !== 0) {
						testRoute = '^' + testRoute;
					}
					
					// assure we are testing until the end
					if (testRoute.indexOf('^') !== testRoute.length - 1) {
						testRoute = testRoute + '$';
					}
					
					// wildcard replace
					// avoid overloading routes with regex
					if (testRoute.indexOf('*')) {
						 // a-zA-Z0-9 ,:;.=%$|—_/\\-=?&\\[\\]\\\\#
						testRoute = testRoute.replace(new RegExp('\\*', 'gi'), '.*');
					}
					
					try {
						regex = new RegExp(testRoute);
					} catch (ex) {
						App.log({
							args: ['Error while creating RegExp %s.\n%s', testRoute, ex],
							fx: 'error'
						});
					}
					
					if (!!regex && regex.test(route)) {
						return found(i);
					}
				} else {
					if (testRoute === route) {
						return found(i);
					}
				}
				return true;
			});
		}
		
		return index;
	};
	
	var _getPageForRoute = function (route) {
		var page = null;
		if (_validateRoute(route)) {
			$.each(pageInstances, function _walkPage() {
				var routes = this.routes();
				// route found ?
				if (!!~_matchRoute(route, routes)) {
					page = this;
					return false; // exit
				}
			});
		}
		return page;
	};
	
	// Should notify all pages ??
	var notifyPage = function (key, data, cb) {
		App.log({
			args: 'This method is deprecated in favor of App.mediator.notifyCurrentPage',
			fx: 'info'
		});
	};
	
	/** Public Interfaces **/
	global.App = $.extend(global.App, {
		// Page creation
		pages: {
			// private
			_matchRoute: _matchRoute,
			_validateRoute: _validateRoute,
			instances: function (key) {
				if (!!key) {
					return pageInstances[key];
				}
				return pageInstances;
			},
			models: function () {
				return pageModels;
			},
			
			// public
			getPageForRoute: _getPageForRoute,
			
			page: function (keyOrRoute) {
				//Try to get the page by the key
				var result = pageInstances[keyOrRoute];
				
				//if no result found try with the route
				if (!!!result) {
					result = _getPageForRoute(keyOrRoute);
				}
				
				return result;
			},
			
			create: createPage,
			
			//Add a new template to the list of page templates exports(key,model,override)
			exports: exportPage,
			
			notify: notifyPage
		}
	});
	
})(jQuery, window);