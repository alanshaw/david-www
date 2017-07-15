import rc from 'rc'

export default rc('david', {
  brains: {
    cacheTime: 86400000
  },
  gitlab: {
    api: {
      url: 'https://www.gitlab.com/api/v3'
    },
    oauth: {
      id: null,
      secret: null
    },
    token: null,
    defaultBranch: 'master'
  },
  github: {
    api: {
      version: '3.0.0',
      protocol: 'https',
      host: 'api.github.com',
      timeout: 5000,
      caFile: null
    },
    protocol: 'https',
    host: 'github.com',
    oauth: {
      clientId: null,
      secret: null
    },
    token: null
  },
  npm: {
    hostname: 'https://www.npmjs.com',
    options: {
      registry: 'http://registry.npmjs.org'
    },
    feed: 'https://skimdb.npmjs.com/registry'
  },
  site: {
    hostname: 'http://localhost:1337'
  },
  db: {
    path: 'data'
  },
  nsp: {
    syncAdvisoriesInterval: 3600000
  },
  public: {
    siteUrl: 'http://localhost:1337',
    apiUrl: 'http://localhost:1337',
    githubUrl: 'https://github.com',
    github: {
      protocol: 'https',
      host: 'github.com',
      oauth: {
        clientId: null
      }
    },
    google: {
      trackingId: ''
    }
  }
})
