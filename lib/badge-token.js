const crypto = require('crypto')

module.exports = (tokenConfig, githubConfig) => {
  if (tokenConfig.secret && tokenConfig.secret.length < 16) {
    throw new Error('Token secret is too short, must be at least 128 bits')
  }

  return {
    enabled: !!tokenConfig.secret,

    // Get current session auth token or globally configured token.
    getAuthToken (req, cb) {
      return req.session.get('session/access-token', (err, authToken) => {
        cb(err, authToken || githubConfig.token)
      })
    },

    computeHmac (data) {
      return crypto.createHmac('sha256', tokenConfig.secret).update(data).digest()
    },

    cipher (data) {
      const cipher = crypto.createCipher(tokenConfig.algorithm, tokenConfig.secret)
      return Buffer.concat([cipher.update(data, 'utf8'), cipher.final()])
    },

    decipher (data) {
      const decipher = crypto.createDecipher(tokenConfig.algorithm, tokenConfig.secret)
      return decipher.update(data, null, 'utf8') + decipher.final('utf8')
    },

    encrypt (authToken) {
      const encryptedAuthToken = this.cipher(authToken)
      const hmac = this.computeHmac(encryptedAuthToken)
      return Buffer.concat([encryptedAuthToken, hmac]).toString('base64')
    },

    decrypt (token) {
      const buffer = new Buffer(token, 'base64')

      // The HMAC is the last 32 bytes of the buffer.
      const inputHmac = buffer.slice(-32)

      // The encrypted GitHub token is everything before the HMAC.
      const encryptedAuthToken = buffer.slice(0, -32)

      const hmac = this.computeHmac(encryptedAuthToken)

      if (!hmac.equals(inputHmac)) {
        throw new Error('Invalid message authentication code')
      }

      return this.decipher(encryptedAuthToken)
    }
  }
}
