/*! framework.js - v3.0.2 - 909234d - build 243 - 2021-04-23
 * https://github.com/DeuxHuitHuit/framework.js
 * Copyright (c) 2021 Deux Huit Huit (https://deuxhuithuit.com/);
 * MIT *//**
 * Actions
 *
 * @fileoverview Defines the App Actions
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 *
 * @namespace App.actions
 */
(function (global, undefined) {
	'use strict';
	const keys = {};
	let innerCall = false;
	let stack = [];

	/**
	 * Find the methods that matches with the notify key
	 * @name resolve
	 * @memberof App.actions
	 * @method
	 * @param {Function|Object} actions Object of methods that can be matches with the key's value
	 * @param {String} key Action key
	 * @returns {Function} The function corresponding to the key, if it exists in actions object
	 * @private
	 */
	const resolve = function (actions, key) {
		if (typeof actions === 'function') {
			actions = actions();
		}
		if (!!actions) {
			// Try the whole key
			let tempFx = actions[key];
			// If not, try JSONPath style...
			if (typeof tempFx !== 'function') {
				const paths = keys[key] || key.split('.');
				if (paths.length < 2) {
					return;
				}
				keys[key] = paths;
				tempFx = actions;
				paths.every(function eachPath (p) {
					tempFx = tempFx[p];
					if (typeof tempFx !== 'object') {
						return false; // exit
					}
					return true;
				});
			}
			if (typeof tempFx === 'function') {
				return tempFx;
			}
		}
	};

	/**
	 * Executes all read and write operations present in the actions array.
	 * @name execute
	 * @memberof App.actions
	 * @method
	 * @param {Array} actions Array of read/write objects
	 * @param {String} key Action key
	 * @param {Object} data Bag of data
	 * @returns {undefined}
	 * @private
	 */
	const execute = function (actions, key, data, cb) {
		let sp = 0;
		let outerCall = false;
		const read = function (f) {
			if (typeof f.read === 'function') {
				f.read(key, data);
			}
		};
		const write = function (f) {
			f.write(key, data);
		};
		if (!innerCall) {
			innerCall = true;
			outerCall = true;
		}
		if (!Array.isArray(actions)) {
			actions = [actions];
		}
		if (typeof data === 'function' && !cb) {
			cb = data;
			data = undefined;
		}
		// Push all resolved actions to the stack
		actions.forEach(function eachAction (a, index) {
			let retValue = App.callback(a, [key, data]);
			if (!!cb && retValue !== undefined) {
				App.callback(cb, [index, retValue]);
			}
			if (typeof retValue === 'function') {
				retValue = {
					read: null,
					write: retValue
				};
			}
			if (typeof retValue === 'object' && typeof retValue.write === 'function') {
				if (App.debug() && !retValue.key) {
					retValue.key = key;
				}
				stack.push(retValue);
			}
		});
		// If outerCall, empty the stack
		while (outerCall && stack.length > sp) {
			// Capture current end
			const sLen = stack.length;
			// Process current range only
			for (let x = sp; x < sLen; x++) {
				read(stack[x]);
			}
			for (let x = sp; x < sLen; x++) {
				write(stack[x]);
			}
			// Advance the stack pointer
			sp = sLen;
		}
		if (outerCall) {
			// clean up
			innerCall = false;
			stack = [];
		}
	};

	/** Public Interfaces **/
	global.App = Object.assign({}, global.App, {
		/**
		 * @namespace actions
		 * @memberof App
		 */
		actions: {
			/**
			 * Find the methods that matches with the notify key
			 * @name resolve
			 * @memberof App.actions
			 * @method
			 * @param {Function|Object} actions Object of methods that can be matches
			 *   with the key's value
			 * @param {String} key Action key
			 * @returns {Function} The function corresponding to the key, if it exists
			 * @public
			 */
			resolve: resolve,

			/**
			 * Executes all read and write operations present in the actions array.
			 * @name execute
			 * @memberof App.actions
			 * @method
			 * @param {Array} actions Array of read/write objects
			 * @param {String} key Action key
			 * @param {Object} data Bag of data
			 * @returns {undefined}
			 * @public
			 */
			execute: execute,

			/**
			 * @name stack
			 * @memberof App.actions
			 * @method
			 * @returns {Array} All the operations currently in the stack.
			 *   Stack operations can already be executed but still in the stack.
			 * @public
			 */
			stack: function () {
				return stack;
			}
		}
	});
})(window);

/**
 * App Callback functionnality
 *
 * @fileoverview Defines and exports callback
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 *
 * @namespace callback
 * @memberof App
 * @requires App
 */
(function (global, undefined) {
	'use strict';
	
	/**
	 * Put the args value in a array if it isn't one already
	 * @name argsToArray
	 * @method
	 * @memberof callback
	 * @param {*} args
	 * @return {Array}
	 * @private
	 */
	const argsToArray = function (args) {
		const isNull = (args === null);
		const isNotUndefined = (args !== undefined);
		const isNotAnArray = !Array.isArray(args);
		const noLength = !!args && !isNaN(args.length);
		const isString = typeof args === 'string';

		if (isNull || (isNotUndefined && isNotAnArray && (noLength || isString))) {
			// put single parameter inside an array
			args = [args];
		}
		return args;
	};
	
	/**
	 * Execute the method received with the arguments received.
	 * Returns what the method returned.
	 * @name callback
	 * @method
	 * @memberof callback
	 * @this App
	 * @param {function} fx
	 * @param {*} args
	 * @return {*}
	 * @private
	 */
	const callback = function (fx, args) {
		try {
			args = argsToArray(args);
			
			if (typeof fx === 'function') {
				// IE8 does not allow null/undefined args
				return fx.apply(this, args || []);
				
			} else if (typeof fx === 'object') {
				return fx;
			}
		} catch (err) {
			const stack = err.stack;
			const msg = (err.message || err) + '\n' + (stack || '');
			
			App.log({args: [msg, err], fx: 'error'});
		}
		return undefined;
	};
	
	/** Public Interfaces **/
	global.App = Object.assign({}, global.App, {
		
		/**
		 * Execute the method received with the arguments received
		 * @name this
		 * @method
		 * @memberof callback
		 * @this App
		 * @param {function} fx
		 * @param {*} args
		 * @return undefined
		 * @public
		 */
		callback: callback
	});
	
})(window);

/**
 * Components are factory method that will generate a instance of a component.
 *
 * @fileoverview Defines and exports components
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 *
 * @namespace components
 * @memberof App
 * @requires App
 */
(function (global, undefined) {
	'use strict';
	
	/** Components **/
	const components = {};

	/**
	 * Create a default model of a component with an init function
	 * @name createAbstractComponent
	 * @method
	 * @memberof components
	 * @private
	 * @return {Object}
	 */
	const createAbstractComponent = function () {
		return {
			init: () => {}
		};
	};

	/**
	 * Merge the created component with the default model
	 * just to be sure there's an init method
	 * @name extendComponent
	 * @method
	 * @memberof components
	 * @param {Object} component
	 * @return {Object} component
	 * @private
	 */
	const extendComponent = function (component) {
		return Object.assign({}, createAbstractComponent(), component);
	};

	/**
	 * Make sure the component is unique by key verification
	 * and stores it with all the other components
	 * @name exportComponent
	 * @method
	 * @memberof components
	 * @param {String} key unique identifier
	 * @param {Function} component model of the component
	 * @param {Boolean} override fake news
	 * @private
	 */
	const exportComponent = function (key, component, override) {
		if (typeof key !== 'string') {
			App.log({args: ['`key` must be a string', key], fx: 'error'});
		} else if (!!components[key] && !override) {
			App.log({args: ['Overwriting component key %s is not allowed', key], fx: 'error'});
		} else {
			components[key] = Object.freeze(component);
			return component;
		}
		return false;
	};

	/**
	 * Create an instance of the component
	 * @name createComponent
	 * @method
	 * @memberof components
	 * @param {String} key unique identifier
	 * @param {Object} options object passed to the component's code
	 * @return {Object} Merged component with the default model and the actual component code
	 * @private
	 */
	const createComponent = function (key, options) {
		if (!components[key]) {
			App.log({args: ['Component %s is not found', key], fx: 'error'});
			return Object.freeze(extendComponent({}));
		}
		
		const c = components[key];
		
		if (typeof c !== 'function') {
			App.log({args: ['Component %s is not a function', key], fx: 'error'});
			return Object.freeze(extendComponent({}));
		}
		
		return Object.freeze(extendComponent(c.call(c, options)));
	};
	
	/** Public Interfaces **/
	global.App = Object.assign({}, global.App, {
		
		// Components
		components: {
			
			/**
			 * Get all components models
			 * @public
			 * @name models
			 * @method
			 * @memberof components
			 * @returns {Objects}
			 */
			models: function () {
				return components;
			},
			
			/**
			 * Create an instance of the component
			 * @name create
			 * @method
			 * @memberof components
			 * @param {String} key unique identifier
			 * @param {Object} options object passed to the component's code
			 * @return {Object} Merged component with the default model and the
			 *  actual component code
			 * @public
			 */
			create: createComponent,

			/**
			 * Make sure the component is unique by key verification
			 * and stores it with all the other components
			 * @name exports
			 * @method
			 * @memberof components
			 * @param {String} key unique identifier
			 * @param {Function} component model of the component
			 * @param {Boolean} override fake news
			 * @public
			 */
			exports: exportComponent
		}
	
	});
	
})(window);

/**
 * App Debug
 *
 * @fileoverview Defines and exports debug
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 *
 * @namespace debug
 * @memberof App
 * @requires App
 */
(function (global, undefined) {
	'use strict';
	
	/** Debug **/
	let isDebugging = false;
	
	/**
	 * Set or get the debug flag for the App
	 * @name debug
	 * @method
	 * @memberof debug
	 * @param {Boolean=} value
	 * @private
	 */
	const debug = function (value) {
		if (value === true || value === false) {
			isDebugging = value;
		} else if (value === '!') {
			isDebugging = !isDebugging;
		}
		return isDebugging;
	};
	
	/** Public Interfaces **/
	global.App = Object.assign({}, global.App, {
		
		/**
		 * Set or get the debug flag for the App
		 * @name debug
		 * @method
		 * @memberof debug
		 * @param {Boolean=} value
		 * @public
		 */
		debug: debug
	});
	
})(window);

/**
 * App device detector
 *
 * @fileoverview Analyse the user agent
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 *
 * @namespace device
 * @memberof App
 * @requires App
 */
(function (global, undefined) {
	'use strict';
	
	/**
	 * Factory for the browser detector
	 * @name browserDetector
	 * @memberof device
	 * @method
	 * @returns {Object} accessible functions
	 * @private
	 */
	const browserDetector = (function () {

		/**
		 * Get the user agent
		 * @name getUserAgent
		 * @memberof device
		 * @method
		 * @param {String} userAgent
		 * @returns {String} user agent
		 * @private
		 */
		const getUserAgent = function (userAgent) {
			if (!userAgent) {
				return window.navigator.userAgent;
			}
			return userAgent;
		};
		
		/**
		 * Test the user agent with the given regular expression
		 * @name testUserAgent
		 * @memberof device
		 * @method
		 * @param {RegExp} regexp
		 * @param {String} userAgent
		 * @returns {Boolean} if the test passed or not
		 * @private
		 */
		const testUserAgent = function (regexp, userAgent) {
			userAgent = getUserAgent(userAgent);
			return regexp.test(userAgent);
		};
		
		const detector = {
		
			/**
			 * Check if the device is a mobile one and not an iPhone
			 * @name isTablet
			 * @memberof device
			 * @method
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isTablet: function (userAgent) {
				return detector.isMobile(userAgent) &&
					!detector.isPhone(userAgent);
			},
			
			/** @deprecated */
			isTablette: function (userAgent) {
				return this.isTablet(userAgent);
			},
			
			/**
			 * Check if the device is an iPhone or an iPad
			 * @name isIos
			 * @method
			 * @memberof device
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isIos: function (userAgent) {
				return detector.isIphone(userAgent) ||
					detector.isIpad(userAgent);
			},
			
			/**
			 * Check if the user agent contains the word 'iPhone' or 'iPod'
			 * @name isIphone
			 * @method
			 * @memberof device
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isIphone: function (userAgent) {
				return !detector.isIpad(userAgent) &&
					(testUserAgent(/iPhone/i, userAgent) || testUserAgent(/iPod/i, userAgent));
			},
			
			/**
			 * Check if the user agent contains the word 'iPad'
			 * @name isIpad
			 * @method
			 * @memberof device
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isIpad: function (userAgent) {
				return testUserAgent(/iPad/i, userAgent);
			},
			
			/**
			 * Check if the user agent contains the word 'Android'
			 * @name isAndroid
			 * @method
			 * @memberof device
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isAndroid: function (userAgent) {
				return testUserAgent(/Android/i, userAgent);
			},
			
			/**
			 * Check if the device runs on Android
			 * and the user agent contains the word 'mobile'
			 * @name isAndroidPhone
			 * @method
			 * @memberof device
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isAndroidPhone: function (userAgent) {
				return detector.isAndroid(userAgent) &&
					testUserAgent(/mobile/i, userAgent);
			},
			
			/**
			 * Check if the device is a phone
			 * @name isPhone
			 * @method
			 * @memberof isIphone
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isPhone: function (userAgent) {
				return !detector.isIpad(userAgent) && (
					detector.isOtherPhone(userAgent) ||
					detector.isAndroidPhone(userAgent) ||
					detector.isIphone(userAgent));
			},
			
			/**
			 * Check if the user agent contains the word 'phone'
			 * @name isOtherPhone
			 * @method
			 * @memberof device
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isOtherPhone: function (userAgent) {
				return testUserAgent(/phone/i, userAgent);
			},
			
			/**
			 * Check if the user agent contains the word 'mobile'
			 * of if it's another phone
			 * @name isOtherMobile
			 * @method
			 * @memberof device
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isOtherMobile: function (userAgent) {
				return testUserAgent(/mobile/i, userAgent) ||
					detector.isOtherPhone(userAgent);
			},
			
			/**
			 * Check if the device runs on Android, iOs or other mobile
			 * @name isMobile
			 * @method
			 * @memberof device
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isMobile: function (userAgent) {
				return detector.isIos(userAgent) ||
					detector.isAndroid(userAgent) ||
					detector.isOtherMobile(userAgent);
			},
			
			/**
			 * Check if the user agent contains the word 'msie' or 'trident'
			 * @name isMsie
			 * @method
			 * @memberof device
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isMsie: function (userAgent) {
				return testUserAgent(/msie/mi, userAgent) ||
					testUserAgent(/trident/mi, userAgent);
			},

			/**
			 * Check if the user agent contains the word 'Safari' and does not
			 * contain the word 'Chrome'
			 * @name isSafari
			 * @method
			 * @memberof device
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isSafari: function (userAgent) {
				return !(testUserAgent(/Chrome/i, userAgent)) &&
					testUserAgent(/Safari/i, userAgent);
			},

			/**
			 * Check if the user agent contains the word 'Firefox'
			 * @name isFirefox
			 * @method
			 * @memberof isFirefox
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isFirefox: function (userAgent) {
				return testUserAgent(/Firefox/i, userAgent);
			},

			/**
			 * Check if the user agent contains the word 'Edge'
			 * @name isEdge
			 * @method
			 * @memberof device
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isEdge: function (userAgent) {
				return testUserAgent(/Edge/i, userAgent) || testUserAgent(/Edg/i, userAgent);
			},

			/**
			 * Check if the user agent contains the word 'Chrome' and it's not Edge
			 * @name isChrome
			 * @method
			 * @memberof device
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isChrome: function (userAgent) {
				return testUserAgent(/Chrome/i, userAgent) && !detector.isEdge();
			},

			/**
			 * Check if the user agent contains the word 'Macintosh' and it's not on mobile
			 * @name isMacOs
			 * @method
			 * @memberof device
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isMacOs: function (userAgent) {
				return testUserAgent(/Macintosh/i, userAgent) && !detector.isMobile();
			},

			/**
			 * Check if the user agent contains the word 'Windows'
			 * @name isWindows
			 * @method
			 * @memberof device
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isWindows: function (userAgent) {
				return testUserAgent(/Windows/i, userAgent);
			},

			/**
			 * Check if the user agent contains the word 'Linux' and it's not on mobile
			 * @name isLinux
			 * @method
			 * @memberof device
			 * @param {String} userAgent The browser user agent
			 * @returns {Boolean}
			 * @private
			 */
			isLinux: function (userAgent) {
				return testUserAgent(/Linux/i, userAgent) && !detector.isMobile();
			}
		};
		
		// return newly created object
		return detector;
	})();
	
	/** Public Interfaces **/
	global.App = Object.assign({}, global.App, {
		device: {

			/**
			 * Object with all the device detection methods
			 * @name detector
			 * @public
			 * @memberof device
			 * @returns {Object} Detector
			 */
			detector: browserDetector,

			/**
			 * Check if the device is an iPhone
			 * @name iphone
			 * @constant
			 * @public
			 * @memberof device
			 */
			iphone: browserDetector.isIphone(),

			/**
			 * Check if the device is an iPad
			 * @name ipad
			 * @constant
			 * @public
			 * @memberof device
			 */
			ipad: browserDetector.isIpad(),

			/**
			 * Check if the device run on iOs
			 * @name ios
			 * @constant
			 * @public
			 * @memberof device
			 */
			ios: browserDetector.isIos(),

			/**
			 * Check if the device run on Android
			 * @name android
			 * @constant
			 * @public
			 * @memberof device
			 */
			android: browserDetector.isAndroid(),

			/**
			 * Check if the device run on Max Os
			 * @name macos
			 * @constant
			 * @public
			 * @memberof device
			 */
			macos: browserDetector.isMacOs(),

			/**
			 * Check if the device run on Windows
			 * @name windows
			 * @constant
			 * @public
			 * @memberof device
			 */
			windows: browserDetector.isWindows(),

			/**
			 * Check if the device run on Linux
			 * @name linux
			 * @constant
			 * @public
			 * @memberof device
			 */
			linux: browserDetector.isLinux(),

			/**
			 * Check if the device is a mobile
			 * @name mobile
			 * @constant
			 * @public
			 * @memberof device
			 */
			mobile: browserDetector.isMobile(),

			/**
			 * Check if the device is a phone
			 * @name phone
			 * @constant
			 * @public
			 * @memberof device
			 */
			phone: browserDetector.isPhone(),

			/**
			 * Check if the device is a tablet
			 * @name tablet
			 * @constant
			 * @public
			 * @memberof device
			 */
			tablet: browserDetector.isTablet(),

			/**
			 * Check if the browser is Chrome
			 * @name chrome
			 * @constant
			 * @public
			 * @memberof device
			 */
			chrome: browserDetector.isChrome(),

			/**
			 * Check if the browser is Firefox
			 * @name firefox
			 * @constant
			 * @public
			 * @memberof device
			 */
			firefox: browserDetector.isFirefox(),

			/**
			 * Check if the browser is Safari
			 * @name safari
			 * @constant
			 * @public
			 * @memberof device
			 */
			safari: browserDetector.isSafari(),

			/**
			 * Check if the browser is Internet Explorer
			 * @name internetexplorer
			 * @constant
			 * @public
			 * @memberof device
			 */
			internetexplorer: browserDetector.isMsie(),

			/**
			 * Check if the browser is Edge
			 * @name edge
			 * @constant
			 * @public
			 * @memberof device
			 */
			edge: browserDetector.isEdge(),

			/**
			 * @name events
			 * @constant
			 * @public
			 * @memberof device
			 * @property {String} click Click event
			 * @property {String} enter 'pointerenter' equivalent
			 * @property {String} up 'pointerup' equivalent
			 * @property {String} down 'pointerdown' equivalent
			 * @property {String} move 'pointermove' equivalent
			 * @property {String} over 'pointerover' equivalent
			 * @property {String} out 'pointerout' equivalent
			 * @property {String} leave 'pointerleave' equivalent
			 */
			events: {
				click: 'click',
				enter: 'pointerenter',
				up: 'pointerup',
				down: 'pointerdown',
				move: 'pointermove',
				over: 'pointerover',
				out: 'pointerout',
				leave: 'pointerleave'
			}
		}
	});
	
})(window);

/**
 * Functions
 *
 * @fileoverview Defines the App Fx
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 *
 * @namespace App.fx
 */
(function (global, undefined) {
	'use strict';
	const bindings = {};

	/**
	 * Defines a custom name property on the fx object, if debugging is enabled.
	 * Ignores any errors.
	 * @memberof App.fx
	 * @name setFxName
	 * @method
	 * @param {String} key Action key
	 * @param {Function} fx The function
	 * @private
	 */
	const setFxName = function (key, fx) {
		if (!!App.debug() && Object.defineProperty) {
			try {
				Object.defineProperty(fx, 'name', { value: key });
			} catch (ex) { }
		}
	};

	/**
	 * Executes all read and write operations for the key function
	 * @name notify
	 * @memberof App.fx
	 * @method
	 * @param {String} key Action key
	 * @param {Object} data Bag of data
	 * @param {Function} cb Callback executed after each App.actions.execute execution
	 * @this fx
	 * @returns this
	 * @private
	 */
	const notify = function (key, data, cb) {
		const fx = bindings[key];
		if (!fx) {
			App.log({ args: ['Function key %s did not resolve to anything', key], fx: 'warn' });
		} else {
			App.actions.execute(fx, key, data, cb);
		}
		return this;
	};

	/**
	 * Register the function and make sure his key is unique
	 * @name exportsFx
	 * @method
	 * @memberof App.fx
	 * @param {String} key Module's unique identifier
	 * @param {Function} fx The function
	 * @param {Boolean} override Flag to control overwriting a function
	 * @returns {Object} The newly created function
	 * @private
	 */
	const exportsFx = function (key, fx, override) {
		if (typeof key !== 'string') {
			App.log({ args: ['`key` must be a string', key], fx: 'error' });
		} else if (!!bindings[key] && !override) {
			App.log({ args: ['Overwriting function key %s is not allowed', key], fx: 'error' });
		} else if (typeof fx !== 'function') {
			App.log({ args: ['Function key %s is not a function', key], fx: 'error' });
		} else {
			// Try to set the name of the function
			setFxName(fx);
			bindings[key] = Object.freeze(fx);
		}
		return bindings[key];
	};

	/** Public Interfaces **/
	global.App = Object.assign({}, global.App, {
		/**
		 * @namespace fx
		 * @memberof App
		 */
		fx: {
			/**
			 * Executes all read and write operations present in the actions array.
			 * @name notify
			 * @memberof App.fx
			 * @method
			 * @param {String} key Action key
			 * @param {Object} data Bag of data
			 * @param {Function} cb Callback executed after each App.actions.execute execution
			 * @this fx
			 * @returns this
			 * @public
			 */
			notify: notify,

			/**
			 * Register the function and make sure his key is unique
			 * @name exports
			 * @method
			 * @memberof App.fx
			 * @param {String} key Module's unique identifier
			 * @param {Function} fx The function
			 * @param {Boolean} override Flag to control overwriting a function
			 * @returns {Object} The newly created function
			 * @private
			 */
			exports: exportsFx
		}
	});
})(window);

/**
 * App Loaded functionality
 *
 * @fileoverview Defines and exports loaded
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 *
 * @namespace loaded
 * @memberof App
 * @requires App
 */
(function (global, undefined) {
	'use strict';

	/**
	 * Check if a resource is loaded and callback when it is.
	 * @name loaded
	 * @method
	 * @memberof loaded
	 * @param {*} v Resource to test
	 * @param {Function} fx Callback to execute when the resource is loaded
	 * @param {Integer} delay Delay between each checks in ms
	 * @param {Integer} maxRetriesCount Max checks for a resource
	 * @param {Integer} counter Memo for the recursive function
	 * @private
	 */
	const loaded = function (v, fx, delay, maxRetriesCount, counter) {
		delay = Math.max(delay || 0, 100);
		maxRetriesCount = maxRetriesCount || 10;
		counter = counter || 1;
		// get the value
		const value = App.callback(v, [counter]);
		// if the value exists
		if (!!value) {
			// call the function, with the value, but always async
			window.setTimeout(function () {
				App.callback(fx, [value, counter]);
			}, 0);
		} else if (counter < maxRetriesCount) {
			// recurse
			window.setTimeout(loaded, delay, v, fx, delay, maxRetriesCount, counter + 1);
		} else if (!!App.log) {
			App.log({
				fx: 'error',
				args: ['App.loaded timed out after %s attempts.', counter]
			});
		}
	};

	/** Public Interfaces **/
	global.App = Object.assign({}, global.App, {
		/**
		 * Check if a ressource is loaded and callback when it is.
		 * @name this
		 * @method
		 * @memberof loaded
		 * @param {*} v Ressource to test
		 * @param {Function} fx Callback to execute when the ressource is loaded
		 * @param {Integer} delay Delay between each checks in ms
		 * @param {Integer} maxRetriesCount Max checks for a ressource
		 * @param {Integer} counter Memo for the recursive function
		 * @public
		 */
		loaded: loaded
	});

})(window);

/**
 *  Assets loader: Basically a wrap around $.ajax in order
 *  to priorize and serialize resource loading.
 *
 * @fileoverview Assets Loader, wrap around $.ajax
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 * @namespace loader
 * @memberof App
 * @requires App
 */
((global, undefined) => {
	'use strict';

	let isLoading = false;

	const defaultFetchOptions = () => {
		return {
			method: 'GET',
			mode: 'cors',
			redirect: 'follow'
		};
	};

	/**
	 * Simple wrapper around the fetch api for ajax requests
	 * @param {Object} options all the parameters to config the fetch request
	 * @returns {Promise}
	 */
	const load = (url, options = {}) => {
		if (!url) {
			url = window.location.origin + '/';
		}

		options = Object.assign({}, defaultFetchOptions(), options);

		return window.fetch(url, options);
	};

	global.App = Object.assign({}, global.App, {
		loader: {
			/**
			 * Put the request in the queue and trigger the load
			 * @name load
			 * @method
			 * @memberof loader
			 * @public
			 * @param {Object} url Url Object
			 * @param {Integer} priority
			 * @this App
			 * @returns this
			 */
			load: load,

			/**
			 * Check if the loader is busy
			 * @name isLoading
			 * @method
			 * @memberof loader
			 * @param {Object} url Url object to check
			 * @returns {Boolean}
			 * @public
			 */
			isLoading: () => isLoading,
		}
	});
	
})(window);

/**
 * App  Log
 *
 * @fileoverview Defines and exports log
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 *
 * @namespace log
 * @memberof App
 * @requires App
 */
(function (global, undefined) {
	'use strict';

	/**
	 * Format the passed arguments and the displayed message
	 * @name argsToObject
	 * @method
	 * @memberof debug
	 * @param {String|Object|Array} arg The value or values to log
	 * @returns {Object} Formated object
	 * @private
	 */
	const argsToObject = function (arg) {
		// ensure that args is an array
		if (!!arg.args && !Array.isArray(arg.args)) {
			arg.args = [arg.args];
		}

		// our copy
		const a = {
			args: arg.args || arguments,
			fx: arg.fx || 'warn',
			me: arg.me || 'App'
		},
			t1 = typeof a.args[0];

		if (t1 === 'string' || t1 === 'number' || t1 === 'boolean') {
			// append me before a.args[0]
			a.args[0] = '[' + a.me + '] ' + a.args[0];
		}
		return a;
	};

	const logs = [];

	/**
	 * Log the received data with the appropriate effect (log, error, info...)
	 * @name log
	 * @method
	 * @memberof debug
	 * @param {String|Object|Array} arg The value or values to log
	 * @private
	 */
	const log = function (arg) {
		// no args, exit
		if (!arg) {
			return this;
		}

		const a = argsToObject(arg);

		if (App.debug()) {
			// make sure fx exists
			if (typeof console[a.fx] !== 'function') {
				a.fx = 'log';
			}
			// call it
			if (!!window.console[a.fx].apply) {
				window.console[a.fx].apply(window.console, a.args);
			} else {
				a.args.forEach(function logArgs (arg) {
					window.console[a.fx](arg);
				});
			}
		}
		logs.push(a);

		return this;
	};

	/** Public Interfaces **/
	global.App = Object.assign({}, global.App, {

		/**
		 * Log the received data with the appropriate effect (log, error, info...)
		 * @name this
		 * @method
		 * @memberof log
		 * @param {String|Object|Array} arg The value or values to log
		 * @public
		 */
		log: log,

		/**
		 * Get all the logs
		 * @name logs
		 * @method
		 * @memberof log
		 * @returns {Array} All the logs
		 * @public
		 */
		logs: function () {
			return logs;
		}
	});

})(window);

/**
 * Mediator controls the current page and modules
 *
 * @fileoverview Defines the App Mediator
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 *
 * @namespace App.mediator
 */
(function (global, undefined) {
	'use strict';

	/**
	 * Returns the current document.location value, without the protocol and host
	 * @name getCurrentUrl
	 * @memberof App
	 * @method
	 * @returns {String} The url
	 * @private
	 */
	const getCurrentUrl = function () {
		return document.location.pathname;
	};

	/** Mediator **/
	let mediatorIsLoadingPage = false;
	const currentRouteUrl = getCurrentUrl();

	//Store ref to the current page object
	let currentPage = null;

	//Store ref to the previous page object
	let previousPage = null;
	let previousUrl = '';

	/**
	 * Check if the mediator is loading a page
	 * @name validateMediatorState
	 * @memberof App
	 * @method
	 * @returns {Boolean}
	 * @private
	 */
	const validateMediatorState = function () {
		if (!!mediatorIsLoadingPage) {
			App.log({
				args: 'Mediator is busy waiting for a page load.',
				fx: 'error'
			});
		}

		return !mediatorIsLoadingPage;
	};

	/**
	 * Check if we can enter the next page
	 * @name canEnterNextPage
	 * @memberof App
	 * @method
	 * @param {Object} nextPage Next page instence
	 * @returns {Boolean}
	 * @private
	 */
	const canEnterNextPage = function (nextPage) {
		let result = true;

		if (!nextPage.canEnter()) {
			App.log({ fx: 'error', args: ['Cannot enter page %s.', nextPage.key()] });
			result = false;
		}

		return result;
	};

	/**
	 * Check if we can leave the current page
	 * @name canLeaveCurrentPage
	 * @memberof App
	 * @method
	 * @returns {Boolean}
	 * @private
	 */
	const canLeaveCurrentPage = function () {
		let result = false;

		if (!currentPage) {
			App.log({ args: 'No current page set.', fx: 'error' });
		} else if (!currentPage.canLeave()) {
			App.log({ args: ['Cannot leave page %s.', currentPage.key()], fx: 'error' });
		} else {
			result = true;
		}

		return result;
	};

	//Actions

	/**
	 * Resolves the call to key only for the current page
	 * @name resolvePageAction
	 * @memberof App
	 * @method
	 * @param {String} key Notify key
	 * @param {Object} data Bag of data
	 * @this {Object} Mediator
	 * @returns {Object} A read/write object, if it exists
	 * @private
	 */
	const resolvePageAction = function (key, data) {
		if (!!currentPage) {
			return App.actions.resolve(currentPage.actions, key, data);
		} else {
			App.log({ args: 'Can not notify page: No current page set.', fx: 'error' });
		}
	};

	/**
	 * Resolves and executes the action on the page and all modules
	 * @name notifyAll
	 * @memberof App
	 * @method
	 * @param {String} key Notify key
	 * @param {Object} data Bag of data
	 * @param {Function} cb Callback executed after each App.actions.execute execution
	 * @this Mediator
	 * @returns this
	 * @see AER in http://addyosmani.com/largescalejavascript/
	 * @private
	 */
	const notifyAll = function (key, data, cb) {
		let actions = [];
		// resolve action from current page only
		const pa = resolvePageAction(key, data);
		if (!!pa) {
			actions.push(pa);
		}
		// resolve action from all modules
		actions = actions.concat(App.modules.resolve(key, data));
		// Execute everything
		App.actions.execute(actions, key, data, cb);
		return this;
	};

	/**
	 * Resolves and executes the action on the page
	 * @name notifyPage
	 * @memberof App
	 * @method
	 * @param {String} key Notify key
	 * @param {Object} data Bag of data
	 * @param {Function} cb Callback executed after each App.actions.execute execution
	 * @this Mediator
	 * @returns this
	 */
	const notifyPage = function (key, data, cb) {
		const pa = resolvePageAction(key, data);
		if (!!pa) {
			App.actions.execute([pa], key, data, cb);
		}
		return this;
	};

	/**
	 * Change the current page to the requested route
	 * Do nothing if the current page is already the requested route
	 * @name gotoPage
	 * @memberof App
	 * @method
	 * @param {String} obj Page requested
	 * @param {String} previousPoppedUrl Url
	 * @param {Boolean} changeUrl if goto need to change the url or not
	 * @fires App#page:leave
	 * @fires App#page:enter
	 * @fires App#pages:failedtoparse
	 * @fires App#pages:loaded
	 * @fires App#pages:loadfatalerror
	 * @fires App#pages:loaderror
	 * @fires App#pages:requestBeginPageTransition
	 * @fires App#pages:navigateToCurrent
	 * @fires App#pages:requestPageTransition
	 * @fires App#pages:routeNotFound
	 * @fires App#pages:loadprogress
	 * @fires App#pages:notfound
	 * @fires App#page:leaving
	 * @fires App#page:entering
	 * @this App
	 * @private
	 */
	const gotoPage = function (obj, previousPoppedUrl, pageData = {}, changeUrl = true) {
		let nextPage;
		let route = '';

		/**
		 * Try to parse the data in a virtual element to be sure it's valid
		 * @param {String} data response data
		 * @returns {element}
		 */
		const safeParseData = function (data) {
			try {
				const parser = new window.DOMParser();
				const doc = parser.parseFromString(data, 'text/html');

				return doc;
			}
			catch (ex) {
				App.log({ args: [ex.message], fx: 'error' });
				/**
				 * @event App#pages:failedtoparse
				 * @type {object}
				 * @property {object} data
				 * @property {string} route
				 * @property {object} nextPage PageObject
				 * @property {object} currentPage PageObject
				 */
				App.modules.notify('pages.failedtoparse', {
					data: data,
					route: route,
					nextPage: nextPage,
					currentPage: currentPage
				});
			}
			return null;
		};

		/**
		 * Initiate the transition and leave/enter page logic
		 */
		const enterLeave = function () {
			//Keep currentPage pointer for the callback in a new variable
			//The currentPage pointer will be cleared after the next call
			let leavingPage = currentPage;
			pageData.firstTime = false;

			if (!nextPage.isInited()) {
				nextPage.init();
				nextPage.setInited();
				pageData.firstTime = true;
			}

			/**
			 * @event App#page:leaving
			 * @type {object}
			 * @property {object} page PageObject
			 */
			App.modules.notify('page.leaving', { page: leavingPage });

			//Leave the current page
			leavingPage.leave(function () {
				currentPage = null; // clean currentPage pointer,this will block all interactions

				//set leaving page to be previous one
				previousPage = leavingPage;
				previousUrl = !!previousPoppedUrl ? previousPoppedUrl : getCurrentUrl();
				//clear leavingPage
				leavingPage = null;

				/**
				 * @event App#page:leave
				 * @type {object}
				 * @property {object} page PageObject
				 */
				App.modules.notify('page.leave', { page: previousPage });
			});

			/**
			 * @event App#page:entering
			 * @type {object}
			 * @property {object} page PageObject
			 * @property {string} route url
			 */
			App.modules.notify('page.entering', { page: nextPage, route: route });

			nextPage.enter(function () {
				// set the new Page as the current one
				currentPage = nextPage;

				/**
				 * @event App#page:enter
				 * @type {object}
				 * @property {object} page PageObject
				 */
				App.modules.notify('page.enter', { page: nextPage, route: route });
				// Put down the flag since we are finished
				mediatorIsLoadingPage = false;
			}, pageData);
		};

		/**
		 * Verify that the data is valid an append the loaded content inside the App's root
		 * @param {String} data requested data
		 * @param {String} textStatus Current request status
		 * @param {Object} jqXHR request instance
		 */
		const loadSuccess = function (response) {

			// if a redirection was detected by the browser with the original goto replicate it
			if (!!response.redirected) {
				window.history.replaceState({
					data: {
						mediator: true,
						type: 'pushState',
						redirected: true
					}
				}, '', response.url);

				nextPage = App.pages.getPageForHref(response.url);
				route = response.url;

				const node = document.querySelector(nextPage.selector());
				
				// If the redirected page already exists re-use it else continue the normal flow.
				if (!!node) {
					node.style.opacity = 0;
					node.style.display = 'none';
					return enterLeave();
				}
			}

			return response.text().then((data) => {
				const htmldata = safeParseData(data);

				// get the node
				let node = htmldata.querySelector(nextPage.selector());

				// get the root node
				const elem = document.querySelector(App.root());

				if (!node) {
					App.log({
						args: ['Could not find "%s" in xhr data.', nextPage.selector()],
						fx: 'error'
					});

					// free the mediator
					mediatorIsLoadingPage = false;

					/**
					 * @event App#pages:notfound
					 * @type {Object}
					 * @property {String} data Loaded raw content
					 * @property {String} url request url
					 * @property {Object} response Response object instence
					 * @property {Int} status HTTP code for the response
					 */
					App.modules.notify('pages.notfound', {
						data: data,
						url: obj,
						response: response,
						status: response.status,
					});

				} else {
					// append it to the doc, hidden
					node.style.opacity = 0;
					node.style.display = 'none';

					elem.appendChild(node);

					/**
					 * @event App#pages:loaded
					 * @type {Object}
					 * @property {element} elem Loaded content
					 * @property {String} data Loaded raw content
					 * @property {String} url request url
					 * @property {Object} page PageObject
					 * @property {element} node Page element
					 * @property {Object} response Response object instence
					 * @property {Int} status HTTP code for the response
					 */
					App.modules.notify('pages.loaded', {
						elem: elem,
						data: data,
						html: htmldata,
						url: obj,
						page: nextPage,
						node: node,
						response: response,
						status: response.status
					});

					// actual goto
					enterLeave();
				}
			});
		};

		if (validateMediatorState() && canLeaveCurrentPage()) {
			if (typeof obj === 'string') {
				nextPage = App.pages.getPageForHref(obj);
				route = obj;
			} else {
				App.log({fx: 'error', args: 'Url parameter must be of type string got ' + typeof obj}); // jshint ignore:line
				return;
			}

			if (!nextPage) {
				/**
				 * @event App#pages:routeNotFound
				 * @type {Object}
				 * @property {Object} page PageObject
				 * @property {String} url Request url
				 */
				App.modules.notify('pages.routeNotFound', {
					page: currentPage,
					url: obj
				});
				App.log({ args: ['Route "%s" was not found.', obj], fx: 'error' });
			} else {
				if (canEnterNextPage(nextPage)) {
					if (nextPage.key() === currentPage.key()) {
						/**
						 * @event App#pages:navigateToCurrent
						 * @type {Object}
						 * @property {Object} page PageObject
						 * @property {String} route Request url
						 */
						App.modules.notify('pages.navigateToCurrent', {
							page: nextPage,
							route: route
						});

						App.log('Next page is the current one');
					} else {

						if (!!changeUrl) {
							window.history.pushState({
								data: {
									mediator: true
								}
							}, '', obj);
							pageData.type = 'pushState';
						}

						/**
						 * @event App#pages:loading
						 * @type {Object}
						 * @property {Object} page PageObject
						 */
						App.modules.notify('pages.loading', {
							page: nextPage
						});

						/**
						 * @event App#pages:requestBeginPageTransition
						 * @type {Object}
						 * @property {Object} currentPage PageObject
						 * @property {Object} nextPage PageObject
						 * @property {String} route Request url
						 */
						App.modules.notify('pages.requestBeginPageTransition', {
							currentPage: currentPage,
							nextPage: nextPage,
							route: route
						});

						// Load from xhr or use cache copy
						if (!App.pages.loaded(obj)) {
							// Raise the flag to mark we are in the process
							// of loading a new page
							mediatorIsLoadingPage = true;

							App.loader.load(obj).then(loadSuccess).catch((event) => {
								/**
								 * @event App#pages:loaderror
								 * @type {Object}
								 * @property {Object} event Request event
								 * @property {String} url Request url
								 */
								App.modules.notify('pages.loaderror', {
									event: event,
									url: obj
								});
							});
						} else {
							enterLeave();

							/**
							 * @event App#pages:loaded
							 * @type {Object}
							 * @property {element} elem Root element
							 * @property {Object} event Request event
							 * @property {String} url Request url
							 */
							App.modules.notify('pages.loaded', {
								elem: document.querySelector(App.root()),
								url: obj,
								page: nextPage
							});
						}
					}
				} else {
					App.log({ args: ['Route "%s" is invalid.', obj], fx: 'error' });
				}
			}
		}
		return this;
	};

	/**
	 * Properly sets the current page on first load
	 * @name initPage
	 * @memberof App.mediator
	 * @method
	 * @param {Object} page the loaded and inited page object
	 * @fires App#page:entering
	 * @fires App#page:enter
	 * @private
	 */
	const initPage = function (page) {
		if (!!currentPage) {
			App.log({
				args: ['Previous current page will be changed', {
					currentPage: currentPage,
					previousPage: previousPage,
					newCurrentPage: page
				}],
				fx: 'warning'
			});
		}

		// initialize page variable
		currentPage = page;
		previousPage = previousPage || page;

		/**
		 * @event App#page:entering
		 * @type {object}
		 * @property {Object} page PageObject
		 * @property {String} route Url
		 */
		App.modules.notify('page.entering', {
			page: currentPage,
			route: currentRouteUrl
		});

		// enter the page right now
		currentPage.enter(function currentPageEnterCallback () {
			/**
			 * @event App#page:enter
			 * @type {object}
			 * @property {Object} page PageObject
			 * @property {String} route Url
			 */
			App.modules.notify('page.enter', {
				page: currentPage,
				route: currentRouteUrl
			});
		}, true);
	};

	/** Public Interfaces **/
	global.App = Object.assign({}, global.App, {
		/**
		 * @namespace mediator
		 * @memberof App
		 */
		mediator: {
			/**
			 * Get the current url string
			 * @name getCurrentUrl
			 * @memberof App.mediator
			 * @method
			 * @returns {string} The current url
			 * @public
			 */
			getCurrentUrl: getCurrentUrl,

			/**
			 * Get the currentPage object
			 * @name getCurrentPage
			 * @memberof App.mediator
			 * @method
			 * @returns {Object} PageObject
			 * @public
			 */
			getCurrentPage: function () {
				return currentPage;
			},

			/**
			 * Set the currentPage object
			 * @name setCurrentPage
			 * @memberof App.mediator
			 * @method
			 * @param {Object} page The PageObject
			 * @private
			 */
			setCurrentPage: function (page) {
				currentPage = page;
			},

			/**
			 * Get the previous url string
			 * @name getPreviousUrl
			 * @memberof App.mediator
			 * @method
			 * @returns {string} The previous url
			 * @public
			 */
			getPreviousUrl: function () {
				return previousUrl;
			},

			/**
			 * Get the previousPage object
			 * @name getPreviousPage
			 * @memberof App.mediator
			 * @method
			 * @returns {Object} PageObject
			 * @public
			 */
			getPreviousPage: function () {
				return previousPage;
			},

			/**
			 * Resolves and execute the action on the page and all modules
			 * @name notify
			 * @memberof App.mediator
			 * @method
			 * @param {String} key Notify key
			 * @param {Object} data Bag of data
			 * @param {Function} cb Callback executed after each App.actions.execute execution
			 * @this Mediator
			 * @returns this
			 * @see AER in http://addyosmani.com/largescalejavascript/
			 * @public
			 */
			notify: notifyAll,

			/**
			 * Resolves and executes the action on the page
			 * @name notifyCurrentPage
			 * @memberof App.mediator
			 * @method
			 * @param {String} key Notify key
			 * @param {Object} data Bag of data
			 * @param {Function} cb Callback executed after each App.actions.execute execution
			 * @this {Object} Mediator
			 * @returns this
			 * @public
			 */
			notifyCurrentPage: notifyPage,

			/**
			 * Change the current page to the requested route
			 * Do nothing if the current page is already the requested route
			 * @name goto
			 * @memberof App.mediator
			 * @method
			 * @param {String} obj Page requested
			 * @param {String} previousPoppedUrl Url
			 * @fires App#page:leave
			 * @fires App#page:enter
			 * @fires App#pages:failedtoparse
			 * @fires App#pages:loaded
			 * @fires App#pages:loadfatalerror
			 * @fires App#pages:loaderror
			 * @fires App#pages:requestBeginPageTransition
			 * @fires App#pages:navigateToCurrent
			 * @fires App#pages:requestPageTransition
			 * @fires App#pages:routeNotFound
			 * @fires App#pages:loadprogress
			 * @fires App#pages:notfound
			 * @fires App#page:leaving
			 * @fires App#page:entering
			 * @this App
			 */
			goto: gotoPage,

			/**
			 * Properly sets the current page on first load
			 * @name init
			 * @memberof App.mediator
			 * @method
			 * @param {Object} page the loaded and inited page object
			 * @fires App#page:entering
			 * @fires App#page:enter
			 * @public
			 */
			init: initPage
		}
	});

})(window);

/**
 * Module are singleton that lives across pages
 *
 * @fileoverview Defines and exports components
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 *
 * @namespace modules
 * @memberof App
 * @requires App
 */
(function (global, undefined) {
	'use strict';
	
	/** Modules **/
	const modules = {};
	
	/**
	 * Create a basic module with the minimum required methods
	 * @name createAbstractModule
	 * @method
	 * @memberof modules
	 * @returns {Object}
	 * @private
	 */
	const createAbstractModule = function () {
		return {
			actions: () => {},
			init: () => {}
		};
	};
	
	/**
	 * Merge the module with the basic one
	 * to be sure the minimum required methods are present
	 * @name createModule
	 * @method
	 * @memberof modules
	 * @param {Object} module ModuleObject
	 * @private
	 */
	const createModule = function (module) {
		return Object.freeze(Object.assign({}, createAbstractModule(), module));
	};
	
	/**
	 * Register the module and make sure his key is unique
	 * @name exportModule
	 * @method
	 * @memberof modules
	 * @param {String} key Module's unique identifier
	 * @param {Object} module The module object
	 * @param {Boolean} override Flag to control overwriting a module
	 * @returns {Object} The newly created module
	 * @private
	 */
	const exportModule = function (key, module, override) {
		if (typeof key !== 'string') {
			App.log({args: ['`key` must be a string', key], fx: 'error'});
		} else if (!!modules[key] && !override) {
			App.log({args: ['Overwriting module key %s is not allowed', key], fx: 'error'});
		} else {
			modules[key] = createModule(module);
		}
		return modules[key];
	};

	/**
	 * Resolves the key action on all modules
	 * @name resolveActions
	 * @method
	 * @memberof modules
	 * @param {String} key Notify key
	 * @param {Object} data Bag of data
	 * @returns {Array} Array of read/write objects for all modules
	 * @private
	 */
	const resolveActions = function (key, data) {
		return Object.keys(modules).map(function resolveAction (k) {
			return App.actions.resolve(modules[k].actions, key, data);
		}).filter(function (a) {
			return !!a;
		});
	};

	/**
	 * Resolves and execute the action on all modules
	 * @name notifyModules
	 * @method
	 * @memberof modules
	 * @param {String} key Notify key
	 * @param {Object} data Bag of data
	 * @param {Function} cb Callback executed after each App.actions.execute executions
	 * @this App
	 * @returns this
	 * @private
	 */
	const notifyModules = function (key, data, cb) {
		const actions = resolveActions(key, data);
		App.actions.execute(actions, key, data, cb);
		return this;
	};
	
	/** Public Interfaces **/
	global.App = Object.assign({}, global.App, {
		/**
		 * @namespace modules
		 * @memberof App
		 */
		modules: {
			
			/**
			 * Returns all the modules
			 * @name models
			 * @method
			 * @memberof modules
			 * @returns {Object} All modules models
			 * @public
			 */
			models: function () {
				return modules;
			},
			
			/**
			 * Register the module and make sure his key is unique
			 * @name exports
			 * @method
			 * @memberof modules
			 * @param {String} key Module's unique identifier
			 * @param {Object} module The module object
			 * @param {Boolean} override Flag to control overwriting a module
			 * @returns {Object} The newly created module
			 * @public
			 */
			exports: exportModule,
			
			/**
			 * Resolves and execute the action on all modules
			 * @name notify
			 * @method
			 * @memberof modules
			 * @param {String} key Notify key
			 * @param {Object} data Bag of data
			 * @param {Function} cb Callback executed after each App.actions.execute executions
			 * @this App
			 * @returns this
			 * @public
			 */
			notify: notifyModules,

			/**
			 * Resolves the key action on all modules
			 * @name resolve
			 * @method
			 * @memberof modules
			 * @param {String} key Notify key
			 * @param {Object} data Bag of data
			 * @returns {Array} Array of read/write objects for all modules
			 * @public
			 */
			resolve: resolveActions
		}
	
	});
	
})(window);

/**
 * Pages are controller that are activated on a url basis.
 *
 * @fileoverview Defines and exports pages
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 *
 * @namespace pages
 * @memberof App
 * @requires App
 */
(function (global, undefined) {
	'use strict';
	
	const pageModels = {};
	const pageInstances = {};
	const activeRoutes = {};

	/**
	 * Creates and a new factory function based on the
	 * given parameters
	 * @name createPageModel
	 * @memberof pages
	 * @method
	 * @param {String} key The unique key for this page model
	 * @param {pageParam|pageCreator} model A page object that conforms with the pageParam type
	 *   or a pageCreator function that returns a page object.
	 * @param {Boolean} [override=false] Allows overriding an existing page model
	 *
	 * @returns {pageModel} The newly built factory function
	 * @private
	 */
	const createPageModel = function (key, model, override) {

		/**
		 * Page Model is a Factory function for page instances.
		 * @name factory
		 * @memberof pages
		 * @method
		 * @param {Object} pageData PageObject
		 * @returns page
		 * @private
		 */
		const factory = function (pageData) {
			let modelRef;
			let isInited = false;
			
			if (typeof model === 'object') {
				modelRef = model;
			} else if (typeof model === 'function') {
				modelRef = model.call(this, key, pageData, override);
				if (typeof modelRef !== 'object') {
					App.log({
						args: [
							'The exported page model function must return an object, ' +
							'`%s` given (%s)', typeof modelRef, modelRef
						],
						fx: 'error'
					});
					return null;
				}
			} else {
				App.log({
					args: [
						'The exported page model must be an object or a function, ' +
						'`%s` given (%s)', typeof model, model
					],
					fx: 'error'
				});
				return null;
			}

			const getSelector = () => '[data-page-url="' + pageData.key + '"]';

			/**
			 * Page Param
			 * @memberof pages
			 * @typedef {Object} pageParam
			 * @param {Function} actions @returns {object}
			 * @param {Function} init
			 * @param {Function} enter
			 * @param {Function} leave
			 * @param {Function} canEnter @returns {boolean}
			 * @param {Function} canLeave @returns {boolean}
			 * @param {Function} model @returns {string}
			 * @param {Function} routes @return {Array}
			 */
			const base = {
				actions: () => {},
				init: () => {},
				canEnter: () => true,
				canLeave: () => true,
				model: () => key,
				enter: (next, data) => {
					const p = document.querySelector(getSelector());
					p.style.opacity = 1;
					p.style.display = 'block';
					if (!!data.firstTime || data.type === 'pushState') {
						window.scrollTo({
							top: 0,
							left: 0,
							behavior: 'auto'
						});
					}
					App.callback(next);
				},
				leave: (next) => {
					const p = document.querySelector(getSelector());
					p.style.opacity = 0;
					p.style.display = 'none';
					App.callback(next);
				}
			};

			// insure this can't be overridden
			const overwrites = Object.freeze({
				key: () => pageData.key,
				selector: () => getSelector(),
				data: () => pageData,
				isInited: () => {
					return isInited;
				},
				setInited: () => {
					isInited = true;
				}
			});

			// New deep copy frozen object
			return Object.freeze(Object.assign({}, base, modelRef, overwrites));
		};

		// create the empty array for the model in the routes references
		activeRoutes[key] = [];

		return factory;
	};
	
	/**
	 * Creates a page with the specified model.
	 * @name createPage
	 * @memberof pages
	 * @method
	 * @param {Object} pageData An data bag for your page
	 * @param {String} keyModel The page model's unique key
	 * @param {Boolean} [override=false] Allows overriding an existing page instance
	 * @returns {?page} Null if something goes wrong
	 * @private
	 */
	const createPage = function (pageData, keyModel, override) {
		//Find the page model associated
		const pageModel = pageModels[keyModel];
		let pageInst;
		
		if (!pageModel) {
			App.log({args: ['Model `%s` not found', keyModel], fx: 'error'});
		} else {
			//Check to not override an existing page
			if (!!pageInstances[pageData.key] && !override) {
				App.log({
					args: ['Overwriting page key `%s` is not allowed', pageData.key],
					fx: 'error'
				});
			} else {
				pageInst = pageModel(pageData);
				if (!!pageInst) {
					pageInstances[pageData.key] = pageInst;
				}
				return pageInst;
			}
		}
		return false;
	};

	/**
	 * Registers a pageModel instance.
	 * @name registerPageModel
	 * @memberof pages
	 * @method
	 * @param {String} key The model unique key
	 * @param {pageModel} pageModel The page model
	 * @param {Boolean} [override=false] Allows overriding an existing page instance
	 *
	 * @returns {pageModel}
	 * @private
	 */
	const registerPageModel = function (key, pageModel, override) {
		const keyType = typeof key;
		if (keyType !== 'string') {
			App.log({
				args: ['`key` must be a string, `%s` given (%s).', keyType, key],
				fx: 'error'
			});
		// Found an existing page and cannot override it
		} else if (!!pageModels[key] && !override) {
			//error, should not override an existing key
			App.log({
				args: ['Overwriting page model key `%s` is not allowed', key],
				fx: 'error'
			});
		} else {
			// Store page to the list
			pageModels[key] = Object.freeze(pageModel);
			return pageModel;
		}
		return false;
	};
	
	/**
	 * Create a new pageModel, i.e. a function to create a new pages.
	 * It first calls {@link createPageModel} and then calls {@link registerPageModel}
	 * with the output of the first call.
	 * @name exportPage
	 * @memberof pages
	 * @method
	 * @param {String} key The model unique key
	 * @param {pageParam|pageCreator} model A page object that conforms with the pageParam type
	 *   or a pageCreator function that returns a page object.
	 * @param {Boolean} [override=false] Allows overriding an existing page instance
	 *
	 * @return {pageModel}
	 * @private
	 */
	const exportPage = function (key, model, override) {
		// Pass all args to the factory
		const pageModel = createPageModel(key, model, override);
		// Only work with pageModel afterwards
		return registerPageModel(key, pageModel, override);
	};
	
	const routeMatchStrategies = {
		regexp: function (testRoute, route, cb) {
			if (testRoute.test(route)) {
				return cb();
			}
			return true;
		},
		string: function (testRoute, route, cb) {
			let regex;
			// be sure to escape uri
			route = decodeURIComponent(route);
			
			// be sure we do not have hashed in the route
			route = route.split('#')[0];
			
			// avoid RegExp if possible
			if (testRoute === route) {
				return cb();
			}
			
			// assure we are testing from the beginning
			if (testRoute.indexOf('^') !== 0) {
				testRoute = '^' + testRoute;
			}
			
			// assure we are testing until the end
			if (testRoute.indexOf('^') !== testRoute.length - 1) {
				testRoute = testRoute + '$';
			}
			
			// wildcard replace
			// avoid overloading routes with regex
			if (testRoute.indexOf('*')) {
				// a-zA-Z0-9 ,:;.=%$|—_/\\-=?&\\[\\]\\\\#
				testRoute = testRoute.replace(new RegExp('\\*', 'gi'), '.*');
			}
			
			try {
				regex = new RegExp(testRoute);
			} catch (ex) {
				App.log({
					args: ['Error while creating RegExp %s.\n%s', testRoute, ex],
					fx: 'error'
				});
			}
			
			if (!!regex && regex.test(route)) {
				return cb();
			}
			return true;
		}
	};
	
	/**
	 * Tries to match the given route against the given
	 * array of possible routes.
	 * @name matchRoute
	 * @memberof pages
	 * @method
	 * @param {String} route The route to search match for
	 * @param {String[]|RegExp[]} routes The allowed routes
	 *
	 * @returns {Integer} The index of the matched route or -1 if no match
	 * @private
	 */
	const matchRoute = function (route, routes) {
		let index = -1;
		const found = function (i) {
			index = i;
			return false; // exit every
		};
		
		if (typeof route !== 'string') {
			App.log({args: '`route` must be a string', fx: 'error'});
			return index;
		}
		
		if (!!~route.indexOf('?')) {
			route = route.split('?')[0];
		}
		
		if (!!route && !!routes) {
			if (!Array.isArray(routes)) {
				routes = Object.values(routes);
			}
			routes.every(function matchOneRoute (testRoute, i) {
				const routeType = typeof testRoute;
				const routeStrategy = routeMatchStrategies[routeType];
				const cb = function () {
					return found(i);
				};
				
				if (typeof routeStrategy === 'function') {
					return routeStrategy(testRoute, route, cb);
				} else if (testRoute === route) {
					return cb();
				}
				return true;
			});
		}
		
		return index;
	};

	/**
	 * Add routes to a model
	 * @name addRoutes
	 * @memberof pages
	 * @method
	 * @param {String} keyModel model to add routes to
	 * @param {Array} routes to add to the model
	 * @returns {Array} all the active routes
	 * @private
	 */
	const addRoutes = (keyModel, routes) => {
		if (!pageModels[keyModel]) {
			App.log({fx: 'error', args: 'Model "' + keyModel + '" not found.'});
			return false;
		}

		if (!activeRoutes[keyModel]) {
			activeRoutes[keyModel] = [];
		}

		if (keyModel === 'default') {
			App.log({fx: 'error', args: 'You can\'t add routes to the default model'});
			return false;
		}

		// new set to remove duplicates in array
		activeRoutes[keyModel] = ([...new Set((activeRoutes[keyModel]).concat(routes))]);

		// todo 3.1.0 add verification if route is already used

		return activeRoutes[keyModel];
	};

	/**
	 * Remove routes to a model
	 * @name removeRoutes
	 * @memberof pages
	 * @method
	 * @param {String} keyModel model to remove routes to
	 * @param {Array} routes to remove to the model
	 * @returns {Array} all the active routes
	 * @private
	 */
	const removeRoutes = (keyModel, routes) => {
		if (!pageModels[keyModel]) {
			App.log({fx: 'error', args: 'Model "' + keyModel + '" not found.'});
			return false;
		}
		return false;
	};

	/**
	 * Returns the first page object that matches the href param
	 * @name getPageForHref
	 * @memberof pages
	 * @method
	 * @param {String} href The href to search match for
	 *
	 * @returns {page} The page object or a new page with associated model
	 * @private
	 */
	const getPageForHref = function (href) {

		// check if the instance already exists
		if (!!pageInstances[href]) {
			return pageInstances[href];
		}

		// make sure the href does not include the hash
		href = href.split('#')[0];

		// match with potential model
		let model = null;

		for (const m in activeRoutes) {
			if (activeRoutes.hasOwnProperty(m)) {
				const modelRoutes = activeRoutes[m];
				const match = !!~matchRoute(href, modelRoutes);
				if (!!match) {
					model = m;
					break;
				}
			}
		}

		if (!model) {
			model = 'default';
		}

		// create instance with matched model
		return createPage({key: href}, model, true);
	};

	const loaded = (url) => {
		return !!document.querySelector(App.root()).querySelector('[data-page-url="' + url + '"]');
	};

	registerPageModel('default', createPageModel('default', {}, true), {});

	/** Public Interfaces **/
	global.App = Object.assign({}, global.App, {
		pages: {

			/**
			 * Getter for all instances of a particular one
			 * @param [key] - the optinal key to search for.
			 *   If falsy, will return all instances
			 * @returns {page|page[]}
			 * @private
			 */
			instances: function (key) {
				if (!!key) {
					return pageInstances[key];
				}
				return pageInstances;
			},

			/**
			 * Returns all models
			 * @method
			 * @name models
			 * @memberof pages
			 * @returns {Object}
			 * @public
			 */
			models: function () {
				return pageModels;
			},

			/**
			 * Returns the first page object that matches the route param
			 * @name getPageForHref
			 * @memberof pages
			 * @method
			 * @param {String} route The route to search match for
			 *
			 * @returns {?page} The page object or null if not found
			 * @public
			 */
			getPageForHref: getPageForHref,

			/**
			 * Returns the page based the key and fallbacks to
			 * the [route]{@link getPageForHref} if noting is found.
			 * @name page
			 * @method
			 * @memberof pages
			 * @param {string} keyOrRoute - the key or the route of the page
			 * @returns {page}
			 * @public
			 */
			page: function (keyOrRoute) {
				//Try to get the page by the key
				let result = pageInstances[keyOrRoute];

				//if no result found try with the route
				if (!!!result) {
					result = getPageForHref(keyOrRoute);
				}
				
				return result;
			},

			/**
			 * Creates a page with the specified model.
			 * @name create
			 * @memberof pages
			 * @method
			 * @param {Object} pageData An data bag for your page
			 * @param {String} keyModel The page model's unique key
			 * @param {Boolean} [override=false] Allows overriding an existing page instance
			 * @returns {?page} Null if something goes wrong
			 * @public
			 */
			create: createPage,

			/**
			 * Create a new pageModel, i.e. a function to create a new pages.
			 * It first calls {@link createPageModel} and then calls {@link registerPageModel}
			 * with the output of the first call.
			 * @name exports
			 * @memberof pages
			 * @method
			 * @param {String} key The model unique key
			 * @param {pageParam|pageCreator} model A page object that conforms
			 *   with the pageParam type or a pageCreator function that returns a page object.
			 * @param {pageParam|pageCreator} model A page object that conforms with the
			 *   pageParam type or a pageCreator function that returns a page object.
			 * @param {Boolean} [override=false] Allows overriding an existing page instance
			 *
			 * @return {pageModel}
			 * @public
			 */
			exports: exportPage,

			/**
			 * Check if the page is loaded from a given url
			 * @name exports
			 * @memberof pages
			 * @method
			 * @param {String} url the url to check
			 * @return {Boolean}
			 * @public
			 * @since 3.0.0
			 */
			loaded: loaded,

			/**
			 * App pages routes
			 *
			 * @namespace routes
			 * @memberof pages
			 * @since 3.0.0
			 */
			routes: {

				/**
				 * Get all the active routes
				 * @name active
				 * @memberof routes
				 * @method
				 * @returns {Object} all the active routes for all models
				 * @public
				 */
				active: () => activeRoutes,

				/**
				 * @name match
				 * @method
				 * @memberof routes
				 * {@link App.pages~matchRoute}
				 * @public
				 */
				match: matchRoute,

				/**
				 * Add routes to a model
				 * @name addRoutes
				 * @memberof routes
				 * @method
				 * @param {String} keyModel model to add routes to
				 * @param {Array} routes to add to the model
				 * @returns {Array} all the active routes
				 * @public
				 */
				add: addRoutes,

				/**
				 * Remove routes to a model
				 * @name removeRoutes
				 * @memberof routes
				 * @method
				 * @param {String} keyModel model to remove routes to
				 * @param {Array} routes to remove to the model
				 * @returns {Array} all the active routes
				 * @public
				 */
				remove: removeRoutes
			}
		}
	});
	
})(window);

/**
 * Facade to access the browser's localStorage and sessionStorage
 *
 * The facade wraps unsafe calls to catch errors and return empty but valid values.
 *
 * @fileoverview Storage facade compatible with localStorage and sessionStorage
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 *
 * @namespace storage
 * @memberof App
 * @requires App
 */
(function (global, undefined) {
	'use strict';

	const storage = function (storage) {
		return {

			/**
			 * Return the value associated with the given key
			 * @name get
			 * @memberof storage
			 * @method
			 * @param {string} key Access key to the storage object
			 * @return {String}
			 * @public
			 */
			get: function (key) {
				if (!key) {
					return;
				}
				key += ''; // make it a string
				return storage[key];
			},

			/**
			 * Set and save a value to the given key in the storage
			 * @name set
			 * @memberof storage
			 * @method
			 * @param {string} key Access key to the storage object
			 * @param {*} value Value wanted to be saved
			 * @return {Boolean}
			 * @public
			 */
			set: function (key, value) {
				let result = false;
				if (!!key) {
					key += ''; // make it a string
					try {
						storage[key] = !value ? '' : value + '';
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

			/**
			 * Delete the storage data associated with the given key
			 * @name remove
			 * @memberof storage
			 * @method
			 * @param {string} key Access key to the storage object
			 * @return {Boolean}
			 * @public
			 */
			remove: function (key) {
				let result = false;
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
			},

			/**
			 * Delete the data from the storage matching
			 * the Regular Expression or all the data if none is provided
			 * @name clear
			 * @memberof storage
			 * @method
			 * @param {RegExp} regexp Regular Expression to match the key
			 * @return {Boolean}
			 * @public
			 */
			clear: function (regexp) {
				let result = false;
				try {
					if (!regexp) {
						storage.clear();
					} else {
						const remove = [];
						for (let i = 0; i < storage.length; i++) {
							const key = storage.key(i);
							if (regexp.test(key)) {
								remove.push(key);
							}
						}
						for (let i = 0; i < remove.length; i++) {
							storage.removeItem(remove[i]);
						}
					}
					result = true;
				} catch (e) {
					App.log({
						args: e.message,
						me: 'Storage',
						fx: 'error'
					});
					result = false;
				}
				return result;
			}
		};
	};

	const safeLocalStorage = function () {
		try {
			return storage(window.localStorage);
		} catch (e) {
			App.log({
				args: e.message,
				me: 'Storage',
				fx: 'error'
			});
		}
		return storage({});
	};

	const safeSessionStorage = function () {
		try {
			return storage(window.sessionStorage);
		} catch (e) {
			App.log({
				args: e.message,
				me: 'Storage',
				fx: 'error'
			});
		}
		return storage({});
	};

	global.App = Object.assign({}, global.App, {
		storage: {

			/**
			 * Factory of the storage object
			 * @name factory
			 * @method
			 * @memberof storage
			 * @returns {Object} All storage's methods
			 * @public
			 */
			factory: storage,

			/**
			 * Storage methods in localStorage mode
			 * @name local
			 * @constant
			 * @public
			 * @memberof storage
			 */
			local: safeLocalStorage(),

			/**
			 * Storage methods in sessionStorage mode
			 * @name session
			 * @constant
			 * @public
			 * @memberof storage
			 */
			session: safeSessionStorage()
		}
	});
	
})(window);

/**
 * Superlight App Framework
 *
 * @fileoverview Defines the App
 *
 * @author Deux Huit Huit <https://deuxhuithuit.com>
 * @license MIT <https://deuxhuithuit.mit-license.org>
 *
 * @namespace App
 */
(function (global, undefined) {
	'use strict';
	
	//Default value
	let ROOT = 'body';
	
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
	const initApplication = function (root) {
		// assure root node
		if (!!root && !!document.querySelector(root)) {
			ROOT = root;
		}

		// init each Modules
		Object.values(App.modules.models()).forEach(function initModule (m) {
			m.init();
		});

		const firstPage = App.pages.getPageForHref(window.location.href);

		if (!!firstPage && !!App.pages.loaded(firstPage.key())) {
			firstPage.init({firstTime: true});
			firstPage.setInited();
			App.mediator.init(firstPage);
		}

		// init each Page already loaded and with body set page instance
		Object.values(App.pages.instances()).forEach(function initPage (page) {
			if (!!App.pages.loaded(page.key()) && page.key() !== firstPage.key()) {
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
			App.log({ fx: 'error', args: 'No current page set, pages will not work.' });
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
	const run = function (root) {
		initApplication(root);
		return global.App;
	};
	
	/** Public Interfaces **/
	global.App = Object.assign({}, global.App, {
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
	
})(window);
