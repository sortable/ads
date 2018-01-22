const path = require('path');
const webpack = require("webpack");

var PATHS = {
  entryPoint: path.resolve(__dirname, 'src/ads.ts'),
  bundles: path.resolve(__dirname, '_bundles')
};

module.exports = {
  entry: {
    'ads-manager': [PATHS.entryPoint],
    'ads-manager.min': [PATHS.entryPoint]
  },
  devtool: 'inline-source-map',
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      minimize: true,
      sourceMap: true,
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
          loader: 'ts-loader',
          options: {
            compilerOptions: {
              declaration: false
            }
          }
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
    libraryTarget: 'umd',
    library: 'AdsManager',
    umdNamedDefine: true
  }
}
