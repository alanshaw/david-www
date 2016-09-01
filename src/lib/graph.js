import moment from 'moment'
import semver from 'semver'
import npm from 'npm'
import Async from 'async'
import { decycle } from 'cycle'

function ModuleVersions ({ name, versions }) {
  this.name = name
  this.versions = versions
  this.expires = moment().add(ModuleVersions.TTL).valueOf()
}

ModuleVersions.TTL = moment.duration({ days: 1 })

function Project ({ name, version, dependencies = [] }) {
  this.name = name
  this.version = version
  this.dependencies = dependencies
  this.expires = moment().add(Project.TTL).valueOf()
}

Project.TTL = moment.duration({ hours: 1 })

function Module ({ name, version, dependencies = [] }) {
  this.name = name
  this.version = version
  this.dependencies = dependencies
}

export default ({db, npmConfig}) => {
  const Graph = {
    /**
     * Get dependency graph for a non-NPM project
     *
     * @param name
     * @param version
     * @param deps
     * @param {Function} cb Second parameter is decycled dependency graph
     * @see https://github.com/douglascrockford/JSON-js/blob/master/cycle.js
     */
    getProjectDependencyGraph (name, version, dependencies, cb) {
      const projectGraphKey = `graph/project/${name}/${version}`

      dependencies = dependencies || {}

      db.get(projectGraphKey, (err, project) => {
        if (err && !err.notFound) return cb(err)

        if (project && project.expires > Date.now()) {
          console.log('Using cached project dependency graph', projectGraphKey)
          return cb(null, project)
        }

        project = new Project({ name, version })

        npm.load(npmConfig.options, (err) => {
          if (err) return cb(err)

          if (!Object.keys(dependencies).length) {
            return db.put(projectGraphKey, project, (err) => cb(err, project))
          }

          const cache = {}

          Async.eachOf(dependencies, (range, name, cb) => {
            getLatestSatisfying(name, range, (err, version) => {
              if (err && err.code !== 'E404') return cb(err)

              // There should be a version that satisfies!
              // But...
              // The range could be a tag, or a git repo
              if (!version) {
                // Add a dummy package with the range as it's version
                project.dependencies.push(new Module({ name, range }))
                return cb()
              }

              getDependencyGraph(name, version, cache, (err, dependencyGraph) => {
                if (err) return cb(err)
                project.dependencies.push(dependencyGraph)
                cb()
              })
            })
          }, (err) => {
            if (err) return cb(err)
            project = decycle(project)
            db.put(projectGraphKey, project, (err) => cb(err, project))
          })
        })
      })
    }
  }

  /**
   * Get the dependency graph for a given NPM dependency name and version.
   *
   * Must be executed in `npm.load()` callback.
   *
   * @param depName Package name
   * @param version
   * @param cb
   */
  function getDependencyGraph (name, version, cache = {}, cb) {
    cache[name] = cache[name] || {}

    let module = cache[name][version]

    if (module) return process.nextTick(() => cb(null, module))

    module = cache[name][version] = new Module({ name, version })

    getModuleDependencies(name, version, (err, dependencies) => {
      if (err) return cb(err)

      // No dependencies?
      if (!Object.keys(dependencies).length) return cb(null, module)

      Async.eachOf(dependencies, (range, name, cb) => {
        getLatestSatisfying(name, range, (err, version) => {
          if (err && err.code !== 'E404') return cb(err)

          // There should be a version that satisfies!
          // But...
          // The range could be a tag, or a git repo
          if (!version) {
            // Add a dummy package with the range as it's version
            module.dependencies.push(new Module({ name, range }))
            return cb()
          }

          getDependencyGraph(name, version, cache, (err, dependencyGraph) => {
            if (err) return cb(err)
            module.dependencies.push(dependencyGraph)
            cb()
          })
        })
      }, (err) => cb(err, module))
    })
  }

  /**
   * Get the latest version for the passed dependency name that satisfies the passed range.
   *
   * Must be executed in `npm.load()` callback.
   *
   * @param depName
   * @param range
   * @param cb
   */
  function getLatestSatisfying (name, range, cb) {
    const key = `graph/module/versions/${name}`

    Async.waterfall([
      (cb) => {
        db.get(key, (err, moduleVersions) => {
          if (err && !err.notFound) return cb(err)

          if (moduleVersions && moduleVersions.expires > Date.now()) {
            return cb(null, moduleVersions)
          }

          cb(null, null)
        })
      },
      (moduleVersions, cb) => {
        if (moduleVersions) {
          return Async.setImmediate(() => cb(null, moduleVersions))
        }

        npm.commands.view([name, 'versions'], (err, data) => {
          if (err) return cb(err)

          const keys = Object.keys(data)

          // `npm view 0 versions` returns {} - ensure some data was returned
          const versions = keys.length ? data[keys[0]].versions : []
          const moduleVersions = new ModuleVersions({ name, versions })

          db.put(key, moduleVersions, (err) => cb(err, moduleVersions))
        })
      }
    ], (err, moduleVersions) => {
      if (err) return cb(err)

      range = range === 'latest' ? '' : range

      // Get the most recent version that satisfies the range
      const version = semver.maxSatisfying(moduleVersions.versions, range, true)

      cb(null, version)
    })
  }

  function getModuleDependencies (name, version, cb) {
    const key = `graph/module/dependencies/${name}/${version}`

    db.get(key, (err, dependencies) => {
      if (err && !err.notFound) return cb(err)
      if (dependencies) return cb(null, dependencies)

      npm.commands.view([`${name}@${version}`, 'dependencies'], (err, data) => {
        if (err) return cb(err)
        const dependencies = (data[version] && data[version].dependencies) || {}
        db.put(key, dependencies, (err) => cb(err, dependencies))
      })
    })
  }

  return Graph
}
