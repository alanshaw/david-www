import React from 'react'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import Qs from 'querystring'

const Analytics = React.createClass({
  propTypes: {
    routing: React.PropTypes.object.isRequired,
    config: React.PropTypes.object.isRequired
  },

  componentDidMount () {
    window.GoogleAnalyticsObject = 'ga'
    window.ga = window.ga || function () {
      (window.ga.q = window.ga.q || []).push(arguments)
    }
    window.ga.l = 1 * new Date()
    window.ga('create', this.props.config.google.trackingId)
    window.ga('send', 'pageview')
  },

  componentWillReceiveProps (props) {
    const currUrl = this.buildUrl(this.props.routing.locationBeforeTransitions)
    const nextUrl = this.buildUrl(props.routing.locationBeforeTransitions)

    if (currUrl !== nextUrl) {
      window.ga('send', 'pageview')
    }
  },

  buildUrl (location) {
    let qs = Qs.stringify(location)
    qs = qs ? `?${qs}` : ''
    return `${location.pathname}${qs}${location.search}`
  },

  shouldComponentUpdate () {
    return !(window && window.ga)
  },

  render () {
    return <Helmet script={[{ src: '//www.google-analytics.com/analytics.js' }]} />
  }
})

const mapStateToProps = ({ routing, config }) => ({ routing, config })

export default connect(mapStateToProps)(Analytics)
