module.exports = function (app, config) {
  app.use(function (req, res, next) {
    res.locals.config = config
    next()
  })
}
