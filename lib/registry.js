const couchwatch = require('couchwatch')
const EventEmitter = require('events').EventEmitter

module.exports = (npmConfig) => {
  const Registry = new EventEmitter()
  const watcher = couchwatch(npmConfig.feed, -1)

  watcher.on('row', (change) => Registry.emit('change', change))

  watcher.on('error', (err) => {
    // Downgrade the error event from an EXIT THE PROGRAM to a warn log
    console.warn('couchwatch error', err)

    // Try again in a bit
    setTimeout(() => watcher.init(), 30 * 1000)
  })

  Registry.watcher = watcher

  return Registry
}
