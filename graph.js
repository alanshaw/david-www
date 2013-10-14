var npm = require('npm');
var moment = require('moment');
var semver = require('semver');
var cycle = require('cycle');

function Package(name, version) {
	this.name = name;
	this.version = version;
	this.deps = {};
	this.expires = moment().add(Package.TTL);
}

Package.TTL = moment.duration({days: 1});

/**
 * Recursively removes the expires property from a decycled Package.
 *
 * Necessary until https://github.com/douglascrockford/JSON-js/pull/50 is pulled or a better solution becomes available.
 *
 * @param {Object} decycledPkg A decycled Package
 * @return {Object} decycledPkg
 */
function deleteExpires(decycledPkg) {

	delete decycledPkg.expires;

	Object.keys(decycledPkg.deps).forEach(function(depName) {
		// Delete expires from this dependency if it isn't a decycle reference
		if (!decycledPkg.deps[depName].$ref) {
			deleteExpires(decycledPkg.deps[depName]);
		}
	});

	return decycledPkg;
}

var dependencies = {};

/**
 * Get the dependency graph for a given NPM dependency name and version.
 *
 * Must be executed in `npm.load()` callback.
 *
 * @param depName Package name
 * @param version
 * @param callback
 */
function getDependencyGraph(depName, version, callback) {

	dependencies[depName] = dependencies[depName] || {};

	var dep = dependencies[depName][version];

	if (dep) {

		if (dep.expires > new Date()) {
			callback(null, dep);
			return;
		}

		dep.deps = {};
		dep.expires = moment().add(Package.TTL);

	} else {
		dep = dependencies[depName][version] = new Package(depName, version);
	}

	process.nextTick(function() {

		npm.commands.view([depName + '@' + version, 'dependencies'], function(err, data) {

			if (err) {
				callback(err);
				return;
			}

			var depDeps = data[version] ? data[version].dependencies ? data[version].dependencies : {} : {},
				depDepNames = depDeps ? Object.keys(depDeps) : [];

			// No dependencies?
			if (depDepNames.length === 0) {
				callback(null, dep);
				return;
			}

			var got = 0;

			depDepNames.forEach(function(depDepName) {

				var depDepRange = depDeps[depDepName];

				latestSatisfying(depDepName, depDepRange, function(err, depDepVersion) {

					if (err) {
						callback(err);
						return;
					}

					// There should be a version that satisfies!
					// But...
					// The range could be a tag, or a git repo
					if (!depDepVersion) {

						// Add a dummy package with the range as it's version
						dep.deps[depDepName] = new Package(depDepName, depDepRange);

						got++;

						if (got === depDepNames.length) {
							dependencies[depName][version] = dep;
							callback(null, dep);
						}

					} else {

						getDependencyGraph(depDepName, depDepVersion, function(err, depDep) {

							if (err) {
								callback(err);
								return;
							}

							dep.deps[depDepName] = depDep;

							got++;

							if (got === depDepNames.length) {
								dependencies[depName][version] = dep;
								callback(null, dep);
							}
						});
					}

				}); // npm
			});
		});
	});
}

/**
 * Get the latest version for the passed dependency name that satisfies the passed range.
 *
 * Must be executed in `npm.load()` callback.
 *
 * @param depName
 * @param range
 * @param callback
 */
function latestSatisfying(depName, range, callback) {

	npm.commands.view([depName, 'versions'], function(err, data) {

		if (err) {
			callback(err);
			return;
		}

		var keys = Object.keys(data);

		// `npm view 0 versions` returns {} - ensure some data was returned
		if (!keys.length) {
			callback();
			return;
		}

		if (range === 'latest') {
			range = '';
		}

		// Get the most recent version that satisfies the range
		var version = semver.maxSatisfying(data[keys[0]].versions, range, true);

		callback(null, version);
	});
}

// Cache of projects we have cached dependencies for
var projects = {};

/**
 * Get dependency graph for a non-NPM project
 *
 * @param name
 * @param version
 * @param deps
 * @param {Function<Error, Object>} callback Second parameter is decycled dependency graph
 * @see https://github.com/douglascrockford/JSON-js/blob/master/cycle.js
 */
module.exports.getProjectDependencyGraph = function(name, version, deps, callback) {

	projects[name] = projects[name] || {};

	var project = projects[name][version];

	if (project) {

		if (project.expires > new Date()) {
			console.log('Using cached project dependency graph', name, version);
			callback(null, deleteExpires(cycle.decycle(project)));
			return;
		}

		project.deps = {};
		project.expires = moment().add(Package.TTL);

	} else {
		project = projects[name][version] = new Package(name, version);
	}

	npm.load({}, function(err) {

		if (err) {
			callback(err);
			return;
		}

		var depNames = Object.keys(deps),
			done = 0;

		depNames.forEach(function(depName) {

			var range = deps[depName];

			latestSatisfying(depName, range, function(err, version) {

				if (err) {
					callback(err);
					return;
				}

				// There should be a version that satisfies!
				// But...
				// The range could be a tag, or a git repo
				if (!version) {

					// Add a dummy package with the range as it's version
					project.deps[depName] = new Package(depName, range);

					done++;

					if (done === depNames.length) {
						callback(null, cycle.decycle(project));
					}

				} else {

					getDependencyGraph(depName, version, function(err, dep) {

						if (err) {
							callback(err);
							return;
						}

						project.deps[depName] = dep;

						done++;

						if (done === depNames.length) {
							callback(null, deleteExpires(cycle.decycle(project)));
						}
					});
				}
			});
		});


	});
};

/**
 * Set the TTL for cached packages.
 *
 * @param {moment.duration} duration Time period the packages will be cacched for, expressed as a moment.duration.
 */
module.exports.setCacheDuration = function(duration) {
	Package.TTL = duration;
};
