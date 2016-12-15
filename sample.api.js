import React, { Component } from 'react'
import ReactNative, { AsyncStorage, Alert } from 'react-native'
import Horizon from '@horizon/client'
import shimStorage from './native-localstorage-shim'

const DD = ReactNative.NativeModules.DDBindings
const cardsBaseURL = "https://stroom.doubledutch.me/api/cards"
const templatesBaseURL = "https://stroom.doubledutch.me/api/templates"
const horizonHost = 'localhost:8181'

export default class {

  constructor(featureName, eventID) {
    this.featureName = featureName
    this.eventID = eventID
    this.cleanEventID = eventID.replace(/-/g, '')
    this.user = {}

    shimStorage()
  }

  connect() {
    return new Promise((resolve, reject) => {
      // TODO - if we have a token, try to connect
      // IF we succeed, cool
      // IF we fail, call the endpoint to exchange a IS token for a JWT

      const requestLogin = () => {
        DD.requestAccessToken((err, token) => {
          var loginURL = 'http://localhost:8181/login' + '?eventID=' + this.eventID + '&featureName=' + this.featureName

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

      const finalizeLogin = (token, installation, user, loginFromStoredToken) => {
        if (token) {
          window.localStorage.prepopulateMap('horizon-jwt', JSON.stringify({ horizon: token }))
        }

        window.localStorage.setItem('@BB:' + this.featureName + '_installation', installation);
        this.installation = installation

        window.localStorage.setItem('@BB:' + this.featureName + '_user', user);
        this.user = user

        this.horizon = Horizon({
          host: horizonHost,
          authType: {
            storeLocally: true,
            token: token
          }
        })

        this.horizon.onReady(() => {
          this.horizon.currentUser().fetch().subscribe((user) => {
            this.currentUser = user
            resolve(user)
          })
        })

        this.horizon.onSocketError((err) => {
          Alert.alert(err)
          if (loginFromStoredToken) {
            // try again?
            requestLogin()
          } else {
            reject(err)
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