var registry = require("./registry")
  , manifest = require("./manifest")

// Recently updated packages //////////////////////////////////////////////////

function UpdatedPackage (name, version, previous) {
  this.name = name
  this.version = version
  this.previous = previous
}

var recentlyUpdatedPackages = []

registry.on("change", function (change) {
  if (!change.doc.versions) {
    return
  }

  var versions = Object.keys(change.doc.versions)

  if (versions.length < 2) {
    return
  }

  var pkg = new UpdatedPackage(change.doc.name, versions[versions.length - 1], versions[versions.length - 2])

  for (var i = 0; i < recentlyUpdatedPackages.length; i++) {
    if (recentlyUpdatedPackages[i].name === pkg.name) {
      recentlyUpdatedPackages.splice(i, 1)
      break
    }
  }

  recentlyUpdatedPackages.unshift(pkg)

  if (recentlyUpdatedPackages.length > 10) {
    recentlyUpdatedPackages.pop()
  }
})

exports.getRecentlyUpdatedPackages = function () {
  return recentlyUpdatedPackages.slice()
}

// Recently retrieved manifests ///////////////////////////////////////////////

function RetrievedManifest (manifest, user, repo, path, ref) {
  this.manifest = manifest
  this.user = user
  this.repo = repo
  this.path = path
  this.ref = ref
}

var recentlyRetrievedManifests = []

manifest.on("retrieve", function (manifest, user, repo, path, ref, isPrivate) {
  if (isPrivate) return

  var inList = false

  for (var i = 0; i < recentlyRetrievedManifests.length; ++i) {
    if (
      recentlyRetrievedManifests[i].user === user &&
      recentlyRetrievedManifests[i].repo === repo &&
      recentlyRetrievedManifests[i].path === path &&
      recentlyRetrievedManifests[i].ref === ref
    ) {
      recentlyRetrievedManifests.splice(i, 1)
      inList = true
      break
    }
  }

  recentlyRetrievedManifests.unshift(new RetrievedManifest(manifest, user, repo, path, ref))

  if (!inList && recentlyRetrievedManifests.length > 10) {
    recentlyRetrievedManifests.pop()
  }
})

exports.getRecentlyRetrievedManifests = function () {
  return recentlyRetrievedManifests.slice()
}

// Recently updated manifests /////////////////////////////////////////////////

function UpdatedManifest (diffs, manifest, user, repo, path, ref) {
  this.diffs = diffs
  this.manifest = manifest
  this.user = user
  this.repo = repo
  this.path = path
  this.ref = ref
}

var recentlyUpdatedManifests = []

manifest.on("dependenciesChange", function (diffs, manifest, user, repo, path, ref, isPrivate) {
  if (isPrivate) return

  recentlyUpdatedManifests.unshift(new UpdatedManifest(diffs, manifest, user, repo, path, ref))

  if (recentlyUpdatedManifests.length > 10) {
    recentlyUpdatedManifests.pop()
  }
})

exports.getRecentlyUpdatedManifests = function () {
  return recentlyUpdatedManifests.slice()
}

// Dependency counts //////////////////////////////////////////////////////////

var dependencyCounts = {}

// When manifest first retrieved, +1 all the dependencies
manifest.on("retrieve", function (manifest) {
  var depNames = Object.keys(manifest.dependencies || {})

  depNames.forEach(function (depName) {
    dependencyCounts[depName] = dependencyCounts[depName] || 0
    dependencyCounts[depName]++
  })
})

// If the manifest dependencies change, +1 or -1 if dependencies are added or removed
manifest.on("dependenciesChange", function (diffs) {
  diffs.forEach(function (diff) {

    // Dependency added
    if (!diff.previous) {
      dependencyCounts[diff.name] = dependencyCounts[diff.name] || 0
      dependencyCounts[diff.name]++
    }

    // Dependency removed
    if (diff.version === null) {
      dependencyCounts[diff.name]--

      if (dependencyCounts[diff.name] < 1) {
        delete dependencyCounts[diff.name]
      }
    }
  })
})

exports.getDependencyCounts = function () {
  return JSON.parse(JSON.stringify(dependencyCounts))
}
