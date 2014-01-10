/*! framework.js - v1.3.0 - build 52 - 2014-01-10
* https://github.com/DeuxHuitHuit/framework.js
* Copyright (c) 2014 Deux Huit Huit; Licensed MIT */
/**
 * @author Deux Huit Huit
 * 
 * App Callback functionnality
 *
 */
(function ($, global, undefined) {

	'use strict';
	
	/** Utility **/
	var callback = function (fx, args) {
		try {
			if (args !== null && args !== undefined &&
			   !$.isArray(args) && !$.isNumeric(args.length)) {
				args = [args];
			}
			
			if ($.isFunction(fx)) {
				// IE8 does not allow null/undefined args
				return fx.apply(this, args || []);
			}
		} catch (err) {
			var stack = err.stack;
			var msg = (err.message || err) + '\n' + (stack || '');
			
			App.log({args: [msg, err], fx: 'error'});
		}
		return undefined;
	};
	
	/** Public Interfaces **/
	global.App = $.extend(global.App, {
		
		// callback utility
		callback: callback
		
	});
	
})(jQuery, window);

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
/**
 * @author Deux Huit Huit
 * 
 * App Debug and Log
 *
 */
(function ($, global, undefined) {

	'use strict';
	
	/** Debug **/
	var isDebuging = false;
	
	var debug = function (value) {
		if (value === true || value === false) {
			isDebuging = value;
		} else if (value === '!') {
			isDebuging = !isDebuging;
		}
		return isDebuging;
	};
	
	var logs = [];
	var log = function (arg) {
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
		
		if (isDebuging) {
			// make sure fx exists
			if (!$.isFunction(console[a.fx])) {
				a.fx = 'log';
			}
			// call it
			if (!!window.console[a.fx].apply) {
				window.console[a.fx].apply(window.console, a.args);
			} else {
				$.each(a.args, function _logArgs(index, arg) {
					window.console[a.fx](arg);
				});
			}
		}
		logs.push(a);
		
		return this;
	};
	
	/** Public Interfaces **/
	global.App = $.extend(global.App, {
		
		// get/set the debug flag
		debug: debug,
		
		// log
		log: log,
		
		// logs
		logs: function () {
			return logs;
		}
	});
	
})(jQuery, window);

/**
 * @author Deux Huit Huit
 * 
 * Modules
 */
(function ($, global, undefined) {

	'use strict';
	
	/** Modules **/
	var modules = {};
	
	var _createAbstractModule = function () {
		return {
			actions: $.noop,
			init: $.noop
		};
	};
	
	var createModule = function (module) {
		return $.extend(_createAbstractModule(), module);
	};
	
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
	
	var notifyModules = function (key, data, cb) {
		$.each(modules, function _actionToAllModules(index) {
			var res = App._callAction(this.actions(), key, data, cb);
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
		
		var factory = function (pageData) {
		
			var _pageData = pageData;
			
			var _key = function () {
				return _pageData.key;
			};
			
			var _routes = function () {
				return _pageData.routes;
			};
			
			var _loaded = function () {
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
				data: function () {
					return _pageData;
				}
			}, model);
		};
		
		return factory;
	};
	
	var createPage = function (pageData, keyModel, override) {
		//Find the page model associated
		var pageModel = pageModels[keyModel];
		var pageInst;
		
		if (!pageModel) {
			App.log({args: ['Model %s not found', keyModel], fx: 'error'});
		} else {
			//Check to not overide an existing page
			if (!!pageInstances[pageData.key] && !override) {
				App.log({
					args: ['Overwriting page key %s is not allowed', pageData.key],
					fx: 'error'
				});
			} else {
				pageInst = pageModel(pageData);
				pageInstances[pageData.key] = pageInst;
				return pageInst;
			}
		}
		return false;
	};
	
	// Create a function to create a new page
	var exportPage = function (key, model, override) {
		
		var pageModel = _createPageModel(key, model);
		
		if (!$.type(key)) {
			App.log({args: ['`key` must be a string', key], fx: 'error'});
		//find an existing page and cannot override it
		} else if (!!pageModels[key] && !override) {
			//error, should not override an existing key
			App.log({
				args: ['Overwriting page model key %s is not allowed', key],
				fx: 'error'
			});
		} else {
			//Store page to the list
			pageModels[key] = pageModel;
			return pageModel;
		}
		return false;
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
/**
 * @author Deux Huit Huit
 * 
 * Superlight App Framework
 */
(function ($, global, undefined) {
	
	'use strict';
	
	//Default value
	var ROOT = 'body';
	
	/** Mediator **/
	var mediatorIsLoadingPage = false;
	var currentRouteUrl = document.location.href.substring(
		document.location.protocol.length + 2 + document.location.host.length
	);
	
	//Store ref to the current page object
	var currentPage = null;
	
	//Store ref to the previous page object
	var previousPage = null;
	var previousUrl = '';
	
	var _callAction = function (actions, key, data) {
		if (!!actions) {
			var tempFx = actions[key];
			
			if (!$.isFunction(tempFx) && !!~key.indexOf('.')) {
				tempFx = actions;
				// try JSONPath style...
				var paths = key.split('.');
				$.each(paths, function _eachPath() {
					tempFx = tempFx[this];
					if (!$.isPlainObject(tempFx)) {
						return false; // exit
					}
					return true;
				});
			}
			
			return App.callback(tempFx, [key, data]);
			
		} /*else {
			App.log({args: '`actions` is null.', fx: 'error'});
		}*/
	};
	
	var notifyPage = function (key, data, cb) {
		if (!!currentPage) {
			var res = App._callAction(currentPage.actions(), key, data);
			if (res !== undefined) {
				App.callback(cb, [currentPage.key(), res]);
			}
		}
		return this;
	};
	
	// Validation
	var _validateMediatorState = function () {
		if (mediatorIsLoadingPage) {
			App.log({args: 'Mediator is busy waiting for a page load.', fx: 'error'});
		}
		
		return !mediatorIsLoadingPage;
	};
	
	var _validateNextPage = function (nextPage) {
		var result = true;
			
		if (!nextPage) {
			result = false;
		}
		
		return result;
	};
	
	var _canEnterNextPage = function (nextPage) {
		var result = true;
		
		if (!nextPage.canEnter()) {
			App.log('Cannot enter page %s.', nextPage.key());
			result = false;
		} 
		
		return result;
	};
	
	var _canLeaveCurrentPage = function () {
		var result = false;
		
		if (!currentPage) {
			App.log({args: 'No current page set.', fx: 'error'});
		} else if (!currentPage.canLeave()) {
			App.log('Cannot leave page %s.', currentPage.key());
		} else {
			result = true;
		}
		
		return result;
	};
	
	//Actions
	
	/**
	* Notify all registered component and page
	*
	* @see AER in http://addyosmani.com/largescalejavascript/
	* @see pub/sub http://freshbrewedcode.com/jimcowart/tag/pubsub/
	*/
	var notifyAll = function (key, data, cb) {
		
		// propagate action to current page only
		notifyPage(key, data, cb);
		
		// propagate action to all modules
		App.modules.notify(key, data, cb);
		
		return this;
	};
	
	/** 
	* Change the current page to the requested route
	* Do nothing if the current page is already the requested route
	*/
	var gotoPage = function (obj) {
		var nextPage;
		var route = '';
		
		var enterLeave = function () {
			//Keep currentPage pointer for the callback in a new variable 
			//The currentPage pointer will be cleared after the next call
			var leavingPage = currentPage;
			
			var _leaveCurrent = function () {
				currentPage = null;  // clean currentPage pointer,this will block all interactions
				
				//set leaving page to be previous one
				previousPage = leavingPage;
				previousUrl = document.location.href.substring(
					document.location.protocol.length + 2 + document.location.host.length
				);
				//clear leavingPage
				leavingPage = null;
				
				//notify all module
				App.modules.notify('page.leave', {page: previousPage});
			};
			
			var _enterNext = function () {
				// set the new Page as the current one
				currentPage = nextPage;
				// notify all module
				App.modules.notify('page.enter', {page: nextPage, route: route});
				// Put down the flag since we are finished
				mediatorIsLoadingPage = false;
			};
			
			var pageTransitionData = {
				currentPage: currentPage,
				nextPage: nextPage,
				leaveCurrent: _leaveCurrent,
				enterNext: _enterNext,
				route: route,
				isHandled: false
			};
			
			//Try to find a module to handle page transition
			App.modules.notify('pages.requestPageTransition', pageTransitionData);
			
			//if not, return to classic code
			if (!pageTransitionData.isHandled) {
				//Leave to page the transition job
				
				//notify all module
				App.modules.notify('page.leaving', {page: leavingPage});
					
				//Leave the current page
				leavingPage.leave(_leaveCurrent);
				
				App.modules.notify('page.entering', {page: nextPage, route: route});
				
				nextPage.enter(_enterNext);
			}
		};
		
		var loadSucess = function (data, textStatus, jqXHR) {
			// get the node
			var node = $(data).find(nextPage.key());
			
			if (!node.length) {
				App.log({args: ['Could not find "%s" in xhr data.', nextPage.key()], fx: 'error'});
				
				// free the mediator
				mediatorIsLoadingPage = false;
				
				// notify
				App.modules.notify('pages.notfound', {data: data, url: obj});
				
			} else {
				
				var elem = $(ROOT);
				
				// append it to the doc, hidden
				elem.append(node.css({opacity: 0}));
				
				// init page
				nextPage.init();
				
				node.hide();
				App.modules.notify('pages.loaded', {elem: elem, data: data, url: obj});
				
				// actual goto
				enterLeave();
				
			}
		}; 
		
		var progress = function (e) {
			var total = e.originalEvent.total;
			var loaded = e.originalEvent.loaded;
			var percent = total > 0 ? loaded / total : 0;

			App.mediator.notify('pages.loadprogress', {
				event: e,
				url: obj,
				total: total,
				loaded: loaded,
				percent: percent
			});
		};
		
		if ($.type(obj) === 'string') {
			if (_canLeaveCurrentPage() &&  _validateMediatorState()) {
				nextPage = App.pages.getPageForRoute(obj);
				route = obj;
			}
		} else {
			nextPage = obj;
		}
			
		if (!_validateNextPage(nextPage)) {
			App.modules.notify('pages.routeNotFound', {route: route});
			App.log({args: ['Route "%s" was not found.', obj], fx: 'error'});
		} else {
			if (_canEnterNextPage(nextPage)) {
				if (nextPage === currentPage) {
					App.modules.notify('pages.navigateToCurrent', {page: nextPage, route: route});
					App.log('next page is the current one');
					
				} else {
					// Raise the flag to mark we are in the process
					// of loading a new page
					mediatorIsLoadingPage = true;
					// Load from xhr or use cache copy
					if (!nextPage.loaded()) {
						App.modules.notify('pages.loading');
						Loader.load({
							url: obj, // the *actual* route
							priority: 0, // now
							vip: true, // don't queue on fail
							success: loadSucess,
							progress: progress,
							error: function (e) {
								App.modules.notify('pages.loaderror', {event: e});
							},
							giveup: function (e) {
								// Free the mediator
								mediatorIsLoadingPage = false;
								// Reset the current page
								
								App.log({args: 'Giving up!', me: 'Loader'});
								
								App.modules.notify('pages.loadfatalerror', {event: e});
							}
						});
					} else {
						enterLeave();
					}
				}
			} else {
				App.log({args: ['Route "%s" is invalid.', obj], fx: 'error'});
			}
		}		
		return this;
	};
	
	var togglePage = function (route) {
		if (!!currentPage && _validateMediatorState()) {
			var 
			nextPage = App.pages.getPageForRoute(route);
			
			if (_validateNextPage(nextPage) && _canEnterNextPage(nextPage)) {
				if (nextPage !== currentPage) {
					gotoPage(route);
				} else if (!!previousUrl) {
					gotoPage(previousUrl);
				} else {
					App.modules.notify('page.toggleNoPreviousUrl', { currentPage: nextPage });
				}
			}
		}
		return this;
	};
	
	/** 
	* Init All the applications
	* Assign root variable
	* Call init on all registered page and modules
	*/
	var initApplication = function (root) {
		
		// assure root node
		if (!!root && !!$(root).length) {
			ROOT = root;
		}
		
		// init each Modules
		$.each(App.modules.models(), function _initModule() {
			this.init();
		});
		
		// init each Page already loaded
		$.each(App.pages.instances(), function _initPage() {
			if (!!this.loaded()) {
				// init page
				this.init({firstTime: true});
				
				// find if this is our current page
				// current route found ?
				if (!!~App.pages._matchRoute(currentRouteUrl, this.routes())) {
					// initialise page variable
					currentPage = this;
					previousPage = this; // Set the same for the first time
					App.modules.notify('page.entering', {
						page: currentPage,
						route: currentRouteUrl
					});
					// enter the page right now
					currentPage.enter(function _currentPageEnterCallback() {
						App.modules.notify('page.enter', {
							page: currentPage,
							route: currentRouteUrl
						});
					});
				}
			}
		});
	};
	
	/** App **/
	var run = function (root) {
		initApplication(root);
		return App;
	};
	
	/** Public Interfaces **/
	global.App = $.extend(global.App, {
		// private
		_callAction: _callAction,
		
		// root node for the pages
		root: function () {
			return ROOT;
		},
		
		// main entrance
		run: run,
		
		// mediator object
		mediator: {
			// private
			_currentPage: function (page) {
				if (!!page) {
					currentPage = page;
				}
				return currentPage;
			},
			
			// event dispatcher to the
			// current Page and Modules
			notify: notifyAll,
			
			// event dispatcher to the
			// current Page only
			notifyCurrentPage: notifyPage,
			
			// leave the current Page and
			// enter a new one, specified by the url
			goto: gotoPage,
			
			// toggle the requested page (may be enter or leave the requested page)
			//if leaving (already current page) then the previous page is using for the goto
			toggle: togglePage
		}
	});
	
})(jQuery, window);

/**
 * @author Deux Huit Huit
 */
 
 /*
 * Browser Support/Detection
 */
(function ($, global, undefined) {
	
	'use strict';
	
	var queryStringParser = function () {
		var
		a = /\+/g,  // Regex for replacing addition symbol with a space
		r = /([^&=]+)=?([^&]*)/gi,
		d = function (s) { return decodeURIComponent(s.replace(a, ' ')); },
		
		_parse = function (qs) {
			var 
			u = {},
			e,
			q;
			
			//if we dont have the parameter qs, use the window location search value
			if (qs !== '' && !qs) {
				qs = window.location.search;
			}
			
			//remove the first caracter (?)
			q = qs.substring(1);

			while ((e = r.exec(q))) {
				u[d(e[1])] = d(e[2]);
			}
			
			return u;
		};
		
		return {
			parse : _parse
		};
	};
	
	var browserDetector = function () {
		var getUserAgent = function (userAgent) {
			if (userAgent !== '' && !userAgent) {
				userAgent = navigator.userAgent;
			}
			return userAgent;
		};
		
		return {
			isIos : function (userAgent) {
				return global.BrowserDetector.isIphone(userAgent) || 
					global.BrowserDetector.isIpad(userAgent);
			},
			
			isIphone : function (userAgent) {
				userAgent = getUserAgent(userAgent);
				return !!(userAgent.match(/iPhone/i) || userAgent.match(/iPod/i));
			},
			
			isIpad : function (userAgent) {
				userAgent = getUserAgent(userAgent);
				return !!(userAgent.match(/iPad/i));
			},
			
			isAndroid : function (userAgent) {
				userAgent = getUserAgent(userAgent);
				return !!(userAgent.match(/Android/i));
			},
			
			isOtherMobile : function (userAgent) {
				userAgent = getUserAgent(userAgent);
				return !!(userAgent.match(/mobile/i) || userAgent.match(/phone/i));
			},
			
			isMobile : function (userAgent) {
				return global.BrowserDetector.isIos(userAgent) || 
					global.BrowserDetector.isAndroid(userAgent) || 
					global.BrowserDetector.isOtherMobile(userAgent);
			},
			
			isMsie : function (userAgent) {
				userAgent = getUserAgent(userAgent);
				return userAgent.match(/msie/gi) || userAgent.match(/trident/gi);
			}
			
			/*isUnsupported : function (userAgent) {
				var 
				b;
				userAgent = getUserAgent(userAgent);
				b = $.uaMatch(userAgent);
				
				return b.browser === "" || (b.browser == 'msie' && parseInt(b.version,10)) < 9;
			}*/
		};
	};
	
	// Query string Parser
	// http://stackoverflowindow.com/questions/901115/get-query-string-values-in-javascript
	global.QueryStringParser = queryStringParser();
	
	//Parse the query string and store a copy of the result in the window object
	global.QS = global.QueryStringParser.parse();
	
	// Browser detector
	global.BrowserDetector = browserDetector();
	
	// User Agent parsing
	$.iphone = global.BrowserDetector.isIphone();
	
	$.ipad = global.BrowserDetector.isIpad();
	
	$.ios = global.BrowserDetector.isIos();
	
	$.mobile = global.BrowserDetector.isMobile();
	
	
/**
 * General customization for mobile and default easing
 */
	
	// add mobile css class to html
	if ($.mobile) {
		$('html').addClass('mobile');
	}
	
	// easing support
	$.easing.def = ($.mobile ? 'linear' : 'easeOutQuad');
	
	
/**
 * Patching console object.
 */
	
	// see: https://developers.google.com/chrome-developer-tools/docs/console-api
	/*
	 * Snippet
	var c=[];
	$('ol.toc li').each(function () {
		var r = /console\.([a-z]+)/.exec($(this).text());r && c.push(r[1])
	});
	console.log(c);
	 */
	
	var consoleFx = ['assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error', 'group', 
		'group', 'group', 'info', 'log', 'profile', 'profile', 'time', 'time', 'time', 
		'trace', 'warn'];
	
	// console support
	if (!window.console) {
		window.console = {};
	}
	
	$.each(consoleFx, function (i, key) {
		window.console[key] = window.console[key] || $.noop;
	});
	

/**
 * Global window tools
 */
	
	var hex = function (x) {
		return ('0' + parseInt(x, 10).toString(16)).slice(-2);
	};
		
	global.rgb2hex = function (rgb) {
		var hexa = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
		if (!hexa) {
			return rgb;
		}
		return hex(hexa[1]) + hex(hexa[2]) + hex(hexa[3]);
	};
	
	// prevent default macro
	global.pd = function (e, stopPropagation) {
		if (!!e) {
			if ($.isFunction(e.preventDefault)) {
				e.preventDefault();
			}
			if (stopPropagation !== false && $.isFunction(e.stopPropagation)) {
				e.stopPropagation();
			}
		}
		return false;
	};
	
	/**
	 * Keyboard keys
	 */
	// from:
	// https://github.com/drobati/django-homepage/
	// blob/1a75e9ba31c24cb77d87ff3eb435333932056af7/media/js/jquery.keyNav.js
	global.keys = {
		'?': 0, 
		'backspace': 8,
		'tab': 9,
		'enter': 13,
		'shift': 16,
		'ctrl': 17,
		'alt': 18,
		'pause_break': 19,
		'caps_lock': 20,
		'escape': 27,
		'space_bar': 32,
		'page_up': 33,
		'page_down': 34,
		'end': 35,
		'home': 36,
		'left_arrow': 37, 
		'up_arrow': 38,
		'right_arrow': 39,
		'down_arrow': 40,
		'insert': 45,
		'delete': 46, 
		'0': 48,
		'1': 49,
		'2': 50,
		'3': 51,
		'4': 52,
		'5': 53,
		'6': 54,
		'7': 55,
		'8': 56, 
		'9': 57,
		'a': 65,
		'b': 66,
		'c': 67,
		'd': 68,
		'e': 69,
		'f': 70,
		'g': 71,
		'h': 72, 
		'i': 73,
		'j': 74,
		'k': 75,
		'l': 76,
		'm': 77,
		'n': 78,
		'o': 79,
		'p': 80,
		'q': 81,
		'r': 82,
		's': 83,
		't': 84,
		'u': 85,
		'v': 86,
		'w': 87,
		'x': 88,
		'y': 89,
		'z': 90,
		'left_window_key': 91,
		'right_window_key': 92,
		'select_key': 93,
		'numpad_0': 96,
		'numpad_1': 97,
		'numpad_2': 98,
		'numpad_3': 99,
		'numpad 4': 100,
		'numpad_5': 101,
		'numpad_6': 102,
		'numpad_7': 103,
		'numpad_8': 104,
		'numpad_9': 105,
		'multiply': 106,
		'add': 107,
		'subtract': 109,
		'decimal point': 110,
		'divide': 111,
		'f1': 112,
		'f2': 113,
		'f3': 114,
		'f4': 115,
		'f5': 116,
		'f6': 117,
		'f7': 118,
		'f8': 119,
		'f9': 120,
		'f10': 121,
		'f11': 122,
		'f12': 123,
		'num_lock': 144,
		'scroll_lock': 145,
		'semi_colon': 186,
		';': 186,
		'=': 187,
		'equal_sign': 187, 
		'comma': 188,
		', ': 188,
		'dash': 189,
		'.': 190,
		'period': 190,
		'forward_slash': 191,
		'/': 191,
		'grave_accent': 192,
		'open_bracket': 219,
		'back_slash': 220,
		'\\': 220,
		'close_braket': 221,
		'single_quote': 222
	};

	global.keyFromCode = function (code) {
		var key = '?';
		if (!code) {
			return key;
		}
		$.each(window.keys, function (index, value) {
			if (code === value) {
				key = index;
				return false;
			}
			
			return true;
		});
		return key;
	};
	
	// Chars
	global.isChar = function (c) {
		return c === window.keys.space_bar || (c > window.keys['0'] && c <= window.keys.z);
	};
	
})(jQuery, window);

/**
 * @author Deux Huit Huit
 * 
 * Assets loader: Basically a wrap around $.ajax in order
 *   to priorize and serialize resource loading.
 */
(function ($, global, undefined) {
	
	'use strict';

	// Forked: https://gist.github.com/nitriques/6583457
	(function addXhrProgressEvent() {
		var originalXhr = $.ajaxSettings.xhr;
		$.ajaxSetup({
			progress: $.noop,
			upload: $.noop,
			xhr: function () {
				var self = this;
				var req = originalXhr();
				if (req) {
					if ($.isFunction(req.addEventListener)) {
						req.addEventListener('progress', function (e) {
							self.progress($.Event(e)); // make sure it's jQuery-ize
						}, false);
					}
					if (!!req.upload && $.isFunction(req.upload.addEventListener)) {
						req.upload.addEventListener('progress', function (e) {
							self.upload($.Event(e)); // make sure it's jQuery-ize
						}, false);
					}
				}
				return req;
			}
		});
	})();
	
	var assets = []; // FIFO
	
	var loaderIsWorking = false;
	
	var currentUrl = null;
	
	var isLoading = function (url) {
		return !!currentUrl && currentUrl === url;
	};
	
	var inQueue = function (url) {
		var foundIndex = -1;
		$.each(assets, function _eachAsset(index, asset) {
			if (asset.url === url) {
				foundIndex = index;
				return false; // early exit
			}
			return true;
		});
		return foundIndex;
	};
	
	var _recursiveLoad = function () {
		if (!!assets.length) {
			// start next one
			_loadOneAsset();
		} else {
			// work is done
			loaderIsWorking = false;
		}
	};
	
	var _loadOneAsset = function () {
		 // grab first item
		var asset = assets.shift();
		var param = $.extend({}, asset, {
			progress: function () {
				// callback
				App.callback.call(this, asset.progress, arguments);
			},
			success: function () {
				// clear pointer
				currentUrl = null;
				
				// register next
				_recursiveLoad();
				
				// callback
				App.callback.call(this, asset.success, arguments);
			},
			error: function () {
				var maxRetriesFactor = !!asset.vip ? 2 : 1;
				
				// clear pointer
				currentUrl = null;
				
				App.log({args: ['Error loading url %s', asset.url], me: 'Loader'});
				
				// if no vip access is granted
				//if (!asset.vip) { 
					// decrease priority
					// this avoids looping for a unload-able asset
				asset.priority += ++asset.retries; // out of bounds checking is done later
				//}
				
				// @todo: check for the error code
				// and do something smart with it
				// 404 will sometimes wait for timeout, so it's better to skip it fast
				
				// if we already re-tried  less than x times
				if (asset.retries <= (asset.maxRetries * maxRetriesFactor)) {
					// push it back into the queue and retry
					loadAsset(asset);
				} else {
					// we give up!
					App.callback.call(this, asset.giveup, arguments);
				}
				
				// next
				_recursiveLoad();
				
				// callback
				App.callback.call(this, asset.error, arguments);
			}
		});
		
		// actual loading
		$.ajax(param);
		// set the pointer
		currentUrl = param.url;
	};
	
	var validateUrlArgs = function (url, priority) {
		// ensure we are dealing with an object
		if (!$.isPlainObject(url)) {
			url = {url: url};
		}
		
		// pass the priority param into the object
		if ($.isNumeric(priority) && Math.abs(priority) < assets.length) {
			url.priority = priority;
		} 
		
		// ensure that the priority is valid
		if (!$.isNumeric(url.priority) || Math.abs(url.priority) > assets.length) {
			url.priority = assets.length;
		}
		
		// ensure we have a value for the retries
		if (!$.isNumeric(url.retries)) {
			url.retries = 0;
		}
		if (!$.isNumeric(url.maxRetries)) {
			url.maxRetries = 2;
		}
	};
	
	var loadAsset = function (url, priority) {
		if (!url) {
			App.log({args: 'No url given', me: 'Loader'});
			return this;
		}
		
		validateUrlArgs(url, priority);
		
		// ensure that asset is not current
		if (isLoading(url.url)) {
			App.log({args: ['Url %s is already loading', url.url], me: 'Loader'});
			return this;
		}
		
		var index = inQueue(url.url);
		
		// ensure that asset is not in the queue
		if (!~index) {
			// insert in array
			assets.splice(url.priority, 1, url);
			App.log({args: ['Url %s has been insert at %s', url.url, url.priority], me: 'Loader'});
			
		} else {
			// promote if new priority is different
			var oldAsset = assets[index];
			if (oldAsset.priority != url.priority) {
				// remove
				assets.splice(index, 1);
				// add
				assets.splice(url.priority, 1, url);
			}
			App.log({
				args: [
					'Url %s was shifted from %s to %s',
					url.url,
					oldAsset.priority, url.priority
				],
				me: 'Loader'
			});
		}
		
		launchLoad();
		
		return this;
	};
	
	var launchLoad = function () {
		// start now if nothing is loading
		if (!loaderIsWorking) {
			loaderIsWorking = true;
			_loadOneAsset();
			App.log({args: 'Load worker has been started', me: 'Loader'});
		}
	};
	
	global.Loader = $.extend(global.Loader, {
		load: loadAsset,
		isLoading: isLoading,
		inQueue: inQueue,
		working: function () {
			return loaderIsWorking;
		}
	});
	
})(jQuery, window);
