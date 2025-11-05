import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from 'eslint/use-at-your-own-risk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: false,
  allConfig: false
});

export default [
  {
    ignores: ['node_modules/**', 'dist/**']
  },
  ...compat.config({
    extends: ['standard'],
    env: {
      node: true,
      es2022: true
    },
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: 'script'
    },
    rules: {
      camelcase: 'off'
    }
  })
];
