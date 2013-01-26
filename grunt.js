module.exports = function(grunt) {
	
	grunt.initConfig({
		
		// Copy files that don't need compilation to dist/
		copy: {
			dist: {
				files: {
					// Copy all (non hidden) files (not directories) from src
					'dist/': 'src/*',
					
					// Copy the following hidden files
					//'dist/.htaccess': 'src/.htaccess',
					
					// Copy any JavaScript files (not CoffeeScript src)
					'dist/js/': 'src/js/**/*.js',
					
					// For the time being, you'll have to uncomment parts of this when you add files to folders that 
					// currently have nothing in them!
					// @see https://github.com/gruntjs/grunt-contrib-copy/issues/6
					
					
					// Copy any CSS files (not LESS src)
					'dist/css/': 'src/css/**/*.css',
					
					// Copy other resources
					'dist/img/': 'src/img/**',
					'dist/font/': 'src/font/**'
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
		min: {
			compress: {
				src: 'dist/js/main.js',
				dest: 'dist/js/main.js'
			}
		},
		
		// Minify the site CSS
		mincss: {
			compress: {
				files: {
					'dist/css/main.css': 'dist/css/main.css',
					'dist/css/ie.css': 'dist/css/ie.css'
				}
			}
		},
		
		// Watch CoffeeScript, LESS & HTML files for changes, copy & compile but not minify for easy debug during dev
		watch: {
			project: {
				files: ['src/js/**/*.coffee', 'src/css/**/*.less', 'src/**/*.html'],
				tasks: 'copy less coffee'
			}
		}
	});
	
	// Load the grunt-conrtib plugin so we can compile and compress CoffeeScript and LESS files
	grunt.loadNpmTasks('grunt-contrib');
	
	grunt.registerTask('default', 'copy coffee less min mincss');
};