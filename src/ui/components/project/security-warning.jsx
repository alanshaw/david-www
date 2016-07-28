import React from 'react'
import { connect } from 'react-redux'

const SecurityWarning = ({ info }) => {
  if (!info || !info.totals.advisories) return null

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
}

export default connect(({ info }) => ({ info }))(SecurityWarning)
