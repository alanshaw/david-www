var npm = require('npm');
var stats = require('./stats');

/**
 * @param {Array|String} keywords
 * @param callback
 */
module.exports = function(keywords, callback) {
	
	if(!keywords) {
		callback(null, {});
		return;
	}
	
	if(Object.prototype.toString.call(keywords) == '[object String]') {
		keywords = [keywords];
	} else if(!keywords.length) {
		callback(null, {});
		return;
	}
	
	npm.load({}, function(err) {
		
		if(err) {
			callback(err);
			return;
		}
		
		npm.commands.search(keywords, true, function(err, data) {
			
			if(err) {
				callback(err);
				return;
			}
			
			var counts = stats.getDependencyCounts();
			var results = {};
			
			Object.keys(data).forEach(function(name) {
				results[name] = {};
				results[name].latest = data[name].version;
				results[name].description = data[name].description;
				results[name].maintainers = data[name].maintainers;
				results[name].time = data[name].time;
				results[name].count = counts[name] || 0;
			});
			
			callback(null, results);
		});
	});
};