import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import {
  formatModalBoldPhrase,
  formatModalBracketedSubjectName,
} from '@/features/program/general/lib/modal-message-subject'
import type { PermissionModalNotifyTiming } from '@/shared/components/permission-modal'
import type { GeneralSecondInterviewScreeningStatus } from '@/features/program/general/lib/volunteer-screening-constants'

export type VolunteerInterview2CancelFailNotifyVariant = 'alreadySent' | 'pendingNotification'

export type VolunteerInterview2CancelFailConfirmPayload =
  | {
      variant: 'alreadySent'
      reason: string
      notifyTiming: PermissionModalNotifyTiming
      manualNotifyAt?: import('dayjs').Dayjs | null
    }
  | { variant: 'pendingNotification'; reason: string }

export function isGeneralVolunteerInterview2ResultFailed(
  status: GeneralSecondInterviewScreeningStatus | undefined
): boolean {
  return status === 'fail'
}

export function resolveVolunteerInterview2CancelFailNotifyVariant(
  row: GeneralVolunteerApplicantRow
): VolunteerInterview2CancelFailNotifyVariant {
  if (row.finalResultNotifyTiming === 'immediate') {
    return 'alreadySent'
  }
  if (
    row.finalResultNotifyTiming === 'on_announcement' ||
    row.finalResultNotifyTiming === 'manual'
  ) {
    return 'pendingNotification'
  }
  return 'pendingNotification'
}

/**
 * 시안·Notion 공통 반려 취소 팝업 — 면접 불합격 취소 카피
 * (`1차 서류 반려` → `면접 불합격 처리`)
 */
export function buildVolunteerInterview2CancelFailMessage(
  volunteerName: string,
  variant: VolunteerInterview2CancelFailNotifyVariant
): string {
  const trimmedName = volunteerName.trim() || '봉사자'
  const subject = formatModalBracketedSubjectName(trimmedName)
  const waitingProcess = formatModalBoldPhrase('심사 대기 처리')

  if (variant === 'alreadySent') {
    return `${subject} 님의 면접 불합격 처리를 취소하시겠습니까?\n취소 시 입력하신 사유가 회원에게 취소 사유로 안내되며, 알림이 발송됩니다.\n또한, 해당 회원은 자동으로 ${waitingProcess}됩니다.`
  }

  return `${subject} 님의 면접 불합격 처리를 취소하시겠습니까?\n취소 시 발송 예정인 불합격 알림은 자동으로 취소되며, ${waitingProcess}됩니다.`
}
