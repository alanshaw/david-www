import { EventEmitter } from 'events'
import moment from 'moment'
import depDiff from 'dep-diff'
import githubUrl from 'github-url'
import Batch from 'david/lib/batch'
import copy from 'utils-copy-error'

export default ({db, registry, github, githubConfig, gitlab, gitlabConfig}) => {
  const batch = new Batch()

  /**
   * Events:
   * dependenciesChange(differences, manifest, user, repo, private)
   *   When one or more dependencies for a manifest change
   * devDependenciesChange(differences, manifest, user, repo, private)
   *   When one or more devDependencies for a manifest change
   * peerDependenciesChange(differences, manifest, user, repo, private)
   *   When one or more peerDependencies for a manifest change
   * optionalDependenciesChange(differences, manifest, user, repo, private)
   *   When one or more optionalDependencies for a manifest change
   * retrieve(manifest, user, repo, private)
   *   The first time a manifest is retrieved
   */
  const Manifest = new EventEmitter()

  Manifest.hasCachedManifest = (user, repo, opts, cb) => {
    if (!cb) {
      cb = opts
      opts = {}
    }

    opts = opts || {}

    const manifestKey = createManifestKey(user, repo, opts)

    db.get(manifestKey, (err, manifest) => {
      if (err) return err.notFound ? cb(null, false) : cb(err)

      if (!opts.noCache && manifest && !manifest.private && manifest.expires > Date.now()) {
        return cb(null, true)
      }

      cb(null, false)
    })
  }

  Manifest.getManifest = (user, repo, opts, cb) => {
    if (!cb) {
      cb = opts
      opts = {}
    }

    opts = opts || {}

    const manifestKey = createManifestKey(user, repo, opts)
    const batchKey = manifestKey + (opts.authToken || '')

    if (batch.exists(batchKey)) {
      return batch.push(batchKey, cb)
    }

    batch.push(batchKey, cb)

    db.get(manifestKey, (err, manifest) => {
      if (err && !err.notFound) return batch.call(batchKey, (cb) => cb(copy(err)))

      if (!opts.noCache && manifest && !manifest.private && manifest.expires > Date.now()) {
        console.log('Using cached manifest', manifestKey, manifest.data.name, manifest.data.version)
        return batch.call(batchKey, (cb) => cb(null, manifest.data))
      }

      let gh
      const ghOpts = {owner: user, repo, path: (opts.path ? opts.path + '/' : '') + 'package.json'}

      if (opts.driver === 'gitlab') {
        gh = gitlab.getInstance()
      } else {
        gh = github.getInstance(opts.authToken)
      }

      // Add "ref" options if ref is set. Otherwise use default branch.
      if (opts.ref) {
        ghOpts.ref = opts.ref
      }

      if (manifest) {
        ghOpts.headers = { 'If-None-Match': manifest.etag }
      }

      gh.repos.getContent(ghOpts, (err, resp) => {
        if (err) {
          if (err.code === '504' && !opts.noCache && manifest && !manifest.private) {
            console.log('Using expired cached manifest', manifestKey, manifest.data.name, manifest.data.version)
            return batch.call(batchKey, (cb) => cb(null, manifest.data))
          }

          console.error('Failed to get package.json', user, repo, opts.path, opts.ref, err)
          return batch.call(batchKey, (cb) => cb(copy(err)))
        }

        if (!opts.noCache && manifest && manifest.expires > Date.now()) {
          console.log('Using cached private manifest', manifest.data.name, manifest.data.version, opts.ref)
          return batch.call(batchKey, (cb) => cb(null, manifest.data))
        }

        if (!opts.noCache && manifest && resp.meta && resp.meta.status === '304 Not Modified') {
          console.log('Using unmodified manifest', manifest.data.name, manifest.data.version, opts.ref)

          manifest.expires = moment().add(moment.duration({ hours: 1 })).valueOf()

          return db.put(manifestKey, manifest, (err) => {
            if (err) return batch.call(batchKey, (cb) => cb(copy(err)))
            batch.call(batchKey, (cb) => cb(null, manifest.data))
          })
        }

        let data

        try {
          // JSON.parse will barf with a SyntaxError if the body is ill.
          const buffer = Buffer.from(resp.data.content, resp.data.encoding)
          data = JSON.parse(buffer.toString().trim())
        } catch (err) {
          console.error('Failed to parse package.json', resp, err)
          return batch.call(batchKey, (cb) => {
            const content = resp && resp.data && resp.data.content
            cb(new Error('Failed to parse package.json: ' + content))
          })
        }

        if (!data) {
          console.error('Empty package.json')
          return batch.call(batchKey, (cb) => cb(new Error('Empty package.json')))
        }

        console.log('Got manifest', data.name, data.version, opts.ref)

        if (!opts.authToken) {
          // There was no authToken so MUST be public
          onGetRepo(null, {'private': false})
        } else {
          // Get repo info so we can determine private/public status
          gh.repos.get({user: user, repo: repo}, onGetRepo)
        }

        function onGetRepo (err, repoData) {
          if (err) {
            console.error('Failed to get repo data', user, repo, err)
            return batch.call(batchKey, (cb) => cb(copy(err)))
          }

          const oldManifest = manifest

          data.ref = opts.ref
          manifest = {
            data,
            etag: resp.meta.etag,
            private: repoData.private,
            expires: moment().add(moment.duration({ hours: 1 })).valueOf()
          }

          db.put(manifestKey, manifest, (err) => {
            if (err) {
              console.error('Failed to save manifest', manifestKey, err)
              return batch.call(batchKey, (cb) => cb(copy(err)))
            }

            console.log('Cached at', manifestKey)

            batch.call(batchKey, (cb) => cb(null, manifest.data))

            if (!oldManifest) {
              Manifest.emit('retrieve', manifest.data, user, repo, opts.path, opts.ref, repoData.private)
            } else {
              const oldDependencies = oldManifest ? oldManifest.data.dependencies : {}
              const oldDevDependencies = oldManifest ? oldManifest.data.devDependencies : {}
              const oldPeerDependencies = oldManifest ? oldManifest.data.peerDependencies : {}
              const oldOptionalDependencies = oldManifest ? oldManifest.data.optionalDependencies : {}

              let diffs

              if (Manifest.listenerCount('dependenciesChange')) {
                diffs = depDiff(oldDependencies, data.dependencies)

                if (diffs.length) {
                  Manifest.emit('dependenciesChange', diffs, manifest.data, user, repo, opts.path, opts.ref, repoData.private)
                }
              }

              if (Manifest.listenerCount('devDependenciesChange')) {
                diffs = depDiff(oldDevDependencies, data.devDependencies)

                if (diffs.length) {
                  Manifest.emit('devDependenciesChange', diffs, manifest.data, user, repo, opts.path, opts.ref, repoData.private)
                }
              }

              if (Manifest.listenerCount('peerDependenciesChange')) {
                diffs = depDiff(oldPeerDependencies, data.peerDependencies)

                if (diffs.length) {
                  Manifest.emit('peerDependenciesChange', diffs, manifest.data, user, repo, opts.path, opts.ref, repoData.private)
                }
              }

              if (Manifest.listenerCount('optionalDependenciesChange')) {
                diffs = depDiff(oldOptionalDependencies, data.optionalDependencies)

                if (diffs.length) {
                  Manifest.emit('optionalDependenciesChange', diffs, manifest.data, user, repo, opts.path, opts.ref, repoData.private)
                }
              }
            }
          })
        }
      })
    })
  }

  // When a user publishes a project, they likely updated their project dependencies
  registry.on('change', (change) => {
    const info = githubUrl(change.doc.repository, githubConfig.host)
    if (!info) return

    const batch = []

    db.createReadStream({
      gt: `manifest/${info.user}/${info.project}/`,
      lt: `manifest/${info.user}/${info.project}/\xFF`
    }).on('data', (data) => {
      data.value.expires = Date.now()
      batch.push({type: 'put', key: data.key, value: data.value})
    }).on('end', () => {
      if (!batch.length) return

      const keys = batch.map((b) => b.key)

      db.batch(batch, (err) => {
        if (err) return console.error('Failed to expire cached manifest', keys, err)
        console.log('Expired cached manifest', keys)
      })
    })
  })

  function createManifestKey (user, repo, opts) {
    opts = opts || {}

    let manifestKey = `manifest/${user}/${repo}`

    if (opts.driver !== 'gitlab' && !!opts.driver) {
      manifestKey += '/gitlab'
    }

    if (opts.path && opts.path[opts.path.length - 1] === '/') {
      opts.path = opts.path.slice(0, -1)
    }

    if (opts.path) {
      manifestKey += `/${opts.path}`
    }

    return `${manifestKey}/#${opts.ref || ''}`
  }

  return Manifest
}
