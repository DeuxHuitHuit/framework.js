/**
 * @author Deux Huit Huit
 * 
 * Superlight App Framework
 */
;(function ($, undefined) {

	"use strict";
	
	var 
	
	//Default value
	ROOT = 'body',
	
	//Store ref to the current page object
	currentPage = null,
	//Store The current page used by the notification system
	currentNotifiedPage = null;
	
	//Store ref to the previous page object
	previousPage = null,
	previousUrl = "",
	/** Pages **/
	pageModels = {},
	pageInstances = {},
	
	_createPageModel = function (key, model, override) {
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
	},
	
	createPage = function (pageData, keyModel,override) {
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
	},
	
	/* Create a function to create a new page */
	exportPage = function (key, model, override) {
		
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
	},
	
	_matchRoute = function (route, routes) {
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
	},
	
	_getPageForRoute = function (route) {
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
	},
	
	/** Modules **/
	modules = {},
	
	_createAbstractModule = function () {
		
		return {
			actions: $.noop,
			init: $.noop
		};
	},
	
	createModule = function (module) {
		return $.extend(_createAbstractModule(), module);
	},
	
	exportModule = function (key, module, override) {
		if (!!pageInstances[key] && !override) {
			App.log({args:['Overwriting module key %s is not allowed', key], fx:'error'});
		} else {
			modules[key] = createModule(module);
		}
		return modules[key];
	},
	
	/** Mediator **/
	mediatorIsLoadingPage = false,
	currentRouteUrl = document.location.href.substring(document.location.protocol.length + 2 + document.location.host.length),
	
	_callAction = function (actions, key, data, e) {
		if (!!actions) {
			var tempFx = actions[key];
			
			if (!$.isFunction(tempFx) && !!~key.indexOf('.')) {
				tempFx = actions;
				// try JSONPath style...
				var paths = key.split('.');
				$.each(paths, function _eachPath () {
					tempFx = tempFx[this];
					if (!$.isPlainObject(tempFx)) {
						return false;
					}
				});
			}
			
			App.callback(tempFx, [key, data, e]);
		}
	},
	
	notifyPage = function (key, data, e) {
		if (!!currentNotifiedgPage) {
			_callAction(currentNotifiedgPage.actions(), key, data, e);
		}
		return this;
	},
	
	notifyModules = function (key, data, e) {
		$.each(modules, function _actionToAllModules () {
			_callAction(this.actions(), key, data, e);
		});
		return this;
	},
	
	// Validation
	_validateRoute = function(route) {
		var result = false;
		
		if (!route) {
			App.log({args:'No route set.', fx:'error'});
		} else {
			result = true;
		}
		
		return result;
	},
	
	_validateMediatorState = function() {
		if (mediatorIsLoadingPage) {
			App.log({args:'Mediator is busy waiting for a page load.', fx:'error'});
		}
		
		return !mediatorIsLoadingPage;
	},
	
	_validateNextPage = function(nextPage) {
		var result = true;
			
		if (!nextPage) {
			result = false;
		}
		
		return result;
	},
	
	_canEnterNextPage = function(nextPage) {
		var result = true;
		
		if (!nextPage.canEnter()) {
			App.log('Cannot enter page %s.', nextPage.key());
			result = false;
		} 
		
		return result;
	},
	
	_canLeaveCurrentPage = function() {
		var result = false;
		
		if (!currentPage) {
			App.log({args:'No current page set.', fx:'error'});
		} else if (!currentPage.canLeave()) {
			App.log('Cannot leave page %s.', currentPage.key());
		} else {
			result = true;
		}
		
		return result;
	},
	
	//Actions
	
	/**
	* Notify all registered component and page
	*
	* @see AER in http://addyosmani.com/largescalejavascript/
	* @see pub/sub http://freshbrewedcode.com/jimcowart/tag/pubsub/
	*/
	notifyAll = function (key, data, e) {
		
		// propagate action to current page
		notifyPage(key, data, e);
		
		// propagate action to all modules
		notifyModules(key, data, e);
		
		return this;
	},
	
	/** 
	* Change the current page to the requested route
	* Do nothing if the current page is already the requested route
	*/
	gotoPage = function (obj) {
		var 
		nextPage ,
		route = '',
		enterLeave = function () {
			//Keep currentPage pointer for the callback in a new variable 
			//The currentPage pointer will be cleared after the next call
			var 
			leavingPage = currentPage,
			
			_leaveCurrent = function() {
				//set leaving page to be previous one
				previousPage = leavingPage;
				previousUrl = document.location.href.substring(document.location.protocol.length + 2 + document.location.host.length);
				//clear leavingPage
				leavingPage = null;
				
				//notify all module
				notifyModules('page.leave', {page: previousPage});
			},
			_enterNext = function() {
				// set the new Page as the current one
				currentPage = nextPage;
				currentNotifiedPage = nextPage;
				// notify all module
				notifyModules('page.enter',{page: nextPage, route: route});
				// Put down the flag since we are finished
				mediatorIsLoadingPage = false;
			},
			pageTransitionData = {
				currentPage : currentPage,
				nextPage : nextPage,
				leaveCurrent : _leaveCurrent,
				enterNext : _enterNext,
				route : route,
				isHandled : false
			};
			
			// clean currentPage pointer,this will block all interactions
			currentPage = null;  
			
			//Try to find a module to handle page transition
			notifyModules('pages.requestPageTransition', pageTransitionData);
			
			//if not, return to classic code
			if(!pageTransitionData.isHandled) {
				//Leave to page the transition job
				
				//notify all module
				notifyModules('page.leaving',{page: leavingPage});
					
				//Leave the current page
				leavingPage.leave(_leaveCurrent);
				
				notifyModules('page.entering',{page: nextPage, route: route});
				
				nextPage.enter(_enterNext);
			}
		},
		loadSucess = function (data, textStatus, jqXHR) {
			// get the node
			var node = $(data).find(nextPage.key());
			
			if (!node.length) {
				App.log({args:['Could not find "%s" in xhr data.', nextPage.key()], fx:'error'});
				
			} else {
				
				var elem = $(ROOT);
				
				// append it to the doc, hidden
				elem.append(node.css({opacity:0}));
				
				// init page
				nextPage.init();
				
				node.hide();
				notifyModules('pages.loaded', {elem:elem, data : data, url: obj});
				
				// actual goto
				enterLeave();
				
			}
		}; 
		//end var
		
		if ($.type(obj)==='string') {
			if (_canLeaveCurrentPage() &&  _validateMediatorState()) {
				nextPage = _getPageForRoute(obj);
				route = obj;
			}
		} else {
			nextPage = obj;
		}
			
		if (!_validateNextPage(nextPage)) {
			App.log({args:['Route "%s" was not found.', obj], fx:'error'});
		} else {
			if(_canEnterNextPage(nextPage)) {
				if (nextPage === currentPage) {
					App.log('next page is the current one');
					notifyModules('pages.navigateToCurrent',{page: nextPage, route: route});
				} else {
					// Raise the flag to mark we are in the process
					// of loading a new page
					mediatorIsLoadingPage = true;
					// Load from xhr or uise cache copy
					if (!nextPage.loaded()) {
						notifyModules('pages.loading');
						Loader.load({
							url: obj, // the *actual* route
							priority: 0, // now
							vip: true, // don't queue on fail
							success: loadSucess,
							error: function () {
								notifyModules('pages.loaderror');
							}
						});
					} else {
						enterLeave();
					}
				}
			}
		}		
		return this;
	},
	
	togglePage = function(route) {
		if (!!currentPage && _validateMediatorState()) {
			var 
			nextPage = _getPageForRoute(route);
			
			if (_validateNextPage(nextPage) && _canEnterNextPage(nextPage)) {
				if(nextPage !== currentPage) {
					gotoPage(route);
				} else if(previousUrl !== ''){
					gotoPage(previousUrl);
				} else {
					notifyModules('page.toggleNoPreviousUrl',{currentPage : nextPage});
				}
			}
		}
		return this;
	},
	
	/** 
	* Init All the applications
	* Assign root variable
	* Call init on all registered page and modules
	*/
	initApplication = function(root) {
		
		// assure root node
		if (!!root && !!$(root).length) {
			ROOT = root;
		}
		
		// init each Modules
		$.each(modules, function _initModule() {
			this.init();
		});
		
		// init each Page already loaded
		$.each(pageInstances, function _initPage() {
			if (!!this.loaded()) {
				// init page
				this.init({firstTime: true});
				
				// find if this is our current page
				// current route found ?
				if (!!~_matchRoute(currentRouteUrl, this.routes())) {
					// initialise page variable
					currentPage = this;
					currentNotifiedPage = this;
					previousPage = this; // Set the same for the first time
					notifyModules('page.entering',{page: currentPage, route: currentRouteUrl});
					// enter the page right now
					currentPage.enter(function _currentPageEnterCallback() {
						notifyModules('page.enter', {page: currentPage, route: currentRouteUrl});
					});
				}
			}
		});
	},
	
	/** App **/
	run = function (root) {
		initApplication(root);
		return App;
	};
	
	/** Public Interfaces **/
	window.App = $.extend(window.App, {
		
		// root node for the pages
		root: function() {
			return ROOT;
		},

		// main entrance
		run: run,

		// mediator object
		mediator: {
			
			// event dispatcher to the
			// current Page and Modules
			notify: notifyAll,
			
			// leave the current Page and
			// enter a new one, specified by the url
			'goto': gotoPage,
			
			// toggle the requested page (may be enter or leave the requested page)
			//if leaving (already current page) then the previous page is using for the goto
			'toggle': togglePage
		},
		
		// Page creation
		pages: {
			// private
			_matchRoute: _matchRoute,
			
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
		},
		
		// Modules
		modules: {
		
			//create: createModule,
			
			exports: exportModule,
			
			notify: notifyModules
		}
	
	});
	
})(jQuery);
