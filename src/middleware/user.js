export default ({app}) => {
  app.use((req, res, next) => {
    req.session.get('session/user', (err, user) => {
      if (!err) res.locals.user = user
      next()
    })
  })
}
