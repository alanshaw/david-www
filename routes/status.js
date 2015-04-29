var withManifestAndInfo = require("./helpers/with-manifest-and-info")

module.exports = function (req, res) {
  withManifestAndInfo(req, res, function (manifest, info) {
    res.render("status", {
      user: req.params.user,
      repo: req.params.repo,
      ref:  req.params.ref ? "/" + req.params.ref : "",
      manifest: manifest,
      info: info
    })
  })
}
