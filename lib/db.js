var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')
var rimraf = require('rimraf')
var config = require('../config')
var level = require('level')

var dbPath = path.resolve(config.db.path, process.env.NODE_ENV || 'development')

try {
  fs.accessSync(dbPath, fs.R_OK | fs.W_OK)
  rimraf.sync(dbPath)
  console.log('Clearing existing db', dbPath)
} catch (err) {
  console.warn('Failed to clear existing db', err)
}

mkdirp.sync(dbPath)

module.exports = level(dbPath, {valueEncoding: 'json'})
