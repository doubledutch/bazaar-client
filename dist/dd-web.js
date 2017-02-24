'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var bearerPrefix = 'Bearer ';
exports.default = { install: function install(onReady) {
    global.DD.Events.onReady(function () {
      global.DD.Events.getCurrentUserAsync(function (userJSON) {
        global.DD.Events.getCurrentEventAsync(function (eventJSON) {
          onReady({
            primaryColor: '#000',
            currentUser: userJSON,
            currentEvent: eventJSON,
            configuration: eventJSON,
            apiRootURL: 'https://',
            bundleURL: null,
            setTitle: function setTitle() {
              console.warn('setTitle not implemented on web');
            },
            requestAccessToken: function requestAccessToken(callback) {
              global.DD.Events.getSignedAPIAsync('', '', function (url, auth) {
                callback(null, auth.substring(bearerPrefix.length, auth.length));
              });
            },
            refreshAccessToken: function refreshAccessToken(token, callback) {
              global.DD.Events.getSignedAPIAsync('', '', function (url, auth) {
                callback(null, auth.substring(bearerPrefix.length, auth.length));
              });
            },
            canOpenURL: function canOpenURL(url, callback) {
              callback(null, true);
            },
            openURL: function openURL(url) {
              document.location = url;
            },
            showMenu: function showMenu(url) {
              return;
            },
            setNavigationBarHidden: function setNavigationBarHidden(hidden, callback) {
              return;
            }
          });
        });
      });
    });
  } };