import Boom from 'boom'

export default ({app}) => {
  app.use((req, res, next) => {
    req.session.get('session/user', (err, user) => {
      if (err) return next(Boom.wrap(err, 500, 'Failed to get user from session'))
      res.locals.user = user
      next()
    })
  })
}
