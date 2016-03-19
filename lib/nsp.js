var async = require('async')
var client = require('nsp-advisories-api')()

module.exports = function (db) {
  var syncAdvisoriesIntervalId = null

  var Nsp = {
    // Given a list of dependency names, retrieve an object that lists advisories
    // by dependency name
    getAdvisories: function (depNames, cb) {
      var tasks = depNames.reduce(function (tasks, depName) {
        tasks[depName] = function (cb) {
          db.get('nsp/advisories/' + depName, function (err, advisories) {
            if (err) {
              if (err.notFound) {
                return cb(null, [])
              } else {
                return cb(err)
              }
            }
            cb(null, advisories)
          })
        }
        return tasks
      }, {})

      async.parallel(tasks, cb)
    },

    syncAdvisories: function (cb) {
      cb = cb || function (err) { if (err) console.error('Failed to sync advisories', err) }

      // Get the first page
      var limit = 100
      var done = false

      client.advisories({limit: 1, offset: 0}, function (err, response) {
        if (err) return cb(err)

        var pages = Math.ceil(response.total / limit)
        var offsets = []

        for (var i = 0; i < pages; i++) {
          offsets.push(i * limit)
        }

        async.eachSeries(offsets, function (offset, cb) {
          if (done) return cb()

          client.advisories({limit: limit - 1, offset: offset}, function (err, response) {
            if (err) return cb('Failed to get advisories page', offset, err)

            async.eachSeries(response.results, function (advisory, cb) {
              if (done) return cb()

              var key = 'nsp/advisories/' + advisory.module_name

              db.get(key, function (err, advisories) {
                if (err) {
                  if (err.notFound) {
                    console.log('Adding first advisory', advisory.id, 'for module', advisory.module_name)
                    return db.put(key, [advisory], cb)
                  } else {
                    return cb(err)
                  }
                }

                var advisoryIds = advisories.map(function (a) { return a.id })

                if (advisoryIds.indexOf(advisory.id) > -1) {
                  // Already found - we're all synced
                  done = true
                  cb()
                } else {
                  console.log('Adding another advisory', advisory.id, 'for module', advisory.module_name)
                  db.put(key, advisories.concat(advisory), cb)
                }
              })
            }, cb)
          })
        }, cb)
      })
    },

    syncAdvisoriesPeriodically: function (interval) {
      clearInterval(syncAdvisoriesIntervalId)
      interval = interval || 3600000
      syncAdvisoriesIntervalId = setInterval(Nsp.syncAdvisories, interval)
    }
  }

  return Nsp
}
