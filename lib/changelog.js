var npm = require('npm')
var semver = require('semver')
var moment = require('moment')
var githubUrl = require('github-url')
var async = require('async')
var extract = require('extract')
var github = require('./github')

// Get a username and repo name for a github repository
function getUserRepo (modName, opts, cb) {
  if (!cb) {
    cb = opts
    opts = {}
  }

  opts = opts || {}
  opts.githubHost = opts.githubHost || 'github.com'

  npm.commands.view([modName, 'repository'], true, function (err, data) {
    if (err) return cb(err)

    var keys = Object.keys(data)
    var repo = keys.length ? data[keys[0]].repository : null

    if (!repo) return cb(new Error(modName + ' has no repository information'))

    var url = repo.url || repo
    var info = githubUrl(url, opts.githubHost)

    // Try parse with some common mistakes

    // No .git ext
    if (!info) {
      info = githubUrl(url + '.git', opts.githubHost)
    }

    // Shorthand without domain
    if (!info) {
      info = githubUrl('git://' + opts.githubHost + (url[0] === '/' ? '' : '/') + url)
    }

    if (!info) return cb(new Error('Unsupported repository URL'))

    cb(null, info.user, info.project)
  })
}

/**
 * Get the publish dates for a module at particular versions (or ranges)
 *
 * @param {String} modName Module name
 * @param {Array} modVers Module versions. If range then publish date for lowest satisfying version is given.
 * @param {Function} cb Receives an array of dates corresponding to the array of module versions
 */
function getPublishDates (modName, modVers, cb) {
  var tasks = modVers.map(function (ver) {
    return function (cb) {
      npm.commands.view([modName, 'time'], true, function (err, data) {
        if (err) return cb(err)

        var keys = Object.keys(data)
        var time = keys.length ? data[keys[0]].time : null

        if (!time) return cb(new Error(modName + ' has no time information'))

        // Filter the time info by valid semver versions (npm now includes "created" and "modified" fields)
        // Flip `time` from {[version]: [date]} to {[date]: [version]}
        var versionsByDate = Object.keys(time).filter(function (ver) {
          return semver.valid(ver, true)
        }).reduce(function (versions, version) {
          versions[time[version]] = version
          return versions
        }, {})

        // Create an array of publish dates in ASC order
        var ascPublishDates = Object.keys(time).map(function (version) {
          return time[version]
        }).sort()

        // Get the first version that satisfies the range
        for (var i = 0, len = ascPublishDates.length; i < len; ++i) {
          if (semver.satisfies(versionsByDate[ascPublishDates[i]], ver, true)) {
            return cb(null, moment(ascPublishDates[i]).toDate())
          }
        }

        cb(new Error('Failed to find publish date for ' + modName + '@' + ver))
      })
    }
  })

  async.parallel(tasks, cb)
}

module.exports = function (githubConfig, npmConfig) {
  var Changelog = {
    /**
     * Get closed issues and commits for a module between two versions
     *
     * @param {String} modName Module name
     * @param {Date} fromVer
     * @param {Date} toVer
     * @param {Function} cb
     */
    getChanges: function (modName, fromVer, toVer, cb) {
      console.log('Getting changes for', modName, 'from', fromVer, 'to', toVer)

      var gh = github.getInstance()

      npm.load(npmConfig.options, function (err) {
        if (err) return cb(err)

        getUserRepo(modName, githubConfig.host, function (err, user, repo) {
          if (err) return cb(err)

          getPublishDates(modName, [fromVer, toVer], function (err, dates) {
            if (err) return cb(err)

            var issuesOpts = {
              user: user,
              repo: repo,
              state: 'closed',
              sort: 'created',
              since: dates[0],
              per_page: 100
            }

            gh.issues.repoIssues(issuesOpts, function (err, issues) {
              if (err) return cb(err)

              issues = issues.filter(function (issue) {
                return dates[1] > moment(issue.closed_at).toDate()
              })

              var commitsOpts = {
                user: user,
                repo: repo,
                since: dates[0],
                until: dates[1]
              }

              gh.repos.getCommits(commitsOpts, function (err, commits) {
                if (err) return cb(err)

                issues = issues.map(function (issue) {
                  return extract(issue, [
                    'number',
                    'title',
                    'closed_at',
                    'html_url',
                    ['user', ['html_url', 'avatar_url', 'login']]
                  ])
                }).sort(function (a, b) {
                  if (a.closed_at > b.closed_at) {
                    return -1
                  } else if (a.closed_at < b.closed_at) {
                    return 1
                  }
                  return 0
                })

                commits = commits.map(function (commit) {
                  return extract(commit, [
                    'html_url',
                    ['author', ['login', 'html_url', 'avatar_url']],
                    ['commit', [
                      'message',
                      ['committer', ['date']],
                      ['author', ['name']]
                    ]]
                  ])
                })

                cb(null, {closedIssues: issues, commits: commits})
              })
            })
          })
        })
      })
    }
  }

  return Changelog
}
