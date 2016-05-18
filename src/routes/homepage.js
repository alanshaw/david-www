module.exports = (app, stats) => {
  app.get('/', (req, res) => {
    res.render('index', {
      recentlyRetrievedManifests: stats.getRecentlyRetrievedManifests(),
      recentlyUpdatedPackages: stats.getRecentlyUpdatedPackages()
    })
  })
}
