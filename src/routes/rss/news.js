const newsFeed = require('../../lib/news-feed')
const errors = require('../helpers/errors')

module.exports = (app) => {
  app.get('/news/rss.xml', (req, res) => {
    newsFeed.get((err, xml) => {
      if (errors.happened(err, req, res, 'Failed to get news feed xml')) {
        return
      }

      res.contentType('application/rss+xml')
      res.status(200).send(xml)
    })
  })
}
