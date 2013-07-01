var rewire = require('rewire');
var feed = rewire('../feed');

module.exports = {
	
	tearDown: function(callback) {
		feed.__set__('npm', require('npm'));
		callback();
	},
	
	'Test get feed for dependency with no "time" information': function(test) {
		
		var pkgName = 'sprintf';
		
		// Create a mock NPM
		var mockNpm = {
			load: function(opts, callback) {
				process.nextTick(callback);
			},
			commands: {
				view: function(args, silent, callback) {
					
					process.nextTick(function() {
						
						if(args[0] == pkgName) {
							
							// Simulate NPM response for no time information
							if(args[1] == 'time') {
								callback(null, {});
								return;
							}
							
							if(args[1] == 'version') {
								callback(null, {'0.2.1': {version: '0.2.1'}});
								return;
							}
						}
						
						callback(new Error('Unexpected arguments to mock NPM view command ' + args));
					});
				}
			}
		};
		
		feed.__set__('npm', mockNpm);
		
		var manifest = {
			name: 'Test',
			dependencies: {
				'sprintf': '~0.1.1'
			}
		};
		
		test.expect(2);
		
		feed.get(manifest, function(err, xml) {
			
			test.ifError(err);
			
			// If no time information was present then the feed should have defaulted to the unix epoch as the publish
			// date for the latest version of the module (RSS module formats as GMT string for some reason)
			test.ok(xml.indexOf('<pubDate>Thu, 01 Jan 1970 00:00:00 GMT</pubDate>') != -1);
			
			test.done();
		});
	}
};