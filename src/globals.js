/**
 * @author Deux Huit Huit
 */
 
 /*
 * Browser Support/Detection
 */
;(function ($, w, undefined) {
	
	"use strict";

	var 
	QueryStringParserConstructor = function() {
		var
		a = /\+/g,  // Regex for replacing addition symbol with a space
		r = /([^&=]+)=?([^&]*)/g,
		d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
		
		_parse = function(qs) {
			var 
			u = {},
			e,
			q;
			
			//if we dont have the parameter qs, use the window location search value
			if(qs !== "" && !!!qs) {
				qs = w.location.search;
			}
			
			//remove the first caracter (?)
			q = qs.substring(1);

			while ((e = r.exec(q))) {
				u[d(e[1])] = d(e[2]);
			}
			
			return u;
		};
		
		return {
			parse : _parse
		};
	},
	
	BrowserDetectorConstructor = function() {
		var
		getUserAgent = function(userAgent) {
			if(userAgent !== "" && !!!userAgent) {
				userAgent = navigator.userAgent;
			}
			return userAgent;
		};
		
	
		return {
	
			isIos : function(userAgent) {
				return w.BrowserDetector.isIphone(userAgent) || w.BrowserDetector.isIpad(userAgent);
			},
			
			isIphone : function(userAgent) {
				userAgent = getUserAgent(userAgent);
				return !!(userAgent.match(/iPhone/i) || userAgent.match(/iPod/i));
			},
			
			isIpad : function(userAgent) {
				userAgent = getUserAgent(userAgent);
				return !!(userAgent.match(/iPad/i));
			},
			
			isAndroid : function(userAgent) {
				userAgent = getUserAgent(userAgent);
				return !!(userAgent.match(/Android/i));
			},
			
			isOtherMobile : function(userAgent) {
				userAgent = getUserAgent(userAgent);
				return !!(userAgent.match(/mobile/i) || userAgent.match(/phone/i));
			},
			
			isMobile : function(userAgent) {
				return w.BrowserDetector.isIos(userAgent) || w.BrowserDetector.isAndroid(userAgent) || w.BrowserDetector.isOtherMobile(userAgent);
			},
			
			isMsie : function(userAgent) {
				userAgent = getUserAgent(userAgent);
				return $.uaMatch(userAgent).browser == 'msie';
			},
			
			isUnsupported : function(userAgent) {
				var 
				b;
				userAgent = getUserAgent(userAgent);
				b = $.uaMatch(userAgent);
				
				return b.browser === "" || (b.browser == 'msie' && parseInt(b.browser.version,10)) < 9;
			}
		};
	};
	
	// Query string Parser
	// http://stackoverflow.com/questions/901115/get-query-string-values-in-javascript
	w.QueryStringParser = QueryStringParserConstructor();
	
	//Store a copy of the result in the window object
	w.QS = w.QueryStringParser.parse();
	
	
	// Browser detector
	w.BrowserDetector = BrowserDetectorConstructor();
	
	// User Agent parsing
	$.unsupported = w.BrowserDetector.isUnsupported();
	
	$.iphone =  w.BrowserDetector.isIphone();
	
	$.ipad =  w.BrowserDetector.isIpad();
	
	$.ios    =  w.BrowserDetector.isIos();
	
	$.mobile =  w.BrowserDetector.isMobile();
	
})(jQuery, window);
	
/**
 * General customisation for mobile and default easing
 */
(function ($, undefined) {
	
	"use strict";
	
	// add mobile css class to html
	if ($.mobile) {
		$('html').addClass('mobile');
	}
	
	// easing support
	$.easing.def = ($.mobile ? 'linear' : 'easeOutQuad');
	
})(jQuery);
	
/**
 * Global tools for debug
 */
 (function ($, undefined) {
	
	"use strict";
	
	// console support
	if (!window.console) {
		window.console = {};
		window.console.log = window.console.warn = window.console.error = 
			window.console.info = window.console.dir = window.console.time = 
			window.console.timeEnd = $.noop;
	}
	
})(jQuery);

/**
 * Global window tools
 */
 (function ($, undefined) {
	
	"use strict";
	
	var 
	hex = function(x) {
		return ("0" + parseInt(x, 10).toString(16)).slice(-2);
	};
		
	window.rgb2hex = function (rgb) {
		var hexa = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
		if (!hexa) {
			return rgb;
		}
		return hex(hexa[1]) + hex(hexa[2]) + hex(hexa[3]);
	};
	
	window.pd = function (e) {
		if (!!e) {
			if ($.isFunction(e.preventDefault)) {
				e.preventDefault();
			}
			if ($.isFunction(e.stopPropagation)) {
				e.stopPropagation();
			}
		}
		return false;
	};
	
	/**
	 * Keyboard keys
	 */
	// from https://github.com/drobati/django-homepage/blob/1a75e9ba31c24cb77d87ff3eb435333932056af7/media/js/jquery.keyNav.js
	window.keys = {"?": 0,"backspace": 8,"tab": 9,"enter": 13,"shift": 16,"ctrl": 17,"alt": 18,"pause_break": 19,
			"caps_lock": 20,"escape": 27,"space_bar": 32, "page_up": 33,"page_down": 34,"end": 35,"home": 36,"left_arrow": 37,
			"up_arrow": 38,"right_arrow": 39,"down_arrow": 40,"insert": 45,"delete": 46,"0": 48,"1": 49,"2": 50,
			"3": 51,"4": 52,"5": 53,"6": 54,"7": 55,"8": 56,"9": 57,"a": 65,"b": 66,"c": 67,"d": 68,"e": 69,"f": 70,
			"g": 71,"h": 72,"i": 73,"j": 74,"k": 75,"l": 76,"m": 77,"n": 78,"o": 79,"p": 80,"q": 81,"r": 82,"s": 83,
			"t": 84,"u": 85,"v": 86,"w": 87,"x": 88,"y": 89,"z": 90,"left_window_key": 91,"right_window_key": 92,
			"select_key": 93,"numpad_0": 96,"numpad_1": 97,"numpad_2": 98,"numpad_3": 99,"numpad 4": 100,"numpad_5": 101,
			"numpad_6": 102,"numpad_7": 103,"numpad_8": 104,"numpad_9": 105,"multiply": 106,"add": 107,"subtract": 109,
			"decimal point": 110,"divide": 111,"f1": 112,"f2": 113,"f3": 114,"f4": 115,"f5": 116,"f6": 117,"f7": 118,
			"f8": 119,"f9": 120,"f10": 121,"f11": 122,"f12": 123,"num_lock": 144,"scroll_lock": 145,"semi_colon": 186,
			";": 186,"=": 187,"equal_sign": 187,"comma": 188,",": 188,"dash": 189,".": 190,"period": 190,"forward_slash": 191,
			"/": 191,"grave_accent": 192,"open_bracket": 219,"back_slash": 220,"\\": 220,"close_braket": 221,"single_quote":222};

	window.keyFromCode = function (code) {
		var key = '?';
		if (!code) {
			return key;
		}
		$.each(window.keys, function (index, value) {
			if (code === value) {
				key = index;
				return false;
			}
				
			return true;
		});
		return key;
	};
	
	// Chars
	window.isChar = function (char) {
		return char === window.keys.space_bar || (char > window.keys['0'] && window.keys.z);
	};
	
 })(jQuery);
