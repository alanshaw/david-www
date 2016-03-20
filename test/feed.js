var test = require('tape')
var createFeed = require('../lib/feed')

test("Test get feed for dependency with no 'time' information", function (t) {
  t.plan(2)

  var pkgName = 'sprintf'

  // Create a mock NPM
  var mockNpm = {
    load: function (opts, cb) {
      process.nextTick(cb)
    },
    commands: {
      view: function (args, silent, cb) {
        process.nextTick(function () {
          if (args[0] === pkgName) {
            // Simulate NPM response for no time information
            if (args[1] === 'time') {
              cb(null, {})
              return
            }

            if (args[1] === 'version') {
              cb(null, {'0.2.1': {version: '0.2.1'}})
              return
            }
          }

          cb(new Error('Unexpected arguments to mock NPM view command ' + args))
        })
      }
    }
  }

  var feed = createFeed(mockNpm)

  var manifest = {
    name: 'Test',
    dependencies: {
      'sprintf': '~0.1.1'
    }
  }

  feed.get(manifest, function (err, xml) {
    t.ifError(err)

    // If no time information was present then the feed should have defaulted to the unix epoch as the publish
    // date for the latest version of the module (RSS module formats as GMT string for some reason)
    t.ok(xml.indexOf('<pubDate>Thu, 01 Jan 1970 00:00:00 GMT</pubDate>') !== -1)

    t.end()
  })
})

test('Test get feed for package with invalid semver range dependency', function (t) {
  t.plan(1)

  var pkgName = 'sprintf'

  // Create a mock NPM
  var mockNpm = {
    load: function (opts, cb) {
      process.nextTick(cb)
    },
    commands: {
      view: function (args, silent, cb) {
        process.nextTick(function () {
          if (args[0] === pkgName) {
            if (args[1] === 'version') {
              cb(null, {'0.2.1': {version: '0.2.1'}})
              return
            }
          }

          cb(new Error('Unexpected arguments to mock NPM view command ' + args))
        })
      }
    }
  }

  var feed = createFeed(mockNpm)

  var manifest = {
    name: 'Test',
    dependencies: {
      'sprintf': 'GARBAGE-'
    }
  }

  feed.get(manifest, function (err) {
    t.ifError(err)
    t.end()
  })
})
