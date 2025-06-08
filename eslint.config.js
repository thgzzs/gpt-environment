export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: { document: 'readonly', window: 'readonly' }
    },
    rules: {
    }
  }
];
