var auth = require("../lib/auth")

module.exports.oauthCallback = function (req, res) {
  req.session.get("session/csrf-token", function (er, csrfToken) {
    if (er || csrfToken !== req.query.state || !req.query.code) {
      return res.status(401).render(401, er)
    }

    auth.requestAccessToken(req.query.code, function (er, data) {
      if (er) return res.status(401).render(401, er)

      req.session.set("session/access-token", data.access_token, function () {
        req.session.set("session/user", data.user, function () {
          res.redirect("/?success")
        })
      })
    })
  })
}
