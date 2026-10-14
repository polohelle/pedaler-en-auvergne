// @ts-check
/** @type {import('lint-staged').Configuration} */
export default {
  '*.{js,ts,astro}': ['eslint --fix --max-warnings=0', 'prettier --write'],
  '*.{json,md,yaml,yml,css}': 'prettier --write',
};
