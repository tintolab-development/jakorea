/**
 * 최근 사용 비밀번호로 변경 시도 — 서버 `PASSWORD_RECENTLY_USED`(400).
 * 시안 「비밀번호 재사용 불가 안내」(QA 2026-11-14 비밀번호 변경 시: 안내 팝업 타이틀 문구 및 개행).
 * 서버 문구를 그대로 쓰지 않고 시안 문구로 안내한다.
 * 비밀번호 찾기 · 최초 로그인 비밀번호 변경 · 내 정보 비밀번호 변경 공통.
 */
export const PASSWORD_RECENTLY_USED_CODE = 'PASSWORD_RECENTLY_USED'

export const PASSWORD_RECENTLY_USED_ALERT = {
  title: '비밀번호 재사용 불가 안내',
  content: '최근에 사용한 비밀번호 5개는 다시 쓸 수 없습니다.\n다른 비밀번호를 입력해 주세요.',
} as const

export function isPasswordRecentlyUsedCode(code: string | null | undefined): boolean {
  return code?.trim().toUpperCase() === PASSWORD_RECENTLY_USED_CODE
}
