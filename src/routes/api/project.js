// import Boom from 'boom'
// import extract from 'extract'
// import createWithManifestAndInfo from '../helpers/with-manifest-and-info'

export default (app, manifest) => {
  // const withManifestAndInfo = createWithManifestAndInfo(manifest)

  app.get('/:user/:repo/:ref?/project.json', (req, res, next) => {
    // withManifestAndInfo(req, (err, manifest) => {
    //   if (err) return next(Boom.wrap(err, 500, 'Failed to get manifest'))
    //   res.json(extract(manifest, [
    //     'name',
    //     'version',
    //     'description',
    //     'dependencies',
    //     'devDependencies',
    //     'peerDependencies',
    //     'optionalDependencies'
    //   ]))
    // })
    redirectProject(req, res)
  })
}

function redirectProject (req, res) {
  const { user, repo, ref } = req.params
  const { path } = req.query
  const url = new URL('https://project.david-dm.org')
  url.pathname = `/gh/${encodeURIComponent(user)}/${encodeURIComponent(repo)}`
  url.search = new URLSearchParams(Object.entries({ path, ref }).filter(([, v]) => !!v)).toString()
  res.redirect(301, url.toString())
}
