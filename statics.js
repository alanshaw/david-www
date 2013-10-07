var express = require('express');

module.exports.init = function(app) {

	app.use('/js', express.static(__dirname + '/dist/js'));
	app.use('/css', express.static(__dirname + '/dist/css'));
	app.use('/img', express.static(__dirname + '/dist/img'));
	app.use('/font', express.static(__dirname + '/dist/font'));
	app.use('/inc', express.static(__dirname + '/dist/inc'));

	app.use(express.favicon(__dirname + '/dist/favicon.ico'));

	var appleTouchIcon = '/apple-touch-icon-precomposed.png';

	app.get(appleTouchIcon, function(req, res) {
		res.sendfile(__dirname + '/dist' + req.url, {maxAge: 86400000});
	});
};
