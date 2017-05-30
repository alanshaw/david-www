import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

class BadgeModal extends Component {
  static propTypes = {
    project: PropTypes.shape({
      user: PropTypes.string.isRequired,
      repo: PropTypes.string.isRequired,
      path: PropTypes.string,
      ref: PropTypes.string,
      type: PropTypes.string
    }),
    config: PropTypes.shape({
      siteUrl: PropTypes.string.isRequired
    }).isRequired
  }

  static defaultProps = {
    className: 'modal modal-badge',
    overlayClassName: 'modal-overlay'
  }

  state = { theme: 'svg' }

  getProjectUrl = () => {
    const project = this.props.project
    if (!project) return null

    let url = `${this.props.config.siteUrl}/${project.user}/${project.repo}`
    url += project.ref ? `/${project.ref}` : ''
    url += project.path ? `?path=${project.path}` : ''

    if (project.type) {
      if (project.path) {
        url += `&type=${project.type}`
      } else {
        url += `?type=${project.type}`
      }
    }

    return url
  }

  getProjectBadgeSrc = (theme) => {
    const project = this.props.project
    if (!project) return null

    const prefix = project.type ? `${project.type}-` : ''

    let src = `${this.props.config.siteUrl}/${project.user}/${project.repo}`
    src += project.ref ? `/${project.ref}` : ''

    if (theme === 'flat-square') {
      src += `/${prefix}status.svg?style=flat-square`
      src += project.path ? `&path=${project.path}` : ''
    } else if (theme === 'png') {
      src += `/${prefix}status.png`
      src += project.path ? `?path=${project.path}` : ''
    } else {
      src += `/${prefix}status.svg`
      src += project.path ? `?path=${project.path}` : ''
    }

    return src
  }

  onBadgeThemeChange = (e) => {
    this.setState({ theme: e.target.value })
  }

  render () {
    const project = this.props.project
    const url = this.getProjectUrl()
    const src = this.getProjectBadgeSrc(this.state.theme)
    const name = project.type ? `${project.type}Dependencies` : 'dependencies'
    const md = `[![${name} Status](${src})](${url})`
    const html = `<a href="${url}" title="${name} status"><img src="${src}"/></a>`

    return (
      <div className='badge-embed'>
        <h1>Embed badge</h1>
        <label htmlFor='badge-theme'>Type</label>
        <select id='badge-theme' onChange={this.onBadgeThemeChange} value={this.state.theme}>
          <option value='svg'>SVG</option>
          <option value='png'>PNG</option>
          <option value='flat-square'>Flat Square</option>
        </select>
        <div className={`theme theme-${this.state.theme}`}>
          <a href={src}><img src={src} alt={`${name} status`} /></a>
          <label htmlFor='badge-markdown'>Markdown</label>
          <input id='badge-markdown' type='text' value={md} />
          <label htmlFor='badge-html'>HTML</label>
          <input id='badge-html' type='text' value={html} />
        </div>
      </div>
    )
  }
}

export default connect(({ config }) => ({ config }))(BadgeModal)
