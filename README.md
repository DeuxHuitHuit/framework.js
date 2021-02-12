# Deux Huit Huit's framework.js

> Deux Huit Huit javascript framework allowing to load and change page with ajax request with simplicity.

## History

* **3.0.x**
	* Removed the necessity to initiate a page at startup
	* Page models have an instance per URL
	* Removed all dependencies

* **2.2.x**
	* (fix) Remove this from forEach loop (978c748f29343dbddf39dcd6180e31df816aa9f4)
	* (fix) Declare setters since the objects are now frozen (#152 +58326f816cd3a96723d19bde8508b79393e25724)
	* (feat) Added new edge to user agents (#144)
	* (fix) Properly handle errors in storage (50bf73e9d65fb3e48692da0e84d6a2d02b30a272)

* **2.1.x**
	* Remove all $.each calls (#70)
	* Freeze public objects (#77)
* **2.0.x**
	* Integrated AppStorage to App.storage
	* File structure modifications
	* Removed old deprecated globals and jQuery overrides
	* Removed globals-keyboard.js
	* Added App.fx
	* Added App.actions (refactored common code)
	* Added support for batch read and writes in notifies
	* Removed support for node 6
	* Added more tests
	* Updated QUnit to 2.9.2
* **1.8.x**
	* Documented the source code
	* Added jsdoc
	* Added doc task to the build
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
