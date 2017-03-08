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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var crypto = require('./crypto');

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
    this.loginUrl = this.scheme + this.horizonHost + '/login' + '?eventID=' + this.eventID + '&featureName=' + this.featureName;
    this.cleanEventID = this.eventID.replace(/-/g, '');
    this.currentUser = {};

    if (!options.skipShim && !global.localStorage) {
      var shimStorage = require('./native-localstorage-shim').default;
      shimStorage();
    }
  }

  _createClass(_class, [{
    key: 'connect',
    value: function connect() {
      var _this = this;

      return new Promise(function (resolve, reject) {
        // TODO - if we have a token, try to connect
        // IF we succeed, cool
        // IF we fail, call the endpoint to exchange a IS token for a JWT

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
            }
          }

          if (global.localStorage) {
            global.localStorage.setItem('@BB:' + _this.featureName + '_installation', installation);
          }
          _this.installation = installation;

          if (global.localStorage) {
            global.localStorage.setItem('@BB:' + _this.featureName + '_user', user);
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
            _this.horizon.currentUser().fetch().subscribe(function (user) {

              if (!_this.eventID || !_this.eventID.length) {
                _this.eventID = user.eventID;
                _this.cleanEventID = _this.eventID.replace(/-/g, '');
              }
              _this.initialLoginAttempt = false;
              _this.currentUser = user;
              resolve(user);
            });
          });

          _this.horizon.onSocketError(function (err) {
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
              _this.droppedConnectionCount++;
              finalizeLogin(token, installation, user, loginFromStoredToken);
              // TODO - should we notify that a connection was dropped and allow queries to be re-watched?
            }
          });

          _this.horizon.connect();
        };

        if (_this.options.token) {
          finalizeLogin(_this.options.token, {}, {}, true);
        } else {
          global.localStorage.multiGet(['horizon-jwt', _this.featureName + '_installation', _this.featureName + '_user']).then(function (_ref) {
            var _ref2 = _slicedToArray(_ref, 3),
                _ref2$ = _slicedToArray(_ref2[0], 2),
                tokenKey = _ref2$[0],
                token = _ref2$[1],
                _ref2$2 = _slicedToArray(_ref2[1], 2),
                instKey = _ref2$2[0],
                installation = _ref2$2[1],
                _ref2$3 = _slicedToArray(_ref2[2], 2),
                userKey = _ref2$3[0],
                user = _ref2$3[1];

            // DUMMY value for my user account
            token = false;
            if (!token) {
              requestLogin();
            } else {
              finalizeLogin(JSON.parse(token).horizon, installation, user, true);
            }
          });
        }
      });
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
      return this.featureName + '_' + this.cleanEventID + '_' + collectionName;
    }
  }, {
    key: 'getCollection',
    value: function getCollection(collectionName) {
      return this.horizon(this.getCollectionName(collectionName));
    }
  }, {
    key: 'insertIntoCollection',
    value: function insertIntoCollection(collectionName) {
      for (var _len = arguments.length, documents = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        documents[_key - 1] = arguments[_key];
      }

      return this.getCollection(collectionName).insert(documents);
    }
  }, {
    key: 'replaceInCollection',
    value: function replaceInCollection(collectionName) {
      for (var _len2 = arguments.length, documents = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        documents[_key2 - 1] = arguments[_key2];
      }

      return this.getCollection(collectionName).replace(documents);
    }
  }, {
    key: 'updateInCollection',
    value: function updateInCollection(collectionName) {
      for (var _len3 = arguments.length, documents = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        documents[_key3 - 1] = arguments[_key3];
      }

      return this.getCollection(collectionName).update(documents);
    }
  }, {
    key: 'upsertInCollection',
    value: function upsertInCollection(collectionName) {
      for (var _len4 = arguments.length, documents = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
        documents[_key4 - 1] = arguments[_key4];
      }

      return this.getCollection(collectionName).upsert(documents);
    }
  }, {
    key: 'removeFromCollection',
    value: function removeFromCollection(collectionName) {
      for (var _len5 = arguments.length, documents = Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
        documents[_key5 - 1] = arguments[_key5];
      }

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
      var q = this.getCollection(collectionName).findAll(userQuery);
      return watch ? q.watch() : q.fetch();
    }
  }, {
    key: 'fetchDocumentsInCollection',
    value: function fetchDocumentsInCollection(collectionName) {
      var query = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var watch = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      var collection = this.getCollection(collectionName);
      var q = query && Object.keys(query).length ? collection.findAll(query) : collection;
      return watch ? q.watch() : q.fetch();
    }
  }]);

  return _class;
}();

exports.default = _class;