import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import { requestCsrfToken, requestUser } from '../actions'

const Header = React.createClass({
  propTypes: {
    user: React.PropTypes.object,
    config: React.PropTypes.object.isRequired,
    csrfToken: React.PropTypes.string,
    requestCsrfToken: React.PropTypes.func.isRequired
  },

  componentDidMount () {
    this.props.requestCsrfToken()
    this.props.requestUser()
  },

  componentWillReceiveProps (nextProps) {
    if (this.props.user && !nextProps.user) {
      this.props.requestCsrfToken()
    }
  },

  render () {
    return (
      <header role='banner'>
        <div>
          <Link className='logo' to='/'>David. <i className='fa fa-home'></i></Link>
          <span>Watching your Node.js dependencies.</span>
          {this.props.user ? <SignedIn /> : <SignedOut {...this.props} />}
        </div>
      </header>
    )
  }
})

const SignedIn = () => (
  <a className='auth'>Signed in <i className='fa fa-github'></i></a>
)

const SignedOut = ({ csrfToken, config }) => {
  if (!csrfToken) return null
  if (!config.github.oauth || !config.github.oauth.clientId) return null

  let githubUrl = `${config.github.protocol}://${config.github.host}`
  githubUrl += '/login/oauth/authorize'
  githubUrl += `?client_id=${config.github.oauth.clientId}`
  githubUrl += `&state=${csrfToken}`
  githubUrl += '&scope=repo,read:org,user:email'

  return (
    <a className='auth' href={githubUrl}>Sign in <i className='fa fa-github'></i></a>
  )
}

const mapStateToProps = ({ user, config, csrfToken }) => ({ user, config, csrfToken })
const mapDispatchToProps = { requestCsrfToken, requestUser }

export default connect(mapStateToProps, mapDispatchToProps)(Header)
