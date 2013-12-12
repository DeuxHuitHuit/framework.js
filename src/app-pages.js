/**
 * @author Deux Huit Huit
 * 
 * Pages
 */
;(function ($, global, undefined) {

	"use strict";
	
	var pageModels = {};
	var pageInstances = {};
	
	var _createPageModel = function (key, model, override) {
		var
		
		
		ftrue = function () {
			return true;
		},
		
		_enterLeave = function (next) {
			App.callback(next);
		},
		
		factory = function (pageData) {
		
			var
			
			_pageData = pageData,
			
			_key = function () {
				return _pageData.key;
			},
			
			_routes = function () {
				return _pageData.routes;
			},
			
			_loaded = function () {
				return !!$(this.key()).length;
			};
			
			return $.extend({
				actions: $.noop,
				key: _key, // css selector
				loaded: _loaded,
				init: $.noop,
				enter: _enterLeave,
				leave: _enterLeave,
				canEnter: ftrue,
				canLeave: ftrue,
				routes: _routes,
				data : function() {
					return _pageData;
				}
			}, model);
		};
		
		return factory;
	};
	
	var createPage = function (pageData, keyModel,override) {
		var 
		//Find the page model associated
		pageModel = pageModels[keyModel],
		pageInst;
		
		if (!pageModel) {
			App.log({args:['Model %s not found', keyModel], fx:'error'});
			return false;
		} else {
			//Check to not overide an existing page
			if (!!pageInstances[pageData.key] && !override) {
				App.log({args:['Overwriting page key %s is not allowed', pageData.key], fx:'error'});
			} else {
				pageInst = pageModel(pageData);
				pageInstances[pageData.key] = pageInst;
				return true;
			}
		}
	};
	
	/* Create a function to create a new page */
	var exportPage = function (key, model, override) {
		
		var pageModel = _createPageModel(key,model);
		
		//find an existing page and cannot override it
		if (!!pageModels[key] && !override) {
			//error, should not override an existing key
			App.log({args:['Overwriting page model key %s is not allowed', key], fx:'error'});
			return false;
		} else {
			//Store page to the list
			pageModels[key] = pageModel;
			return true;
		}
	};
	
	 // Validation
	var _validateRoute = function(route) {
		var result = false;
		
		if (!route) {
			App.log({args:'No route set.', fx:'error'});
		} else {
			result = true;
		}
		
		return result;
	};
	
	
	var _matchRoute = function (route, routes) {
		var index = -1,
			found = function (i) {
				index = i;
				return false; // exit each
			};
		
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
					if (testRoute.indexOf('^') !== testRoute.length-1) {
						testRoute = testRoute + '$';
					}
					
					// wildcard replace
					// avoid overloading routes with regex
					if (testRoute.indexOf('*')) {
						testRoute = testRoute.replace(new RegExp('\\*','g'), '.*'); // a-zA-Z0-9 ,:;.=%$|—_/\\-=?&\\[\\]\\\\#
					}
					
					try {
						regex = new RegExp(testRoute);
					} catch (ex) {
						App.log({args:['Error while creating RegExp %s.\n%s', testRoute, ex], fx:'error'});
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
	var notifyPage = function (key, data, e) {
		App.log({args:'This method is deprecated in favor of App.mediator.notifyCurrentPage', fx:'error'});
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
			
			// public
			getPageForRoute: _getPageForRoute,
			
			page: function (keyOrRoute) {
				//Try to get the page by the key
				var result = pageInstances[keyOrRoute];
				
				//if no result found try with the route
				if(!!!result) {
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