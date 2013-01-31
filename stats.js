var david = require('david');

var exports = {};

function UpdatedPackage(name, version, previous) {
	this.name = name;
	this.version = version;
	this.previous = previous;
}

var recentlyUpdated = [];

david.on('dependencyVersionChange', function(dep, previous) {
	
	recentlyUpdated.unshift(new UpdatedPackage(dep.name, dep.version, previous));
	
	if(recentlyUpdated.length > 10) {
		recentlyUpdated.pop();
	}
});

exports.getRecentlyUpdatedPackages = function() {
	return recentlyUpdated.slice();
};

module.exports = exports;