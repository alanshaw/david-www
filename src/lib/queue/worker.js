import Async from 'async'

export default ({ manifest, brains, cache }) => {
  return ({ user, repo, opts }, cb) => {
    Async.waterfall([
      (cb) => manifest.getManifest(user, repo, opts, cb),
      (manifest, cb) => {
        brains.getInfo(manifest, opts, (err, info) => cb(err, manifest, info))
      }
    ], (err, manifest, info) => {
      if (err) return cb(err)
      Async.parallel([
        (cb) => cache.setInfo({ user, repo, opts }, info, cb),
        (cb) => cache.setManifest({ user, repo, opts }, manifest, cb)
      ], cb)
    })
  }
}
