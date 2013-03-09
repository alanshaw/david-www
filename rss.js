var david = require('david');
var MongoClient = require('mongodb').MongoClient;

MongoClient.connect("mongodb://localhost:27017/exampleDb", function(err, db) {
  if(!err) {
    console.log("We are connected");
  }
});

module.exports.getFeed = function(dependencies, limit) {
	
}

// Start listening for version changes
david.on('latestVersionChange', function(name, fromVersion, toVersion) {
	// Save to DB
});