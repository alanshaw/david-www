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
  , config = require("config")
  , registry = require("./registry")
  , github = require("./github")
  , githubUrl = require("github-url")
  , depDiff = require("dep-diff")
  , batch = require("./batch")()

module.exports = exports = new events.EventEmitter()

function Manifest (data, priv) {
  this.data = data
  this.private = priv // Is manifest in a private repo?
  this.expires = moment().add(Manifest.TTL)
}

Manifest.TTL = moment.duration({hours: 1})

var manifests = {}

/**
 * Prevent JSON.parse errors from going postal and killing us all.
 * Currently we smother SyntaxError and the like into a more manageable null.
 * We may do something more clever soon.
 *
 * @param body
 * @return {*}
 */
function parseManifest (body) {
  try {
    // JSON.parse will barf with a SyntaxError if the body is ill.
    return JSON.parse(body)
  } catch (error) {
    return null
  }
}

exports.getManifest = function (user, repo, authToken, cb) {
  var manifest = manifests[user] ? manifests[user][repo] : null

  if (manifest && !manifest.private && manifest.expires > new Date()) {
    console.log("Using cached manifest", manifest.data.name, manifest.data.version)
    return cb(null, JSON.parse(JSON.stringify(manifest.data)))
  }

  var gh = github.getInstance(authToken)
    , batchKey = [user, repo, authToken].join("-")
  
  if (batch.exists(batchKey)) {
    return batch.push(batchKey, cb)
  }

  batch.push(batchKey, cb)

  gh.repos.getContent({user: user, repo: repo, path: "package.json"}, function (er, resp) {
    if (er) return cb(er)

    if (manifest && manifest.expires > new Date()) {
      console.log("Using cached private manifest", manifest.data.name, manifest.data.version)
      return batch.call(batchKey, function (cb) {
        cb(null, JSON.parse(JSON.stringify(manifest.data)))
      })
    }

    var packageJson = new Buffer(resp.content, resp.encoding).toString()
    var data = parseManifest(packageJson)

    if (!data) {
      return batch.call(batchKey, function (cb) {
        cb(new Error("Failed to parse package.json: " + packageJson))
      })
    }

    console.log("Got manifest", data.name, data.version)

    if (!authToken) {
      // There was no authToken so MUST be public
      onGetRepo(null, {"private": false})
    } else {
      // Get repo info so we can determine private/public status
      gh.repos.get({user: user, repo: repo}, onGetRepo)
    }
    
    function onGetRepo (er, repoData) {
      if (er) return console.error("Failed to get repo data", user, repo, er)

      var oldManifest = manifest

      manifest = new Manifest(data, repoData.private)

      manifests[user] = manifests[user] || {}
      manifests[user][repo] = manifest
      
      batch.call(batchKey, function (cb) {
        cb(null, manifest.data)
      })

      if (!oldManifest) {
        exports.emit("retrieve", manifest.data, user, repo, repoData.private)
      } else {

        var oldDependencies = oldManifest ? oldManifest.data.dependencies : {}
          , oldDevDependencies = oldManifest ? oldManifest.data.devDependencies : {}
          , oldPeerDependencies = oldManifest ? oldManifest.data.peerDependencies : {}
          , oldOptionalDependencies = oldManifest ? oldManifest.data.optionalDependencies : {}

        var diffs = depDiff(oldDependencies, data.dependencies)

        if (diffs.length) {
          exports.emit("dependenciesChange", diffs, manifest.data, user, repo, repoData.private)
        }

        diffs = depDiff(oldDevDependencies, data.devDependencies)

        if (diffs.length) {
          exports.emit("devDependenciesChange", diffs, manifest.data, user, repo, repoData.private)
        }

        diffs = depDiff(oldPeerDependencies, data.peerDependencies)

        if (diffs.length) {
          exports.emit("peerDependenciesChange", diffs, manifest.data, user, repo, repoData.private)
        }

        diffs = depDiff(oldOptionalDependencies, data.optionalDependencies)

        if (diffs.length) {
          exports.emit("optionalDependenciesChange", diffs, manifest.data, user, repo, repoData.private)
        }
      }
    }
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

  // Expire the cached manifest for this user/repo
  if (info && manifests[info.user] && manifests[info.user][info.project]) {
    console.log("Expiring cached manifest", info.user, info.project)
    manifests[info.user][info.project].expires = moment()
  }
})
