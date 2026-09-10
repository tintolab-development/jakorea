/**
 * DeleteGuideModal — 입력란으로 최종 확인을 받을 때 사용하는 고정 문구
 */

/** `requiredConfirmInput`에 전달하는 값(사용자가 입력해야 하는 문자열) */
export const DELETE_GUIDE_TYPED_CONFIRM_VALUE = '삭제'

/**
 * `confirmInputPlaceholder` 기본 문구
 * `[삭제]`는 강조 표기. 실제 입력값은 `DELETE_GUIDE_TYPED_CONFIRM_VALUE`(`삭제`).
 */
export const DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER =
  '삭제하시려면 해당란에 [삭제]를 입력해 주세요.'

/** 회원 탈퇴 안내 모달 — `requiredConfirmInput` 값 */
export const WITHDRAW_GUIDE_TYPED_CONFIRM_VALUE = '탈퇴'

/** 회원 탈퇴 안내 모달 — `confirmInputPlaceholder` 기본 문구 */
export const WITHDRAW_GUIDE_TYPED_CONFIRM_PLACEHOLDER =
  '탈퇴하시려면 해당란에 [탈퇴]를 입력해 주세요.'

/**
 * 확인 입력 정규화 — trim + 전체가 `[값]` 형태면 대괄호 제거.
 * placeholder 강조(`[삭제]`)를 문자 그대로 입력한 경우도 통과시킨다.
 */
export function normalizeDeleteGuideTypedConfirmInput(value: string): string {
  const trimmed = value.trim()
  const bracketed = /^\[([^\]]+)\]$/.exec(trimmed)
  return (bracketed?.[1] ?? trimmed).trim()
}

/** `requiredConfirmInput`과 사용자 입력이 일치하는지 (대괄호·공백 허용) */
export function matchesDeleteGuideTypedConfirm(
  input: string,
  requiredConfirmInput: string
): boolean {
  return (
    normalizeDeleteGuideTypedConfirmInput(input) ===
    normalizeDeleteGuideTypedConfirmInput(requiredConfirmInput)
  )
}
