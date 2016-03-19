var test = require('tape')
var createRegistry = require('../lib/registry')
var config = require('../config')

test('Error event from couchwatch should not exit process', function (t) {
  t.plan(1)

  var registry = createRegistry(config.npm)
  registry.watcher.init = function () {}

  t.equal(registry.watcher.listenerCount('error'), 1, 'Error listner attached')
  t.end()
})
