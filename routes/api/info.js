module.exports = function (app, manifest, brains) {
  var withManifestAndInfo = require('../helpers/with-manifest-and-info')(manifest, brains)

  app.get('/:user/:repo/:ref?/dev-info.json', function (req, res) {
    withManifestAndInfo(req, res, {dev: true}, function (manifest, info) {
      res.json(info)
    })
  })

  app.get('/:user/:repo/:ref?/info.json', function (req, res) {
    withManifestAndInfo(req, res, function (manifest, info) {
      res.json(info)
    })
  })

  app.get('/:user/:repo/:ref?/peer-info.json', function (req, res) {
    withManifestAndInfo(req, res, {peer: true}, function (manifest, info) {
      res.json(info)
    })
  })

  app.get('/:user/:repo/:ref?/optional-info.json', function (req, res) {
    withManifestAndInfo(req, res, {optional: true}, function (manifest, info) {
      res.json(info)
    })
  })
}
