module.exports = (grunt) => {
  grunt.initConfig({
    conf: require('./config'),

    pkg: grunt.file.readJSON('package.json'),

    // Copy files that don"t need compilation to dist/
    copy: {
      dist: {
        files: [
          // Copy all (non hidden) files (not directories) from src
          {dest: 'dist/', src: ['*', '!LICENSE.md'], filter: 'isFile', expand: true, cwd: 'public/'},

          // Copy any JavaScript libs
          {dest: 'dist/', src: 'js/vendor/*.min.js', expand: true, cwd: 'public/'},

          // Copy other resources
          {dest: 'dist/', src: 'fonts/**', expand: true, cwd: 'public/'},
          {dest: 'dist/', src: 'img/**', expand: true, cwd: 'public/'}
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
            githubsite: '<%= conf.github.protocol %>://<%= conf.github.host %>',
            year: new Date().getFullYear()
          }
        },
        files: [
          {src: '*.html', dest: 'dist/', expand: true, cwd: 'public/'},
          {src: 'inc/*.html', dest: 'dist/', expand: true, cwd: 'public/'}
        ]
      }
    },

    less: {
      compile: {
        files: {
          'dist/css/main-<%= pkg.version %>.css': 'public/css/main.less'
        }
      }
    },

    cssmin: {
      minify: {
        options: {
          compatibility: 'ie9',
          keepSpecialComments: 0
        },
        files: {
          'dist/css/main-<%= pkg.version %>.css': 'dist/css/main-<%= pkg.version %>.css'
        }
      }
    },

    browserify: {
      dist: {
        files: {'dist/js/bundle-<%= pkg.version %>.js': 'public/js/main.js'},
        options: {transform: ['browserify-shim', 'brfs']}
      }
    },

    // Minify the site script
    uglify: {
      options: {
        compress: {
          warnings: false
        },
        mangle: true,
        preserveComments: false,
        report: 'min'
      },
      compress: {
        src: 'dist/js/bundle-<%= pkg.version %>.js',
        dest: 'dist/js/bundle-<%= pkg.version %>.js'
      }
    },

    // Watch JS, LESS, HTML and image files for changes, copy & compile but not minify for easy debug during dev
    watch: {
      project: {
        options: {atBegin: true},
        files: ['public/js/**/*.js', 'public/css/**/*.less', 'public/**/*.html', 'public/img/**/*'],
        tasks: ['copy', 'includereplace', 'less:compile', 'browserify']
      }
    },

    clean: {
      options: {force: true},
      dist: 'dist/*'
    }
  })

  // Load any grunt plugins found in package.json.
  require('load-grunt-tasks')(grunt, {scope: 'devDependencies'})

  grunt.registerTask('base', ['copy', 'includereplace', 'less:compile', 'browserify'])
  grunt.registerTask('min', ['cssmin', 'uglify'])
  grunt.registerTask('default', ['base', 'min'])
}
