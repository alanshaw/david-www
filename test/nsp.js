const test = require('tape')
const createNsp = require('../lib/nsp')

function mockNspApi (results) {
  return {
    advisories (opts, cb) {
      opts = opts || {}
      process.nextTick(() => {
        cb(null, {
          offset: opts.offset || 0,
          limit: opts.limit || 100,
          total: results.length,
          results: results
        })
      })
    }
  }
}

function mockDb () {
  const data = {}

  return {
    get (key, cb) {
      if (data[key]) {
        return process.nextTick(() => cb(null, data[key]))
      }

      const err = new Error(key + ' not found')
      err.notFound = true
      process.nextTick(() => cb(err))
    },
    put (key, value, cb) {
      data[key] = value
      process.nextTick(cb)
    }
  }
}

test('NSP update advisories works good', (t) => {
  t.plan(8)

  const apiResp = [
    {id: 0, module_name: 'test0'},
    {id: 1, module_name: 'test1'},
    {id: 2, module_name: 'test2'}
  ]

  const nsp = createNsp(mockNspApi(apiResp), mockDb())

  nsp.syncAdvisories(function (err) {
    t.ifError(err)

    nsp.getAdvisories(['test0', 'test1', 'test2'], (err, advisories) => {
      t.ifError(err)
      t.ok(advisories['test0'])
      t.equal(advisories['test0'].length, 1)
      t.ok(advisories['test1'])
      t.equal(advisories['test1'].length, 1)
      t.ok(advisories['test2'])
      t.equal(advisories['test2'].length, 1)
      t.end()
    })
  })
})
