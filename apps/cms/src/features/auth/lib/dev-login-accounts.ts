/**
 * 권한별 로그인 버튼 — 이메일·비밀번호 자동 입력 (배포 빌드에도 노출).
 *
 * - **마스터**: `admin1@jakorea.org` — MFA `000000`
 * - **PM/Partner/Viewer**: `pm1` / `partner1` / `viewer1@jakorea.org`
 * - 공통 비밀번호: `test1234!`
 */
export type DevLoginQaAccount = {
  key: 'master' | 'pm' | 'partner' | 'viewer'
  label: string
  email: string
  password: string
  /** ngrok·스테이징 실 API 로그인 검증됨 */
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
