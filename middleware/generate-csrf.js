var auth = require("../lib/auth")

module.exports = function (req, res, next) {
  req.session.get("session/csrf-token", function (err, csrfToken) {
    if (csrfToken) {
      res.locals.csrfToken = csrfToken
      return next()
    }
    csrfToken = res.locals.csrfToken = auth.generateNonce(64)
    req.session.set("session/csrf-token", csrfToken, next)
  })
}
