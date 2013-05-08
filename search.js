var npm = require('npm');
var stats = require('./stats');

function Query(keywords, callback) {
	this.keywords = keywords;
	this.callback = callback;
}

var queryQueue = [];
var processingQueue = false;

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
		keywords = keywords.split(/\s+/);
	} else if(!keywords.length) {
		callback(null, {});
		return;
	}
	
	queryQueue.push(new Query(keywords, callback));
	
	processQueue();
};

function processQueue() {
	
	if(processingQueue || !queryQueue.length) {
		return;
	}
	
	processingQueue = true;
	
	var query = queryQueue.shift(),
		keywords = query.keywords,
		callback = query.callback;
	
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
			
			setImmediate(function() {
				callback(null, results);
			});
			
			processingQueue = false;
			
			processQueue();
		});
	});
}