
(function (w, doc,co) {
	// https://stackoverflow.com/questions/901115/get-query-string-values-in-javascript
	var u = {},
		e, t,
		a = /\+/g,  // Regex for replacing addition symbol with a space
		r = /([^&=]+)=?([^&]*)/g,
		d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
		q = w.location.search.substring(1),
		v = '2.2.4';

	while (e = r.exec(q)) {
		u[d(e[1])] = d(e[2]);
	}
	
	if (!!u.jquery) {
		v = u.jquery;
	}
	if (v === 'local') {
		t = './jquery.js';
	} else {
		t = 'https://ajax.googleapis.com/ajax/libs/jquery/'+ v +'/jquery.js'
	}
	doc.write('<script src="' + t +'">' + '<' + '/' + 'script>');
	co.log('\nLoading jQuery v' + v + '\n');
})(window, document, console);
