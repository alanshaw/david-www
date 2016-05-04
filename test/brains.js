const test = require('tape')
const david = require('david')
const merge = require('merge')
const createBrains = require('../lib/brains')

// Create a mock manifest from the deps info david should return
function mockManifest (deps) {
  const manifest = {name: 'mockery', dependencies: {}}
  Object.keys(deps).forEach(function (depName) {
    manifest.dependencies[depName] = deps[depName].required
  })
  return manifest
}

function mockDavid (deps, updatedDeps, updatedStableDeps) {
  return {
    getDependencies (manifest, options, cb) {
      // Allow cb to be passed as second parameter
      if (!cb) {
        cb = options
        options = {}
      } else {
        options = options || {}
      }

      cb(null, merge({}, deps))
    },
    getUpdatedDependencies (manifest, options, cb) {
      // Allow cb to be passed as second parameter
      if (!cb) {
        cb = options
        options = {}
      } else {
        options = options || {}
      }

      cb(null, merge({}, options.stable ? updatedStableDeps : updatedDeps))
    },
    isUpdated: david.isUpdated
  }
}

function mockRegistry () {
  return {on () {}}
}

function mockDb () {
  return {
    get (key, cb) {
      const err = new Error(key + ' not found')
      err.notFound = true
      process.nextTick(() => cb(err))
    },
    batch (batch, cb) {
      process.nextTick(cb)
    },
    del (key, cb) {
      process.nextTick(cb)
    }
  }
}

function mockNsp () {
  return {
    getAdvisories (depNames, cb) {
      process.nextTick(() => cb(null, {}))
    }
  }
}

test('Test single, up to date, unpinned dependency', (t) => {
  t.plan(19)

  const deps = {
    foo: {
      required: '~1.0.0',
      stable: '1.0.0',
      latest: '1.0.0'
    }
  }

  const brains = createBrains(mockDavid(deps, {}, {}), mockDb(), mockRegistry(), mockNsp())

  brains.getInfo(mockManifest(deps), (err, info) => {
    t.ifError(err)

    t.ok(info, 'An info object should have been returned')

    // Test deps
    t.ok(info.deps, 'Info object should contain an array of dependencies')
    t.equal(info.deps.length, 1, 'One dependency should have been returned')
    t.equal(info.deps[0].name, 'foo', 'Dependency should have correct name')
    t.equal(info.deps[0].required, deps.foo.required, 'Dependency should have correct required value')
    t.equal(info.deps[0].stable, deps.foo.stable, 'Dependency should have correct stable value')
    t.equal(info.deps[0].latest, deps.foo.latest, 'Dependency should have correct latest value')
    t.equal(info.deps[0].status, 'uptodate', "Dependency status should be 'uptodate'")
    t.equal(info.deps[0].pinned, false, 'Dependency should not be flagged as pinned')

    // Test totals
    t.ok(info.totals, 'Info object should contain a totals object')
    t.ok(info.totals.pinned, 'Totals object should contain a pinned object')
    t.ok(info.totals.unpinned, 'Totals object should contain an unpinned object')
    t.equal(info.totals.upToDate, 1, 'Up to date total should be 1')
    t.equal(info.totals.outOfDate, 0, 'Out of date total should be 0')
    t.equal(info.totals.pinned.outOfDate, 0, 'Pinned out of date total should be 0')
    t.equal(info.totals.pinned.upToDate, 0, 'Pinned up to date total should be 0')
    t.equal(info.totals.unpinned.outOfDate, 0, 'Unpinned out of date total should be 0')
    t.equal(info.totals.unpinned.upToDate, 1, 'Unpinned up to date total should be 1')

    t.end()
  })
})

test('Test single, up to date, pinned dependency', (t) => {
  t.plan(19)

  const deps = {
    foo: {
      required: '1.0.0',
      stable: '1.0.0',
      latest: '2.0.0-beta'
    }
  }

  const brains = createBrains(mockDavid(deps, {}, {}), mockDb(), mockRegistry(), mockNsp())

  brains.getInfo(mockManifest(deps), (err, info) => {
    t.ifError(err)

    t.ok(info, 'An info object should have been returned')

    // Test deps
    t.ok(info.deps, 'Info object should contain an array of dependencies')
    t.equal(info.deps.length, 1, 'One dependency should have been returned')
    t.equal(info.deps[0].name, 'foo', 'Dependency should have correct name')
    t.equal(info.deps[0].required, deps.foo.required, 'Dependency should have correct required value')
    t.equal(info.deps[0].stable, deps.foo.stable, 'Dependency should have correct stable value')
    t.equal(info.deps[0].latest, deps.foo.latest, 'Dependency should have correct latest value')
    t.equal(info.deps[0].status, 'uptodate', "Dependency status should be 'uptodate'")
    t.equal(info.deps[0].pinned, true, 'Dependency should be flagged as pinned')

    // Test totals
    t.ok(info.totals, 'Info object should contain a totals object')
    t.ok(info.totals.pinned, 'Totals object should contain a pinned object')
    t.ok(info.totals.unpinned, 'Totals object should contain an unpinned object')
    t.equal(info.totals.upToDate, 1, 'Up to date total should be 1')
    t.equal(info.totals.outOfDate, 0, 'Out of date total should be 0')
    t.equal(info.totals.pinned.outOfDate, 0, 'Pinned out of date total should be 0')
    t.equal(info.totals.pinned.upToDate, 1, 'Pinned up to date total should be 1')
    t.equal(info.totals.unpinned.outOfDate, 0, 'Unpinned out of date total should be 0')
    t.equal(info.totals.unpinned.upToDate, 0, 'Unpinned up to date total should be 0')

    t.end()
  })
})

test('Test single, out of date, unpinned dependency', (t) => {
  t.plan(19)

  var deps, updatedDeps, updatedStableDeps

  deps = updatedDeps = updatedStableDeps = {
    foo: {
      required: '>=1.0.0 <1.1.0',
      stable: '2.0.0',
      latest: '2.0.0'
    }
  }

  const brains = createBrains(mockDavid(deps, updatedDeps, updatedStableDeps), mockDb(), mockRegistry(), mockNsp())

  brains.getInfo(mockManifest(deps), (err, info) => {
    t.ifError(err)

    t.ok(info, 'An info object should have been returned')

    // Test deps
    t.ok(info.deps, 'Info object should contain an array of dependencies')
    t.equal(info.deps.length, 1, 'One dependency should have been returned')
    t.equal(info.deps[0].name, 'foo', 'Dependency should have correct name')
    t.equal(info.deps[0].required, deps.foo.required, 'Dependency should have correct required value')
    t.equal(info.deps[0].stable, deps.foo.stable, 'Dependency should have correct stable value')
    t.equal(info.deps[0].latest, deps.foo.latest, 'Dependency should have correct latest value')
    t.equal(info.deps[0].status, 'outofdate', "Dependency status should be 'outofdate'")
    t.equal(info.deps[0].pinned, false, 'Dependency should not be flagged as pinned')

    // Test totals
    t.ok(info.totals, 'Info object should contain a totals object')
    t.ok(info.totals.pinned, 'Totals object should contain a pinned object')
    t.ok(info.totals.unpinned, 'Totals object should contain an unpinned object')
    t.equal(info.totals.upToDate, 0, 'Up to date total should be 0')
    t.equal(info.totals.outOfDate, 1, 'Out of date total should be 1')
    t.equal(info.totals.pinned.outOfDate, 0, 'Pinned out of date total should be 0')
    t.equal(info.totals.pinned.upToDate, 0, 'Pinned up to date total should be 0')
    t.equal(info.totals.unpinned.outOfDate, 1, 'Unpinned out of date total should be 1')
    t.equal(info.totals.unpinned.upToDate, 0, 'Unpinned up to date total should be 0')

    t.end()
  })
})

test('Test single, out of date, pinned dependency', (t) => {
  t.plan(19)

  var deps, updatedDeps, updatedStableDeps

  deps = updatedDeps = updatedStableDeps = {
    foo: {
      required: '1.0.0',
      stable: '2.0.0',
      latest: '2.0.0'
    }
  }

  const brains = createBrains(mockDavid(deps, updatedDeps, updatedStableDeps), mockDb(), mockRegistry(), mockNsp())

  brains.getInfo(mockManifest(deps), (err, info) => {
    t.ifError(err)

    t.ok(info, 'An info object should have been returned')

    // Test deps
    t.ok(info.deps, 'Info object should contain an array of dependencies')
    t.equal(info.deps.length, 1, 'One dependency should have been returned')
    t.equal(info.deps[0].name, 'foo', 'Dependency should have correct name')
    t.equal(info.deps[0].required, deps.foo.required, 'Dependency should have correct required value')
    t.equal(info.deps[0].stable, deps.foo.stable, 'Dependency should have correct stable value')
    t.equal(info.deps[0].latest, deps.foo.latest, 'Dependency should have correct latest value')
    t.equal(info.deps[0].status, 'outofdate', "Dependency status should be 'outofdate'")
    t.equal(info.deps[0].pinned, true, 'Dependency should be flagged as pinned')

    // Test totals
    t.ok(info.totals, 'Info object should contain a totals object')
    t.ok(info.totals.pinned, 'Totals object should contain a pinned object')
    t.ok(info.totals.unpinned, 'Totals object should contain an unpinned object')
    t.equal(info.totals.upToDate, 0, 'Up to date total should be 0')
    t.equal(info.totals.outOfDate, 1, 'Out of date total should be 1')
    t.equal(info.totals.pinned.outOfDate, 1, 'Pinned out of date total should be 1')
    t.equal(info.totals.pinned.upToDate, 0, 'Pinned up to date total should be 0')
    t.equal(info.totals.unpinned.outOfDate, 0, 'Unpinned out of date total should be 0')
    t.equal(info.totals.unpinned.upToDate, 0, 'Unpinned up to date total should be 0')

    t.end()
  })
})

test('Test unstable dependency not flagged as out of date when no stable to upgrade to', (t) => {
  t.plan(19)

  const deps = {
    foo: {
      required: '~0.4.0rc7',
      stable: '0.3.7',
      latest: '0.4.0rc8'
    }
  }

  const updatedDeps = {foo: deps.foo}

  // No stable deps to upgrade to
  const updatedStableDeps = {}

  const brains = createBrains(mockDavid(deps, updatedDeps, updatedStableDeps), mockDb(), mockRegistry(), mockNsp())

  brains.getInfo(mockManifest(deps), (err, info) => {
    t.ifError(err)

    t.ok(info, 'An info object should have been returned')

    // Test deps
    t.ok(info.deps, 'Info object should contain an array of dependencies')
    t.equal(info.deps.length, 1, 'One dependency should have been returned')
    t.equal(info.deps[0].name, 'foo', 'Dependency should have correct name')
    t.equal(info.deps[0].required, deps.foo.required, 'Dependency should have correct required value')
    t.equal(info.deps[0].stable, deps.foo.stable, 'Dependency should have correct stable value')
    t.equal(info.deps[0].latest, deps.foo.latest, 'Dependency should have correct latest value')
    t.equal(info.deps[0].status, 'uptodate', "Dependency status should be 'uptodate'")
    t.equal(info.deps[0].pinned, false, 'Dependency should not be flagged as pinned')

    // Test totals
    t.ok(info.totals, 'Info object should contain a totals object')
    t.ok(info.totals.pinned, 'Totals object should contain a pinned object')
    t.ok(info.totals.unpinned, 'Totals object should contain an unpinned object')
    t.equal(info.totals.upToDate, 1, 'Up to date total should be 1')
    t.equal(info.totals.outOfDate, 0, 'Out of date total should be 0')
    t.equal(info.totals.pinned.outOfDate, 0, 'Pinned out of date total should be 0')
    t.equal(info.totals.pinned.upToDate, 0, 'Pinned up to date total should be 0')
    t.equal(info.totals.unpinned.outOfDate, 0, 'Unpinned out of date total should be 0')
    t.equal(info.totals.unpinned.upToDate, 1, 'Unpinned up to date total should be 1')

    t.end()
  })
})

test('Test 2 dependencies, 1 up to date & unpinned, 1 up to date & unpinned', (t) => {
  t.plan(25)

  var deps, updatedDeps, updatedStableDeps

  deps = {
    foo: {
      required: '~1.0.0',
      stable: '1.0.3',
      latest: '1.0.3'
    },
    bar: {
      required: '*',
      stable: '0.0.4',
      latest: '0.0.5-pre'
    }
  }

  updatedDeps = updatedStableDeps = {}

  const brains = createBrains(mockDavid(deps, updatedDeps, updatedStableDeps), mockDb(), mockRegistry(), mockNsp())

  brains.getInfo(mockManifest(deps), (err, info) => {
    t.ifError(err)

    t.ok(info, 'An info object should have been returned')

    // Test deps
    t.ok(info.deps, 'Info object should contain an array of dependencies')
    t.equal(info.deps.length, 2, 'Two dependencies should have been returned')

    // Expect deps back in this order as brains should sort the array

    t.equal(info.deps[0].name, 'bar', 'Dependency should have correct name')
    t.equal(info.deps[0].required, deps.bar.required, 'Dependency should have correct required value')
    t.equal(info.deps[0].stable, deps.bar.stable, 'Dependency should have correct stable value')
    t.equal(info.deps[0].latest, deps.bar.latest, 'Dependency should have correct latest value')
    t.equal(info.deps[0].status, 'uptodate', "Dependency status should be 'uptodate'")
    t.equal(info.deps[0].pinned, false, 'Dependency should not be flagged as pinned')

    t.equal(info.deps[1].name, 'foo', 'Dependency should have correct name')
    t.equal(info.deps[1].required, deps.foo.required, 'Dependency should have correct required value')
    t.equal(info.deps[1].stable, deps.foo.stable, 'Dependency should have correct stable value')
    t.equal(info.deps[1].latest, deps.foo.latest, 'Dependency should have correct latest value')
    t.equal(info.deps[1].status, 'uptodate', "Dependency status should be 'uptodate'")
    t.equal(info.deps[1].pinned, false, 'Dependency should not be flagged as pinned')

    // Test totals
    t.ok(info.totals, 'Info object should contain a totals object')
    t.ok(info.totals.pinned, 'Totals object should contain a pinned object')
    t.ok(info.totals.unpinned, 'Totals object should contain an unpinned object')
    t.equal(info.totals.upToDate, 2, 'Up to date total should be 2')
    t.equal(info.totals.outOfDate, 0, 'Out of date total should be 0')
    t.equal(info.totals.pinned.outOfDate, 0, 'Pinned out of date total should be 0')
    t.equal(info.totals.pinned.upToDate, 0, 'Pinned up to date total should be 0')
    t.equal(info.totals.unpinned.outOfDate, 0, 'Unpinned out of date total should be 0')
    t.equal(info.totals.unpinned.upToDate, 2, 'Unpinned up to date total should be 2')

    t.end()
  })
})

test('Test 2 dependencies, 1 up to date & unpinned, 1 out of date & unpinned', (t) => {
  t.plan(25)

  var deps, updatedDeps, updatedStableDeps

  deps = {
    foo: {
      required: '~1.0.0',
      stable: '2.0.1',
      latest: '2.0.1'
    },
    bar: {
      required: '*',
      stable: '0.0.4',
      latest: '0.0.5-pre'
    }
  }

  updatedDeps = updatedStableDeps = {}

  // Setup foo as the updated dep
  updatedDeps.foo = deps.foo

  const brains = createBrains(mockDavid(deps, updatedDeps, updatedStableDeps), mockDb(), mockRegistry(), mockNsp())

  brains.getInfo(mockManifest(deps), (err, info) => {
    t.ifError(err)

    t.ok(info, 'An info object should have been returned')

    // Test deps
    t.ok(info.deps, 'Info object should contain an array of dependencies')
    t.equal(info.deps.length, 2, 'Two dependencies should have been returned')

    // Expect deps back in this order as brains should sort the array

    t.equal(info.deps[0].name, 'bar', 'Dependency should have correct name')
    t.equal(info.deps[0].required, deps.bar.required, 'Dependency should have correct required value')
    t.equal(info.deps[0].stable, deps.bar.stable, 'Dependency should have correct stable value')
    t.equal(info.deps[0].latest, deps.bar.latest, 'Dependency should have correct latest value')
    t.equal(info.deps[0].status, 'uptodate', "Dependency status should be 'uptodate'")
    t.equal(info.deps[0].pinned, false, 'Dependency should not be flagged as pinned')

    t.equal(info.deps[1].name, 'foo', 'Dependency should have correct name')
    t.equal(info.deps[1].required, deps.foo.required, 'Dependency should have correct required value')
    t.equal(info.deps[1].stable, deps.foo.stable, 'Dependency should have correct stable value')
    t.equal(info.deps[1].latest, deps.foo.latest, 'Dependency should have correct latest value')
    t.equal(info.deps[1].status, 'outofdate', "Dependency status should be 'outofdate'")
    t.equal(info.deps[1].pinned, false, 'Dependency should not be flagged as pinned')

    // Test totals
    t.ok(info.totals, 'Info object should contain a totals object')
    t.ok(info.totals.pinned, 'Totals object should contain a pinned object')
    t.ok(info.totals.unpinned, 'Totals object should contain an unpinned object')
    t.equal(info.totals.upToDate, 1, 'Up to date total should be 1')
    t.equal(info.totals.outOfDate, 1, 'Out of date total should be 1')
    t.equal(info.totals.pinned.outOfDate, 0, 'Pinned out of date total should be 0')
    t.equal(info.totals.pinned.upToDate, 0, 'Pinned up to date total should be 0')
    t.equal(info.totals.unpinned.outOfDate, 1, 'Unpinned out of date total should be 1')
    t.equal(info.totals.unpinned.upToDate, 1, 'Unpinned up to date total should be 1')

    t.end()
  })
})

test('Test 2 dependencies, 1 out of date & unpinned, 1 out of date & unpinned', (t) => {
  t.plan(25)

  var deps, updatedDeps, updatedStableDeps

  deps = updatedDeps = updatedStableDeps = {
    foo: {
      required: '~1.0.0',
      stable: '2.0.1',
      latest: '2.0.1'
    },
    bar: {
      required: '>=0.1.0 <0.2.2 || >=0.3 <0.3.5',
      stable: '0.4.0',
      latest: '0.5.0-pre'
    }
  }

  const brains = createBrains(mockDavid(deps, updatedDeps, updatedStableDeps), mockDb(), mockRegistry(), mockNsp())

  brains.getInfo(mockManifest(deps), (err, info) => {
    t.ifError(err)

    t.ok(info, 'An info object should have been returned')

    // Test deps
    t.ok(info.deps, 'Info object should contain an array of dependencies')
    t.equal(info.deps.length, 2, 'Two dependencies should have been returned')

    // Expect deps back in this order as brains should sort the array

    t.equal(info.deps[0].name, 'bar', 'Dependency should have correct name')
    t.equal(info.deps[0].required, deps.bar.required, 'Dependency should have correct required value')
    t.equal(info.deps[0].stable, deps.bar.stable, 'Dependency should have correct stable value')
    t.equal(info.deps[0].latest, deps.bar.latest, 'Dependency should have correct latest value')
    t.equal(info.deps[0].status, 'outofdate', "Dependency status should be 'outofdate'")
    t.equal(info.deps[0].pinned, false, 'Dependency should not be flagged as pinned')

    t.equal(info.deps[1].name, 'foo', 'Dependency should have correct name')
    t.equal(info.deps[1].required, deps.foo.required, 'Dependency should have correct required value')
    t.equal(info.deps[1].stable, deps.foo.stable, 'Dependency should have correct stable value')
    t.equal(info.deps[1].latest, deps.foo.latest, 'Dependency should have correct latest value')
    t.equal(info.deps[1].status, 'outofdate', "Dependency status should be 'outofdate'")
    t.equal(info.deps[1].pinned, false, 'Dependency should not be flagged as pinned')

    // Test totals
    t.ok(info.totals, 'Info object should contain a totals object')
    t.ok(info.totals.pinned, 'Totals object should contain a pinned object')
    t.ok(info.totals.unpinned, 'Totals object should contain an unpinned object')
    t.equal(info.totals.upToDate, 0, 'Up to date total should be 0')
    t.equal(info.totals.outOfDate, 2, 'Out of date total should be 2')
    t.equal(info.totals.pinned.outOfDate, 0, 'Pinned out of date total should be 0')
    t.equal(info.totals.pinned.upToDate, 0, 'Pinned up to date total should be 0')
    t.equal(info.totals.unpinned.outOfDate, 2, 'Unpinned out of date total should be 2')
    t.equal(info.totals.unpinned.upToDate, 0, 'Unpinned up to date total should be 0')

    t.end()
  })
})

test('Test 2 dependencies, 1 up to date & pinned, 1 up to date & pinned', (t) => {
  t.plan(25)

  var deps, updatedDeps, updatedStableDeps

  deps = {
    foo: {
      required: '1.0.0',
      stable: '1.0.0',
      latest: '1.0.0'
    },
    bar: {
      required: '0.0.1',
      stable: '0.0.1',
      latest: '0.0.1'
    }
  }

  updatedDeps = updatedStableDeps = {}

  const brains = createBrains(mockDavid(deps, updatedDeps, updatedStableDeps), mockDb(), mockRegistry(), mockNsp())

  brains.getInfo(mockManifest(deps), (err, info) => {
    t.ifError(err)

    t.ok(info, 'An info object should have been returned')

    // Test deps
    t.ok(info.deps, 'Info object should contain an array of dependencies')
    t.equal(info.deps.length, 2, 'Two dependencies should have been returned')

    // Expect deps back in this order as brains should sort the array

    t.equal(info.deps[0].name, 'bar', 'Dependency should have correct name')
    t.equal(info.deps[0].required, deps.bar.required, 'Dependency should have correct required value')
    t.equal(info.deps[0].stable, deps.bar.stable, 'Dependency should have correct stable value')
    t.equal(info.deps[0].latest, deps.bar.latest, 'Dependency should have correct latest value')
    t.equal(info.deps[0].status, 'uptodate', "Dependency status should be 'uptodate'")
    t.equal(info.deps[0].pinned, true, 'Dependency should be flagged as pinned')

    t.equal(info.deps[1].name, 'foo', 'Dependency should have correct name')
    t.equal(info.deps[1].required, deps.foo.required, 'Dependency should have correct required value')
    t.equal(info.deps[1].stable, deps.foo.stable, 'Dependency should have correct stable value')
    t.equal(info.deps[1].latest, deps.foo.latest, 'Dependency should have correct latest value')
    t.equal(info.deps[1].status, 'uptodate', "Dependency status should be 'uptodate'")
    t.equal(info.deps[1].pinned, true, 'Dependency should be flagged as pinned')

    // Test totals
    t.ok(info.totals, 'Info object should contain a totals object')
    t.ok(info.totals.pinned, 'Totals object should contain a pinned object')
    t.ok(info.totals.unpinned, 'Totals object should contain an unpinned object')
    t.equal(info.totals.upToDate, 2, 'Up to date total should be 2')
    t.equal(info.totals.outOfDate, 0, 'Out of date total should be 0')
    t.equal(info.totals.pinned.outOfDate, 0, 'Pinned out of date total should be 0')
    t.equal(info.totals.pinned.upToDate, 2, 'Pinned up to date total should be 2')
    t.equal(info.totals.unpinned.outOfDate, 0, 'Unpinned out of date total should be 0')
    t.equal(info.totals.unpinned.upToDate, 0, 'Unpinned up to date total should be 0')

    t.end()
  })
})

test('Test 2 dependencies, 1 up to date & pinned, 1 out of date & pinned', (t) => {
  t.plan(25)

  var deps, updatedDeps, updatedStableDeps

  deps = {
    foo: {
      required: '1.0.0',
      stable: '1.0.0',
      latest: '1.0.0'
    },
    bar: {
      required: '0.0.1',
      stable: '0.0.2',
      latest: '0.0.2'
    }
  }

  updatedDeps = updatedStableDeps = {}

  // Setup bar as the updated dep
  updatedDeps.bar = deps.bar

  const brains = createBrains(mockDavid(deps, updatedDeps, updatedStableDeps), mockDb(), mockRegistry(), mockNsp())

  brains.getInfo(mockManifest(deps), (err, info) => {
    t.ifError(err)

    t.ok(info, 'An info object should have been returned')

    // Test deps
    t.ok(info.deps, 'Info object should contain an array of dependencies')
    t.equal(info.deps.length, 2, 'Two dependencies should have been returned')

    // Expect deps back in this order as brains should sort the array

    t.equal(info.deps[0].name, 'bar', 'Dependency should have correct name')
    t.equal(info.deps[0].required, deps.bar.required, 'Dependency should have correct required value')
    t.equal(info.deps[0].stable, deps.bar.stable, 'Dependency should have correct stable value')
    t.equal(info.deps[0].latest, deps.bar.latest, 'Dependency should have correct latest value')
    t.equal(info.deps[0].status, 'outofdate', "Dependency status should be 'outofdate'")
    t.equal(info.deps[0].pinned, true, 'Dependency should be flagged as pinned')

    t.equal(info.deps[1].name, 'foo', 'Dependency should have correct name')
    t.equal(info.deps[1].required, deps.foo.required, 'Dependency should have correct required value')
    t.equal(info.deps[1].stable, deps.foo.stable, 'Dependency should have correct stable value')
    t.equal(info.deps[1].latest, deps.foo.latest, 'Dependency should have correct latest value')
    t.equal(info.deps[1].status, 'uptodate', "Dependency status should be 'uptodate'")
    t.equal(info.deps[1].pinned, true, 'Dependency should be flagged as pinned')

    // Test totals
    t.ok(info.totals, 'Info object should contain a totals object')
    t.ok(info.totals.pinned, 'Totals object should contain a pinned object')
    t.ok(info.totals.unpinned, 'Totals object should contain an unpinned object')
    t.equal(info.totals.upToDate, 1, 'Up to date total should be 1')
    t.equal(info.totals.outOfDate, 1, 'Out of date total should be 1')
    t.equal(info.totals.pinned.outOfDate, 1, 'Pinned out of date total should be 1')
    t.equal(info.totals.pinned.upToDate, 1, 'Pinned up to date total should be 1')
    t.equal(info.totals.unpinned.outOfDate, 0, 'Unpinned out of date total should be 0')
    t.equal(info.totals.unpinned.upToDate, 0, 'Unpinned up to date total should be 0')

    t.end()
  })
})

test('Test 2 dependencies, 1 out of date & pinned, 1 out of date & pinned', (t) => {
  t.plan(25)

  var deps, updatedDeps, updatedStableDeps

  deps = updatedDeps = updatedStableDeps = {
    foo: {
      required: '1.0.0',
      stable: '3.0.0',
      latest: '3.0.0'
    },
    bar: {
      required: '0.0.1',
      stable: '0.0.2',
      latest: '0.0.2'
    }
  }

  const brains = createBrains(mockDavid(deps, updatedDeps, updatedStableDeps), mockDb(), mockRegistry(), mockNsp())

  brains.getInfo(mockManifest(deps), (err, info) => {
    t.ifError(err)

    t.ok(info, 'An info object should have been returned')

    // Test deps
    t.ok(info.deps, 'Info object should contain an array of dependencies')
    t.equal(info.deps.length, 2, 'Two dependencies should have been returned')

    // Expect deps back in this order as brains should sort the array

    t.equal(info.deps[0].name, 'bar', 'Dependency should have correct name')
    t.equal(info.deps[0].required, deps.bar.required, 'Dependency should have correct required value')
    t.equal(info.deps[0].stable, deps.bar.stable, 'Dependency should have correct stable value')
    t.equal(info.deps[0].latest, deps.bar.latest, 'Dependency should have correct latest value')
    t.equal(info.deps[0].status, 'outofdate', "Dependency status should be 'outofdate'")
    t.equal(info.deps[0].pinned, true, 'Dependency should be flagged as pinned')

    t.equal(info.deps[1].name, 'foo', 'Dependency should have correct name')
    t.equal(info.deps[1].required, deps.foo.required, 'Dependency should have correct required value')
    t.equal(info.deps[1].stable, deps.foo.stable, 'Dependency should have correct stable value')
    t.equal(info.deps[1].latest, deps.foo.latest, 'Dependency should have correct latest value')
    t.equal(info.deps[1].status, 'outofdate', "Dependency status should be 'outofdate'")
    t.equal(info.deps[1].pinned, true, 'Dependency should be flagged as pinned')

    // Test totals
    t.ok(info.totals, 'Info object should contain a totals object')
    t.ok(info.totals.pinned, 'Totals object should contain a pinned object')
    t.ok(info.totals.unpinned, 'Totals object should contain an unpinned object')
    t.equal(info.totals.upToDate, 0, 'Up to date total should be 0')
    t.equal(info.totals.outOfDate, 2, 'Out of date total should be 2')
    t.equal(info.totals.pinned.outOfDate, 2, 'Pinned out of date total should be 2')
    t.equal(info.totals.pinned.upToDate, 0, 'Pinned up to date total should be 0')
    t.equal(info.totals.unpinned.outOfDate, 0, 'Unpinned out of date total should be 0')
    t.equal(info.totals.unpinned.upToDate, 0, 'Unpinned up to date total should be 0')

    t.end()
  })
})

test('Test 2 dependencies, 1 up to date & unpinned, 1 up to date & pinned', (t) => {
  t.plan(25)

  var deps, updatedDeps, updatedStableDeps

  deps = {
    foo: {
      required: '~1.0.0',
      stable: '1.0.3',
      latest: '1.0.3'
    },
    bar: {
      required: '0.0.2',
      stable: '0.0.2',
      latest: '0.0.2'
    }
  }

  updatedDeps = updatedStableDeps = {}

  const brains = createBrains(mockDavid(deps, updatedDeps, updatedStableDeps), mockDb(), mockRegistry(), mockNsp())

  brains.getInfo(mockManifest(deps), (err, info) => {
    t.ifError(err)

    t.ok(info, 'An info object should have been returned')

    // Test deps
    t.ok(info.deps, 'Info object should contain an array of dependencies')
    t.equal(info.deps.length, 2, 'Two dependencies should have been returned')

    // Expect deps back in this order as brains should sort the array

    t.equal(info.deps[0].name, 'bar', 'Dependency should have correct name')
    t.equal(info.deps[0].required, deps.bar.required, 'Dependency should have correct required value')
    t.equal(info.deps[0].stable, deps.bar.stable, 'Dependency should have correct stable value')
    t.equal(info.deps[0].latest, deps.bar.latest, 'Dependency should have correct latest value')
    t.equal(info.deps[0].status, 'uptodate', "Dependency status should be 'uptodate'")
    t.equal(info.deps[0].pinned, true, 'Dependency should be flagged as pinned')

    t.equal(info.deps[1].name, 'foo', 'Dependency should have correct name')
    t.equal(info.deps[1].required, deps.foo.required, 'Dependency should have correct required value')
    t.equal(info.deps[1].stable, deps.foo.stable, 'Dependency should have correct stable value')
    t.equal(info.deps[1].latest, deps.foo.latest, 'Dependency should have correct latest value')
    t.equal(info.deps[1].status, 'uptodate', "Dependency status should be 'uptodate'")
    t.equal(info.deps[1].pinned, false, 'Dependency should not be flagged as pinned')

    // Test totals
    t.ok(info.totals, 'Info object should contain a totals object')
    t.ok(info.totals.pinned, 'Totals object should contain a pinned object')
    t.ok(info.totals.unpinned, 'Totals object should contain an unpinned object')
    t.equal(info.totals.upToDate, 2, 'Up to date total should be 2')
    t.equal(info.totals.outOfDate, 0, 'Out of date total should be 0')
    t.equal(info.totals.pinned.outOfDate, 0, 'Pinned out of date total should be 0')
    t.equal(info.totals.pinned.upToDate, 1, 'Pinned up to date total should be 1')
    t.equal(info.totals.unpinned.outOfDate, 0, 'Unpinned out of date total should be 0')
    t.equal(info.totals.unpinned.upToDate, 1, 'Unpinned up to date total should be 1')

    t.end()
  })
})

test('Test 2 dependencies, 1 up to date & unpinned, 1 out of date & pinned', (t) => {
  t.plan(25)

  var deps, updatedDeps, updatedStableDeps

  deps = {
    foo: {
      required: '~1.0.0',
      stable: '1.0.3',
      latest: '1.0.3'
    },
    bar: {
      required: '0.0.2',
      stable: '0.0.4',
      latest: '0.0.5-alpha'
    }
  }

  updatedDeps = updatedStableDeps = {}

  updatedDeps.bar = deps.bar

  const brains = createBrains(mockDavid(deps, updatedDeps, updatedStableDeps), mockDb(), mockRegistry(), mockNsp())

  brains.getInfo(mockManifest(deps), (err, info) => {
    t.ifError(err)

    t.ok(info, 'An info object should have been returned')

    // Test deps
    t.ok(info.deps, 'Info object should contain an array of dependencies')
    t.equal(info.deps.length, 2, 'Two dependencies should have been returned')

    // Expect deps back in this order as brains should sort the array

    t.equal(info.deps[0].name, 'bar', 'Dependency should have correct name')
    t.equal(info.deps[0].required, deps.bar.required, 'Dependency should have correct required value')
    t.equal(info.deps[0].stable, deps.bar.stable, 'Dependency should have correct stable value')
    t.equal(info.deps[0].latest, deps.bar.latest, 'Dependency should have correct latest value')
    t.equal(info.deps[0].status, 'outofdate', "Dependency status should be 'outofdate'")
    t.equal(info.deps[0].pinned, true, 'Dependency should be flagged as pinned')

    t.equal(info.deps[1].name, 'foo', 'Dependency should have correct name')
    t.equal(info.deps[1].required, deps.foo.required, 'Dependency should have correct required value')
    t.equal(info.deps[1].stable, deps.foo.stable, 'Dependency should have correct stable value')
    t.equal(info.deps[1].latest, deps.foo.latest, 'Dependency should have correct latest value')
    t.equal(info.deps[1].status, 'uptodate', "Dependency status should be 'uptodate'")
    t.equal(info.deps[1].pinned, false, 'Dependency should not be flagged as pinned')

    // Test totals
    t.ok(info.totals, 'Info object should contain a totals object')
    t.ok(info.totals.pinned, 'Totals object should contain a pinned object')
    t.ok(info.totals.unpinned, 'Totals object should contain an unpinned object')
    t.equal(info.totals.upToDate, 1, 'Up to date total should be 1')
    t.equal(info.totals.outOfDate, 1, 'Out of date total should be 1')
    t.equal(info.totals.pinned.outOfDate, 1, 'Pinned out of date total should be 1')
    t.equal(info.totals.pinned.upToDate, 0, 'Pinned up to date total should be 0')
    t.equal(info.totals.unpinned.outOfDate, 0, 'Unpinned out of date total should be 0')
    t.equal(info.totals.unpinned.upToDate, 1, 'Unpinned up to date total should be 1')

    t.end()
  })
})

test('Test 2 dependencies, 1 up to date & pinned, 1 out of date & unpinned', (t) => {
  t.plan(25)

  var deps, updatedDeps, updatedStableDeps

  deps = {
    foo: {
      required: '~1.0.0',
      stable: '1.1.1',
      latest: '1.1.1'
    },
    bar: {
      required: '0.0.2',
      stable: '0.0.2',
      latest: '0.0.2'
    }
  }

  updatedDeps = updatedStableDeps = {}

  updatedDeps.foo = deps.foo

  const brains = createBrains(mockDavid(deps, updatedDeps, updatedStableDeps), mockDb(), mockRegistry(), mockNsp())

  brains.getInfo(mockManifest(deps), (err, info) => {
    t.ifError(err)

    t.ok(info, 'An info object should have been returned')

    // Test deps
    t.ok(info.deps, 'Info object should contain an array of dependencies')
    t.equal(info.deps.length, 2, 'Two dependencies should have been returned')

    // Expect deps back in this order as brains should sort the array

    t.equal(info.deps[0].name, 'bar', 'Dependency should have correct name')
    t.equal(info.deps[0].required, deps.bar.required, 'Dependency should have correct required value')
    t.equal(info.deps[0].stable, deps.bar.stable, 'Dependency should have correct stable value')
    t.equal(info.deps[0].latest, deps.bar.latest, 'Dependency should have correct latest value')
    t.equal(info.deps[0].status, 'uptodate', "Dependency status should be 'uptodate'")
    t.equal(info.deps[0].pinned, true, 'Dependency should be flagged as pinned')

    t.equal(info.deps[1].name, 'foo', 'Dependency should have correct name')
    t.equal(info.deps[1].required, deps.foo.required, 'Dependency should have correct required value')
    t.equal(info.deps[1].stable, deps.foo.stable, 'Dependency should have correct stable value')
    t.equal(info.deps[1].latest, deps.foo.latest, 'Dependency should have correct latest value')
    t.equal(info.deps[1].status, 'outofdate', "Dependency status should be 'outofdate'")
    t.equal(info.deps[1].pinned, false, 'Dependency should not be flagged as pinned')

    // Test totals
    t.ok(info.totals, 'Info object should contain a totals object')
    t.ok(info.totals.pinned, 'Totals object should contain a pinned object')
    t.ok(info.totals.unpinned, 'Totals object should contain an unpinned object')
    t.equal(info.totals.upToDate, 1, 'Up to date total should be 1')
    t.equal(info.totals.outOfDate, 1, 'Out of date total should be 1')
    t.equal(info.totals.pinned.outOfDate, 0, 'Pinned out of date total should be 0')
    t.equal(info.totals.pinned.upToDate, 1, 'Pinned up to date total should be 1')
    t.equal(info.totals.unpinned.outOfDate, 1, 'Unpinned out of date total should be 1')
    t.equal(info.totals.unpinned.upToDate, 0, 'Unpinned up to date total should be 0')

    t.end()
  })
})

test('Test 2 dependencies, 1 out of date & pinned, 1 out of date & unpinned', (t) => {
  t.plan(25)

  var deps, updatedDeps, updatedStableDeps

  deps = updatedDeps = updatedStableDeps = {
    foo: {
      required: '~1.0.0',
      stable: '1.1.1',
      latest: '1.1.1'
    },
    bar: {
      required: '0.0.2',
      stable: '0.0.3',
      latest: '0.0.4rc0'
    }
  }

  const brains = createBrains(mockDavid(deps, updatedDeps, updatedStableDeps), mockDb(), mockRegistry(), mockNsp())

  brains.getInfo(mockManifest(deps), (err, info) => {
    t.ifError(err)

    t.ok(info, 'An info object should have been returned')

    // Test deps
    t.ok(info.deps, 'Info object should contain an array of dependencies')
    t.equal(info.deps.length, 2, 'Two dependencies should have been returned')

    // Expect deps back in this order as brains should sort the array

    t.equal(info.deps[0].name, 'bar', 'Dependency should have correct name')
    t.equal(info.deps[0].required, deps.bar.required, 'Dependency should have correct required value')
    t.equal(info.deps[0].stable, deps.bar.stable, 'Dependency should have correct stable value')
    t.equal(info.deps[0].latest, deps.bar.latest, 'Dependency should have correct latest value')
    t.equal(info.deps[0].status, 'outofdate', "Dependency status should be 'outofdate'")
    t.equal(info.deps[0].pinned, true, 'Dependency should be flagged as pinned')

    t.equal(info.deps[1].name, 'foo', 'Dependency should have correct name')
    t.equal(info.deps[1].required, deps.foo.required, 'Dependency should have correct required value')
    t.equal(info.deps[1].stable, deps.foo.stable, 'Dependency should have correct stable value')
    t.equal(info.deps[1].latest, deps.foo.latest, 'Dependency should have correct latest value')
    t.equal(info.deps[1].status, 'outofdate', "Dependency status should be 'outofdate'")
    t.equal(info.deps[1].pinned, false, 'Dependency should not be flagged as pinned')

    // Test totals
    t.ok(info.totals, 'Info object should contain a totals object')
    t.ok(info.totals.pinned, 'Totals object should contain a pinned object')
    t.ok(info.totals.unpinned, 'Totals object should contain an unpinned object')
    t.equal(info.totals.upToDate, 0, 'Up to date total should be 0')
    t.equal(info.totals.outOfDate, 2, 'Out of date total should be 2')
    t.equal(info.totals.pinned.outOfDate, 1, 'Pinned out of date total should be 1')
    t.equal(info.totals.pinned.upToDate, 0, 'Pinned up to date total should be 0')
    t.equal(info.totals.unpinned.outOfDate, 1, 'Unpinned out of date total should be 1')
    t.equal(info.totals.unpinned.upToDate, 0, 'Unpinned up to date total should be 0')

    t.end()
  })
})
