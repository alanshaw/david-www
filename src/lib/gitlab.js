import GitLabApi from 'gitlab'
import copy from 'utils-copy-error'

var internals = {
  api: null
}

function Gitlab (apiOptions) {
  internals.apiOptions = apiOptions
  internals.api = new GitLabApi(apiOptions)
}

Gitlab.prototype = {

  repos: {

        /**
          * Get Content from api
          *
          * Example option object {owner: owner, repo: repo, path: "package.json"}
          */
    getContent: (options, callback) => {
            // {owner: owner, repo: repo, path: "package.json"}
      internals.api.projects.repository.showFile({
        projectId: `${options.owner}/${options.repo}`,
        ref: internals.apiOptions.defaultBranch,
        file_path: options.path
      }, function (file) {
        if (file) {
          callback(null, { data: { content: file.content, encoding: 'base64' }, meta: { etag: file.last_commit_id } })
        } else {
          callback(copy(new Error('No such file')), null)
        }
      })
    },

        /**
          * Get Project infos.
          *
          * Example option object {owner: owner, repo: repo}
          */
    get: (options, callback) => {
      internals.api.projects.show(options.owner + '/' + options.repo, function (project) {
        if (project) {
          project.private = !project.public
          callback(null, project)
        } else {
          callback(copy(new Error('no such project')), null)
        }
      })
    }
  }

}

/**
 * Create an authenticated instance of the GitLab API accessor.
 */
module.exports = ({gitlabConfig}) => {
  const apiOpts = {
    url: gitlabConfig.api.url,
    token: gitlabConfig.token,
    defaultBranch: gitlabConfig.defaultBranch
  }

  const gitlab = {
    getInstance: () => {
      var instance = new Gitlab(apiOpts)
      return instance
    }
  }

  return gitlab
}
