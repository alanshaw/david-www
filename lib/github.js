var GitHubApi = require("github")
  , config = require("config")

var apiOptions = {
  protocol: config.github.api.protocol,
  host: config.github.api.host,
  version: config.github.api.version,
  pathPrefix: config.github.api.pathPrefix,
  timeout: 5000
}

/**
 * Create an authenticated instance of the GitHub API accessor.
 *
 * @param {String} authToken OAuth access token
 * - If a user-specific token is not supplied, uses the master OAuth token
 */
module.exports.getInstance = function (authToken) {
  var instance = new GitHubApi(apiOptions)
  instance.authenticate({
    type: "oauth",
    token: authToken ? authToken : config.github.token
  })
  return instance
}
