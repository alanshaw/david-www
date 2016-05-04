module.exports = (app, stats) => {
  app.get('/dependency-counts.json', (req, res) => {
    res.json(stats.getDependencyCounts())
  })
}
