export default (app, stats) => {
  app.get('/stats.json', (req, res) => {
    res.json({
      recentlyUpdatedPackages: stats.getRecentlyUpdatedPackages(),
      recentlyRetrievedManifests: stats.getRecentlyRetrievedManifests(),
      recentlyUpdatedManifests: stats.getRecentlyUpdatedManifests()
    })
  })
}
