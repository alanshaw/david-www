import Boom from 'boom'
import { getNewsFeed } from '../../lib/news-feed'

export default (app) => {
  app.get('/news/latest.json', (req, res, next) => {
    let limit = parseInt(req.query.limit, 10)

    getNewsFeed((err, news) => {
      if (err) return next(Boom.wrap(err, 500, 'Failed to get news feed'))
      res.json(isNaN(limit) ? news.json : news.json.slice(0, limit))
    })
  })
}
