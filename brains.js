/**
 * Information about what the website considers to be an out of date or up to date dependency
 */

var david = require('david');
var semver = require('semver');
var cache = require('memory-cache');
var registry = require('./registry');
var config = require('config');

// When a user publishes a package, delete cached david info
registry.on('change', function (change) {
	cache.del(change.doc.name);
});

function isPinned (version) {
	if (version === '*' || version === 'latest') {
		return false;
	}

	var range = semver.validRange(version, true);

	if (range && range.indexOf('>=') === 0) {
		return false;
	}

	return true;
}

function normaliseDeps (deps) {
	if (Array.isArray(deps)) {
		deps = deps.reduce(function (d, depName) {
			d[depName] = '*';
			return d;
		}, {});
	}
	return deps;
}

function getCachedDependencies (manifest, opts) {
	var pkgs = {};
	var deps = normaliseDeps(manifest[opts.dev ? 'devDependencies' : 'dependencies'] || {});
	var depNames = Object.keys(deps);

	if (!depNames.length) {
		return pkgs;
	}

	depNames.forEach(function (depName) {
		var info = cache.get(depName);

		if (!info) {
			return;
		}

		pkgs[depName] = {required: deps[depName], stable: info.stable, latest: info.latest};
	});

	return pkgs;
}

function getDependencies (manifest, opts, cb) {

	// Get the dependency info we already have cached information for
	var cachedInfos = getCachedDependencies(manifest, opts);
	var cachedDepNames = Object.keys(cachedInfos);

	var manifestDeps = normaliseDeps(manifest[opts.dev ? 'devDependencies' : 'dependencies'] || {});

	var uncachedManifestDeps = Object.keys(manifestDeps).filter(function (depName) {
		return cachedDepNames.indexOf(depName) === -1;
	}).reduce(function (deps, depName) {
		deps[depName] = manifestDeps[depName];
		return deps;
	}, {});

	var uncachedManifestDepNames = Object.keys(uncachedManifestDeps);

	if (!uncachedManifestDepNames.length) {
		return setImmediate(function () {
			cb(null, cachedInfos);
		});
	}

	var uncachedManifest = {};
	uncachedManifest[opts.dev ? 'devDependencies' : 'dependencies'] = uncachedManifestDeps;

	david.getDependencies(uncachedManifest, opts, function (er, infos) {
		if (er) {
			return cb(er);
		}

		// Cache the new info
		Object.keys(infos).forEach(function (depName) {
			if (config.brains.cacheTime) {
				var info = infos[depName];
				cache.put(depName, {stable: info.stable, latest: info.latest}, config.brains.cacheTime);
			}
		});

		cachedDepNames.forEach(function (depName) {
			infos[depName] = cachedInfos[depName];
		});

		cb(null, infos);
	});
}

function getUpdatedDependencies (manifest, opts, cb) {
	getDependencies(manifest, opts, function (er, infos) {
		if (er) {
			return cb(er);
		}

		// Filter out the non-updated dependencies
		Object.keys(infos).forEach(function (depName) {
			if (!david.isUpdated(infos[depName], opts)) {
				delete infos[depName];
			}
		});

		cb(null, infos);
	});
}

/**
 * @param {Object} manifest Parsed package.json file contents
 * @param {Object|Function} [opts] Options or cb
 * @param {Boolean} [opts.dev] Consider devDependencies
 * @param {Function} cb Function that receives the results
 */
module.exports.getInfo = function (manifest, opts, cb) {

	// Allow cb to be passed as second parameter
	if (!cb) {
		cb = opts;
		opts = {};
	} else {
		opts = opts || {};
	}

	var davidOptions = {dev: opts.dev, loose: true};

	getDependencies(manifest, davidOptions, function (er, deps) {

		if (er) {
			return cb(er);
		}

		// Get ALL updated dependencies including unstable
		getUpdatedDependencies(manifest, davidOptions, function (er, updatedDeps) {

			if (er) {
				return cb(er);
			}

			davidOptions.stable = true;

			// Get STABLE updated dependencies
			getUpdatedDependencies(manifest, davidOptions, function (er, updatedStableDeps) {

				if (er) {
					return cb(er);
				}

				var depNames = Object.keys(deps).sort(),
					totals = {
						upToDate: 0,
						outOfDate: 0,
						pinned: {
							upToDate: 0,
							outOfDate: 0
						},
						unpinned: {
							upToDate: 0,
							outOfDate: 0
						}
					};

				var depList = depNames.map(function (depName) {

					// Lets disprove this
					var status = 'uptodate';

					// If there is an updated STABLE dependency then this dep is out of date
					if (updatedStableDeps[depName]) {
						status = 'outofdate';
					// If it is in the UNSTABLE list, and has no stable version then consider out of date
					} else if (updatedDeps[depName] && !updatedDeps[depName].stable) {
						status = 'outofdate';
					}

					var pinned = isPinned(deps[depName].required);

					var info = {
						name: depName,
						required: deps[depName].required,
						stable: deps[depName].stable,
						latest: deps[depName].latest,
						status: status,
						pinned: pinned
					};

					if (status === 'uptodate' && pinned) {
						info.upToDate = true;
						totals.upToDate++;
						totals.pinned.upToDate++;
					} else if (status === 'uptodate' && !pinned) {
						info.upToDate = true;
						totals.upToDate++;
						totals.unpinned.upToDate++;
					} else if (status === 'outofdate' && pinned) {
						info.outOfDate = true;
						totals.outOfDate++;
						totals.pinned.outOfDate++;
					} else if (status === 'outofdate' && !pinned) {
						info.outOfDate = true;
						totals.outOfDate++;
						totals.unpinned.outOfDate++;
					}

					return info;
				});

				// Figure out the overall status for this manifest
				var status = 'uptodate';

				if (depList.length && totals.unpinned.outOfDate) {

					if (totals.unpinned.outOfDate / depList.length > 0.25) {
						status = 'outofdate';
					} else {
						status = 'notsouptodate';
					}
				}

				cb(null, {status: status, deps: depList, totals: totals});
			});
		});
	});
};
