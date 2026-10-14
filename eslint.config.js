// @ts-check
import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import astro from 'eslint-plugin-astro';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/',
      '.astro/',
      'coverage/',
      'playwright-report/',
      'test-results/',
      '.lighthouseci/',
    ],
  },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.astro'],
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      // Seul src/services/ lit les collections : il applique les règles de publication.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'astro:content',
              importNames: ['getCollection', 'getEntry', 'getEntries'],
              message: 'Passer par src/services/contenus.ts, qui filtre les contenus non publiés.',
            },
          ],
        },
      ],
    },
  },
  astro.configs['flat/recommended'],
  astro.configs['flat/jsx-a11y-strict'],
  {
    files: ['**/*.astro'],
    languageOptions: {
      globals: { ...globals.browser },
      // astro-eslint-parser ne gère pas projectService : on lui donne le tsconfig explicitement.
      parserOptions: { projectService: false, project: true },
    },
  },
  {
    files: ['src/services/**', 'src/content.config.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  eslintConfigPrettier,
);
