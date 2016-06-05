import React from 'react'
import { connect } from 'react-redux'
import { requestChanges } from '../../actions'

const Changes = React.createClass({
  propTypes: {
    dep: React.PropTypes.shape({
      name: React.PropTypes.string.isRequired,
      required: React.PropTypes.string.isRequired,
      stable: React.PropTypes.string,
      latest: React.PropTypes.string
    }).isRequired,
    changes: React.PropTypes.shape({
      closedIssues: React.PropTypes.array,
      commits: React.PropTypes.array
    }),
    config: React.PropTypes.shape({
      apiUrl: React.PropTypes.string.isRequired
    }).isRequired
  },

  componentDidMount () {
    const { name, required: from, stable: to } = this.props.dep
    this.props.requestChanges({ name, from, to })
  },

  render () {
    return (
      <p>Changes here</p>
    )
  }
})

const mapStateToProps = ({ config, changes }) => ({ config, changes })

const mapDispatchToProps = (dispatch) => {
  return { requestChanges: ({ from, to }) => dispatch(requestChanges({ from, to })) }
}

export default connect(mapStateToProps, mapDispatchToProps)(Changes)
