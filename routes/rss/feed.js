var feed = require("../../lib/feed")
var manifest = require("../../lib/manifest")
var errors = require("../helpers/errors")

function buildRssFeed (req, res, dev) {
  req.session.get("session/access-token", function (err, authToken) {
    manifest.getManifest(req.params.user, req.params.repo, req.params.ref, authToken, function (er, manifest) {
      if (errors.happened(er, req, res, "Failed to get package.json")) {
        return
      }

      feed.get(manifest, {dev: dev}, function (er, xml) {
        if (errors.happened(er, req, res, "Failed to build RSS XML")) {
          return
        }

        res.contentType("application/rss+xml")
        res.send(xml, 200)
      })
    })
  })
}

function rssFeed (req, res) {
  buildRssFeed(req, res, false)
}

rssFeed.dev = function (req, res) {
  buildRssFeed(req, res, true)
}

module.exports = rssFeed
