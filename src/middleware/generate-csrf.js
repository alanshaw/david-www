import Boom from 'boom'

export default ({app, auth}) => {
  app.use((req, res, next) => {
    req.session.get('session/csrf-token', (err, csrfToken) => {
      if (err) return next(Boom.wrap(err, 500, 'Failed to get CSRF token from session'))

      if (csrfToken) {
        res.locals.csrfToken = csrfToken
        return next()
      }

      csrfToken = res.locals.csrfToken = auth.generateNonce(64)

      req.session.set('session/csrf-token', csrfToken, (err) => {
        if (err) return next(Boom.wrap(err, 500, 'Failed to set CSRF token'))
        next()
      })
    })
  })
}
