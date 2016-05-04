const requireDirectory = require('require-directory')
const camelCase = require('camelcase')

module.exports = requireDirectory(module, { rename: (n) => camelCase(n) })
