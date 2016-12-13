# Deux Huit Huit's framework.js [![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/) [![David DM](https://david-dm.org/DeuxHuitHuit/framework.js/dev-status.svg?style=flat)](https://david-dm.org/DeuxHuitHuit/framework.js#info=devDependencies)

#### Version 1.6.x

> Deux Huit Huit javascript framework allowing to load and change page with ajax request with simplicity.

The framework use jQuery and Underscore.js and extends some functionality.

## Dependencies

* https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js
* https://cdnjs.cloudflare.com/ajax/libs/jquery-easing/1.3/jquery.easing.min.js
* https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js
* https://code.jquery.com/pep/0.4.1/pep.min.js (optional)

## API

**Loader**

* `load(url, priority)`
* `isLoading(url)`
* `inQueue(url)`
* `working()`
	
	
**App**

* `_callAction()`
* `root()`
* `callback(fx, args)`
* `debug(value)`
* `run()`
* `log()`
* `logs()`
* `mediator:`

	* `notify(key, data, cb(key, res))`
	* `notifyCurrentPage(key, data, cb(key, res))`
	* `goto()`
	* `toggle()`
	
* `pages`

	* `_matchRoute(route, routes)`
	* `_validateRoute()`
	* `models()`
	* `instances()`
	* `getPageForRoute(route)`
	* `page(keyOrRoute)`
	* `create(page)`
	* `export(key, page)`
	* `notify(key, data, cb(key, res))`
	
* `modules`

	* `models()`
	* `create(module)`
	* `export(key, module)`
	* `notify(key, data, cb(key, res))`
	
* `components`

	* `models()`
	* `instances()`
	* `create()`
	* `exports()`

* `device`

	* `iphone` true for userAgent containing 'iPhone' or 'iPod'
	* `ipad` true for userAgent containing 'iPad'
	* `ios` true when iPhone is true or userAgent contain 'iPad'
	* `mobile` true when ios is true or android is true or userAgent contain 'mobile' or 'phone'
	* `android` true for userAgent containing Android'
	* `phone` true when userAgent contain 'mobile' or 'phone'
	* `tablet` true when mobile but not a phone

## History

* **1.5.x**
	* Added jscs to the build
	* Introduce App.device and App.routing
	* Remove the 300ms delay hack and use pointer events instead (see touch-action="none")
* **1.4.x**
	* Handle server redirects
	* Allow non-GET requests to be queued
* **1.3.x**
	* Ability to preload pages
	* Added QueryStringParser.stringify
	* Added callback support for actions functions.
	* Removed the `e` parameter on notifies.
	* Added the `cb` parameter on notifies.
	* Refactored the syntax a bit with new jshint rules.
	* Route matching will remove the query string from the match.
* **1.2**: Added support for components
* **1.1**: Patch update
* **1.0**: Initial release

### LICENSE

[MIT](http://deuxhuithuit.mit-license.org)    
Made with love in Montréal by [Deux Huit Huit](https://deuxhuithuit.com)    
Copyrights (c) 2013-2016
