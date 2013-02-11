<img src="https://raw.github.com/alanshaw/david-www/master/david.png"/>

David www [![Dependency Status](https://david-dm.org/alanshaw/david-www.png)](https://david-dm.org/alanshaw/david-www)
=========

Nodejs based web service that tells you when your project npm dependencies are out of date. To use David, your project must include a [package.json](https://npmjs.org/doc/json.html) file in the root of your repository.

Currently David works with package.json files found in _public_ github repositories only.

Getting Started
---------------

With [Node.js](http://nodejs.org/) and [Grunt](http://gruntjs.com/) installed already, do the following:

Install david-www:

	cd /path/to/david-www
	npm install
	grunt

Run david-www:

	node main 8080


Example usage
-------------

View a web page of all dependencies (and their updates, and their versions) for _public_ GitHub repository "grunt-jsio" owned by "alanshaw":

	curl http://localhost:8080/alanshaw/grunt-jsio

Get the current build status badge:

	curl http://localhost:8080/alanshaw/grunt-jsio.png
