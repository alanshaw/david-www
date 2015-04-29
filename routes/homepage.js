var stats = require("../lib/stats")

module.exports = function (req, res) {
  res.render("index", {
    recentlyRetrievedManifests: stats.getRecentlyRetrievedManifests(),
    recentlyUpdatedPackages: stats.getRecentlyUpdatedPackages()
  })
}
