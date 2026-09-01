/**
 * 임시 로그인(DEV) 버튼 — 이메일·비밀번호 자동 입력.
 *
 * - **마스터**: ngrok/스테이징 실 API seed (`admin1@jakorea.org`) — MFA `000000`
 * - **PM/Partner/Viewer**: `qa.*@example.test` 는 FE mock 전용. 실 API에서는 BE에 동일 계정 seed 전까지 401.
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
    password: 'admin1234!',
    apiReady: true,
  },
  {
    key: 'pm',
    label: 'PM',
    email: 'qa.pm01@example.test',
    password: 'test1234!',
  },
  {
    key: 'partner',
    label: 'Partner',
    email: 'qa.partner01@example.test',
    password: 'test1234!',
  },
  {
    key: 'viewer',
    label: 'Viewer',
    email: 'qa.viewer01@example.test',
    password: 'test1234!',
  },
]
