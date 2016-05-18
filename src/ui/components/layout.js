import React from 'react'
import Header from './header'
import Footer from './footer'

export default React.createClass({
  render () {
    return (
      <div>
        <Header />
        <main id='main' className='clearfix' role='main'>
          {this.props.children}
        </main>
        <Footer />
      </div>
    )
  }
})
