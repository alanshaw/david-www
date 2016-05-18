import request from 'request'
import moment from 'moment'

const TTL = moment.duration({ days: 1 })
let news = { xml: null, expires: 0 }

export function get (cb) {
  if (news && news.expires > Date.now()) {
    return cb(null, news.xml)
  }

  request('http://davidiswatching.tumblr.com/rss', (err, res, xml) => {
    if (err) return cb(err)

    if (res.statusCode !== 200) {
      return cb(new Error(`Unexpected status requesting news feed ${res.statusCode}`))
    }

    news = { xml, expires: moment().add(TTL).valueOf() }

    cb(null, news.xml)
  })
}
