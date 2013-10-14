var express = require('express');

module.exports.init = function(app) {

	app.use('/js', express.static(__dirname + '/dist/js', {maxAge: 86400000 * 7}));
	app.use('/css', express.static(__dirname + '/dist/css', {maxAge: 86400000 * 7}));
	app.use('/img', express.static(__dirname + '/dist/img', {maxAge: 86400000 * 7}));
	app.use('/font', express.static(__dirname + '/dist/font', {maxAge: 86400000 * 7}));

	app.use(express.favicon(__dirname + '/dist/favicon.ico', {maxAge: 86400000 * 7}));

	app.get('/apple-touch-icon-precomposed.png', function(req, res) {
		res.sendfile(__dirname + '/dist' + req.url, {maxAge: 86400000 * 7});
	});
};
