var couchwatch = require('couchwatch')
var EventEmitter = require('events').EventEmitter

module.exports = function (npmConfig) {
  var Registry = new EventEmitter()
  var watcher = couchwatch(npmConfig.feed, -1)

  watcher.on('row', function (change) {
    Registry.emit('change', change)
  })

  watcher.on('error', function (err) {
    // Downgrade the error event from an EXIT THE PROGRAM to a warn log
    console.warn('couchwatch error', err)

    // Try again in a bit
    setTimeout(function () {
      watcher.init()
    }, 30 * 1000)
  })

  Registry.watcher = watcher

  return Registry
}
