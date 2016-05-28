import React from 'react'
import { connect } from 'react-redux'

const DependencyGraph = React.createClass({
  render () {
    return (
      <p>GRAPH</p>
    )
  }
})

export default connect()(DependencyGraph)
