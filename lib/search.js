var npm = require("npm")
  , stats = require("./stats")
  , config = require("config")

function Query (keywords, callback) {
  this.keywords = keywords
  this.callback = callback
}

var queryQueue = []
var processingQueue = false

/**
 * @param {Array|String} keywords
 * @param cb
 */
module.exports = function (keywords, cb) {
  if (!keywords) return cb(null, {})

  if (Object.prototype.toString.call(keywords) === "[object String]") {
    keywords = keywords.split(/\s+/)
  } else if (!keywords.length) {
    return cb(null, {})
  }

  queryQueue.push(new Query(keywords, cb))

  processQueue()
}

function processQueue () {
  if (processingQueue || !queryQueue.length) {
    return
  }

  processingQueue = true

  var query = queryQueue.shift()
    , keywords = query.keywords
    , cb = query.callback

  npm.load(config.npm.options, function (er) {
    if (er) return cb(er)

    npm.commands.search(keywords, true, function (er, data) {
      if (er) return cb(er)

      var counts = stats.getDependencyCounts()
      var results = {}

      Object.keys(data).forEach(function (name) {
        results[name] = {}
        results[name].latest = data[name].version
        results[name].description = data[name].description
        results[name].maintainers = data[name].maintainers
        results[name].time = data[name].time
        results[name].count = counts[name] || 0
      })

      setImmediate(function () {
        cb(null, results)
      })

      processingQueue = false

      processQueue()
    })
  })
}
