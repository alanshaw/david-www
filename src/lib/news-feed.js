import request from 'request'
import moment from 'moment'
import { parseString } from 'xml2js'
import cheerio from 'cheerio'

const TTL = moment.duration({ days: 1 })
let news = { json: null, xml: null, expires: 0 }

export function getNewsFeed (cb) {
  if (news && news.expires > Date.now()) {
    return cb(null, { json: news.json, xml: news.xml })
  }

  request('http://davidiswatching.tumblr.com/rss', (err, res, xml) => {
    if (err) return cb(err)

    if (res.statusCode !== 200) {
      return cb(new Error(`Unexpected status requesting news feed ${res.statusCode}`))
    }

    parseString(xml, { explicitArray: false }, (err, data) => {
      if (err) return cb(err)

      news = { json: data.rss.channel.item, xml, expires: moment().add(TTL).valueOf() }

      news.json.forEach((item) => {
        const $ = cheerio.load(`<div class='desc'>${item.description}</div>`)
        item.summary = $('.desc').text().substr(0, 200) + '...'
        delete item.description
        item.pubDate = new Date(item.pubDate)
        item.category = Array.isArray(item.category) ? item.category : [item.category]
      })

      cb(null, { json: news.json, xml })
    })
  })
}
