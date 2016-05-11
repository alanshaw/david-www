module.exports = (app, manifest, brains, badgeToken) => {
  const withManifestAndInfo = require('./helpers/with-manifest-and-info')(manifest, brains)

  app.get('/:user/:repo/:ref?', (req, res) => {
    withManifestAndInfo(req, res, {noCache: !!res.locals.user}, (manifest, info, authToken) => {
      const token = (manifest.private && badgeToken.enabled) ? badgeToken.encrypt(authToken) : null

      res.render('status', {
        user: req.params.user,
        repo: req.params.repo,
        path: req.query.path,
        ref: req.params.ref ? '/' + req.params.ref : '',
        manifest,
        info,
        token
      })
    })
  })
}
