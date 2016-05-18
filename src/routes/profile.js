const errors = require('./helpers/errors')

module.exports = (app, profile) => {
  app.get('/:user', (req, res) => {
    var authToken = null

    req.session.getAll((err, sessionData) => {
      if (errors.happened(err, req, res, 'Failed to get session data')) {
        return
      }

      if (req.params.user === sessionData['session/user']) {
        authToken = sessionData['session/access-token']
      }

      profile.get(req.params.user, authToken, function (err, data) {
        if (errors.happened(err, req, res, 'Failed to get profile data')) {
          return
        }

        var avatarUrl

        for (var i = 0; i < data.length; i++) {
          if (data[i].repo.owner.login === req.params.user) {
            avatarUrl = data[i].repo.owner.avatar_url
            break
          }
        }

        res.render('profile', {
          user: req.params.user,
          avatarUrl,
          repos: data
        })
      })
    })
  })
}
