import once from 'once'
import Async from 'async'
import createWorker from './worker'

export default ({ db, manifest, brains, cache, queueConfig = {} }) => {
  const name = `queue${Math.random().toString(36)}`

  queueConfig.workers = queueConfig.workers || 5
  queueConfig.interval = queueConfig.interval || 500

  const workers = []

  for (let i = 0; i < queueConfig.workers; i++) {
    workers.push(createWorker({ db, manifest, brains, cache }))
  }

  setInterval(() => {
    let count = 0
    db.createReadStream({ gt: `${name}~next~`, lt: `${name}~next~~` })
      .on('data', () => count++)
      .on('end', () => console.log('Queue length is', count))
  }, 60000)

  const getNext = (cb) => {
    cb = once(cb)
    let hasNext = false

    db.createReadStream({ gt: `${name}~next~`, lt: `${name}~next~~`, limit: 1 })
      .on('data', ({ key, value }) => {
        hasNext = true
        const { user, repo } = value

        console.log(`Got next: ${key} (${user}/${repo})`)

        Async.parallel([
          (cb) => db.del(createQueueKey(name, value), cb),
          (cb) => db.del(key, cb)
        ], (err) => {
          if (err) return cb(err)
          cb(null, value)
        })
      })
      .on('error', cb)
      .on('end', () => {
        if (!hasNext) cb()
      })
  }

  const scheduleProcess = () => setTimeout(processor, queueConfig.interval)

  const processor = () => {
    if (!workers.length) {
      console.log('No available workers')
      return scheduleProcess()
    }

    getNext((err, item) => {
      scheduleProcess()

      if (err) return console.error('Failed to get next queue item', err)
      if (!item) return // console.log('No queued items')

      const worker = workers.pop()

      worker(item, (err) => {
        if (err) console.error('Failed to process queue item', item, err)
        workers.push(worker)
      })
    })
  }

  processor()

  const Queue = {
    // Push onto the queue, callback with true if joined, false if already in queue
    push ({ user, repo, opts }, cb) {
      const key = createQueueKey(name, { user, repo, opts })

      db.get(key, (err) => {
        if (err && !err.notFound) return cb(err)

        // Push onto back of queue
        if (err && err.notFound) {
          return Async.parallel([
            (cb) => db.put(key, true, cb),
            (cb) => db.put(`${name}~next~${Date.now()}`, { user, repo, opts }, cb)
          ], (err) => {
            if (err) return cb(err)
            console.log(`${key} joined the queue`)
            cb(null, true)
          })
        }

        console.log(`${key} already in queue`)
        cb(null, false) // If exists in queue discard
      })
    }
  }

  return Queue
}

function createQueueKey (prefix, { user, repo, opts }) {
  opts = opts || {}

  let key = `${prefix}~queued~${user}~${repo}`

  if (opts.path && opts.path[opts.path.length - 1] === '/') {
    opts.path = opts.path.slice(0, -1)
  }

  if (opts.path) {
    key += `~${opts.path.replace(/\//g, '~')}`
  }

  key += `~${opts.ref || 'master'}`

  if (opts.dev) {
    key += '~devDependencies'
  } else if (opts.peer) {
    key += '~peerDependencies'
  } else if (opts.optional) {
    key += '~optionalDependencies'
  } else {
    key += '~dependencies'
  }

  return key
}
