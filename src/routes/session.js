module.exports.oauthCallback = (app, auth) => {
  app.get('/auth/callback', (req, res) => {
    req.session.get('session/csrf-token', (err, csrfToken) => {
      if (err || csrfToken !== req.query.state || !req.query.code) {
        return res.status(401).render('401', err)
      }

      auth.requestAccessToken(req.query.code, (err, data) => {
        if (err) return res.status(401).render('401', err)

        req.session.set('session/access-token', data.access_token, () => {
          req.session.set('session/user', data.user, () => {
            res.redirect('/?success')
          })
        })
      })
    })
  })
}
