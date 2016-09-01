import React from 'react'
import { connect } from 'react-redux'
import cycle from 'cycle'
import d3 from 'd3'
import { requestDependencyGraph } from '../../actions'
import Loading from '../loading.jsx'

const diagonal = d3.svg.diagonal().projection(({ x, y }) => [y, x])
let id = 0 // For nodes with no ID

const DependencyGraph = React.createClass({
  propTypes: {
    project: React.PropTypes.shape({
      user: React.PropTypes.string.isRequired,
      repo: React.PropTypes.string.isRequired,
      path: React.PropTypes.string,
      ref: React.PropTypes.string,
      type: React.PropTypes.string
    }).isRequired,
    requestDependencyGraph: React.PropTypes.func,
    dependencyGraph: React.PropTypes.object
  },

  componentDidMount () {
    this.props.requestDependencyGraph(this.props.project)
  },

  render () {
    return (
      <div>
        {this.props.dependencyGraph
          ? <div className='dep-graph' ref={(r) => { this.graphContainer = r }} />
          : <Loading />}
      </div>
    )
  },

  componentDidUpdate () {
    const data = this.props.dependencyGraph
    if (!data) return

    transformData(cycle.retrocycle(data), (err, root) => {
      if (err) return console.error('Failed to transform data', err)

      // Initialize the display to show the first level of nodes
      root.children.forEach(toggleChildren)

      const vis = createGraph(this.graphContainer)
      updateGraph(vis, root)
    })
  }
})

// Transform data from possibly cyclic structure into max 10 levels deep visual structure
function transformData (rootDep, cb) {
  let transformsCount = 0
  const rootNode = createNode(rootDep)

  // Avoid "too much recursion" errors
  function scheduleTransform (dep, node, level, maxLevel) {
    transformsCount++

    setTimeout(() => {
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

    dep.dependencies.forEach((depDep) => {
      const node = createNode(depDep)

      if (level < maxLevel) {
        scheduleTransform(depDep, node, level + 1, maxLevel)
      }

      parentNode.children = parentNode.children || []
      parentNode.children.push(node)
    })

    if (parentNode.children) {
      parentNode.children = parentNode.children.sort(sortByName)
    }
  }

  transform(rootDep, rootNode)
}

function createNode ({ name, version }) {
  return { name, version, children: null }
}

function sortByName (a, b) {
  if (a.name < b.name) {
    return -1
  } else if (a.name > b.name) {
    return 1
  }
  return 0
}

// Toggle children
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

function createGraph (container) {
  const margin = [20, 120, 20, 120]
  const width = container.clientWidth - margin[1] - margin[3]
  const height = 768 - margin[0] - margin[2]
  const layout = d3.layout.tree().size([height, width])

  const svg = d3.select(container).append('svg:svg')
    .attr('width', width + margin[1] + margin[3])
    .attr('height', height + margin[0] + margin[2])
    .append('svg:g')
    .attr('transform', `translate(${margin[3]}, ${margin[0]})`)

  return { svg, margin, width, height, layout }
}

function updateGraph (vis, root, source) {
  source = source || root

  root.x0 = vis.height / 2
  root.y0 = 0

  const duration = d3.event && d3.event.altKey ? 5000 : 500

  // Compute the new tree layout.
  const nodes = vis.layout.nodes(root).reverse()

  // Normalize for fixed-depth.
  nodes.forEach((d) => {
    d.y = d.depth * 180
  })

  // Update the nodes...
  const node = vis.svg.selectAll('g.node').data(nodes, (d) => {
    d.id = d.id || ++id
    return d.id
  })

  // Enter any new nodes at the parent"s previous position.
  const nodeEnter = node.enter().append('svg:g')
    .attr('class', 'node')
    .attr('transform', () => `translate(${source.y0}, ${source.x0})`)
    .on('click', (d) => {
      toggle(d)
      updateGraph(vis, root, d)
    })

  nodeEnter.append('svg:circle')
    .attr('r', 0.000001)
    .style('fill', (d) => d._children ? '#ccc' : '#fff')

  nodeEnter.append('svg:text')
    .attr('x', (d) => d.children || d._children ? -10 : 10)
    .attr('dy', '.25em')
    .attr('text-anchor', (d) => d.children || d._children ? 'end' : 'start')
    .text((d) => d.name + ' ' + d.version)
    .style('fill-opacity', 0.000001)

  // Transition nodes to their new position.
  const nodeUpdate = node.transition().duration(duration)
    .attr('transform', (d) => `translate(${d.y}, ${d.x})`)

  nodeUpdate.select('circle').attr('r', 4.5).style('fill', (d) => d._children ? '#ccc' : '#fff')
  nodeUpdate.select('text').style('fill-opacity', 1)

  const nodeExit = node.exit().transition().duration(duration)
    .attr('transform', () => `translate(${source.y}, ${source.x})`).remove()

  // Transition exiting nodes to the parent's new position.
  nodeExit.select('circle').attr('r', 0.000001)
  nodeExit.select('text').style('fill-opacity', 0.000001)

  // Update the links...
  const link = vis.svg.selectAll('path.link').data(vis.layout.links(nodes), (d) => d.target.id)

  // Enter any new links at the parent's previous position.
  link.enter().insert('svg:path', 'g').attr('class', 'link').attr('d', () => {
    const o = { x: source.x0, y: source.y0 }
    return diagonal({ source: o, target: o })
  }).transition().duration(duration).attr('d', diagonal)

  // Transition links to their new position.
  link.transition().duration(duration).attr('d', diagonal)

  // Transition exiting nodes to the parent's new position.
  link.exit().transition().duration(duration).attr('d', () => {
    const o = { x: source.x, y: source.y }
    return diagonal({ source: o, target: o })
  }).remove()

  // Stash the old positions for transition.
  nodes.forEach((d) => {
    d.x0 = d.x
    d.y0 = d.y
  })
}

const mapStateToProps = ({ dependencyGraph }) => ({ dependencyGraph })

const mapDispatchToProps = (dispatch) => {
  return { requestDependencyGraph: (params) => dispatch(requestDependencyGraph(params)) }
}

export default connect(mapStateToProps, mapDispatchToProps)(DependencyGraph)
