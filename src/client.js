import ReactNative, { Alert, AsyncStorage } from 'react-native'
import Horizon from '@horizon/client'
import shimStorage from './native-localstorage-shim'
import shimDD from './dd-shim'

export default class {

  constructor(DD, options) {
    this.DD = DD || shimDD
    this.isSandboxed = options.isSandboxed
    this.featureName = options.featureName
    this.eventID = options.eventID
    this.horizonHost = options.horizonHost
    this.scheme = options.isSandboxed ? 'http://' : 'https://'
    this.loginUrl = this.scheme + this.horizonHost + '/login' + '?eventID=' + this.eventID + '&featureName=' + this.featureName
    this.cleanEventID = this.eventID.replace(/-/g, '')
    this.user = {}

    shimStorage()
  }

  connect() {
    return new Promise((resolve, reject) => {
      // TODO - if we have a token, try to connect
      // IF we succeed, cool
      // IF we fail, call the endpoint to exchange a IS token for a JWT

      const requestLogin = () => {
        this.DD.requestAccessToken((err, token) => {
          var loginURL = this.loginUrl

          fetch(loginURL, { method: 'POST', headers: { 'Authorization': 'Bearer ' + token } }).
            then((response) => {
              if (response.status !== 200) {
                throw "Invalid response code: " + response.status
              }
              return response.json()
            }).then((data) => {
              finalizeLogin(data.token, data.installation, data.user, false)
            }).catch((err) => {
              reject(err)
            })
        })
      }

      this.initialLoginAttempt = true
      this.droppedConnectionCount = 0
      this.lastDroppedConnection = null

      const finalizeLogin = (token, installation, user, loginFromStoredToken) => {
        if (token) {
          window.localStorage.prepopulateMap('horizon-jwt', JSON.stringify({ horizon: token }))
        }

        window.localStorage.setItem('@BB:' + this.featureName + '_installation', installation);
        this.installation = installation

        window.localStorage.setItem('@BB:' + this.featureName + '_user', user);
        this.user = user

        this.horizon = Horizon({
          host: this.horizonHost,
          secure: !this.isSandboxed,
          authType: {
            storeLocally: true,
            token: token
          }
        })

        this.horizon.onReady(() => {
          this.horizon.currentUser().fetch().subscribe((user) => {
            this.initialLoginAttempt = false
            this.currentUser = user
            resolve(user)
          })
        })

        this.horizon.onSocketError((err) => {
          // If we failed on our initial connection, the token is bad
          // OR we don't have the feature installed or something to that effect
          if (this.initialLoginAttempt) {
            if (loginFromStoredToken) {
              // try again?
              requestLogin()
            } else {
              reject(err)
            }
          } else {
            // Our connection was likely dropped. Let's try to connect again
            // TODO - do some checks on the last dropped connection
            this.lastDroppedConnection = new Date()
            this.droppedConnectionCount++
            finalizeLogin(token, installation, user, loginFromStoredToken)
            // TODO - should we notify that a connection was dropped and allow queries to be re-watched?
          }
        })

        this.horizon.connect()
      }

      window.localStorage.multiGet(['horizon-jwt', this.featureName + '_installation', this.featureName + '_user']).then(([[tokenKey, token], [instKey, installation], [userKey, user]]) => {
        // DUMMY value for my user account
        token = false
        if (!token) {
          requestLogin()
        } else {
          finalizeLogin(JSON.parse(token).horizon, installation, user, true)
        }
      })
    })
  }

  getUserID() {
    return this.user.id
  }

  getCollectionName(collectionName) {
    return this.featureName + '_' + this.cleanEventID + '_' + collectionName
  }

  getCollection(collectionName) {
    return this.horizon(this.getCollectionName(collectionName))
  }

  insertIntoCollection(collectionName, ...documents) {
    return this.getCollection(collectionName).insert(documents)
  }

  replaceInCollection(collectionName, ...documents) {
    return this.getCollection(collectionName).replace(documents)
  }

  updateInCollection(collectionName, ...documents) {
    return this.getCollection(collectionName).update(documents)
  }

  upsertInCollection(collectionName, ...documents) {
    return this.getCollection(collectionName).upsert(documents)
  }

  removeFromCollection(collectionName, ...documents) {
    return this.getCollection(collectionName).removeAll(documents)
  }

  fetchUserDocumentsInCollection(collectionName, query = null, watch = false) {
    let userQuery = { user_id: this.getUserID() }
    if (query) {
      userQuery = Object.assign({}, query, userQuery)
    }
    const q = this.getCollection(collectionName).findAll(userQuery)
    return watch ? q.watch() : q.fetch()
  }

  fetchDocumentsInCollection(collectionName, query = null, watch = false) {
    const collection = this.getCollection(collectionName)
    const q = query && Object.keys(query).length ? collection.findAll(query) : collection
    return watch ? q.watch() : q.fetch()
  }
}