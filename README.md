# Deux Huit Huit's framework.js

[![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/) [![Build Status](https://travis-ci.org/DeuxHuitHuit/framework.js.svg)](https://travis-ci.org/DeuxHuitHuit/framework.js) [Build Status](https://ci.appveyor.com/api/projects/status/t8sadjjdpbyl48dj?svg=true) [![David DM](https://david-dm.org/DeuxHuitHuit/framework.js/dev-status.svg?style=flat)](https://david-dm.org/DeuxHuitHuit/framework.js#info=devDependencies) [![Greenkeeper badge](https://badges.greenkeeper.io/DeuxHuitHuit/framework.js.svg)](https://greenkeeper.io/)

> Deux Huit Huit javascript framework allowing to load and change page with ajax request with simplicity.

The framework use jQuery and Underscore.js and extends some functionality.

## Documentation

* [Current Version](https://deuxhuithuit.github.io/framework.js/framework/2.0.0/)
* [1.8.0](https://deuxhuithuit.github.io/framework.js/framework/1.8.0/)

## Dependencies

* https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js
* https://cdnjs.cloudflare.com/ajax/libs/jquery-easing/1.3/jquery.easing.min.js
* https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js
* https://code.jquery.com/pep/0.4.1/pep.min.js (optional)

## History

* **2.0.x**
	* Integrated AppStorage to App.storage
	* File structure modifications
	* Removed old deprecated globals and jQuery overrides
	* Removed globals-keyboard.js
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

### LICENSE

[MIT](http://deuxhuithuit.mit-license.org)    
Made with love in Montréal by [Deux Huit Huit](https://deuxhuithuit.com)    
Copyrights (c) 2013-2018
