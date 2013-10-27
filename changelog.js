var GitHubApi = require('github');
var config = require('config');
var npm = require('npm');
var semver = require('semver');
var moment = require('moment');
var githubUrl = require('github-url');
var async = require('async');
var extract = require('extract');

var github = new GitHubApi({version: '3.0.0'});

if (config.github) {
	github.authenticate({
		type: 'basic',
		username: config.github.username,
		password: config.github.password
	});
}

// Get a username and repo name for a github repository
function getUserRepo (modName, cb) {

	npm.commands.view([modName, 'repository'], true, function(er, data) {
		if (er) {
			return cb(er);
		}

		var keys = Object.keys(data);
		var repo = keys.length ? data[keys[0]].repository : null;

		if (!repo) {
			return cb(new Error(modName + ' has no repository information'));
		}

		var info = githubUrl(repo);

		if (!info) {
			return cb(new Error('Unsupported repository URL'));
		}

		cb(null, info.user, info.project);
	});
}

/**
 * Get the publish dates for a module at particular versions (or ranges)
 *
 * @param {String} modName Module name
 * @param {Array} modVers Module versions. If range then publish date for lowest satisfying version is given.
 * @param {Function} cb Receives an array of dates corresponding to the array of module versions
 */
function getPublishDates (modName, modVers, cb) {
	var tasks = modVers.map(function(ver) {

		return function(cb) {

			npm.commands.view([modName, 'time'], true, function(er, data) {
				if (er) {
					return cb(er);
				}

				var keys = Object.keys(data);
				var time = keys.length ? data[keys[0]].time : null;

				if (!time) {
					return cb(new Error(modName + ' has no time information'));
				}

				// Flip `time` from {[version]: [date]} to {[date]: [version]}
				var versionsByDate = Object.keys(time).reduce(function(versions, version) {
					versions[time[version]] = version;
					return versions;
				}, {});

				// Create an array of publish dates in ASC order
				var ascPublishDates = Object.keys(time).map(function(version) {
					return time[version];
				}).sort();

				// Get the first version that satisfies the range
				for (var i = 0, len = ascPublishDates.length; i < len; ++i) {
					if (semver.satisfies(versionsByDate[ascPublishDates[i]], ver)) {
						return cb(null, moment(ascPublishDates[i]).toDate());
					}
				}

				cb(new Error('Failed to find publish date for ' + modName + '@' + ver));
			});
		};
	});

	async.parallel(tasks, cb);
}

/**
 * Get closed issues and commits for a module between two versions
 *
 * @param {String} modName Module name
 * @param {Date} fromVer
 * @param {Date} toVer
 * @param {Function} cb
 */
module.exports.getChanges = function(modName, fromVer, toVer, cb) {
	console.log('Getting changes for', modName, 'from', fromVer, 'to', toVer);

	npm.load({}, function(er) {
		if (er) {
			return cb(er);
		}

		getUserRepo(modName, function(er, user, repo) {
			if (er) {
				return cb(er);
			}

			getPublishDates(modName, [fromVer, toVer], function(er, dates) {
				if (er) {
					return cb(er);
				}

				var issuesOpts = {
					user: user,
					repo: repo,
					state: 'closed',
					sort: 'created',
					since: dates[0],
					per_page: 100
				};

				github.issues.repoIssues(issuesOpts, function(er, issues) {
					if (er) {
						return cb(er);
					}

					issues = issues.filter(function(issue) {
						return dates[1] > moment(issue.closed_at).toDate();
					});

					var commitsOpts = {
						user: user,
						repo: repo,
						since: dates[0],
						until: dates[1]
					};

					github.repos.getCommits(commitsOpts, function(er, commits) {
						if (er) {
							return cb(er);
						}

						//console.log(issues, commits);

						issues = issues.map(function(issue) {
							return extract(issue, [
								'number',
								'title',
								'closed_at',
								'html_url',
								['user', ['html_url', 'avatar_url', 'login']]
							]);
						}).sort(function(a, b) {
							if (a.closed_at > b.closed_at) {
								return -1;
							} else if (a.closed_at < b.closed_at) {
								return 1;
							}
							return 0;
						});

						commits = commits.map(function(commit) {
							return extract(commit, [
								'html_url',
								['author', ['login', 'html_url', 'avatar_url']],
								['commit', [
									'message',
									['committer', ['date']],
									['author', ['name']]
								]]
							]);
						});

						cb(null, {closedIssues: issues, commits: commits});
					});
				});
			});
		});
	});
};
