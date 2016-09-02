import Path from 'path'
import getDepsType from './helpers/get-deps-type'

export default (app, manifest, brains) => {
  app.get('/:user/:repo/:ref?/status.svg', (req, res) => {
    sendStatusBadge(req, res, {extension: 'svg'})
  })

  app.get('/:user/:repo/:ref?/status.png', (req, res) => {
    sendStatusBadge(req, res, {extension: 'png'})
  })

  app.get('/:user/:repo/:ref?/status@2x.png', (req, res) => {
    sendStatusBadge(req, res, {retina: true, extension: 'png'})
  })

  /* dev */

  app.get('/:user/:repo/:ref?/dev-status.svg', (req, res) => {
    sendStatusBadge(req, res, {dev: true, extension: 'svg'})
  })

  app.get('/:user/:repo/:ref?/dev-status.png', (req, res) => {
    sendStatusBadge(req, res, {dev: true, extension: 'png'})
  })

  app.get('/:user/:repo/:ref?/dev-status@2x.png', (req, res) => {
    sendStatusBadge(req, res, {dev: true, retina: true, extension: 'png'})
  })

  /* peer */

  app.get('/:user/:repo/:ref?/peer-status.png', (req, res) => {
    sendStatusBadge(req, res, {peer: true, extension: 'png'})
  })

  app.get('/:user/:repo/:ref?/peer-status@2x.png', (req, res) => {
    sendStatusBadge(req, res, {peer: true, retina: true, extension: 'png'})
  })

  app.get('/:user/:repo/:ref?/peer-status.svg', (req, res) => {
    sendStatusBadge(req, res, {peer: true, extension: 'svg'})
  })

  /* optional */

  app.get('/:user/:repo/:ref?/optional-status.svg', (req, res) => {
    sendStatusBadge(req, res, {optional: true, extension: 'svg'})
  })

  app.get('/:user/:repo/:ref?/optional-status.png', (req, res) => {
    sendStatusBadge(req, res, {optional: true, extension: 'png'})
  })

  app.get('/:user/:repo/:ref?/optional-status@2x.png', (req, res) => {
    sendStatusBadge(req, res, {optional: true, retina: true, extension: 'png'})
  })

  app.get('/:user/:repo/:ref?.svg', (req, res) => {
    sendStatusBadge(req, res, {extension: 'svg'})
  })

  app.get('/:user/:repo/:ref?@2x.png', (req, res) => {
    sendStatusBadge(req, res, {retina: true, extension: 'png'})
  })

  app.get('/:user/:repo/:ref?.png', (req, res) => {
    sendStatusBadge(req, res, {extension: 'png'})
  })

  // Send the status badge for this user and repository
  function sendStatusBadge (req, res, opts) {
    opts = opts || {}

    const badgePathOpts = {
      type: getDepsType(opts),
      retina: opts.retina,
      style: req.query.style,
      extension: opts.extension
    }

    const sendFileCb = function (err) {
      if (err) {
        console.error('Failed to send status badge', err)
        if (err.code === 'ENOENT') return res.status(404).end()
        res.status(500).end()
      }
    }

    const sendFileOpts = {
      lastModified: false,
      etag: false,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Expires': new Date().toUTCString()
      }
    }

    req.session.get('session/access-token', (err, authToken) => {
      if (err) {
        console.error('Failed to get session access token', err)
        return res.status(500).sendFile(getBadgePath('unknown', badgePathOpts), sendFileOpts, sendFileCb)
      }

      const { user, repo, ref } = req.params
      const path = req.query.path

      manifest.getManifest(user, repo, { path, ref, authToken }, (err, manifest) => {
        if (err) {
          console.error('Failed to get manifest', user, repo, path, ref, authToken, err)
          return res.status(404).sendFile(getBadgePath('unknown', badgePathOpts), sendFileOpts, sendFileCb)
        }

        brains.getInfo(manifest, opts, (err, info) => {
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

const badgePath = Path.resolve(__dirname, '..', '..', 'public', 'img', 'status')

function getBadgePath (status, opts) {
  opts = opts || {}

  const type = opts.type ? opts.type + '-' : ''
  const retina = opts.retina ? '@2x' : ''
  const extension = opts.extension === 'png' ? 'png' : 'svg'
  const style = extension === 'svg' && opts.style === 'flat-square' ? '-' + opts.style : ''

  return Path.join(badgePath, `${type}${status}${retina}${style}.${extension}`)
}
