/**
 * Information about what the website considers to be an out of date or up to date dependency
 */

var david = require('david')
var semver = require('semver')
var async = require('async')
var config = require('../config')
var registry = require('./registry')
var nsp = require('./nsp')
var db = require('./db')

// When a user publishes a package, delete cached david info
registry.on('change', function (change) {
  db.del('brains/' + change.doc.name, function (err) {
    if (err && !err.notFound) console.error('Failed to delete cached dependency info', err)
  })
})

function isPinned (version) {
  if (version === '*' || version === 'latest') {
    return false
  }

  var range = semver.validRange(version, true)

  if (range && range.indexOf('>=') === 0) {
    return false
  }

  return true
}

function normaliseDeps (deps) {
  if (Array.isArray(deps)) {
    deps = deps.reduce(function (d, depName) {
      d[depName] = '*'
      return d
    }, {})
  } else if (Object.prototype.toString.call(deps) === '[object String]') {
    var depName = deps
    deps = {}
    deps[depName] = '*'
  } else if (!(deps instanceof Object)) {
    deps = {}
  }
  return deps
}

function getCachedDependencies (manifest, opts, cb) {
  var pkgs = {}
  var deps = getDepList(manifest, opts)
  var depNames = Object.keys(deps)

  if (!depNames.length) {
    return process.nextTick(function () {
      cb(null, pkgs)
    })
  }

  async.reduce(depNames, pkgs, function (pkgs, depName, cb) {
    db.get('brains/' + depName, function (err, info) {
      if (err) {
        if (err.notFound) {
          return cb(null, pkgs)
        } else {
          return cb(err)
        }
      }

      if (info.expires > Date.now()) {
        pkgs[depName] = {
          required: deps[depName],
          stable: info.stable,
          latest: info.latest,
          versions: info.versions
        }
      }

      cb(null, pkgs)
    })
  }, cb)
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
  getCachedDependencies(manifest, opts, function (err, cachedInfos) {
    if (err) return cb(err)

    var cachedDepNames = Object.keys(cachedInfos)
    var manifestDeps = getDepList(manifest, opts)

    var uncachedManifestDeps = Object.keys(manifestDeps).filter(function (depName) {
      return cachedDepNames.indexOf(depName) === -1
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

    david.getDependencies(uncachedManifest, opts, function (err, infos) {
      if (err) return cb(err)

      // Cache the new info
      var batch = []

      Object.keys(infos).forEach(function (depName) {
        if (config.brains.cacheTime) {
          var info = infos[depName]
          batch.push({
            type: 'put',
            key: 'brains/' + depName,
            value: {
              stable: info.stable,
              latest: info.latest,
              versions: info.versions,
              expires: Date.now() + config.brains.cacheTime
            }
          })
        }
      })

      db.batch(batch, function (err) {
        if (err) return cb(err)

        cachedDepNames.forEach(function (depName) {
          infos[depName] = cachedInfos[depName]
        })

        cb(null, infos)
      })
    })
  })
}

function getUpdatedDependencies (manifest, opts, cb) {
  getDependencies(manifest, opts, function (err, infos) {
    if (err) return cb(err)

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
 * Filter advisories that apply to the passed versions
 * @param {Array} advisories Advisories for this module
 * @param {Array} versions Version numbers to consider
 */
function filterAdvisories (advisories, versions) {
  if (!advisories || !advisories.length) return []

  // Filter out the advisories that don't apply to the given versions
  return advisories.filter(function (a) {
    for (var i = 0; i < versions.length; i++) {
      try {
        if (semver.satisfies(versions[i], a.vulnerable_versions, true)) {
          return true
        }
      } catch (err) {
        console.error('Failed to filter advisory', versions[i], a, err)
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

  getDependencies(manifest, davidOptions, function (err, deps) {
    if (err) return cb(err)

    // Get ALL updated dependencies including unstable
    getUpdatedDependencies(manifest, davidOptions, function (err, updatedDeps) {
      if (err) return cb(err)

      davidOptions.stable = true

      // Get STABLE updated dependencies
      getUpdatedDependencies(manifest, davidOptions, function (err, updatedStableDeps) {
        if (err) return cb(err)

        nsp.getAdvisories(Object.keys(deps), function (err, advisories) {
          if (err) return cb(err)

          var depNames = Object.keys(deps).sort()
          var totals = {
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
            var status = 'uptodate'

            var rangeVersions = filterVersionsInRange(deps[depName].versions, deps[depName].required)
            var depAdvisories = filterAdvisories(advisories[depName], rangeVersions)

            // If there's an advisory then these dependencies are insecure
            if (depAdvisories.length) {
              status = 'insecure'
            // If there is an updated STABLE dependency then this dep is out of date
            } else if (updatedStableDeps[depName]) {
              status = 'outofdate'
            // If it is in the UNSTABLE list, and has no stable version then consider out of date
            } else if (updatedDeps[depName] && !updatedDeps[depName].stable) {
              status = 'outofdate'
            }

            var pinned = isPinned(deps[depName].required)

            var info = {
              name: depName,
              required: deps[depName].required,
              stable: deps[depName].stable,
              latest: deps[depName].latest,
              status: status,
              pinned: pinned,
              advisories: depAdvisories
            }

            if (status === 'uptodate' && pinned) {
              info.upToDate = true
              totals.upToDate++
              totals.pinned.upToDate++
            } else if (status === 'uptodate' && !pinned) {
              info.upToDate = true
              totals.upToDate++
              totals.unpinned.upToDate++
            } else if (status === 'outofdate' && pinned) {
              info.outOfDate = true
              totals.outOfDate++
              totals.pinned.outOfDate++
            } else if (status === 'outofdate' && !pinned) {
              info.outOfDate = true
              totals.outOfDate++
              totals.unpinned.outOfDate++
            }

            totals.advisories += depAdvisories.length

            return info
          })

          // Figure out the overall status for this manifest
          var status = depList.length ? 'uptodate' : 'none'

          if (totals.advisories) {
            status = 'insecure'
          } else if (totals.unpinned.outOfDate) {
            if (totals.unpinned.outOfDate / depList.length > 0.25) {
              status = 'outofdate'
            } else {
              status = 'notsouptodate'
            }
          }

          cb(null, {status: status, deps: depList, totals: totals})
        })
      })
    })
  })
}
