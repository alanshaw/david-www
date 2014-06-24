var couchwatch = require("couchwatch")
  , events = require("events")
  , config = require("config")

var registry = new events.EventEmitter()
  , watcher = couchwatch(config.npm.feed, -1)

watcher.on("row", function (change) {
  registry.emit("change", change)
})

watcher.on("error", function (er) {
  // Downgrade the error event from an EXIT THE PROGRAM to a warn log
  console.warn("couchwatch er", er)

  // Try again in a bit
  setTimeout(function () {
    watcher.init()
  }, 30 * 1000)
})

module.exports = registry
