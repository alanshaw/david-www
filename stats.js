var david = require('david');
var manifest = require('./manifest');

var exports = {};

// Recently updated packages //////////////////////////////////////////////////

function UpdatedPackage(name, version, previous) {
	this.name = name;
	this.version = version;
	this.previous = previous;
}

var recentlyUpdatedPackages = [];

david.on('latestVersionChange', function(name, fromVersion, toVersion) {
	
	if(fromVersion) {
		
		recentlyUpdatedPackages.unshift(new UpdatedPackage(name, toVersion, fromVersion));
		
		if(recentlyUpdatedPackages.length > 10) {
			recentlyUpdatedPackages.pop();
		}
	}
});

exports.getRecentlyUpdatedPackages = function() {
	return recentlyUpdatedPackages.slice();
};

// Recently retrieved manifests ///////////////////////////////////////////////

function RetrievedManifest(manifest, user, repo) {
	this.manifest = manifest;
	this.user = user;
	this.repo = repo;
}

var recentlyRetrievedManifests = [];

manifest.on('retrieve', function(manifest, user, repo) {
	
	var inList = false;
	
	for(var i = 0; i < recentlyRetrievedManifests.length; ++i) {
		
		if(recentlyRetrievedManifests[i].user == user && recentlyRetrievedManifests[i].repo == repo) {
			recentlyRetrievedManifests.splice(i, 1);
			inList = true;
			break;
		}
	}
	
	recentlyRetrievedManifests.unshift(new RetrievedManifest(manifest, user, repo));
	
	if(!inList && recentlyRetrievedManifests.length > 10) {
		recentlyRetrievedManifests.pop();
	}
});

exports.getRecentlyRetrievedManifests = function() {
	return recentlyRetrievedManifests.slice();
};

// Recently updated manifests /////////////////////////////////////////////////

function UpdatedManifest(diffs, manifest, user, repo) {
	this.diffs = diffs;
	this.manifest = manifest;
	this.user = user;
	this.repo = repo;
}

var recentlyUpdatedManifests = [];

manifest.on('dependenciesChange', function(diffs, manifest, user, repo) {
	
	recentlyUpdatedManifests.unshift(new UpdatedManifest(diffs, manifest, user, repo));
	
	if(recentlyUpdatedManifests.length > 10) {
		recentlyUpdatedManifests.pop();
	}
});

exports.getRecentlyUpdatedManifests = function() {
	return recentlyUpdatedManifests.slice();
};

// Dependency counts //////////////////////////////////////////////////////////

var dependencyCounts = {};

// When manifest first retrieved, +1 all the dependencies
manifest.on('retrieve', function(manifest) {
	
	var depNames = Object.keys(manifest.dependencies || {});
	
	depNames.forEach(function(depName) {
		dependencyCounts[depName] = dependencyCounts[depName] || 0;
		dependencyCounts[depName]++;
	});
});

// If the manifest dependencies change, +1 or -1 if dependencies are added or removed
manifest.on('dependenciesChange', function(diffs) {
	
	diffs.forEach(function(diff) {
		
		// Dependency added
		if(!diff.previous) {
			dependencyCounts[diff.name] = dependencyCounts[diff.name] || 0;
			dependencyCounts[diff.name]++;
		}
		
		// Dependency removed
		if(!diff.version) {
			dependencyCounts[diff.name]--;
		}
	});
});

exports.getDependencyCounts = function() {
	return JSON.parse(JSON.stringify(dependencyCounts));
};

module.exports = exports;