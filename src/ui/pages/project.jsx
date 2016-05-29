import React from 'react'
import Helmet from 'react-helmet'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import merge from 'merge'
import { fetchProject, fetchInfo } from '../actions'
import Badge from '../components/badge.jsx'
import Loading from '../components/loading.jsx'
import Summary from '../components/project/summary.jsx'
import SecurityWarning from '../components/project/security-warning.jsx'
import DependencyTable from '../components/project/dependency-table.jsx'
import DependencyGraph from '../components/project/dependency-graph.jsx'

const Project = React.createClass({
  propTypes: {
    config: React.PropTypes.shape({
      githubUrl: React.PropTypes.string.isRequired
    }).isRequired,
    project: React.PropTypes.shape({
      name: React.PropTypes.string,
      version: React.PropTypes.string,
      description: React.PropTypes.string,
      dependencies: React.PropTypes.object,
      devDependencies: React.PropTypes.object,
      peerDependencies: React.PropTypes.object,
      optionalDependencies: React.PropTypes.object
    }),
    info: React.PropTypes.shape({
      status: React.PropTypes.string,
      deps: React.PropTypes.array,
      totals: React.PropTypes.object
    }),
    params: React.PropTypes.shape({
      user: React.PropTypes.string.isRequired,
      repo: React.PropTypes.string.isRequired,
      ref: React.PropTypes.string
    }).isRequired,
    location: React.PropTypes.shape({
      query: React.PropTypes.shape({
        path: React.PropTypes.string,
        type: React.PropTypes.string,
        view: React.PropTypes.string
      })
    }).isRequired,
    fetchProject: React.PropTypes.func.isRequired
  },

  componentWillReceiveProps (props) {
    const currType = this.props.location.query.type
    const nextType = props.location.query.type

    if (currType !== nextType) {
      const params = this.getProjectFetchParams(props.params, props.location.query)
      this.props.fetchInfo(params)
    }
  },

  componentDidMount () {
    const params = this.getProjectFetchParams(this.props.params, this.props.location.query)
    this.props.fetchProject(params)
    this.props.fetchInfo(params)
  },

  // Get project data from the URL
  getProjectFetchParams (params, query) {
    const { user, repo, ref } = params
    const { path, type } = query
    return { user, repo, ref, path, type }
  },

  getLinkTo (query) {
    const params = this.props.params
    let pathname = `/${params.user}/${params.repo}/`
    pathname += params.ref ? `/${params.ref}` : ''
    return { pathname, query: merge(true, this.props.location.query, query) }
  },

  render () {
    const params = this.props.params
    const project = this.props.project
    let title = 'Dependency status for '

    if (project) {
      title += `${params.user} - ${project.name} v${project.version}`
    } else {
      title += `${params.user} - ${params.repo}`
    }

    title += params.ref ? ` from ${params.ref}` : ''

    return (
      <div>
        <Helmet
          htmlAttributes={{class: 'project-page'}}
          title={title}
          link={[
            { rel: 'alternate', type: 'application/rss+xml', title: 'RSS', href: `/${params.user}/${params.repo}${params.ref ? '/' + params.ref : ''}/rss.xml` }
          ]} />
        {this.renderHeader()}
        {this.renderTabs()}
        <div id='dep-info' className='dep-info'>
          {this.renderInfo()}
        </div>
      </div>
    )
  },

  renderHeader () {
    const params = this.props.params
    const project = this.props.project
    const githubUrl = this.props.config.githubUrl

    let githubProjectUrl = `${githubUrl}/${params.user}/${params.repo}/`
    githubProjectUrl += params.ref ? `/tree/${params.ref}` : ''

    if (params.path) {
      githubProjectUrl += params.ref ? `/${params.path}` : `/tree/master/${params.path}`
    }

    if (project) {
      return (
        <div id='repo'>
          <h1>
            <a href={`${githubUrl}/${params.user}`}>{params.user}</a> - <a href={githubProjectUrl}>{project.name}</a>
            <span> {project.version} {params.ref ? <span id='branch'><i className='fa fa-code-fork'></i> {params.ref}</span> : ''}</span>
            <Badge project={this.getProjectFetchParams(this.props.params, this.props.location.query)} />
          </h1>
          {project.description && <p>{project.description}</p>}
        </div>
      )
    } else {
      return (
        <div id='repo'>
          <h1>
            <a href={`${githubUrl}/${params.user}`}>{params.user}</a> - <a href={githubProjectUrl}>{params.repo}</a>
            <span>{params.ref ? <span id='branch'><i className='fa fa-code-fork'></i> {params.ref}</span> : ''}</span>
            <Badge />
          </h1>
        </div>
      )
    }
  },

  renderTabs () {
    const project = this.props.project
    if (!project) return

    return (
      <ul id='dep-switch'>
        {this.renderTab(null, 'cogs')}
        {this.renderTab('dev', 'code')}
        {this.renderTab('peer', 'cubes')}
        {this.renderTab('optional', 'sliders')}
      </ul>
    )
  },

  renderTab (type, icon) {
    const project = this.props.project
    if (type && !project[`${type}Dependencies`]) return

    const { query } = this.props.location
    const to = this.getLinkTo({ type })

    if (!type) {
      delete to.query.type
    }

    const name = type ? `${type}Dependencies` : 'dependencies'
    const className = (query.type || null) === type ? 'selected' : ''

    return (
      <li><Link to={to} className={className} title={`Show ${name}`}><i className={`fa fa-${icon}`}></i> {name}</Link></li>
    )
  },

  renderInfo () {
    const info = this.props.info
    if (!info) return (<Loading />)
    if (!info.deps.length) return (<p>No dependencies</p>)

    const view = this.props.location.query.view || 'list'
    const params = this.getProjectFetchParams(this.props.params, this.props.location.query)

    return (
      <div>
        {this.renderViewSwitcher()}
        <Summary />
        <SecurityWarning />
        {view === 'list' ? <DependencyTable /> : <DependencyGraph project={params} />}
        <Summary />
      </div>
    )
  },

  renderViewSwitcher () {
    return (
      <ul className='switch'>
        {this.renderViewSwitcherButton('list', 'list')}
        {this.renderViewSwitcherButton('tree', 'sitemap')}
      </ul>
    )
  },

  renderViewSwitcherButton (view, icon) {
    const { query } = this.props.location
    const to = this.getLinkTo({ view })
    const className = (query.view || 'list') === view ? 'selected' : ''

    return (
      <li><Link to={to} className={className} title={`Show dependencies in a ${view}`}><i className={`fa fa-${icon}`}></i> {view}</Link></li>
    )
  }
})

Project.fetchData = ({ params, location, store }) => {
  const { user, repo, ref } = params
  const { path, type } = location.query
  const projectParams = { user, repo, ref, path, type }

  return Promise.all([
    store.dispatch(fetchProject(projectParams)),
    store.dispatch(fetchInfo(projectParams))
  ])
}

Project.shouldUpdateScroll = (prevRouterProps, { routes }) => {
  if (!prevRouterProps) return true
  const { routes: prevRoutes } = prevRouterProps
  return prevRoutes[prevRoutes.length - 1] !== routes[routes.length - 1]
}

const mapStateToProps = ({ config, project, info }) => {
  return { config, project, info }
}

const mapDispatchToProps = (dispatch) => {
  return {
    fetchProject: (params) => dispatch(fetchProject(params)),
    fetchInfo: (params) => dispatch(fetchInfo(params))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Project)
