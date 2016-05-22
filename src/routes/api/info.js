import createWithManifestAndInfo from '../helpers/with-manifest-and-info'

export default (app, manifest, brains) => {
  const withManifestAndInfo = createWithManifestAndInfo(manifest, brains)

  app.get('/:user/:repo/:ref?/dev-info.json', (req, res) => {
    withManifestAndInfo(req, res, {dev: true}, (manifest, info) => {
      res.json(info)
    })
  })

  app.get('/:user/:repo/:ref?/info.json', (req, res) => {
    withManifestAndInfo(req, res, (manifest, info) => {
      res.json(info)
    })
  })

  app.get('/:user/:repo/:ref?/peer-info.json', (req, res) => {
    withManifestAndInfo(req, res, {peer: true}, (manifest, info) => {
      res.json(info)
    })
  })

  app.get('/:user/:repo/:ref?/optional-info.json', (req, res) => {
    withManifestAndInfo(req, res, {optional: true}, (manifest, info) => {
      res.json(info)
    })
  })
}
