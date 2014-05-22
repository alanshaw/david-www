var GitHubApi = require("github")
var async = require("async")
var manifest = require("./manifest")
var brains = require("./brains")
var config = require("config")

var github = new GitHubApi({
  protocol: config.github.api.protocol,
  host: config.github.api.host,
  version: config.github.api.version,
  pathPrefix: config.github.api.pathPrefix,
  timeout: 5000
})

if (config.github.username) {
  github.authenticate({
    type: "basic",
    username: config.github.username,
    password: config.github.password
  })
}

/**
 * Get repositories for a user
 *
 * @param {String} user Username
 * @param {Object|Function} [options] Options or callback function
 * @param {Number} [options.page] Page of repos to start from
 * @param {Array} [options.repos] Repositories retrieved so far
 * @param {Number} [options.pageSize] Page size, max 100
 * @param {Function} cb Callback function
 */
function getRepos (user, options, cb) {
  // Allow callback to be passed as second parameter
  if (!cb) {
    cb = options
    options = {page: 0, repos: [], pageSize: 100}
  } else {
    options = options || {page: 0, repos: [], pageSize: 100}
  }

  setImmediate(function () {
    github.repos.getFromUser({user: user, page: options.page, per_page: options.pageSize}, function (er, data) {
      if (er) return cb(er)

      if (data.length) {
        options.repos = options.repos.concat(data)

        if (data.length === options.pageSize) {
          // Maybe another page?
          options.page++

          getRepos(user, options, cb)

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
 * @returns {Function}
 */
function createGetInfoTask (user, repo) {
  return function (cb) {
    manifest.getManifest(user, repo.name, function (er, manifest) {
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
 * @param {Function} cb Passed array of objects with properties repo, info, manifest.
 */
module.exports.get = function (user, cb) {
  getRepos(user, function (er, repos) {
    if (er) return cb(er)

    // Get repository status information
    async.parallel(
      repos.map(function (repo) {
        return createGetInfoTask(user, repo)
      }),
      function (er, data) {
        if (er) return cb(er)
        cb(null, data.filter(function (d) {return !!d}))
      }
    )
  })
}
