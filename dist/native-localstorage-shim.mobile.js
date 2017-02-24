'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _reactNative = require('react-native');

var _reactNative2 = _interopRequireDefault(_reactNative);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function () {
  var globalHash = {};
  global.localStorage = {
    getItem: function getItem(key) {
      return globalHash[key];
    },
    removeItem: function removeItem(key) {
      delete globalHash[key];
    },
    setItem: function setItem(key, value) {
      _reactNative.AsyncStorage.setItem('@BB:' + key, JSON.stringify(value));
      globalHash[key] = value;
    },
    prepopulateMap: function prepopulateMap(key, hash) {
      globalHash[key] = hash;
    },

    // We need to add an abstraction on Async.multiget since we have to stringify our JSON to be a string
    multiGet: function multiGet(keys) {
      return new Promise(function (resolve, reject) {
        _reactNative.AsyncStorage.multiGet(keys.map(function (key) {
          return '@BB:' + key;
        })).then(function (values) {
          resolve(values.map(function (kv) {
            return [kv[0], JSON.parse(kv[1])];
          }));
        }).catch(function (err) {
          reject(err);
        });
      });
    }
  };
};