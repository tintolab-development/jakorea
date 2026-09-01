/** 사용자(작성) 모드 — 성명 미입력 시 확인·서명란 표시 */
export const AGREEMENT_USER_MODE_AUTHOR_PLACEHOLDER = '(작성자)'

/** 사용자 모드 표시명 — 비어 있으면 `(작성자)` */
export function resolveAgreementUserModeAuthorDisplayName(name: string | null | undefined): string {
  const trimmed = name?.trim() ?? ''
  return trimmed.length > 0 ? trimmed : AGREEMENT_USER_MODE_AUTHOR_PLACEHOLDER
}
