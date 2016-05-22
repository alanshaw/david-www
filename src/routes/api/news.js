import { getNewsFeed } from '../../lib/news-feed'
import errors from '../helpers/errors'

module.exports = (app) => {
  app.get('/news/latest.json', (req, res) => {
    let limit = parseInt(req.query.limit, 10)

    getNewsFeed((err, news) => {
      if (errors.happened(err, req, res, 'Failed to get news feed')) {
        return
      }

      res.json(isNaN(limit) ? news.json : news.json.slice(0, limit))
    })
  })
}
