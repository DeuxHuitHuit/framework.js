/**
 * @author Deux Huit Huit
 * 
 * Assets loader
 */
;(function ($, undefined) {
	
	"use strict";
	
	var
	
	assets = [], // FIFO
	
	loadIsWorking = false,
	
	currentUrl = null,
	
	isLoading = function (url) {
		return !!currentUrl && currentUrl === url;
	},
	
	inQueue = function (url) {
		var isIn = false;
		$.each(assets, function _eachAsset () {
			if (this.url == url) {
				isIn = true;
				return false;
			}
			return true;
		});
		return isIn;
	},
	
	_recursiveLoad = function () {
		if (!!assets.length) {
			// start next one
			_loadOneAsset();
		} else {
			// work is done
			loadIsWorking = false;
		}
	},
	
	_loadOneAsset = function () {
		var 
		asset = assets.shift(), // grab first item
		param = $.extend({}, asset, {
			success: function () {
				// clear pointer
				currentUrl = null;
				
				// register next
				_recursiveLoad();
				
				// callback
				App.callback.call(this, asset.success, arguments);
			},
			error: function () {
				// clear pointer
				currentUrl = null;
				
				App.log({args:['Error loading url %s', asset.url], me:'Loader'});
				
				// if no vip access is granted
				if (!asset.vip) { 
					// decrease priority
					// this avoids looping for a unload-able asset
					asset.priority += ++asset.retries; // out of bounds checking is done later
				}
				
				// @todo: check for the error code
				// and do something smart with it
				// 404 will sometimes wait for timeout, so it's better to skip it fast
				
				// if we already re-tried  less than x times
				if (asset.retries <= asset.maxRetries) {
					// push it back into the queue and retry
					loadAsset(asset);
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
	},
	
	loadAsset = function (url, priority) {
		if (!url) {
			App.log({args:'No url given', me:'Loader'});
			return this;
		}
		
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
		
		// ensure that asset is not current
		if (isLoading(url.url)) {
			App.log({args:['Url %s is already loading', url.url], me:'Loader'});
			return this;
		}
		
		var urlIsInQueue = inQueue(url.url);
		
		// ensure that asset is not in the queue
		if (!urlIsInQueue) {
			// insert in array
			assets.splice(url.priority, 1, url);
			App.log({args:['Url %s has been insert at %s', url.url, url.priority], me:'Loader'});
			
		} else {
			// promote if new priority is different
			var oldAsset = assets[index];
			if (oldAsset.priority != url.priority) {
				// remove
				assets.splice(index, 1);
				// add
				assets.splice(url.priority, 1, url);
			}
			App.log({args:['Url %s was shifted from %s to %s', url.url, oldAsset.priority, url.priority], me:'Loader'});
		}
		
		// start now if nothing is loading
		if (!loadIsWorking) {
			loadIsWorking = true;
			_loadOneAsset();
			App.log({args:'Load worker has been started', me:'Loader'});
		}
		
		return this;
	};
	
	window.Loader = $.extend(window.Loader, {
		load: loadAsset,
		isLoading: isLoading,
		inQueue: inQueue,
		working: function () {
			return loadIsWorking;
		}
	});
	
})(jQuery);
