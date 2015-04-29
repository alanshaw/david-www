var search = require("../../lib/search")
var errors = require("../helpers/errors")

module.exports = function (req, res) {
  search(req.query.q, function (er, results) {
    if (errors.happened(er, req, res, "Failed to get search results")) {
      return
    }

    res.json(results)
  })
}