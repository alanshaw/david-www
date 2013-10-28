var express = require('express');

var oneDay = 86400000;  // milliseconds: 60 * 60 * 24 * 1000
var oneWeek = oneDay * 7;
var oneMonth = oneWeek * 30;

module.exports.init = function(app) {

	app.use('/css', express.static(__dirname + '/dist/css', { maxAge: oneMonth }));
	app.use('/fonts', express.static(__dirname + '/dist/fonts', { maxAge: oneMonth }));
	app.use('/img', express.static(__dirname + '/dist/img', { maxAge: oneMonth }));
	app.use('/js', express.static(__dirname + '/dist/js', { maxAge: oneMonth }));

	app.use(express.favicon(__dirname + '/dist/favicon.ico', { maxAge: oneWeek }));

	app.get('/apple-touch-icon-precomposed.png', function(req, res) {
		res.sendfile(__dirname + '/dist' + req.url, { maxAge: oneWeek });
	});
};
