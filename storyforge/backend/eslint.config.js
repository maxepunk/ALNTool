const js = require('@eslint/js');
const customRules = require('./eslint-rules');

module.exports = [
  // Base configuration
  js.configs.recommended,
  
  // Global configuration
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        // Node.js globals
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        exports: 'writable',
        global: 'readonly',
        module: 'writable',
        process: 'readonly',
        require: 'readonly',
        // Jest globals
        afterAll: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        describe: 'readonly',
        expect: 'readonly',
        it: 'readonly',
        jest: 'readonly',
        test: 'readonly'
      }
    },
    plugins: {
      'custom': customRules
    },
    rules: {
      // Custom rule to prevent hardcoded business values
      'custom/no-hardcoded-business-values': 'error',
      
      // Other best practices
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'brace-style': ['error', '1tbs'],
      'indent': ['error', 2],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'never'],
      'no-multiple-empty-lines': ['error', { max: 1 }],
      'no-trailing-spaces': 'error'
    }
  },
  
  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      'data/**',
      '*.test.js',
      '*.spec.js',
      'test/**',
      'scripts/**',
      'migrations/**',
      'migration-scripts/**',
      'src/config/GameConstants.js' // GameConstants can have hardcoded values
    ]
  }
];