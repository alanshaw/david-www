import Boom from 'boom'
import extract from 'extract'
import createWithManifestAndInfo from '../helpers/with-manifest-and-info'

export default (app, manifest) => {
  const withManifestAndInfo = createWithManifestAndInfo(manifest)

  app.get('/:user/:repo/:ref?/project.json', (req, res, next) => {
    withManifestAndInfo(req, (err, manifest) => {
      if (err) return next(Boom.wrap(err, 500, 'Failed to get manifest'))
      res.json(extract(manifest, [
        'name',
        'version',
        'description',
        'dependencies',
        'devDependencies',
        'peerDependencies',
        'optionalDependencies'
      ]))
    })
  })
}
