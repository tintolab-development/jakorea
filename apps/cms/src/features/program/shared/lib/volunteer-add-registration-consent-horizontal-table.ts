/**
 * 봉사자 추가 등록 — 개인정보·제3자 가로표 (Figma Popup / 추가 등록)
 * th(열 제목)는 고정 텍스트, 제3자 표는 「제공받는 곳」(0열)만 입력.
 */

/** Figma — 제3자 본문 1·2·3열 고정 */
export const VOLUNTEER_CONSENT_THIRD_PARTY_LOCKED_BODY_COLUMN_INDEXES: ReadonlySet<number> =
  new Set([1, 2, 3])

export type VolunteerConsentHorizontalTableInteractionProps = {
  isEditMode: boolean
  lockedBodyColumnIndexes: ReadonlySet<number> | undefined
  /**
   * 제3자 「제공받는 곳」 — 공통 가로표 field처럼 셀 안 보더 없이 바로 입력
   * (`TextCellInput` 파란/회색 박스 인풋 금지)
   */
  unboxedEditableBodyCell: boolean
  lockColumnHeaders: true
  tableCanvasInteractive: false
  bottomConsentPreviewInAuthoring: true
  paragraphInteractionMode: 'user'
}

export function resolveVolunteerConsentHorizontalTableInteractionProps(
  paragraphId: string,
  thirdPartyParagraphId: string
): VolunteerConsentHorizontalTableInteractionProps {
  const isThirdParty = paragraphId === thirdPartyParagraphId
  return {
    isEditMode: isThirdParty,
    lockedBodyColumnIndexes: isThirdParty
      ? VOLUNTEER_CONSENT_THIRD_PARTY_LOCKED_BODY_COLUMN_INDEXES
      : undefined,
    unboxedEditableBodyCell: isThirdParty,
    lockColumnHeaders: true,
    tableCanvasInteractive: false,
    bottomConsentPreviewInAuthoring: true,
    paragraphInteractionMode: 'user',
  }
}
