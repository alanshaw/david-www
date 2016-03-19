module.exports = function (app) {
  app.use(function (req, res, next) {
    req.session.get('session/user', function (err, user) {
      if (!err) res.locals.user = user
      next()
    })
  })
}
