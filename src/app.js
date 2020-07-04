/**
 * Superlight App Framework
 *
 * @fileoverview Defines the App
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 *
 * @requires jQuery
 * @namespace App
 */
(function ($, global, undefined) {
	'use strict';
	
	//Default value
	var ROOT = 'body';
	
	/**
	 * Init All the applications
	 * Assign root variable
	 * Call init on all registered page and modules
	 * @name initApplication
	 * @memberof App
	 * @method
	 * @fires App#app:init
	 * @fires App#app:pageNotFound
	 * @param {String} root CSS selector
	 * @private
	 */
	var initApplication = function (root) {
		// assure root node
		if (!!root && !!$(root).length) {
			ROOT = root;
		}
		
		// init each Modules
		Object.values(App.modules.models()).forEach(function initModule (m) {
			m.init();
		});
		
		// init each Page already loaded
		Object.values(App.pages.instances()).forEach(function initPage (page) {
			if (!!page.loaded()) {
				// init page
				page.init({firstTime: true});
				page.setInited();
				// set mediator state
				App.mediator.init(page);
			}
		});
		
		App.mediator.notify('app.init', {
			page: App.mediator.getCurrentPage()
		});
		
		if (!App.mediator.getCurrentPage()) {
			App.modules.notify('app.pageNotFound');
			App.log({ fx: 'info', args: 'No current page set, pages disabled.' });
		}
	};
	
	/**
	 * Init the app with the given css selector
	 * @name run
	 * @memberof App
	 * @method
	 * @param {String} root CSS selector
	 * @private
	 */
	var run = function (root) {
		initApplication(root);
		return global.App;
	};
	
	/** Public Interfaces **/
	global.App = $.extend(true, global.App, {
		/**
		 * Get the root css selector
		 * @name root
		 * @method
		 * @memberof App
		 * @returns {String} Root CSS selector
		 * @public
		 */
		root: function () {
			return ROOT;
		},
		
		/**
		 * Init the app with the given css selector
		 * @name run
		 * @memberof App
		 * @method
		 * @param {Object} App
		 * @public
		 */
		run: run
	});
	
})(jQuery, window);
