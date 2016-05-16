import React from 'react'
import Header from '../components/header.jsx'
import Footer from '../components/footer.jsx'

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
