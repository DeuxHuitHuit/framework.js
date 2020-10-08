/**
 * Mediator controls the current page and modules
 *
 * @fileoverview Defines the App Mediator
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 *
 * @namespace App.mediator
 */
(function (global, undefined) {
	'use strict';

	/**
	 * Returns the current document.location value, without the protocol and host
	 * @name getCurrentUrl
	 * @memberof App
	 * @method
	 * @returns {String} The url
	 * @private
	 */
	const getCurrentUrl = function () {
		return document.location.href.substring(
			document.location.protocol.length + 2 + document.location.host.length
		);
	};

	/** Mediator **/
	let mediatorIsLoadingPage = false;
	const currentRouteUrl = getCurrentUrl();

	//Store ref to the current page object
	let currentPage = null;

	//Store ref to the previous page object
	let previousPage = null;
	let previousUrl = '';

	/**
	 * Check if the mediator is loading a page
	 * @name validateMediatorState
	 * @memberof App
	 * @method
	 * @returns {Boolean}
	 * @private
	 */
	const validateMediatorState = function () {
		if (mediatorIsLoadingPage) {
			App.log({
				args: 'Mediator is busy waiting for a page load.',
				fx: 'error'
			});
		}

		return !mediatorIsLoadingPage;
	};

	/**
	 * Check if the page is valid or not
	 * @name validateNextPage
	 * @memberof App
	 * @method
	 * @param {Object} nextPage PageObject
	 * @returns {Boolean}
	 * @private
	 */
	const validateNextPage = function (nextPage) {
		let result = true;

		if (!nextPage) {
			result = false;
		}

		return result;
	};

	/**
	 * Check if we can enter the next page
	 * @name canEnterNextPage
	 * @memberof App
	 * @method
	 * @param {Object} nextPage Next page instence
	 * @returns {Boolean}
	 * @private
	 */
	const canEnterNextPage = function (nextPage) {
		let result = true;

		if (!nextPage.canEnter()) {
			App.log({ fx: 'error', args: ['Cannot enter page %s.', nextPage.key()] });
			result = false;
		}

		return result;
	};

	/**
	 * Check if we can leave the current page
	 * @name canLeaveCurrentPage
	 * @memberof App
	 * @method
	 * @returns {Boolean}
	 * @private
	 */
	const canLeaveCurrentPage = function () {
		let result = false;

		if (!currentPage) {
			App.log({ args: 'No current page set.', fx: 'error' });
		} else if (!currentPage.canLeave()) {
			App.log({ args: ['Cannot leave page %s.', currentPage.key()], fx: 'error' });
		} else {
			result = true;
		}

		return result;
	};

	//Actions

	/**
	 * Resolves the call to key only for the current page
	 * @name resolvePageAction
	 * @memberof App
	 * @method
	 * @param {String} key Notify key
	 * @param {Object} data Bag of data
	 * @this {Object} Mediator
	 * @returns {Object} A read/write object, if it exists
	 * @private
	 */
	const resolvePageAction = function (key, data) {
		if (!!currentPage) {
			return App.actions.resolve(currentPage.actions, key, data);
		} else {
			App.log({ args: 'Can not notify page: No current page set.', fx: 'error' });
		}
	};

	/**
	 * Resolves and executes the action on the page and all modules
	 * @name notifyAll
	 * @memberof App
	 * @method
	 * @param {String} key Notify key
	 * @param {Object} data Bag of data
	 * @param {Function} cb Callback executed after each App.actions.execute execution
	 * @this Mediator
	 * @returns this
	 * @see AER in http://addyosmani.com/largescalejavascript/
	 * @private
	 */
	const notifyAll = function (key, data, cb) {
		let actions = [];
		// resolve action from current page only
		const pa = resolvePageAction(key, data);
		if (!!pa) {
			actions.push(pa);
		}
		// resolve action from all modules
		actions = actions.concat(App.modules.resolve(key, data));
		// Execute everything
		App.actions.execute(actions, key, data, cb);
		return this;
	};

	/**
	 * Resolves and executes the action on the page
	 * @name notifyPage
	 * @memberof App
	 * @method
	 * @param {String} key Notify key
	 * @param {Object} data Bag of data
	 * @param {Function} cb Callback executed after each App.actions.execute execution
	 * @this Mediator
	 * @returns this
	 */
	const notifyPage = function (key, data, cb) {
		const pa = resolvePageAction(key, data);
		if (!!pa) {
			App.actions.execute([pa], key, data, cb);
		}
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
	const gotoPage = function (obj, previousPoppedUrl) {
		let nextPage;
		let route = '';

		/**
		 * Try to parse the data in a virtual element to be sure it's valid
		 * @param {String} data response data
		 * @returns {element}
		 */
		const safeParseData = function (data) {
			try {
				return document.createElement(data);
			}
			catch (ex) {
				App.log({ args: [ex.message], fx: 'error' });
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
			return null;
		};

		/**
		 * Initiate the transition and leave/enter page logic
		 */
		const enterLeave = function () {
			//Keep currentPage pointer for the callback in a new variable
			//The currentPage pointer will be cleared after the next call
			let leavingPage = currentPage;

			/**
			 * Block all interaction with the framework and notify the page leave
			 */
			const leaveCurrent = function () {
				currentPage = null; // clean currentPage pointer,this will block all interactions

				//set leaving page to be previous one
				previousPage = leavingPage;
				previousUrl = !!previousPoppedUrl ? previousPoppedUrl : getCurrentUrl();
				//clear leavingPage
				leavingPage = null;

				/**
				 * @event App#page:leave
				 * @type {object}
				 * @property {object} page PageObject
				 */
				App.modules.notify('page.leave', { page: previousPage });
			};

			/**
			 * Set the current page to the new one
			 */
			const enterNext = function () {
				// set the new Page as the current one
				currentPage = nextPage;

				/**
				 * @event App#page:enter
				 * @type {object}
				 * @property {object} page PageObject
				 */
				App.modules.notify('page.enter', { page: nextPage, route: route });
				// Put down the flag since we are finished
				mediatorIsLoadingPage = false;
			};

			const pageTransitionData = {
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
				nextPage.setInited();
			}

			//if not, return to classic code
			if (!pageTransitionData.isHandled) {
				//Leave to page the transition job

				/**
				 * @event App#page:leaving
				 * @type {object}
				 * @property {object} page PageObject
				 */
				App.modules.notify('page.leaving', { page: leavingPage });

				//Leave the current page
				leavingPage.leave(leaveCurrent);

				/**
				 * @event App#page:entering
				 * @type {object}
				 * @property {object} page PageObject
				 * @property {string} route url
				 */
				App.modules.notify('page.entering', { page: nextPage, route: route });

				nextPage.enter(enterNext);
			}
		};

		/**
		 * Verify that the data is valid an append the loaded content inside the App's root
		 * @param {String} data requested data
		 * @param {String} textStatus Current request status
		 * @param {Object} jqXHR request instance
		 */
		const loadSuccess = function (response) {
			return response.text().then((data) => {
				const htmldata = safeParseData(data);

				// get the node
				let node = htmldata.querySelector(nextPage.key());

				// get the root node
				const elem = document.querySelector(App.root());

				// Check for redirects
				const responseUrl = htmldata.querySelector(App.root() + ' > [data-response-url]')
					.getAttribute('data-response-url');

				if (!!responseUrl && responseUrl !== obj.split('#')[0]) {

					const redirectedPage = nextPage;

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

					if (!validateNextPage(nextPage)) {
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
						App.log({ args: ['Redirected route "%s" was not found.', obj], fx: 'error' });
						return;
					} else {
						node = htmldata.querySelector(nextPage.key());
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

				if (!node) {
					App.log({
						args: ['Could not find "%s" in xhr data.', nextPage.key()],
						fx: 'error'
					});

					// free the mediator
					mediatorIsLoadingPage = false;

					/**
					 * @event App#pages:notfound
					 * @type {Object}
					 * @property {String} data Loaded raw content
					 * @property {String} url request url
					 * @property {Object} response Response object instence
					 * @property {Int} status HTTP code for the response
					 */
					App.modules.notify('pages.notfound', {
						data: data,
						url: obj,
						response: response,
						status: response.status,
					});

				} else {
					// append it to the doc, hidden
					node.style.opacity = 0;
					elem.appendChild(node);

					// init page
					nextPage.init();
					nextPage.setInited();
					
					node.style.display = 'none';

					/**
					 * @event App#pages:loaded
					 * @type {Object}
					 * @property {element} elem Loaded content
					 * @property {String} data Loaded raw content
					 * @property {String} url request url
					 * @property {Object} page PageObject
					 * @property {element} node Page element
					 * @property {Object} response Response object instence
					 * @property {Int} status HTTP code for the response
					 */
					App.modules.notify('pages.loaded', {
						elem: elem,
						data: data,
						url: obj,
						page: nextPage,
						node: node,
						response: response,
						status: response.status
					});

					// actual goto
					enterLeave();
				}
			});
		};

		if (validateMediatorState() && canLeaveCurrentPage()) {
			if (typeof obj === 'string') {
				nextPage = App.pages.getPageForRoute(obj);
				route = obj;
			} else {
				nextPage = obj;
			}

			if (!validateNextPage(nextPage)) {
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
				App.log({ args: ['Route "%s" was not found.', obj], fx: 'error' });
			} else {
				if (canEnterNextPage(nextPage)) {
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
						if (!App.pages.loaded(obj)) {
							// Raise the flag to mark we are in the process
							// of loading a new page
							mediatorIsLoadingPage = true;

							App.loader.load(obj).then(loadSuccess).catch((event) => {
								/**
								 * @event App#pages:loaderror
								 * @type {Object}
								 * @property {Object} event Request event
								 * @property {String} url Request url
								 */
								App.modules.notify('pages.loaderror', {
									event: event,
									url: obj
								});
							});
						} else {
							enterLeave();

							/**
							 * @event App#pages:loaded
							 * @type {Object}
							 * @property {element} elem Root element
							 * @property {Object} event Request event
							 * @property {String} url Request url
							 */
							App.modules.notify('pages.loaded', {
								elem: document.querySelector(App.root()),
								url: obj,
								page: nextPage
							});
						}
					}
				} else {
					App.log({ args: ['Route "%s" is invalid.', obj], fx: 'error' });
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
	const togglePage = function (route, fallback) {
		if (!!currentPage && validateMediatorState()) {

			const nextPage = App.pages.getPageForRoute(route);

			if (validateNextPage(nextPage) && canEnterNextPage(nextPage)) {
				if (nextPage !== currentPage) {
					gotoPage(route);
				} else if (!!previousUrl && previousUrl !== getCurrentUrl()) {
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
	 * Properly sets the current page on first load
	 * @name initPage
	 * @memberof App.mediator
	 * @method
	 * @param {Object} page the loaded and inited page object
	 * @fires App#page:entering
	 * @fires App#page:enter
	 * @private
	 */
	const initPage = function (page) {
		// find if this is our current page
		// current route found ?
		if (!!~App.pages.matchRoute(currentRouteUrl, page.routes())) {
			if (!!currentPage) {
				App.log({
					args: ['Previous current page will be changed', {
						currentPage: currentPage,
						previousPage: previousPage,
						newCurrentPage: page
					}],
					fx: 'warning'
				});
			}
			// initialize page variable
			currentPage = page;
			previousPage = previousPage || page;

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
			currentPage.enter(function currentPageEnterCallback () {
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
	};

	/** Public Interfaces **/
	global.App = Object.assign({}, global.App, {
		/**
		 * @namespace mediator
		 * @memberof App
		 */
		mediator: {
			/**
			 * Get the current url string
			 * @name getCurrentUrl
			 * @memberof App.mediator
			 * @method
			 * @returns {string} The current url
			 * @public
			 */
			getCurrentUrl: getCurrentUrl,

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
			 * Set the currentPage object
			 * @name setCurrentPage
			 * @memberof App.mediator
			 * @method
			 * @param {Object} page The PageObject
			 * @private
			 */
			setCurrentPage: function (page) {
				currentPage = page;
			},

			/**
			 * Get the previous url string
			 * @name getPreviousUrl
			 * @memberof App.mediator
			 * @method
			 * @returns {string} The previous url
			 * @public
			 */
			getPreviousUrl: function () {
				return previousUrl;
			},

			/**
			 * Get the previousPage object
			 * @name getPreviousPage
			 * @memberof App.mediator
			 * @method
			 * @returns {Object} PageObject
			 * @public
			 */
			getPreviousPage: function () {
				return previousPage;
			},

			/**
			 * Resolves and execute the action on the page and all modules
			 * @name notify
			 * @memberof App.mediator
			 * @method
			 * @param {String} key Notify key
			 * @param {Object} data Bag of data
			 * @param {Function} cb Callback executed after each App.actions.execute execution
			 * @this Mediator
			 * @returns this
			 * @see AER in http://addyosmani.com/largescalejavascript/
			 * @public
			 */
			notify: notifyAll,

			/**
			 * Resolves and executes the action on the page
			 * @name notifyCurrentPage
			 * @memberof App.mediator
			 * @method
			 * @param {String} key Notify key
			 * @param {Object} data Bag of data
			 * @param {Function} cb Callback executed after each App.actions.execute execution
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
			toggle: togglePage,

			/**
			 * Properly sets the current page on first load
			 * @name init
			 * @memberof App.mediator
			 * @method
			 * @param {Object} page the loaded and inited page object
			 * @fires App#page:entering
			 * @fires App#page:enter
			 * @public
			 */
			init: initPage
		}
	});

})(window);
