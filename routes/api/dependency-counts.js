module.exports = function (app, stats) {
  app.get('/dependency-counts.json', function (req, res) {
    res.json(stats.getDependencyCounts())
  })
}
