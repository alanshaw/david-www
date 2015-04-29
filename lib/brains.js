/**
 * Information about what the website considers to be an out of date or up to date dependency
 */

var david = require("david")
  , semver = require("semver")
  , cache = require("memory-cache")
  , registry = require("./registry")
  , config = require("config")
  , nsp = require("./nsp")

// When a user publishes a package, delete cached david info
registry.on("change", function (change) {
  cache.del(change.doc.name)
})

function isPinned (version) {
  if (version == "*" || version == "latest") {
    return false
  }

  var range = semver.validRange(version, true)

  if (range && range.indexOf(">=") === 0) {
    return false
  }

  return true
}

function normaliseDeps (deps) {
  if (Array.isArray(deps)) {
    deps = deps.reduce(function (d, depName) {
      d[depName] = "*"
      return d
    }, {})
  } else if (Object.prototype.toString.call(deps) === "[object String]") {
    var depName = deps
    deps = {}
    deps[depName] = "*"
  } else if (!(deps instanceof Object)) {
    deps = {}
  }
  return deps
}

function getCachedDependencies (manifest, opts) {
  var pkgs = {}
    , deps = getDepList(manifest, opts)
    , depNames = Object.keys(deps)

  if (!depNames.length) return pkgs

  depNames.forEach(function (depName) {
    var info = cache.get(depName)

    if (!info) return;

    pkgs[depName] = {required: deps[depName], stable: info.stable, latest: info.latest, versions: info.versions}
  })

  return pkgs
}

function getDepList (manifest, opts) {
  var deps = null

  if (opts.dev) {
    deps = manifest.devDependencies
  } else if (opts.peer) {
    deps = manifest.peerDependencies
  } else if (opts.optional) {
    deps = manifest.optionalDependencies
  } else {
    deps = manifest.dependencies
  }

  return normaliseDeps(deps || {})
}

function getDependencies (manifest, opts, cb) {
  // Get the dependency info we already have cached information for
  var cachedInfos = getCachedDependencies(manifest, opts)
    , cachedDepNames = Object.keys(cachedInfos)
    , manifestDeps = getDepList(manifest, opts)

  var uncachedManifestDeps = Object.keys(manifestDeps).filter(function (depName) {
    return cachedDepNames.indexOf(depName) == -1
  }).reduce(function (deps, depName) {
    deps[depName] = manifestDeps[depName]
    return deps
  }, {})

  var uncachedManifestDepNames = Object.keys(uncachedManifestDeps)

  if (!uncachedManifestDepNames.length) {
    return setImmediate(function () {
      cb(null, cachedInfos)
    })
  }

  var uncachedManifest = {}

  if (opts.dev) {
    uncachedManifest.devDependencies = uncachedManifestDeps
  } else if (opts.peer) {
    uncachedManifest.peerDependencies = uncachedManifestDeps
  } else if (opts.optional) {
    uncachedManifest.optionalDependencies = uncachedManifestDeps
  } else {
    uncachedManifest.dependencies = uncachedManifestDeps
  }

  david.getDependencies(uncachedManifest, opts, function (er, infos) {
    if (er) return cb(er)

    // Cache the new info
    Object.keys(infos).forEach(function (depName) {
      if (config.brains.cacheTime) {
        var info = infos[depName]
        cache.put(depName, {stable: info.stable, latest: info.latest, versions: info.versions}, config.brains.cacheTime)
      }
    })

    cachedDepNames.forEach(function (depName) {
      infos[depName] = cachedInfos[depName]
    })

    cb(null, infos)
  })
}

function getUpdatedDependencies (manifest, opts, cb) {
  getDependencies(manifest, opts, function (er, infos) {
    if (er) return cb(er)

    // Filter out the non-updated dependencies
    Object.keys(infos).forEach(function (depName) {
      if (!david.isUpdated(infos[depName], opts)) {
        delete infos[depName]
      }
    })

    cb(null, infos)
  })
}

/**
 * Filter out the versions that are within the given range
 * @param {Array} versions All versions
 * @param {String} range Range to filter by
 */
function filterVersionsInRange (versions, range) {
  return (versions || []).filter(function (v) {
    return semver.satisfies(v, range, true)
  })
}

/**
 * Get advisories for this module name at these versions
 * @param {String} name Module name
 * @param {Array} versions Version numbers to consider
 */
function getAdvisories (name, versions) {
  var advisories = nsp.getAdvisories()
  if (!advisories[name]) return []

  // Filter out the advisories that don't apply to the given versions
  return advisories[name].filter(function (a) {
    for (var i = 0; i < versions.length; i++) {
      try {
        if (semver.satisfies(versions[i], a.vulnerable_versions, true)) {
          return true
        }
      } catch (er) {
        console.error("Failed to filter advisory", name, versions[i], a, er)
      }
    }
    return false
  })
}

/**
 * @param {Object} manifest Parsed package.json file contents
 * @param {Object|Function} [opts] Options or cb
 * @param {Boolean} [opts.dev] Consider devDependencies
 * @param {Boolean} [opts.peer] Consider peerDependencies
 * @param {Boolean} [opts.optional] Consider optionalDependencies
 * @param {Function} cb Function that receives the results
 */
module.exports.getInfo = function (manifest, opts, cb) {
  // Allow cb to be passed as second parameter
  if (!cb) {
    cb = opts
    opts = {}
  } else {
    opts = opts || {}
  }

  if (config.npm && config.npm.options) {
    opts.npm = config.npm.options
  }

  var davidOptions = {dev: opts.dev, peer: opts.peer, optional: opts.optional, loose: true, npm: opts.npm, versions: true}

  getDependencies(manifest, davidOptions, function (er, deps) {
    if (er) return cb(er)

    // Get ALL updated dependencies including unstable
    getUpdatedDependencies(manifest, davidOptions, function (er, updatedDeps) {
      if (er) return cb(er)

      davidOptions.stable = true

      // Get STABLE updated dependencies
      getUpdatedDependencies(manifest, davidOptions, function (er, updatedStableDeps) {
        if (er) return cb(er)

        var depNames = Object.keys(deps).sort()
          , totals = {
            upToDate: 0,
            outOfDate: 0,
            pinned: {
              upToDate: 0,
              outOfDate: 0
            },
            unpinned: {
              upToDate: 0,
              outOfDate: 0
            },
            advisories: 0
          }

        var depList = depNames.map(function (depName) {
          // Lets disprove this
          var status = "uptodate"

          var rangeVersions = filterVersionsInRange(deps[depName].versions, deps[depName].required)
          var advisories = getAdvisories(depName, rangeVersions)

          // If there's an advisory then these dependencies are insecure
          if (advisories.length) {
            status = "insecure"
          // If there is an updated STABLE dependency then this dep is out of date
          } else if (updatedStableDeps[depName]) {
            status = "outofdate"
          // If it is in the UNSTABLE list, and has no stable version then consider out of date
          } else if (updatedDeps[depName] && !updatedDeps[depName].stable) {
            status = "outofdate"
          }

          var pinned = isPinned(deps[depName].required)

          var info = {
            name: depName,
            required: deps[depName].required,
            stable: deps[depName].stable,
            latest: deps[depName].latest,
            status: status,
            pinned: pinned,
            advisories: advisories
          }

          if (status === "uptodate" && pinned) {
            info.upToDate = true
            totals.upToDate++
            totals.pinned.upToDate++
          } else if (status === "uptodate" && !pinned) {
            info.upToDate = true
            totals.upToDate++
            totals.unpinned.upToDate++
          } else if (status === "outofdate" && pinned) {
            info.outOfDate = true
            totals.outOfDate++
            totals.pinned.outOfDate++
          } else if (status === "outofdate" && !pinned) {
            info.outOfDate = true
            totals.outOfDate++
            totals.unpinned.outOfDate++
          }

          totals.advisories += advisories.length

          return info
        })

        // Figure out the overall status for this manifest
        var status = depList.length ? "uptodate" : "none";

        if (totals.advisories) {
          status = "insecure"
        } else if (totals.unpinned.outOfDate) {

          if (totals.unpinned.outOfDate / depList.length > 0.25) {
            status = "outofdate"
          } else {
            status = "notsouptodate"
          }
        }

        cb(null, {status: status, deps: depList, totals: totals})
      })
    })
  })
}
