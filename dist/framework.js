/*! framework.js - v1.1.1 - 2015-01-22
* https://github.com/DeuxHuitHuit/framework.js
* Copyright (c) 2015 Deux Huit Huit; Licensed MIT */
/**
 * @author Deux Huit Huit
 * 
 * App Callback functionnality
 *
 */
;(function ($, undefined) {

	"use strict";
	
	var 
	
	/** Utility **/
	callback = function (fx, args) {
		try {
			if ($.isFunction(fx)) {
				return fx.apply(this, args || []); // IE8 does not allow null/undefined args
			}
		} catch (err) {
			if(!window.App || !$.isFunction(window.App.debug)) {
				window.alert(err.message || err);
			}else {
				var 
				stack = App.debug() && err.stack,
				msg = (err.message || err) +  (stack || '');
				
				App.log({args:[msg, err], fx:'error'});
			}
		}
		return null;
	};
	
	/** Public Interfaces **/
	window.App = $.extend(window.App, {
		
		// callback utility
		callback: callback
		
	});
	
})(jQuery);

/**
 * @author Deux Huit Huit
 * 
 * App Debug and Log
 *
 */
;(function ($, undefined) {

	"use strict";
	
	var 
	
	/** Debug **/
	isDebuging = false,
	debug = function (value) {
		if (value === true || value === false) {
			isDebuging = value;
		} else if (value === '!') {
			isDebuging = !isDebuging;
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
			
			if (!!window.console) {
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
		}
		return this;
	};
	
	/** Public Interfaces **/
	window.App = $.extend(window.App, {
		
		// get/set the debug flag
		debug: debug,
		
		// log
		log: log,
		
		// logs
		logs: function () {return logs;}
		
	});
	
})(jQuery);

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
		}else {
			//Check to not overide an existing page
			if(!!pageInstances[pageData.key] && !override) {
				App.log({args:['Overwriting page key %s is not allowed', pageData.key], fx:'error'});
			}else {
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
				//ensure the leaving page is hidden
				//$(leavingPage.key()).hide();
				
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
			
			currentPage = null;  // clean currentPage pointer,this will block all interactions
			
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
				// free mediator
				mediatorIsLoadingPage = false;
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
								mediatorIsLoadingPage = false;
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
					notifyModules('page.toggleNoPreviousUrl');
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

/**
 * @author Deux Huit Huit
 */
 
 /*
 * Browser Support/Detection
 */
;(function ($, w, undefined) {
	
	"use strict";

	var 
	QueryStringParserConstructor = function() {
		var
		a = /\+/g,  // Regex for replacing addition symbol with a space
		r = /([^&=]+)=?([^&]*)/g,
		d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
		
		_parse = function(qs) {
			var 
			u = {},
			e,
			q;
			
			//if we dont have the parameter qs, use the window location search value
			if(qs !== "" && !!!qs) {
				qs = w.location.search;
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
	},
	
	BrowserDetectorConstructor = function() {
		var
		getUserAgent = function(userAgent) {
			if(userAgent !== "" && !!!userAgent) {
				userAgent = navigator.userAgent;
			}
			return userAgent;
		};
		
	
		return {
	
			isIos : function(userAgent) {
				return w.BrowserDetector.isIphone(userAgent) || w.BrowserDetector.isIpad(userAgent);
			},
			
			isIphone : function(userAgent) {
				userAgent = getUserAgent(userAgent);
				return !!(userAgent.match(/iPhone/i) || userAgent.match(/iPod/i));
			},
			
			isIpad : function(userAgent) {
				userAgent = getUserAgent(userAgent);
				return !!(userAgent.match(/iPad/i));
			},
			
			isAndroid : function(userAgent) {
				userAgent = getUserAgent(userAgent);
				return !!(userAgent.match(/Android/i));
			},
			
			isOtherMobile : function(userAgent) {
				userAgent = getUserAgent(userAgent);
				return !!(userAgent.match(/mobile/i) || userAgent.match(/phone/i));
			},
			
			isMobile : function(userAgent) {
				return w.BrowserDetector.isIos(userAgent) || w.BrowserDetector.isAndroid(userAgent) || w.BrowserDetector.isOtherMobile(userAgent);
			},
			
			isMsie : function(userAgent) {
				userAgent = getUserAgent(userAgent);
				return !!(userAgent.match(/msie/i));//$.uaMatch(userAgent).browser == 'msie';
			}
			
			/*isUnsupported : function(userAgent) {
				var 
				b;
				userAgent = getUserAgent(userAgent);
				b = $.uaMatch(userAgent);
				
				return b.browser === "" || (b.browser == 'msie' && parseInt(b.version,10)) < 9;
			}*/
		};
	};
	
	// Query string Parser
	// http://stackoverflow.com/questions/901115/get-query-string-values-in-javascript
	window.QueryStringParser = QueryStringParserConstructor();
	
	//Parse the query string and store a copy of the result in the window object
	window.QS = w.QueryStringParser.parse();
	
	// Browser detector
	window.BrowserDetector = BrowserDetectorConstructor();
	
	// User Agent parsing
	$.iphone =  w.BrowserDetector.isIphone();
	
	$.ipad =  w.BrowserDetector.isIpad();
	
	$.ios    =  w.BrowserDetector.isIos();
	
	$.mobile =  w.BrowserDetector.isMobile();
	
})(jQuery, window);
	
/**
 * General customization for mobile and default easing
 */
;(function ($, undefined) {
	
	"use strict";
	
	// add mobile css class to html
	if ($.mobile) {
		$('html').addClass('mobile');
	}
	
	// easing support
	$.easing.def = ($.mobile ? 'linear' : 'easeOutQuad');
	
})(jQuery);
	
/**
 * Global tools for debug
 */
;(function ($, undefined) {
	
	"use strict";
	
	// console support
	if (!window.console) {
		window.console = {};
		window.console.log = window.console.warn = window.console.error = 
			window.console.info = window.console.dir = window.console.time = 
			window.console.timeEnd = $.noop;
	}
	
})(jQuery);

/**
 * Global window tools
 */
;(function ($, undefined) {
	
	"use strict";
	
	var 
	hex = function(x) {
		return ("0" + parseInt(x, 10).toString(16)).slice(-2);
	};
		
	window.rgb2hex = function (rgb) {
		var hexa = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
		if (!hexa) {
			return rgb;
		}
		return hex(hexa[1]) + hex(hexa[2]) + hex(hexa[3]);
	};
	
	// prevent default macro
	window.pd = function (e, stop) {
		if (!!e) {
			if ($.isFunction(e.preventDefault)) {
				e.preventDefault();
			}
			if (stop === true && $.isFunction(e.stopPropagation)) {
				e.stopPropagation();
			}
		}
		return false;
	};
	
	/**
	 * Keyboard keys
	 */
	// from https://github.com/drobati/django-homepage/blob/1a75e9ba31c24cb77d87ff3eb435333932056af7/media/js/jquery.keyNav.js
	window.keys = {"?": 0,"backspace": 8,"tab": 9,"enter": 13,"shift": 16,"ctrl": 17,"alt": 18,"pause_break": 19,
			"caps_lock": 20,"escape": 27,"space_bar": 32, "page_up": 33,"page_down": 34,"end": 35,"home": 36,"left_arrow": 37,
			"up_arrow": 38,"right_arrow": 39,"down_arrow": 40,"insert": 45,"delete": 46,"0": 48,"1": 49,"2": 50,
			"3": 51,"4": 52,"5": 53,"6": 54,"7": 55,"8": 56,"9": 57,"a": 65,"b": 66,"c": 67,"d": 68,"e": 69,"f": 70,
			"g": 71,"h": 72,"i": 73,"j": 74,"k": 75,"l": 76,"m": 77,"n": 78,"o": 79,"p": 80,"q": 81,"r": 82,"s": 83,
			"t": 84,"u": 85,"v": 86,"w": 87,"x": 88,"y": 89,"z": 90,"left_window_key": 91,"right_window_key": 92,
			"select_key": 93,"numpad_0": 96,"numpad_1": 97,"numpad_2": 98,"numpad_3": 99,"numpad 4": 100,"numpad_5": 101,
			"numpad_6": 102,"numpad_7": 103,"numpad_8": 104,"numpad_9": 105,"multiply": 106,"add": 107,"subtract": 109,
			"decimal point": 110,"divide": 111,"f1": 112,"f2": 113,"f3": 114,"f4": 115,"f5": 116,"f6": 117,"f7": 118,
			"f8": 119,"f9": 120,"f10": 121,"f11": 122,"f12": 123,"num_lock": 144,"scroll_lock": 145,"semi_colon": 186,
			";": 186,"=": 187,"equal_sign": 187,"comma": 188,",": 188,"dash": 189,".": 190,"period": 190,"forward_slash": 191,
			"/": 191,"grave_accent": 192,"open_bracket": 219,"back_slash": 220,"\\": 220,"close_braket": 221,"single_quote":222};

	window.keyFromCode = function (code) {
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
	window.isChar = function (c) {
		return c === window.keys.space_bar || (c > window.keys['0'] && c <= window.keys.z);
	};
	
})(jQuery);

/**
 * @author Deux Huit Huit
 * 
 * Assets loader
 */
;(function ($, undefined) {
	
	"use strict";
	
	var
	
	assets = [], // FIFO
	
	loadIsWorking = false,
	
	currentUrl = null,
	
	isLoading = function (url) {
		return !!currentUrl && currentUrl === url;
	},
	
	inQueue = function (url) {
		var foundIndex = -1;
		$.each(assets, function _eachAsset(index, asset) {
			if (asset.url === url) {
				foundIndex = index;
				return false; // early exit
			}
			return true;
		});
		return foundIndex;
	},
	
	_recursiveLoad = function () {
		if (!!assets.length) {
			// start next one
			_loadOneAsset();
		} else {
			// work is done
			loadIsWorking = false;
		}
	},
	
	_loadOneAsset = function () {
		var 
		asset = assets.shift(), // grab first item
		param = $.extend({}, asset, {
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
				
				App.log({args:['Error loading url %s', asset.url], me:'Loader'});
				
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
	},
	
	validateUrlArgs = function(url,priority) {
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
	},
	
	loadAsset = function (url, priority) {
		if (!url) {
			App.log({args:'No url given', me:'Loader'});
			return this;
		}
		
		validateUrlArgs(url,priority);
		
		// ensure that asset is not current
		if (isLoading(url.url)) {
			App.log({args:['Url %s is already loading', url.url], me:'Loader'});
			return this;
		}
		
		var index = inQueue(url.url);
		
		// ensure that asset is not in the queue
		if (!~index) {
			// insert in array
			assets.splice(url.priority, 1, url);
			App.log({args:['Url %s has been insert at %s', url.url, url.priority], me:'Loader'});
			
		} else {
			// promote if new priority is different
			var oldAsset = assets[index];
			if (oldAsset.priority != url.priority) {
				// remove
				assets.splice(index, 1);
				// add
				assets.splice(url.priority, 1, url);
			}
			App.log({args:['Url %s was shifted from %s to %s', url.url, oldAsset.priority, url.priority], me:'Loader'});
		}
		
		launchLoad();
		
		return this;
	},
	
	launchLoad = function() {
		// start now if nothing is loading
		if (!loadIsWorking) {
			loadIsWorking = true;
			_loadOneAsset();
			App.log({args:'Load worker has been started', me:'Loader'});
		}
	};
	
	window.Loader = $.extend(window.Loader, {
		load: loadAsset,
		isLoading: isLoading,
		inQueue: inQueue,
		working: function () {
			return loadIsWorking;
		}
	});
	
})(jQuery);
