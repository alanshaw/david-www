import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import merge from 'merge'
import Modal from 'react-modal'
import { requestProject, requestInfo } from '../actions'
import Badge from '../components/badge.jsx'
import Loading from '../components/loading.jsx'
import Summary from '../components/project/summary.jsx'
import SecurityWarning from '../components/project/security-warning.jsx'
import DependencyTable from '../components/project/dependency-table.jsx'
import DependencyGraph from '../components/project/dependency-graph.jsx'
import BadgeEmbed from '../components/project/badge-embed.jsx'

class Project extends Component {
  static propTypes = {
    config: PropTypes.shape({
      githubUrl: PropTypes.string.isRequired
    }).isRequired,
    project: PropTypes.shape({
      name: PropTypes.string,
      version: PropTypes.string,
      description: PropTypes.string,
      dependencies: PropTypes.object,
      devDependencies: PropTypes.object,
      peerDependencies: PropTypes.object,
      optionalDependencies: PropTypes.object
    }),
    info: PropTypes.shape({
      status: PropTypes.string,
      deps: PropTypes.array,
      totals: PropTypes.object
    }),
    params: PropTypes.shape({
      user: PropTypes.string.isRequired,
      repo: PropTypes.string.isRequired,
      ref: PropTypes.string
    }).isRequired,
    location: PropTypes.shape({
      query: PropTypes.shape({
        path: PropTypes.string,
        type: PropTypes.string,
        view: PropTypes.string
      })
    }).isRequired,
    requestProject: PropTypes.func.isRequired
  }

  state = { badgeModalIsOpen: false }

  componentWillReceiveProps (props) {
    const currType = this.props.location.query.type
    const nextType = props.location.query.type

    if (currType !== nextType) {
      const params = this.getProjectRequestParams(props.params, props.location.query)
      this.props.requestInfo(params)
    }
  }

  componentDidMount () {
    const params = this.getProjectRequestParams(this.props.params, this.props.location.query)
    this.props.requestProject(params)
    this.props.requestInfo(params)
  }

  // Get project data from the URL
  getProjectRequestParams (params, query) {
    const { user, repo, ref } = params
    const { path, type } = query
    return { user, repo, ref, path, type }
  }

  getLinkTo = (query) => {
    const params = this.props.params
    let pathname = `/${params.user}/${params.repo}`
    pathname += params.ref ? `/${params.ref}` : ''
    return { pathname, query: merge(true, this.props.location.query, query) }
  }

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
        <Helmet>
          <html className='project-page' />
          <title>{title}</title>
          <link rel='alternate' type='application/rss+xml' title='RSS' href={`/${params.user}/${params.repo}${params.ref ? '/' + params.ref : ''}/rss.xml`} />
        </Helmet>
        {this.renderHeader()}
        {this.renderTabs()}
        {this.renderInfo()}
        <Modal
          isOpen={this.state.badgeModalIsOpen}
          onRequestClose={this.onBadgeModalClose}
          className='modal modal-badge'
          overlayClassName='modal-overlay'
          contentLabel='Badge modal'>
          <BadgeEmbed project={this.getProjectRequestParams(params, this.props.location.query)} />
        </Modal>
      </div>
    )
  }

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
            <span> {project.version} {params.ref ? <span id='branch'><i className='fa fa-code-fork' /> {params.ref}</span> : ''}</span>
            <Badge
              project={this.getProjectRequestParams(this.props.params, this.props.location.query)}
              onClick={this.onBadgeClick} />
          </h1>
          {project.description && <p>{project.description}</p>}
        </div>
      )
    } else {
      return (
        <div id='repo'>
          <h1>
            <a href={`${githubUrl}/${params.user}`}>{params.user}</a> - <a href={githubProjectUrl}>{params.repo}</a>
            <span>{params.ref ? <span id='branch'><i className='fa fa-code-fork' /> {params.ref}</span> : ''}</span>
            <Badge />
          </h1>
        </div>
      )
    }
  }

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
  }

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
      <li><Link to={to} className={className} title={`Show ${name}`}><i className={`fa fa-${icon}`} /> {name}</Link></li>
    )
  }

  renderInfo () {
    const info = this.props.info
    if (!info) return (<Loading />)
    if (!info.deps.length) return (<p>No dependencies</p>)

    const view = this.props.location.query.view || 'list'
    const params = this.getProjectRequestParams(this.props.params, this.props.location.query)

    return (
      <div>
        {this.renderViewSwitcher()}
        <Summary />
        <SecurityWarning />
        {view === 'list' ? <DependencyTable /> : <DependencyGraph project={params} />}
        <Summary />
      </div>
    )
  }

  renderViewSwitcher () {
    return (
      <ul className='switch'>
        {this.renderViewSwitcherButton('list', 'list')}
        {this.renderViewSwitcherButton('tree', 'sitemap')}
      </ul>
    )
  }

  renderViewSwitcherButton (view, icon) {
    const { query } = this.props.location
    const to = this.getLinkTo({ view })
    const className = (query.view || 'list') === view ? 'selected' : ''

    return (
      <li><Link to={to} className={className} title={`Show dependencies in a ${view}`}><i className={`fa fa-${icon}`} /> {view}</Link></li>
    )
  }

  onBadgeClick = (e) => {
    e.preventDefault()
    this.setState({ badgeModalIsOpen: true })
  }

  onBadgeModalClose = () => {
    this.setState({ badgeModalIsOpen: false })
  }
}

Project.requestData = ({ params, location, store }) => {
  const { user, repo, ref } = params
  const { path, type } = location.query
  const projectParams = { user, repo, ref, path, type }

  return Promise.all([
    store.dispatch(requestProject(projectParams)),
    store.dispatch(requestInfo(projectParams))
  ])
}

Project.shouldUpdateScroll = (prevRouterProps, { routes }) => {
  if (!prevRouterProps) return true
  const { routes: prevRoutes } = prevRouterProps
  return prevRoutes[prevRoutes.length - 1] !== routes[routes.length - 1]
}

const mapStateToProps = ({ config, project, info }) => ({ config, project, info })
const mapDispatchToProps = { requestProject, requestInfo }

export default connect(mapStateToProps, mapDispatchToProps)(Project)
