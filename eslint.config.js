import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/.turbo/**', '**/node_modules/**']
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      prettier
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      },
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      'react-refresh/only-export-components': 'off',
      // React Hooks 규칙 완화
      'react-hooks/refs': 'warn', // ref 사용 관련 경고로 변경
      'react-hooks/preserve-manual-memoization': 'warn', // useMemo 의존성 경고로 변경
      'react-hooks/exhaustive-deps': 'warn', // useEffect 의존성 경고로 변경
      'react-hooks/incompatible-library': 'warn', // React Hook Form watch() 경고로 변경
      // TypeScript 규칙 완화
      '@typescript-eslint/no-explicit-any': 'warn', // any 타입 사용 경고로 변경
      // 일반 규칙 완화
      'no-case-declarations': 'warn' // case 블록 선언 경고로 변경
    }
  },
  {
    files: ['packages/**/*.{ts,tsx}'],
    linterOptions: {
      reportUnusedDisableDirectives: true
    },
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  }
)
