var d3 = require('d3')
var $ = require('jquery')

var diagonal = d3.svg.diagonal().projection(function (d) { return [d.y, d.x] })
var id = 0 // For nodes with no ID

function create (container) {
  var m = [20, 120, 20, 120]
  var w = parseInt($(window).width() - $('#main').position().left, 10) - m[1] - m[3]
  var h = 768 - m[0] - m[2]
  var tree = d3.layout.tree().size([h, w])

  var graphContainer = d3.select($('.dep-graph', container)[0]).append('svg:svg')
    .attr('width', w + m[1] + m[3])
    .attr('height', h + m[0] + m[2])
    .append('svg:g')
    .attr('transform', 'translate(' + m[3] + ',' + m[0] + ')')

  return {
    container: graphContainer,
    margin: m,
    width: w,
    height: h,
    layout: tree
  }
}

module.exports.create = create

function update (vis, root, source) {
  source = source || root

  root.x0 = vis.height / 2
  root.y0 = 0

  var duration = d3.event && d3.event.altKey ? 5000 : 500

  // Compute the new tree layout.
  var nodes = vis.layout.nodes(root).reverse()

  // Normalize for fixed-depth.
  nodes.forEach(function (d) {
    d.y = d.depth * 180
  })

  // Update the nodes...
  var node = vis.container.selectAll('g.node').data(nodes, function (d) {
    return d.id ? d.id : d.id = ++id
  })

  // Enter any new nodes at the parent"s previous position.
  var nodeEnter = node.enter().append('svg:g').attr('class', 'node').attr('transform', function () {
    return 'translate(' + source.y0 + ',' + source.x0 + ')'
  }).on('click', function (d) {
    toggle(d)
    update(vis, root, d)
  })

  nodeEnter.append('svg:circle').attr('r', 0.000001).style('fill', function (d) {
    return d._children ? '#ccc' : '#fff'
  })

  nodeEnter.append('svg:text').attr('x', function (d) {
    return d.children || d._children ? -10 : 10
  }).attr('dy', '.25em').attr('text-anchor', function (d) {
    return d.children || d._children ? 'end' : 'start'
  }).text(function (d) {
    return d.name + ' ' + d.version
  }).style('fill-opacity', 0.000001)

  // Transition nodes to their new position.
  var nodeUpdate = node.transition().duration(duration).attr('transform', function (d) {
    return 'translate(' + d.y + ',' + d.x + ')'
  })

  nodeUpdate.select('circle').attr('r', 4.5).style('fill', function (d) {
    return d._children ? '#ccc' : '#fff'
  })

  nodeUpdate.select('text').style('fill-opacity', 1)

  var nodeExit = node.exit().transition().duration(duration).attr('transform', function () {
    return 'translate(' + source.y + ',' + source.x + ')'
  }).remove()

  // Transition exiting nodes to the parent's new position.
  nodeExit.select('circle').attr('r', 0.000001)
  nodeExit.select('text').style('fill-opacity', 0.000001)

  // Update the links...
  var link = vis.container.selectAll('path.link').data(vis.layout.links(nodes), function (d) {
    return d.target.id
  })

  // Enter any new links at the parent's previous position.
  link.enter().insert('svg:path', 'g').attr('class', 'link').attr('d', function () {
    var o = {
      x: source.x0,
      y: source.y0
    }
    return diagonal({
      source: o,
      target: o
    })
  }).transition().duration(duration).attr('d', diagonal)

  // Transition links to their new position.
  link.transition().duration(duration).attr('d', diagonal)

  // Transition exiting nodes to the parent's new position.
  link.exit().transition().duration(duration).attr('d', function () {
    var o = {
      x: source.x,
      y: source.y
    }
    return diagonal({
      source: o,
      target: o
    })
  }).remove()

  // Stash the old positions for transition.
  nodes.forEach(function (d) {
    d.x0 = d.x
    d.y0 = d.y
  })
}

module.exports.update = update

// Toggle children.
function toggle (d) {
  if (d.children) {
    d._children = d.children
    d.children = null
  } else {
    d.children = d._children
    d._children = null
  }
}

function toggleChildren (d) {
  if (d.children) {
    d.children.forEach(toggleChildren)
    toggle(d)
  }
}

module.exports.toggleChildren = toggleChildren
