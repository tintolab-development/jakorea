export const APPLICATION_GIVE_UP_REASON_MIN_LENGTH = 2
export const APPLICATION_GIVE_UP_REASON_MAX_LENGTH = 500

/** 신청·참여 활동 포기 사유 검증. 통과 시 `null`, 실패 시 사용자 안내 문구. */
export function validateApplicationGiveUpReason(reason: string): string | null {
  const trimmed = reason.trim()
  if (trimmed.length < APPLICATION_GIVE_UP_REASON_MIN_LENGTH) {
    return `활동 포기 사유를 ${APPLICATION_GIVE_UP_REASON_MIN_LENGTH}자 이상 입력해 주세요.`
  }
  if (trimmed.length > APPLICATION_GIVE_UP_REASON_MAX_LENGTH) {
    return `활동 포기 사유는 ${APPLICATION_GIVE_UP_REASON_MAX_LENGTH}자 이내로 입력해 주세요.`
  }
  return null
}
