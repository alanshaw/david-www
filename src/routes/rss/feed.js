import Boom from 'boom'

export default (app, feed, manifest) => {
  app.get('/:user/:repo/:ref?/rss.xml', (req, res, next) => {
    buildRssFeed(req, res, next, false)
  })

  app.get('/:user/:repo/:ref?/dev-rss.xml', (req, res, next) => {
    buildRssFeed(req, res, next, true)
  })

  function buildRssFeed (req, res, next, dev) {
    req.session.get('session/access-token', (err, authToken) => {
      if (err) return next(Boom.wrap(err, 500, 'Failed to get session access token'))

      const { user, repo, ref } = req.params
      const path = req.query.path

      manifest.getManifest(user, repo, { path, ref, authToken }, (err, manifest) => {
        if (err) return next(Boom.wrap(err, 500, 'Failed to get package.json'))

        feed.get(manifest, { dev }, (err, xml) => {
          if (err) return next(Boom.wrap(err, 500, 'Failed to build RSS XML'))

          res.contentType('application/rss+xml')
          res.send(xml, 200)
        })
      })
    })
  }
}
