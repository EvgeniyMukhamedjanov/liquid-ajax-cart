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

module.exports = (env) => { 
  let folder = 'docs/releases';
  if ( env.last ) {
    folder = 'docs/releases/last';
  }

  return {
    mode: 'production',
    entry: './_src/index.js',
    output: {
      filename: `liquid-ajax-cart-v${PACKAGE.version.replace('.', '-').replace('.', '-')}.js`,
      path: path.resolve(__dirname, folder),
      library: {
        type: 'module',
      },
    },
    experiments: {
      outputModule: true
    }
  };
}