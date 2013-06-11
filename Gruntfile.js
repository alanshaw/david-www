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
					
					// Copy any JavaScript files (not CoffeeScript src)
					{dest: 'dist/', src: 'js/**/*.js', expand: true, cwd: 'src/'},
					
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
				files: {
					'dist/': 'src/*.html', 
					'dist/inc/': 'src/inc/*.html'
				}
			}
		},
		
		// Compile all CoffeScript into main.js
		coffee: {
			compile: {
				files: {
					'dist/js/main.js': 'src/js/main.coffee'
				}
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
			compress: {
				src: 'dist/js/main.js',
				dest: 'dist/js/main.js'
			}
		},
		
		// Minify the site CSS
		cssmin: {
			compress: {
				files: {
					'dist/css/main.css': 'dist/css/main.css',
					'dist/css/ie.css': 'dist/css/ie.css'
				}
			}
		},
		
		// Lint the server JavaScript
		jshint: {
			files: '*.js'
		},
		
		// Test the things
		nodeunit: {
			all: ['test/**/*_test.js']
		},
		
		// Watch CoffeeScript, LESS & HTML files for changes, copy & compile but not minify for easy debug during dev
		watch: {
			project: {
				files: ['src/js/**/*.coffee', 'src/css/**/*.less', 'src/**/*.html', 'src/img/**/*'],
				tasks: ['copy', 'includereplace', 'coffee', 'less']
			}
		},
		
		clean: {
			dist: 'dist/*'
		}
	});
	
	// Load the grunt-conrtib plugin so we can compile and compress CoffeeScript and LESS files
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-coffee');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-include-replace');
	grunt.loadNpmTasks('grunt-contrib-nodeunit');
	grunt.loadNpmTasks('grunt-contrib-clean');
	
	grunt.registerTask('default', ['jshint', 'nodeunit', 'copy', 'includereplace', 'coffee', 'less', 'uglify', 'cssmin']);
};