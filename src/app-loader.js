/**
 *  Assets loader: Basically a wrap around $.ajax in order
 *  to priorize and serialize resource loading.
 *
 * @fileoverview Assets Loader, wrap around $.ajax
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 * @namespace loader
 * @memberof App
 * @requires App
 */
((global, undefined) => {
	'use strict';

	let isLoading = false;

	const defaultFetchOptions = () => {
		return {
			method: 'GET',
			mode: 'cors',
			redirect: 'follow'
		};
	};

	/**
	 * Simple wrapper around the fetch api for ajax requests
	 * @param {Object} options all the parameters to config the fetch request
	 * @returns {Promise}
	 */
	const load = (url, options = {}) => {
		if (!url) {
			url = window.location.origin + '/';
		}

		options = Object.assign({}, defaultFetchOptions(), options);

		return window.fetch(url, options);
	};

	global.App = Object.assign({}, global.App, {
		loader: {
			/**
			 * Put the request in the queue and trigger the load
			 * @name load
			 * @method
			 * @memberof loader
			 * @public
			 * @param {Object} url Url Object
			 * @param {Integer} priority
			 * @this App
			 * @returns this
			 */
			load: load,

			/**
			 * Check if the loader is busy
			 * @name isLoading
			 * @method
			 * @memberof loader
			 * @param {Object} url Url object to check
			 * @returns {Boolean}
			 * @public
			 */
			isLoading: () => isLoading,
		}
	});
	
})(window);
