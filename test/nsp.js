var test = require('tape')
var createNsp = require('../lib/nsp')

function mockNspApi (results) {
  return {
    advisories: function (opts, cb) {
      opts = opts || {}
      process.nextTick(function () {
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
  var data = {}

  return {
    get: function (key, cb) {
      if (data[key]) {
        return process.nextTick(function () {
          cb(null, data[key])
        })
      }

      var err = new Error(key + ' not found')
      err.notFound = true
      process.nextTick(function () { cb(err) })
    },
    put: function (key, value, cb) {
      data[key] = value
      process.nextTick(cb)
    }
  }
}

test('NSP update advisories works good', function (t) {
  t.plan(8)

  var apiResp = [
    {id: 0, module_name: 'test0'},
    {id: 1, module_name: 'test1'},
    {id: 2, module_name: 'test2'}
  ]

  var nsp = createNsp(mockNspApi(apiResp), mockDb())

  nsp.syncAdvisories(function (err) {
    t.ifError(err)

    nsp.getAdvisories(['test0', 'test1', 'test2'], function (err, advisories) {
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
