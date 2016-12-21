import ReactNative, { AsyncStorage } from 'react-native'

export default () => {
  var globalHash = {  }
  window.localStorage = {
    getItem: (key) => {
      return globalHash[key]
    },
    removeItem: (key) => {
      delete globalHash[key]
    },
    setItem: (key, value) => {
      AsyncStorage.setItem('@BB:' + key, JSON.stringify(value))
      globalHash[key] = value
    },
    prepopulateMap: (key, hash) => {
      globalHash[key] = hash
    },

    // We need to add an abstraction on Async.multiget since we have to stringify our JSON to be a string
    multiGet: (keys) => {
      return new Promise((resolve, reject) => {
        AsyncStorage.multiGet(keys.map((key) => '@BB:' + key)).then((values) => {
          resolve(values.map((kv) => [kv[0], JSON.parse(kv[1])]))
        }).catch((err) => {
          reject(err)
        })
      })
    }
  }
}