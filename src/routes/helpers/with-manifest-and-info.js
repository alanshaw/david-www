import Boom from 'boom'

/**
 * Common callback boilerplate of getting a manifest and info for the status page and badge
 */
export default (manifest, brains) => {
  return (req, opts, cb) => {
    // Allow callback to be passed as second parameter
    if (!cb) {
      cb = opts
      opts = {}
    }

    opts = opts || {}

    const { user, repo, ref } = req.params

    opts.ref = opts.ref || ref
    opts.path = opts.path || req.query.path

    req.session.get('session/access-token', (err, authToken) => {
      if (err) return cb(Boom.wrap(err, 500, 'Failed to get session access token'))

      opts.authToken = opts.authToken || authToken

      manifest.getManifest(user, repo, opts, (err, manifest) => {
        if (err) return cb(Boom.wrap(err, 500, 'Failed to get package.json'))
        if (!brains) return cb(null, manifest)

        brains.getInfo(manifest, opts, (err, info) => {
          if (err) return cb(Boom.wrap(err, 500, 'Failed to get dependency info'))
          cb(null, manifest, info)
        })
      })
    })
  }
}
