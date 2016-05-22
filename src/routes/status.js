import Boom from 'boom'
import createWithManifestAndInfo from './helpers/with-manifest-and-info'

export default (app, manifest, brains) => {
  const withManifestAndInfo = createWithManifestAndInfo(manifest, brains)

  app.get('/:user/:repo/:ref?', (req, res, next) => {
    withManifestAndInfo(req, { noCache: !!res.locals.user }, (err, manifest, info) => {
      if (err) return next(Boom.wrap(err, 500, 'Failed to get manifest and info'))

      res.render('status', {
        user: req.params.user,
        repo: req.params.repo,
        path: req.query.path,
        ref: req.params.ref ? '/' + req.params.ref : '',
        manifest,
        info
      })
    })
  })
}
