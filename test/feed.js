const test = require('tape')
const createFeed = require('../dist/lib/feed').default

test("Test get feed for dependency with no 'time' information", (t) => {
  t.plan(2)

  const pkgName = 'sprintf'

  // Create a mock npm
  const mockNpm = {
    load (opts, cb) {
      process.nextTick(cb)
    },
    commands: {
      view (args, silent, cb) {
        process.nextTick(() => {
          if (args[0] === pkgName) {
            // Simulate npm response for no time information
            if (args[1] === 'time') {
              cb(null, {})
              return
            }

            if (args[1] === 'version') {
              cb(null, {'0.2.1': {version: '0.2.1'}})
              return
            }
          }

          cb(new Error(`Unexpected arguments to mock npm view command ${args}`))
        })
      }
    }
  }

  const feed = createFeed({ npm: mockNpm })

  const manifest = {
    name: 'Test',
    dependencies: {
      'sprintf': '~0.1.1'
    }
  }

  feed.get(manifest, (err, xml) => {
    t.ifError(err)

    // If no time information was present then the feed should have defaulted to the unix epoch as the publish
    // date for the latest version of the module (RSS module formats as GMT string for some reason)
    t.ok(xml.indexOf('<pubDate>Thu, 01 Jan 1970 00:00:00 GMT</pubDate>') !== -1)

    t.end()
  })
})

test('Test get feed for package with invalid semver range dependency', (t) => {
  t.plan(1)

  const pkgName = 'sprintf'

  // Create a mock npm
  const mockNpm = {
    load (opts, cb) {
      process.nextTick(cb)
    },
    commands: {
      view (args, silent, cb) {
        process.nextTick(() => {
          if (args[0] === pkgName) {
            if (args[1] === 'version') {
              cb(null, {'0.2.1': {version: '0.2.1'}})
              return
            }
          }

          cb(new Error(`Unexpected arguments to mock npm view command ${args}`))
        })
      }
    }
  }

  const feed = createFeed({ npm: mockNpm })

  const manifest = {
    name: 'Test',
    dependencies: {
      'sprintf': 'GARBAGE-'
    }
  }

  feed.get(manifest, (err) => {
    t.ifError(err)
    t.end()
  })
})
