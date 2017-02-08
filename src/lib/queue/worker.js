import Async from 'async'

export default ({ manifest, brains, cache }) => {
  return ({ user, repo, opts }, cb) => {
    Async.waterfall([
      (cb) => {
        manifest.getManifest(user, repo, opts, (err, manifest) => {
          if (err) return cb(err)
          console.log(`Got manifest for ${user}/${repo}`)
          cb(null, manifest)
        })
      },
      (manifest, cb) => {
        brains.getInfo(manifest, opts, (err, info) => {
          if (err) return cb(err)
          console.log(`Got info for ${user}/${repo}`)
          cb(err, manifest, info)
        })
      }
    ], (err, manifest, info) => {
      if (err) return cb(err)
      console.log(`Worker done for ${user}/${repo}`)
      Async.parallel([
        (cb) => cache.setInfo({ user, repo, opts }, info, cb),
        (cb) => cache.setManifest({ user, repo, opts }, manifest, cb)
      ], cb)
    })
  }
}
