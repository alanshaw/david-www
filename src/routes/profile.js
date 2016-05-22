import Boom from 'boom'

export default (app, profile) => {
  app.get('/:user', (req, res, next) => {
    let authToken = null

    req.session.getAll((err, sessionData) => {
      if (err) return next(Boom.wrap(err, 500, 'Failed to get session data'))

      if (req.params.user === sessionData['session/user']) {
        authToken = sessionData['session/access-token']
      }

      profile.get(req.params.user, authToken, function (err, data) {
        if (err) return next(Boom.wrap(err, 500, 'Failed to get profile data'))

        let avatarUrl

        for (let i = 0; i < data.length; i++) {
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
