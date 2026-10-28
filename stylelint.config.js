module.exports = {
  extends: ['stylelint-config-standard'],
  rules: {
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'tailwind',
          'apply',
          'variants',
          'responsive',
          'screen',
        ],
      },
    ],
    "selector-class-pattern": null,
    // "selector-class-pattern": "^([a-z][a-z0-9]*)((--?|__)?[a-z0-9]+)*$",
    'declaration-block-trailing-semicolon': null,
    'no-descending-specificity': null,
    'declaration-empty-line-before': null,
  },
}
