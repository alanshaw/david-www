var requireDirectory = require('require-directory')
var camelCase = require('camelcase')

module.exports = requireDirectory(module, {
  rename: function (n) {
    return camelCase(n)
  }
})
