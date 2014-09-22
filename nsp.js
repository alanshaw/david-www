var async = require("async")
  , request = require("request")
  , metaMarked = require("meta-marked")
  , github = require("./github")

var ghOpts = {user: "nodesecurity", repo: "nodesecurity-www", path: "advisories"}
var rawUrl = "https://raw.githubusercontent.com/nodesecurity/nodesecurity-www/master/advisories"

var advisories = {}

function getAdvisories () {
  return advisories
}

module.exports.getAdvisories = getAdvisories

function updateAdvisories (cb) {
  cb = cb || function (er) {
    if (er) console.error("Failed to update advisories", er)
  }

  var gh = github.getInstance()

  gh.repos.getContent(ghOpts, function (er, advisories) {
    if (er) return cb(er)

    var tasks = advisories.filter(function (a) {
      return a.name != "template.md"
    }).map(function (a) {
      return function (cb) {
        request.get(rawUrl + "/" + a.name, function (er, res, md) {
          if (er || res.statusCode != 200) {
            console.warn("Failed to update advisory", a.name, er)
            return cb()
          }
          cb(null, metaMarked(md).meta)
        })
      }
    })

    async.parallel(tasks, function (er, metas) {
      if (er) return cb(er)
      advisories = metas.reduce(function (advs, m) {
        if (m) {
          advs[m.module_name] = advs[m.module_name] || []
          advs[m.module_name].push(m)
        }
        return advs
      }, {})
      cb(null, advisories)
    })
  })
}

module.exports.updateAdvisories = updateAdvisories

var advisoriesUpdateIntervalId = null

function updateAdvisoriesPeriodically (interval) {
  clearInterval(advisoriesUpdateIntervalId)
  interval = interval || 3600000
  advisoriesUpdateIntervalId = setInterval(updateAdvisories, interval)
}

module.exports.updateAdvisoriesPeriodically = updateAdvisoriesPeriodically