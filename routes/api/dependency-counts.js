var stats = require("../../lib/stats")

module.exports = function (req, res) {
  res.json(stats.getDependencyCounts())
}
