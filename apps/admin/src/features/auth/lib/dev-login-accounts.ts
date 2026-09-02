/**
 * 임시 로그인(DEV) 버튼 — CMS `dev-login-accounts.ts` 와 동일.
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

export const DEV_LOGIN_QA_ACCOUNTS: readonly DevLoginQaAccount[] = [
  {
    key: 'master',
    label: '마스터',
    email: 'admin1@jakorea.org',
    password: 'test1234!',
    apiReady: true,
  },
  {
    key: 'pm',
    label: 'PM',
    email: 'pm1@jakorea.org',
    password: 'test1234!',
  },
  {
    key: 'partner',
    label: 'Partner',
    email: 'partner1@jakorea.org',
    password: 'test1234!',
  },
  {
    key: 'viewer',
    label: 'Viewer',
    email: 'viewer1@jakorea.org',
    password: 'test1234!',
  },
]
