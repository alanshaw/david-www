/**
 * Information about what the website considers to be an out of date or up to date dependency
 */

var david = require('david');
var semver = require('semver');

function isPinned(version) {
	
	if(version == '*' || version == 'latest') {
		return false;
	}
	
	var range = semver.validRange(version);
	
	if(range && range.indexOf('>=') === 0) {
		return false;
	}
	
	return true;
}

module.exports.getInfo = function(manifest, callback) {
	
	david.getDependencies(manifest, function(err, deps) {
		
		if(err) {
			callback(err);
			return;
		}
		
		// Get ALL updated dependencies including unstable
		david.getUpdatedDependencies(manifest, false, function(err, updatedDeps) {
			
			if(err) {
				callback(err);
				return;
			}
			
			// Get STABLE updated dependencies
			david.getUpdatedDependencies(manifest, true, function(err, updatedStableDeps) {
				
				if(err) {
					callback(err);
					return;
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
				
				var depList = depNames.map(function(depName) {
					
					// Lets disprove this
					var status = 'uptodate';
					
					// If there is an updated STABLE dependency then this dep is out of date
					if(updatedStableDeps[depName]) {
						status = 'outofdate';
					// If it is in the UNSTABLE list, and has no stable version then consider out of date
					} else if(updatedDeps[depName] && !updatedDeps[depName].stable) {
						status = 'outofdate';
					}
					
					var pinned = isPinned(deps[depName].required);
					
					if(status == 'uptodate' && pinned) {
						totals.upToDate++;
						totals.pinned.upToDate++;
					} else if(status == 'uptodate' && !pinned) {
						totals.upToDate++;
						totals.unpinned.upToDate++;
					} else if(status == 'outofdate' && pinned) {
						totals.outOfDate++;
						totals.pinned.outOfDate++;
					} else if(status == 'outofdate' && !pinned) {
						totals.outOfDate++;
						totals.unpinned.outOfDate++;
					}
					
					return {
						name: depName,
						required: deps[depName].required,
						stable: deps[depName].stable,
						latest: deps[depName].latest,
						status: status,
						pinned: pinned
					};
				});
				
				callback(null, {deps: depList, totals: totals});
			});
		});
	});
};