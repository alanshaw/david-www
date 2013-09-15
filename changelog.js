var GitHubApi = require('github');
var config = require('config');
var npm = require('npm');
var semver = require('semver');
var url = require('url');
var moment = require('moment');

var github = new GitHubApi({version: '3.0.0'});

if (config.github) {
	github.authenticate({
		type: 'basic',
		username: config.github.username,
		password: config.github.password
	});
}

// Get a username and repo name for a github repository
function getUserRepo (depName, cb) {

	npm.commands.view([depName, 'repository'], true, function(er, data) {
		if (er) {
			return cb(er);
		}

		var keys = Object.keys(data);
		var repo = keys.length ? data[keys[0]].repository : null;

		if (!repo) {
			return cb(new Error(depName + ' has no repository information'));
		}

		var repoUrl = Object.prototype.toString.call(data) === '[object String]' ? repo : repo.url;

		if (!repoUrl || repoUrl.indexOf('github.com') === -1) {
			return cb(new Error('Unsupported repository URL'));
		}

		try {
			var repoPathname = url.parse(repoUrl).pathname.split('/');
			cb(null, repoPathname[1], repoPathname[2].replace('.git', ''));
		} catch (e) {
			cb(new Error('Failed to parse repository URL'));
		}
	});
}

/**
 * Get commits for a repo between two dates
 *
 * @param {String} depName Module name
 * @param {Date} from
 * @param {Date} to
 * @param {Function} cb
 */
module.exports.getCommits = function (depName, from, to, cb) {

	npm.load({}, function (er) {
		if (er) {
			return cb(er);
		}

		getUserRepo(depName, function (er, user, repo) {
			if (er) {
				return cb(er);
			}

			// TODO: Munge the commits data?
			github.repos.getCommits({user: user, repo: repo, since: from, until: to}, cb);
		});
	});
};

/**
 * Get the publish date for a module at a particular version (or range)
 *
 * @param {String} depName Module name
 * @param {String} depVersion Module version. If range then publish date for lowest satisfying version is given.
 * @param {Function} cb
 */
module.exports.getPublishDate = function (depName, depVersion, cb) {

	npm.load({}, function (er) {
		if (er) {
			return cb(er);
		}

		npm.commands.view([depName, 'time'], true, function (er, data) {
			if (er) {
				return cb(er);
			}

			var keys = Object.keys(data);
			var time = keys.length ? data[keys[0]].time : null;

			if (!time) {
				return cb(new Error(depName + ' has no time information'));
			}

			var versionsByDate = Object.keys(time).reduce(function (versions, version) {
				versions[time[version]] = version;
				return versions;
			}, {});

			var ascPublishDates = Object.keys(time).map(function (version) {
				return time[version];
			}).sort();

			// Get the first depVersion that satisfies the range
			for (var i = 0, len = ascPublishDates.length; i < len; ++i) {
				if (semver.satisfies(versionsByDate[ascPublishDates[i]], depVersion)) {
					return cb(null, moment(ascPublishDates[i]).toDate());
				}
			}

			cb(new Error('Failed to find publish date'));
		});
	});
};

/**
 * Get closed issues for a module between two dates
 *
 * @param {String} depName Module name
 * @param {Date} from
 * @param {Date} to
 * @param {Function} cb
 */
module.exports.getClosedIssues = function (depName, from, to, cb) {

	npm.load({}, function (er) {
		if (er) {
			return cb(er);
		}

		getUserRepo(depName, function (er, user, repo) {
			if (er) {
				return cb(er);
			}

			var opts = {
				user: user,
				repo: repo,
				state: 'closed',
				sort: 'created',
				since: from,
				per_page: 100
			};

			github.issues.repoIssues(opts, function (er, issues) {
				if (er) {
					return cb(er);
				}

				issues = issues.filter(function (issue) {
					return to > moment(issue.closed_at).toDate();
				});

				cb(null, issues);
			});
		});
	});
};
