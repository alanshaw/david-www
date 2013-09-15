var GitHubApi = require('github');
var async = require('async');
var manifest = require('./manifest');
var brains = require('./brains');
var config = require('config');

var github = new GitHubApi({version: '3.0.0'});

if (config.github) {
	github.authenticate({
		type: 'basic',
		username: config.github.username,
		password: config.github.password
	});
}

/**
 * Get repositories for a user
 *
 * @param {String} user Username
 * @param {Object|Function} [options] Options or callback function
 * @param {Number} [options.page] Page of repos to start from
 * @param {Array} [options.repos] Repositories retrieved so far
 * @param {Number} [options.pageSize] Page size, max 100
 * @param {Function} callback Callback function
 */
function getRepos(user, options, callback) {

	// Allow callback to be passed as second parameter
	if (!callback) {
		callback = options;
		options = {page: 0, repos: [], pageSize: 100};
	} else {
		options = options || {page: 0, repos: [], pageSize: 100};
	}

	setImmediate(function() {

		github.repos.getFromUser({user: user, page: options.page, per_page: options.pageSize}, function(err, data) {

			if (err) {
				callback(err);
				return;
			}

			if (data.length) {

				options.repos = options.repos.concat(data);

				if (data.length === options.pageSize) {

					// Maybe another page?
					options.page++;

					getRepos(user, options, callback);

				} else {

					callback(null, options.repos);
				}

			} else {
				// All done!
				callback(null, options.repos);
			}
		});
	});
}

/**
 * Create a function to be used with async.parallel that'll get info from brains for a repo.
 *
 * @param {String} user Username
 * @param {Object} repo Repository data as returned by GitHub API
 * @returns {Function}
 */
function createGetInfoTask(user, repo) {
	return function(callback) {

		manifest.getManifest(user, repo.name, function(err, manifest) {

			// This is fine - perhaps the repo doesn't have a package.json
			if (err) {
				callback();
				return;
			}

			brains.getInfo(manifest, function(err, info) {

				if (err) {
					callback(err);
					return;
				}

				callback(null, {repo: repo, manifest: manifest, info: info});
			});
		});
	};
}

/**
 * @param {String} user Username
 * @param {Function} callback Passed array of objects with properties repo, info, manifest.
 */
module.exports.get = function(user, callback) {

	getRepos(user, function(err, repos) {

		if (err) {
			callback(err);
			return;
		}

		// Get repository status information
		async.parallel(
			repos.map(function(repo) {
				return createGetInfoTask(user, repo);
			}),
			function(err, data) {

				if (err) {
					callback(err);
					return;
				}

				callback(null, data.filter(function(d) {return !!d;}));
			}
		);
	});
};
