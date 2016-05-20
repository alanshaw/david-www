import React from 'react'
import Helmet from 'react-helmet'

export default React.createClass({
  render () {
    return (
      <div className='container'>
        <Helmet htmlAttributes={{class: 'status-page'}} />
        <h1>Status</h1>
      </div>
    )
  }
})
