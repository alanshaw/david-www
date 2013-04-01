var npm = require('npm');
var moment = require('moment');
var RSS = require('rss');

function Package(name, versions) {
	this.name = name; // The name of the package
	this.versions = versions; // Versions and their pubdate as returned by NPM
	this.expires = moment().add(Package.TTL); // When the versions information is considered stale
}

Package.TTL = moment.duration({hours: 1});

var packages = {};

function FeedItem(name, previous, current, pubdate) {
	this.name = name;
	this.previous = previous;
	this.current = current;
	this.pubdate = pubdate;
}

// Create a bunch of Feed items from the passed package
function packageToFeedItems(pkg) {
	
	var previous = null;
	
	return Object.keys(pkg.versions).map(function(version) {
		
		var item = new FeedItem(pkg.name, previous, version, pkg.versions[version]);
		
		previous = version;
		
		return item;
	});
}

// Create the feed XML from the FeedItems
function buildFeedXml(items, name, depNames, limit) {
	
	limit = limit || 32;
	
	items.sort(function(a, b) {
		if(a.pubdate < b.pubdate) {
			return 1;
		} else if(a.pubdate === b.pubdate) {
			return 0;
		} else {
			return -1;
		}
	});
	
	items = items.slice(0, limit);
	
	var rssFeed = new RSS({
		title: 'Recently updated dependencies for ' + name,
		description: 'Version updates for ' + depNames.join(', '),
		site_url: 'https://david-dm.org/'
	});
	
	for(var i = 0, len = items.length; i < len; ++i) {
		rssFeed.item({
			title: items[i].name,
			description: items[i].previous + ' to ' + items[i].current,
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
	
	if(pkg && pkg.expires > new Date()) {
		callback(null, pkg);
		return;
	}
	
	npm.commands.view([pkgName, 'time'], true, function(err, data) {
		
		if(err) {
			callback(err);
			return;
		}
		
		pkg = packages[pkgName] = new Package(pkgName, data[Object.keys(data)[0]].time);
		
		callback(null, pkg);
	});
}

module.exports.get = function(manifest, options, callback) {
	
	// Allow callback to be passed as second parameter
	if(!callback) {
		callback = options;
		options = {};
	} else {
		options = options || {};
	}
	
	// Assume we're probably going to have to use NPM
	npm.load({}, function(err) {
		
		if(err) {
			callback(err);
			return;
		}
		
		var items = [];
		var deps = options.dev ? manifest.devDependencies : manifest.dependencies;
		var depNames = Object.keys(deps || {});
		var processedDeps = 0;
		
		if(!depNames.length) {
			callback(null, buildFeedXml([], manifest.name, depNames, options.limit));
			return;
		}
		
		depNames.forEach(function(depName) {
			
			getPackage(depName, function(err, pkg) {
				
				if(err) {
					callback(err);
					return;
				}
				
				items = items.concat(packageToFeedItems(pkg));
				
				processedDeps++;
				
				if(processedDeps == depNames.length) {
					callback(null, buildFeedXml(items, manifest.name, depNames, options.limit));
				}
			});
		});
	});
};