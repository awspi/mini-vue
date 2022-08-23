const path = require('path');

module.exports = {
  mode: 'development',
  // devtool: false,
  devtool: 'inline-cheap-source-map',
  entry: './src/index.js',
  output: {
    filename: 'mini-vue.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'src/examples'),
    },
    hot: true,
  },
};
