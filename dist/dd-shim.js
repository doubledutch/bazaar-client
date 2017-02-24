'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = {
  setTitle: function setTitle() {},
  requestAccessToken: function requestAccessToken(callback) {
    return callback(null, 'fake-access-token');
  }
};