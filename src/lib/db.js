import fs from 'fs'
import path from 'path'
import mkdirp from 'mkdirp'
import rimraf from 'rimraf'
import level from 'level'

export default ({dbConfig}) => {
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
