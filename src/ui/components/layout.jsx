import React from 'react'
import Header from './header.jsx'
import Footer from './footer.jsx'

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
