var express = require('express');

module.exports.init = function(app) {
	
	app.use('/js', express['static'](__dirname + '/dist/js'));
	app.use('/css', express['static'](__dirname + '/dist/css'));
	app.use('/img', express['static'](__dirname + '/dist/img'));
	app.use('/font', express['static'](__dirname + '/dist/font'));
	
	app.use(express.favicon(__dirname + '/dist/favicon.ico'));
	
	var appleTouchIcons = [
		'/apple-touch-icon-57x57-precomposed.png',
		'/apple-touch-icon-72x72-precomposed.png',
		'/apple-touch-icon-114x114-precomposed.png',
		'/apple-touch-icon-144x144-precomposed.png',
		'/apple-touch-icon-precomposed.png',
		'/apple-touch-icon.png'
	];
	
	appleTouchIcons.forEach(function(filename) {
		app.get(filename, function(req, res) {
			res.sendfile(__dirname + '/dist' + req.url, {maxAge: 86400000});
		});
	});
};