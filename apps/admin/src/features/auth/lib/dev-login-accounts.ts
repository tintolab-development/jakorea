/**
 * 권한별 로그인 버튼 — CMS `dev-login-accounts.ts` 와 동일.
 * UI는 Vite 로컬 개발(`import.meta.env.DEV`)에서만 노출한다.
 */
export type DevLoginQaAccount = {
  key: 'master' | 'pm' | 'partner' | 'viewer'
  label: string
  email: string
  password: string
  apiReady?: boolean
}

/** @deprecated 계정별 `password` 사용 — 하위 호환용 */
export const DEV_LOGIN_QA_PASSWORD = 'test1234!'

export function canShowDevRoleLogin(): boolean {
  return import.meta.env.DEV === true
}

export const DEV_LOGIN_QA_ACCOUNTS: readonly DevLoginQaAccount[] = [
  {
    key: 'master',
    label: 'Master',
    email: 'admin1@jakorea.org',
    password: 'admin1234!',
    apiReady: true,
  },
  {
    key: 'pm',
    label: 'Accounting Manager',
    email: 'pm1@jakorea.org',
    password: 'test1234!',
  },
  {
    key: 'partner',
    label: 'Program Manager',
    email: 'partner1@jakorea.org',
    password: 'test1234!',
  },
  {
    key: 'viewer',
    label: 'Program Viewer',
    email: 'viewer1@jakorea.org',
    password: 'test1234!',
  },
]
