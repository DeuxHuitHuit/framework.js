/**
 * @author Deux Huit Huit
 * 
 * Assets loader: Basically a wrap around $.ajax in order
 *   to priorize and serialize resource loading.
 */
(function ($, global, undefined) {
	
	'use strict';

	// Forked: https://gist.github.com/nitriques/6583457
	(function addXhrProgressEvent() {
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
		return !!currentUrl && currentUrl === url;
	};
	
	var inQueue = function (url) {
		var foundIndex = -1;
		$.each(assets, function _eachAsset(index, asset) {
			if (asset.url === url) {
				foundIndex = index;
				return false; // early exit
			}
			return true;
		});
		return foundIndex;
	};
	
	var _recursiveLoad = function () {
		if (!!assets.length) {
			// start next one
			_loadOneAsset();
		} else {
			// work is done
			loaderIsWorking = false;
		}
	};
	
	var _loadOneAsset = function () {
		 // grab first item
		var asset = assets.shift();
		var param = $.extend({}, asset, {
			progress: function () {
				// callback
				App.callback.call(this, asset.progress, arguments);
			},
			success: function () {
				// clear pointer
				currentUrl = null;
				
				// register next
				_recursiveLoad();
				
				// callback
				App.callback.call(this, asset.success, arguments);
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
				_recursiveLoad();
				
				// callback
				App.callback.call(this, asset.error, arguments);
			}
		});
		
		// actual loading
		$.ajax(param);
		// set the pointer
		currentUrl = param.url;
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
	};
	
	var loadAsset = function (url, priority) {
		if (!url) {
			App.log({args: 'No url given', me: 'Loader'});
			return this;
		}
		
		validateUrlArgs(url, priority);
		
		// ensure that asset is not current
		if (isLoading(url.url)) {
			App.log({args: ['Url %s is already loading', url.url], me: 'Loader'});
			return this;
		}
		
		var index = inQueue(url.url);
		
		// ensure that asset is not in the queue
		if (!~index) {
			// insert in array
			assets.splice(url.priority, 1, url);
			App.log({args: ['Url %s has been insert at %s', url.url, url.priority], me: 'Loader'});
			
		} else {
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
		}
		
		launchLoad();
		
		return this;
	};
	
	var launchLoad = function () {
		// start now if nothing is loading
		if (!loaderIsWorking) {
			loaderIsWorking = true;
			_loadOneAsset();
			App.log({args: 'Load worker has been started', me: 'Loader'});
		}
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
