const test = require('tape')
const createRegistry = require('../dist/lib/registry').default
const config = require('../dist/config').default

test('Error event from couchwatch should not exit process', (t) => {
  t.plan(1)

  const registry = createRegistry({ npmConfig: config.npm })
  registry.watcher.init = () => {}

  t.equal(registry.watcher.listenerCount('error'), 1, 'Error listner attached')
  t.end()
})
