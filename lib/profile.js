const async = require('async')

module.exports = (manifest, brains, github) => {
  const Profile = {
    /**
     * @param {String} user Username
     * @param {String} authToken OAuth access token or null
     * @param {Function} cb Passed array of objects with properties repo, info, manifest.
     */
    get (user, authToken, cb) {
      getRepos(user, authToken, (err, repos) => {
        if (err) return cb(err)

        // Get repository status information
        async.parallel(
          repos.map((repo) => createGetInfoTask(user, repo, authToken)),
          (err, data) => {
            if (err) return cb(err)
            cb(null, data.filter((d) => !!d))
          }
        )
      })
    }
  }

  /**
   * Get repositories for a user
   *
   * @param {Object} github Github API object
   * @param {String} user Username
   * @param {String} authToken OAuth access token or null
   * @param {Object|Function} [options] Options or callback function
   * @param {Number} [options.page] Page of repos to start from
   * @param {Array} [options.repos] Repositories retrieved so far
   * @param {Number} [options.pageSize] Page size, max 100
   * @param {Function} cb Callback function
   */
  function getRepos (user, authToken, opts, cb) {
    // Allow callback to be passed as fourth parameter
    if (!cb) {
      cb = opts
      opts = {}
    }

    opts = opts || {}

    opts.page = opts.page || 0
    opts.repos = opts.repos || []
    opts.pageSize = opts.pageSize || 100

    setImmediate(() => {
      const gh = github.getInstance(authToken)
      const repoMethod = authToken ? 'getAll' : 'getFromUser'

      gh.repos[repoMethod]({user, page: opts.page, per_page: opts.pageSize}, (err, data) => {
        if (err) return cb(err)

        if (data.length) {
          opts.repos = opts.repos.concat(data)

          if (data.length === opts.pageSize) {
            // Maybe another page?
            opts.page++

            getRepos(user, authToken, opts, cb)
          } else {
            cb(null, opts.repos)
          }
        } else {
          // All done!
          cb(null, opts.repos)
        }
      })
    })
  }

  /**
   * Create a function to be used with async.parallel that"ll get info from brains for a repo.
   *
   * @param {Object} manifest Manifest instance
   * @param {Object} brains Brains instance
   * @param {String} user Username
   * @param {Object} repo Repository data as returned by GitHub API
   * @param {String} authToken OAuth access token or null
   * @returns {Function}
   */
  function createGetInfoTask (user, repo, authToken) {
    return (cb) => {
      manifest.getManifest(user, repo.name, null, null, authToken, (err, manifest) => {
        // This is fine - perhaps the repo doesn"t have a package.json
        if (err) return cb()
        brains.getInfo(manifest, (err, info) => cb(err, {repo, manifest, info}))
      })
    }
  }

  return Profile
}
