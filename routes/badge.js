var path = require('path')
var getDepsType = require('./helpers/get-deps-type')

module.exports = function (app, manifest, brains) {
  app.get('/:user/:repo/:ref?/status.svg', function (req, res) {
    sendStatusBadge(req, res, {extension: 'svg'})
  })

  app.get('/:user/:repo/:ref?/status.png', function (req, res) {
    sendStatusBadge(req, res, {extension: 'png'})
  })

  app.get('/:user/:repo/:ref?/status@2x.png', function (req, res) {
    sendStatusBadge(req, res, {retina: true, extension: 'png'})
  })

  /* dev */

  app.get('/:user/:repo/:ref?/dev-status.svg', function (req, res) {
    sendStatusBadge(req, res, {dev: true, extension: 'svg'})
  })

  app.get('/:user/:repo/:ref?/dev-status.png', function (req, res) {
    sendStatusBadge(req, res, {dev: true, extension: 'png'})
  })

  app.get('/:user/:repo/:ref?/dev-status@2x.png', function (req, res) {
    sendStatusBadge(req, res, {dev: true, retina: true, extension: 'png'})
  })

  /* peer */

  app.get('/:user/:repo/:ref?/peer-status.png', function (req, res) {
    sendStatusBadge(req, res, {peer: true, extension: 'png'})
  })

  app.get('/:user/:repo/:ref?/peer-status@2x.png', function (req, res) {
    sendStatusBadge(req, res, {peer: true, retina: true, extension: 'png'})
  })

  app.get('/:user/:repo/:ref?/peer-status.svg', function (req, res) {
    sendStatusBadge(req, res, {peer: true, extension: 'svg'})
  })

  /* optional */

  app.get('/:user/:repo/:ref?/optional-status.svg', function (req, res) {
    sendStatusBadge(req, res, {optional: true, extension: 'svg'})
  })

  app.get('/:user/:repo/:ref?/optional-status.png', function (req, res) {
    sendStatusBadge(req, res, {optional: true, extension: 'png'})
  })

  app.get('/:user/:repo/:ref?/optional-status@2x.png', function (req, res) {
    sendStatusBadge(req, res, {optional: true, retina: true, extension: 'png'})
  })

  app.get('/:user/:repo/:ref?.svg', function (req, res) {
    sendStatusBadge(req, res, {extension: 'svg'})
  })

  app.get('/:user/:repo/:ref?@2x.png', function (req, res) {
    sendStatusBadge(req, res, {retina: true, extension: 'png'})
  })

  app.get('/:user/:repo/:ref?.png', function (req, res) {
    sendStatusBadge(req, res, {extension: 'png'})
  })

  // Send the status badge for this user and repository
  function sendStatusBadge (req, res, opts) {
    opts = opts || {}

    var badgePathOpts = {
      type: getDepsType(opts),
      retina: opts.retina,
      style: req.query.style,
      extension: opts.extension
    }

    var sendFileCb = function (err) {
      if (err) {
        console.error('Failed to send status badge', err)
        if (err.code === 'ENOENT') return res.status(404).end()
        res.status(500).end()
      }
    }

    var sendFileOpts = {
      lastModified: false,
      etag: false,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Expires': new Date().toUTCString()
      }
    }

    req.session.get('session/access-token', function (err, authToken) {
      if (err) {
        console.error('Failed to get session access token', err)
        return res.status(500).sendFile(getBadgePath('unknown', badgePathOpts), sendFileOpts, sendFileCb)
      }

      manifest.getManifest(req.params.user, req.params.repo, req.query.path, req.params.ref, authToken, function (err, manifest) {
        if (err) {
          console.error('Failed to get manifest', req.params.user, req.params.repo, req.query.path, req.params.ref, authToken, err)
          return res.status(404).sendFile(getBadgePath('unknown', badgePathOpts), sendFileOpts, sendFileCb)
        }

        brains.getInfo(manifest, opts, function (err, info) {
          if (err) {
            console.error('Failed to get info', manifest, opts, err)
            return res.status(500).sendFile(getBadgePath('unknown', badgePathOpts), sendFileOpts, sendFileCb)
          }

          res.sendFile(getBadgePath(info.status, badgePathOpts), sendFileOpts, sendFileCb)
        })
      })
    })
  }
}

function getBadgePath (status, opts) {
  opts = opts || {}

  var type = opts.type ? opts.type + '-' : ''
  var retina = opts.retina ? '@2x' : ''
  var extension = opts.extension === 'png' ? 'png' : 'svg'
  var style = extension === 'svg' && opts.style === 'flat-square' ? '-' + opts.style : ''

  return path.resolve(path.join(__dirname, '..', 'dist', 'img', 'status', type + status + retina + style + '.' + extension))
}
