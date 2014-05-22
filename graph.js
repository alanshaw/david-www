var npm = require("npm")
  , moment = require("moment")
  , semver = require("semver")
  , cycle = require("cycle")
  , config = require("config")

function Package (name, version) {
  this.name = name
  this.version = version
  this.deps = {}
  this.expires = moment().add(Package.TTL)
}

Package.TTL = moment.duration({days: 1})

/**
 * Recursively removes the expires property from a decycled Package.
 *
 * Necessary until https://github.com/douglascrockford/JSON-js/pull/50 is pulled or a better solution becomes available.
 *
 * @param {Object} decycledPkg A decycled Package
 * @return {Object} decycledPkg
 */
function deleteExpires (decycledPkg) {

  delete decycledPkg.expires

  Object.keys(decycledPkg.deps).forEach(function (depName) {
    // Delete expires from this dependency if it isn't a decycle reference
    if (!decycledPkg.deps[depName].$ref) {
      deleteExpires(decycledPkg.deps[depName])
    }
  })

  return decycledPkg
}

var dependencies = {}

/**
 * Get the dependency graph for a given NPM dependency name and version.
 *
 * Must be executed in `npm.load()` callback.
 *
 * @param depName Package name
 * @param version
 * @param cb
 */
function getDependencyGraph (depName, version, cb) {
  dependencies[depName] = dependencies[depName] || {}

  var dep = dependencies[depName][version]

  if (dep) {

    if (dep.expires > new Date()) {
      return cb(null, dep)
    }

    dep.deps = {}
    dep.expires = moment().add(Package.TTL)

  } else {
    dep = dependencies[depName][version] = new Package(depName, version)
  }

  process.nextTick(function () {

    npm.commands.view([depName + "@" + version, "dependencies"], function (er, data) {
      if (er) return cb(er)

      var depDeps = data[version] ? data[version].dependencies ? data[version].dependencies : {} : {},
        depDepNames = depDeps ? Object.keys(depDeps) : []

      // No dependencies?
      if (!depDepNames.length) {
        return cb(null, dep)
      }

      var got = 0

      depDepNames.forEach(function (depDepName) {
        var depDepRange = depDeps[depDepName]

        latestSatisfying(depDepName, depDepRange, function (er, depDepVersion) {
          if (er) return cb(er)

          // There should be a version that satisfies!
          // But...
          // The range could be a tag, or a git repo
          if (!depDepVersion) {

            // Add a dummy package with the range as it"s version
            dep.deps[depDepName] = new Package(depDepName, depDepRange)

            got++

            if (got === depDepNames.length) {
              dependencies[depName][version] = dep
              cb(null, dep)
            }

          } else {

            getDependencyGraph(depDepName, depDepVersion, function (er, depDep) {
              if (er) return cb(er)

              dep.deps[depDepName] = depDep

              got++

              if (got === depDepNames.length) {
                dependencies[depName][version] = dep
                cb(null, dep)
              }
            })
          }

        }) // npm
      })
    })
  })
}

/**
 * Get the latest version for the passed dependency name that satisfies the passed range.
 *
 * Must be executed in `npm.load()` callback.
 *
 * @param depName
 * @param range
 * @param cb
 */
function latestSatisfying (depName, range, cb) {
  npm.commands.view([depName, "versions"], function (er, data) {
    if (er) return cb(er)

    var keys = Object.keys(data)

    // `npm view 0 versions` returns {} - ensure some data was returned
    if (!keys.length) {
      return cb()
    }

    if (range === "latest") {
      range = ""
    }

    // Get the most recent version that satisfies the range
    var version = semver.maxSatisfying(data[keys[0]].versions, range, true)

    cb(null, version)
  })
}

// Cache of projects we have cached dependencies for
var projects = {}

/**
 * Get dependency graph for a non-NPM project
 *
 * @param name
 * @param version
 * @param deps
 * @param {Function} cb Second parameter is decycled dependency graph
 * @see https://github.com/douglascrockford/JSON-js/blob/master/cycle.js
 */
module.exports.getProjectDependencyGraph = function (name, version, deps, cb) {
  projects[name] = projects[name] || {}

  var project = projects[name][version]

  if (project) {

    if (project.expires > new Date()) {
      console.log("Using cached project dependency graph", name, version)
      return cb(null, deleteExpires(cycle.decycle(project)))
    }

    project.deps = {}
    project.expires = moment().add(Package.TTL)

  } else {
    project = projects[name][version] = new Package(name, version)
  }

  npm.load(config.npm.options, function (er) {
    if (er) return cb(er)

    var depNames = Object.keys(deps)
      , done = 0

    depNames.forEach(function (depName) {
      var range = deps[depName]

      latestSatisfying(depName, range, function (er, version) {
        if (er) return cb(er)

        // There should be a version that satisfies!
        // But...
        // The range could be a tag, or a git repo
        if (!version) {

          // Add a dummy package with the range as it"s version
          project.deps[depName] = new Package(depName, range)

          done++

          if (done === depNames.length) {
            cb(null, cycle.decycle(project))
          }

        } else {

          getDependencyGraph(depName, version, function (er, dep) {
            if (er) return cb(er)

            project.deps[depName] = dep

            done++

            if (done === depNames.length) {
              cb(null, deleteExpires(cycle.decycle(project)))
            }
          })
        }
      })
    })
  })
}

/**
 * Set the TTL for cached packages.
 *
 * @param {moment.duration} duration Time period the packages will be cacched for, expressed as a moment.duration.
 */
module.exports.setCacheDuration = function (duration) {
  Package.TTL = duration
}
