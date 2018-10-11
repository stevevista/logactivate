module.exports = {
    root: true,
    env: {
      browser: true,
      node: true
    },
    extends: 'standard',
    globals: {
    },
    plugins: [
    ],
    'rules': {
      // allow paren-less arrow functions
      'arrow-parens': 0,
      // allow async-await
      'generator-star-spacing': 0,
      // allow debugger during development
      'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
      'object-curly-spacing': 0
    }
}
