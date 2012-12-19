/*global module:false*/
module.exports = function(grunt) {

	"use strict";
	
	var SRC = ['src/globals.js', 'src/loader.js', 'src/modules.js' ];
	
	// Project configuration.
	grunt.initConfig({
		pkg: '<json:package.json>',
		meta: {
			banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
			'<%= grunt.template.today("yyyy-mm-dd") %>\n' +
			'<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
			'* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
			' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
		},
		min: {
			dist: {
				src: ['<banner:meta.banner>'].concat(SRC),
				dest: 'dist/<%= pkg.name %>.min.js'
			}
		},
		lint: {
			files: ['grunt.js'].concat(SRC)
		},
		jshint: {
			options: {
				curly: true,
				eqeqeq: false, // allow ==
				immed: false, //
				latedef: false, // late definition
				newcap: false, // capitalize ctos
				nonew: true, // no new ..()
				noarg: true, 
				sub: true,
				undef: true,
				//boss: true,
				eqnull: true, // relax
				browser: true,
				regexp: true,
				strict: true,
				trailing: false,
				smarttabs: true,
				lastsemic: true
			},
			globals: {
				jQuery: true,
				console: true,
				App: true,
				Loader: true
			}
		},
		uglify: {}
	});

	// Default task.
	grunt.registerTask('default', 'lint min');

};