import React from 'react'

export default React.createClass({
  propTypes: {
    project: React.PropTypes.shape({
      user: React.PropTypes.string.isRequired,
      repo: React.PropTypes.string.isRequired,
      path: React.PropTypes.string,
      ref: React.PropTypes.string,
      type: React.PropTypes.string
    }),
    href: React.PropTypes.string,
    title: React.PropTypes.string,
    className: React.PropTypes.string,
    onClick: React.PropTypes.func
  },

  getDefaultProps () {
    return { className: 'badge' }
  },

  onClick (e) {
    if (this.props.onClick) {
      this.props.onClick(e, this.props.project)
    }
  },

  getProjectUrl () {
    const project = this.props.project
    if (!project) return null

    let url = `/${project.user}/${project.repo}`
    url += project.ref ? `/${project.ref}` : ''
    url += project.path ? `?path=${project.path}` : ''

    return url
  },

  getProjectBadgeSrc () {
    const project = this.props.project
    if (!project) return null

    const prefix = project.type ? `${project.type}-` : ''

    let src = `/${project.user}/${project.repo}`
    src += project.ref ? `/${project.ref}` : ''
    src += `/${prefix}status.svg`
    src += project.path ? `?path=${project.path}` : ''

    return src
  },

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
})
