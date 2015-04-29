function createNode (dep) {
  return {
    name: dep.name,
    version: dep.version,
    children: null
  }
}

function sortByName (a, b) {
  if (a.name < b.name) {
    return -1
  } else if (a.name > b.name) {
    return 1
  }
  return 0
}

/**
 * Transform data from possibly cyclic structure into max 10 levels deep visual structure
 */
module.exports = function (rootDep, cb) {
  var transformsCount = 0
    , rootNode = createNode(rootDep)

  // Avoid "too much recursion" errors
  function scheduleTransform (dep, node, level, maxLevel) {
    transformsCount++

    setTimeout(function () {
      transform(dep, node, level, maxLevel)
      transformsCount--

      if (!transformsCount) {
        cb(null, rootNode)
      }
    }, 0)
  }

  function transform (dep, parentNode, level, maxLevel) {
    level = level || 0
    maxLevel = maxLevel || 10

    $.each(dep.deps, function (depName, depDep) {
      var node = createNode(depDep)

      if (level < maxLevel) {
        scheduleTransform(depDep, node, level + 1, maxLevel)
      }

      if (!parentNode.children) {
        parentNode.children = []
      }

      parentNode.children.push(node)
    })

    if (parentNode.children) {
      parentNode.children = parentNode.children.sort(sortByName)
    }
  }

  transform(rootDep, rootNode)
}