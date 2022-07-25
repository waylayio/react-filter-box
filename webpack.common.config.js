var path = require('path');
var webpack = require('webpack');

module.exports = {
  resolve: {
    extensions: ['.ts', '.tsx', '.webpack.js', '.web.js', '.js']
  },
  module: {
    rules: [
      {
        test: [/\.ts$/, /\.tsx$/],
        loader: 'ts-loader'
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
  }
};
