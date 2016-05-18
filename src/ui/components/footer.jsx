import React from 'react'
import { IndexLink } from 'react-router'

export default React.createClass({
  render () {
    return (
      <footer role='contentinfo'>
        <div>
          <small>
            Copyright &copy; {new Date().getFullYear()} david-dm.org <span>v@@version</span><br />
            <a href='https://tableflip.io/'>Built by <img src='/img/logo-tableflip.svg' /> TABLEFLIP</a>
          </small>
          <ul>
            <li><a href='https://github.com/alanshaw/david-www'>GitHub</a></li>
            <li><a href='https://github.com/alanshaw/david-www/graphs/contributors'>Contributors</a></li>
            <li><a href='https://github.com/alanshaw/david-www/issues'>Issues</a></li>
            <li><IndexLink to='/stats' activeClassName='active'>Stats</IndexLink></li>
            <li><a href='http://davidiswatching.tumblr.com/'>Blog</a></li>
          </ul>
          <ul className='social'>
            <li>
              <a href='https://twitter.com/share' className='twitter-share-button' data-url='https://david-dm.org' data-text='David, a new dependency management tool for #Node.js projects' data-count='none'>Tweet</a>
            </li>
            <li>
              <div className='g-plusone' data-size='medium' data-annotation='none' data-href='https://david-dm.org'></div>
            </li>
          </ul>
        </div>
      </footer>
    )
  }
})
