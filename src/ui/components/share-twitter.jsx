import React from 'react'
import { Helmet } from 'react-helmet'

export default React.createClass({
  shouldComponentUpdate () {
    return false
  },

  render () {
    return (
      <div>
        <Helmet><script id='twitter-wjs' src='//platform.twitter.com/widgets.js' /></Helmet>
        <a href='https://twitter.com/share' className='twitter-share-button' data-url='https://david-dm.org' data-text='David, a new dependency management tool for #Node.js projects' data-count='none'>Tweet</a>
      </div>
    )
  }
})
