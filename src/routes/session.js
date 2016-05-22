import Boom from 'boom'

const oauthCallback = (app, auth) => {
  app.get('/auth/callback', (req, res, next) => {
    req.session.get('session/csrf-token', (err, csrfToken) => {
      if (err) return next(Boom.wrap(err, 500, 'Failed to get CSRF token'))

      if (csrfToken !== req.query.state || !req.query.code) {
        return next(Boom.wrap(err, 401))
      }

      auth.requestAccessToken(req.query.code, (err, data) => {
        if (err) return next(Boom.wrap(err, 500, 'Failed to request access token'))

        req.session.set('session/access-token', data.access_token, (err) => {
          if (err) return next(Boom.wrap(err, 500, 'Failed to store access token in session'))

          req.session.set('session/user', data.user, () => {
            if (err) return next(Boom.wrap(err, 500, 'Failed to store user in session'))
            res.redirect('/?success')
          })
        })
      })
    })
  })
}

export default { oauthCallback }
