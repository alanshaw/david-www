import React from 'react'
import Helmet from 'react-helmet'
import { connect } from 'react-redux'
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
    fetchProject: React.PropTypes.func.isRequired
  },

  getInitialState () {
    return { project: null }
  },

  componentWillReceiveProps (props) {
    if (props && props.project) {
      this.setState({ project: props.project })
    }
  },

  componentDidMount () {
    const project = this.props.project
    const projectData = this.props.params

    if (project) {
      if (
        project.user === projectData.user &&
        project.repo === projectData.repo &&
        project.path === projectData.path &&
        project.ref === projectData.ref
      ) {
        return this.setState({ project })
      }
    }

    this.props.fetchProject(projectData)
  },

  render () {
    const params = this.props.params
    const project = this.state.project
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
    const project = this.state.project
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
    const project = this.state.project
    if (!project) return

    const manifest = project.manifest

    return (
      <ul id='dep-switch'>
        <li><a href='#info=dependencies' title='Show dependencies' class='selected'><i className='fa fa-cogs'></i> dependencies</a></li>
        {manifest.devDependencies && <li><a href='#info=devDependencies' title='Show devDependencies'><i className='fa fa-code'></i> devDependencies</a></li>}
        {manifest.peerDependencies && <li><a href='#info=peerDependencies' title='Show peerDependencies'><i className='fa fa-cubes'></i> peerDependencies</a></li>}
        {manifest.optionalDependencies && <li><a href='#info=optionalDependencies' title='Show optionalDependencies'><i className='fa fa-sliders'></i> optionalDependencies</a></li>}
      </ul>
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
