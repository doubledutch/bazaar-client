import Horizon from '@horizon/client'
import shimDD from './dd-shim'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
const crypto = require('./crypto')
import Statuses from './statuses'

export default class {

  constructor(dd, options) {
    this.DD = dd || shimDD
    this.options = options
    this.isSandboxed = options.isSandboxed
    this.featureName = options.featureName
    this.eventID = options.eventID
    this.horizonHost = options.horizonHost
    this.scheme = options.isSandboxed ? 'http://' : 'https://'
    this.apiRootURL = this.DD.apiRootURL
    this.loginUrl = this.scheme + this.horizonHost +
      '/login' + '?eventID=' + this.eventID +
      '&featureName=' + this.featureName +
      '&apiRootURL=' + encodeURIComponent(this.apiRootURL)
    this.cleanEventID = this.eventID.replace(/-/g, '')
    this.currentUser = {}
    this.reconnectCallbacks = []
    this.isDisconnecting = false
    this.autoReconnect = options.autoReconnect

    if (!options.skipShim && !global.localStorage) {
      const shimStorage = require('./native-localstorage-shim').default
      shimStorage()
    }

    this.status = new BehaviorSubject(Statuses.STATUS_UNCONNECTED)
  }

  addOnReconnect(callback) {
    this.reconnectCallbacks.push(callback)
  }

  removeOnReconnect(callback) {
    this.reconnectCallbacks = this.reconnectCallbacks.filter((c) => c !== callback)
  }

  connect() {
    return new Promise((resolve, reject) => {
      // TODO - if we have a token, try to connect
      // IF we succeed, cool
      // IF we fail, call the endpoint to exchange a IS token for a JWT

      this.status.next(Statuses.STATUS_AUTHENTICATING)
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
              this.status.next(Statuses.STATUS_ERROR)
              reject(err)
            })
        })
      }

      this.initialLoginAttempt = true
      this.droppedConnectionCount = 0
      this.lastDroppedConnection = null

      const finalizeLogin = (token, installation, user, loginFromStoredToken) => {
        if (token) {
          if (global.localStorage) {
            global.localStorage.prepopulateMap('horizon-jwt', JSON.stringify({ horizon: token }))
          }
        }

        if (global.localStorage) {
          global.localStorage.setItem('@BB:' + this.featureName + '_installation', installation);
        }
        this.installation = installation

        if (global.localStorage) {
          global.localStorage.setItem('@BB:' + this.featureName + '_user', user);
        }
        this.currentUser = user

        this.horizon = Horizon({
          host: this.horizonHost,
          secure: !this.isSandboxed,
          authType: {
            storeLocally: true,
            token: token
          },
          WebSocketCtor: this.options.webSocketCtor
        })

        this.horizon.onReady(() => {
          // We've connected, let's reduce our back-off for next reconnection
          this.droppedConnectionCount = 0
          this.status.next(Statuses.STATUS_READY)
          if (this.initialLoginAttempt) {
            this.horizon.currentUser().fetch().subscribe((user) => {

              if (!this.eventID || !this.eventID.length) {
                this.eventID = user.eventID
                this.cleanEventID = this.eventID.replace(/-/g, '')
              }

              this.initialLoginAttempt = false
              this.currentUser = user
              resolve(user)
            })
          } else {
            this.reconnectCallbacks.forEach((c) => c())
          }
        })

        this.horizon.onSocketError((err) => {
          if (!this.isDisconnecting) {
            this.status.next(Statuses.STATUS_DISCONNECTED)

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

              // Reconnect after a backoff period
              setTimeout(() => {
                finalizeLogin(token, installation, user, loginFromStoredToken)
              }, this.droppedConnectionCount++ * 1500)

              // TODO - should we notify that a connection was dropped and allow queries to be re-watched?
              // We do this above
            }
          } else {
            this.status.next(Statuses.STATUS_DISCONNECTED)
          }
        })

        this.status.next(Statuses.STATUS_CONNECTING)
        this.horizon.connect()
      }

      if (this.options.token) {
        finalizeLogin(this.options.token, {}, {}, true)
      } else {
        global.localStorage.multiGet(['horizon-jwt', this.featureName + '_installation', this.featureName + '_user']).then(([[tokenKey, token], [instKey, installation], [userKey, user]]) => {
          // DUMMY value for my user account
          token = false
          if (!token) {
            requestLogin()
          } else {
            finalizeLogin(JSON.parse(token).horizon, installation, user, true)
          }
        })
      }
    })
  }

  disconnect() {
    if (this.horizon) {
      this.isDisconnecting = true
      this.horizon.disconnect()
    }
  }

  getUserID() {
    return this.currentUser.id
  }
  getUserIDFromEmail(emailAddress) {
    if (crypto) {
      return this.eventID + '_' + crypto.createHash('md5').update(emailAddress).digest('hex')
    } else {
      throw 'Crypto not currently supported'
    }
  }

  getCollectionName(collectionName) {
    return this.featureName + '_' + /*this.cleanEventID + '_' + */collectionName
  }

  getCollection(collectionName) {
    return this.horizon(this.getCollectionName(collectionName))
  }

  insertIntoCollection(collectionName, ...documents) {
    documents = documents.map((d) => Object.assign({}, d, { event_id: this.eventID }))
    return this.getCollection(collectionName).insert(documents)
  }

  replaceInCollection(collectionName, ...documents) {
    documents = documents.map((d) => Object.assign({}, d, { event_id: this.eventID }))
    return this.getCollection(collectionName).replace(documents)
  }

  updateInCollection(collectionName, ...documents) {
    documents = documents.map((d) => Object.assign({}, d, { event_id: this.eventID }))
    return this.getCollection(collectionName).update(documents)
  }

  upsertInCollection(collectionName, ...documents) {
    documents = documents.map((d) => Object.assign({}, d, { event_id: this.eventID }))
    return this.getCollection(collectionName).upsert(documents)
  }

  removeFromCollection(collectionName, ...documents) {
    documents = documents.map((d) => Object.assign({}, d, { event_id: this.eventID }))
    return this.getCollection(collectionName).removeAll(documents)
  }

  fetchUserDocumentsInCollection(collectionName, query = null, watch = false) {
    let userQuery = { user_id: this.getUserID() }
    if (query) {
      userQuery = Object.assign({}, query, userQuery)
    }
    const eventScopedQuery = Object.assign({}, userQuery, { event_id: this.eventID })

    const q = this.getCollection(collectionName).findAll(eventScopedQuery)
    return watch ? this.wrapAndWatch(q) : q.fetch()
  }

  fetchDocumentsInCollection(collectionName, query = {}, watch = false) {
    const collection = this.getCollection(collectionName)
    const eventScopedQuery = Object.assign({}, query, { event_id: this.eventID })
    const q = collection.findAll(eventScopedQuery)
    return watch ? this.wrapAndWatch(q) : q.fetch()
  }

  wrapAndWatch(q) {
    if (this.autoReconnect) {
      return {
        query: q,
        subscribe: (...args) => {
          // When we subscribe, add a reconnect with the same call-backs
          // so we can handle re-connection automatically
          this.addOnReconnect(() => {
            q.watch().subscribe(...args)
          })
          q.watch().subscribe(...args)
        }
      }
    } else {
      return query.watch()
    }
  }
}