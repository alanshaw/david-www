module.exports = function (app, stats) {
  app.get('/stats', function (req, res) {
    res.render('stats', {
      recentlyUpdatedPackages: stats.getRecentlyUpdatedPackages(),
      recentlyRetrievedManifests: stats.getRecentlyRetrievedManifests(),
      recentlyUpdatedManifests: stats.getRecentlyUpdatedManifests()
    })
  })
}
