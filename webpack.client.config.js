const path = require('path')

const BannerPlugin = require('webpack/lib/BannerPlugin')
const DedupePlugin = require('webpack/lib/optimize/DedupePlugin')
const DefinePlugin = require('webpack/lib/DefinePlugin')
const OccurrenceOrderPlugin = require(
  'webpack/lib/optimize/OccurrenceOrderPlugin')
const UglifyJsPlugin = require('webpack/lib/optimize/UglifyJsPlugin')
const ProvidePlugin = require('webpack/lib/ProvidePlugin')

module.exports = function(buildTarget) {
  const FILENAME = buildTarget.FILENAME
  const DEV_BUILD = buildTarget.DEV_BUILD
  const SOURCEMAPS = !process.env.NO_SOURCEMAPS

  return {
    entry: {
      bazaar: './src/index.js',
    },
    target: 'web',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: FILENAME,
      library: 'Bazaar', // window.Bazaar if loaded by a script tag
      libraryTarget: 'umd',
      pathinfo: DEV_BUILD, // Add module filenames as comments in the bundle
      devtoolModuleFilenameTemplate: DEV_BUILD ?
        function(file) {
          if (file.resourcePath.indexOf('webpack') >= 0) {
            return `webpack:///${file.resourcePath}`
          } else {
            // Show correct paths in stack traces
            return path.join('..', file.resourcePath)
              .replace(/~/g, 'node_modules')
          }
        } :
      null,
    },
    externals: [
      { ws: 'commonjs ws' },
      { 'react-native': 'react-native' }
    ],
    debug: DEV_BUILD,
    devtool: SOURCEMAPS ? (DEV_BUILD ? 'source-map' : 'source-map') : false,
    module: {
      noParse: [
      ],
      preLoaders: [],
      loaders: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel',
          query: {
            presets: ['react', 'es2015'],
            cacheDirectory: true,
            extends: path.resolve(__dirname, 'package.json'),
          },
        },
      ],
    },
    plugins: [
      new BannerPlugin('__LICENSE__'),
      // Possibility to replace constants such as `if (__DEV__)`
      // and thus strip helpful warnings from production build:
      new DefinePlugin({
        'process.env.NODE_ENV': (DEV_BUILD ? 'development' : 'production'),
      }),
      new ProvidePlugin({
        Promise: 'es6-promise',
      }),
    ].concat(DEV_BUILD ? [] : [
      new DedupePlugin(),
      new OccurrenceOrderPlugin(),
      new UglifyJsPlugin({
        compress: {
          screw_ie8: false,
          warnings: false,
        },
        mangle: {
          except: [],
        },
      }),
    ]),
    node: {
      // Don't include unneeded node libs in package
      process: false,
      fs: false,
      __dirname: false,
      __filename: false,
    },
  }
}
