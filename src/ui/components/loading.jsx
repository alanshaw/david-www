import React from 'react'

export default ({ text = 'Reticulating splines...' }) => (
  <div className='loading'><i className='fa fa-spinner fa-spin fa-2x'></i> {text}</div>
)
