const test = require('tape')
const createRegistry = require('../lib/registry')
const config = require('../config')

test('Error event from couchwatch should not exit process', (t) => {
  t.plan(1)

  const registry = createRegistry(config.npm)
  registry.watcher.init = () => {}

  t.equal(registry.watcher.listenerCount('error'), 1, 'Error listner attached')
  t.end()
})
