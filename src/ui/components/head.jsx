import React from 'react'
import Helmet from 'react-helmet'

export default () => (
  <Helmet
    htmlAttributes={{lang: 'en'}}
    defaultTitle='David, a dependency management tool for Node.js projects'
    titleTemplate='%s - David'
    meta={[
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'description', content: 'Identifies your out of date project dependencies and shows the latest version you need to upgrade to' },
      { 'http-equiv': 'X-UA-Compatible', content: 'IE=edge' },
      { 'property': 'og:title', content: null },
      { 'property': 'og:type', content: null },
      { 'property': 'og:url', content: null },
      { 'property': 'og:image', content: null },
      { 'property': 'og:description', content: null },
      { name: 'twitter:card', content: null },
      { name: 'twitter:site', content: null },
      { name: 'twitter:title', content: null },
      { name: 'twitter:description', content: null },
      { name: 'twitter:image', content: null }
    ]}
    link={[
      { rel: 'stylesheet', href: '//fonts.googleapis.com/css?family=Cardo:400,700|Lato:900' }
    ]}
  />
)
