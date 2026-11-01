import { formatScheduleShortDateLabel } from './volunteer-assign-modal-data'

/** 배정 알림 미발송 — 사유/알림 필드 없음 */
export function buildAssignmentCancelPendingNotifyMessage(
  volunteerName: string,
  scheduleLabel: string
): string {
  const dateLabel = formatScheduleShortDateLabel(scheduleLabel)
  return `[**${volunteerName}**] 님의 **${dateLabel}** 교육 배정을 취소하시겠습니까?\n취소 시 발송 예정인 배정 알림이 있는 경우 자동으로 취소됩니다.`
}

/** 배정 알림 발송 후 — 취소 사유·알림 발송 필요 */
export function buildAssignmentCancelNotifiedMessage(
  volunteerName: string,
  scheduleLabel: string
): string {
  const dateLabel = formatScheduleShortDateLabel(scheduleLabel)
  return `[**${volunteerName}**] 님의 **${dateLabel}** 교육 배정을 취소하시겠습니까?\n취소 시 입력하신 사유가 회원에게 취소 사유로 안내되며, 알림이 발송됩니다.`
}

export const ASSIGNMENT_CANCEL_MODAL_TITLE = '교육 배정 취소 안내'

/** 미발송 취소 성공 — 취소 알림 발송 문구 금지 */
export const ASSIGNMENT_CANCEL_PENDING_SUCCESS_MESSAGE = '배정 취소가 완료되었습니다.'

export function buildAssignmentCancelNotifiedSuccessMessage(
  timing: 'IMMEDIATE' | 'SCHEDULED' | null | undefined
): string {
  if (timing === 'SCHEDULED') {
    return '배정 취소가 완료되었습니다. 취소 알림이 예약한 시간에 발송됩니다.'
  }
  return '배정 취소가 완료되었습니다. 취소 알림이 즉시 발송됩니다.'
}
