import React from 'react'
import Header from './header.jsx'
import Footer from './footer.jsx'
import Analytics from './analytics.jsx'

export default (props) => (
  <div>
    <Analytics />
    <Header />
    <main id='main' className='clearfix' role='main'>
      {props.children}
    </main>
    <Footer />
  </div>
)
