/** 로컬 DEV — 스테이징 QA 관리자 계정 (임시 로그인 버튼) */
export const DEV_LOGIN_QA_PASSWORD = 'test1234!'

export const DEV_LOGIN_QA_ACCOUNTS = [
  { key: 'master', label: '마스터', email: 'qa.master01@example.test' },
  { key: 'pm', label: 'PM', email: 'qa.pm01@example.test' },
  { key: 'partner', label: 'Partner', email: 'qa.partner01@example.test' },
  { key: 'viewer', label: 'Viewer', email: 'qa.viewer01@example.test' },
] as const
