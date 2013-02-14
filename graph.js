var npm = require('npm');
var moment = require('moment');
var semver = require('semver');

function Package(name, version) {
	this.name = name;
	this.version = version;
	this.deps = {};
	this.expires = moment().add(Package.TTL);
}

Package.TTL = moment.duration({days: 1});

Package.prototype.toJSON = function() {
	return {
		name: this.name,
		version: this.version,
		deps: this.deps
	};
}

var dependencies = {};

/**
 * Get the dependency graph for a given NPM dependency name and version.
 * 
 * Must be executed in ```npm.load()``` callback.
 * 
 * @param depName Package name
 * @param version
 * @param callback
 */
function getDependencyGraph(depName, version, callback) {
	
	process.nextTick(function() {
		
		dependencies[depName] = dependencies[depName] || {};
		
		var dep = dependencies[depName][version];
		
		if(dep) {
			
			if(dep.expires > new Date()) {
				callback(null, dep);
				return;
			}
			
			dep.deps = {};
			dep.expires = moment().add(Package.TTL);
			
		} else {
			dep = dependencies[depName][version] = new Package(depName, version);
		}
		
		npm.commands.view([depName + '@' + version, 'dependencies'], function(err, data) {
			
			if(err) {
				callback(err);
				return;
			}
			
			console.log('data is', data);
			
			var depDeps = data[version] ? data[version].dependencies ? data[version].dependencies : {} : {},
				depDepNames = depDeps ? Object.keys(depDeps) : [];
			
			// No dependencies?
			if(depDepNames == 0) {
				callback(null, dep);
				return;
			}
			
			var got = 0;
			
			depDepNames.forEach(function(depDepName) {
				
				latestSatisfying(depDepName, depDeps[depDepName], function(err, depDepVersion) {
					
					if(err) {
						callback(err);
						return;
					}
					
					getDependencyGraph(depDepName, depDepVersion, function(err, depDep) {
						
						if(err) {
							callback(err);
							return;
						}
						
						dep.deps[depDepName] = depDep;
						
						got++;
						
						if(got == depDepNames.length) {
							dependencies[depDepName][depDepVersion] = dep;
							callback(null, dep);
						}
					});
					
				}); // npm
			});
		});
	});
}

module.exports.getDependencyGraph = getDependencyGraph;

/**
 * Get the latest version for the passed dependency name that satisfies the passed range.
 * 
 * Must be executed in ```npm.load()``` callback.
 * 
 * @param depName
 * @param range
 * @param callback
 */
function latestSatisfying(depName, range, callback) {
	
	npm.commands.view([depName, 'versions'], function(err, data) {
		
		if(err) {
			callback(err);
			return;
		}
		
		// Get the most recent version that satisfies the range
		var version = semver.maxSatisfying(data[Object.keys(data)[0]].versions, range);
		
		// There should be a version that satisfies!
		if(!version) {
			callback(new Error('No versions for ' + depName + ' match range ' + range));
			return;
		}
		
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
 * @param callback
 */
module.exports.getProjectDependencyGraph = function(name, version, deps, callback) {
	
	projects[name] = projects[name] || {};
	
	var project = projects[name][version];
	
	if(project) {
		
		if(project.expires > new Date()) {
			console.log('Using cached project dependency graph', name, version);
			callback(null, JSON.parse(JSON.stringify(project)));
			return;
		}
		
		project.deps = {};
		project.expires = moment().add(Package.TTL);
		
	} else {
		project = projects[name][version] = new Package(name, version);
	}
	
	npm.load({}, function(err) {
		
		if(err) {
			callback(err);
			return;
		}
		
		var depNames = Object.keys(deps),
			done = 0;
		
		depNames.forEach(function(depName) {
			
			latestSatisfying(depName, deps[depName], function(err, version) {
				
				if(err) {
					callback(err);
					return;
				}
				
				getDependencyGraph(depName, version, function(err, dep) {
					
					if(err) {
						callback(err);
						return;
					}
					
					project.deps[depName] = dep;
					
					done++;
					
					if(done == depNames.length) {
						callback(null, JSON.parse(JSON.stringify(project)));
					}
				});
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