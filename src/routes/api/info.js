import Boom from 'boom'
import merge from 'merge'
import createWithManifestAndInfo from '../helpers/with-manifest-and-info'

export default (app, manifest, brains) => {
  const withManifestAndInfo = createWithManifestAndInfo(manifest, brains)

  app.get('/:user/:repo/:ref?/dev-info.json', (req, res, next) => {
    withManifestAndInfo(req, {dev: true}, (err, manifest, info) => {
      if (err) return next(Boom.wrap(err, 500, 'Failed to get manifest and info'))
      const payload = merge({manifest: minifyManifest(manifest), info}, projectData(req, 'dev'))
      res.json(payload)
    })
  })

  app.get('/:user/:repo/:ref?/info.json', (req, res, next) => {
    withManifestAndInfo(req, (err, manifest, info) => {
      if (err) return next(Boom.wrap(err, 500, 'Failed to get manifest and info'))
      const payload = merge({manifest: minifyManifest(manifest), info}, projectData(req))
      res.json(payload)
    })
  })

  app.get('/:user/:repo/:ref?/peer-info.json', (req, res, next) => {
    withManifestAndInfo(req, {peer: true}, (err, manifest, info) => {
      if (err) return next(Boom.wrap(err, 500, 'Failed to get manifest and info'))
      const payload = merge({manifest: minifyManifest(manifest), info}, projectData(req, 'peer'))
      res.json(payload)
    })
  })

  app.get('/:user/:repo/:ref?/optional-info.json', (req, res, next) => {
    withManifestAndInfo(req, {optional: true}, (err, manifest, info) => {
      if (err) return next(Boom.wrap(err, 500, 'Failed to get manifest and info'))
      const payload = merge({manifest: minifyManifest(manifest), info}, projectData(req, 'optional'))
      res.json(payload)
    })
  })
}

function projectData (req, type) {
  const data = ['user', 'repo', 'ref'].reduce((d, key) => {
    if (req.params[key]) {
      d[key] = req.params[key]
    }
    return d
  }, {})

  if (req.query.path) {
    data.path = req.query.path
  }

  if (type) {
    data.type = type
  }

  return data
}

function minifyManifest (manifest = {}) {
  return [
    'name',
    'version',
    'description',
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies'
  ].reduce((mm, key) => {
    if (manifest[key]) {
      mm[key] = manifest[key]
    }
    return mm
  }, {})
}
