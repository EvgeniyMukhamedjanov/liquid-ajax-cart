const path = require('path');

module.exports = {
  mode: 'production',
  entry: './_src/index.js',
  output: {
    filename: 'liquid-ajax-cart.js',
    path: path.resolve(__dirname, 'assets'),
    library: {
      type: 'module',
    },
  },
  experiments: {
    outputModule: true
  }
};