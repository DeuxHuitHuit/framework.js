# Deux Huit Huit's framework.js

#### Version 1.3

Deux Huit Huit javascript framework allowing to load and change page with ajax request with simplicity.

The framework use jQuery and extends some functionality.

## API

**Global**

Adds some flag value on the jquery object to detect the browser used

	* $.unsupported: true if it's MSIE less than version 9
	* $.iphone: true for userAgent containing 'iPhone' or 'iPod'
	* $.ios: true when iPhone is true or userAgent contain 'iPad'
	* $.mobile: true when ios is true or userAgent contain 'Android','mobile' or 'phone'

**Loader:**

	* load(url, priority)
	* isLoading(url)
	* inQueue(url)
	* working()
	
	
**App:**

	* _callAction()
	* root()
	* callback(fx, args)
	* debug(value)
	* run()
	* log()
	* logs()
	* mediator:
	
		* notify(key, data, cb(key, res))
		* notifyCurrentPage(key, data, cb(key, res))
		* goto()
		* toggle()
		
	* pages: 
	
		* _matchRoute(route, routes)
		* _validateRoute()
		* models()
		* instances()
		* getPageForRoute(route)
		* page(keyOrRoute)
		* create(page)
		* export(key, page)
		* notify(key, data, cb(key, res))
		
	* modules:
	
		* models()
		* create(module)
		* export(key, module)
		* notify(key, data, cb(key, res))
		
	* components:
	
		* models()
		* instances()
		* create()
		* exports()
		
		
## History

* **1.3**

	* Added callback support for actions functions.
	* Removed the `e` parameter on notifies.
	* Added the `cb` parameter on notifies.
	* Refactored the syntax a bit with new jshint rules.
	* Route matching will remove the query string from the match.
	
* **1.2**: Added support for components
* **1.1**: Patch update
* **1.0**: Initial release

# Copyrights and license

(c) 2013-2014 Deux Huit Huit: <http://deuxhuithu.it>, <http://deuxhuithuit.github.io>    
<http://deuxhuithuit.mit-license.org>
