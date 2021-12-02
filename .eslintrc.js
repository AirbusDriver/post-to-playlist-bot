// eslint-disable-next-line no-undef
module.exports = {
    'env': {
        'browser': true,
        'es2021': true
    },
    ignorePatterns: [
        'Scratches/', 'node_modules/'
    ],
    'extends': [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended'
    ],
    'parser': '@typescript-eslint/parser',
    'parserOptions': {
        'ecmaVersion': 13,
        'sourceType': 'module'
    },
    'plugins': [
        '@typescript-eslint'
    ],
    'rules': {
        'indent': [
            'warn',
            4
        ],
        'linebreak-style': [
            'warn',
            'unix'
        ],
        'quotes': [
            'warn',
            'single'
        ],
        'semi': [
            'warn',
            'always'
        ],
        '@typescript-eslint/no-unused-vars': [
            'off'
        ],
        '@typescript-eslint/no-explicit-any': [
            'off'
        ],
        '@typescript-eslint/no-namespace': [
            'warn'
        ],

    }
};
