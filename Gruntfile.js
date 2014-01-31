module.exports = function(grunt) {

	grunt.initConfig({

		conf: require('config'),

		pkg: grunt.file.readJSON('package.json'),

		// Copy files that don't need compilation to dist/
		copy: {
			dist: {
				files: [
					// Copy all (non hidden) files (not directories) from src
					{dest: 'dist/', src: ['*', '!LICENSE.md'], filter: 'isFile', expand: true, cwd: 'src/'},

					// Copy any JavaScript libs
					{dest: 'dist/', src: 'js/vendor/*.min.js', expand: true, cwd: 'src/'},

					// Copy other resources
					{dest: 'dist/', src: 'fonts/**', expand: true, cwd: 'src/'},
					{dest: 'dist/', src: 'img/**', expand: true, cwd: 'src/'}
				]
			}
		},

		includereplace: {
			dist: {
				options: {
					globals: {
						version: '<%= pkg.version %>',
						headHtml: '',
						hostname: '<%= conf.site.hostname %>',
						npmsite: '<%= conf.npm.hostname %>',
						githubsite: '<%= conf.github.protocol %>://<%= conf.github.host %>'
					}
				},
				files: [
					{src: '*.html', dest: 'dist/', expand: true, cwd: 'src/'},
					{src: 'inc/*.html', dest: 'dist/', expand: true, cwd: 'src/'},
					{src: 'dist/js/bundle-*.js', dest: '.', expand: true}
				]
			}
		},

		// Compile the mobile first site stylesheet (and the no @media queries version for lt-ie8)
		less: {
			compile: {
				files: {
					'dist/css/main-<%= pkg.version %>.css': 'src/css/main.less'
				}
			}
		},

		browserify: {
			dist: {
				files: {'dist/js/bundle-<%= pkg.version %>.js': 'src/js/main.js'},
				options: {transform: ['brfs']}
			}
		},

		// Minify the site script
		uglify: {
			options: {
				/*compress: true,*/
				mangle: true,
				preserveComments: false,
				report: 'min'
			},
			compress: {
				src: 'dist/js/bundle-<%= pkg.version %>.js',
				dest: 'dist/js/bundle-<%= pkg.version %>.js'
			}
		},

		// Minify the site CSS
		cssmin: {
			compress: {
				options: {
					keepSpecialComments: 0,
					report: 'min',
					selectorsMergeMode: 'ie8'
				},
				files: {
					'dist/css/main-<%= pkg.version %>.css': 'dist/css/main-<%= pkg.version %>.css'
				}
			}
		},

		// Lint the server JavaScript
		jshint: {
			files: ['*.js', 'src/js/*.js', 'test/*.js'],
			options: {
				'browser': false,
				'node': true,
				/*'camelcase': true,*/
				'curly': true,
				'eqeqeq': true,
				'eqnull': true,
				'forin': true,
				'immed': true,
				'indent': 4,
				/*'latedef': true,*/
				'laxcomma': true,
				'loopfunc': true,
				'noarg': true,
				'newcap': true,
				'plusplus': false,
				'quotmark': 'single',
				'shadow': true,
				'smarttabs': true,
				'strict': false,
				'sub': true,
				'trailing': true,
				'undef': true,
				'unused': true
			}
		},

		// Test the things
		nodeunit: {
			all: ['test/**/*_test.js']
		},

		// Watch JS, LESS, HTML and image files for changes, copy & compile but not minify for easy debug during dev
		watch: {
			project: {
				options: {atBegin: true},
				files: ['src/js/**/*.js', 'src/css/**/*.less', 'src/**/*.html', 'src/img/**/*'],
				tasks: ['copy', 'less', 'browserify', 'includereplace']
			}
		},

		clean: {
			dist: 'dist/*'
		}
	});

	// Load the grunt plugins
	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-nodeunit');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-include-replace');

	grunt.registerTask('base', ['jshint', 'nodeunit', 'copy', 'less', 'browserify', 'includereplace']);
	grunt.registerTask('min', ['uglify', 'cssmin']);
	grunt.registerTask('default', ['base', 'min']);
};
