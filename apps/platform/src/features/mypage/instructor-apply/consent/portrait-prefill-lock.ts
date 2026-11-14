/**
 * 초상권 1번 표 — 회원정보에서 미리 채운 항목 잠금.
 * - `name`: 성명을 회원정보로 채웠으면 비활성
 * - `affiliation`: 소속을 회원정보로 채웠으면 비활성 + 「소속 없음」 숨김 (값이 비어 있으면 기존 동작)
 */
export type PortraitPersonalConsentPrefillLock = {
  name?: boolean
  affiliation?: boolean
}

/** 회원정보로 채운 소속(값 있음)일 때만 잠금 — 비어 있거나 소속 없음이면 기존 입력·체크박스 유지 */
export function isPortraitAffiliationPrefillLocked(
  lock: PortraitPersonalConsentPrefillLock | undefined,
  state: { noAffiliation: boolean; affiliation: string },
): boolean {
  return lock?.affiliation === true && !state.noAffiliation && state.affiliation.trim() !== ''
}
