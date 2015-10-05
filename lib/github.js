var GitHubApi = require("github")
  , config = require("config")

var apiOptions = {
  protocol: config.github.api.protocol,
  host: config.github.api.host,
  port: config.github.api.port,
  version: config.github.api.version,
  pathPrefix: config.github.api.pathPrefix,
  timeout: 5000
}

var defaultInstance = new GitHubApi(apiOptions)

if (config.github.token) {
  defaultInstance.authenticate({
    type: "oauth",
    token: config.github.token
  })
}

/**
 * Create an authenticated instance of the GitHub API accessor.
 *
 * @param {String} authToken OAuth access token
 * - If a user-specific token is not supplied, uses the master OAuth token
 */
module.exports.getInstance = function (authToken) {
  if (!authToken) return defaultInstance

  var instance = new GitHubApi(apiOptions)

  instance.authenticate({
    type: "oauth",
    token: authToken
  })

  return instance
}
