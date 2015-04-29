var config = require("config")

module.exports = function (req, res, next) {
  res.locals.config = config
  next()
}