/**
 * Superlight App Framework
 *
 * @fileoverview Defines the App Mediator
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 *
 * @requires jQuery
 * @namespace App
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
	
	/**
	 * Find and execute the methods that matches with the notify key
	 * @name _callAction
	 * @memberof App
	 * @method
	 * @param {Function|Object} actions Object of methods that can be matches with the key's value
	 * @param {String} key Action key
	 * @param {Object} data Bag of data
	 * @returns {Boolean} Callback's result
	 * @private
	 */
	var _callAction = function (actions, key, data) {
		if ($.isFunction(actions)) {
			actions = actions();
		}
		if (!!actions) {
			var tempFx = actions[key];
			
			if (!$.isFunction(tempFx) && !!~key.indexOf('.')) {
				tempFx = actions;
				// try JSONPath style...
				var paths = key.split('.');
				$.each(paths, function eachPath () {
					tempFx = tempFx[this];
					if (!$.isPlainObject(tempFx)) {
						return false; // exit
					}
					return true;
				});
			}
			
			return App.callback(tempFx, [key, data]);
		}
	};
	
	/**
	 * Scope the _callAction actions only for the current page
	 * @name notifyPage
	 * @memberof App
	 * @method
	 * @param {String} key Notify key
	 * @param {Object} data Bag of data
	 * @param {Function} cb Callback executed after all the _callAction are executed
	 * @this {Object} Mediator
	 * @returns this
	 * @private
	 */
	var notifyPage = function (key, data, cb) {
		if (!!currentPage) {
			if ($.isFunction(data) && !cb) {
				cb = data;
				data = undefined;
			}
			var res = App._callAction(currentPage.actions, key, data);
			if (res !== undefined) {
				App.callback(cb, [currentPage.key(), res]);
			}
		} else {
			App.log({args: 'Can not notify page: No current page set.', fx: 'error'});
		}
		return this;
	};
	
	/**
	 * Check if the mediator is loading a page
	 * @name _validateMediatorState
	 * @memberof App
	 * @method
	 * @returns {Boolean}
	 * @private
	 */
	var _validateMediatorState = function () {
		if (mediatorIsLoadingPage) {
			App.log({args: 'Mediator is busy waiting for a page load.', fx: 'error'});
		}
		
		return !mediatorIsLoadingPage;
	};
	
	/**
	 * Check if the page is valid or not
	 * @name _validateNextPage
	 * @memberof App
	 * @method
	 * @param {Object} nextPage PageObject
	 * @returns {Boolean}
	 * @private
	 */
	var _validateNextPage = function (nextPage) {
		var result = true;
			
		if (!nextPage) {
			result = false;
		}
		
		return result;
	};
	
	/**
	 * Check if we can enter the next page
	 * @name _canEnterNextPage
	 * @memberof App
	 * @method
	 * @param {Object} nextPage Next page instence
	 * @returns {Boolean}
	 * @private
	 */
	var _canEnterNextPage = function (nextPage) {
		var result = true;
		
		if (!nextPage.canEnter()) {
			App.log('Cannot enter page %s.', nextPage.key());
			result = false;
		}
		
		return result;
	};
	
	/**
	 * Check if we can leave the current page
	 * @name _canLeaveCurrentPage
	 * @memberof App
	 * @method
	 * @returns {Boolean}
	 * @private
	 */
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
	 * @name notifyAll
	 * @memberof App
	 * @method
	 * @param {String} key Notify key
	 * @param {Object} data Object passed to notified methods
	 * @param {Function} cb Callback executed when the notify is done
	 * @this Mediator
	 * @returns this
	 * @see AER in http://addyosmani.com/largescalejavascript/
	 * @private
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
	 * @name gotoPage
	 * @memberof App
	 * @method
	 * @param {String} obj Page requested
	 * @param {String} previousPoppedUrl Url
	 * @fires App#page:leave
	 * @fires App#page:enter
	 * @fires App#pages:failedtoparse
	 * @fires App#pages:loaded
	 * @fires App#pages:loadfatalerror
	 * @fires App#pages:loaderror
	 * @fires App#pages:requestBeginPageTransition
	 * @fires App#pages:navigateToCurrent
	 * @fires App#pages:requestPageTransition
	 * @fires App#pages:routeNotFound
	 * @fires App#pages:loadprogress
	 * @fires App#pages:notfound
	 * @fires App#page:leaving
	 * @fires App#page:entering
	 * @this App
	 * @private
	 */
	var gotoPage = function (obj, previousPoppedUrl) {
		var nextPage;
		var route = '';
		
		/**
		 * Try to parse the data in jQuery to be sure it's valid
		 * @param {String} data response data
		 * @returns {jQuery}
		 */
		var safeParseData = function (data) {
			try {
				return $(data);
			}
			catch (ex) {
				App.log({args: [ex.message], fx: 'error'});
				/**
				 * @event App#pages:failedtoparse
				 * @type {object}
				 * @property {object} data
				 * @property {string} route
				 * @property {object} nextPage PageObject
				 * @property {object} currentPage PageObject
				 */
				App.modules.notify('pages.failedtoparse', {
					data: data,
					route: route,
					nextPage: nextPage,
					currentPage: currentPage
				});
			}
			return $();
		};
		
		/**
		 * Initiate the transition and leave/enter page logic
		 */
		var enterLeave = function () {
			//Keep currentPage pointer for the callback in a new variable
			//The currentPage pointer will be cleared after the next call
			var leavingPage = currentPage;
			
			/**
			 * Block all interaction with the framework and notify the page leave
			 */
			var leaveCurrent = function () {
				currentPage = null; // clean currentPage pointer,this will block all interactions
				
				//set leaving page to be previous one
				previousPage = leavingPage;
				previousUrl = !!previousPoppedUrl ? previousPoppedUrl :
					document.location.href.substring(
						document.location.protocol.length + 2 + document.location.host.length
					);
				//clear leavingPage
				leavingPage = null;
				
				/**
				 * @event App#page:leave
				 * @type {object}
				 * @property {object} page PageObject
				 */
				App.modules.notify('page.leave', {page: previousPage});
			};
			
			/**
			 * Set the current page to the new one
			 */
			var enterNext = function () {
				// set the new Page as the current one
				currentPage = nextPage;
				
				/**
				 * @event App#page:enter
				 * @type {object}
				 * @property {object} page PageObject
				 */
				App.modules.notify('page.enter', {page: nextPage, route: route});
				// Put down the flag since we are finished
				mediatorIsLoadingPage = false;
			};
			
			var pageTransitionData = {
				currentPage: currentPage,
				nextPage: nextPage,
				leaveCurrent: leaveCurrent,
				enterNext: enterNext,
				route: route,
				isHandled: false
			};
			
			/**
			 * @event App#pages:requestPageTransition
			 * @type {object}
			 * @property {object} pageTransitionData
			 */
			App.modules.notify('pages.requestPageTransition', pageTransitionData);
			
			if (!nextPage.isInited) {
				nextPage.init();
				nextPage.isInited = true;
			}
			
			//if not, return to classic code
			if (!pageTransitionData.isHandled) {
				//Leave to page the transition job
				
				/**
				 * @event App#page:leaving
				 * @type {object}
				 * @property {object} page PageObject
				 */
				App.modules.notify('page.leaving', {page: leavingPage});
				
				//Leave the current page
				leavingPage.leave(leaveCurrent);
				
				/**
				 * @event App#page:entering
				 * @type {object}
				 * @property {object} page PageObject
				 * @property {string} route url
				 */
				App.modules.notify('page.entering', {page: nextPage, route: route});
				
				nextPage.enter(enterNext);
			}
		};
		
		/**
		 * Verify that the data is valid an append the loadded content inside the App's root
		 * @param {String} data requested data
		 * @param {String} textStatus Current request status
		 * @param {Object} jqXHR request instence
		 */
		var loadSucess = function (data, textStatus, jqXHR) {
			var htmldata = safeParseData(data);
			
			// get the node
			var node = htmldata.find(nextPage.key());
			
			// get the root node
			var elem = $(ROOT);
			
			// Check for redirects
			var responseUrl = htmldata.find(ROOT + ' > [data-response-url]')
				.attr('data-response-url');
			
			if (!!responseUrl && responseUrl != obj.split('#')[0]) {
				
				var redirectedPage = nextPage;
				
				// Find the right page
				nextPage = App.pages.getPageForRoute(responseUrl);
				
				/**
				 * Offer a bail out door
				 * @event App#pages:redirected
				 * @type {Object}
				 * @property {String} route Url
				 * @property {String} requestedRoute Url
				 * @property {Object} nextPage PageObject
				 * @property {Object} currentPage PageObject
				 * @property {Object} redirectedPage PageObject
				 */
				App.modules.notify('pages.redirected', {
					currentPage: currentPage,
					nextPage: nextPage,
					redirectedPage: redirectedPage,
					requestedRoute: route,
					responseRoute: responseUrl
				});

				/**
				 * Cancel current transition
				 * @event App#pages:requestCancelPageTransition
				 * @type {Object}
				 * @property {String} route Url
				 * @property {Object} nextPage PageObject
				 * @property {Object} currentPage PageObject
				 */
				App.modules.notify('pages.requestCancelPageTransition', {
					currentPage: currentPage,
					nextPage: nextPage,
					route: route
				});
				
				if (!_validateNextPage(nextPage)) {
					/**
					 * @event App#pages:routeNotFound
					 * @type {object}
					 * @property {String} url Url
					 * @property {Boolean} isRedirect PageObject
					 * @property {Object} page PageObject
					 */
					App.modules.notify('pages.routeNotFound', {
						page: currentPage,
						url: obj,
						isRedirect: true
					});
					App.log({args: ['Redirected route "%s" was not found.', obj], fx: 'error'});
					return;
				} else {
					node = htmldata.find(nextPage.key());
					if (nextPage === currentPage) {
						/**
						 * @event App#pages:navigateToCurrent
						 * @type {object}
						 * @property {String} url Url
						 * @property {Boolean} isRedirect PageObject
						 * @property {Object} page PageObject
						 */
						App.modules.notify('pages.navigateToCurrent', {
							page: nextPage,
							route: route,
							isRedirect: true
						});
						App.log('Redirected next page is the current one');
					} else {
						/**
						 * Start new transition
						 * @event App#pages:requestBeginPageTransition
						 * @type {object}
						 * @property {String} route Url
						 * @property {Boolean} isRedirect PageObject
						 * @property {Object} nextPage PageObject
						 * @property {Object} currentPage PageObject
						 */
						App.modules.notify('pages.requestBeginPageTransition', {
							currentPage: currentPage,
							nextPage: nextPage,
							route: responseUrl,
							isRedirect: true
						});
						
					}
				}
			}
			
			if (!node.length) {
				
				App.log({args: ['Could not find "%s" in xhr data.', nextPage.key()], fx: 'error'});
				
				// free the mediator
				mediatorIsLoadingPage = false;
				
				/**
				 * @event App#pages:notfound
				 * @type {Object}
				 * @property {String} data Loaded raw content
				 * @property {String} url request url
				 * @property {Object} xhr Request object instence
				 * @property {String} status Status of the request
				 */
				App.modules.notify('pages.notfound', {
					data: data,
					url: obj,
					xhr: jqXHR,
					status: textStatus
				});
				
			} else {
				
				// append it to the doc, hidden
				elem.append(node.css({opacity: 0}));
				
				// init page
				nextPage.init();
				nextPage.isInited = true;
				
				node.hide();
				
				/**
				 * @event App#pages:loaded
				 * @type {Object}
				 * @property {jQuery} elem Loaded content
				 * @property {String} data Loaded raw content
				 * @property {String} url request url
				 * @property {Object} page PageObject
				 * @property {jQuery} node Page element
				 * @property {Object} xhr Request object instence
				 * @property {String} status Status of the request
				 */
				App.modules.notify('pages.loaded', {
					elem: elem,
					data: data,
					url: obj,
					page: nextPage,
					node: node,
					xhr: jqXHR,
					status: textStatus
				});
				
				// actual goto
				enterLeave();
			}
		};
		
		/**
		 * Disptch a notify for the progress' event
		 * @name progress
		 * @method
		 * @memberof App
		 * @private
		 * @param {Event} e Request progess event
		 */
		var progress = function (e) {
			var total = e.originalEvent.total;
			var loaded = e.originalEvent.loaded;
			var percent = total > 0 ? loaded / total : 0;

			/**
			 * @event App#pages:loadprogress
			 * @type {Object}
			 * @property {Object} event Request progress event
			 * @property {String} url Request url
			 * @property {Integer} total Total bytes
			 * @property {Integer} loaded Total bytes loaded
			 * @property {Integer} percent
			 */
			App.mediator.notify('pages.loadprogress', {
				event: e,
				url: obj,
				total: total,
				loaded: loaded,
				percent: percent
			});
		};
		
		if (_validateMediatorState() && _canLeaveCurrentPage()) {
			if ($.type(obj) === 'string') {
				nextPage = App.pages.getPageForRoute(obj);
				route = obj;
			} else {
				nextPage = obj;
			}
			
			if (!_validateNextPage(nextPage)) {
				/**
				 * @event App#pages:routeNotFound
				 * @type {Object}
				 * @property {Object} page PageObject
				 * @property {String} url Request url
				 */
				App.modules.notify('pages.routeNotFound', {
					page: currentPage,
					url: obj
				});
				App.log({args: ['Route "%s" was not found.', obj], fx: 'error'});
			} else {
				if (_canEnterNextPage(nextPage)) {
					if (nextPage === currentPage) {
						/**
						 * @event App#pages:navigateToCurrent
						 * @type {Object}
						 * @property {Object} page PageObject
						 * @property {String} route Request url
						 */
						App.modules.notify('pages.navigateToCurrent', {
							page: nextPage,
							route: route
						});
						App.log('Next page is the current one');
						
					} else {
						
						/**
						 * @event App#pages:loading
						 * @type {Object}
						 * @property {Object} page PageObject
						 */
						App.modules.notify('pages.loading', {
							page: nextPage
						});
						
						/**
						 * @event App#pages:requestBeginPageTransition
						 * @type {Object}
						 * @property {Object} currentPage PageObject
						 * @property {Object} nextPage PageObject
						 * @property {String} route Request url
						 */
						App.modules.notify('pages.requestBeginPageTransition', {
							currentPage: currentPage,
							nextPage: nextPage,
							route: route
						});
						
						// Load from xhr or use cache copy
						if (!nextPage.loaded()) {
							// Raise the flag to mark we are in the process
							// of loading a new page
							mediatorIsLoadingPage = true;
							
							App.loader.load({
								url: obj, // the *actual* route
								priority: 0, // now
								vip: true, // don't queue on fail
								success: loadSucess,
								progress: progress,
								error: function (e) {
									/**
									 * @event App#pages:loaderror
									 * @type {Object}
									 * @property {Object} event Request event
									 * @property {String} url Request url
									 */
									App.modules.notify('pages.loaderror', {
										event: e,
										url: obj
									});
								},
								giveup: function (e) {
									// Free the mediator
									mediatorIsLoadingPage = false;
									// Reset the current page
									
									App.log({args: 'Giving up!', me: 'Loader'});
									
									/**
									 * @event App#pages:loadfatalerror
									 * @type {Object}
									 * @property {Object} event Request event
									 * @property {String} url Request url
									 */
									App.modules.notify('pages.loadfatalerror', {
										event: e,
										url: obj
									});
								}
							});
						} else {
							enterLeave();
							
							/**
							 * @event App#pages:loaded
							 * @type {Object}
							 * @property {jQuery} elem Root element
							 * @property {Object} event Request event
							 * @property {String} url Request url
							 */
							App.modules.notify('pages.loaded', {
								elem: $(ROOT),
								url: obj,
								page: nextPage
							});
						}
					}
				} else {
					App.log({args: ['Route "%s" is invalid.', obj], fx: 'error'});
				}
			}
		}
		return this;
	};
	
	/**
	 * Open the wanted page,
	 * return to the precedent page if the requested on is already open
	 * or fallback to a default one
	 * @name togglePage
	 * @memberof App
	 * @method
	 * @fires App#page:toggleNoPreviousUrl
	 * @param {String} route Url
	 * @param {String} fallback Url used for as a fallback
	 * @private
	 */
	var togglePage = function (route, fallback) {
		if (!!currentPage && _validateMediatorState()) {
			var
			nextPage = App.pages.getPageForRoute(route);
			
			if (_validateNextPage(nextPage) && _canEnterNextPage(nextPage)) {
				if (nextPage !== currentPage) {
					gotoPage(route);
				} else if (!!previousUrl) {
					gotoPage(previousUrl);
				} else if (!!fallback) {
					gotoPage(fallback);
				} else {
					/**
					 * @event App#page:toggleNoPreviousUrl
					 * @type {object}
					 * @property {object} currentPage PageObject
					 */
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
	 * @name initApplication
	 * @memberof App
	 * @method
	 * @fires App#page:entering
	 * @fires App#page:enter
	 * @param {String} root CSS selector
	 * @private
	 */
	var initApplication = function (root) {
		
		// assure root node
		if (!!root && !!$(root).length) {
			ROOT = root;
		}
		
		// init each Modules
		$.each(App.modules.models(), function _initModule () {
			this.init();
		});
		
		// init each Page already loaded
		$.each(App.pages.instances(), function _initPage () {
			if (!!this.loaded()) {
				// init page
				this.init({firstTime: true});
				this.isInited = true;
				
				// find if this is our current page
				// current route found ?
				if (!!~App.pages._matchRoute(currentRouteUrl, this.routes())) {
					if (!!currentPage) {
						App.log({
							args: ['Previous current page will be changed', {
								currentPage: currentPage,
								previousPage: previousPage,
								newCurrentPage: this
							}],
							fx: 'warning'
						});
					}
					// initialize page variable
					currentPage = this;
					previousPage = previousPage || this;

					/**
					 * @event App#page:entering
					 * @type {object}
					 * @property {Object} page PageObject
					 * @property {String} route Url
					 */
					App.modules.notify('page.entering', {
						page: currentPage,
						route: currentRouteUrl
					});
					// enter the page right now
					currentPage.enter(function _currentPageEnterCallback () {
						/**
						 * @event App#page:enter
						 * @type {object}
						 * @property {Object} page PageObject
						 * @property {String} route Url
						 */
						App.modules.notify('page.enter', {
							page: currentPage,
							route: currentRouteUrl
						});
					});
				}
			}
		});
		
		if (!currentPage) {
			App.log({args: 'No current page set, pages will not work.', fx: 'error'});
		}
		
		notifyAll('app.init', {
			page: currentPage
		});
		
		if (!currentPage) {
			App.modules.notify('app.pageNotFound');
		}
	};
	
	/**
	 * Init the app with the given css selector
	 * @name run
	 * @memberof App
	 * @method
	 * @param {String=} root CSS selector
	 * @private
	 */
	var run = function (root) {
		initApplication(root);
		return App;
	};
	
	/** Public Interfaces **/
	global.App = $.extend(global.App, {
		
		/**
		 * Find and execute the methods that matches with the notify key
		 * @name _callAction
		 * @memberof App
		 * @method
		 * @param {Function|Object} actions Object of methods that can be matches
		 *   with the key's value
		 * @param {String} key Action key
		 * @param {Object} data Bag of data
		 * @returns {Boolean} Callback's result
		 * @public
		 */
		_callAction: _callAction,
		
		/**
		 * Get the root css selector
		 * @name root
		 * @method
		 * @memberof App
		 * @returns {String} Root CSS selector
		 * @public
		 */
		root: function () {
			return ROOT;
		},
		
		/**
		 * Init the app with the given css selector
		 * @name run
		 * @memberof App
		 * @method
		 * @param {String=} root CSS selector
		 * @public
		 */
		run: run,
		
		/**
		 * @namespace mediator
		 * @memberof App
		 * */
		mediator: {
			// private
			_currentPage: function (page) {
				if (!!page) {
					currentPage = page;
				}
				return currentPage;
			},
			
			/**
			 * Get the currentPage object
			 * @name getCurrentPage
			 * @memberof App.mediator
			 * @method
			 * @returns {Object} PageObject
			 * @public
			 */
			getCurrentPage: function () {
				return currentPage;
			},

			/**
			 * Notify all registered component and page
			 * @name notify
			 * @memberof App.mediator
			 * @method
			 * @param {String} key Notify key
			 * @param {Object} data Object passed to notified methods
			 * @param {Function} cb Callback executed when the notify is done
			 * @this Mediator
			 * @returns this
			 * @see AER in http://addyosmani.com/largescalejavascript/
			 * @public
			 */
			notify: notifyAll,
			
			/**
			 * Scope the _callAction actions only for the current page
			 * @name notifyCurrentPage
			 * @memberof App.mediator
			 * @method
			 * @param {String} key Notify key
			 * @param {Object} data Bag of data
			 * @param {Function} cb Callback executed after all the _callAction are executed
			 * @this {Object} Mediator
			 * @returns this
			 * @public
			 */
			notifyCurrentPage: notifyPage,
			
			/**
			 * Change the current page to the requested route
			 * Do nothing if the current page is already the requested route
			 * @name goto
			 * @memberof App.mediator
			 * @method
			 * @param {String} obj Page requested
			 * @param {String} previousPoppedUrl Url
			 * @fires App#page:leave
			 * @fires App#page:enter
			 * @fires App#pages:failedtoparse
			 * @fires App#pages:loaded
			 * @fires App#pages:loadfatalerror
			 * @fires App#pages:loaderror
			 * @fires App#pages:requestBeginPageTransition
			 * @fires App#pages:navigateToCurrent
			 * @fires App#pages:requestPageTransition
			 * @fires App#pages:routeNotFound
			 * @fires App#pages:loadprogress
			 * @fires App#pages:notfound
			 * @fires App#page:leaving
			 * @fires App#page:entering
			 * @this App
			 */
			goto: gotoPage,
			
			/**
			 * Open the wanted page,
			 * return to the precedent page if the requested on is already open
			 * or fallback to a default one
			 * @name toggle
			 * @memberof App.mediator
			 * @method
			 * @fires App#page:toggleNoPreviousUrl
			 * @param {String} route Url
			 * @param {String} fallback Url used for as a fallback
			 * @public
			 */
			toggle: togglePage
		}
	});
	
})(jQuery, window);
