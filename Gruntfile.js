/*global module:false*/
module.exports = function(grunt) {

	"use strict";
	
	var
	SRC = ['src/globals.js', 'src/loader.js', 'src/app.js' ],
	serverPort = 8080,
	server = 'http://localhost:' + serverPort,
	testFile = server + '/tests/framework.js.test.html?noglobals=true';
	
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-concat');
	
	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		meta: {
			banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
			'<%= grunt.template.today("yyyy-mm-dd") %>\n' +
			'<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
			'* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
			' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n'
		},
		concat: {
			options: {
				process: true,
				banner: '<%= meta.banner %>'
			},
			dist: {
				src: SRC,
				dest: 'dist/<%= pkg.name %>.js'
			}
		},
		qunit: {
			all: {
				options: {
					urls: [testFile, testFile + '&jquery=1.8', testFile + '&jquery=1.7']
				}
			}
		},
		jshint: {
			files: ['Gruntfile.js'].concat(SRC),
			//force: true,
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
				lastsemic: true,
				
				globals: {
					jQuery: true,
					console: true,
					App: true,
					Loader: true
				}
			}
		},
		uglify: {
			prod: {
				files: {
					'dist/<%= pkg.name %>.min.js': '<%= concat.dist.dest %>' 
				}
			},
			options: {
				//banner: '<% meta.banner %>',
				sourceMap: 'dist/framework.map.js',
				sourceMapRoot: '.',
				report: 'gzip',
				compress: {
					global_defs: {
						"DEBUG": false
					},
					dead_code: true
				}
			}
		},
		connect: {
			server: {
				options: {
					port: serverPort,
					base: '.'
				}
			}
		}
	});

	// Default task.
	grunt.registerTask('default', ['jshint', 'connect', 'qunit', 'concat', 'uglify']);

};