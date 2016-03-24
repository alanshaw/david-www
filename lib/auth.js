const crypto = require('crypto')
const request = require('request')

module.exports = (github, githubConfig) => {
  const Auth = {
    generateNonce (length) {
      return crypto.randomBytes(length * 2).toString('hex').slice(0, length)
    },

    requestAccessToken (code, cb) {
      const tokenRequest = {
        url: `${githubConfig.protocol}://${githubConfig.host}/login/oauth/access_token`,
        json: {
          client_id: githubConfig.oauth.id,
          client_secret: githubConfig.oauth.secret,
          code
        }
      }

      request.post(tokenRequest, (err, tokenRes, data) => {
        if (err || tokenRes.statusCode !== 200) {
          return cb(err || new Error('Unable to exchange code for token'))
        }

        data = data || {}
        if (!data.access_token) {
          return cb(new Error('Failed to receive access token from GitHub'))
        }

        const authData = { access_token: data.access_token }
        const gh = github.getInstance(data.access_token)

        gh.user.get({}, (err, data) => {
          if (err) {
            return cb(err)
          } else if (!data.login) {
            return cb(new Error('Unable to find user from token'))
          }

          authData.user = data.login
          cb(null, authData)
        })
      })
    }
  }

  return Auth
}
