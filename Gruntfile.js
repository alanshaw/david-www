module.exports = function(grunt) {

	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),

		// Copy files that don't need compilation to dist/
		copy: {
			dist: {
				files: [
					// Copy all (non hidden) files (not directories) from src
					{dest: 'dist/', src: '*', filter: 'isFile', expand: true, cwd: 'src/'},

					// Copy the following hidden files
					{dest: 'dist/.htaccess', src: 'src/.htaccess'},

					// Copy any JavaScript libs
					{dest: 'dist/', src: 'js/vendor/*.min.js', expand: true, cwd: 'src/'},

					// Copy any CSS files (not LESS src)
					{dest: 'dist/', src: 'css/**/*.css', expand: true, cwd: 'src/'},

					// Copy other resources
					{dest: 'dist/', src: 'img/**', expand: true, cwd: 'src/'},
					{dest: 'dist/', src: 'font/**', expand: true, cwd: 'src/'}
				]
			}
		},

		includereplace: {
			dist: {
				options: {
					globals: {
						version: '<%= pkg.version %>',
						headHtml: ''
					}
				},
				files: [
					{src: '*.html', dest: 'dist/', expand: true, cwd: 'src/'},
					{src: 'inc/*.html', dest: 'dist/', expand: true, cwd: 'src/'}
				]
			}
		},

		// Compile the mobile first site stylesheet (and the no @media queries version for lt-ie8)
		less: {
			compile: {
				files: {
					'dist/css/main.css': 'src/css/main.less',
					'dist/css/ie.css': 'src/css/ie.less'
				}
			}
		},

		// Minify the site script
		uglify: {
			options: {
				compress: false,
				mangle: false,
				preserveComments: false,
				beautify: true,
				report: 'min'
			},
			compress: {
				src: [
					'src/js/plugins.js',
					'src/js/vendor/cycle.js',
					'src/js/vendor/d3.js',
					'src/js/vendor/handlebars.js',
					'src/js/vendor/jquery.ba-bbq.js',
					'src/js/vendor/jquery.ba-hashchange.js',
					'src/js/vendor/jquery.fancybox.js',
					'src/js/vendor/jquery.feed.js',
					'src/js/vendor/lodash.js',
					'src/js/vendor/moment.js',
					'src/js/vendor/stackable.js',
					'src/js/main.js',
					'src/js/homepage.js',
					'src/js/status.js',
					'src/js/search.js'
				],
				dest: 'dist/js/pack.js'
			}
		},

		// Minify the site CSS
		cssmin: {
			compress: {
				options: {
					keepSpecialComments: 0,
					report: 'min'
				},
				files: {
					'dist/css/main.css': 'dist/css/main.css',
					'dist/css/ie.css': 'dist/css/ie.css'
				}
			}
		},

		// Lint the server JavaScript
		jshint: {
			files: ['*.js', 'src/js/*.js', '!src/js/plugins.js'],
			options: {
				'browser': false,
				'maxerr': 100,
				'node': true,
				/*'camelcase': true,*/
				'curly': true,
				'eqeqeq': true,
				'eqnull': true,
				'forin': true,
				'immed': true,
				'indent': 4,
				/*'latedef': true,*/
				'laxbreak': true,
				'laxcomma': true,
				'lastsemic': true,
				'loopfunc': true,
				'noarg': true,
				'newcap': true,
				'plusplus': false,
				'quotmark': 'single',
				'regexp': true,
				'shadow': true,
				'smarttabs': true,
				'strict': false,
				'sub': true,
				'trailing': true,
				'undef': true,
				'unused': true,
				ignores: ['.git', 'node_modules']
			}
		},

		// Test the things
		nodeunit: {
			all: ['test/**/*_test.js']
		},

		// Watch JS, LESS & HTML files for changes, copy & compile but not minify for easy debug during dev
		watch: {
			project: {
				options: {atBegin: true},
				files: ['src/js/**/*.js', 'src/css/**/*.less', 'src/**/*.html', 'src/img/**/*'],
				tasks: ['copy', 'includereplace', 'less', 'uglify']
			}
		},

		clean: {
			dist: 'dist/*'
		}
	});

	// Load the grunt-conrtib plugin so we can compile and compress CoffeeScript and LESS files
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-include-replace');
	grunt.loadNpmTasks('grunt-contrib-nodeunit');
	grunt.loadNpmTasks('grunt-contrib-clean');

	grunt.registerTask('default', ['jshint', 'nodeunit', 'copy', 'includereplace', 'less', 'uglify', 'cssmin']);
};
