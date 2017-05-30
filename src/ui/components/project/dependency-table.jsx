import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import Modal from 'react-modal'
import Changes from './changes.jsx'

class DependencyTable extends Component {
  static propTypes = {
    info: PropTypes.object
  }

  state = { changesModalIsOpen: null }

  onChangesIconClick = (e) => {
    e.preventDefault()
    this.setState({ changesModalIsOpen: e.currentTarget.getAttribute('data-dep-name') })
  }

  onChangesModalClose = () => {
    this.setState({ changesModalIsOpen: null })
  }

  render () {
    const info = this.props.info
    if (!info) return null

    return (
      <div className='dep-table'>
        <table cellPadding='0' cellSpacing='0'>
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
            {info.deps.map((dep) => {
              return (
                <tr key={dep.name}>
                  <td className='dep'>
                    <a href={`https://www.npmjs.com/package/${dep.name}`}>{dep.name}</a>
                    <Advisories dep={dep} />
                  </td>
                  <td className='changes'>
                    {this.renderChangesIcon(dep)}
                  </td>
                  <td className='required'>{dep.required}</td>
                  <td className='stable'>{dep.stable}</td>
                  <td className='latest'>{dep.latest}</td>
                  <td className='status'>
                    <span className={`sqr ${dep.status} ${dep.pinned ? 'pinned' : 'unpinned'}`} title={`${dep.pinned ? 'pinned ' : ''}${dep.status}`} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  renderChangesIcon (dep) {
    if (!dep.outOfDate) return null
    const isOpen = this.state.changesModalIsOpen === dep.name

    return (
      <div>
        <a href='#' title='View closed issues and commits' className='changes-icon' data-dep-name={dep.name} onClick={this.onChangesIconClick}><i className='fa fa-file-code-o' /></a>
        <Modal
          isOpen={isOpen}
          onRequestClose={this.onChangesModalClose}
          className='modal modal-changes'
          overlayClassName='modal-overlay'
          contentLabel='Changes modal'>
          <Changes dep={dep} />
        </Modal>
      </div>
    )
  }
}

function Advisories ({ dep }) {
  if (!dep.advisories) return

  return (
    <ul className='vulns'>
      {dep.advisories.map((a) => (
        <li key={a.slug}>
          <a href={`https://nodesecurity.io/advisories/${a.slug}`}>
            <i className='fa fa-exclamation-circle' /> {a.title}
          </a>
        </li>
      ))}
    </ul>
  )
}

export default connect(({ info }) => ({ info }))(DependencyTable)
