import React from 'react'
import { connect } from 'react-redux'

const Summary = ({ info }) => {
  if (!info) return null

  return (
    <ul className='summary'>
      <li><span>{info.deps.length}</span> Dependencies total</li>
      <li><span className='sqr uptodate' /> <span>{info.totals.upToDate}</span> Up to date</li>
      <li><span className='sqr pinned' /> <span>{info.totals.pinned.outOfDate}</span> Pinned, out of date</li>
      <li><span className='sqr outofdate' /> <span>{info.totals.unpinned.outOfDate}</span> Out of date</li>
    </ul>
  )
}

export default connect(({ info }) => ({ info }))(Summary)
