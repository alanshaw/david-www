var withManifestAndInfo = require("../helpers/with-manifest-and-info")

function info (req, res) {
  withManifestAndInfo(req, res, function (manifest, info) {
    res.json(info)
  })
}

info.dev = function (req, res) {
  withManifestAndInfo(req, res, {dev: true}, function (manifest, info) {
    res.json(info)
  })
}

info.peer = function (req, res) {
  withManifestAndInfo(req, res, {peer: true}, function (manifest, info) {
    res.json(info)
  })
}

info.optional = function (req, res) {
  withManifestAndInfo(req, res, {optional: true}, function (manifest, info) {
    res.json(info)
  })
}

module.exports = info
