import Boom from 'boom'
import { getNewsFeed } from '../../lib/news-feed'

export default (app) => {
  app.get('/news/rss.xml', (req, res, next) => {
    getNewsFeed((err, news) => {
      if (err) return next(Boom.wrap(err, 500, 'Failed to get news feed xml'))

      res.contentType('application/rss+xml')
      res.status(200).send(news.xml)
    })
  })
}
