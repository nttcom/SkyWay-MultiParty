const webpack = require('webpack');

const path = require('path')
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
    preLoaders: [
      { test: /\.json$/, exclude: /node_modules/, loader: 'json'  }
    ],
    loaders: [
      {
        test: /\.(js)?$/,
        exclude: /(node_modules)/,
        loader: 'babel', // 'babel-loader' is also a legal name to reference
        query: {
          presets: ['es2015']
        }
      },
    ]
  },
  resolve: {
    extensions: ['', '.js']
  },
  plugins: [
  ]
}


