var express = require('express');
var consolidate = require('consolidate');
var david = require('david');
var manifest = require('./manifest');

var app = express();

app.configure(function() {
	app.engine('html', consolidate.handlebars);
	app.set('view engine', 'html');
	app.set('views', __dirname + '/dist');
});

app.use("/js", express.static(__dirname + '/dist/js'));
app.use("/css", express.static(__dirname + '/dist/css'));
app.use("/img", express.static(__dirname + '/dist/img'));
app.use("/font", express.static(__dirname + '/dist/font'));

app.get('/', function(req, res) {
	res.render('index');
});

/**
 * Display the status page for this user and repository
 */
app.get('/:user/:repo', function(req, res) {
	
	var url = manifest.getGithubManifestUrl(req.params.user, req.params.repo);
	
	manifest.getManifest(url, function(err, manifest) {
		
		if(err) {
			console.log('Failed to get manifest', err);
			res.json(500, {err: 'Failed to get package.json'});
			return;
		}
		
		david.getDependencies(manifest, function(err, deps) {
			
			if(err) {
				console.log('Failed to get dependencies', err);
				res.json(500, {err: 'Failed to get dependencies'});
				return;
			}
			
			david.getUpdatedDependencies(manifest, function(err, updatedDeps) {
				
				if(err) {
					console.log('Failed to get updated dependencies', err);
					res.json(500, {err: 'Failed to get updated dependencies'});
					return;
				}
				
				manifest.dependencies = manifest.dependencies || {};
				
				var depNames = Object.keys(deps).sort();
				var updatedDepNames = Object.keys(updatedDeps);
				
				res.render('status', {
					user: req.params.user,
					repo: req.params.repo,
					manifest: manifest,
					deps: depNames.map(function(depName) {
						return {
							name: depName,
							version: manifest.dependencies[depName],
							latest: deps[depName],
							upToDate: !updatedDeps[depName]
						}
					}),
					hasDeps: !!depNames.length,
					hasUpToDateDeps: !updatedDepNames.length,
					totalDeps: depNames.length,
					totalUpToDateDeps: depNames.length - updatedDepNames.length,
					totalOutOfDateDeps: updatedDepNames.length
				});
			});
		});
	});
});

app.get('/:user/:repo/status.png', function(req, res) {
	
	var url = manifest.getGithubManifestUrl(req.params.user, req.params.repo);
	
	manifest.getManifest(url, function(err, manifest) {
		
		if(err) {
			console.log('Failed to get manifest', err);
			res.json(500, {err: 'Failed to get package.json'});
			return;
		}
		
		david.getUpdatedDependencies(manifest, function(err, deps) {
			
			if(err) {
				console.log('Failed to get updated dependencies', err);
				res.json(500, {err: 'Failed to get updated dependencies'});
				return;
			}
			
			res.setHeader('Cache-Control', 'no-cache');
			
			if(Object.keys(manifest.dependencies || {}).length && Object.keys(deps).length) {
				res.sendfile('dist/img/outofdate.png');
			} else {
				res.sendfile('dist/img/uptodate.png');
			}
		});
	});
});

/**
 * Get updated dependencies for the GitHub :repo owned by :user 
 */
app.get('/:user/:repo/deps/updated', function(req, res) {
	
	var url = manifest.getGithubManifestUrl(req.params.user, req.params.repo);
	
	manifest.getManifest(url, function(err, manifest) {
		
		if(err) {
			console.log('Failed to get manifest', err);
			res.json(500, {err: 'Failed to get package.json'});
			return;
		}
		
		david.getUpdatedDependencies(manifest, function(err, deps) {
			
			if(err) {
				console.log('Failed to get updated dependencies', err);
				res.json(500, {err: 'Failed to get updated dependencies'});
				return;
			}
			
			res.json(deps);
		});
	});
});

/**
 * Get all dependencies for GitHub :repo owned by :user 
 */
app.get('/:user/:repo/deps', function(req, res) {
	
	var url = manifest.getGithubManifestUrl(req.params.user, req.params.repo);
	
	manifest.getManifest(url, function(err, manifest) {
		
		if(err) {
			console.log('Failed to get manifest', err);
			res.json(500, {err: 'Failed to get package.json'});
			return;
		}
		
		res.json(manifest.dependencies);
	});
});

if(!process.argv[2]) {
	console.log('No port specified');
	return;
}

app.listen(process.argv[2]);

console.log('David listening on port', process.argv[2]);