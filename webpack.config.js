var path = require('path');
var webpack = require('webpack');
var _ = require("lodash");
var ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
var commonConfig = require("./webpack.common.config");

var config = _.assign(commonConfig, {
  devtool: 'eval',
  mode: "development",
  entry: [
    'webpack-dev-server/client?http://localhost:3000',
    'webpack/hot/only-dev-server',
    './src/example/index.tsx'
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/static/'
  },
  module: {
    rules: [
      {
        test: [/\.ts$/, /\.tsx$/],
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  useBuiltIns: 'entry',
                  targets: {
                    chrome: '40',
                    firefox: '40',
                    safari: '8',
                    edge: '11',
                    ie: '11'
                  }
                }],
                '@babel/preset-react',
                '@babel/preset-typescript'
              ],
              plugins: [
                ['react-refresh/babel', { "skipEnvCheck": true }]
              ]
            }
          }
        ]
      },
      {
        test: [/\.less$/, /\.css$/],
        use:[
          {loader: 'style-loader'},
          {loader: 'css-loader'},
          {loader: 'less-loader'}
        ] 
      },
      {
        test: /\.pegjs$/,
        loader: "pegjs-loader"
      }
    ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new ReactRefreshWebpackPlugin({
      overlay: false
    })
  ]
})

module.exports = config;

