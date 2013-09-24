<img src="https://raw.github.com/alanshaw/david-www/master/david.png" title="David www"/> [![Build Status](https://travis-ci.org/alanshaw/david-www.png?branch=master)](https://travis-ci.org/alanshaw/david-www) [![Dependency Status](https://david-dm.org/alanshaw/david-www.png)](https://david-dm.org/alanshaw/david-www)
=========

Node.js based web service that tells you when your project npm dependencies are out of date.
To use David, your project must include a [package.json](https://npmjs.org/doc/json.html)
file in the root of your repository.

Currently David works with package.json files found in __public__ github repositories only.

Getting Started
---------------

With [Node.js](http://nodejs.org/) and [Grunt](http://gruntjs.com/) installed already,
do the following:

Install david-www:

```sh
cd /path/to/david-www
npm install
grunt
```

Run david-www:

```sh
node .
```


Example usage
-------------

View a web page of all dependencies (and their updates, and their versions)
for __public__ GitHub repository "grunt-jsio" owned by "alanshaw":

```sh
curl http://localhost:1337/alanshaw/grunt-jsio
```

Get the current build status badge:

```sh
curl http://localhost:1337/alanshaw/grunt-jsio.png
```
