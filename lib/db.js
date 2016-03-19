var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')
var rimraf = require('rimraf')
var level = require('level')

module.exports = function (dbConfig) {
  var dbPath = path.resolve(dbConfig.path, process.env.NODE_ENV || 'development')

  try {
    fs.accessSync(dbPath, fs.R_OK | fs.W_OK)
    rimraf.sync(dbPath)
    console.log('Clearing existing db', dbPath)
  } catch (err) {
    console.warn('Failed to clear existing db', err)
  }

  mkdirp.sync(dbPath)

  return level(dbPath, {valueEncoding: 'json'})
}
