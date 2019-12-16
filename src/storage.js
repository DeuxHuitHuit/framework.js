/**
 * Facade to access the browser's localStorage and sessionStorage
 *
 * The facade wraps unsafe calls to catch errors and return empty but valid values.
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 *
 * @namespace Storage
 * @requires App
 */
(function ($, global, undefined) {
	'use strict';

	var storage = function (storage) {
		return {

			/**
			 * Return the value associated with the given key
			 * @name get
			 * @memberof Storage
			 * @method
			 * @param {string} key Access key to the storage object
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
			 * @name set
			 * @memberof Storage
			 * @method
			 * @param {string} key Access key to the storage object
			 * @param {*} value Value wanted to be saved
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
			 * @name remove
			 * @memberof Storage
			 * @method
			 * @param {string} key Access key to the storage object
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
			 * @name clear
			 * @memberof Storage
			 * @method
			 * @param {RegExp} regexp Regular Expression to match the key
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

	var safeLocalStorage = function () {
		try {
			return storage(window.localStorage);
		} catch (e) {
			App.log({
				args: e.message,
				me: 'Storage',
				fx: 'error'
			});
		}
		return storage({});
	};

	var safeSessionStorage = function () {
		try {
			return storage(window.sessionStorage);
		} catch (e) {
			App.log({
				args: e.message,
				me: 'Storage',
				fx: 'error'
			});
		}
		return storage({});
	};

	/** @deprecated */
	global.AppStorage = $.extend(global.AppStorage, {
		factory: storage,
		local: safeLocalStorage(),
		session: safeSessionStorage()
	});
	
	/** @deprecated */
	global.Storage = $.extend(global.Storage, global.AppStorage);
	
})(jQuery, window);
