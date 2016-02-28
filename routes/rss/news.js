var newsFeed = require('../../lib/news-feed')
var errors = require('../helpers/errors')

module.exports = function (req, res) {
  newsFeed.get(function (err, xml) {
    if (errors.happened(err, req, res, 'Failed to get news feed xml')) {
      return
    }

    res.contentType('application/rss+xml')
    res.status(200).send(xml)
  })
}
