var npm = require('npm');
var moment = require('moment');

function Package(name, versions) {
	this.name = name; // The name of the package
	this.versions = versions; // Versions and their pubdate as returned by NPM
	this.expires = moment().add(Package.TTL); // When the versions information is considered stale
}

Package.TTL = moment.duration({hours: 1});

var packages = {};

function RssItem(name, previous, current, pubdate) {
	this.name = name;
	this.previous = previous;
	this.current = current;
	this.pubdate = pubdate;
}

// Create a bunch of RSS items from the passed package
function packageToRssItems(pkg) {
	
	var previous = null;
	
	return Object.keys(pkg.versions).map(function(version) {
		
		var item = new RssItem(pkg.name, previous, version, pkg.versions[version]);
		
		previous = version;
		
		return item;
	});
}

// Create the feed XML from the RssItems
function buildFeedXml(items, limit) {
	
	limit = limit || 32;
	
	items.sort(function(a, b) {
		if(a.expires < b.expires) {
			return 1;
		} else if(a.expires === b.expires) {
			return 0;
		} else {
			return -1;
		}
	});
	
	items = items.slice(0, limit);
	
	var xml = '';
	
	for(var i = 0, len = items.length; i < len; ++i) {
		xml += '<item><name>' + items[i].name + '</name><pubdate>' + items[i].pubdate + '</pubdate></item>';
	}
	
	return xml;
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
		
		pkg = packages[pkgName] = new Package(pkgName, data);
		
		callback(null, pkg);
	});
}

module.exports.getFeed = function(deps, limit, callback) {
	
	// Assume we're probably going to have to use NPM
	npm.load({}, function(err) {
		
		if(err) {
			callback(err);
			return;
		}
		
		var items = [];
		var depNames = Object.keys(deps);
		var processedDeps = 0;
		
		depNames.forEach(function(depName) {
			
			getPackage(depName, function(err, pkg) {
				
				if(err) {
					callback(err);
					return;
				}
				
				items = items.concat(packageToRssItems(pkg));
				
				processedDeps++;
				
				if(processedDeps == depNames.length) {
					callback(null, buildFeedXml(items, limit));
				}
			});
		});
		
		
	});
};