import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import unusedImports from 'eslint-plugin-unused-imports'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import jakoreaOverlay from './tools/eslint/no-overlay-sync-import.js'

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/dist-preview/**',
      '**/.turbo/**',
      '**/node_modules/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/blob-report/**',
      '**/.playwright-mcp/**',
      '**/playwright/.auth/**',
      '**/tests/e2e/.auth/**',
      'apps/cms/playwright.tt-registration-isolated.config.ts',
      'apps/cms/playwright.company-school-isolated.config.ts',
      'apps/cms/tests/e2e-tt-isolated/**',
      'apps/cms/tests/e2e-company-school-isolated/**',
      'apps/platform/tests/**',
      '**/src/shared/api/generated/**',
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
    ignores: [
      'apps/cms/src/**/*.test.ts',
      'apps/cms/src/**/*.test.tsx',
      'apps/cms/src/pages/design-system/**',
    ],
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
            {
              name: '@/data/mock',
              message:
                'CMS runtime must not import @/data/mock. Use remote API clients and feature model types.',
            },
            {
              name: '@/data/mock/users',
              message:
                'CMS runtime must not import mock users. Use members API.',
            },
          ],
          patterns: [
            {
              group: ['**/temp-mock-*', '**/*-mock-store*'],
              message: 'CMS runtime mock modules are removed. Use remote API only.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'apps/cms/src/features/program/**/hooks/use-*save*.ts',
      'apps/cms/src/features/program/**/hooks/use-program-detail-info-save.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync',
              importNames: ['getGeneralRecruitOverlayRecord'],
              message:
                'Do not use active-scope getGeneralRecruitOverlayRecord() in program detail save hooks. Use peekGeneralRecruitOverlayRecord / buildMergedRegistrationOverlayForRecruitSave (apps/cms/.cursor/rules/process/program-detail-overlay-save-ssot.mdc).',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='getGeneralRecruitOverlayRecord']",
          message:
            'getGeneralRecruitOverlayRecord() is UI/active-scope only; not for persist in save hooks. See program-detail-overlay-save-ssot.mdc.',
        },
      ],
    },
  },
  {
    files: [
      'apps/cms/src/features/template/hooks/use-program-participant-application-editor.ts',
      'apps/cms/src/features/template/hooks/use-program-registration-editor.ts',
      'apps/cms/src/features/program/general/lib/registration-local-save.ts',
      'apps/cms/src/features/program/general/lib/general-recruit-overlay-to-program.ts',
      'apps/cms/src/features/program/trained-teachers/lib/recruit-form-state.ts',
      'apps/cms/src/features/program/gemini/lib/recruitment/snapshot-from-overlay.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          paths: [
            {
              name: '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync',
              importNames: ['getGeneralRecruitOverlayRecord'],
              message:
                'Do not use active-scope getGeneralRecruitOverlayRecord() in program persist paths. Use peekGeneralRecruitOverlayRecord / buildMergedRegistrationOverlayForRecruitSave (program-detail-overlay-save-ssot.mdc).',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'warn',
        {
          selector: "CallExpression[callee.name='getGeneralRecruitOverlayRecord']",
          message:
            'getGeneralRecruitOverlayRecord() is UI/active-scope only; not for persist. See program-detail-overlay-save-ssot.mdc.',
        },
      ],
    },
  },
  // 공용 양식 버전 제자리 쓰기(PUT/publish) 차단 — 2026-10-25 공용 카탈로그 덮어쓰기 사고 후속.
  // 프로그램 흐름은 COPY(ownerProgramId) 후 쓰기만 허용한다(program-form-version-write-guard.ts).
  // 별도 규칙명(@typescript-eslint/no-restricted-imports)이라 위 no-restricted-imports 블록과 겹치지 않는다.
  {
    files: ['apps/cms/src/**/*.{ts,tsx}'],
    ignores: [
      'apps/cms/src/**/*.test.ts',
      'apps/cms/src/**/*.test.tsx',
      'apps/cms/src/features/template/api/**',
      // allowlist: 쓰기 전에 COPY 또는 canWriteProgramFormVersionInPlace 가드를 거치는 모듈
      'apps/cms/src/features/program/general/lib/sync-registration-form-bindings.ts',
      'apps/cms/src/features/program/shared/lib/survey-management/save-program-survey-form-edit.ts',
      'apps/cms/src/features/program/shared/lib/survey-management/resolve-published-survey-binding.ts',
      'apps/cms/src/features/template/lib/writing-form-template-local-save.ts',
    ],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/features/template/api/form-templates-api-client',
              importNames: ['updateFormTemplateVersionRemote', 'publishFormTemplateVersionRemote'],
              message:
                'Form version in-place PUT/publish is restricted. COPY with ownerProgramId first and use canWriteProgramFormVersionInPlace (features/template/lib/program-form-version-write-guard.ts).',
            },
            {
              name: '@/features/template/api/admin-form-templates-service',
              importNames: [
                'publishFormTemplateVersion',
                'publishFormTemplateVersionById',
                'saveFormTemplateVersionDraft',
                'saveFormTemplateVersionDraftByVersionId',
              ],
              message:
                'Form version in-place PUT/publish is restricted. COPY with ownerProgramId first and use canWriteProgramFormVersionInPlace (features/template/lib/program-form-version-write-guard.ts).',
            },
          ],
        },
      ],
    },
  },
  // P8: overlay 동기화 모듈·scoped-overlay-store 신규 import 금지(ratchet). 기존 사용처는 allowlist 고정.
  {
    files: ['apps/cms/src/**/*.{ts,tsx}'],
    ignores: ['apps/cms/src/**/*.test.ts', 'apps/cms/src/**/*.test.tsx'],
    plugins: { 'jakorea-overlay': jakoreaOverlay },
    rules: {
      'jakorea-overlay/no-overlay-sync-import': 'error',
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
