# framework.js

#### Version 1.2

Deux Huit Huit javascript framework allowing to load and change page with ajax request with simplicity.

The framework use jQuery and extends some functionality.

Global.js :

Add some flag value on the jquery object to detect the browser used

$.unsupported : true if it's MSIE less than version 9

$.iphone : true for userAgent containing 'iPhone' or 'iPod'

$.ios : true when iPhone is true or userAgent contain 'iPad'

$.mobile : true when ios is true or userAgent contain 'Android','mobile' or 'phone'


**Loader:**

	* load(url, priority)
	* isLoading(url)
	* inQueue(url)
	* working()
	
**App:**

	* _callAction()
	* root()
	* callback(fx,args)
	* debug(value)
	* run()
	* log()
	* logs()
	* mediator:
	
		* notify(key,data,e)
		* notifyCurrentPage(key,data,e)
		* goto()
		* toggle()
		
	* pages: 
	
		* _matchRoute(route,routes)
		* _validateRoute()
		* instances()
		* getPageForRoute(route)
		* page(keyOrRoute)
		* create(page)
		* export(key,page)
		* notify(key,data,e)
		
	* modules:
	
		* models()
		* create(module)
		* export(key,module)
		* notify(key,data,e)
		
	* components:
	
		* models()
		* create()
		* exports()
		