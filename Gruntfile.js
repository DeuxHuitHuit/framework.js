/*global module:false*/

var fs = module.require('fs');
var path = module.require('path');
var os = module.require('os');

module.exports = function fxGruntConfig(grunt) {
	
	'use strict';
	
	// VAR
	var GRUNT_FILE = 'Gruntfile.js';
	
	var BUILD_FILE = './dist/build.json';
	
	var SRC_FOLDERS = ['./src/'];
	var SRC_FILES = [];
	
	// TESTS
	var SERVER_PORT = 8080;
	var SERVER_URI = 'http://localhost:' + SERVER_PORT;
	var TEST_PATHS = [
		'/tests/framework.global.js.test.html?noglobals=true',
		'/tests/framework.debug.js.test.html?noglobals=true',
		'/tests/framework.callback.js.test.html?noglobals=true',
		'/tests/framework.app.js.test.html?noglobals=true',
		'/tests/loader.js.test.html?noglobals=true'
	];
	
	var TEST_FILES = [];
	var TEST_URIS = [];
	
	// load grunt task
	var loadGruntTasks = function (grunt) {
		grunt.loadNpmTasks('grunt-contrib-connect');
		grunt.loadNpmTasks('grunt-contrib-uglify');
		grunt.loadNpmTasks('grunt-contrib-jshint');
		grunt.loadNpmTasks('grunt-contrib-qunit');
		grunt.loadNpmTasks('grunt-contrib-concat');
		grunt.loadNpmTasks('grunt-complexity');
		grunt.loadNpmTasks('grunt-karma');
	};
	
	var createSrcFiles = function () {
		SRC_FOLDERS.forEach(function (folder) {
			var p = path.normalize(folder);
			var files = fs.readdirSync(p);
			
			files.forEach(function (file) {
				SRC_FILES.push(path.normalize(p + file));
			});
		});
	};
	
	// for karma
	var createTestFiles = function () {
		for (var c = 0; c < TEST_PATHS.length; c++) {
			TEST_FILES.push(TEST_PATHS[c]);
			TEST_FILES.push(TEST_PATHS[c] + '&jquery=1.10.2');
			TEST_FILES.push(TEST_PATHS[c] + '&jquery=1.9.1');
			TEST_FILES.push(TEST_PATHS[c] + '&jquery=1.8');
		}
	};
	
	// for qunit
	var createTestUris = function () {
		for (var c = 0; c < TEST_PATHS.length; c++) {
			TEST_URIS.push(SERVER_URI + TEST_PATHS[c]);
			TEST_URIS.push(SERVER_URI + TEST_PATHS[c] + '&jquery=1.10.2');
			TEST_URIS.push(SERVER_URI + TEST_PATHS[c] + '&jquery=1.9.1');
			TEST_URIS.push(SERVER_URI + TEST_PATHS[c] + '&jquery=1.8');
		}
	};
	
	var getBuildNumber = function () {
		var b = {}
		
		try {
			b = grunt.file.readJSON(BUILD_FILE);
		} catch (e) {}
		
		b.lastBuild = b.lastBuild > 0 ? b.lastBuild + 1 : 1;
		
		grunt.file.write(BUILD_FILE, JSON.stringify(b));
		
		return b.lastBuild;
	};
	
	var config = {
		pkg: grunt.file.readJSON('package.json'),
		build: 'auto',
		meta: {
			banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> ' +
			'- build <%= build %> - ' +
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
				sourceMap: 'dist/framework.map',
				sourceMappingURL: 'framework.map',
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
					maintainability: 90
				}
			}
		},
		karma: {
			unit: {
				//configFile: 'karma.conf.js',
				files: TEST_FILES,
				frameworks: ['qunit'],
				runnerPort: SERVER_PORT,
				singleRun: true,
				browsers: ['PhantomJS']
			},
			linux: {
				files: TEST_FILES,
				frameworks: ['qunit'],
				runnerPort: SERVER_PORT,
				singleRun: true,
				browsers: ['Chrome', 'Firefox', 'PhantomJS']
			},
			win32: {
				files: TEST_FILES,
				frameworks: ['qunit'],
				//runnerPort: SERVER_PORT,
				singleRun: true,
				basePath: '',
				browsers: ['Chrome', 'Firefox', 'IE']
			},
			darwin: {
				files: TEST_FILES,
				frameworks: ['qunit'],
				runnerPort: SERVER_PORT,
				singleRun: true,
				browsers: ['Chrome', 'Firefox', 'Safari', 'PhantomJS']
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
			grunt.log.write(sourceMap.sources);
			grunt.file.write(sourceMapPath, JSON.stringify(sourceMap));
		});
		
		// Default task.
		grunt.registerTask('default',   ['dev', 'build']);
		grunt.registerTask('dev',	   ['jshint', 'connect', 'qunit', 'complexity']);
		grunt.registerTask('build',	 ['concat', 'uglify', 'fix-source-map']);
		grunt.registerTask('test',	  ['jshint', 'connect', 'qunit']);
		
		// karma requires some env variables
		// export PHANTOMJS_BIN=/usr/bin/phantomjs
		// export CHROME_BIN=/usr/bin/chromium-browser
		
		// IE requires ENV VAR on Windows too
		// SETX IE_BIN "C:\Program Files\Internet Explorer\iexplore.exe"
		// SETX FIREFOX_BIN "C:\Program Files (x86)\Mozilla Firefox\firefox.exe"
		grunt.registerTask('karma-test', ['jshint', 'karma:' + os.platform() || 'unit']);
	};
	
	var load = function (grunt) {
		loadGruntTasks(grunt);
		
		createSrcFiles();
		createTestUris();
		createTestFiles();
		
		config.build = getBuildNumber();
		
		init(grunt);
		
		console.log('Running grunt on ' + os.platform());
	};
	
	// load the set-up
	load(grunt);
};