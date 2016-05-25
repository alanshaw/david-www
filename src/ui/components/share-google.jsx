import React from 'react'
import Helmet from 'react-helmet'

export default React.createClass({
  componentDidMount () {
    window.___gcfg = window.___gcfg || { lang: 'en-GB' }
  },

  shouldComponentUpdate () {
    return !(window && window.___gcfg)
  },

  render () {
    return (
      <div>
        <Helmet script={[{ src: '//apis.google.com/js/plusone.js' }]} />
        <div className='g-plusone' data-size='medium' data-annotation='none' data-href='https://david-dm.org'></div>
      </div>
    )
  }
})
