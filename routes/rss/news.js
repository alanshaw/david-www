var newsFeed = require("../../lib/news-feed")
var errors = require("../helpers/errors")

module.exports = function (req, res) {
  newsFeed.get(function (er, xml) {
    if (errors.happened(er, req, res, "Failed to get news feed xml")) {
      return
    }

    res.contentType("application/rss+xml")
    res.status(200).send(xml)
  })
}
