var request = require('request');
var moment = require('moment');

var exports = {};

function Manifest(data) {
	this.data = data;
	this.expires = moment().add(Manifest.TTL);
}

Manifest.TTL = moment.duration({hours: 1});

var manifests = {};

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
				
				manifest = new Manifest(data);
				
				manifests[url] = manifest;
				
				callback(null, manifest.data);
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