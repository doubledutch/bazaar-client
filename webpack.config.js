const BUILD_ALL = (process.env.NODE_ENV === 'production')

const build = require('./webpack.client.config.js')

if (BUILD_ALL) {
  module.exports = [
    build({
      FILENAME: 'bazaar-dev.js',
      DEV_BUILD: true,
      POLYFILL: true,
    }),
    build({
      FILENAME: 'bazaar.js',
      DEV_BUILD: false,
      POLYFILL: true,
    }),
  ]
} else {
  module.exports = [
    build({
      // same filename as prod build to simplify switching
      FILENAME: 'bazaar.js',
      DEV_BUILD: true,
      POLYFILL: true,
    }),
  ]
}
