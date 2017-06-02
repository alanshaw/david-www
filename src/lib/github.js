import GitHubApi from 'github'
import fs from 'fs'

export default ({githubConfig}) => {
  const apiOpts = {
    protocol: githubConfig.api.protocol,
    host: githubConfig.api.host,
    port: githubConfig.api.port,
    version: githubConfig.api.version,
    pathPrefix: githubConfig.api.pathPrefix,
    timeout: githubConfig.api.timeout,
    ca: (githubConfig.api.caFile ? fs.readFileSync(githubConfig.api.caFile) : undefined)
  }

  const defaultInstance = new GitHubApi(apiOpts)

  if (githubConfig.token) {
    defaultInstance.authenticate({type: 'oauth', token: githubConfig.token})
  }

  const Github = {
    /**
     * Create an authenticated instance of the GitHub API accessor.
     *
     * @param {String} authToken OAuth access token
     * - If a user-specific token is not supplied, uses the master OAuth token
     */
    getInstance (authToken) {
      if (!authToken) return defaultInstance
      const instance = new GitHubApi(apiOpts)
      instance.authenticate({type: 'oauth', token: authToken})
      return instance
    }
  }

  return Github
}
