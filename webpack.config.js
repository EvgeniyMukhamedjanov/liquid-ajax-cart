const path = require('path');
var PACKAGE = require('./package.json');

module.exports = (env, argv) => { 
  let folder = 'assets';
  let filename = 'liquid-ajax-cart.js';

  if ( argv.mode === 'production' ) {
    folder = 'docs/releases';
    filename = `liquid-ajax-cart-v${PACKAGE.version}.js`;

    if ( env.last ) {
      folder = 'docs/releases/last';
    }

    if ( env.npm ) {
      folder = '_npm';
      filename = 'liquid-ajax-cart.js'
    }
  }

  return {
    mode: argv.mode,
    entry: './_src/index.ts',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
      filename,
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