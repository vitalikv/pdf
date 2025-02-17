const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  //mode: 'development',
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'main.[contenthash].js',
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebPackPlugin({
      template: path.resolve(__dirname, './src/template.html'),
      filename: 'index.html',
    }),
    new CopyPlugin({
      patterns: [
        { from: './src/img', to: './img' },
        { from: 'src/php/*.php', to: 'php/[name][ext]' },
      ],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  optimization: {
    splitChunks: { chunks: 'all' },
  },
  devServer: {
    port: 3400,
    proxy: {
      '/php': {
        target: 'http://cs', // Адрес PHP-сервера
        changeOrigin: true,
        pathRewrite: { '^/php': '/pdf/src/php' }, // Перенаправляем /php на /pdf/src/php
        logLevel: 'debug', // Показывает логи прокси в консоли
      },
    },
  },
};
