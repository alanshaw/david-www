import Boom from 'boom'
import createWithManifestAndInfo from '../helpers/with-manifest-and-info'

export default (app, manifest, brains) => {
  const withManifestAndInfo = createWithManifestAndInfo(manifest, brains)

  app.get('/:user/:repo/:ref?/dev-info.json', (req, res, next) => {
    withManifestAndInfo(req, {dev: true}, (err, manifest, info) => {
      if (err) return next(Boom.wrap(err, 500, 'Failed to get manifest and info'))
      res.json(info)
    })
  })

  app.get('/:user/:repo/:ref?/info.json', (req, res, next) => {
    withManifestAndInfo(req, (err, manifest, info) => {
      if (err) return next(Boom.wrap(err, 500, 'Failed to get manifest and info'))
      res.json(info)
    })
  })

  app.get('/:user/:repo/:ref?/peer-info.json', (req, res, next) => {
    withManifestAndInfo(req, {peer: true}, (err, manifest, info) => {
      if (err) return next(Boom.wrap(err, 500, 'Failed to get manifest and info'))
      res.json(info)
    })
  })

  app.get('/:user/:repo/:ref?/optional-info.json', (req, res, next) => {
    withManifestAndInfo(req, {optional: true}, (err, manifest, info) => {
      if (err) return next(Boom.wrap(err, 500, 'Failed to get manifest and info'))
      res.json(info)
    })
  })

  app.get('/r/:remote/:user/:repo/:ref?/dev-info.json', (req, res, next) => {
    withManifestAndInfo(req, {driver: req.params.remote, dev: true}, (err, manifest, info) => {
      if (err) return next(Boom.wrap(err, 500, 'Failed to get manifest and info'))
      res.json(info)
    })
  })

  app.get('/r/:remote/:user/:repo/:ref?/info.json', (req, res, next) => {
    withManifestAndInfo(req, {driver: req.params.remote}, (err, manifest, info) => {
      if (err) return next(Boom.wrap(err, 500, 'Failed to get manifest and info'))
      res.json(info)
    })
  })

  app.get('/r/:remote/:user/:repo/:ref?/peer-info.json', (req, res, next) => {
    withManifestAndInfo(req, {driver: req.params.remote, peer: true}, (err, manifest, info) => {
      if (err) return next(Boom.wrap(err, 500, 'Failed to get manifest and info'))
      res.json(info)
    })
  })

  app.get('/r/:remote/:user/:repo/:ref?/optional-info.json', (req, res, next) => {
    withManifestAndInfo(req, {driver: req.params.remote, optional: true}, (err, manifest, info) => {
      if (err) return next(Boom.wrap(err, 500, 'Failed to get manifest and info'))
      res.json(info)
    })
  })
}
