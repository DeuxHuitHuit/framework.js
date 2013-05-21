/*global module:false*/
module.exports = function(grunt) {

	"use strict";
	
	var
	SRC = ['src/globals.js','src/app-debug.js', 'src/app-callback.js', 'src/loader.js', 'src/app.js' ],
	serverPort = 8080,
	server = 'http://localhost:' + serverPort,
	testFile = [server + '/tests/framework.global.js.test.html?noglobals=true',
				server + '/tests/framework.debug.js.test.html?noglobals=true',
				server + '/tests/framework.callback.js.test.html?noglobals=true',
				server + '/tests/framework.app.js.test.html?noglobals=true'/*,
				server + '/tests/loader.js.test?noglobals=true'*/],
	
	testUrls = [];
	
	for(var c = 0; c < testFile.length; c++) {
		testUrls.push(testFile[c]);
		testUrls.push(testFile[c] + '&jquery=1.9.1');
		testUrls.push(testFile[c] + '&jquery=1.8');
		testUrls.push(testFile[c] + '&jquery=1.7');
	}
	
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-complexity');
	
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
					urls: testUrls
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
				sourceMap: 'dist/framework.map',
				sourceMappingURL: 'framework.map',
				report: 'gzip',
				mangle: true,
				compress: {
					global_defs: {
						"DEBUG": false
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
					port: serverPort,
					base: '.'
				}
			}
		},
		complexity: {
            generic: {
                src: ['src/*'],
                options: {
                    jsLintXML: 'report.xml', // create XML JSLint-like report
                    errorsOnly: false, // show only maintainability errors
                    cyclomatic: 10,
                    halstead: 25,
                    maintainability: 100
                }
            }
        }

	});

	// Default task.
	grunt.registerTask('default', ['jshint', 'connect', 'qunit','complexity', 'concat', 'uglify']);
	grunt.registerTask('debug', ['jshint', 'connect', 'qunit', 'complexity']);
	grunt.registerTask('compile', ['jshint', 'concat', 'uglify']);

};