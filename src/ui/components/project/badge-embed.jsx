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
      siteUrl: PropTypes.string.isRequired,
      statusApiUrl: PropTypes.string.isRequired
    }).isRequired
  }

  static defaultProps = {
    className: 'modal modal-badge',
    overlayClassName: 'modal-overlay'
  }

  state = { theme: '' }

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

  getProjectBadgeSrc = style => {
    if (!this.props.project) return null
    const { user, repo, path, ref, type } = this.props.project
    const url = new URL(this.props.config.statusApiUrl)
    url.pathname = `/gh/${encodeURIComponent(user)}/${encodeURIComponent(repo)}.svg`
    url.search = new URLSearchParams(Object.entries({ path, ref, type, style }).filter(([, v]) => !!v)).toString()
    return url.toString()
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
        <label htmlFor='badge-theme'>Style</label>
        <select id='badge-theme' onChange={this.onBadgeThemeChange} value={this.state.theme}>
          <option value=''>Default</option>
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
