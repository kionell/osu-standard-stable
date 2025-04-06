import globals from 'globals';
import jslint from '@eslint/js';
import tslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';

export default tslint.config(
  // @type { import('eslint').Linter.Config }
  {
    extends: [
      jslint.configs.recommended,
      ...tslint.configs.recommended,
    ],
    ignores: [
      'node_modules',
      '**/node_modules',
    ],
    files: [
      '**/*.{ts,mts}',
    ],
    plugins: {
      '@stylistic': stylistic,
      '@typescript-eslint': tslint.plugin,
    },
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: tslint.parser,
      parserOptions: {
        sourceType: 'module',
      },
    },
    rules: {
      /* Possible problems */
      'no-duplicate-imports': 'error',
      'no-fallthrough': 'off',
      'no-self-compare': 'error',
      'no-template-curly-in-string': 'error',
      'no-unmodified-loop-condition': 'error',

      /* Suggestions */
      'accessor-pairs': ['error', {
        'setWithoutGet': true,
      }],
      'block-scoped-var': 'error',
      'curly': ['error', 'multi-line'],
      'eqeqeq': ['error', 'always'],
      'grouped-accessor-pairs': ['error', 'getBeforeSet'],
      'no-case-declarations': 'error',
      'no-else-return': 'error',
      'no-unexpected-multiline': 'error',
      'no-unneeded-ternary': 'error',
      'no-useless-constructor': 'off',
      'no-useless-escape': 'error',
      'no-useless-return': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-const': 'error',
      'yoda': ['error', 'never', {
        'exceptRange': true,
      }],

      /* Stylistic */
      '@stylistic/array-bracket-newline': ['error', 'consistent'],
      '@stylistic/array-bracket-spacing': 'error',
      '@stylistic/arrow-parens': 'error',
      '@stylistic/arrow-spacing': 'error',
      '@stylistic/block-spacing': 'error',
      '@stylistic/brace-style': ['error', 'stroustrup'],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/comma-spacing': ['error', {
        'before': false,
        'after': true,
      }],
      '@stylistic/comma-style': ['error', 'last'],
      '@stylistic/dot-location': ['error', 'property'],
      '@stylistic/eol-last': ['error', 'always'],
      '@stylistic/func-call-spacing': 'error',
      '@stylistic/function-call-argument-newline': ['error', 'consistent'],
      '@stylistic/function-paren-newline': ['error', 'consistent'],
      '@stylistic/generator-star-spacing': ['error', {
        'before': false,
        'after': true,
        'anonymous': 'neither',
        'method': {
          'before': true,
          'after': false,
        },
      }],
      '@stylistic/implicit-arrow-linebreak': 'error',
      '@stylistic/indent': ['error', 2, {
        'SwitchCase': 1,
      }],
      '@stylistic/key-spacing': 'error',
      '@stylistic/keyword-spacing': ['error', {
        'overrides': {
          'else': {
            'before': false,
            'after': true,
          },
        },
      }],
      '@stylistic/linebreak-style': 'off',
      '@stylistic/lines-around-comment': ['error', {
        'beforeBlockComment': true,
        'beforeLineComment': false,
        'allowBlockStart': true,
        'allowBlockEnd': true,
        'allowObjectStart': true,
        'allowObjectEnd': true,
        'allowArrayStart': true,
        'allowArrayEnd': true,
        'allowClassStart': true,
        'allowClassEnd': true,
        'allowEnumStart': true,
        'allowEnumEnd': true,
        'allowInterfaceStart': true,
        'allowInterfaceEnd': true,
        'allowModuleStart': true,
        'allowModuleEnd': true,
        'allowTypeStart': true,
        'allowTypeEnd': true,
      }],
      '@stylistic/lines-between-class-members': ['error', {
        enforce: [
          {
            blankLine: 'always',
            prev: '*',
            next: 'method',
          },
          {
            blankLine: 'always',
            prev: 'method',
            next: '*',
          },
        ],
      }],
      '@stylistic/member-delimiter-style': ['error', {
        'multiline': {
          'delimiter': 'comma',
          'requireLast': true,
        },
        'singleline': {
          'delimiter': 'comma',
          'requireLast': true,
        },
        'overrides': {
          'interface': {
            'multiline': {
              'delimiter': 'semi',
              'requireLast': true,
            },
          },
        },
      }],
      '@stylistic/multiline-comment-style': ['error', 'separate-lines', {
        'checkJSDoc': false,
      }],
      '@stylistic/new-parens': ['error', 'always'],
      '@stylistic/newline-per-chained-call': ['error', {
        'ignoreChainWithDepth': 2,
      }],
      '@stylistic/no-extra-semi': 'error',
      '@stylistic/no-floating-decimal': 'error',
      '@stylistic/no-multi-spaces': 'error',
      '@stylistic/no-multiple-empty-lines': ['error', {
        'max': 1,
        'maxEOF': 0,
      }],
      '@stylistic/no-trailing-spaces': ['error', {
        'ignoreComments': true,
      }],
      '@stylistic/no-whitespace-before-property': 'error',
      '@stylistic/nonblock-statement-body-position': 'error',
      '@stylistic/object-curly-newline': ['error', {
        'multiline': true,
        'consistent': true,
      }],
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/object-property-newline': ['error', {
        'allowAllPropertiesOnSameLine': false,
      }],
      '@stylistic/operator-linebreak': ['error', 'after', {
        'overrides': {
          '?': 'before',
          ':': 'before',
        },
      }],
      '@stylistic/padding-line-between-statements': ['error',
        {
          'blankLine': 'always',
          'prev': [
            'block-like',
            'multiline-block-like',
            'multiline-expression',
          ],
          'next': '*',
        },
        {
          'blankLine': 'always',
          'prev': '*',
          'next': [
            'block-like',
            'multiline-block-like',
            'return',
          ],
        },
        {
          'blankLine': 'any',
          'prev': 'case',
          'next': 'case',
        },
        {
          'blankLine': 'always',
          'prev': ['let', 'var', 'const'],
          'next': ['expression', 'multiline-expression'],
        },
        {
          'blankLine': 'always',
          'prev': ['expression', 'multiline-expression'],
          'next': ['let', 'var', 'const'],
        },
        {
          'blankLine': 'always',
          'prev': '*',
          'next': ['function', 'class'],
        }],
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/rest-spread-spacing': ['error', 'never'],
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/semi-spacing': ['error', {
        'before': false,
        'after': true,
      }],
      '@stylistic/space-before-blocks': 'error',
      '@stylistic/space-before-function-paren': ['error', 'never'],
      '@stylistic/space-infix-ops': 'error',
      '@stylistic/space-unary-ops': ['error', {
        'words': true,
        'nonwords': false,
      }],
      '@stylistic/spaced-comment': ['error', 'always', {
        'exceptions': ['*', '-', '+', '=', '!', '?'],
        'line': {
          'markers': ['/'],
        },
        'block': {
          'balanced': true,
        },
      }],
      '@stylistic/switch-colon-spacing': 'error',
      '@stylistic/type-annotation-spacing': 'error',
      '@stylistic/type-generic-spacing': 'error',
      '@stylistic/type-named-tuple-spacing': 'error',

      /* TypeScript */
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
);
