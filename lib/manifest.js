/**
 * Events:
 * dependenciesChange(differences, manifest, user, repo, private) - When one or more dependencies for a manifest change
 * devDependenciesChange(differences, manifest, user, repo, private) - When one or more devDependencies for a manifest change
 * peerDependenciesChange(differences, manifest, user, repo, private) - When one or more peerDependencies for a manifest change
 * optionalDependenciesChange(differences, manifest, user, repo, private) - When one or more optionalDependencies for a manifest change
 * retrieve(manifest, user, repo, private) - The first time a manifest is retrieved
 */

var EventEmitter = require('events').EventEmitter
var moment = require('moment')
var depDiff = require('dep-diff')
var githubUrl = require('github-url')
var config = require('../config')
var registry = require('./registry')
var github = require('./github')
var batch = require('./batch')()
var db = require('./db')

module.exports = exports = new EventEmitter()

function Manifest (data, priv) {
  this.data = data
  this.private = priv // Is manifest in a private repo?
  this.expires = moment().add(Manifest.TTL).valueOf()
}

Manifest.TTL = moment.duration({hours: 1})

exports.getManifest = function (user, repo, path, ref, authToken, cb) {
  var manifestKey = 'manifest/' + user + '/' + repo

  if (path && path[path.length - 1] === '/') {
    path = path.slice(0, -1)
  }

  if (path) {
    manifestKey += '/' + path
  }

  manifestKey += '/#' + (ref || '')

  db.get(manifestKey, function (err, manifest) {
    if (err && !err.notFound) return cb(err)

    if (manifest && !manifest.private && manifest.expires > Date.now()) {
      console.log('Using cached manifest', manifestKey, manifest.data.name, manifest.data.version)
      return cb(null, JSON.parse(JSON.stringify(manifest.data)))
    }

    var gh = github.getInstance(authToken)
    var batchKey = manifestKey + (authToken || '')

    if (batch.exists(batchKey)) {
      return batch.push(batchKey, cb)
    }

    batch.push(batchKey, cb)

    var opts = {user: user, repo: repo, path: (path ? path + '/' : '') + 'package.json'}

    // Add "ref" options if ref is set. Otherwise use default branch.
    if (ref) {
      opts.ref = ref
    }

    gh.repos.getContent(opts, function (err, resp) {
      if (err) {
        console.error('Failed to get package.json', user, repo, path, ref, err)
        return batch.call(batchKey, function (cb) { cb(err) })
      }

      if (manifest && manifest.expires > Date.now()) {
        console.log('Using cached private manifest', manifest.data.name, manifest.data.version, ref)
        return batch.call(batchKey, function (cb) {
          cb(null, manifest.data)
        })
      }

      var data

      try {
        // JSON.parse will barf with a SyntaxError if the body is ill.
        data = JSON.parse(new Buffer(resp.content, resp.encoding))
      } catch (err) {
        console.error('Failed to parse package.json', resp, err)
        return batch.call(batchKey, function (cb) {
          cb(new Error('Failed to parse package.json: ' + (resp && resp.content)))
        })
      }

      if (!data) {
        console.error('Empty package.json')
        return batch.call(batchKey, function (cb) {
          cb(new Error('Empty package.json'))
        })
      }

      console.log('Got manifest', data.name, data.version, ref)

      if (!authToken) {
        // There was no authToken so MUST be public
        onGetRepo(null, {'private': false})
      } else {
        // Get repo info so we can determine private/public status
        gh.repos.get({user: user, repo: repo}, onGetRepo)
      }

      function onGetRepo (err, repoData) {
        if (err) {
          console.error('Failed to get repo data', user, repo, err)
          return batch.call(batchKey, function (cb) { cb(err) })
        }

        var oldManifest = manifest

        data.ref = ref
        manifest = new Manifest(data, repoData.private)

        db.put(manifestKey, manifest, function (err) {
          if (err) {
            console.error('Failed to save manifest', manifestKey, err)
            return batch.call(batchKey, function (cb) { cb(err) })
          }

          console.log('Cached at', manifestKey)

          batch.call(batchKey, function (cb) {
            cb(null, manifest.data)
          })

          if (!oldManifest) {
            exports.emit('retrieve', manifest.data, user, repo, path, ref, repoData.private)
          } else {
            var oldDependencies = oldManifest ? oldManifest.data.dependencies : {}
            var oldDevDependencies = oldManifest ? oldManifest.data.devDependencies : {}
            var oldPeerDependencies = oldManifest ? oldManifest.data.peerDependencies : {}
            var oldOptionalDependencies = oldManifest ? oldManifest.data.optionalDependencies : {}

            if (exports.listenerCount('dependenciesChange')) {
              var diffs = depDiff(oldDependencies, data.dependencies)

              if (diffs.length) {
                exports.emit('dependenciesChange', diffs, manifest.data, user, repo, path, ref, repoData.private)
              }
            }

            if (exports.listenerCount('devDependenciesChange')) {
              diffs = depDiff(oldDevDependencies, data.devDependencies)

              if (diffs.length) {
                exports.emit('devDependenciesChange', diffs, manifest.data, user, repo, path, ref, repoData.private)
              }
            }

            if (exports.listenerCount('peerDependenciesChange')) {
              diffs = depDiff(oldPeerDependencies, data.peerDependencies)

              if (diffs.length) {
                exports.emit('peerDependenciesChange', diffs, manifest.data, user, repo, path, ref, repoData.private)
              }
            }

            if (exports.listenerCount('optionalDependenciesChange')) {
              diffs = depDiff(oldOptionalDependencies, data.optionalDependencies)

              if (diffs.length) {
                exports.emit('optionalDependenciesChange', diffs, manifest.data, user, repo, path, ref, repoData.private)
              }
            }
          }
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
registry.on('change', function (change) {
  var info = githubUrl(change.doc.repository, config.github.host)
  if (!info) return

  var batch = []

  db.createReadStream({
    gt: 'manifest/' + info.user + '/' + info.project + '/',
    lt: 'manifest/' + info.user + '/' + info.project + '/\xFF'
  }).on('data', function (data) {
    data.value.expires = Date.now()
    batch.push({type: 'put', key: data.key, value: data.value})
  }).on('end', function () {
    if (!batch.length) return

    var keys = batch.map(function (b) { return b.key })

    db.batch(batch, function (err) {
      if (err) return console.error('Failed to expire cached manifest', keys, err)
      console.log('Expired cached manifest', keys)
    })
  })
})
