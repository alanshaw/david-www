module.exports = () => {
  const batch = {}

  return {
    /**
     * Create or add a callback function to the end of a batch for a given key.
     * @param key
     * @param cb
     */
    push (key, cb) {
      batch[key] = batch[key] || []
      batch[key].push(cb)
    },

    /**
     * Determine if there is a batch for the given key.
     * @param {String} key
     * @returns {boolean}
     */
    exists: (key) => !!batch[key],

    /**
     * Call all the batched callback functions for a key and remove them.
     * @param {String} key ID of the batch operation
     * @param {Function} fn Function to call for each
     */
    call (key, fn) {
      const cbs = batch[key]
      delete batch[key]
      cbs.forEach(fn)
    }
  }
}
