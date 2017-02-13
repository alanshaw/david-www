import Path from 'path'
import getDepsType from './helpers/get-deps-type'

export default (app, manifest, brains, cache, queue) => {
  app.get('/:user/:repo/:ref?/status.svg', (req, res, next) => {
    sendStatusBadge(req, res, next, {extension: 'svg'})
  })

  app.get('/:user/:repo/:ref?/status.png', (req, res, next) => {
    sendStatusBadge(req, res, next, {extension: 'png'})
  })

  app.get('/:user/:repo/:ref?/status@2x.png', (req, res, next) => {
    sendStatusBadge(req, res, next, {retina: true, extension: 'png'})
  })

  /* dev */

  app.get('/:user/:repo/:ref?/dev-status.svg', (req, res, next) => {
    sendStatusBadge(req, res, next, {dev: true, extension: 'svg'})
  })

  app.get('/:user/:repo/:ref?/dev-status.png', (req, res, next) => {
    sendStatusBadge(req, res, next, {dev: true, extension: 'png'})
  })

  app.get('/:user/:repo/:ref?/dev-status@2x.png', (req, res, next) => {
    sendStatusBadge(req, res, next, {dev: true, retina: true, extension: 'png'})
  })

  /* peer */

  app.get('/:user/:repo/:ref?/peer-status.png', (req, res, next) => {
    sendStatusBadge(req, res, next, {peer: true, extension: 'png'})
  })

  app.get('/:user/:repo/:ref?/peer-status@2x.png', (req, res, next) => {
    sendStatusBadge(req, res, next, {peer: true, retina: true, extension: 'png'})
  })

  app.get('/:user/:repo/:ref?/peer-status.svg', (req, res, next) => {
    sendStatusBadge(req, res, next, {peer: true, extension: 'svg'})
  })

  /* optional */

  app.get('/:user/:repo/:ref?/optional-status.svg', (req, res, next) => {
    sendStatusBadge(req, res, next, {optional: true, extension: 'svg'})
  })

  app.get('/:user/:repo/:ref?/optional-status.png', (req, res, next) => {
    sendStatusBadge(req, res, next, {optional: true, extension: 'png'})
  })

  app.get('/:user/:repo/:ref?/optional-status@2x.png', (req, res, next) => {
    sendStatusBadge(req, res, next, {optional: true, retina: true, extension: 'png'})
  })

  app.get('/:user/:repo/:ref?.svg', (req, res, next) => {
    sendStatusBadge(req, res, next, {extension: 'svg'})
  })

  app.get('/:user/:repo/:ref?@2x.png', (req, res, next) => {
    sendStatusBadge(req, res, next, {retina: true, extension: 'png'})
  })

  app.get('/:user/:repo/:ref?.png', (req, res, next) => {
    sendStatusBadge(req, res, next, {extension: 'png'})
  })

  // Send the status badge for this user and repository
  function sendStatusBadge (req, res, next, opts) {
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

        // https://github.com/expressjs/express/blob/76eaa326ee8c4dda05568c6452286a16adb84c0b/lib/response.js#L417
        if (err.code !== 'ECONNABORTED' && err.syscall !== 'write') {
          next(err)
        }
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

      Object.assign(opts, { path, ref, authToken })

      cache.getInfo({ user, repo, opts }, (err, info) => {
        if (err) {
          console.error('Failed to determine if info was cached', user, repo, path, ref, authToken, err)
          return res.status(500).sendFile(getBadgePath('unknown', badgePathOpts), sendFileOpts, sendFileCb)
        }

        if (info) {
          res.sendFile(getBadgePath(info.status, badgePathOpts), sendFileOpts, sendFileCb)
        } else {
          res.sendFile(getBadgePath('pending', badgePathOpts), sendFileOpts, sendFileCb)
        }

        queue.push({ user, repo, opts }, (err) => {
          if (err) console.log('Failed to queue', err)
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
