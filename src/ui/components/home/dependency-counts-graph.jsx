import React from 'react'
import { connect } from 'react-redux'
import d3 from 'd3'
import { requestDependencyCounts } from '../../actions'

const DependencyCountsGraph = React.createClass({
  propTypes: {
    dependencyCounts: React.PropTypes.object,
    requestDependencyCounts: React.PropTypes.func.isRequired
  },

  componentDidMount () {
    this.props.requestDependencyCounts()
  },

  render () {
    return (<div className='dependency-counts-graph' ref={(r) => { this.graphContainer = r }}></div>)
  },

  componentDidUpdate () {
    const data = this.props.dependencyCounts
    if (!data) return

    const diameter = this.graphContainer.clientWidth
    const format = d3.format(',d')
    const bubble = d3.layout.pack().sort(null).size([diameter, diameter]).padding(1.5)

    const svg = d3.select(this.graphContainer).append('svg')
      .attr('width', diameter)
      .attr('height', diameter)
      .attr('class', 'bubble')

    // Simplify graph by removing nodes with < 5 deps
    Object.keys(data).forEach((depName) => {
      if (data[depName] < 5) delete data[depName]
    })

    if (!Object.keys(data).length) return

    // Get the max count
    const max = Object.keys(data).reduce((max, depName) => Math.max(data[depName], max), 1)

    const color = d3.scale.linear()
      .domain([5, max])
      .range(['#b8e3f3', '#30aedc'])

    function transformData (data) {
      return {
        children: Object.keys(data).map((depName) => ({ depName, value: data[depName] }))
      }
    }

    const nodes = svg.selectAll('.node')
      .data(bubble.nodes(transformData(data)).filter((d) => !d.children), (d) => d.depName)

    const nodeEnter = nodes.enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', () => `translate(${diameter / 2},${diameter / 2})`)
      .on('click', (d) => {
        window.location = `https://www.npmjs.com/package/${d.depName}`
      })

    nodeEnter.append('title').text((d) => `${d.depName}: ${format(d.value)}`)

    nodeEnter.append('circle')

    nodeEnter.append('text')
      .attr('dy', '.3em')
      .style('text-anchor', 'middle')

    const nodeUpdate = nodes.transition().attr('transform', (d) => `translate(${d.x},${d.y})`)

    nodeUpdate
      .select('circle')
      .attr('r', (d) => d.r)
      .style('fill', (d) => color(d.value))

    nodeUpdate.select('text').text((d) => d.depName.substring(0, d.r / 3))

    nodes.exit().transition().remove().select('circle').attr('r', 0)
  }
})

const mapStateToProps = ({ dependencyCounts }) => ({ dependencyCounts })

const mapDispatchToProps = (dispatch) => {
  return { requestDependencyCounts: () => dispatch(requestDependencyCounts()) }
}

export default connect(mapStateToProps, mapDispatchToProps)(DependencyCountsGraph)
