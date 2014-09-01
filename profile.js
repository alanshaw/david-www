var async = require("async")
  , manifest = require("./manifest")
  , brains = require("./brains")
  , github = require("./github")

/**
 * Get repositories for a user
 *
 * @param {String} user Username
 * @param {String} authToken OAuth access token or null
 * @param {Object|Function} [options] Options or callback function
 * @param {Number} [options.page] Page of repos to start from
 * @param {Array} [options.repos] Repositories retrieved so far
 * @param {Number} [options.pageSize] Page size, max 100
 * @param {Function} cb Callback function
 */
function getRepos (user, authToken, options, cb) {
  // Allow callback to be passed as second parameter
  if (!cb) {
    cb = options
    options = {page: 0, repos: [], pageSize: 100}
  } else {
    options = options || {page: 0, repos: [], pageSize: 100}
  }

  setImmediate(function () {
    var gh = github.getInstance(authToken)
      , repoMethod = authToken ? "getAll" : "getFromUser"

    gh.repos[repoMethod]({type: "all", user: user, page: options.page, per_page: options.pageSize}, function (er, data) {
      if (er) return cb(er)

      if (data.length) {
        options.repos = options.repos.concat(data)

        if (data.length === options.pageSize) {
          // Maybe another page?
          options.page++

          getRepos(user, authToken, options, cb)

        } else {
          cb(null, options.repos)
        }

      } else {
        // All done!
        cb(null, options.repos)
      }
    })
  })
}

/**
 * Create a function to be used with async.parallel that"ll get info from brains for a repo.
 *
 * @param {String} user Username
 * @param {Object} repo Repository data as returned by GitHub API
 * @param {String} authToken OAuth access token or null
 * @returns {Function}
 */
function createGetInfoTask (user, repo, authToken) {
  return function (cb) {
    manifest.getManifest(user, repo.name, authToken, function (er, manifest) {
      // This is fine - perhaps the repo doesn"t have a package.json
      if (er) return cb()

      brains.getInfo(manifest, function (er, info) {
        if (er) return cb(er)
        cb(null, {repo: repo, manifest: manifest, info: info})
      })
    })
  }
}

/**
 * @param {String} user Username
 * @param {String} authToken OAuth access token or null
 * @param {Function} cb Passed array of objects with properties repo, info, manifest.
 */
module.exports.get = function (user, authToken, cb) {
  getRepos(user, authToken, function (er, repos) {
    if (er) return cb(er)

    // Get repository status information
    async.parallel(
      repos.map(function (repo) {
        return createGetInfoTask(user, repo, authToken)
      }),
      function (er, data) {
        if (er) return cb(er)
        cb(null, data.filter(function (d) {return !!d}))
      }
    )
  })
}
