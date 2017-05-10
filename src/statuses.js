// NOTE: PULLED FROM THE HORIZON LIB
// Before connecting the first time
const STATUS_UNCONNECTED = { type: 'unconnected' }
// After the websocket is opened and handshake is completed
const STATUS_READY = { type: 'ready' }
// After unconnected, maybe before or after connected. Any socket level error
const STATUS_ERROR = { type: 'error' }
// Occurs when the socket closes
const STATUS_DISCONNECTED = { type: 'disconnected' }
// DD specific
const STATUS_CONNECTING = { type: 'connecting' }
const STATUS_AUTHENTICATING = { type: 'authenticating' }

module.exports = { STATUS_UNCONNECTED, STATUS_READY, STATUS_ERROR, STATUS_DISCONNECTED, STATUS_CONNECTING, STATUS_AUTHENTICATING }