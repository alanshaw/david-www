import React from 'react'
import Helmet from 'react-helmet'
import { Link } from 'react-router'
import { connect } from 'react-redux'
import dateFormat from 'dateformat'
import { requestStats, requestLatestNews } from '../actions'
import DependencyCountsGraph from '../components/home/dependency-counts-graph.jsx'

const Home = React.createClass({
  propTypes: {
    config: React.PropTypes.object.isRequired,
    stats: React.PropTypes.object,
    latestNews: React.PropTypes.array,
    requestStats: React.PropTypes.func.isRequired,
    requestLatestNews: React.PropTypes.func.isRequired
  },

  getInitialState () {
    return {
      badgeUrlClass: 'nope',
      badgeImgClass: '',
      badgeSrc: '/img/status/outofdate.svg'
    }
  },

  componentDidMount () {
    this.props.requestStats()
    this.props.requestLatestNews()
  },

  render () {
    return (
      <div>
        <Helmet htmlAttributes={{class: 'home-page'}} />
        <div>

          <h1>
            You depend on other projects.<br />
            You want to stay up to date.<br />
            David's got your back.
          </h1>

          <p>
            David gets you an overview of your project dependencies, the version you use
            and the latest available, so you can quickly see what's drifting.
            Then it's all boiled down into a badge showing the current status,
            which you can embed on your site.
          </p>

          <ul id='examples'>
            <li>bower - <Link to='/bower/bower'>bower<img src='/bower/bower.svg' alt='bower Dependency badge' /></Link></li>
            <li>request - <Link to='/request/request'>request<img src='/request/request.svg' alt='request Dependency badge' /></Link></li>
            <li>gruntjs - <Link to='/gruntjs/grunt'>grunt<img src='/gruntjs/grunt.svg' alt='grunt Dependency badge' /></Link></li>
            <li>expressjs - <Link to='/expressjs/express'>express<img src='/expressjs/express.svg?style=flat' alt='express Dependency badge' /></Link></li>
            <li>alanshaw - <Link to='/alanshaw/david'>david<img src='/alanshaw/david.svg' alt='david Dependency badge' /></Link></li>
          </ul>

          <h2>Giving you badges.</h2>

          <p>
            Got a <a href='http://nodejs.org/'>Node.js</a> project? Get a badge. David is free for public projects on <a href='https://github.com/'>Github</a>.
          </p>

          <p>
            Declare your dependencies in a <a href='http://package.json.nodejitsu.com/'>package.json</a> file and you're good. David will go work the rest out and you'll get your own project status page, listing your dependencies and their freshness. Click on the examples above for a preview.
          </p>

          <p>Type your username / repo name in below and get yours...</p>

          <p className='badge-maker'>
            <strong>{this.props.config.siteUrl}/<span contentEditable className={this.state.badgeUrlClass} id='username' title='[Github username] / [repo name]' onInput={this.onBadgeInput} onKeyPress={this.onBadgeKeyPress}>username/repo</span>.svg</strong>
            <img id='badge' src={this.state.badgeSrc} alt='badge' onLoad={this.onBadgeLoad} onError={this.onBadgeError} className={this.state.badgeImgClass} />
          </p>

          <p>
            David is currently <em>BETA</em>, which means it may be unreliable, unavailable or not working. That said, it's already useful and we're working to make it rock solid.
            It's all in Github so <a href='https://github.com/alanshaw/david-www'>feel free to help</a>.
          </p>

          <h2>Most used dependencies</h2>

          <p>These are the most used NPM dependencies based on open source GitHub projects that are using them.</p>

          <DependencyCountsGraph />

        </div>

        <aside id='stats'>
          {this.renderStats()}
          {this.renderNews()}
        </aside>
      </div>
    )
  },

  renderStats () {
    const stats = this.props.stats
    if (!stats) return

    return (
      <div>
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
      </div>
    )
  },

  renderNews () {
    const news = this.props.latestNews
    if (!news) return

    const item = news[0]

    return (
      <article id='news'>
        <div className='content'>
          <h1><a href={item.link}>{item.title}</a></h1>
          <p><a href={item.link}>{item.summary}</a></p>
        </div>
        <div className='cite'>
          <div className='author'>David Blog</div>
          <time dateTime={item.pubDate} pubdate>
            {dateFormat(item.pubDate, 'mmmm dS yyyy, hh:MM')}
          </time>
        </div>
      </article>
    )
  },

  onBadgeKeyPress (e) {
    if (e.key === 'Enter') e.preventDefault()
  },

  onBadgeInput (e) {
    const badgeSrc = `${this.props.config.siteUrl}/${e.currentTarget.textContent}.svg`
    this.setState({ badgeSrc })
  },

  onBadgeLoad () {
    this.setState({ badgeUrlClass: '', badgeImgClass: '' })
  },

  onBadgeError () {
    this.setState({ badgeUrlClass: 'nope', badgeImgClass: 'hidden' })
  }
})

Home.requestData = ({ store }) => {
  return Promise.all([
    store.dispatch(requestStats()),
    store.dispatch(requestLatestNews())
  ])
}

const mapStateToProps = ({ config, stats, latestNews }) => {
  return { config, stats, latestNews }
}

const mapDispatchToProps = (dispatch) => {
  return {
    requestStats: () => dispatch(requestStats()),
    requestLatestNews: () => dispatch(requestLatestNews())
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Home)
