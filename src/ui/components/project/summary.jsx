import React from 'react'

export default ({ info }) => (
  <ul className='summary'>
    <li><span>{info.deps.length}</span> Dependencies total</li>
    <li><span className='sqr uptodate'></span> <span>{info.totals.upToDate}</span> Up to date</li>
    <li><span className='sqr pinned'></span> <span>{info.totals.pinned.outOfDate}</span> Pinned, out of date</li>
    <li><span className='sqr outofdate'></span> <span>{info.totals.unpinned.outOfDate}</span> Out of date</li>
  </ul>
)
