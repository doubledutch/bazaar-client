'use strict';

// NOTE: PULLED FROM THE HORIZON LIB
// Before connecting the first time
var STATUS_UNCONNECTED = { type: 'unconnected' };
// After the websocket is opened and handshake is completed
var STATUS_READY = { type: 'ready' };
// After unconnected, maybe before or after connected. Any socket level error
var STATUS_ERROR = { type: 'error' };
// Occurs when the socket closes
var STATUS_DISCONNECTED = { type: 'disconnected' };
// DD specific
var STATUS_CONNECTING = { type: 'connecting' };
var STATUS_AUTHENTICATING = { type: 'authenticating' };

module.exports = { STATUS_UNCONNECTED: STATUS_UNCONNECTED, STATUS_READY: STATUS_READY, STATUS_ERROR: STATUS_ERROR, STATUS_DISCONNECTED: STATUS_DISCONNECTED, STATUS_CONNECTING: STATUS_CONNECTING, STATUS_AUTHENTICATING: STATUS_AUTHENTICATING };