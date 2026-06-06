const path = require('path');

module.exports = {
  entry: './assets/js/src/index.js',
  output: {
    filename: 'esol-header.bundle.js',
    path: path.resolve(__dirname, 'assets/js/dist'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: { browsers: ['last 2 versions', '> 2%'] } }],
              ['@babel/preset-react', { runtime: 'automatic' }],
            ],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  mode: 'production',
  optimization: {
    minimize: true,
  },
  devtool: 'source-map',
};
