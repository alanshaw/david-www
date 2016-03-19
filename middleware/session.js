var levelSession = require('level-session')

module.exports = function (app, db) {
  app.use(levelSession({db: db}))
}
