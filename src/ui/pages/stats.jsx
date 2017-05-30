import React from 'react'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router'
import { connect } from 'react-redux'
import { requestStats } from '../actions'

const Stats = React.createClass({
  propTypes: {
    config: React.PropTypes.object.isRequired,
    stats: React.PropTypes.object,
    requestStats: React.PropTypes.func.isRequired
  },

  componentDidMount () {
    if (!this.props.stats) this.props.requestStats()
  },

  render () {
    const stats = this.props.stats
    if (!stats) return

    return (
      <div>
        <Helmet><html className='stats-page' /></Helmet>
        <div id='recently-watched' className='box'>
          <h2>Recently started watching</h2>
          <ul className='border-list'>
            {stats.recentlyRetrievedManifests.map(({ user, manifest, repo, ref, path }) => {
              let url = `/${user}/${repo}`
              url += ref ? `/${ref}` : ''
              url += path ? `?path=${path}` : ''
              return (<li key={url}>{user} - <Link to={url}>{manifest.name}</Link></li>)
            })}
          </ul>
        </div>

        <div id='recently-updated-npm' className='box'>
          <h2>Recently updated NPM packages</h2>
          <ul className='border-list'>
            {stats.recentlyUpdatedPackages.map(({ name, previous, version }) => {
              const url = `https://www.npmjs.com/package/${name}`
              return (
                <li key={url} className='pinned'><a href={url}>{name}</a> <span>{previous} <i className='fa fa-angle-double-right' /> {version}</span></li>
              )
            })}
          </ul>
        </div>

        <div id='recently-updated-proj' className='box'>
          <h2>Recently updated projects</h2>
          <ul class='border-list'>
            {stats.recentlyUpdatedManifests.map(({ user, repo, diffs }) => (
              <li>
                {user} - <Link to={`/${user}/${repo}`}>{repo}</Link>
                <ul>
                  {diffs.map(({ name, previous, version }) => (
                    <li>
                      <a href={`https://www.npmjs.com/package/${name}`}>{name}</a>
                      <span>
                        {previous || 'Nothing'}
                        <i class='fa fa-arrow-right' />
                        {version || 'Nothing'}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }
})

Stats.requestData = ({ store }) => {
  return Promise.all([
    store.dispatch(requestStats())
  ])
}

const mapStateToProps = ({ config, stats }) => {
  return { config, stats }
}

const mapDispatchToProps = (dispatch) => {
  return {
    requestStats: () => dispatch(requestStats())
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Stats)
