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

david.on('dependencyVersionChange', function(dep, previous) {
	
	if(previous) {
		
		recentlyUpdatedPackages.unshift(new UpdatedPackage(dep.name, dep.version, previous));
		
		if(recentlyUpdatedPackages.length > 10) {
			recentlyUpdatedPackages.pop();
		}
	}
});

exports.getRecentlyUpdatedPackages = function() {
	return recentlyUpdatedPackages.slice();
};

// Recently retrieved manifests ///////////////////////////////////////////////

function RetrievedManifest(manifest, url) {
	this.manifest = manifest;
	this.url = url;
}

var recentlyRetrievedManifests = [];

manifest.on('retrieve', function(manifest, url) {
	
	var inList = false;
	
	for(var i = 0; i < recentlyRetrievedManifests.length; ++i) {
		
		if(recentlyRetrievedManifests[i].url == url) {
			recentlyRetrievedManifests.splice(i, 1);
			inList = true;
			break;
		}
	}
	
	recentlyRetrievedManifests.unshift(new RetrievedManifest(manifest, url));
	
	if(!inList && recentlyRetrievedManifests.length > 10) {
		recentlyRetrievedManifests.pop();
	}
});

exports.getRecentlyRetrievedManifests = function() {
	return recentlyRetrievedManifests.slice();
};

// Recently updated manifests /////////////////////////////////////////////////

function UpdatedManifest(diffs, manifest, url) {
	this.diffs = diffs;
	this.manifest = manifest;
	this.url = url;
}

var recentlyUpdatedManifests = [];

manifest.on('dependenciesChange', function(diffs, manifest, url) {
	
	recentlyUpdatedManifests.unshift(new UpdatedManifest(diffs, manifest, url));
	
	if(recentlyUpdatedManifests.length > 10) {
		recentlyUpdatedManifests.pop();
	}
});

exports.getRecentlyUpdatedManifests = function() {
	return recentlyUpdatedManifests.slice();
};

module.exports = exports;