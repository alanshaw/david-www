module.exports = function (app, stats) {
  app.get('/', function (req, res) {
    res.render('index', {
      recentlyRetrievedManifests: stats.getRecentlyRetrievedManifests(),
      recentlyUpdatedPackages: stats.getRecentlyUpdatedPackages()
    })
  })
}
