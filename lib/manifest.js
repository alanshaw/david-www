/**
 * Events:
 * dependenciesChange(differences, manifest, user, repo, private) - When one or more dependencies for a manifest change
 * devDependenciesChange(differences, manifest, user, repo, private) - When one or more devDependencies for a manifest change
 * peerDependenciesChange(differences, manifest, user, repo, private) - When one or more peerDependencies for a manifest change
 * optionalDependenciesChange(differences, manifest, user, repo, private) - When one or more optionalDependencies for a manifest change
 * retrieve(manifest, user, repo, private) - The first time a manifest is retrieved
 */

var events = require("events")
    , moment = require("moment")
    , config = require("../config")
    , githubUrl = require("github-url")
    , depDiff = require("dep-diff")
    , registry = require("./registry")
    , github = require("./github")
    , batch = require("./batch")()
    , db = require("./db")

module.exports = exports = new events.EventEmitter()

function Manifest (data, priv) {
  this.data = data
  this.private = priv // Is manifest in a private repo?
  this.expires = moment().add(Manifest.TTL).valueOf()
}

Manifest.TTL = moment.duration({hours: 1})

exports.getManifest = function (user, repo, path, ref, urlParams, authToken, cb) {

  urlParams = urlParams || {}

  var manifestKey = "manifest/" + user + "/" + repo

  if (path && path[path.length - 1] === "/") {
    path = path.slice(0, -1)
  }

  if (path) {
    manifestKey += "/" + path
  }

  if (ref) {
    manifestKey += "/#" + ref
  }

  db.get(manifestKey, function (er, manifest) {
    if (er && !er.notFound) return cb(er)

    if (manifest && !manifest.private && manifest.expires > Date.now()) {
      console.log("Using cached manifest", manifestKey, manifest.data.name, manifest.data.version)
      return cb(null, JSON.parse(JSON.stringify(manifest.data)))
    }

    var gh = github.getInstance(authToken)
        , batchKey = manifestKey + (authToken || '')

    if (batch.exists(batchKey)) {
      return batch.push(batchKey, cb)
    }

    batch.push(batchKey, cb)

    var opts = {user: user, repo: repo, path: (path ? path + "/" : "") + "package.json"}

    // Add "ref" options if ref is set. Otherwise use default branch.
    if (ref) {
      opts.ref = ref
    }

    gh.repos.getContent(opts, function (er, resp) {
      if (er) {
        console.error("Failed to get package.json", user, repo, path, ref, er)
        return batch.call(batchKey, function (cb) { cb(er) })
      }

      if (manifest && manifest.expires > Date.now()) {
        console.log("Using cached private manifest", manifest.data.name, manifest.data.version, ref)
        return batch.call(batchKey, function (cb) {
          cb(null, manifest.data)
        })
      }

      var data

      try {
        // JSON.parse will barf with a SyntaxError if the body is ill.
        data = JSON.parse(new Buffer(resp.content, resp.encoding))
      } catch (er) {
        console.error("Failed to parse package.json", resp)
        return batch.call(batchKey, function (cb) {
          cb(new Error("Failed to parse package.json: " + (resp && resp.content)))
        })
      }

      if (!data) {
        console.error("Empty package.json")
        return batch.call(batchKey, function (cb) {
          cb(new Error("Empty package.json"))
        })
      }

      console.log("Got manifest", data.name, data.version, ref)

      if (!authToken) {
        // There was no authToken so MUST be public
        onGetRepo(null, {"private": false})
      } else {
        // Get repo info so we can determine private/public status
        gh.repos.get({user: user, repo: repo}, onGetRepo)
      }

      function onGetRepo (er, repoData) {
        if (er) {
          console.error("Failed to get repo data", user, repo, er)
          return batch.call(batchKey, function (cb) { cb(er) })
        }

        opts = {user: user, repo: repo, path: (path ? path + "/" : "") + "npm-shrinkwrap.json"}

        gh.repos.getContent(opts, function (er, shResp) {

          var shrinkwrap

          if (shResp) {

            try {
              // JSON.parse will barf with a SyntaxError if the body is ill.
              shrinkwrap = JSON.parse(new Buffer(shResp.content, shResp.encoding))
            } catch (er) {
              console.error("Failed to parse npm-shrinkwrap.json", shResp)
              return batch.call(batchKey, function (cb) {
                cb(new Error("Failed to parse npm-shrinkwrap.json: " + (shResp && shResp.content)))
              })
            }
          }


          if (shrinkwrap && urlParams.shrinkwrap === 'true') {
            console.log('Using npm-shrinkwrap.json')

            // merge shrinkwrap information into data
            var dependencyNames = Object.getOwnPropertyNames(shrinkwrap.dependencies)
            var dependencyTypes = ['dependencies', 'peerDependencies', 'optionalDependencies']

            // shrinkwarp stores three dependency types under "dependencies"
            // we have to iterate over all types to be sure to merge all
            dependencyTypes.forEach(function (dependencyType) {
              // iterate through the dependencies
              dependencyNames.forEach(function (dependency) {
                if (data[dependencyType] && data[dependencyType][dependency]) {
                  // update package.json version information with pinned shrinkwrap version
                  data[dependencyType][dependency] = shrinkwrap.dependencies[dependency].version
                }
              })
            })
          }

          var oldManifest = manifest

          data.ref = ref
          manifest = new Manifest(data, repoData.private)

          db.put(manifestKey, manifest, function (er) {
            if (er) {
              console.error("Failed to save manifest", manifestKey, er)
              return batch.call(batchKey, function (cb) { cb(er) })
            }

            console.log("Cached at", manifestKey);

            batch.call(batchKey, function (cb) {
              cb(null, manifest.data)
            })

            if (!oldManifest) {
              exports.emit("retrieve", manifest.data, user, repo, path, ref, repoData.private)
            } else {

              var oldDependencies = oldManifest ? oldManifest.data.dependencies : {}
                  , oldDevDependencies = oldManifest ? oldManifest.data.devDependencies : {}
                  , oldPeerDependencies = oldManifest ? oldManifest.data.peerDependencies : {}
                  , oldOptionalDependencies = oldManifest ? oldManifest.data.optionalDependencies : {}

              if (exports.listenerCount("dependenciesChange")) {
                var diffs = depDiff(oldDependencies, data.dependencies)

                if (diffs.length) {
                  exports.emit("dependenciesChange", diffs, manifest.data, user, repo, path, ref, repoData.private)
                }
              }

              if (exports.listenerCount("devDependenciesChange")) {
                diffs = depDiff(oldDevDependencies, data.devDependencies)

                if (diffs.length) {
                  exports.emit("devDependenciesChange", diffs, manifest.data, user, repo, path, ref, repoData.private)
                }
              }

              if (exports.listenerCount("peerDependenciesChange")) {
                diffs = depDiff(oldPeerDependencies, data.peerDependencies)

                if (diffs.length) {
                  exports.emit("peerDependenciesChange", diffs, manifest.data, user, repo, path, ref, repoData.private)
                }
              }

              if (exports.listenerCount("optionalDependenciesChange")) {
                diffs = depDiff(oldOptionalDependencies, data.optionalDependencies)

                if (diffs.length) {
                  exports.emit("optionalDependenciesChange", diffs, manifest.data, user, repo, path, ref, repoData.private)
                }
              }
            }
          })
        })
      }
    })
  })
}

/**
 * Set the TTL for cached manifests.
 *
 * @param {moment.duration} duration Time period the manifests will be cahced for, expressed as a moment.duration.
 */
exports.setCacheDuration = function (duration) {
  Manifest.TTL = duration
}

// When a user publishes a project, they likely updated their project dependencies
registry.on("change", function (change) {
  var info = githubUrl(change.doc.repository, config.github.host)
  if (!info) return

  var batch = []

  db.createReadStream({
    gt: "manifest/" + info.user + "/" + info.project + "/",
    lt: "manifest/" + info.user + "/" + info.project + "/\xFF"
  }).on("data", function (data) {
    data.value.expires = Date.now()
    batch.push({type: "put", key: data.key, value: data.value })
  }).on("end", function () {
    if (!batch.length) return

    var keys = batch.map(function (b) { return b.key })

    db.batch(batch, function (er) {
      if (er) console.error("Failed to expire cached manifest", keys, er)
      console.log("Expired cached manifest", keys)
    })
  })
})
