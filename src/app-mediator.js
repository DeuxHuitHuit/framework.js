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
		return document.location.pathname;
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
		if (!!mediatorIsLoadingPage) {
			App.log({
				args: 'Mediator is busy waiting for a page load.',
				fx: 'error'
			});
		}

		return !mediatorIsLoadingPage;
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
	 * @param {Boolean} changeUrl if goto need to change the url or not
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
	const gotoPage = function (obj, previousPoppedUrl, pageData = {}, changeUrl = true) {
		let nextPage;
		let route = '';

		/**
		 * Try to parse the data in a virtual element to be sure it's valid
		 * @param {String} data response data
		 * @returns {element}
		 */
		const safeParseData = function (data) {
			try {
				const parser = new window.DOMParser();
				const doc = parser.parseFromString(data, 'text/html');

				return doc;
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
			pageData.firstTime = false;

			if (!nextPage.isInited()) {
				nextPage.init();
				nextPage.setInited();
				pageData.firstTime = true;
			}

			/**
			 * @event App#page:leaving
			 * @type {object}
			 * @property {object} page PageObject
			 */
			App.modules.notify('page.leaving', { page: leavingPage });

			//Leave the current page
			leavingPage.leave(function () {
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
			});

			/**
			 * @event App#page:entering
			 * @type {object}
			 * @property {object} page PageObject
			 * @property {string} route url
			 */
			App.modules.notify('page.entering', { page: nextPage, route: route });

			nextPage.enter(function () {
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
			}, pageData);
		};

		/**
		 * Verify that the data is valid an append the loaded content inside the App's root
		 * @param {String} data requested data
		 * @param {String} textStatus Current request status
		 * @param {Object} jqXHR request instance
		 */
		const loadSuccess = function (response) {

			// if a redirection was detected by the browser with the original goto replicate it
			if (!!response.redirected) {
				window.history.replaceState({
					data: {
						mediator: true,
						type: 'pushState',
						redirected: true
					}
				}, '', response.url);

				nextPage = App.pages.getPageForHref(response.url);
				route = response.url;

				const node = document.querySelector(nextPage.selector());
				
				// If the redirected page already exists re-use it else continue the normal flow.
				if (!!node) {
					node.style.opacity = 0;
					node.style.display = 'none';
					return enterLeave();
				}
			}

			return response.text().then((data) => {
				const htmldata = safeParseData(data);

				// get the node
				let node = htmldata.querySelector(nextPage.selector());

				// get the root node
				const elem = document.querySelector(App.root());

				if (!node) {
					App.log({
						args: ['Could not find "%s" in xhr data.', nextPage.selector()],
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
					node.style.display = 'none';

					elem.appendChild(node);

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
						html: htmldata,
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
				nextPage = App.pages.getPageForHref(obj);
				route = obj;
			} else {
				App.log({fx: 'error', args: 'Url parameter must be of type string got ' + typeof obj}); // jshint ignore:line
				return;
			}

			if (!nextPage) {
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
					if (nextPage.key() === currentPage.key()) {
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

						if (!!changeUrl) {
							window.history.pushState({
								data: {
									mediator: true
								}
							}, '', obj);
							pageData.type = 'pushState';
						}

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
		}, true);
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
