/**
 * 권한별 로그인 버튼 — CMS `dev-login-accounts.ts` 와 동일.
 * UI는 Vite 로컬 개발(`import.meta.env.DEV`)에서만 노출한다.
 *
 * - 모든 권한별 로그인 버튼의 공통 비밀번호: `admin1234!`
 * - 로컬 MFA 코드 `000000` 은 MFA 모달이 열릴 때 자동 입력된다(개발 모드 한정).
 */
export type DevLoginQaAccount = {
  key: 'master' | 'pm' | 'partner' | 'viewer'
  label: string
  email: string
  password: string
  apiReady?: boolean
}

/** 권한별 로그인 버튼이 공통으로 폼에 입력하는 QA 비밀번호 */
export const DEV_LOGIN_QA_PASSWORD = 'admin1234!'

/** 로컬 BE(`ja.local-demo.mfa-bypass-enabled`)가 받는 MFA 코드 — 개발 모드에서만 자동 입력 */
export const DEV_LOGIN_MFA_CODE = '000000'

export function canShowDevRoleLogin(): boolean {
  return import.meta.env.DEV === true
}

export const DEV_LOGIN_QA_ACCOUNTS: readonly DevLoginQaAccount[] = [
  {
    key: 'master',
    label: 'Master',
    email: 'admin1@jakorea.org',
    password: DEV_LOGIN_QA_PASSWORD,
    apiReady: true,
  },
  {
    key: 'pm',
    label: 'Accounting Manager',
    email: 'pm1@jakorea.org',
    password: DEV_LOGIN_QA_PASSWORD,
  },
  {
    key: 'partner',
    label: 'Program Manager',
    email: 'partner1@jakorea.org',
    password: DEV_LOGIN_QA_PASSWORD,
  },
  {
    key: 'viewer',
    label: 'Program Viewer',
    email: 'viewer1@jakorea.org',
    password: DEV_LOGIN_QA_PASSWORD,
  },
]
