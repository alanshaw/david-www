[![David](https://raw.github.com/alanshaw/david-www/master/david.png)](https://david-dm.org/)

[![Build Status](https://travis-ci.org/alanshaw/david-www.svg)](https://travis-ci.org/alanshaw/david-www)
[![Dependency Status](https://david-dm.org/alanshaw/david-www.svg)](https://david-dm.org/alanshaw/david-www)
[![devDependency Status](https://david-dm.org/alanshaw/david-www/dev-status.svg)](https://david-dm.org/alanshaw/david-www#info=devDependencies)
[![Donate to help support David development](http://img.shields.io/gratipay/_alanshaw.svg?style=flat)](https://www.gittip.com/_alanshaw/)
___

Node.js based web service that tells you when your project npm dependencies are out of date.
To use David, your project must include a [package.json](https://docs.npmjs.com/files/package.json)
file in the root of your repository.

## Getting Started

With [Node.js](http://nodejs.org/) and [Grunt](http://gruntjs.com/) installed already,
do the following:

Install david-www:

```sh
cd /path/to/david-www
npm install
grunt
```

Register a github personal oauth token and add it to `config/default.json`.

(Optional) If you want to use "sign in" feature you should:
* Register a github developer application and add oauth client id and secret to `config/default.json`.
* Developer application should have callback URL: `http://localhost:1337/auth/callback`


Run david-www:

```sh
node .
```


## Example usage

View a web page of all dependencies (and their updates, and their versions)
for **public** GitHub repository "grunt-jsio" owned by "alanshaw":

```sh
curl http://localhost:1337/alanshaw/grunt-jsio
```

Get the current build status badge:

```sh
curl http://localhost:1337/alanshaw/grunt-jsio.png
```
