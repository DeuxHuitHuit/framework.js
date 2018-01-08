/**
 *  Assets loader: Basically a wrap around $.ajax in order
 *  to priorize and serialize resource loading.
 * 
 * @author Deux Huit Huit <http://deuxhuithuit.com>
 * @license MIT <http://deuxhuithuit.mit-license.org>
 *
 */
(function ($, global, undefined) {
	
	'use strict';

	// Forked: https://gist.github.com/nitriques/6583457
	(function addXhrProgressEvent () {
		var originalXhr = $.ajaxSettings.xhr;
		$.ajaxSetup({
			progress: $.noop,
			upload: $.noop,
			xhr: function () {
				var self = this;
				var req = originalXhr();
				if (req) {
					if ($.isFunction(req.addEventListener)) {
						req.addEventListener('progress', function (e) {
							self.progress($.Event(e)); // make sure it's jQuery-ize
						}, false);
					}
					if (!!req.upload && $.isFunction(req.upload.addEventListener)) {
						req.upload.addEventListener('progress', function (e) {
							self.upload($.Event(e)); // make sure it's jQuery-ize
						}, false);
					}
				}
				return req;
			}
		});
	})();
	
	var assets = []; // FIFO
	
	var loaderIsWorking = false;
	
	var currentUrl = null;
	
	var isLoading = function (url) {
		if (!$.isPlainObject(url)) {
			url = {url: url};
		}
		if (!!url.method && url.method !== 'GET') {
			return false;
		}
		return !!currentUrl && currentUrl === url.url;
	};
	
	var inQueue = function (url) {
		var foundIndex = -1;
		$.each(assets, function eachAsset (index, asset) {
			if (asset.url === url) {
				foundIndex = index;
				return false; // early exit
			}
			return true;
		});
		return foundIndex;
	};
	
	var getStorageEngine = function (url) {
		if (url.cache === true) {
			url.cache = 'session';
		}
		return global.AppStorage && global.AppStorage[url.cache];
	};
	
	// This breaks the call dependency cycle
	var recursiveLoad = $.noop;
	var loadAsset = $.noop;
	
	var defaultParameters = function (asset) {
		return {
			progress: function () {
				// callback
				App.callback.call(this, asset.progress, arguments);
			},
			success: function (data) {
				// clear pointer
				currentUrl = null;
				
				// register next
				recursiveLoad();
				
				// callback
				App.callback.call(this, asset.success, arguments);
				
				// store in cache
				if (!!asset.cache) {
					var storage = getStorageEngine(asset);
					if (!!storage) {
						storage.set(asset.url, data);
					}
				}
			},
			error: function () {
				var maxRetriesFactor = !!asset.vip ? 2 : 1;
				
				// clear pointer
				currentUrl = null;
				
				App.log({args: ['Error loading url %s', asset.url], me: 'Loader'});
				
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
				} else {
					// we give up!
					App.callback.call(this, asset.giveup, arguments);
				}
				
				// next
				recursiveLoad();
				
				// callback
				App.callback.call(this, asset.error, arguments);
			}
		};
	};
	
	var loadOneAsset = function () {
		// grab first item
		var asset = assets.shift();
		// extend it
		var param = $.extend({}, asset, defaultParameters(asset));
		// actual loading
		$.ajax(param);
		// set the pointer
		currentUrl = param.url;
	};
	
	recursiveLoad = function () {
		if (!!assets.length) {
			// start next one
			loadOneAsset();
		} else {
			// work is done
			loaderIsWorking = false;
		}
	};
	
	var validateUrlArgs = function (url, priority) {
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
		
		return url;
	};
	
	var launchLoad = function () {
		// start now if nothing is loading
		if (!loaderIsWorking) {
			loaderIsWorking = true;
			loadOneAsset();
			App.log({args: 'Load worker has been started', me: 'Loader'});
		}
	};
	
	var getValueFromCache = function (url) {
		var storage = getStorageEngine(url);
		if (!!storage) {
			var item = storage.get(url.url);
			if (!!item) {
				// if the cache-hit is valid
				if (App.callback.call(this, url.cachehit, item) !== false) {
					// return the cache
					App.callback.call(this, url.success, item);
					return true;
				}
			}
		}
		return false;
	};
	
	var updatePrioriy = function (url, index) {
		// promote if new priority is different
		var oldAsset = assets[index];
		if (oldAsset.priority != url.priority) {
			// remove
			assets.splice(index, 1);
			// add
			assets.splice(url.priority, 1, url);
		}
		App.log({
			args: [
				'Url %s was shifted from %s to %s',
				url.url,
				oldAsset.priority, url.priority
			],
			me: 'Loader'
		});
	};
	
	loadAsset = function (url, priority) {
		if (!url) {
			App.log({args: 'No url given', me: 'Loader'});
			return this;
		}
		
		url = validateUrlArgs(url, priority);
		
		// ensure that asset is not current
		if (isLoading(url)) {
			App.log({args: ['Url %s is already loading', url.url], me: 'Loader'});
			return this;
		}
		
		// check cache
		if (!!url.cache) {
			if (getValueFromCache(url)) {
				return this;
			}
		}
		
		var index = inQueue(url.url);
		
		// ensure that asset is not in the queue
		if (!~index) {
			// insert in array
			assets.splice(url.priority, 1, url);
			App.log({args: ['Url %s has been insert at %s', url.url, url.priority], me: 'Loader'});
			
		} else {
			updatePrioriy(url, index);
		}
		
		launchLoad();
		
		return this;
	};
	
	global.Loader = $.extend(global.Loader, {
		load: loadAsset,
		isLoading: isLoading,
		inQueue: inQueue,
		working: function () {
			return loaderIsWorking;
		}
	});
	
})(jQuery, window);
