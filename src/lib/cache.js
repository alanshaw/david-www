export default ({ db }) => {
  const name = `cache${Math.random().toString(36)}`

  return {
    getManifest ({ user, repo, opts }, cb) {
      const key = createKey(`${name}~manifest`, { user, repo, opts })
      db.get(key, (err, manifest) => {
        if (err) return err.notFound ? cb() : cb(err)
        cb(null, manifest)
      })
    },

    setManifest ({ user, repo, opts }, manifest, cb) {
      const key = createKey(`${name}~manifest`, { user, repo, opts })
      db.put(key, manifest, cb)
    },

    getInfo ({ user, repo, opts }, cb) {
      const key = createKey(`${name}~info`, { user, repo, opts })
      db.get(key, (err, info) => {
        if (err) return err.notFound ? cb() : cb(err)
        cb(null, info)
      })
    },

    setInfo ({ user, repo, opts }, info, cb) {
      const key = createKey(`${name}~info`, { user, repo, opts })
      db.put(key, info, cb)
    }
  }
}

function createKey (prefix, { user, repo, opts }) {
  opts = opts || {}

  let key = `${prefix}~${user}~${repo}`

  if (opts.path && opts.path[opts.path.length - 1] === '/') {
    opts.path = opts.path.slice(0, -1)
  }

  if (opts.path) {
    key += `~${opts.path.replace(/\//g, '~')}`
  }

  key += `~${opts.ref || 'master'}`

  if (opts.dev) {
    key += '~devDependencies'
  } else if (opts.peer) {
    key += '~peerDependencies'
  } else if (opts.optional) {
    key += '~optionalDependencies'
  } else {
    key += '~dependencies'
  }

  return key
}
