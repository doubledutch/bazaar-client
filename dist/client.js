'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _client = require('@horizon/client');

var _client2 = _interopRequireDefault(_client);

var _ddShim = require('./dd-shim');

var _ddShim2 = _interopRequireDefault(_ddShim);

var _BehaviorSubject = require('rxjs/BehaviorSubject');

var _statuses = require('./statuses');

var _statuses2 = _interopRequireDefault(_statuses);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var crypto = require('./crypto');


var TOKEN_DURATION = 1000 * 60 * 60; // 1 hour

var _class = function () {
  function _class(dd, options) {
    _classCallCheck(this, _class);

    this.DD = dd || _ddShim2.default;
    this.options = options;
    this.isSandboxed = options.isSandboxed;
    this.featureName = options.featureName;
    this.eventID = options.eventID;
    this.horizonHost = options.horizonHost;
    this.scheme = options.isSandboxed ? 'http://' : 'https://';
    this.apiRootURL = this.DD.apiRootURL;
    this.loginUrl = this.scheme + this.horizonHost + '/login' + '?eventID=' + this.eventID + '&featureName=' + this.featureName + '&apiRootURL=' + encodeURIComponent(this.apiRootURL);
    this.cleanEventID = this.eventID.replace(/-/g, '');
    this.currentUser = {};
    this.reconnectCallbacks = [];
    this.isDisconnecting = false;
    this.autoReconnect = options.autoReconnect;

    if (!options.skipShim && !global.localStorage) {
      var shimStorage = require('./native-localstorage-shim').default;
      shimStorage();
    }

    this.userID = (this.DD.currentUser && this.DD.currentUser.UserId ? this.DD.currentUser.UserId : 'anon') + '';
    this.status = new _BehaviorSubject.BehaviorSubject(_statuses2.default.STATUS_UNCONNECTED);
  }

  _createClass(_class, [{
    key: 'addOnReconnect',
    value: function addOnReconnect(callback) {
      this.reconnectCallbacks.push(callback);
    }
  }, {
    key: 'removeOnReconnect',
    value: function removeOnReconnect(callback) {
      this.reconnectCallbacks = this.reconnectCallbacks.filter(function (c) {
        return c !== callback;
      });
    }
  }, {
    key: 'getStorageKey',
    value: function getStorageKey(key) {
      return this.featureName + '_' + this.userID + '_' + key;
    }
  }, {
    key: 'connect',
    value: function connect() {
      var _this = this;

      return new Promise(function (resolve, reject) {
        // TODO - if we have a token, try to connect
        // IF we succeed, cool
        // IF we fail, call the endpoint to exchange a IS token for a JWT

        _this.status.next(_statuses2.default.STATUS_AUTHENTICATING);
        var requestLogin = function requestLogin() {
          _this.DD.requestAccessToken(function (err, token) {
            var loginURL = _this.loginUrl;

            fetch(loginURL, { method: 'POST', headers: { 'Authorization': 'Bearer ' + token } }).then(function (response) {
              if (response.status !== 200) {
                throw "Invalid response code: " + response.status;
              }
              return response.json();
            }).then(function (data) {
              finalizeLogin(data.token, data.installation, data.user, false);
            }).catch(function (err) {
              _this.status.next(_statuses2.default.STATUS_ERROR);
              reject(err);
            });
          });
        };

        _this.initialLoginAttempt = true;
        _this.droppedConnectionCount = 0;
        _this.lastDroppedConnection = null;

        var finalizeLogin = function finalizeLogin(token, installation, user, loginFromStoredToken) {
          if (token) {
            if (global.localStorage) {
              global.localStorage.prepopulateMap('horizon-jwt', JSON.stringify({ horizon: token }));
              global.localStorage.setItem(_this.getStorageKey('jwt'), token);
              global.localStorage.setItem(_this.getStorageKey('jwt_exp'), new Date().toISOString());
            }
          }

          if (global.localStorage) {
            global.localStorage.setItem(_this.getStorageKey('installation'), installation);
          }
          _this.installation = installation;

          if (global.localStorage) {
            global.localStorage.setItem(_this.getStorageKey('user'), user);
          }
          _this.currentUser = user;

          _this.horizon = (0, _client2.default)({
            host: _this.horizonHost,
            secure: !_this.isSandboxed,
            authType: {
              storeLocally: true,
              token: token
            },
            WebSocketCtor: _this.options.webSocketCtor
          });

          _this.horizon.onReady(function () {
            // We've connected, let's reduce our back-off for next reconnection
            _this.droppedConnectionCount = 0;
            _this.status.next(_statuses2.default.STATUS_READY);
            if (_this.initialLoginAttempt) {
              _this.horizon.currentUser().fetch().subscribe(function (user) {

                if (!_this.eventID || !_this.eventID.length) {
                  _this.eventID = user.eventID;
                  _this.cleanEventID = _this.eventID.replace(/-/g, '');
                }

                _this.initialLoginAttempt = false;
                _this.currentUser = user;
                resolve(user);
              });
            } else {
              _this.reconnectCallbacks.forEach(function (c) {
                return c();
              });
            }
          });

          _this.horizon.onSocketError(function (err) {
            if (!_this.isDisconnecting) {
              _this.status.next(_statuses2.default.STATUS_DISCONNECTED);

              // If we failed on our initial connection, the token is bad
              // OR we don't have the feature installed or something to that effect
              if (_this.initialLoginAttempt) {
                if (loginFromStoredToken) {
                  // try again?
                  requestLogin();
                } else {
                  reject(err);
                }
              } else {
                // Our connection was likely dropped. Let's try to connect again
                // TODO - do some checks on the last dropped connection
                _this.lastDroppedConnection = new Date();

                // Reconnect after a backoff period
                setTimeout(function () {
                  finalizeLogin(token, installation, user, loginFromStoredToken);
                }, _this.droppedConnectionCount++ * 1500);

                // TODO - should we notify that a connection was dropped and allow queries to be re-watched?
                // We do this above
              }
            } else {
              _this.status.next(_statuses2.default.STATUS_DISCONNECTED);
            }
          });

          _this.status.next(_statuses2.default.STATUS_CONNECTING);
          _this.horizon.connect();
        };

        if (_this.options.token) {
          finalizeLogin(_this.options.token, {}, {}, true);
        } else {
          global.localStorage.multiGet([_this.getStorageKey('jwt'), _this.getStorageKey('jwt_exp'), _this.getStorageKey('installation'), _this.getStorageKey('user')]).then(function (_ref) {
            var _ref2 = _slicedToArray(_ref, 4),
                _ref2$ = _slicedToArray(_ref2[0], 2),
                tokenKey = _ref2$[0],
                token = _ref2$[1],
                _ref2$2 = _slicedToArray(_ref2[1], 2),
                tokenExpKey = _ref2$2[0],
                tokenExp = _ref2$2[1],
                _ref2$3 = _slicedToArray(_ref2[2], 2),
                instKey = _ref2$3[0],
                installation = _ref2$3[1],
                _ref2$4 = _slicedToArray(_ref2[3], 2),
                userKey = _ref2$4[0],
                user = _ref2$4[1];

            if (token && tokenExp) {
              var date = new Date(tokenExp);
              var diff = new Date() - date;
              if (diff > TOKEN_DURATION) {
                token = null;
              }
            }
            if (!token) {
              requestLogin();
            } else {
              finalizeLogin(token, installation, user, true);
            }
          });
        }
      });
    }
  }, {
    key: 'disconnect',
    value: function disconnect() {
      if (this.horizon) {
        this.isDisconnecting = true;
        this.horizon.disconnect();
      }
    }
  }, {
    key: 'getUserID',
    value: function getUserID() {
      return this.currentUser.id;
    }
  }, {
    key: 'getUserIDFromEmail',
    value: function getUserIDFromEmail(emailAddress) {
      if (crypto) {
        return this.eventID + '_' + crypto.createHash('md5').update(emailAddress).digest('hex');
      } else {
        throw 'Crypto not currently supported';
      }
    }
  }, {
    key: 'getCollectionName',
    value: function getCollectionName(collectionName) {
      return this.featureName + '_' + /*this.cleanEventID + '_' + */collectionName;
    }
  }, {
    key: 'getCollection',
    value: function getCollection(collectionName) {
      return this.horizon(this.getCollectionName(collectionName));
    }
  }, {
    key: 'insertIntoCollection',
    value: function insertIntoCollection(collectionName) {
      var _this2 = this;

      for (var _len = arguments.length, documents = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        documents[_key - 1] = arguments[_key];
      }

      documents = documents.map(function (d) {
        return Object.assign({}, d, { event_id: _this2.eventID });
      });
      return this.getCollection(collectionName).insert(documents);
    }
  }, {
    key: 'replaceInCollection',
    value: function replaceInCollection(collectionName) {
      var _this3 = this;

      for (var _len2 = arguments.length, documents = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        documents[_key2 - 1] = arguments[_key2];
      }

      documents = documents.map(function (d) {
        return Object.assign({}, d, { event_id: _this3.eventID });
      });
      return this.getCollection(collectionName).replace(documents);
    }
  }, {
    key: 'updateInCollection',
    value: function updateInCollection(collectionName) {
      var _this4 = this;

      for (var _len3 = arguments.length, documents = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        documents[_key3 - 1] = arguments[_key3];
      }

      documents = documents.map(function (d) {
        return Object.assign({}, d, { event_id: _this4.eventID });
      });
      return this.getCollection(collectionName).update(documents);
    }
  }, {
    key: 'upsertInCollection',
    value: function upsertInCollection(collectionName) {
      var _this5 = this;

      for (var _len4 = arguments.length, documents = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
        documents[_key4 - 1] = arguments[_key4];
      }

      documents = documents.map(function (d) {
        return Object.assign({}, d, { event_id: _this5.eventID });
      });
      return this.getCollection(collectionName).upsert(documents);
    }
  }, {
    key: 'removeFromCollection',
    value: function removeFromCollection(collectionName) {
      var _this6 = this;

      for (var _len5 = arguments.length, documents = Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
        documents[_key5 - 1] = arguments[_key5];
      }

      documents = documents.map(function (d) {
        return Object.assign({}, d, { event_id: _this6.eventID });
      });
      return this.getCollection(collectionName).removeAll(documents);
    }
  }, {
    key: 'fetchUserDocumentsInCollection',
    value: function fetchUserDocumentsInCollection(collectionName) {
      var query = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var watch = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      var userQuery = { user_id: this.getUserID() };
      if (query) {
        userQuery = Object.assign({}, query, userQuery);
      }
      var eventScopedQuery = Object.assign({}, userQuery, { event_id: this.eventID });

      var q = this.getCollection(collectionName).findAll(eventScopedQuery);
      return watch ? this.wrapAndWatch(q) : q.fetch();
    }
  }, {
    key: 'fetchDocumentsInCollection',
    value: function fetchDocumentsInCollection(collectionName) {
      var query = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var watch = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      var collection = this.getCollection(collectionName);
      var eventScopedQuery = Object.assign({}, query, { event_id: this.eventID });
      var q = collection.findAll(eventScopedQuery);
      return watch ? this.wrapAndWatch(q) : q.fetch();
    }
  }, {
    key: 'wrapAndWatch',
    value: function wrapAndWatch(q) {
      var _this7 = this;

      if (this.autoReconnect) {
        return {
          query: q,
          subscribe: function subscribe() {
            var _q$watch2;

            for (var _len6 = arguments.length, args = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
              args[_key6] = arguments[_key6];
            }

            // When we subscribe, add a reconnect with the same call-backs
            // so we can handle re-connection automatically
            _this7.addOnReconnect(function () {
              var _q$watch;

              (_q$watch = q.watch()).subscribe.apply(_q$watch, args);
            });
            (_q$watch2 = q.watch()).subscribe.apply(_q$watch2, args);
          }
        };
      } else {
        return q.watch();
      }
    }
  }]);

  return _class;
}();

exports.default = _class;