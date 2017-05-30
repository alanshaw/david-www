import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import ShareGoogle from './share-google.jsx'
import ShareTwitter from './share-twitter.jsx'

class Footer extends Component {
  static propTypes = {
    version: PropTypes.string.isRequired
  }

  render () {
    return (
      <footer role='contentinfo'>
        <div>
          <small>
            Copyright &copy; {new Date().getFullYear()} david-dm.org <span>v{this.props.version}</span><br />
            <a href='https://tableflip.io/'>Built by <img src='/img/logo-tableflip.svg' /> TABLEFLIP</a>
          </small>
          <ul>
            <li><a href='https://github.com/alanshaw/david-www'>GitHub</a></li>
            <li><a href='https://github.com/alanshaw/david-www/graphs/contributors'>Contributors</a></li>
            <li><a href='https://github.com/alanshaw/david-www/issues'>Issues</a></li>
            <li><Link to='/stats' activeClassName='active'>Stats</Link></li>
            <li><a href='http://davidiswatching.tumblr.com/'>Blog</a></li>
          </ul>
          <ul className='social'>
            <li>
              <ShareTwitter />
            </li>
            <li>
              <ShareGoogle />
            </li>
          </ul>
        </div>
      </footer>
    )
  }
}

const mapStateToProps = ({ version }) => ({ version })

export default connect(mapStateToProps)(Footer)
