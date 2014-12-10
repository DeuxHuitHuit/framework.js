/*global module:false*/

var fs = module.require('fs');
var path = module.require('path');
var os = module.require('os');
var md = module.require('matchdep');

module.exports = function fxGruntConfig(grunt) {
	
	'use strict';
	
	// VAR
	var GRUNT_FILE = 'Gruntfile.js';
	
	var BUILD_FILE = './dist/build.json';
	
	var SRC_FILES = ['./src/*.js'];
	
	// TESTS
	var SERVER_PORT = 8080;
	var SERVER_URI = 'http://localhost:' + SERVER_PORT;
	var TEST_PATHS = [
		'/tests/framework.global.js.test.html?noglobals=true',
		'/tests/framework.debug.js.test.html?noglobals=true',
		'/tests/framework.callback.js.test.html?noglobals=true',
		'/tests/framework.app.js.test.html?noglobals=true',
		'/tests/loader.js.test.html?noglobals=true',
		'/tests/storage.js.test.html?noglobals=true'
	];
	
	var TEST_URIS = [];
	
	// for qunit
	var createTestUris = function () {
		for (var c = 0; c < TEST_PATHS.length; c++) {
			TEST_URIS.push(SERVER_URI + TEST_PATHS[c]);
			TEST_URIS.push(SERVER_URI + TEST_PATHS[c] + '&jquery=2.0.3');
			TEST_URIS.push(SERVER_URI + TEST_PATHS[c] + '&jquery=1.11.1');
			TEST_URIS.push(SERVER_URI + TEST_PATHS[c] + '&jquery=1.10.2');
			TEST_URIS.push(SERVER_URI + TEST_PATHS[c] + '&jquery=1.9.1');
			TEST_URIS.push(SERVER_URI + TEST_PATHS[c] + '&jquery=1.8');
		}
	};
	
	var config = {
		pkg: grunt.file.readJSON('package.json'),
		buildnum: {
			options: {
				file: BUILD_FILE
			}
		},
		meta: {
			banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> ' +
			'- build <%= buildnum.num %> - ' +
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
				src: SRC_FILES,
				dest: 'dist/<%= pkg.name %>.js'
			}
		},
		qunit: {
			all: {
				options: {
					urls: TEST_URIS
				}
			}
		},
		watch: {
			files: SRC_FILES.concat(GRUNT_FILE),
			tasks: ['jshint', 'complexity']
		},
		jshint: {
			files: SRC_FILES.concat(GRUNT_FILE),
			//force: true,
			options: {
				bitwise: false,
				camelcase: false,
				curly: true,
				eqeqeq: false, // allow ==
				forin: true,
				//freeze: true,
				immed: false, //
				latedef: true, // late definition
				newcap: true, // capitalize ctos
				noempty: true,
				nonew: true, // no new ..()
				noarg: true, 
				plusplus: false,
				quotmark: 'single',
				undef: true,
				maxparams: 5,
				maxdepth: 5,
				maxstatements: 30,
				maxlen: 100,
				//maxcomplexity: 10,
				
				// relax options
				//boss: true,
				//eqnull: true, 
				esnext: true,
				regexp: true,
				strict: true,
				trailing: false,
				sub: true, // [] notation
				smarttabs: true,
				lastsemic: false, // enforce semicolons
				white: true,
				
				// env
				browser: true,
				
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
				banner: '<%= meta.banner %>',
				sourceMap: 'dist/<%= pkg.name %>.map',
				sourceMappingURL: '<%= pkg.name %>.map',
				report: 'gzip',
				mangle: true,
				compress: {
					global_defs: {
						DEBUG: false
					},
					dead_code: true,
					unused: true,
					warnings: true
				},
				preserveComments: false
			}
		},
		connect: {
			server: {
				options: {
					port: SERVER_PORT,
					base: '.'
				}
			}
		},
		complexity: {
			generic: {
				src: SRC_FILES.concat(GRUNT_FILE),
				options: {
					//jsLintXML: 'report.xml', // create XML JSLint-like report
					errorsOnly: false, // show only maintainability errors
					cyclomatic: 10,
					halstead: 25,
					maintainability: 89
				}
			}
		}
	};
	
	var init = function (grunt) {
		// Project configuration.
		grunt.initConfig(config);
		
		// fix source map url
		grunt.registerTask('fix-source-map', 
			'Fixes the wrong file path in the source map', function () {
			var sourceMapPath = grunt.template.process('<%= uglify.options.sourceMap %>');
			var sourceMapUrl = grunt.template.process('<%= uglify.options.sourceMappingURL %>');
			var diff = sourceMapPath.replace(sourceMapUrl, '');
			var sourceMap = grunt.file.readJSON(sourceMapPath);
			sourceMap.file = sourceMap.file.replace(diff, '');
			var newSources = [];
			sourceMap.sources.forEach(function (elem) {
				newSources.push(elem.replace(diff, ''));
			});
			sourceMap.sources = newSources;
			grunt.file.write(sourceMapPath, JSON.stringify(sourceMap));
		});

		// generate build number
		grunt.registerTask('buildnum', 
			'Generates and updates the current build number', function () {
			var options = this.options();
			var getBuildNumber = function () {
				var b = {};
				
				try {
					b = grunt.file.readJSON(options.file);
				} catch (e) {}
				
				b.lastBuild = b.lastBuild > 0 ? b.lastBuild + 1 : 1;
				
				grunt.file.write(options.file, JSON.stringify(b));
				
				return b.lastBuild;
			};

			var buildnum = getBuildNumber();
			grunt.config.set('buildnum.num', buildnum);
			grunt.log.writeln('New build num:', buildnum);
			grunt.log.writeln('For version:', config.pkg.version);
		});
		
		// Default task.
		grunt.registerTask('default',   ['dev', 'build']);
		grunt.registerTask('dev',       ['jshint', 'connect', 'qunit', 'complexity']);
		grunt.registerTask('build',     ['buildnum', 'concat', 'uglify', 'fix-source-map']);
		grunt.registerTask('test',      ['jshint', 'connect', 'qunit']);
	};
	
	var load = function (grunt) {
		md.filterDev('grunt-*').forEach(grunt.loadNpmTasks);
		
		createTestUris();
		
		init(grunt);
		
		console.log('Running grunt on ' + os.platform());
	};
	
	// load the set-up
	load(grunt);
};