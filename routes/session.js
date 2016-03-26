module.exports.oauthCallback = function (app, auth) {
  app.get('/auth/callback', function (req, res) {
    req.session.get('session/csrf-token', function (err, csrfToken) {
      if (err || csrfToken !== req.query.state || !req.query.code) {
        return res.status(401).render(401, err)
      }

      auth.requestAccessToken(req.query.code, function (err, data) {
        if (err) return res.status(401).render(401, err)

        req.session.set('session/access-token', data.access_token, function () {
          req.session.set('session/user', data.user, function () {
            res.redirect('/?success')
          })
        })
      })
    })
  })
}
