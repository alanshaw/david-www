const levelSession = require('level-session')
module.exports = (app, db) => app.use(levelSession({ db }))
