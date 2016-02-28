var rewire = require('rewire')
var nsp = rewire('../lib/nsp')

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

module.exports = {
  'NSP update advisories works good': function (test) {
    nsp.__set__('client', mockNspApi([
      {module_name: 'test0'},
      {module_name: 'test1'},
      {module_name: 'test2'}
    ]))

    nsp.syncAdvisories(function (err) {
      test.ifError(err)

      nsp.getAdvisories(['test0', 'test1', 'test2'], function (err, advisories) {
        test.ifError(err)
        test.ok(advisories['test0'])
        test.equal(advisories['test0'].length, 1)
        test.ok(advisories['test1'])
        test.equal(advisories['test1'].length, 1)
        test.ok(advisories['test2'])
        test.equal(advisories['test2'].length, 1)
        test.done()
      })
    })
  }
}
