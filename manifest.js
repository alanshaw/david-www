/**
 * Events:
 * dependenciesChange(differences, manifest, user, repo) - When one or more dependencies for a manifest change
 * devDependenciesChange(differences, manifest, user, repo) - When one or more devDependencies for a manifest change
 * peerDependenciesChange(differences, manifest, user, repo) - When one or more peerDependencies for a manifest change
 * optionalDependenciesChange(differences, manifest, user, repo) - When one or more optionalDependencies for a manifest change
 * retrieve(manifest, user, repo) - The first time a manifest is retrieved
 */

var events = require("events")
  , moment = require("moment")
  , GitHubApi = require("github")
  , config = require("config")
  , registry = require("./registry")
  , githubUrl = require("github-url")
  , depDiff = require("dep-diff")

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

var exports = new events.EventEmitter()

function Manifest (data) {
  this.data = data
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

exports.getManifest = function (user, repo, cb) {
  var manifest = manifests[user] ? manifests[user][repo] : null

  if (manifest && manifest.expires > new Date()) {
    console.log("Using cached manifest", manifest.data.name, manifest.data.version)
    return cb(null, JSON.parse(JSON.stringify(manifest.data)))
  }

  github.repos.getContent({user: user, repo: repo, path: "package.json"}, function (er, resp) {
    if (er) return cb(er)

    var packageJson = new Buffer(resp.content, resp.encoding).toString()
    var data = parseManifest(packageJson)

    if (!data) {
      return cb(new Error("Failed to parse package.json: " + packageJson))
    }

    console.log("Got manifest", data.name, data.version)

    var oldManifest = manifest

    manifest = new Manifest(data)

    manifests[user] = manifests[user] || {}
    manifests[user][repo] = manifest

    cb(null, manifest.data)

    if (!oldManifest) {
      exports.emit("retrieve", manifest.data, user, repo)
    } else {

      var oldDependencies = oldManifest ? oldManifest.data.dependencies : {}
        , oldDevDependencies = oldManifest ? oldManifest.data.devDependencies : {}
        , oldPeerDependencies = oldManifest ? oldManifest.data.peerDependencies : {}
        , oldOptionalDependencies = oldManifest ? oldManifest.data.optionalDependencies : {}

      var diffs = depDiff(oldDependencies, data.dependencies)

      if (diffs.length) {
        exports.emit("dependenciesChange", diffs, manifest.data, user, repo)
      }

      diffs = depDiff(oldDevDependencies, data.devDependencies)

      if (diffs.length) {
        exports.emit("devDependenciesChange", diffs, manifest.data, user, repo)
      }

      diffs = depDiff(oldPeerDependencies, data.peerDependencies)

      if (diffs.length) {
        exports.emit("peerDependenciesChange", diffs, manifest.data, user, repo)
      }

      diffs = depDiff(oldOptionalDependencies, data.optionalDependencies)

      if (diffs.length) {
        exports.emit("optionalDependenciesChange", diffs, manifest.data, user, repo)
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

module.exports = exports
