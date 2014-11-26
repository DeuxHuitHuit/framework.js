/**
 * @author Deux Huit Huit
 * 
 * Storage: A safe wrapper around window.localStorage/sessionStorage
 */
(function ($, global, undefined) {
	'use strict';
	
	var storage = function (storage) {
		return {
			get: function (key) {
				if (!key) {
					return;
				}
				key += ''; // make it a string
				return storage[key];
			},
			set: function (key, value) {
				var result = false;
				if (!!key) {
					key += ''; // make it a string
					try {
						storage[key] = value + '';
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
			}
		};
	};
	
	global.Storage = $.extend(global.Storage, {
		facotry: storage,
		local: storage(window.localStorage),
		session: storage(window.sessionStorage)
	});
	
})(jQuery, window);