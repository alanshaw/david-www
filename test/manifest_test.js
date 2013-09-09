var rewire = require('rewire');
var manifest = rewire('../manifest');
var moment = require('moment');

module.exports = {
	'Dependency version change to empty string is not a removal': function (test) {

		var user = 'test-user';
		var repo = 'test-repo';

		// The dependency whose version will change from depVer to ""
		var depName = 'test-dep';
		var depVer = '1.3.8';

		var mockManifests = {};

		mockManifests[user] = {};
		mockManifests[user][repo] = {
			data: {
				name: repo,
				version: '1.0.0',
				dependencies: {}
			},
			expires: moment().subtract({days: 1})
		};

		mockManifests[user][repo].data.dependencies[depName] = depVer;

		// Add the expired manifest to the manifest module's internal cache
		manifest.__set__('manifests', mockManifests);

		// Mock github to return a new package.json file with updated dependencies
		var mockGithub = {
			repos: {
				getContent: function (opts, cb) {

					var data = {
						name: repo,
						version: '1.0.0',
						dependencies: {}
					};

					// Simulate version change from depVer to ""
					data.dependencies[depName] = '';

					cb(null, {content: JSON.stringify(data), encoding: 'utf-8'});
				}
			}
		};

		manifest.__set__('github', mockGithub);

		manifest.on('dependenciesChange', function(diffs) {

			diffs.forEach(function(diff) {
				test.notStrictEqual(null, diff.version);
				test.equal(depVer, diff.previous);
			});

			test.done();
		});

		manifest.getManifest(user, repo, function () {});

		test.expect(2);
	}
};
