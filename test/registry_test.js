var rewire = require("rewire")
  , registry = rewire("../lib/registry")

module.exports = {
  "Error event from couchwatch should not exit process": function (test) {
    var watcher = registry.__get__("watcher")
    watcher.emit("error", new Error("Mock error from couchwatch"))
    // If the error is not caught, the process will exit and the test will never be done
    test.done()
  }
}