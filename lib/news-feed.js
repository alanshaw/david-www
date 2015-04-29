var request = require("request")
  , moment = require("moment")

function NewsRss(xml) {
  this.xml = xml
  this.expires = moment().add(NewsRss.TTL)
}

NewsRss.TTL = moment.duration({days: 1})

var news

module.exports.get = function (cb) {
  if (news && news.expires > new Date()) {
    return cb(null, news.xml)
  }

  request("http://davidiswatching.tumblr.com/rss", function (er, res, xml) {
    if (er) return cb(er)

    if (res.statusCode !== 200) {
      return cb(new Error("Unexpected status requesting news feed" + res.statusCode))
    }

    news = new NewsRss(xml)

    cb(null, news.xml)
  })
}
