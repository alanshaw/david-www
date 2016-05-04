const errors = require('../helpers/errors')

module.exports = function (app, feed, manifest) {
  app.get('/:user/:repo/:ref?/rss.xml', (req, res) => {
    buildRssFeed(req, res, false)
  })

  app.get('/:user/:repo/:ref?/dev-rss.xml', (req, res) => {
    buildRssFeed(req, res, true)
  })

  function buildRssFeed (req, res, dev) {
    req.session.get('session/access-token', (err, authToken) => {
      if (errors.happened(err, req, res, 'Failed to get session access token')) {
        return
      }

      manifest.getManifest(req.params.user, req.params.repo, req.query.path, req.params.ref, authToken, (err, manifest) => {
        if (errors.happened(err, req, res, 'Failed to get package.json')) {
          return
        }

        feed.get(manifest, {dev: dev}, (err, xml) => {
          if (errors.happened(err, req, res, 'Failed to build RSS XML')) {
            return
          }

          res.contentType('application/rss+xml')
          res.send(xml, 200)
        })
      })
    })
  }
}
