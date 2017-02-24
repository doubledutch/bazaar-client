import Horizon from '@horizon/client'
import shimDD from './dd-shim'
const crypto = require('./crypto')

export default class {

  constructor(dd, options) {
    this.DD = dd || shimDD
    this.options = options
    this.isSandboxed = options.isSandboxed
    this.featureName = options.featureName
    this.eventID = options.eventID
    this.horizonHost = options.horizonHost
    this.scheme = options.isSandboxed ? 'http://' : 'https://'
    this.loginUrl = this.scheme + this.horizonHost + '/login' + '?eventID=' + this.eventID + '&featureName=' + this.featureName
    this.cleanEventID = this.eventID.replace(/-/g, '')
    this.currentUser = {}

    if (!options.skipShim && !global.localStorage) {
      const shimStorage = require('./native-localstorage-shim').default
      shimStorage()
    }
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
          this.horizon.currentUser().fetch().subscribe((user) => {

            if (!this.eventID || !this.eventID.length) {
              this.eventID = user.eventID
              this.cleanEventID = this.eventID.replace(/-/g, '')
            }
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

  getUserID() {
    return this.user.id
  }
  getUserIDFromEmail(emailAddress) {
    if (crypto) {
      return this.eventID + '_' + crypto.createHash('md5').update(emailAddress).digest('hex')
    } else {
      throw 'Crypto not currently supported'
    }
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