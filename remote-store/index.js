let { listeners, subscribe, destroy, change, bunching } = require('../store')

let loading, loaded
if (process.env.NODE_ENV === 'production') {
  loading = Symbol()
  loaded = Symbol()
} else {
  loading = Symbol('loading')
  loaded = Symbol('loaded')
}

function triggerChanges (store) {
  let totalChanges = store[bunching]
  delete store[bunching]
  for (let listener of store[listeners]) {
    listener(store, totalChanges)
  }
}

class RemoteStore {
  constructor (id) {
    this[listeners] = []
    this.id = id
  }

  [subscribe] (listener) {
    this[listeners].push(listener)
    return () => {
      this[listeners] = this[listeners].filter(i => i !== listener)
      if (!this[listeners].length) {
        setTimeout(() => {
          if (!this[listeners].length) {
            if (this.constructor.loaded.delete(this.id)) {
              if (this[destroy]) this[destroy]()
            }
          }
        })
      }
    }
  }

  [change] (key, value) {
    if (this[key] === value) return
    this[key] = value
    if (!this[bunching]) {
      this[bunching] = {}
      if (this[loaded]) {
        setTimeout(() => triggerChanges(this))
      } else {
        this[loading].then(() => triggerChanges(this))
      }
    }
    this[bunching][key] = value
  }
}

RemoteStore.load = function (id, client) {
  if (!this.loaded) {
    this.loaded = new Map()
  }
  if (!this.loaded.has(id)) {
    this.loaded.set(id, new this(id, client))
  }
  return this.loaded.get(id)
}

if (process.env.NODE_ENV !== 'production') {
  RemoteStore.prototype[change] = function (key, value) {
    if (this[key] === value) return
    Object.defineProperty(this, key, {
      configurable: true,
      enumerable: true,
      writable: false,
      value
    })
    if (!this[bunching]) {
      this[bunching] = {}
      if (this[loaded]) {
        setTimeout(() => triggerChanges(this))
      } else {
        this[loading].then(() => triggerChanges(this))
      }
    }
    this[bunching][key] = value
  }
}

module.exports = {
  RemoteStore,
  loading,
  loaded
}
