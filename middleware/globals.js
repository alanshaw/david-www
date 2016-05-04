module.exports = (app, config) => {
  app.use((req, res, next) => {
    res.locals.config = config
    next()
  })
}
