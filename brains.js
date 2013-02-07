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
	
	if(range && range.indexOf('>=') == 0) {
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
					totalUpToDate = 0,
					totalOutOfDate = 0,
					totalPinned = 0;
				
				var depList = depNames.map(function(depName) {
					
					// Lets disprove this
					var status = 'uptodate';
					var pinned = isPinned(deps[depName].required);
					
					// If a dependency isn't pinned, then it might be out of date
					if(!pinned) {
						
						// If there is an updated STABLE dependency then this dep is out of date
						// TODO: Remove secondary check when https://github.com/alanshaw/david/issues/8 is fixed
						if(updatedStableDeps[depName] && updatedDeps[depName]) {
							
							status = 'outofdate';
							
						// If it is in the UNSTABLE list, and has no stable version then consider out of date
						} else if(updatedDeps[depName] && !updatedDeps[depName].stable) {
							
							status = 'outofdate';
						}
						
					} else {
						status = 'pinned';
						totalPinned++;
					}
					
					if(status == 'uptodate') {
						totalUpToDate++;
					} else if(status == 'outofdate') {
						totalOutOfDate++;
					}
					
					return {
						name: depName,
						required: deps[depName].required,
						stable: deps[depName].stable,
						latest: deps[depName].latest,
						status: status
					};
				});
				
				callback(null, {
					deps: depList,
					totalUpToDate: totalUpToDate,
					totalOutOfDate: totalOutOfDate,
					totalPinned: totalPinned
				});
			});
		});
	});
};