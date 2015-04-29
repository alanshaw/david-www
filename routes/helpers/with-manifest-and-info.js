var manifest = require("../../lib/manifest")
var brains = require("../../lib/brains")
var errors = require("./errors")

/**
 * Common callback boilerplate of getting a manifest and info for the status page and badge
 */
module.exports = function (req, res, opts, cb) {
  // Allow callback to be passed as third parameter
  if (!cb) {
    cb = opts
    opts = {}
  } else {
    opts = opts || {}
  }

  req.session.get("session/access-token", function (err, authToken) {
    manifest.getManifest(req.params.user, req.params.repo, req.params.ref, authToken, function (er, manifest) {
      if (errors.happened(er, req, res, "Failed to get package.json")) {
        return
      }

      brains.getInfo(manifest, opts, function (er, info) {
        if (errors.happened(er, req, res, "Failed to get dependency info")) {
          return
        }

        cb(manifest, info)
      })
    })
  })
}
