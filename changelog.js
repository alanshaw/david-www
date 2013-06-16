var GitHubApi = require('github');
var config = require('config');
var npm = require('npm');
var semver = require('semver');

var github = new GitHubApi({version: '3.0.0'});

if (config.github) {
	github.authenticate({
		type: 'basic',
		username: config.github.username,
		password: config.github.password
	});
}

// Get a username and repo name for a repository
function getUserRepo (depName, cb) {
	
	npm.commands.view([depName, 'repository'], true, function(err, data) {
		// TODO: get user/repo
	});
}

/**
 * Get commits for a repo between two dates
 * 
 * @param depName
 * @param from
 * @param to
 * @param cb
 */
module.exports.getCommits = function (depName, from, to, cb) {
	
	npm.load({}, function (er) {
		if (er) {
			return cb(er);
		}
		
		getUserRepo(depName, function (er, user, repo) {
			if (er) {
				return cb (er);
			}
			
			github.repos.getCommits({user: user, repo: repo, since: from, until: to}, function (er, commits) {
				
			});
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
					return cb(null, ascPublishDates[i]);
				}
			}
			
			cb(new Error('Failed to find publish date'));
		});
	});
};
