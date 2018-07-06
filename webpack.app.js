'use strict';

const Path = require('path');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const str = JSON.stringify;
const env = process.env;

module.exports = {
  target: 'web',
  entry: {
    'app': './browser/src/app',
    'worker': './lib/workers/worker'
  },
  output: {
    path: Path.join(__dirname, 'browser'),
    filename: '[name].js'
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.BCOIN_NETWORK':
      str(env.BCOIN_NETWORK || 'regtest'),
     ' process.env.BCOIN_WORKER_FILE':
      str(env.BCOIN_WORKER_FILE || '/bms-worker.js')
       }),
    new UglifyJsPlugin()
  ]
};

