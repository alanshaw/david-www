// import Boom from 'boom'
// import createWithManifestAndInfo from '../helpers/with-manifest-and-info'

export default (app, manifest, brains) => {
  // const withManifestAndInfo = createWithManifestAndInfo(manifest, brains)

  app.get('/:user/:repo/:ref?/dev-info.json', (req, res, next) => {
    // withManifestAndInfo(req, {dev: true}, (err, manifest, info) => {
    //   if (err) return next(Boom.wrap(err, 500, 'Failed to get manifest and info'))
    //   res.json(info)
    // })
    redirectInfo(req, res, 'dev')
  })

  app.get('/:user/:repo/:ref?/info.json', (req, res, next) => {
    // withManifestAndInfo(req, (err, manifest, info) => {
    //   if (err) return next(Boom.wrap(err, 500, 'Failed to get manifest and info'))
    //   res.json(info)
    // })
    redirectInfo(req, res)
  })

  app.get('/:user/:repo/:ref?/peer-info.json', (req, res, next) => {
    // withManifestAndInfo(req, {peer: true}, (err, manifest, info) => {
    //   if (err) return next(Boom.wrap(err, 500, 'Failed to get manifest and info'))
    //   res.json(info)
    // })
    redirectInfo(req, res, 'peer')
  })

  app.get('/:user/:repo/:ref?/optional-info.json', (req, res, next) => {
    // withManifestAndInfo(req, {optional: true}, (err, manifest, info) => {
    //   if (err) return next(Boom.wrap(err, 500, 'Failed to get manifest and info'))
    //   res.json(info)
    // })
    redirectInfo(req, res, 'optional')
  })
}

function redirectInfo (req, res, type) {
  const { user, repo, ref } = req.params
  const { path } = req.query
  const url = new URL('https://status.david-dm.org')
  url.pathname = `/gh/${encodeURIComponent(user)}/${encodeURIComponent(repo)}`
  url.search = new URLSearchParams(Object.entries({ path, ref, type }).filter(([, v]) => !!v)).toString()
  res.redirect(301, url.toString())
}
