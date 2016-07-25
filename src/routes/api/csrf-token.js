import Boom from 'boom'

export default (app, auth) => {
  app.get('/csrf-token.json', (req, res, next) => {
    const csrfToken = auth.generateNonce(64)

    req.session.set('session/csrf-token', csrfToken, (err) => {
      if (err) return next(Boom.wrap(err, 500, 'Failed to set CSRF token'))
      res.json(csrfToken)
    })
  })
}
