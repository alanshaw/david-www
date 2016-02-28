var db = require('../lib/db')
var levelSession = require('level-session')

module.exports = levelSession({db: db})
