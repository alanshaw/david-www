import React from 'react'
import Helmet from 'react-helmet'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import merge from 'merge'
import { fetchProject } from '../actions'
import Badge from '../components/badge.jsx'

const Project = React.createClass({
  propTypes: {
    config: React.PropTypes.shape({
      githubUrl: React.PropTypes.string.isRequired
    }).isRequired,
    project: React.PropTypes.shape({
      user: React.PropTypes.string.isRequired,
      repo: React.PropTypes.string.isRequired,
      path: React.PropTypes.string,
      ref: React.PropTypes.string,
      type: React.PropTypes.string,
      manifest: React.PropTypes.object,
      info: React.PropTypes.object
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
    const projectData = this.getProjectData(props.params, props.location.query)
    this.props.fetchProject(projectData)
  },

  componentDidMount () {
    const projectData = this.getProjectData(this.props.params, this.props.location.query)
    this.props.fetchProject(projectData)
  },

  // Get project data from the URL
  getProjectData (params, query) {
    const { user, repo, ref } = params
    const { path, type } = query
    return { user, repo, ref, path, type }
  },

  render () {
    const params = this.props.params
    const project = this.props.project
    let title = 'Dependency status for '

    if (project) {
      title += `${params.user} - ${project.manifest.name} v${project.manifest.version}`
    } else {
      title += `${params.user} - ${params.repo}`
    }

    title += params.ref ? ` from ${params.ref}` : ''

    return (
      <div>
        <Helmet htmlAttributes={{class: 'project-page'}} title={title} />
        {this.renderHeader()}
        {this.renderTabs()}
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
            <a href={`${githubUrl}/${params.user}`}>{params.user}</a> - <a href={githubProjectUrl}>{project.manifest.name}</a>
            <span> {project.manifest.version} {params.ref ? <span id='branch'><i className='fa fa-code-fork'></i> {params.ref}</span> : ''}</span>
            <Badge project={project} />
          </h1>
          {project.manifest.description && <p>{project.manifest.description}</p>}
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
    const manifest = project.manifest

    if (type && !manifest[`${type}Dependencies`]) return

    let pathname = `/${project.user}/${project.repo}/`
    pathname += project.ref ? `/${project.ref}` : ''
    const { query } = this.props.location

    const to = {
      pathname,
      query: merge(true, query, { type })
    }

    if (!type) {
      delete to.query.type
    }

    const name = type ? `${type}Dependencies` : 'dependencies'
    const className = (this.props.location.query.type || null) === type ? 'selected' : ''

    return (
      <li><Link to={to} className={className} title={`Show ${name}`}><i className={`fa fa-${icon}`}></i> {name}</Link></li>
    )
  }
})

const mapStateToProps = ({ config, project }) => {
  return { config, project }
}

const mapDispatchToProps = (dispatch) => {
  return {
    fetchProject: (project) => dispatch(fetchProject(project))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Project)
