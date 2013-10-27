var npm = require('npm');
var moment = require('moment');
var RSS = require('rss');
var semver = require('semver');

function Package(name, versions, repo) {
	this.name = name; // The name of the package
	this.versions = versions; // Versions and their pubdate as returned by NPM
	this.repo = repo; // Repository data
	this.expires = moment().add(Package.TTL); // When the versions information is considered stale
}

Package.TTL = moment.duration({hours: 1});

var packages = {};

function FeedItem(name, previous, current, pubdate, repoUrl) {
	this.name = name;
	this.previous = previous;
	this.current = current;
	this.pubdate = pubdate;
	this.repoUrl = repoUrl;
}

function getRepoUrl(data) {
	if (!data) {
		return data;
	}

	var url = Object.prototype.toString.call(data) === '[object String]' ? data : data.url;

	if (url && url.indexOf('github.com') !== -1) {
		return url.replace('github.com:', 'github.com/').replace('git:', 'https:').replace('.git', '');
	}

	return null;
}

// Create a bunch of Feed items from the passed package
function packageToFeedItems(pkg) {

	var previous = null;

	return Object.keys(pkg.versions).map(function(version) {

		var item = new FeedItem(pkg.name, previous, version, pkg.versions[version], getRepoUrl(pkg.repo));

		previous = version;

		return item;
	});
}

// Create the feed XML from the FeedItems
function buildFeedXml(items, name, deps, limit) {

	limit = limit || 32;
	deps = deps || {};

	items = items.reduce(function(items, item) {
		// Only add item to feed for valid, non-reckless dependency versions
		if (semver.validRange(deps[item.name], true) && deps[item.name] !== 'latest' && deps[item.name] !== '*' && semver.gtr(item.current, deps[item.name], true)) {
			items.push(item);
		}
		return items;
	}, []);

	items.sort(function(a, b) {
		if (a.pubdate < b.pubdate) {
			return 1;
		} else if (a.pubdate === b.pubdate) {
			return 0;
		} else {
			return -1;
		}
	});

	items = items.slice(0, limit);

	var rssFeed = new RSS({
		title: name + ' out of date dependencies',
		description: 'Version updates for ' + Object.keys(deps).join(', '),
		site_url: 'https://david-dm.org/'
	});

	for (var i = 0, len = items.length; i < len; ++i) {
		rssFeed.item({
			title: items[i].name + ' ' + items[i].previous + ' to ' + items[i].current + ' (' + deps[items[i].name] + ' required)',
			description: items[i].repoUrl ? '<a href="' + items[i].repoUrl + '">' + items[i].repoUrl + '</a>' : null,
			url: 'https://npmjs.org/package/' + items[i].name,
			date: items[i].pubdate
		});
	}

	return rssFeed.xml();
}

/**
 * Get a Package for a given package name guaranteed to be less old than Package.TTL
 *
 * Must be executed in `npm.load()` callback.
 *
 * @param pkgName
 * @param callback
 */
function getPackage(pkgName, callback) {

	var pkg = packages[pkgName];

	if (pkg && pkg.expires > new Date()) {
		callback(null, pkg);
		return;
	}

	npm.commands.view([pkgName, 'time', 'repository'], true, function(err, data) {

		if (err) {
			callback(err);
			return;
		}

		var keys = Object.keys(data);
		var time = keys.length ? data[keys[0]].time : null;
		var repository = keys.length ? data[keys[0]].repository : null;

		if (time) {

			pkg = packages[pkgName] = new Package(pkgName, time, repository);

			callback(null, pkg);

		} else {

			console.warn(pkgName + ' has no time information');

			// We don't know the date/time any of the versions for this package were published
			// Get latest and use unix epoch as publish date
			npm.commands.view([pkgName, 'version'], true, function(err, data) {

				if (err) {
					callback(err);
					return;
				}

				var keys = Object.keys(data);

				// `npm view 0 version` returns {} - ensure some data was returned
				if (!keys.length) {
					callback(new Error('Failed to get package for ' + pkgName));
					return;
				}

				time = {};

				time[keys[0]] = moment.utc([1970]).toDate();

				pkg = packages[pkgName] = new Package(pkgName, time, repository);

				callback(null, pkg);
			});
		}
	});
}

module.exports.get = function(manifest, options, callback) {

	// Allow callback to be passed as second parameter
	if (!callback) {
		callback = options;
		options = {};
	} else {
		options = options || {};
	}

	// Assume we're probably going to have to use NPM
	npm.load({}, function(err) {

		if (err) {
			callback(err);
			return;
		}

		var items = [];
		var deps = options.dev ? manifest.devDependencies : manifest.dependencies;
		var depNames = Object.keys(deps || {});
		var processedDeps = 0;

		if (!depNames.length) {
			callback(null, buildFeedXml([], manifest.name, deps, options.limit));
			return;
		}

		depNames.forEach(function(depName) {

			getPackage(depName, function(err, pkg) {

				if (err) {
					console.error(err);
				} else {
					items = items.concat(packageToFeedItems(pkg));
				}

				processedDeps++;

				if (processedDeps === depNames.length) {
					callback(null, buildFeedXml(items, manifest.name, deps, options.limit));
				}
			});
		});
	});
};
