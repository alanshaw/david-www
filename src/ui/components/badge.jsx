import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

export class Badge extends Component {
  static propTypes = {
    project: PropTypes.shape({
      user: PropTypes.string.isRequired,
      repo: PropTypes.string.isRequired,
      path: PropTypes.string,
      ref: PropTypes.string,
      type: PropTypes.string
    }),
    config: PropTypes.shape({
      statusApiUrl: PropTypes.string.isRequired
    }).isRequired,
    href: PropTypes.string,
    title: PropTypes.string,
    className: PropTypes.string,
    onClick: PropTypes.func
  }

  static defaultProps = { className: 'badge' }

  onClick = (e) => {
    if (this.props.onClick) {
      this.props.onClick(e, this.props.project)
    }
  }

  getProjectUrl = () => {
    const project = this.props.project
    if (!project) return null

    let url = `/${project.user}/${project.repo}`
    url += project.ref ? `/${project.ref}` : ''
    url += project.path ? `?path=${project.path}` : ''

    return url
  }

  getProjectBadgeSrc = () => {
    if (!this.props.project) return null
    const { user, repo, path, ref, type } = this.props.project
    const url = new URL(this.props.config.statusApiUrl)
    url.pathname = `/gh/${encodeURIComponent(user)}/${encodeURIComponent(repo)}.svg`
    url.search = new URLSearchParams(Object.entries({ path, ref, type }).filter(([, v]) => !!v)).toString()
    return url.toString()
  }

  render () {
    const project = this.props.project

    if (!project) {
      return (
        <a className={this.props.className} href={this.props.href || '#'} title={this.props.title} onClick={this.onClick}><img src='/img/status/unknown.svg' alt='unknown dependency status' /></a>
      )
    }

    const name = project.type ? `${project.type}Dependencies` : 'dependencies'

    return (
      <a className={this.props.className} href={this.props.href || this.getProjectUrl()} title={this.props.title} data-type={project.type} onClick={this.onClick}><img src={this.getProjectBadgeSrc()} alt={`${name} status`} /></a>
    )
  }
}

export default connect(({ config }) => ({ config }))(Badge)
