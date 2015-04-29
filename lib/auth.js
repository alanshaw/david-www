var config = require("config")
  , crypto = require("crypto")
  , request = require("request")
  , github = require("./github")

module.exports.generateNonce = function (length) {
  return crypto.randomBytes(length * 2).toString("hex").slice(0, length)
}

module.exports.requestAccessToken = function (code, cb) {
  var tokenRequest = {
    url: "https://github.com/login/oauth/access_token",
    json: {
      client_id: config.github.oauth.id,
      client_secret: config.github.oauth.secret,
      code: code
    }
  }
  request.post(tokenRequest, function (err, tokenRes, data) {
    if (err || tokenRes.statusCode !== 200) {
      return cb(err || "Unable to exchange code for token")
    }

    data = data || {}
    if (!data.access_token) {
      return cb("Failed to receive access token from GitHub")
    }

    var authData = { access_token: data.access_token }
      , gh = github.getInstance(data.access_token)

    gh.user.get({}, function (err, data) {
      if (err) {
        return cb(err)
      } else if (!data.login) {
        return cb("Unable to find user from token")
      }

      authData.user = data.login
      cb(null, authData)
    })
  })
}
