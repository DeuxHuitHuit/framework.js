framework.js
============

Deux Huit Huit javascript framework allowing to load and change page with ajax request with simplicity.

The framework use jQuery and extends some functionnality.

Global.js :

Add some flag value on the jquery object to detect de browser used

$.unsupported : true if it's MSIE less than version 9

$.iphone : true for userAgent containing 'iPhone' or 'iPod'

$.ios : true when iPhone is true or userAgent contain 'iPad'

$.mobile : true when ios is true or userAgent contain 'Android','mobile' or 'phone'

