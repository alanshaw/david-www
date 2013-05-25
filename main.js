var express = require('express');
var consolidate = require('consolidate');
var stats = require('./stats');
var manifest = require('./manifest');
var statics = require('./statics');
var brains = require('./brains');
var errors = require('./errors');
var graph = require('./graph');
var feed = require('./feed');
var profile = require('./profile');
var newsFeed = require('./news-feed');
var search = require('./search');


var app = express();

app.engine('html', consolidate.handlebars);
app.set('view engine', 'html');
app.set('views', __dirname + '/dist');
app.use(express.compress());

statics.init(app);

app.get('/news/rss.xml',               newsRssFeed);
app.get('/dependency-counts.json',     dependencyCounts);
app.get('/stats',                      statsPage);
app.get('/search',                     searchPage);
app.get('/search.json',                searchQuery);
app.get('/:user/:repo/dev-info.json',  devInfo);
app.get('/:user/:repo/graph.json',     dependencyGraph);
app.get('/:user/:repo/dev-graph.json', devDependencyGraph);
app.get('/:user/:repo/rss.xml',        rssFeed);
app.get('/:user/:repo/dev-rss.xml',    devRssFeed);
app.get('/:user/:repo/status.png',     statusBadge);
app.get('/:user/:repo/dev-status.png', devStatusBadge);
app.get('/:user/:repo.png',            statusBadge);
app.get('/:user/:repo',                statusPage);
app.get('/:user',                      profilePage);
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

function newsRssFeed(req, res) {
	
	newsFeed.get(function(err, xml) {
		
		if(errors.happened(err, req, res, 'Failed to get news feed xml')) {
			return;
		}
		
		res.contentType('application/rss+xml');
		res.send(xml, 200);
	});
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

function profilePage(req, res) {
	
	profile.get(req.params.user, function(err, data) {
		
		if(errors.happened(err, req, res, 'Failed to get profile data')) {
			return;
		}
		
		res.render('profile', {user: req.params.user, repos: data});
	});
}

function searchPage(req, res) {
	res.render('search', {q: req.query.q});
}

function searchQuery(req, res) {
	
	search(req.query.q, function(err, results) {
		
		if(errors.happened(err, req, res, 'Failed to get search results')) {
			return;
		}
		
		res.json(results);
	});
}

/**
 * Send the status badge for this user and repository
 */
function sendStatusBadge(req, res, dev) {
	
	res.setHeader('Cache-Control', 'no-cache');
	
	manifest.getManifest(req.params.user, req.params.repo, function(err, manifest) {
		
		if(err) {
			res.status(404).sendfile('dist/img/unknown.png');
			return;
		}
		
		brains.getInfo(manifest, {dev: dev}, function(err, info) {
			
			if(err) {
				res.status(500).sendfile('dist/img/unknown.png');
				return;
			}
			
			var totalDeps = info.deps.length;
			var path = 'dist/img/' + (dev ? 'dev-' : '');
			
			if(totalDeps && info.totals.unpinned.outOfDate) {
			
				if(info.totals.unpinned.outOfDate / totalDeps > 0.25) {
					res.sendfile(path + 'outofdate.png');
				} else {
					res.sendfile(path + 'notsouptodate.png');
				}
				
			} else {
				res.sendfile(path + 'uptodate.png');
			}
		});
	});
}

function statusBadge(req, res) {
	sendStatusBadge(req, res, false);
}

function devStatusBadge(req, res) {
	sendStatusBadge(req, res, true);
}

function dependencyGraph(req, res) {
	
	manifest.getManifest(req.params.user, req.params.repo, function(err, manifest) {

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
	
	manifest.getManifest(req.params.user, req.params.repo, function(err, manifest) {

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

function buildRssFeed(req, res, dev) {
	
	manifest.getManifest(req.params.user, req.params.repo, function(err, manifest) {
		
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

function rssFeed(req, res) {
	buildRssFeed(req, res, false);
}

function devRssFeed(req, res) {
	buildRssFeed(req, res, true);
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

	manifest.getManifest(req.params.user, req.params.repo, function(err, manifest) {

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

process.title = 'david:' + process.argv[2];

console.log('David listening on port', process.argv[2]);