var express = require('express');
var consolidate = require('consolidate');
var stats = require('./stats');
var manifest = require('./manifest');
var statics = require('./statics');
var brains = require('./brains');

var app = express();

app.configure(function() {
	app.engine('html', consolidate.handlebars);
	app.set('view engine', 'html');
	app.set('views', __dirname + '/dist');
});

statics.init(app);

app.get('/:user/:repo/status.png', statusBadge);
app.get('/:user/:repo.png',        statusBadge);
app.get('/:user/:repo',            statusPage);
app.get('/stats',                  statsPage);
app.get('/',                       indexPage);

/**
 * Do a home page
 */
function indexPage(req, res) {

	res.render('index');
}

/**
 * Show pretty graphs and gaudy baubles
 */
function statsPage(req, res) {

	res.render('stats', {
		recentlyUpdatedPackages: stats.getRecentlyUpdatedPackages(),
		recentlyRetrievedManifests: stats.getRecentlyRetrievedManifests(),
		recentlyUpdatedManifests: stats.getRecentlyUpdatedManifests()
	});
}

/**
 * Send the status badge for this user and repository
 */
function statusBadge(req, res) {

	var url = manifest.getGithubManifestUrl(req.params.user, req.params.repo);
	
	manifest.getManifest(url, function(err, manifest) {
		
		if(err) {
			console.log('Failed to get manifest', err);
			res.status(500).render(500, {err: 'Failed to get package.json'});
			return;
		}
		
		brains.getInfo(manifest, function(err, info) {
			
			if(err) {
				console.log('Failed to get dependency info', err);
				res.status(500).render(500, {err: 'Failed to get dependency info'});
				return;
			}
			
			res.setHeader('Cache-Control', 'no-cache');
			
			var totalDeps = info.deps.length;
			
			if(totalDeps && info.totalOutOfDate) {
				
				if(info.totalOutOfDate / totalDeps > 0.25) {
					res.sendfile('dist/img/outofdate.png');
				} else {
					res.sendfile('dist/img/notsouptodate.png');
				}
				
			} else {
				res.sendfile('dist/img/uptodate.png');
			}
		});
	});
}

/**
 * Display the status page for this user and repository
 */
function statusPage(req, res) {

	var url = manifest.getGithubManifestUrl(req.params.user, req.params.repo);

	manifest.getManifest(url, function(err, manifest) {

		if(err) {
			console.log('Failed to get manifest', err);
			res.status(500).render(500, {err: 'Failed to get package.json'});
			return;
		}
		
		brains.getInfo(manifest, function(err, info) {
			
			if(err) {
				console.log('Failed to get dependency info', err);
				res.status(500).render(500, {err: 'Failed to get dependency info'});
				return;
			}
			
			res.render('status', {
				user: req.params.user,
				repo: req.params.repo,
				manifest: manifest,
				info: info
			});
		});
	});
}

app.use(function(req, res, next){
	res.status(404);
	
	// respond with html page
	if (req.accepts('html')) {
		res.render('404');
		return;
	}
	
	// respond with json
	if (req.accepts('json')) {
		res.send({err: 'Not found'});
		return;
	}
	
	// default to plain-text. send()
	res.type('txt').send('Not found');
});

if(!process.argv[2]) {
	console.log('No port specified');
	return;
}

app.listen(process.argv[2]);

console.log('David listening on port', process.argv[2]);