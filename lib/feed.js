const moment = require('moment')
const RSS = require('rss')
const semver = require('semver')

module.exports = (npm, npmConfig, siteConfig) => {
  npmConfig = npmConfig || {}
  siteConfig = siteConfig || {}

  const Feed = {
    get (manifest, opts, cb) {
      // Allow callback to be passed as second parameter
      if (!cb) {
        cb = opts
        opts = {}
      }

      opts = opts || {}

      // Assume we're probably going to have to use NPM
      npm.load(npmConfig.options, (err) => {
        if (err) return cb(err)

        var items = []
        const deps = opts.dev ? manifest.devDependencies : manifest.dependencies
        const depNames = Object.keys(deps || {})
        var processedDeps = 0

        if (!depNames.length) {
          return cb(null, buildFeedXml([], manifest.name, deps, opts.limit, siteConfig, npmConfig))
        }

        depNames.forEach((depName) => {
          getPackage(depName, (err, pkg) => {
            if (err) {
              console.error(err)
            } else {
              items = items.concat(packageToFeedItems(pkg))
            }

            processedDeps++

            if (processedDeps === depNames.length) {
              cb(null, buildFeedXml(items, manifest.name, deps, opts.limit, siteConfig, npmConfig))
            }
          })
        })
      })
    }
  }

  /**
   * Get a Package for a given package name guaranteed to be less old than Package.TTL
   *
   * Must be executed in `npm.load()` callback.
   *
   * @param pkgName
   * @param cb
   */
  function getPackage (pkgName, cb) {
    var pkg = packages[pkgName]

    if (pkg && pkg.expires > new Date()) {
      return cb(null, pkg)
    }

    npm.commands.view([pkgName, 'time', 'repository'], true, (err, data) => {
      if (err) return cb(err)

      const keys = Object.keys(data)
      var time = keys.length ? data[keys[0]].time : null
      const repository = keys.length ? data[keys[0]].repository : null

      if (time) {
        // Filter the time info by valid semver versions (npm now includes "created" and "modified" fields)
        time = Object.keys(time).filter((ver) => {
          return semver.valid(ver, true)
        }).reduce((cleanTime, ver) => {
          cleanTime[ver] = time[ver]
          return cleanTime
        }, {})

        pkg = packages[pkgName] = new Package(pkgName, time, repository)

        return cb(null, pkg)
      }

      console.warn(pkgName + ' has no time information')

      // We don"t know the date/time any of the versions for this package were published
      // Get latest and use unix epoch as publish date
      npm.commands.view([pkgName, 'version'], true, (err, data) => {
        if (err) return cb(err)

        const keys = Object.keys(data)

        // `npm view 0 version` returns {} - ensure some data was returned
        if (!keys.length) {
          return cb(new Error('Failed to get package for ' + pkgName))
        }

        time = {}

        time[keys[0]] = moment.utc([1970]).toDate()

        pkg = packages[pkgName] = new Package(pkgName, time, repository)

        cb(null, pkg)
      })
    })
  }

  return Feed
}

function Package (name, versions, repo) {
  this.name = name // The name of the package
  this.versions = versions // Versions and their pubdate as returned by NPM
  this.repo = repo // Repository data
  this.expires = moment().add(Package.TTL) // When the versions information is considered stale
}

Package.TTL = moment.duration({hours: 1})

const packages = {}

function FeedItem (name, previous, current, pubdate, repoUrl) {
  this.name = name
  this.previous = previous
  this.current = current
  this.pubdate = pubdate
  this.repoUrl = repoUrl
}

function getRepoUrl (data) {
  if (!data) return data

  const url = Object.prototype.toString.call(data) === '[object String]' ? data : data.url

  if (url && url.indexOf('github.com') !== -1) {
    return url.replace('github.com:', 'github.com/').replace('git:', 'https:').replace('.git', '')
  }

  return null
}

// Create a bunch of Feed items from the passed package
function packageToFeedItems (pkg) {
  var previous = null

  return Object.keys(pkg.versions).map((version) => {
    const item = new FeedItem(pkg.name, previous, version, pkg.versions[version], getRepoUrl(pkg.repo))
    previous = version
    return item
  })
}

// Create the feed XML from the FeedItems
function buildFeedXml (items, name, deps, limit, siteConfig, npmConfig) {
  limit = limit || 32
  deps = deps || {}

  items = items.reduce((items, item) => {
    // Only add item to feed for valid, non-reckless dependency versions
    if (semver.validRange(deps[item.name], true) && deps[item.name] !== 'latest' && deps[item.name] !== '*' && semver.gtr(item.current, deps[item.name], true)) {
      items.push(item)
    }
    return items
  }, [])

  items.sort((a, b) => {
    if (a.pubdate < b.pubdate) {
      return 1
    } else if (a.pubdate === b.pubdate) {
      return 0
    }
    return -1
  })

  items = items.slice(0, limit)

  const rssFeed = new RSS({
    title: `${name} out of date dependencies`,
    description: `Version updates for ${Object.keys(deps).join(', ')}`,
    site_url: siteConfig.hostname
  })

  for (var i = 0, len = items.length; i < len; ++i) {
    rssFeed.item({
      title: `${items[i].name} ${items[i].previous} to ${items[i].current} (${deps[items[i].name]} required)`,
      description: items[i].repoUrl ? `<a href="${items[i].repoUrl}">${items[i].repoUrl}</a>` : null,
      url: `${npmConfig.hostname}/package/${items[i].name}`,
      date: items[i].pubdate
    })
  }

  return rssFeed.xml()
}
