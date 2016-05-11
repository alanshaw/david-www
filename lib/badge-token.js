const crypto = require('crypto')

module.exports = tokenConfig => {
  return {
    enabled: !!tokenConfig.secret,

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
