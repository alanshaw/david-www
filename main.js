var express = require('express');
var consolidate = require('consolidate');
var stats = require('./stats');
var manifest = require('./manifest');
var statics = require('./statics');
var brains = require('./brains');
var errors = require('./errors');
var graph = require('./graph');
var feed = require('./feed');


var app = express();

app.engine('html', consolidate.handlebars);
app.set('view engine', 'html');
app.set('views', __dirname + '/dist');

statics.init(app);

app.get('/:user/:repo/dev-info.json',  devInfo);
app.get('/:user/:repo/graph.json',     dependencyGraph);
app.get('/:user/:repo/dev-graph.json', devDependencyGraph);
app.get('/:user/:repo/rss.xml',        rssFeed);
app.get('/:user/:repo/dev-rss.xml',    devRssFeed);
app.get('/:user/:repo/status.png',     statusBadge);
app.get('/:user/:repo.png',            statusBadge);
app.get('/:user/:repo',                statusPage);
app.get('/dependency-counts.json',     dependencyCounts);
app.get('/stats',                      statsPage);
app.get('/',                           indexPage);

/**
 * Do a home page
 */
function indexPage(req, res) {
	res.render('index', {
		recentlyRetrievedManifests: stats.getRecentlyRetrievedManifests(),
		recentlyUpdatedPackages: stats.getRecentlyUpdatedPackages()
	});
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

function dependencyCounts(req, res) {
	res.json(stats.getDependencyCounts());
}

/**
 * Send the status badge for this user and repository
 */
function statusPage(req, res) {

	withManifestAndInfo(req, res, function(manifest, info) {

		res.render('status', {
			user: req.params.user,
			repo: req.params.repo,
			manifest: manifest,
			info: info
		});

	});
}

/**
 * Send the status badge for this user and repository
 */
function statusBadge(req, res) {

	withManifestAndInfo(req, res, function(manifest, info) {

		res.setHeader('Cache-Control', 'no-cache');

		var totalDeps = info.deps.length;

		if(totalDeps && info.totals.unpinned.outOfDate) {

			if(info.totals.unpinned.outOfDate / totalDeps > 0.25) {
				res.sendfile('dist/img/outofdate.png');
			} else {
				res.sendfile('dist/img/notsouptodate.png');
			}

		} else {
			res.sendfile('dist/img/uptodate.png');
		}
	});
}

function dependencyGraph(req, res) {
	
	var url = manifest.getGithubManifestUrl(req.params.user, req.params.repo);
	
	manifest.getManifest(url, function(err, manifest) {

		if(errors.happened(err, req, res, 'Failed to get package.json')) {
			return;
		}
		
		graph.getProjectDependencyGraph(req.params.user + '/' + req.params.repo, manifest.version, manifest.dependencies || {}, function(err, graph) {
			
			if(errors.happened(err, req, res, 'Failed to get graph data')) {
				return;
			}
			
			res.json(graph);
		});
	});
}

function devDependencyGraph(req, res) {
	
	var url = manifest.getGithubManifestUrl(req.params.user, req.params.repo);
	
	manifest.getManifest(url, function(err, manifest) {

		if(errors.happened(err, req, res, 'Failed to get package.json')) {
			return;
		}
		
		graph.getProjectDependencyGraph(req.params.user + '/' + req.params.repo + '#dev', manifest.version, manifest.devDependencies || {}, function(err, graph) {
			
			if(errors.happened(err, req, res, 'Failed to get graph data')) {
				return;
			}
			
			res.json(graph);
		});
	});
}

function rssFeed(req, res, dev) {
	
	var url = manifest.getGithubManifestUrl(req.params.user, req.params.repo);
	
	manifest.getManifest(url, function(err, manifest) {
		
		if(errors.happened(err, req, res, 'Failed to get package.json')) {
			return;
		}
		
		feed.get(manifest, {dev: dev}, function(err, xml) {
			
			if(errors.happened(err, req, res, 'Failed to build RSS XML')) {
				return;
			}
			
			res.contentType('application/rss+xml');
			res.send(xml, 200);
		});
	});
}

function devRssFeed(req, res) {
	rssFeed(req, res, true);
}

function devInfo(req, res) {
	withManifestAndInfo(req, res, {dev: true}, function(manifest, info) {
		res.json(info);
	});
}

/**
 * Common callback boilerplate of getting a manifest and info for the status page and badge
 */
function withManifestAndInfo(req, res, options, callback) {
	
	// Allow callback to be passed as third parameter
	if(!callback) {
		callback = options;
		options = {};
	} else {
		options = options || {};
	}
	
	var url = manifest.getGithubManifestUrl(req.params.user, req.params.repo);

	manifest.getManifest(url, function(err, manifest) {

		if(errors.happened(err, req, res, 'Failed to get package.json')) {
			return;
		}

		brains.getInfo(manifest, options, function(err, info) {

			if(errors.happened(err, req, res, 'Failed to get dependency info')) {
				return;
			}

			callback(manifest, info);
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