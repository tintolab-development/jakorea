/**
 * 권한별 로그인 버튼 — 이메일·비밀번호 자동 입력 (배포 빌드에도 노출).
 *
 * - **마스터**: `admin1@jakorea.org` — MFA `000000`
 * - **PM/Partner/Viewer**: `pm1` / `partner1` / `viewer1@jakorea.org`
 * - 모든 권한별 로그인 버튼의 공통 비밀번호: `admin1234!`
 */
export type DevLoginQaAccount = {
  key: 'master' | 'pm' | 'partner' | 'viewer'
  label: string
  email: string
  password: string
  /** ngrok·스테이징 실 API 로그인 검증됨 */
  apiReady?: boolean
}

/** 권한별 로그인 버튼이 공통으로 폼에 입력하는 QA 비밀번호 */
export const DEV_LOGIN_QA_PASSWORD = 'admin1234!'

export const DEV_LOGIN_QA_ACCOUNTS: readonly DevLoginQaAccount[] = [
  {
    key: 'master',
    label: '마스터',
    email: 'admin1@jakorea.org',
    password: DEV_LOGIN_QA_PASSWORD,
    apiReady: true,
  },
  {
    key: 'pm',
    label: 'PM',
    email: 'pm1@jakorea.org',
    password: DEV_LOGIN_QA_PASSWORD,
  },
  {
    key: 'partner',
    label: 'Partner',
    email: 'partner1@jakorea.org',
    password: DEV_LOGIN_QA_PASSWORD,
  },
  {
    key: 'viewer',
    label: 'Viewer',
    email: 'viewer1@jakorea.org',
    password: DEV_LOGIN_QA_PASSWORD,
  },
]
