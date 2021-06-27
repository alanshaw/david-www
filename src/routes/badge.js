import Path from 'path'
import getDepsType from './helpers/get-deps-type'
import Referer from './referer'

export default (app, manifest, brains, cache, queue) => {
  app.get('/:user/:repo/:ref?/status.svg', (req, res, next) => {
    // sendStatusBadge(req, res, next, {extension: 'svg'})
    redirectStatusBadge(req, res)
  })

  const { buildStatusBadgeLink } = Referer
  app.get('/auto.svg', (req, res) => {
    doRefererRedirect(req, res, {extension: 'svg'})
  })

  app.get('/auto.png', (req, res) => {
    doRefererRedirect(req, res, {extension: 'png'})
  })

  app.get('/auto@2x.png', (req, res) => {
    doRefererRedirect(req, res, {extension: 'png', retina: true})
  })

  app.get('/:user/:repo/:ref?/status.svg', (req, res) => {
    sendStatusBadge(req, res, {extension: 'svg'})
  })

  app.get('/:user/:repo/:ref?/status.png', (req, res, next) => {
    sendStatusBadge(req, res, next, {extension: 'png'})
  })

  app.get('/:user/:repo/:ref?/status@2x.png', (req, res, next) => {
    sendStatusBadge(req, res, next, {retina: true, extension: 'png'})
  })

  /* dev */

  app.get('/:user/:repo/:ref?/dev-status.svg', (req, res, next) => {
    // sendStatusBadge(req, res, next, {dev: true, extension: 'svg'})
    redirectStatusBadge(req, res, 'dev')
  })

  app.get('/dev-auto.svg', (req, res) => {
    doRefererRedirect(req, res, {dev: true, extension: 'svg'})
  })

  app.get('/dev-auto.png', (req, res) => {
    doRefererRedirect(req, res, {dev: true, extension: 'png'})
  })

  app.get('/dev-auto@2x.png', (req, res) => {
    doRefererRedirect(req, res, {dev: true, retina: true, extension: 'png'})
  })

  app.get('/:user/:repo/:ref?/dev-status.svg', (req, res) => {
    sendStatusBadge(req, res, {dev: true, extension: 'svg'})
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

  app.get('/peer-auto.svg', (req, res) => {
    doRefererRedirect(req, res, {peer: true, extension: 'png'})
  })

  app.get('/peer-auto.png', (req, res) => {
    doRefererRedirect(req, res, {peer: true, extension: 'svg'})
  })

  app.get('/peer-auto@2x.png', (req, res) => {
    doRefererRedirect(req, res, {peer: true, retina: true, extension: 'png'})
  })

  app.get('/:user/:repo/:ref?/peer-status.png', (req, res) => {
    sendStatusBadge(req, res, {peer: true, extension: 'png'})
  })

  app.get('/:user/:repo/:ref?/peer-status@2x.png', (req, res, next) => {
    sendStatusBadge(req, res, next, {peer: true, retina: true, extension: 'png'})
  })

  app.get('/:user/:repo/:ref?/peer-status.svg', (req, res, next) => {
    // sendStatusBadge(req, res, next, {peer: true, extension: 'svg'})
    redirectStatusBadge(req, res, 'peer')
  })

  /* optional */

  app.get('/:user/:repo/:ref?/optional-status.svg', (req, res, next) => {
    // sendStatusBadge(req, res, next, {optional: true, extension: 'svg'})
    redirectStatusBadge(req, res, 'optional')
  })

  app.get('/optional-auto.svg', (req, res) => {
    doRefererRedirect(req, res, {optional: true, extension: 'svg'})
  })

  app.get('/optional-auto.png', (req, res) => {
    doRefererRedirect(req, res, {optional: true, extension: 'png'})
  })

  app.get('/optional-auto@2x.png', (req, res) => {
    doRefererRedirect(req, res, {optional: true, retina: true, extension: 'png'})
  })

  app.get('/:user/:repo/:ref?/optional-status.svg', (req, res) => {
    sendStatusBadge(req, res, {optional: true, extension: 'svg'})
  })

  app.get('/:user/:repo/:ref?/optional-status.png', (req, res, next) => {
    sendStatusBadge(req, res, next, {optional: true, extension: 'png'})
  })

  app.get('/:user/:repo/:ref?/optional-status@2x.png', (req, res, next) => {
    sendStatusBadge(req, res, next, {optional: true, retina: true, extension: 'png'})
  })

  app.get('/:user/:repo/:ref?.svg', (req, res, next) => {
    // sendStatusBadge(req, res, next, {extension: 'svg'})
    redirectStatusBadge(req, res)
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

  function doRefererRedirect (req, res, opts) {
    const badgePathOpts = {
      type: getDepsType(opts),
      retina: opts.retina,
      style: req.query.style,
      extension: opts.extension
    }
    const referer = req.get('Referer')
    const badgeFile = buildBadgeFilename('status', badgePathOpts)
    const badgeLink = buildStatusBadgeLink(referer, badgeFile)
    if (badgeLink === undefined) {
      // send unknown instead
      res.status(404).sendFile(getBadgePath('unknown', badgePathOpts))
      return
    }
    res.redirect(badgeLink)
  }
}

const badgePath = Path.resolve(__dirname, '..', '..', 'public', 'img', 'status')

function buildBadgeFilename (status, opts) {
  const type = opts.type ? opts.type + '-' : ''
  const retina = opts.retina ? '@2x' : ''
  const extension = opts.extension === 'png' ? 'png' : 'svg'
  const style = extension === 'svg' && opts.style === 'flat-square' ? '-' + opts.style : ''
  return `${type}${status}${retina}${style}.${extension}`
}

function getBadgePath (status, opts) {
  opts = opts || {}
  return Path.join(badgePath, buildBadgeFilename(status, opts))
}

function redirectStatusBadge (req, res, type) {
  const { user, repo, ref } = req.params
  const { style, path } = req.query
  const url = new URL('https://status.david-dm.org')
  url.pathname = `/gh/${encodeURIComponent(user)}/${encodeURIComponent(repo)}.svg`
  url.search = new URLSearchParams(Object.entries({ path, ref, style, type }).filter(([, v]) => !!v)).toString()
  res.redirect(301, url.toString())
}
