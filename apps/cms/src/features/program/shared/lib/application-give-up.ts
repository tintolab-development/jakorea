export const APPLICATION_GIVE_UP_REASON_MIN_LENGTH = 2
export const APPLICATION_GIVE_UP_REASON_MAX_LENGTH = 500

export type ApplicationGiveUpReasonValidationOptions = {
  minLength?: number
  maxLength?: number
}

/** 신청·참여 활동 포기 사유 검증. 통과 시 `null`, 실패 시 사용자 안내 문구. */
export function validateApplicationGiveUpReason(
  reason: string,
  options: ApplicationGiveUpReasonValidationOptions = {}
): string | null {
  const minLength = options.minLength ?? APPLICATION_GIVE_UP_REASON_MIN_LENGTH
  const maxLength = options.maxLength ?? APPLICATION_GIVE_UP_REASON_MAX_LENGTH
  const trimmed = reason.trim()
  if (trimmed.length < minLength) {
    return `활동 포기 사유를 ${minLength}자 이상 입력해 주세요.`
  }
  if (trimmed.length > maxLength) {
    return `활동 포기 사유는 ${maxLength}자 이내로 입력해 주세요.`
  }
  return null
}
