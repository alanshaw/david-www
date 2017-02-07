import once from 'once'
import Worker from './worker'

export default (queueName, db, queueConfig = {}) => {
  queueConfig.workers = queueConfig.workers || 5
  queueConfig.interval = queueConfig.interval || 1000

  const workers = []

  for (let i = 0; i < queueConfig.workers; i++) {
    workers.push(new Worker())
  }

  const getNext = (cb) => {
    cb = once(cb)
    db.createReadStream({ gte: `${queueName}-`, limit: 1 })
      .on('data', (data) => db.del(data.key, (err) => cb(err, data.value)))
      .on('error', cb)
      .on('end', cb)
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
      if (!item) return console.log('No queued items')

      const worker = workers.pop()

      worker(item, (err) => {
        if (err) console.error('Failed to process queue item', item, err)
        workers.push(worker)
      })
    })
  }

  processor()

  const Queue = {
    push (user, repo, opts, cb) {
      // If exists in queue discard
      // Push onto back of queue
    }
  }

  return Queue
}
