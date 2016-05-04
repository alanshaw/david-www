const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')
const level = require('level')

module.exports = (dbConfig) => {
  const dbPath = path.resolve(dbConfig.path, process.env.NODE_ENV || 'development')

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
