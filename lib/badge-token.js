const crypto = require('crypto')

module.exports = (tokenConfig, githubConfig) => {
  if (tokenConfig.secret && tokenConfig.secret.length < 16) {
    throw new Error('Token secret is too short, must be at least 128 bits')
  }

  return {
    enabled: !!tokenConfig.secret,

    // Get current session auth token or globally configured token
    getAuthToken (req, cb) {
      return req.session.get('session/access-token', (err, authToken) => {
        cb(err, authToken || githubConfig.token)
      })
    },

    encrypt (authToken) {
      const cipher = crypto.createCipher(tokenConfig.algorithm, tokenConfig.secret)
      return cipher.update(authToken, 'utf8', 'hex') + cipher.final('hex')
    },

    decrypt (token) {
      const decipher = crypto.createDecipher(tokenConfig.algorithm, tokenConfig.secret)
      return decipher.update(token, 'hex', 'utf8') + decipher.final('utf8')
    }
  }
}
