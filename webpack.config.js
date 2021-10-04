const path = require('path');
var PACKAGE = require('./package.json');

module.exports = {
  mode: 'development',
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

module.exports = {
  mode: 'production',
  entry: './_src/index.js',
  output: {
    filename: `liquid-ajax-cart-${PACKAGE.version}.js`,
    path: path.resolve(__dirname, 'docs/releases'),
    library: {
      type: 'module',
    },
  },
  experiments: {
    outputModule: true
  }
};