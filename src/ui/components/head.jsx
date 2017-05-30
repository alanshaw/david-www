import React from 'react'
import { Helmet } from 'react-helmet'

export default () => (
  <Helmet
    defaultTitle='David, a dependency management tool for Node.js projects'
    titleTemplate='%s - David'>
    <html lang='en' />
    <meta charSet='utf-8' />
    <meta name='viewport' content='width=device-width, initial-scale=1' />
    <meta description='Identifies your out of date project dependencies and shows the latest version you need to upgrade to' />
    <meta http-equiv='X-UA-Compatible' content='IE=edge' />
    <link rel='stylesheet' href='//fonts.googleapis.com/css?family=Cardo:400,700|Lato:900' />
  </Helmet>
)
