var config = require("config")
var levelSession = require("level-session")

module.exports = levelSession(config.db.path)
