// @ts-check
/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  // Les corps des commits Dependabot (notes de version) dépassent la longueur de ligne.
  ignores: [(message) => message.includes('Signed-off-by: dependabot[bot]')],
  rules: {
    // Les contenus éditoriaux ont leur propre type, comme prévu au cahier des charges.
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore',
        'ci',
        'content',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test',
      ],
    ],
    // Messages en français : pas de contrainte de casse sur le sujet.
    'subject-case': [0],
  },
};
