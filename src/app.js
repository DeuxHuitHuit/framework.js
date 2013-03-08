<<<<<<< HEAD
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
	currentPage = null,
	previousPage = null,
	
	/** Utility **/
	callback = function (fx, args) {
		if ($.isFunction(fx)) {
			return fx.apply(this, args);
		}
		return null;
	},
	
	/** Debug **/
	d = false,
	debug = function (value) {
		if (value === true || value === false) {
			d = value;
			return this;
		} else if (value === '!') {
			d = !d;
			return this;
		}
		return d;
	},
	
	logs = [],
	log = function (arg) {
		if (d) {
			// no args, exit
			if (!arg) {
				return this;
			}
			
			// ensure that args is an array
			if (!!arg.args && !$.isArray(arg.args)) {
				arg.args = [arg.args];
			}
			
			// our copy
			var a = {
				args: arg.args || arguments,
				fx: arg.fx || 'warn',
				me: arg.me || 'App'
			},
			t1 = $.type(a.args[0]);
			
			if (t1  === 'string' || t1 === 'number' || t1 == 'boolean') {
				// append me before a.args[0]
				a.args[0] = '[' + a.me + '] ' + a.args[0];
			}
			
			if (!!console) {
				// make sure fx exists
				if (!$.isFunction(console[a.fx])) {
					a.fx = 'log';
				}
				// call it
				if (!!console[a.fx].apply) {
					console[a.fx].apply(console, a.args);
				} else {
					$.each(a.args, function _logArgs(index, arg) {
						console[a.fx](arg);
					});
				}
			}
			
			logs.push(a);
		}
		return this;
	},
	
	/** Pages **/
	pages = {},
	
	_createAbstractPage = function () {
		var
		ftrue = function () {
			return true;
		},
		key = function () {
			return 'abstract';
		},
		loaded = function () {
			return !!$(this.key()).length;
		},
		enterLeave = function (next) {
			callback(next);
		};
	
		return {
			actions: $.noop,
			key: key, // css selector
			loaded: loaded,
			init: $.noop,
			enter: enterLeave,
			leave: enterLeave,
			canEnter: ftrue,
			canLeave: ftrue,
			routes: $.noop
		};
	},
	
	createPage = function (page) {
		return $.extend(_createAbstractPage(), page);
	},
	
	exportPage = function (key, page, override) {
		var newPage = createPage(page);
		if (!!pages[key] && !override) {
			log({args:['Overwriting page key %s is not allowed', key], fx:'error'});
		} else {
			pages[key] = newPage;
		}
		return newPage;
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
						testRoute = testRoute.replace(new RegExp('\\*','g'), '[a-zA-Z0-9|—_/\\-=?&\\[\\]\\\\#]*');
					}
					
					try {
						regex = new RegExp(testRoute);
					} catch (ex) {
						log({args:['Error while creating RegExp %s.\n%s', testRoute, ex], fx:'error'});
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
			$.each(pages, function _walkPage() {
				var routes = this.routes();
				// route found ?
				if (!!~_matchRoute(route, routes)) {
					page = this;
					return false; // exit
				}
				return true;
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
		var newModule = createModule(module);
		if (!!pages[key] && !override) {
			log({args:['Overwriting module key %s is not allowed', key], fx:'error'});
		} else {
			modules[key] = newModule;
		}
		return newModule;
	},
	
	/** Mediator **/
	mediatorIsLoadingPage = false,
	currentRouteUrl = document.location.href.substring((document.location.protocol + '//' + document.location.host).length),
	
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
			
			callback(tempFx, [key, data, e]);
		}
	},
	
	notifyPage = function (key, data, e) {
		if (!!currentPage) {
			_callAction(currentPage.actions(), key, data, e);
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
			log({args:'No route set.', fx:'error'});
		}else {
			result = true;
		}
		
		return result;
	},
	
	_validateMediatorState = function() {
		if (mediatorIsLoadingPage) {
			log({args:'Mediator is busy waiting for a page load.', fx:'error'});
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
			log('Cannot enter page %s.', nextPage.key());
			result = false;
		} 
		
		return result;
	},
	
	_canLeaveCurrentPage = function() {
		var result = false;
		
		if (!currentPage) {
			log({args:'No current page set.', fx:'error'});
		} else if (!currentPage.canLeave()) {
			log('Cannot leave page %s.', currentPage.key());
		} else {
			result = true;
		}
		
		return result;
	},
	
	//Actions
	
	/**
	*  Notify all registered component and page
	*
	*  @see AER in http://addyosmani.com/largescalejavascript/
	*  @see pub/sub http://freshbrewedcode.com/jimcowart/tag/pubsub/
	*/
	notifyAll = function (key, data, e) {
		
		// propagate action to current page
		notifyPage(key, data, e);
		
		// propagate action to all modules
		notifyModules(key, data, e);
		
		return this;
	},
	
	/** 
	*	Change the current page to the requested route
	*	Do nothing if the current page is already the requested route
	*/
	gotoPage = function (obj) {
		var 
		nextPage ,
		route = '',
		enterLeave = function () {
			//Keep currentPage pointer for the callback in a new variable 
			//The currentPage pointer will be cleared after the next call
			var leavingPage = currentPage;
			
			//notify all module
			notifyModules('page.leaving',{page: leavingPage});
				
			//Leave the current page
			currentPage.leave(function _leaveCurrent() {
				//ensure the leaving page is hidden
				$(leavingPage.key()).hide();
				//set leaving page to be previous one
				previousPage = leavingPage;
				//clear leavingPage
				leavingPage = null;
				
				//notify all module
				notifyModules('page.leave', {page: previousPage});
			});
			currentPage = null;  // clean currentPage pointer,this will block all interactions
			
			notifyModules('page.entering',{page: nextPage, route: route});
			
			nextPage.enter(function _enterNext() {
				// set the new Page as the current one
				currentPage = nextPage;
				// notify all module
				notifyModules('page.enter',{page: nextPage, route: route});
				// Put down the flag since we are finished
				mediatorIsLoadingPage = false;
			});
		},
		loadSucess = function (data, textStatus, jqXHR) {
			// get the node
			var node = $(data).find(nextPage.key());
			
			if (!node.length) {
				log({args:['Could not find "%s" in xhr data.', nextPage.key()], fx:'error'});
				
			} else {
				
				var elem = $(ROOT);
				
				// append it to the doc, hidden
				elem.append(node.css({opacity:0}));
				
				// init page
				nextPage.init();
				
				node.hide();
				notifyModules('pages.loaded', {elem:elem});
				
				// actual goto
				enterLeave();
				
			}
		}; 
		//end var
		
		if($.type(obj)==='string') {
			if (_canLeaveCurrentPage() &&  _validateMediatorState()) {
				nextPage = _getPageForRoute(obj);
				route = obj;
			}
		} else {
			nextPage = obj;
		}
			
		if (!_validateNextPage(nextPage)) {
			log({args:['Route "%s" was not found.', obj], fx:'error'});
		}else {
			if(_canEnterNextPage(nextPage)) {
				if (nextPage === currentPage && currentRouteUrl === route.substring(0,currentRouteUrl.length)) {
					log('next page is the current one');
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
			
			if(_validateNextPage(nextPage) && _canEnterNextPage(nextPage)) {
				if(nextPage !== currentPage) {
					gotoPage(route);
				} else {
					gotoPage(previousPage);
				}
			}
		}
		return this;
	},
	
	/** 
	*  Init All the applications
	*  Assign root variable
	*  Call init on all registered page and modules
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
		$.each(pages, function _initPage() {
			if (!!this.loaded()) {
				// init page
				this.init();
				
				// find if this is our current page
				// current route found ?
				if (!!~_matchRoute(currentRouteUrl, this.routes())) {
					//initialise page variable
					currentPage = this;
					previousPage = this; //Set the same for the first time
					notifyModules('page.entering',{page: currentPage, route: currentRouteUrl});
					//enter the page right now
					currentPage.enter(function() {
						notifyModules('page.enter', {page: currentPage, route: currentRouteUrl});
					});
				}
			}
		});
		
		// warning, no page found!
		if (!currentPage) {
			log({args:['Route "%s" was not found on init.', currentRouteUrl], fx:'error'});
		}
	},
	
	/** App **/
	run = function (root) {
		initApplication(root);
		return this;
	};
	
	/** Public Interfaces **/
	window.App = $.extend(window.App, {
		// root node for the pages
		root: function() {
			return ROOT;
		},
		// callback utility
		callback: callback,
		// get/set the debug flag
		debug: debug,
		// main entrance
		run: run,
		// log
		log: log,
		// logs
		logs: function () {return logs;},
		
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
				if (keyOrRoute[0] == '/') {
					return _getPageForRoute(keyOrRoute);
				} else {
					return pages[keyOrRoute];
				}
			},
			create: createPage,
			exports: exportPage,
			notify: notifyPage
		},
		
		// Modules
		modules: {
			create: createModule,
			exports: exportModule,
			notify: notifyModules
		}
	
	});
	
})(jQuery);
=======
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
	currentPage = null,
	previousPage = null,
	
	/** Utility **/
	callback = function (fx, args) {
		try {
			if ($.isFunction(fx)) {
				return fx.apply(this, args);
			}
		} catch (err) {
			log({args:err.message, fx:'error'});
		}
		return null;
	},
	
	/** Debug **/
	isDebuging = false,
	debug = function (value) {
		
		if (value === true || value === false) {
			//Set from a boolean
			isDebuging = value;
			return isDebuging;
		} else if (value === '!') {
			//Reverse set
			isDebuging = !isDebuging;
			return isDebuging;
		}
		return isDebuging;
	},
	
	logs = [],
	log = function (arg) {
		if (isDebuging) {
			// no args, exit
			if (!arg) {
				return this;
			}
			
			// ensure that args is an array
			if (!!arg.args && !$.isArray(arg.args)) {
				arg.args = [arg.args];
			}
			
			// our copy
			var a = {
				args: arg.args || arguments,
				fx: arg.fx || 'warn',
				me: arg.me || 'App'
			},
			t1 = $.type(a.args[0]);
			
			if (t1  === 'string' || t1 === 'number' || t1 == 'boolean') {
				// append me before a.args[0]
				a.args[0] = '[' + a.me + '] ' + a.args[0];
			}
			
			if (!!console) {
				// make sure fx exists
				if (!$.isFunction(console[a.fx])) {
					a.fx = 'log';
				}
				// call it
				if (!!console[a.fx].apply) {
					console[a.fx].apply(console, a.args);
				} else {
					$.each(a.args, function _logArgs(index, arg) {
						console[a.fx](arg);
					});
				}
			}
			
			logs.push(a);
		}
		return this;
	},
	
	/** Pages **/
	pageModels = {},
	pageInstances = {},
	
	_createPageModel = function (key, model) {
		var
		ftrue = function () {
			return true;
		},
		key = function () {
			return _key;
		},
		routes = function () {
			return _routes;
		},
		loaded = function () {
			return !!$(this.key()).length;
		},
		enterLeave = function (next) {
			callback(next);
		},
		
		factory = function () {
			return $.extend({
				actions: $.noop,
				key: key, // css selector
				loaded: loaded,
				init: $.noop,
				enter: enterLeave,
				leave: enterLeave,
				canEnter: ftrue,
				canLeave: ftrue,
				routes: routes,
				addRoute: function (route) {
					_routes.push(route);
				},
				addRoutes: function (r) {
					$.each(r, function _addRoute(index, route) {
						_routes.push(route);
					});
				}
			}, model);
		};
		
		factory.key = key;
		
		return factory;
	},
	
	createPage = function (page, model) {
		var 
		pageModel = pageModels[model],
		pageInst;
		
		if (!pageModel) {
			log({args:['Model %s not found', model], fx:'error'});
		}
		pageInst = $.extend(pageModel(page), pageModel);
		pageInstances[pageKey] = pageInst;
	},
	
	exportPage = function (key, override) {
		var pageModel = _createPageModel(key);
		if (!!pageModels[key] && !override) {
			log({args:['Overwriting page model key %s is not allowed', key], fx:'error'});
		} else {
			pageModels[key] = pageModel;
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
						testRoute = testRoute.replace(new RegExp('\\*','g'), '[a-zA-Z0-9_/\\-=?&\\[\\]\\\\]*');
					}
					
					try {
						regex = new RegExp(testRoute);
					} catch (ex) {
						log({args:['Error while creating RegExp %s.\n%s', testRoute, ex], fx:'error'});
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
			$.each(pages, function _walkPage() {
				var routes = this.routes();
				// route found ?
				if (!!~_matchRoute(route, routes)) {
					page = this;
					return false; // exit
				}
				return true;
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
		var newModule = createModule(module);
		if (!!pages[key] && !override) {
			log({args:['Overwriting module key %s is not allowed', key], fx:'error'});
		} else {
			modules[key] = newModule;
		}
		return newModule;
	},
	
	/** Mediator **/
	mediatorIsLoadingPage = false,
	currentRouteUrl = document.location.pathname,
	
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
			
			callback(tempFx, [key, data, e]);
		}
	},
	
	notifyPage = function (key, data, e) {
		if (!!currentPage) {
			_callAction(currentPage.actions(), key, data, e);
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
			log({args:'No route set.', fx:'error'});
		} else {
			result = true;
		}
		
		return result;
	},
	
	_validateMediatorState = function() {
		if (mediatorIsLoadingPage) {
			log({args:'Mediator is busy waiting for a page load.', fx:'error'});
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
			log('Cannot enter page %s.', nextPage.key());
			result = false;
		} 
		
		return result;
	},
	
	_canLeaveCurrentPage = function() {
		var result = false;
		
		if (!currentPage) {
			log({args:'No current page set.', fx:'error'});
		} else if (!currentPage.canLeave()) {
			log('Cannot leave page %s.', currentPage.key());
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
			var leavingPage = currentPage;
			
			//notify all module
			notifyModules('page.leaving',{page: leavingPage});
				
			//Leave the current page
			currentPage.leave(function _leaveCurrent() {
				//ensure the leaving page is hidden
				$(leavingPage.key()).hide();
				//set leaving page to be previous one
				previousPage = leavingPage;
				//clear leavingPage
				leavingPage = null;
				
				//notify all module
				notifyModules('page.leave', {page: previousPage});
			});
			currentPage = null;  // clean currentPage pointer,this will block all interactions
			
			notifyModules('page.entering',{page: nextPage, route: route});
			
			nextPage.enter(function _enterNext() {
				// set the new Page as the current one
				currentPage = nextPage;
				// notify all module
				notifyModules('page.enter',{page: nextPage, route: route});
				// Put down the flag since we are finished
				mediatorIsLoadingPage = false;
			});
		},
		loadSucess = function (data, textStatus, jqXHR) {
			// get the node
			var node = $(data).find(nextPage.key());
			
			if (!node.length) {
				log({args:['Could not find "%s" in xhr data.', nextPage.key()], fx:'error'});
				
			} else {
				
				var elem = $(ROOT);
				
				// append it to the doc, hidden
				elem.append(node.css({opacity:0}));
				
				// init page
				nextPage.init();
				
				node.hide();
				notifyModules('pages.loaded', {elem:elem});
				
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
			log({args:['Route "%s" was not found.', obj], fx:'error'});
		} else {
			if(_canEnterNextPage(nextPage)) {
				if (nextPage === currentPage && currentRouteUrl === route.substring(0,currentRouteUrl.length)) {
					log('next page is the current one');
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
			
			if(_validateNextPage(nextPage) && _canEnterNextPage(nextPage)) {
				if(nextPage !== currentPage) {
					gotoPage(route);
				} else {
					gotoPage(previousPage);
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
		$.each(pages, function _initPage() {
			if (!!this.loaded()) {
				// init page
				this.init();
				
				// find if this is our current page
				// current route found ?
				if (!!~_matchRoute(currentRouteUrl, this.routes())) {
					// initialise page variable
					currentPage = this;
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
		return this;
	};
	
	/** Public Interfaces **/
	window.App = $.extend(window.App, {
		// root node for the pages
		root: function() {
			return ROOT;
		},
		// callback utility
		callback: callback,
		// get/set the debug flag
		debug: debug,
		// main entrance
		run: run,
		// log
		log: log,
		// logs
		logs: function () {return logs;},
		
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
				if (keyOrRoute[0] == '/') {
					return _getPageForRoute(keyOrRoute);
				} else {
					return pages[keyOrRoute];
				}
			},
			create: createPage,
			exports: exportPage,
			notify: notifyPage
		},
		
		// Modules
		modules: {
			create: createModule,
			exports: exportModule,
			notify: notifyModules
		}
	
	});
	
})(jQuery);
>>>>>>> d5e58a3... Corrected the detection of goto current page
