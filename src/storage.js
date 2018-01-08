/**
 * Facade to access the browser's localstorage and session storage
 *
 * @fileoverview 
 *
 * @author Deux Huit Huit <http://deuxhuithuit.com>
 * @license MIT <http://deuxhuithuit.mit-license.org>
 *
 * @module Storage
 * @requires App
 */
(function ($, global, undefined) {
	'use strict';

	var storage = function (storage) {
		return {

			/**
			 * Return the value associated with the given key
			 * 
			 * @param {string} key
			 * @return {String}
			 */
			get: function (key) {
				if (!key) {
					return;
				}
				key += ''; // make it a string
				return storage[key];
			},

			/**
			 * Set and save a value to the given key in the storage
			 * 
			 * @param {string} key
			 * @param {*} value
			 * @return {Boolean}
			 */
			set: function (key, value) {
				var result = false;
				if (!!key) {
					key += ''; // make it a string
					try {
						storage[key] = !value ? '' : value + '';
						result = true;
					} catch (e) {
						App.log({
							args: e.message,
							me: 'Storage',
							fx: 'error'
						});
						result = false;
					}
				}
				return result;
			},

			/**
			 * Delete the storage data associated with the given key
			 * 
			 * @param {string} key
			 * @return {Boolean}
			 */
			remove: function (key) {
				var result = false;
				if (!!key) {
					key += ''; // make it a string
					try {
						storage.removeItem(key);
						result = true;
					} catch (e) {
						App.log({
							args: e.message,
							me: 'Storage',
							fx: 'error'
						});
						result = false;
					}
				}
				return result;
			},

			/**
			 * Delete the data from the storage matching 
			 * the Regular Expression or all the data if none is provided
			 * 
			 * @param {RegExp} regexp
			 * @return {Boolean}
			 */
			clear: function (regexp) {
				var result = false;
				try {
					if (!regexp) {
						storage.clear();
					} else {
						var remove = [];
						for (var i = 0; i < storage.length; i++) {
							var key = storage.key(i);
							if (regexp.test(key)) {
								remove.push(key);
							}
						}
						for (i = 0; i < remove.length; i++) {
							storage.removeItem(remove[i]);
						}
					}
					result = true;
				} catch (e) {
					App.log({
						args: e.message,
						me: 'Storage',
						fx: 'error'
					});
					result = false;
				}
				return result;
			}
		};
	};

	global.AppStorage = $.extend(global.AppStorage, {
		factory: storage,
		local: storage(window.localStorage),
		session: storage(window.sessionStorage)
	});
	
	// @deprecated
	global.Storage = $.extend(global.Storage, global.AppStorage);
	
})(jQuery, window);
