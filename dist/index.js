'use strict';

var _client = require('./client');

var _client2 = _interopRequireDefault(_client);

var _view = require('./view');

var _view2 = _interopRequireDefault(_view);

var _ddWeb = require('./dd-web');

var _ddWeb2 = _interopRequireDefault(_ddWeb);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = { Client: _client2.default, View: _view2.default, WebShim: _ddWeb2.default };