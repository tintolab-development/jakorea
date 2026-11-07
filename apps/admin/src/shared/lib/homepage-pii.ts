/** Homepage Admin BE permission for unmasked PII on detail GET (`revealPii=true`). */
export const HOMEPAGE_PII_VIEW_PERMISSION = 'HOMEPAGE_PII_VIEW'

export const HOMEPAGE_PII_REVEAL_COPY = {
  button: '개인정보 원문 보기',
  revealed: '원문 표시 중',
  confirmTitle: '개인정보 원문 보기',
  confirmContent:
    '연락처·이메일·주소·학력·경력·첨부 등 개인정보 원문을 조회합니다. 조회 기록은 감사 로그에 남습니다.',
  confirmText: '조회',
  cancelText: '취소',
  forbiddenTitle: '권한 없음',
  forbiddenContent: '개인정보 원문을 조회할 권한이 없습니다.',
} as const

export function hasHomepagePiiView(permissions: readonly string[] | undefined): boolean {
  return (permissions ?? []).includes(HOMEPAGE_PII_VIEW_PERMISSION)
}

export function toRevealPiiQueryParam(revealPii: boolean | undefined): boolean {
  return revealPii === true
}
