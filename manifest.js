/**
 * Events:
 * dependenciesChange(differences, manifest, url) - When one or more dependencies for a manifest change
 * retrieve(manifest, url) - The first time a manifest is retrieved
 */

var events = require('events');
var request = require('request');
var moment = require('moment');

var exports = new events.EventEmitter();

function Manifest(data) {
	this.data = data;
	this.expires = moment().add(Manifest.TTL);
}

Manifest.TTL = moment.duration({hours: 1});

var manifests = {};

function PackageDiff(name, version, previous) {
	this.name = name;
	this.version = version;
	this.previous = previous;
}

function getDependencyDiffs(deps1, deps2) {
	
	deps1 = deps1 || {};
	deps2 = deps2 || {};
	
	var keys1 = Object.keys(deps1);
	var keys2 = Object.keys(deps2);
	
	var diffs = [];
	
	// Check for deletions and changes
	keys1.forEach(function(key) {
		
		if(!deps2[key]) {
			
			// Dep has been deleted
			diffs.push(new PackageDiff(key, null, deps1[key]));
			
		} else if(dep1[key] !== dep2[key]) {
			
			// Dep has been changed
			diffs.push(new PackageDiff(key, deps2[key], deps1[key]));
		}
	});
	
	// Check for additions
	keys2.forEach(function(key) {
		if(!deps1[key]) {
			diffs.push(new PackageDiff(key, deps2[key], null));
		}
	});
	
	return diffs;
}

exports.getManifest = function(url, callback) {
	
	var manifest = manifests[url];
	
	if(manifest && manifest.expires > new Date()) {
		console.log('Using cached manifest', manifest.data.name, manifest.data.version);
		callback(null, JSON.parse(JSON.stringify(manifest.data)));
		return;
	}
	
	request(url, function(err, response, body) {
		
		if(!err && response.statusCode == 200) {
			
			console.log('Successfully retrieved package.json');
			
			var data = JSON.parse(body);
			
			if(!data) {
				callback(new Error('Failed to parse package.json: ' + body));
			} else {
				
				console.log('Got manifest', data.name, data.version);
				
				var oldManifest = manifest;
				var oldDependencies = oldManifest ? oldManifest.data.dependencies : {};
				
				manifest = new Manifest(data);
				
				manifests[url] = manifest;
				
				callback(null, manifest.data);
				
				if(!oldManifest) {
					
					exports.emit('retrieve', JSON.parse(JSON.stringify(data)), url);
					
				} else {
					
					var diffs = getDependencyDiffs(oldDependencies, data.dependencies);
					
					if(diffs.length) {
						exports.emit('dependenciesChange', diffs, JSON.parse(JSON.stringify(data)), url);
					}
				}
			}
			
		} else if(!err) {
			
			callback(new Error(response.statusCode + ' Failed to retrieve manifest from ' + url));
			
		} else {
			
			callback(err);
		}
	});
};

exports.getGithubManifestUrl = function(username, repo) {
	return 'https://raw.github.com/' + username + '/' + repo + '/master/package.json';
};

/**
 * Set the TTL for cached manifests.
 * 
 * @param {moment.duration} duration Time period the manifests will be cahced for, expressed as a moment.duration.
 */
exports.setCacheDuration = function(duration) {
	Manifest.TTL = duration;
};

module.exports = exports;