/**
 * Pages are controller that are activated on a url basis.
 *
 * @fileoverview Defines and exports pages
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 *
 * @namespace pages
 * @memberof App
 * @requires App
 */
(function (global, undefined) {
	'use strict';
	
	const pageModels = {};
	const pageInstances = {};

	/**
	 * Creates and a new factory function based on the
	 * given parameters
	 * @name createPageModel
	 * @memberof pages
	 * @method
	 * @param {String} key The unique key for this page model
	 * @param {pageParam|pageCreator} model A page object that conforms with the pageParam type
	 *   or a pageCreator function that returns a page object.
	 * @param {Boolean} [override=false] Allows overriding an existing page model
	 *
	 * @returns {pageModel} The newly built factory function
	 * @private
	 */
	const createPageModel = function (key, model, override) {

		/**
		 * Page Param
		 * @memberof pages
		 * @typedef {Object} pageParam
		 * @param {Function} actions @returns {object}
		 * @param {Function} init
		 * @param {Function} enter
		 * @param {Function} leave
		 * @param {Function} canEnter @returns {boolean}
		 * @param {Function} canLeave @returns {boolean}
		 * @param {Function} model @returns {string}
		 * @param {Function} routes @return {Array}
		 */
		const base = {
			actions: () => {},
			init: () => {},
			canEnter: () => true,
			canLeave: () => true,
			model: () => key,
			routes: () => []
		};
		
		/**
		 * Page Model is a Factory function for page instances.
		 * @name factory
		 * @memberof pages
		 * @method
		 * @param {Object} pageData PageObject
		 * @returns page
		 * @private
		 */
		const factory = function (pageData) {
			let modelRef;
			let isInited = false;
			
			if (typeof model === 'object') {
				modelRef = model;
			} else if (typeof model === 'function') {
				modelRef = model.call(this, key, pageData, override);
				if (typeof modelRef !== 'object') {
					App.log({
						args: [
							'The exported page model function must return an object, ' +
							'`%s` given (%s)', typeof modelRef, modelRef
						],
						fx: 'error'
					});
					return null;
				}
			} else {
				App.log({
					args: [
						'The exported page model must be an object or a function, ' +
						'`%s` given (%s)', typeof model, model
					],
					fx: 'error'
				});
				return null;
			}

			const getKey = (querySelector = false) => {
				if (!!querySelector) {
					return '[data-page-url="' + pageData.key + '"]';
				}
				return pageData.key;
			};

			// insure this can't be overridden
			const overwrites = Object.freeze({
				key: getKey,
				enter: (next) => {
					const p = document.querySelector(getKey(true));
					p.style.opacity = 1;
					p.style.display = 'block';
					App.callback(next);
				},
				leave: (next) => {
					const p = document.querySelector(getKey(true));
					p.style.opacity = 0;
					p.style.display = 'none';
					App.callback(next);
				},
				data: () => pageData,
				isInited: () => {
					return isInited;
				},
				setInited: () => {
					isInited = true;
				}
			});

			// New deep copy frozen object
			return Object.freeze(Object.assign({}, base, modelRef, overwrites));
		};
		
		return factory;
	};
	
	/**
	 * Creates a page with the specified model.
	 * @name createPage
	 * @memberof pages
	 * @method
	 * @param {Object} pageData An data bag for your page
	 * @param {String} keyModel The page model's unique key
	 * @param {Boolean} [override=false] Allows overriding an existing page instance
	 * @returns {?page} Null if something goes wrong
	 * @private
	 */
	const createPage = function (pageData, keyModel, override) {
		//Find the page model associated
		const pageModel = pageModels[keyModel];
		let pageInst;
		
		if (!pageModel) {
			App.log({args: ['Model `%s` not found', keyModel], fx: 'error'});
		} else {
			//Check to not override an existing page
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

	/**
	 * Registers a pageModel instance.
	 * @name registerPageModel
	 * @memberof pages
	 * @method
	 * @param {String} key The model unique key
	 * @param {pageModel} pageModel The page model
	 * @param {Boolean} [override=false] Allows overriding an existing page instance
	 *
	 * @returns {pageModel}
	 * @private
	 */
	const registerPageModel = function (key, pageModel, override) {
		const keyType = typeof key;
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
			pageModels[key] = Object.freeze(pageModel);
			return pageModel;
		}
		return false;
	};
	
	/**
	 * Create a new pageModel, i.e. a function to create a new pages.
	 * It first calls {@link createPageModel} and then calls {@link registerPageModel}
	 * with the output of the first call.
	 * @name exportPage
	 * @memberof pages
	 * @method
	 * @param {String} key The model unique key
	 * @param {pageParam|pageCreator} model A page object that conforms with the pageParam type
	 *   or a pageCreator function that returns a page object.
	 * @param {Boolean} [override=false] Allows overriding an existing page instance
	 *
	 * @return {pageModel}
	 * @private
	 */
	const exportPage = function (key, model, override) {
		// Pass all args to the factory
		const pageModel = createPageModel(key, model, override);
		// Only work with pageModel afterwards
		return registerPageModel(key, pageModel, override);
	};
	
	const routeMatchStrategies = {
		regexp: function (testRoute, route, cb) {
			if (testRoute.test(route)) {
				return cb();
			}
			return true;
		},
		string: function (testRoute, route, cb) {
			let regex;
			// be sure to escape uri
			route = decodeURIComponent(route);
			
			// be sure we do not have hashed in the route
			route = route.split('#')[0];
			
			// avoid RegExp if possible
			if (testRoute === route) {
				return cb();
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
				return cb();
			}
			return true;
		}
	};
	
	/**
	 * Tries to match the given route against the given
	 * array of possible routes.
	 * @name matchRoute
	 * @memberof pages
	 * @method
	 * @param {String} route The route to search match for
	 * @param {String[]|RegExp[]} routes The allowed routes
	 *
	 * @returns {Integer} The index of the matched route or -1 if no match
	 * @private
	 */
	const matchRoute = function (route, routes) {
		let index = -1;
		const found = function (i) {
			index = i;
			return false; // exit every
		};
		
		if (typeof route !== 'string') {
			App.log({args: '`route` must be a string', fx: 'error'});
			return index;
		}
		
		if (!!~route.indexOf('?')) {
			route = route.split('?')[0];
		}
		
		if (!!route && !!routes) {
			if (!Array.isArray(routes)) {
				routes = Object.values(routes);
			}
			routes.every(function matchOneRoute (testRoute, i) {
				const routeType = typeof testRoute;
				const routeStrategy = routeMatchStrategies[routeType];
				const cb = function () {
					return found(i);
				};
				
				if (typeof routeStrategy === 'function') {
					return routeStrategy(testRoute, route, cb);
				} else if (testRoute === route) {
					return cb();
				}
				return true;
			});
		}
		
		return index;
	};

	/**
	 * Returns the first page object that matches the route param
	 * @name getPageForHref
	 * @memberof pages
	 * @method
	 * @param {String} href The href to search match for
	 *
	 * @returns {page} The page object or a new page with associated model
	 * @private
	 */
	const getPageForHref = function (href) {

		// check if the instance already exists
		if (!!pageInstances[href]) {
			return pageInstances[href];
		}

		// match with potential model
		let model = Object.values(pageInstances).find((page) => {
			const routes = page.routes();
			// route found ?
			return !!~matchRoute(href, routes);
		});

		if (!model) {
			model = 'default';
		}

		// create instance with matched model
		return createPage({key: href}, model, true);
	};

	const loaded = (url) => {
		return !!document.querySelector(App.root()).querySelector('[data-page-url="' + url + '"]');
	};

	registerPageModel('default', createPageModel('default', {}, true), {});

	/** Public Interfaces **/
	global.App = Object.assign({}, global.App, {
		pages: {
			/**
			 * @name matchRoute
			 * @method
			 * @memberof pages
			 * {@link App.pages~matchRoute}
			 * @private
			 */
			matchRoute: matchRoute,

			/**
			 * Getter for all instances of a particular one
			 * @param [key] - the optinal key to search for.
			 *   If falsy, will return all instances
			 * @returns {page|page[]}
			 * @private
			 */
			instances: function (key) {
				if (!!key) {
					return pageInstances[key];
				}
				return pageInstances;
			},

			/**
			 * Returns all models
			 * @method
			 * @name models
			 * @memberof pages
			 * @returns {Object}
			 * @public
			 */
			models: function () {
				return pageModels;
			},

			/**
			 * Returns the first page object that matches the route param
			 * @name getPageForHref
			 * @memberof pages
			 * @method
			 * @param {String} route The route to search match for
			 *
			 * @returns {?page} The page object or null if not found
			 * @public
			 */
			getPageForHref: getPageForHref,

			/**
			 * Returns the page based the key and fallbacks to
			 * the [route]{@link getPageForHref} if noting is found.
			 * @name page
			 * @method
			 * @memberof pages
			 * @param {string} keyOrRoute - the key or the route of the page
			 * @returns {page}
			 * @public
			 */
			page: function (keyOrRoute) {
				//Try to get the page by the key
				let result = pageInstances[keyOrRoute];

				//if no result found try with the route
				if (!!!result) {
					result = getPageForHref(keyOrRoute);
				}
				
				return result;
			},

			/**
			 * Creates a page with the specified model.
			 * @name create
			 * @memberof pages
			 * @method
			 * @param {Object} pageData An data bag for your page
			 * @param {String} keyModel The page model's unique key
			 * @param {Boolean} [override=false] Allows overriding an existing page instance
			 * @returns {?page} Null if something goes wrong
			 * @public
			 */
			create: createPage,

			/**
			 * Create a new pageModel, i.e. a function to create a new pages.
			 * It first calls {@link createPageModel} and then calls {@link registerPageModel}
			 * with the output of the first call.
			 * @name exports
			 * @memberof pages
			 * @method
			 * @param {String} key The model unique key
			 * @param {pageParam|pageCreator} model A page object that conforms
			 *   with the pageParam type or a pageCreator function that returns a page object.
			 * @param {pageParam|pageCreator} model A page object that conforms with the
			 *   pageParam type or a pageCreator function that returns a page object.
			 * @param {Boolean} [override=false] Allows overriding an existing page instance
			 *
			 * @return {pageModel}
			 * @public
			 */
			exports: exportPage,

			/**
			 * Check if the page is loaded from a given url
			 * @name exports
			 * @memberof pages
			 * @method
			 * @param {String} url the url to check
			 * @return {Boolean}
			 * @public
			 * @since 3.0.0
			 */
			loaded: loaded
		}
	});
	
})(window);
