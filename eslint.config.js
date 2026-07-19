import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import unusedImports from 'eslint-plugin-unused-imports'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.turbo/**',
      '**/node_modules/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/blob-report/**',
      '**/.playwright-mcp/**',
      '**/playwright/.auth/**',
      '**/tests/e2e/.auth/**',
    ],
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
    plugins: {
      'unused-imports': unusedImports,
    },
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
      'react-hooks/rules-of-hooks': 'warn', // 렌더링 중 불순 함수 호출 경고로 변경
      'react-hooks/set-state-in-effect': 'warn', // Effect 내 setState 호출 경고로 변경
      'react-hooks/purity': 'warn', // 렌더링 중 불순 함수 호출 경고로 변경
      // TypeScript 규칙 완화
      '@typescript-eslint/no-explicit-any': 'warn', // any 타입 사용 경고로 변경
      '@typescript-eslint/no-unused-vars': 'off', // unused-imports/no-unused-vars로 대체 (_접두사 무시 포함)
      // unused-imports: 사용되지 않은 import/변수 자동 제거
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      // 일반 규칙 완화
      'no-case-declarations': 'warn' // case 블록 선언 경고로 변경
    }
  },
  {
    files: ['apps/cms/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'antd',
              importNames: ['message'],
              message:
                'antd `message` is not allowed in CMS. Do not use toasts; use modals/inline UI or @/shared/utils/error-handler (logging only). See apps/cms/.cursor/rules/libraries/no-antd-message.mdc',
            },
            {
              name: '@/shared/ui/cms-message',
              message:
                'cms-message was removed. Do not show toast messages in CMS.',
            },
          ],
        },
      ],
    },
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
