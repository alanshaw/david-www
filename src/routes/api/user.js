import Boom from 'boom'

export default (app) => {
  app.get('/user.json', (req, res, next) => {
    req.session.get('session/user', (err, user) => {
      if (err) return next(Boom.wrap(err, 500, 'Failed to get user'))
      res.json(user || null)
    })
  })
}
