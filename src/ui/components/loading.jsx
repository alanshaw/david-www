import React from 'react'

export default ({ text = 'Reticulating splines...', className = 'loading' }) => (
  <div className={className}><i className='fa fa-spinner fa-spin fa-2x'></i> {text}</div>
)
