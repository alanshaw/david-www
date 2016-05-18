import React from 'react'
import { connect } from 'react-redux'

const Header = React.createClass({
  propTypes: {
    user: React.PropTypes.object,
    config: React.PropTypes.object.isRequired
  },

  render () {
    return (
      <header role='banner'>
        <div>
          <a className='logo' href='/'>David. <i className='fa fa-home'></i></a>
          <span>Watching your Node.js dependencies.</span>
          {this.props.user ? this.renderSignedIn() : this.renderSignedOut()}
        </div>
      </header>
    )
  },

  renderSignedIn () {
    return (
      <a className='auth'>Signed in <i className='fa fa-github'></i></a>
    )
  },

  renderSignedOut () {
    const config = this.props.config

    if (!config.github.oauth || !config.github.oauth.id) return

    const github = `${config.github.protocol}://${config.github.host}`
    // TODO: how to CSRF token
    const url = `${github}/login/oauth/authorize?client_id=${config.github.oauth.id}&state={{csrfToken}}&scope=repo,read:org,user:email`

    return (
      <a className='auth' href={url}>Sign in <i className='fa fa-github'></i></a>
    )
  }
})

function mapStateToProps ({ user, config }) {
  return { user, config }
}

export default connect(mapStateToProps)(Header)
