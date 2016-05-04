const async = require('async')

module.exports = (nspApiClient, db) => {
  var syncAdvisoriesIntervalId = null

  const Nsp = {
    // Given a list of dependency names, retrieve an object that lists advisories
    // by dependency name
    getAdvisories (depNames, cb) {
      const tasks = depNames.reduce((tasks, depName) => {
        tasks[depName] = (cb) => {
          db.get(`nsp/advisories/${depName}`, (err, advisories) => {
            if (err) {
              if (err.notFound) return cb(null, [])
              return cb(err)
            }
            cb(null, advisories)
          })
        }
        return tasks
      }, {})

      async.parallel(tasks, cb)
    },

    syncAdvisories (cb) {
      cb = cb || ((err) => { if (err) console.error('Failed to sync advisories', err) })

      // Get the first page
      const limit = 100
      var done = false

      nspApiClient.advisories({limit: 1, offset: 0}, (err, response) => {
        if (err) return cb(err)

        const pages = Math.ceil(response.total / limit)
        const offsets = []

        for (var i = 0; i < pages; i++) {
          offsets.push(i * limit)
        }

        async.eachSeries(offsets, (offset, cb) => {
          if (done) return cb()

          nspApiClient.advisories({limit: limit - 1, offset}, (err, response) => {
            if (err) return cb('Failed to get advisories page', offset, err)

            async.eachSeries(response.results, (advisory, cb) => {
              if (done) return cb()

              const key = `nsp/advisories/${advisory.module_name}`

              db.get(key, (err, advisories) => {
                if (err) {
                  if (err.notFound) {
                    console.log('Adding first advisory', advisory.id, 'for module', advisory.module_name)
                    return db.put(key, [advisory], cb)
                  }
                  return cb(err)
                }

                const advisoryIds = advisories.map((a) => a.id)

                if (advisoryIds.indexOf(advisory.id) > -1) {
                  // Already found - we're all synced
                  done = true
                  cb()
                } else {
                  console.log(`Adding another advisory ${advisory.id} for module ${advisory.module_name}`)
                  db.put(key, advisories.concat(advisory), cb)
                }
              })
            }, cb)
          })
        }, cb)
      })
    },

    syncAdvisoriesPeriodically (interval) {
      clearInterval(syncAdvisoriesIntervalId)
      interval = interval || 3600000
      syncAdvisoriesIntervalId = setInterval(Nsp.syncAdvisories, interval)
    }
  }

  return Nsp
}
