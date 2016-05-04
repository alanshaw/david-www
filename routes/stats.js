module.exports = (app, stats) => {
  app.get('/stats', (req, res) => {
    res.render('stats', {
      recentlyUpdatedPackages: stats.getRecentlyUpdatedPackages(),
      recentlyRetrievedManifests: stats.getRecentlyRetrievedManifests(),
      recentlyUpdatedManifests: stats.getRecentlyUpdatedManifests()
    })
  })
}
