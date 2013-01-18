/*! framework.js - v1.0.0 - 2013-01-18
* https://github.com/DeuxHuitHuit/framework.js
* Copyright (c) 2013 Deux Huit Huit; Licensed MIT */

/**
 * @author Deux Huit Huit
 */
 
 /*
 * Browser Support/Detection
 */
;(function ($, undefined) {
	
	"use strict";
	
	var ua = navigator.userAgent;
	
	$.unsupported = !$.browser || ($.browser.msie && parseInt($.browser.version, 10) < 9);
	
	$.iphone =  !!ua && 
					(ua.match(/iPhone/i) || 
					 ua.match(/iPod/i)); 
	
	$.ios    =  $.iphone || 
					(!!ua &&
					ua.match(/iPad/i)); 
	
	$.mobile =  $.ios || 
					(!!ua && (
					ua.match(/Android/i) ||
					ua.match(/mobile/i) ||
					ua.match(/phone/i)));
})(jQuery);
	
/**
 * General customisation for mobile and default easing
 */
(function ($, undefined) {
	
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
 (function ($, undefined) {
	
	"use strict";
	
	// console support
	if (!window.console) {
		console.log = console.warn = console.error = console.info = console.dir = $.noop;
	}
	
})(jQuery);

/**
 * Global window tools
 */
 (function ($, undefined) {
	
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
	
	window.pd = function (e) {
		if (e && $.isFunction(e.preventDefault)) {
			e.preventDefault();
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
			if (code == value) {
				key = index;
				return false;
			}
				
			return true;
		});
		return key;
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
				// clear pointer
				currentUrl = null;
				
				App.log({args:['Error loading url %s', asset.url], me:'Loader'});
				
				// if no vip access is granted
				if (!asset.vip) { 
					// decrease priority
					// this avoids looping for a unload-able asset
					asset.priority += ++asset.retries; // out of bounds checking is done later
				}
				
				// @todo: check for the error code
				// and do something smart with it
				// 404 will sometimes wait for timeout, so it's better to skip it fast
				
				// if we already re-tried  less than x times
				if (asset.retries <= asset.maxRetries) {
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
	
	loadAsset = function (url, priority) {
		if (!url) {
			App.log({args:'No url given', me:'Loader'});
			return this;
		}
		
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
		
		// start now if nothing is loading
		if (!loadIsWorking) {
			loadIsWorking = true;
			_loadOneAsset();
			App.log({args:'Load worker has been started', me:'Loader'});
		}
		
		return this;
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
					console[a.fx](console, a.args);
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
	
	exportPage = function (key, page) {
		var newPage = createPage(page);
		pages[key] = newPage;
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
				var testRoute = this,
					routeType = $.type(testRoute);
				
				if (routeType == 'regexp') {
					if (testRoute.test(route)) {
						return found(i);
					}
					
				} else if (routeType == 'string') {
					
					// avoid RegExp if possible
					if (testRoute == route) {
						return found(i);
					}
					
					// assure we are testing from the beginning
					if (testRoute.indexOf('^') !== 0) {
						testRoute = '^' + testRoute;
					}
					
					// assure we are testing until the end
					if (testRoute.indexOf('^') != testRoute.length-1) {
						testRoute = testRoute + '$';
					}
					
					// wildcard replace
					// avoid overloading routes with regex
					if (testRoute.indexOf('*')) {
						testRoute = testRoute.replace(new RegExp('\\*','g'), '[a-zA-Z0-9_/\\-=?&]*');
					}
					
					var regex = new RegExp(testRoute);
					
					if (regex.test(route)) {
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
	
	exportModule = function (key, module) {
		var newModule = createModule(module);
		modules[key] = newModule;
		return newModule;
	},
	
	/** Mediator **/
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
		var result = true;
		
		if (false /* check if the loader is not loading a page */) {
			log({args:'Mediator is busy waiting for a page load.', fx:'error'});
			result = false;
		}
		
		return result;
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
	*  @see: AER in http://addyosmani.com/largescalejavascript/
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
		route = "",
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
				//notify all module;
				notifyModules('page.enter',{page: nextPage, route: route});
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
		
		if(typeof(obj)=='string') {
			if (_canLeaveCurrentPage() &&  _validateMediatorState()) {
				nextPage = _getPageForRoute(obj);
				route = obj;
			}
		}else {
			nextPage = obj;
		}
			
		if (!_validateNextPage(nextPage)) {
			log({args:['Route "%s" was not found.', obj], fx:'error'});
		}else {
			if(_canEnterNextPage(nextPage)) {
				if (nextPage === currentPage) {
					log('next page is the current one');
					notifyModules('pages.navigateToCurrent',{page: nextPage, route: route});
				}else {
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
			var 
			docRoute = document.location.pathname;
			if (!!this.loaded()) {
				// init page
				this.init();
				
				// find if this is our current page
				// current route found ?
				if (!!~_matchRoute(docRoute, this.routes())) {
					//initialise page variable
					currentPage = this;
					previousPage = this; //Set the same for the first time
					notifyModules('page.entering',{page: currentPage, route: docRoute});
					//enter the page right now
					currentPage.enter(function() {
						notifyModules('page.enter', {page: currentPage, route: docRoute});
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
			'export': exportPage,
			notify: notifyPage
		},
		
		// Modules
		modules: {
			create: createModule,
			'export': exportModule,
			notify: notifyModules
		}
	
	});
	
})(jQuery);
