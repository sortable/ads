const path = require('path');
const webpack = require("webpack");

var PATHS = {
  entryPoint: path.resolve(__dirname, 'src/sortableads.ts'),
  bundles: path.resolve(__dirname, 'dist')
};

module.exports = {
  entry: {
    'sortableads': [PATHS.entryPoint],
    'sortableads.min': [PATHS.entryPoint]
  },
  devtool: 'inline-source-map',
  devServer: {
    port:9000
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      minimize: true,
      include: /\.min\.js$/,
    })
  ],
  module: {
    rules: [
      {
        test: /\.ts$/,
        enforce: 'pre',
        loader: 'tslint-loader'
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader'
        }
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    path: PATHS.bundles,
    filename: '[name].js',
  }
}
