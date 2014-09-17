var async = require("async")
  , request = require("request")
  , metaMarked = require("meta-marked")
  , github = require("./github")

var gh = github.getInstance()
var ghOpts = {user: "nodesecurity", repo: "nodesecurity-www", path: "advisories"}
var rawUrl = "https://raw.githubusercontent.com/nodesecurity/nodesecurity-www/master/advisories"

var advisories = {}

gh.repos.getContent(ghOpts, function (er, advisories) {
  if (er) return console.error("Failed to get advisories", er)

  var tasks = advisories.filter(function (a) {
    return a.name != "template.md"
  }).map(function (a) {
    return function (cb) {
      request.get(rawUrl + "/" + a.name, function (er, res, md) {
        if (er || res.statusCode != 200)
          return console.error("Failed to get advisory", a.name, er)
        cb(null, metaMarked(md).meta)
      })
    }
  })

  async.parallel(tasks, function (er, metas) {
    if (er) return console.error(er)
    advisories = metas.reduce(function (advs, m) {
      advs[m.module_name] = advs[m.module_name] || []
      advs[m.module_name].push(m)
      return advs
    }, {})
    console.log(advisories)
  })
})

module.exports = function () {
  return advisories
}