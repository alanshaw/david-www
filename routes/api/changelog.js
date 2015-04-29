var changelog = require("../../lib/changelog")

module.exports = function (req, res) {
  changelog.getChanges(req.params.pkg, req.query.from, req.query.to, function (er, changes) {
    if (er) {
      console.warn(er)
      return res.status(500).send({er: "Failed to get changes"})
    }
    res.send(changes)
  })
}
