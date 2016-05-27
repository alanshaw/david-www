import React from 'react'
import Helmet from 'react-helmet'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import merge from 'merge'
import isEqual from 'lodash.isequal'
import { fetchProject, fetchInfo } from '../actions'
import Badge from '../components/badge.jsx'
import Loading from '../components/loading.jsx'

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
    if (!isEqual(this.props.location.query, props.location.query)) {
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
    const params = this.props.params

    if (type && !project[`${type}Dependencies`]) return

    let pathname = `/${params.user}/${params.repo}/`
    pathname += params.ref ? `/${params.ref}` : ''
    const { query } = this.props.location
    const to = {pathname, query: merge(true, query, { type })}

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

    if (!info) {
      return (<Loading />)
    }

    if (!info.deps.length) {
      return (<p>No dependencies</p>)
    }

    return (
      <div>
        <ul className='switch'>
          <li><a href='#view=list' title='Show dependencies in a list' className='selected'><i className='fa fa-list'></i> List</a></li>
          <li><a href='#view=tree' title='Show dependencies in a tree'><i className='fa fa-sitemap'></i> Tree</a></li>
        </ul>
        {this.renderSummary()}
        {this.renderSecurityWarning()}
        {this.renderDependencyTable()}
        {this.renderSummary()}
      </div>
    )
  },

  renderSummary () {
    const info = this.props.info

    return (
      <ul className='summary'>
        <li><span>{info.deps.length}</span> Dependencies total</li>
        <li><span className='sqr uptodate'></span> <span>{info.totals.upToDate}</span> Up to date</li>
        <li><span className='sqr pinned'></span> <span>{info.totals.pinned.outOfDate}</span> Pinned, out of date</li>
        <li><span className='sqr outofdate'></span> <span>{info.totals.unpinned.outOfDate}</span> Out of date</li>
      </ul>
    )
  },

  renderSecurityWarning () {
    const info = this.props.info
    if (!info.totals.advisories) return

    return (
      <div>
        <div id='summary-advisories'>
          <i className='fa fa-exclamation-circle'></i>
          Security vulnerabilities in dependencies
        </div>
        <div id='nsp'>
          Advisories from the <a href='https://nodesecurity.io'>Node Security Project</a>
        </div>
      </div>
    )
  },

  renderDependencyTable () {
    const info = this.props.info

    return (
      <div className='dep-table'>
        <table>
          <thead>
            <tr>
              <th>Dependency</th>
              <th><span className='visuallyhidden'>Changes</span></th>
              <th>Required</th>
              <th>Stable</th>
              <th>Latest</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {info.deps.map(dep => {
              return (
                <tr>
                  <td className='dep'>
                    <a href={`https://www.npmjs.com/package/${dep.name}`}>{dep.name}</a>
                    {this.renderAdvisories(dep)}
                  </td>
                  <td className='changes'>
                    {dep.outOfDate && <a href='#' title='View closed issues and commits' className='changes-icon'><i className='fa fa-file-code-o'></i></a>}
                  </td>
                  <td className='required'>{dep.required}</td>
                  <td className='stable'>{dep.stable}</td>
                  <td className='latest'>{dep.latest}</td>
                  <td className='status'>
                    <span className={`sqr ${dep.status} ${dep.pinned ? 'pinned' : 'unpinned'}`} title={`${dep.pinned ? 'pinned ' : ''}${dep.status}`}></span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  },

  renderAdvisories (dep) {
    if (!dep.advisories) return
    return (
      <ul className='vulns'>
        {dep.advisories.map((a) => (
          <li>
            <a href={`https://nodesecurity.io/advisories/${a.slug}`}>
              <i className='fa fa-exclamation-circle'></i>
              {a.title}
            </a>
          </li>
        ))}
      </ul>
    )
  }
})

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
