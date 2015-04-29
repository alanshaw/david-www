var path = require("path")
var manifest = require("../lib/manifest")
var brains = require("../lib/brains")
var getDepsType = require("./helpers/get-deps-type")

function getBadgePath (status, opts) {
  opts = opts || {}

  var type = opts.type ? opts.type + "-" : ""
  var retina = opts.retina ? "@2x" : ""
  var extension = opts.extension == "png" ? "png" : "svg"
  var style = extension == "svg" && opts.style == "flat-square" ? "-" + opts.style : ""

  return path.resolve(__dirname + "/../dist/img/status/" + type + status + retina + style + "." + extension)
}

/**
 * Send the status badge for this user and repository
 */
function sendStatusBadge (req, res, opts) {
  opts = opts || {}

  res.setHeader("Cache-Control", "no-cache")

  var badgePathOpts = {
    type: getDepsType(opts),
    retina: opts.retina,
    style: req.query.style,
    extension: opts.extension
  }

  var sendFileCb = function (er) {
    if (er) {
      console.error("Failed to send status badge", er)
      if (er.code == "ENOENT") return res.status(404).end()
      res.status(500).end()
    }
  }

  req.session.get("session/access-token", function (er, authToken) {
    if (er) return res.status(500).sendFile(getBadgePath("unknown", badgePathOpts), sendFileCb)

    manifest.getManifest(req.params.user, req.params.repo, req.params.ref, authToken, function (er, manifest) {
      if (er) return res.status(404).sendFile(getBadgePath("unknown", badgePathOpts), sendFileCb)

      brains.getInfo(manifest, opts, function (er, info) {
        if (er) return res.status(500).sendFile(getBadgePath("unknown", badgePathOpts), sendFileCb)

        res.sendFile(getBadgePath(info.status, badgePathOpts), sendFileCb)
      })
    })
  })
}

function statusBadge (req, res) {
  sendStatusBadge(req, res, {extension: "svg"})
}

statusBadge.png = function (req, res) {
  sendStatusBadge(req, res, {extension: "png"})
}

statusBadge.retina = function (req, res) {
  sendStatusBadge(req, res, {retina: true, extension: "png"})
}

/* dev */

statusBadge.dev = function (req, res) {
  sendStatusBadge(req, res, {dev: true, extension: "svg"})
}

statusBadge.dev.png = function (req, res) {
  sendStatusBadge(req, res, {dev: true, extension: "png"})
}

statusBadge.dev.retina = function (req, res) {
  sendStatusBadge(req, res, {dev: true, retina: true, extension: "png"})
}

/* peer */

statusBadge.peer = function (req, res) {
  sendStatusBadge(req, res, {peer: true, extension: "svg"})
}

statusBadge.peer.png = function (req, res) {
  sendStatusBadge(req, res, {peer: true, extension: "png"})
}

statusBadge.peer.retina = function (req, res) {
  sendStatusBadge(req, res, {peer: true, retina: true, extension: "png"})
}

/* optional */

statusBadge.optional = function (req, res) {
  sendStatusBadge(req, res, {optional: true, extension: "svg"})
}

statusBadge.optional.png = function (req, res) {
  sendStatusBadge(req, res, {optional: true, extension: "png"})
}

statusBadge.optional.retina = function (req, res) {
  sendStatusBadge(req, res, {optional: true, retina: true, extension: "png"})
}

module.exports = statusBadge
