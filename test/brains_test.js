var rewire = require("rewire")
var brains = rewire("../brains")
var david = require("david")

brains.__set__("config", {brains: {cacheTime: 0}})

// Create a mock manifest from the deps info david should return
function mockManifest (deps) {
  var manifest = {name: "mockery", dependencies: {}}
  Object.keys(deps).forEach(function (depName) {
    manifest.dependencies[depName] = deps[depName].required
  })
  return manifest
}

function clone (info) {
  return Object.keys(info).reduce(function (clone, depName) {
    clone[depName] = info[depName]
    return clone
  }, {})
}

function mockDavid (deps, updatedDeps, updatedStableDeps) {
  return {
    getDependencies: function (manifest, options, cb) {

      // Allow cb to be passed as second parameter
      if (!cb) {
        cb = options
        options = {}
      } else {
        options = options || {}
      }

      cb(null, clone(deps))
    },
    getUpdatedDependencies: function (manifest, options, cb) {

      // Allow cb to be passed as second parameter
      if (!cb) {
        cb = options
        options = {}
      } else {
        options = options || {}
      }

      cb(null, clone(options.stable ? updatedStableDeps : updatedDeps))
    },
    isUpdated: david.isUpdated
  }
}

module.exports = {

  "Test single, up to date, unpinned dependency": function (test) {

    var deps = {
      foo: {
        required: "~1.0.0",
        stable: "1.0.0",
        latest: "1.0.0"
      }
    }

    brains.__set__("david", mockDavid(deps, {}, {}))

    test.expect(19)

    brains.getInfo(mockManifest(deps), function (er, info) {

      test.ifError(er)

      test.ok(info, "An info object should have been returned")

      // Test deps
      test.ok(info.deps, "Info object should contain an array of dependencies")
      test.equal(info.deps.length, 1, "One dependency should have been returned")
      test.equal(info.deps[0].name, "foo", "Dependency should have correct name")
      test.equal(info.deps[0].required, deps.foo.required, "Dependency should have correct required value")
      test.equal(info.deps[0].stable, deps.foo.stable, "Dependency should have correct stable value")
      test.equal(info.deps[0].latest, deps.foo.latest, "Dependency should have correct latest value")
      test.equal(info.deps[0].status, "uptodate", "Dependency status should be 'uptodate'")
      test.equal(info.deps[0].pinned, false, "Dependency should not be flagged as pinned")

      // Test totals
      test.ok(info.totals, "Info object should contain a totals object")
      test.ok(info.totals.pinned, "Totals object should contain a pinned object")
      test.ok(info.totals.unpinned, "Totals object should contain an unpinned object")
      test.strictEqual(info.totals.upToDate, 1, "Up to date total should be 1")
      test.strictEqual(info.totals.outOfDate, 0, "Out of date total should be 0")
      test.strictEqual(info.totals.pinned.outOfDate, 0, "Pinned out of date total should be 0")
      test.strictEqual(info.totals.pinned.upToDate, 0, "Pinned up to date total should be 0")
      test.strictEqual(info.totals.unpinned.outOfDate, 0, "Unpinned out of date total should be 0")
      test.strictEqual(info.totals.unpinned.upToDate, 1, "Unpinned up to date total should be 1")

      test.done()
    })
  },

  "Test single, up to date, pinned dependency": function (test) {

    var deps = {
      foo: {
        required: "1.0.0",
        stable: "1.0.0",
        latest: "2.0.0-beta"
      }
    }

    brains.__set__("david", mockDavid(deps, {}, {}))

    test.expect(19)

    brains.getInfo(mockManifest(deps), function (er, info) {

      test.ifError(er)

      test.ok(info, "An info object should have been returned")

      // Test deps
      test.ok(info.deps, "Info object should contain an array of dependencies")
      test.equal(info.deps.length, 1, "One dependency should have been returned")
      test.equal(info.deps[0].name, "foo", "Dependency should have correct name")
      test.equal(info.deps[0].required, deps.foo.required, "Dependency should have correct required value")
      test.equal(info.deps[0].stable, deps.foo.stable, "Dependency should have correct stable value")
      test.equal(info.deps[0].latest, deps.foo.latest, "Dependency should have correct latest value")
      test.equal(info.deps[0].status, "uptodate", "Dependency status should be 'uptodate'")
      test.equal(info.deps[0].pinned, true, "Dependency should be flagged as pinned")

      // Test totals
      test.ok(info.totals, "Info object should contain a totals object")
      test.ok(info.totals.pinned, "Totals object should contain a pinned object")
      test.ok(info.totals.unpinned, "Totals object should contain an unpinned object")
      test.strictEqual(info.totals.upToDate, 1, "Up to date total should be 1")
      test.strictEqual(info.totals.outOfDate, 0, "Out of date total should be 0")
      test.strictEqual(info.totals.pinned.outOfDate, 0, "Pinned out of date total should be 0")
      test.strictEqual(info.totals.pinned.upToDate, 1, "Pinned up to date total should be 1")
      test.strictEqual(info.totals.unpinned.outOfDate, 0, "Unpinned out of date total should be 0")
      test.strictEqual(info.totals.unpinned.upToDate, 0, "Unpinned up to date total should be 0")

      test.done()
    })
  },

  "Test single, out of date, unpinned dependency": function (test) {

    var deps, updatedDeps, updatedStableDeps

    deps = updatedDeps = updatedStableDeps = {
      foo: {
        required: ">=1.0.0 <1.1.0",
        stable: "2.0.0",
        latest: "2.0.0"
      }
    }

    brains.__set__("david", mockDavid(deps, updatedDeps, updatedStableDeps))

    test.expect(19)

    brains.getInfo(mockManifest(deps), function (er, info) {

      test.ifError(er)

      test.ok(info, "An info object should have been returned")

      // Test deps
      test.ok(info.deps, "Info object should contain an array of dependencies")
      test.equal(info.deps.length, 1, "One dependency should have been returned")
      test.equal(info.deps[0].name, "foo", "Dependency should have correct name")
      test.equal(info.deps[0].required, deps.foo.required, "Dependency should have correct required value")
      test.equal(info.deps[0].stable, deps.foo.stable, "Dependency should have correct stable value")
      test.equal(info.deps[0].latest, deps.foo.latest, "Dependency should have correct latest value")
      test.equal(info.deps[0].status, "outofdate", "Dependency status should be 'outofdate'")
      test.equal(info.deps[0].pinned, false, "Dependency should not be flagged as pinned")

      // Test totals
      test.ok(info.totals, "Info object should contain a totals object")
      test.ok(info.totals.pinned, "Totals object should contain a pinned object")
      test.ok(info.totals.unpinned, "Totals object should contain an unpinned object")
      test.strictEqual(info.totals.upToDate, 0, "Up to date total should be 0")
      test.strictEqual(info.totals.outOfDate, 1, "Out of date total should be 1")
      test.strictEqual(info.totals.pinned.outOfDate, 0, "Pinned out of date total should be 0")
      test.strictEqual(info.totals.pinned.upToDate, 0, "Pinned up to date total should be 0")
      test.strictEqual(info.totals.unpinned.outOfDate, 1, "Unpinned out of date total should be 1")
      test.strictEqual(info.totals.unpinned.upToDate, 0, "Unpinned up to date total should be 0")

      test.done()
    })
  },

  "Test single, out of date, pinned dependency": function (test) {

    var deps, updatedDeps, updatedStableDeps

    deps = updatedDeps = updatedStableDeps = {
      foo: {
        required: "1.0.0",
        stable: "2.0.0",
        latest: "2.0.0"
      }
    }

    brains.__set__("david", mockDavid(deps, updatedDeps, updatedStableDeps))

    test.expect(19)

    brains.getInfo(mockManifest(deps), function (er, info) {

      test.ifError(er)

      test.ok(info, "An info object should have been returned")

      // Test deps
      test.ok(info.deps, "Info object should contain an array of dependencies")
      test.equal(info.deps.length, 1, "One dependency should have been returned")
      test.equal(info.deps[0].name, "foo", "Dependency should have correct name")
      test.equal(info.deps[0].required, deps.foo.required, "Dependency should have correct required value")
      test.equal(info.deps[0].stable, deps.foo.stable, "Dependency should have correct stable value")
      test.equal(info.deps[0].latest, deps.foo.latest, "Dependency should have correct latest value")
      test.equal(info.deps[0].status, "outofdate", "Dependency status should be 'outofdate'")
      test.equal(info.deps[0].pinned, true, "Dependency should be flagged as pinned")

      // Test totals
      test.ok(info.totals, "Info object should contain a totals object")
      test.ok(info.totals.pinned, "Totals object should contain a pinned object")
      test.ok(info.totals.unpinned, "Totals object should contain an unpinned object")
      test.strictEqual(info.totals.upToDate, 0, "Up to date total should be 0")
      test.strictEqual(info.totals.outOfDate, 1, "Out of date total should be 1")
      test.strictEqual(info.totals.pinned.outOfDate, 1, "Pinned out of date total should be 1")
      test.strictEqual(info.totals.pinned.upToDate, 0, "Pinned up to date total should be 0")
      test.strictEqual(info.totals.unpinned.outOfDate, 0, "Unpinned out of date total should be 0")
      test.strictEqual(info.totals.unpinned.upToDate, 0, "Unpinned up to date total should be 0")

      test.done()
    })
  },

  "Test unstable dependency not flagged as out of date when no stable to upgrade to": function (test) {

    var deps = {
      foo: {
        required: "~0.4.0rc7",
        stable: "0.3.7",
        latest: "0.4.0rc8"
      }
    }

    var updatedDeps = {foo: deps.foo}

    // No stable deps to upgrade to
    var updatedStableDeps = {}

    brains.__set__("david", mockDavid(deps, updatedDeps, updatedStableDeps))

    test.expect(19)

    brains.getInfo(mockManifest(deps), function (er, info) {

      test.ifError(er)

      test.ok(info, "An info object should have been returned")

      // Test deps
      test.ok(info.deps, "Info object should contain an array of dependencies")
      test.equal(info.deps.length, 1, "One dependency should have been returned")
      test.equal(info.deps[0].name, "foo", "Dependency should have correct name")
      test.equal(info.deps[0].required, deps.foo.required, "Dependency should have correct required value")
      test.equal(info.deps[0].stable, deps.foo.stable, "Dependency should have correct stable value")
      test.equal(info.deps[0].latest, deps.foo.latest, "Dependency should have correct latest value")
      test.equal(info.deps[0].status, "uptodate", "Dependency status should be 'uptodate'")
      test.equal(info.deps[0].pinned, false, "Dependency should not be flagged as pinned")

      // Test totals
      test.ok(info.totals, "Info object should contain a totals object")
      test.ok(info.totals.pinned, "Totals object should contain a pinned object")
      test.ok(info.totals.unpinned, "Totals object should contain an unpinned object")
      test.strictEqual(info.totals.upToDate, 1, "Up to date total should be 1")
      test.strictEqual(info.totals.outOfDate, 0, "Out of date total should be 0")
      test.strictEqual(info.totals.pinned.outOfDate, 0, "Pinned out of date total should be 0")
      test.strictEqual(info.totals.pinned.upToDate, 0, "Pinned up to date total should be 0")
      test.strictEqual(info.totals.unpinned.outOfDate, 0, "Unpinned out of date total should be 0")
      test.strictEqual(info.totals.unpinned.upToDate, 1, "Unpinned up to date total should be 1")

      test.done()
    })
  },

  "Test 2 dependencies, 1 up to date & unpinned, 1 up to date & unpinned": function (test) {

    var deps, updatedDeps, updatedStableDeps

    deps = {
      foo: {
        required: "~1.0.0",
        stable: "1.0.3",
        latest: "1.0.3"
      },
      bar: {
        required: "*",
        stable: "0.0.4",
        latest: "0.0.5-pre"
      }
    }

    updatedDeps = updatedStableDeps = {}

    brains.__set__("david", mockDavid(deps, updatedDeps, updatedStableDeps))

    test.expect(25)

    brains.getInfo(mockManifest(deps), function (er, info) {

      test.ifError(er)

      test.ok(info, "An info object should have been returned")

      // Test deps
      test.ok(info.deps, "Info object should contain an array of dependencies")
      test.equal(info.deps.length, 2, "Two dependencies should have been returned")

      // Expect deps back in this order as brains should sort the array

      test.equal(info.deps[0].name, "bar", "Dependency should have correct name")
      test.equal(info.deps[0].required, deps.bar.required, "Dependency should have correct required value")
      test.equal(info.deps[0].stable, deps.bar.stable, "Dependency should have correct stable value")
      test.equal(info.deps[0].latest, deps.bar.latest, "Dependency should have correct latest value")
      test.equal(info.deps[0].status, "uptodate", "Dependency status should be 'uptodate'")
      test.equal(info.deps[0].pinned, false, "Dependency should not be flagged as pinned")

      test.equal(info.deps[1].name, "foo", "Dependency should have correct name")
      test.equal(info.deps[1].required, deps.foo.required, "Dependency should have correct required value")
      test.equal(info.deps[1].stable, deps.foo.stable, "Dependency should have correct stable value")
      test.equal(info.deps[1].latest, deps.foo.latest, "Dependency should have correct latest value")
      test.equal(info.deps[1].status, "uptodate", "Dependency status should be 'uptodate'")
      test.equal(info.deps[1].pinned, false, "Dependency should not be flagged as pinned")

      // Test totals
      test.ok(info.totals, "Info object should contain a totals object")
      test.ok(info.totals.pinned, "Totals object should contain a pinned object")
      test.ok(info.totals.unpinned, "Totals object should contain an unpinned object")
      test.strictEqual(info.totals.upToDate, 2, "Up to date total should be 2")
      test.strictEqual(info.totals.outOfDate, 0, "Out of date total should be 0")
      test.strictEqual(info.totals.pinned.outOfDate, 0, "Pinned out of date total should be 0")
      test.strictEqual(info.totals.pinned.upToDate, 0, "Pinned up to date total should be 0")
      test.strictEqual(info.totals.unpinned.outOfDate, 0, "Unpinned out of date total should be 0")
      test.strictEqual(info.totals.unpinned.upToDate, 2, "Unpinned up to date total should be 2")

      test.done()
    })
  },

  "Test 2 dependencies, 1 up to date & unpinned, 1 out of date & unpinned": function (test) {

    var deps, updatedDeps, updatedStableDeps

    deps = {
      foo: {
        required: "~1.0.0",
        stable: "2.0.1",
        latest: "2.0.1"
      },
      bar: {
        required: "*",
        stable: "0.0.4",
        latest: "0.0.5-pre"
      }
    }

    updatedDeps = updatedStableDeps = {}

    // Setup foo as the updated dep
    updatedDeps.foo = deps.foo

    brains.__set__("david", mockDavid(deps, updatedDeps, updatedStableDeps))

    test.expect(25)

    brains.getInfo(mockManifest(deps), function (er, info) {

      test.ifError(er)

      test.ok(info, "An info object should have been returned")

      // Test deps
      test.ok(info.deps, "Info object should contain an array of dependencies")
      test.equal(info.deps.length, 2, "Two dependencies should have been returned")

      // Expect deps back in this order as brains should sort the array

      test.equal(info.deps[0].name, "bar", "Dependency should have correct name")
      test.equal(info.deps[0].required, deps.bar.required, "Dependency should have correct required value")
      test.equal(info.deps[0].stable, deps.bar.stable, "Dependency should have correct stable value")
      test.equal(info.deps[0].latest, deps.bar.latest, "Dependency should have correct latest value")
      test.equal(info.deps[0].status, "uptodate", "Dependency status should be 'uptodate'")
      test.equal(info.deps[0].pinned, false, "Dependency should not be flagged as pinned")

      test.equal(info.deps[1].name, "foo", "Dependency should have correct name")
      test.equal(info.deps[1].required, deps.foo.required, "Dependency should have correct required value")
      test.equal(info.deps[1].stable, deps.foo.stable, "Dependency should have correct stable value")
      test.equal(info.deps[1].latest, deps.foo.latest, "Dependency should have correct latest value")
      test.equal(info.deps[1].status, "outofdate", "Dependency status should be 'outofdate'")
      test.equal(info.deps[1].pinned, false, "Dependency should not be flagged as pinned")

      // Test totals
      test.ok(info.totals, "Info object should contain a totals object")
      test.ok(info.totals.pinned, "Totals object should contain a pinned object")
      test.ok(info.totals.unpinned, "Totals object should contain an unpinned object")
      test.strictEqual(info.totals.upToDate, 1, "Up to date total should be 1")
      test.strictEqual(info.totals.outOfDate, 1, "Out of date total should be 1")
      test.strictEqual(info.totals.pinned.outOfDate, 0, "Pinned out of date total should be 0")
      test.strictEqual(info.totals.pinned.upToDate, 0, "Pinned up to date total should be 0")
      test.strictEqual(info.totals.unpinned.outOfDate, 1, "Unpinned out of date total should be 1")
      test.strictEqual(info.totals.unpinned.upToDate, 1, "Unpinned up to date total should be 1")

      test.done()
    })
  },

  "Test 2 dependencies, 1 out of date & unpinned, 1 out of date & unpinned": function (test) {

    var deps, updatedDeps, updatedStableDeps

    deps = updatedDeps = updatedStableDeps = {
      foo: {
        required: "~1.0.0",
        stable: "2.0.1",
        latest: "2.0.1"
      },
      bar: {
        required: ">=0.1.0 <0.2.2 || >=0.3 <0.3.5",
        stable: "0.4.0",
        latest: "0.5.0-pre"
      }
    }

    brains.__set__("david", mockDavid(deps, updatedDeps, updatedStableDeps))

    test.expect(25)

    brains.getInfo(mockManifest(deps), function (er, info) {

      test.ifError(er)

      test.ok(info, "An info object should have been returned")

      // Test deps
      test.ok(info.deps, "Info object should contain an array of dependencies")
      test.equal(info.deps.length, 2, "Two dependencies should have been returned")

      // Expect deps back in this order as brains should sort the array

      test.equal(info.deps[0].name, "bar", "Dependency should have correct name")
      test.equal(info.deps[0].required, deps.bar.required, "Dependency should have correct required value")
      test.equal(info.deps[0].stable, deps.bar.stable, "Dependency should have correct stable value")
      test.equal(info.deps[0].latest, deps.bar.latest, "Dependency should have correct latest value")
      test.equal(info.deps[0].status, "outofdate", "Dependency status should be 'outofdate'")
      test.equal(info.deps[0].pinned, false, "Dependency should not be flagged as pinned")

      test.equal(info.deps[1].name, "foo", "Dependency should have correct name")
      test.equal(info.deps[1].required, deps.foo.required, "Dependency should have correct required value")
      test.equal(info.deps[1].stable, deps.foo.stable, "Dependency should have correct stable value")
      test.equal(info.deps[1].latest, deps.foo.latest, "Dependency should have correct latest value")
      test.equal(info.deps[1].status, "outofdate", "Dependency status should be 'outofdate'")
      test.equal(info.deps[1].pinned, false, "Dependency should not be flagged as pinned")

      // Test totals
      test.ok(info.totals, "Info object should contain a totals object")
      test.ok(info.totals.pinned, "Totals object should contain a pinned object")
      test.ok(info.totals.unpinned, "Totals object should contain an unpinned object")
      test.strictEqual(info.totals.upToDate, 0, "Up to date total should be 0")
      test.strictEqual(info.totals.outOfDate, 2, "Out of date total should be 2")
      test.strictEqual(info.totals.pinned.outOfDate, 0, "Pinned out of date total should be 0")
      test.strictEqual(info.totals.pinned.upToDate, 0, "Pinned up to date total should be 0")
      test.strictEqual(info.totals.unpinned.outOfDate, 2, "Unpinned out of date total should be 2")
      test.strictEqual(info.totals.unpinned.upToDate, 0, "Unpinned up to date total should be 0")

      test.done()
    })
  },

  "Test 2 dependencies, 1 up to date & pinned, 1 up to date & pinned": function (test) {

    var deps, updatedDeps, updatedStableDeps

    deps = {
      foo: {
        required: "1.0.0",
        stable: "1.0.0",
        latest: "1.0.0"
      },
      bar: {
        required: "0.0.1",
        stable: "0.0.1",
        latest: "0.0.1"
      }
    }

    updatedDeps = updatedStableDeps = {}

    brains.__set__("david", mockDavid(deps, updatedDeps, updatedStableDeps))

    test.expect(25)

    brains.getInfo(mockManifest(deps), function (er, info) {

      test.ifError(er)

      test.ok(info, "An info object should have been returned")

      // Test deps
      test.ok(info.deps, "Info object should contain an array of dependencies")
      test.equal(info.deps.length, 2, "Two dependencies should have been returned")

      // Expect deps back in this order as brains should sort the array

      test.equal(info.deps[0].name, "bar", "Dependency should have correct name")
      test.equal(info.deps[0].required, deps.bar.required, "Dependency should have correct required value")
      test.equal(info.deps[0].stable, deps.bar.stable, "Dependency should have correct stable value")
      test.equal(info.deps[0].latest, deps.bar.latest, "Dependency should have correct latest value")
      test.equal(info.deps[0].status, "uptodate", "Dependency status should be 'uptodate'")
      test.equal(info.deps[0].pinned, true, "Dependency should be flagged as pinned")

      test.equal(info.deps[1].name, "foo", "Dependency should have correct name")
      test.equal(info.deps[1].required, deps.foo.required, "Dependency should have correct required value")
      test.equal(info.deps[1].stable, deps.foo.stable, "Dependency should have correct stable value")
      test.equal(info.deps[1].latest, deps.foo.latest, "Dependency should have correct latest value")
      test.equal(info.deps[1].status, "uptodate", "Dependency status should be 'uptodate'")
      test.equal(info.deps[1].pinned, true, "Dependency should be flagged as pinned")

      // Test totals
      test.ok(info.totals, "Info object should contain a totals object")
      test.ok(info.totals.pinned, "Totals object should contain a pinned object")
      test.ok(info.totals.unpinned, "Totals object should contain an unpinned object")
      test.strictEqual(info.totals.upToDate, 2, "Up to date total should be 2")
      test.strictEqual(info.totals.outOfDate, 0, "Out of date total should be 0")
      test.strictEqual(info.totals.pinned.outOfDate, 0, "Pinned out of date total should be 0")
      test.strictEqual(info.totals.pinned.upToDate, 2, "Pinned up to date total should be 2")
      test.strictEqual(info.totals.unpinned.outOfDate, 0, "Unpinned out of date total should be 0")
      test.strictEqual(info.totals.unpinned.upToDate, 0, "Unpinned up to date total should be 0")

      test.done()
    })
  },

  "Test 2 dependencies, 1 up to date & pinned, 1 out of date & pinned": function (test) {

    var deps, updatedDeps, updatedStableDeps

    deps = {
      foo: {
        required: "1.0.0",
        stable: "1.0.0",
        latest: "1.0.0"
      },
      bar: {
        required: "0.0.1",
        stable: "0.0.2",
        latest: "0.0.2"
      }
    }

    updatedDeps = updatedStableDeps = {}

    // Setup bar as the updated dep
    updatedDeps.bar = deps.bar

    brains.__set__("david", mockDavid(deps, updatedDeps, updatedStableDeps))

    test.expect(25)

    brains.getInfo(mockManifest(deps), function (er, info) {

      test.ifError(er)

      test.ok(info, "An info object should have been returned")

      // Test deps
      test.ok(info.deps, "Info object should contain an array of dependencies")
      test.equal(info.deps.length, 2, "Two dependencies should have been returned")

      // Expect deps back in this order as brains should sort the array

      test.equal(info.deps[0].name, "bar", "Dependency should have correct name")
      test.equal(info.deps[0].required, deps.bar.required, "Dependency should have correct required value")
      test.equal(info.deps[0].stable, deps.bar.stable, "Dependency should have correct stable value")
      test.equal(info.deps[0].latest, deps.bar.latest, "Dependency should have correct latest value")
      test.equal(info.deps[0].status, "outofdate", "Dependency status should be 'outofdate'")
      test.equal(info.deps[0].pinned, true, "Dependency should be flagged as pinned")

      test.equal(info.deps[1].name, "foo", "Dependency should have correct name")
      test.equal(info.deps[1].required, deps.foo.required, "Dependency should have correct required value")
      test.equal(info.deps[1].stable, deps.foo.stable, "Dependency should have correct stable value")
      test.equal(info.deps[1].latest, deps.foo.latest, "Dependency should have correct latest value")
      test.equal(info.deps[1].status, "uptodate", "Dependency status should be 'uptodate'")
      test.equal(info.deps[1].pinned, true, "Dependency should be flagged as pinned")

      // Test totals
      test.ok(info.totals, "Info object should contain a totals object")
      test.ok(info.totals.pinned, "Totals object should contain a pinned object")
      test.ok(info.totals.unpinned, "Totals object should contain an unpinned object")
      test.strictEqual(info.totals.upToDate, 1, "Up to date total should be 1")
      test.strictEqual(info.totals.outOfDate, 1, "Out of date total should be 1")
      test.strictEqual(info.totals.pinned.outOfDate, 1, "Pinned out of date total should be 1")
      test.strictEqual(info.totals.pinned.upToDate, 1, "Pinned up to date total should be 1")
      test.strictEqual(info.totals.unpinned.outOfDate, 0, "Unpinned out of date total should be 0")
      test.strictEqual(info.totals.unpinned.upToDate, 0, "Unpinned up to date total should be 0")

      test.done()
    })
  },

  "Test 2 dependencies, 1 out of date & pinned, 1 out of date & pinned": function (test) {

    var deps, updatedDeps, updatedStableDeps

    deps = updatedDeps = updatedStableDeps = {
      foo: {
        required: "1.0.0",
        stable: "3.0.0",
        latest: "3.0.0"
      },
      bar: {
        required: "0.0.1",
        stable: "0.0.2",
        latest: "0.0.2"
      }
    }

    brains.__set__("david", mockDavid(deps, updatedDeps, updatedStableDeps))

    test.expect(25)

    brains.getInfo(mockManifest(deps), function (er, info) {

      test.ifError(er)

      test.ok(info, "An info object should have been returned")

      // Test deps
      test.ok(info.deps, "Info object should contain an array of dependencies")
      test.equal(info.deps.length, 2, "Two dependencies should have been returned")

      // Expect deps back in this order as brains should sort the array

      test.equal(info.deps[0].name, "bar", "Dependency should have correct name")
      test.equal(info.deps[0].required, deps.bar.required, "Dependency should have correct required value")
      test.equal(info.deps[0].stable, deps.bar.stable, "Dependency should have correct stable value")
      test.equal(info.deps[0].latest, deps.bar.latest, "Dependency should have correct latest value")
      test.equal(info.deps[0].status, "outofdate", "Dependency status should be 'outofdate'")
      test.equal(info.deps[0].pinned, true, "Dependency should be flagged as pinned")

      test.equal(info.deps[1].name, "foo", "Dependency should have correct name")
      test.equal(info.deps[1].required, deps.foo.required, "Dependency should have correct required value")
      test.equal(info.deps[1].stable, deps.foo.stable, "Dependency should have correct stable value")
      test.equal(info.deps[1].latest, deps.foo.latest, "Dependency should have correct latest value")
      test.equal(info.deps[1].status, "outofdate", "Dependency status should be 'outofdate'")
      test.equal(info.deps[1].pinned, true, "Dependency should be flagged as pinned")

      // Test totals
      test.ok(info.totals, "Info object should contain a totals object")
      test.ok(info.totals.pinned, "Totals object should contain a pinned object")
      test.ok(info.totals.unpinned, "Totals object should contain an unpinned object")
      test.strictEqual(info.totals.upToDate, 0, "Up to date total should be 0")
      test.strictEqual(info.totals.outOfDate, 2, "Out of date total should be 2")
      test.strictEqual(info.totals.pinned.outOfDate, 2, "Pinned out of date total should be 2")
      test.strictEqual(info.totals.pinned.upToDate, 0, "Pinned up to date total should be 0")
      test.strictEqual(info.totals.unpinned.outOfDate, 0, "Unpinned out of date total should be 0")
      test.strictEqual(info.totals.unpinned.upToDate, 0, "Unpinned up to date total should be 0")

      test.done()
    })
  },

  "Test 2 dependencies, 1 up to date & unpinned, 1 up to date & pinned": function (test) {

    var deps, updatedDeps, updatedStableDeps

    deps = {
      foo: {
        required: "~1.0.0",
        stable: "1.0.3",
        latest: "1.0.3"
      },
      bar: {
        required: "0.0.2",
        stable: "0.0.2",
        latest: "0.0.2"
      }
    }

    updatedDeps = updatedStableDeps = {}

    brains.__set__("david", mockDavid(deps, updatedDeps, updatedStableDeps))

    test.expect(25)

    brains.getInfo(mockManifest(deps), function (er, info) {

      test.ifError(er)

      test.ok(info, "An info object should have been returned")

      // Test deps
      test.ok(info.deps, "Info object should contain an array of dependencies")
      test.equal(info.deps.length, 2, "Two dependencies should have been returned")

      // Expect deps back in this order as brains should sort the array

      test.equal(info.deps[0].name, "bar", "Dependency should have correct name")
      test.equal(info.deps[0].required, deps.bar.required, "Dependency should have correct required value")
      test.equal(info.deps[0].stable, deps.bar.stable, "Dependency should have correct stable value")
      test.equal(info.deps[0].latest, deps.bar.latest, "Dependency should have correct latest value")
      test.equal(info.deps[0].status, "uptodate", "Dependency status should be 'uptodate'")
      test.equal(info.deps[0].pinned, true, "Dependency should be flagged as pinned")

      test.equal(info.deps[1].name, "foo", "Dependency should have correct name")
      test.equal(info.deps[1].required, deps.foo.required, "Dependency should have correct required value")
      test.equal(info.deps[1].stable, deps.foo.stable, "Dependency should have correct stable value")
      test.equal(info.deps[1].latest, deps.foo.latest, "Dependency should have correct latest value")
      test.equal(info.deps[1].status, "uptodate", "Dependency status should be 'uptodate'")
      test.equal(info.deps[1].pinned, false, "Dependency should not be flagged as pinned")

      // Test totals
      test.ok(info.totals, "Info object should contain a totals object")
      test.ok(info.totals.pinned, "Totals object should contain a pinned object")
      test.ok(info.totals.unpinned, "Totals object should contain an unpinned object")
      test.strictEqual(info.totals.upToDate, 2, "Up to date total should be 2")
      test.strictEqual(info.totals.outOfDate, 0, "Out of date total should be 0")
      test.strictEqual(info.totals.pinned.outOfDate, 0, "Pinned out of date total should be 0")
      test.strictEqual(info.totals.pinned.upToDate, 1, "Pinned up to date total should be 1")
      test.strictEqual(info.totals.unpinned.outOfDate, 0, "Unpinned out of date total should be 0")
      test.strictEqual(info.totals.unpinned.upToDate, 1, "Unpinned up to date total should be 1")

      test.done()
    })
  },

  "Test 2 dependencies, 1 up to date & unpinned, 1 out of date & pinned": function (test) {

    var deps, updatedDeps, updatedStableDeps

    deps = {
      foo: {
        required: "~1.0.0",
        stable: "1.0.3",
        latest: "1.0.3"
      },
      bar: {
        required: "0.0.2",
        stable: "0.0.4",
        latest: "0.0.5-alpha"
      }
    }

    updatedDeps = updatedStableDeps = {}

    updatedDeps.bar = deps.bar

    brains.__set__("david", mockDavid(deps, updatedDeps, updatedStableDeps))

    test.expect(25)

    brains.getInfo(mockManifest(deps), function (er, info) {

      test.ifError(er)

      test.ok(info, "An info object should have been returned")

      // Test deps
      test.ok(info.deps, "Info object should contain an array of dependencies")
      test.equal(info.deps.length, 2, "Two dependencies should have been returned")

      // Expect deps back in this order as brains should sort the array

      test.equal(info.deps[0].name, "bar", "Dependency should have correct name")
      test.equal(info.deps[0].required, deps.bar.required, "Dependency should have correct required value")
      test.equal(info.deps[0].stable, deps.bar.stable, "Dependency should have correct stable value")
      test.equal(info.deps[0].latest, deps.bar.latest, "Dependency should have correct latest value")
      test.equal(info.deps[0].status, "outofdate", "Dependency status should be 'outofdate'")
      test.equal(info.deps[0].pinned, true, "Dependency should be flagged as pinned")

      test.equal(info.deps[1].name, "foo", "Dependency should have correct name")
      test.equal(info.deps[1].required, deps.foo.required, "Dependency should have correct required value")
      test.equal(info.deps[1].stable, deps.foo.stable, "Dependency should have correct stable value")
      test.equal(info.deps[1].latest, deps.foo.latest, "Dependency should have correct latest value")
      test.equal(info.deps[1].status, "uptodate", "Dependency status should be 'uptodate'")
      test.equal(info.deps[1].pinned, false, "Dependency should not be flagged as pinned")

      // Test totals
      test.ok(info.totals, "Info object should contain a totals object")
      test.ok(info.totals.pinned, "Totals object should contain a pinned object")
      test.ok(info.totals.unpinned, "Totals object should contain an unpinned object")
      test.strictEqual(info.totals.upToDate, 1, "Up to date total should be 1")
      test.strictEqual(info.totals.outOfDate, 1, "Out of date total should be 1")
      test.strictEqual(info.totals.pinned.outOfDate, 1, "Pinned out of date total should be 1")
      test.strictEqual(info.totals.pinned.upToDate, 0, "Pinned up to date total should be 0")
      test.strictEqual(info.totals.unpinned.outOfDate, 0, "Unpinned out of date total should be 0")
      test.strictEqual(info.totals.unpinned.upToDate, 1, "Unpinned up to date total should be 1")

      test.done()
    })
  },

  "Test 2 dependencies, 1 up to date & pinned, 1 out of date & unpinned": function (test) {

    var deps, updatedDeps, updatedStableDeps

    deps = {
      foo: {
        required: "~1.0.0",
        stable: "1.1.1",
        latest: "1.1.1"
      },
      bar: {
        required: "0.0.2",
        stable: "0.0.2",
        latest: "0.0.2"
      }
    }

    updatedDeps = updatedStableDeps = {}

    updatedDeps.foo = deps.foo

    brains.__set__("david", mockDavid(deps, updatedDeps, updatedStableDeps))

    test.expect(25)

    brains.getInfo(mockManifest(deps), function (er, info) {

      test.ifError(er)

      test.ok(info, "An info object should have been returned")

      // Test deps
      test.ok(info.deps, "Info object should contain an array of dependencies")
      test.equal(info.deps.length, 2, "Two dependencies should have been returned")

      // Expect deps back in this order as brains should sort the array

      test.equal(info.deps[0].name, "bar", "Dependency should have correct name")
      test.equal(info.deps[0].required, deps.bar.required, "Dependency should have correct required value")
      test.equal(info.deps[0].stable, deps.bar.stable, "Dependency should have correct stable value")
      test.equal(info.deps[0].latest, deps.bar.latest, "Dependency should have correct latest value")
      test.equal(info.deps[0].status, "uptodate", "Dependency status should be 'uptodate'")
      test.equal(info.deps[0].pinned, true, "Dependency should be flagged as pinned")

      test.equal(info.deps[1].name, "foo", "Dependency should have correct name")
      test.equal(info.deps[1].required, deps.foo.required, "Dependency should have correct required value")
      test.equal(info.deps[1].stable, deps.foo.stable, "Dependency should have correct stable value")
      test.equal(info.deps[1].latest, deps.foo.latest, "Dependency should have correct latest value")
      test.equal(info.deps[1].status, "outofdate", "Dependency status should be 'outofdate'")
      test.equal(info.deps[1].pinned, false, "Dependency should not be flagged as pinned")

      // Test totals
      test.ok(info.totals, "Info object should contain a totals object")
      test.ok(info.totals.pinned, "Totals object should contain a pinned object")
      test.ok(info.totals.unpinned, "Totals object should contain an unpinned object")
      test.strictEqual(info.totals.upToDate, 1, "Up to date total should be 1")
      test.strictEqual(info.totals.outOfDate, 1, "Out of date total should be 1")
      test.strictEqual(info.totals.pinned.outOfDate, 0, "Pinned out of date total should be 0")
      test.strictEqual(info.totals.pinned.upToDate, 1, "Pinned up to date total should be 1")
      test.strictEqual(info.totals.unpinned.outOfDate, 1, "Unpinned out of date total should be 1")
      test.strictEqual(info.totals.unpinned.upToDate, 0, "Unpinned up to date total should be 0")

      test.done()
    })
  },

  "Test 2 dependencies, 1 out of date & pinned, 1 out of date & unpinned": function (test) {

    var deps, updatedDeps, updatedStableDeps

    deps = updatedDeps = updatedStableDeps = {
      foo: {
        required: "~1.0.0",
        stable: "1.1.1",
        latest: "1.1.1"
      },
      bar: {
        required: "0.0.2",
        stable: "0.0.3",
        latest: "0.0.4rc0"
      }
    }

    brains.__set__("david", mockDavid(deps, updatedDeps, updatedStableDeps))

    test.expect(25)

    brains.getInfo(mockManifest(deps), function (er, info) {

      test.ifError(er)

      test.ok(info, "An info object should have been returned")

      // Test deps
      test.ok(info.deps, "Info object should contain an array of dependencies")
      test.equal(info.deps.length, 2, "Two dependencies should have been returned")

      // Expect deps back in this order as brains should sort the array

      test.equal(info.deps[0].name, "bar", "Dependency should have correct name")
      test.equal(info.deps[0].required, deps.bar.required, "Dependency should have correct required value")
      test.equal(info.deps[0].stable, deps.bar.stable, "Dependency should have correct stable value")
      test.equal(info.deps[0].latest, deps.bar.latest, "Dependency should have correct latest value")
      test.equal(info.deps[0].status, "outofdate", "Dependency status should be 'outofdate'")
      test.equal(info.deps[0].pinned, true, "Dependency should be flagged as pinned")

      test.equal(info.deps[1].name, "foo", "Dependency should have correct name")
      test.equal(info.deps[1].required, deps.foo.required, "Dependency should have correct required value")
      test.equal(info.deps[1].stable, deps.foo.stable, "Dependency should have correct stable value")
      test.equal(info.deps[1].latest, deps.foo.latest, "Dependency should have correct latest value")
      test.equal(info.deps[1].status, "outofdate", "Dependency status should be 'outofdate'")
      test.equal(info.deps[1].pinned, false, "Dependency should not be flagged as pinned")

      // Test totals
      test.ok(info.totals, "Info object should contain a totals object")
      test.ok(info.totals.pinned, "Totals object should contain a pinned object")
      test.ok(info.totals.unpinned, "Totals object should contain an unpinned object")
      test.strictEqual(info.totals.upToDate, 0, "Up to date total should be 0")
      test.strictEqual(info.totals.outOfDate, 2, "Out of date total should be 2")
      test.strictEqual(info.totals.pinned.outOfDate, 1, "Pinned out of date total should be 1")
      test.strictEqual(info.totals.pinned.upToDate, 0, "Pinned up to date total should be 0")
      test.strictEqual(info.totals.unpinned.outOfDate, 1, "Unpinned out of date total should be 1")
      test.strictEqual(info.totals.unpinned.upToDate, 0, "Unpinned up to date total should be 0")

      test.done()
    })
  }
}
