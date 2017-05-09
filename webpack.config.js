const webpack = require('webpack');

const path = require('path');
let _entry;

switch(process.env.NODE_ENV) {
  default:
    _entry = {
      "multiparty": "./lib/index.js"
    };
    break;
}

module.exports = {
  entry: _entry,
  devtool: "source-map",
  output: {
    path: path.join(__dirname, "dist"),
    publicPath: '/dist/',
    filename: process.env.NODE_ENV === "production" ? "[name].min.js" : "[name].js"
  },
  module: {
    rules: [
      { test: /\.json$/,
        exclude: /node_modules/,
        loader: 'json',
        enforce: 'pre'
      },
      {
        test: /\.(js)?$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015']
        }
      }
    ]
  },
  resolve: {
    extensions: ['*', '.js']
  },
  plugins: [
  ]
}


