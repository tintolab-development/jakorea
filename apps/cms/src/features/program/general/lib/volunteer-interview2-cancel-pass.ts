import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import {
  formatModalBoldPhrase,
  formatModalBracketedSubjectName,
} from '@/features/program/general/lib/modal-message-subject'
import type { GeneralSecondInterviewScreeningStatus } from '@/features/program/general/lib/volunteer-screening-constants'

export type VolunteerInterview2CancelPassNotifyVariant = 'alreadySent' | 'pendingNotification'

/** 합격·예비합격 1~4 — 합격 취소 대상 */
export function isGeneralVolunteerInterview2ResultPassed(
  status: GeneralSecondInterviewScreeningStatus | undefined
): boolean {
  if (!status) return false
  if (status === 'pass') return true
  return status.startsWith('reserve')
}

export function resolveVolunteerInterview2CancelPassNotifyVariant(
  row: GeneralVolunteerApplicantRow
): VolunteerInterview2CancelPassNotifyVariant {
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
 * 시안·Notion 공통 승인 취소 팝업 — 면접 합격 취소 카피
 * (`1차 서류 승인` → `면접 합격 처리`)
 */
export function buildVolunteerInterview2CancelPassMessage(
  volunteerName: string,
  variant: VolunteerInterview2CancelPassNotifyVariant
): string {
  const trimmedName = volunteerName.trim() || '봉사자'
  const intro = `${formatModalBracketedSubjectName(trimmedName)} 님의 면접 합격 처리를 취소하시겠습니까?`
  const rejectProcess = formatModalBoldPhrase('반려 처리')

  if (variant === 'alreadySent') {
    return `${intro}\n취소 시 입력하신 사유가 회원에게 취소 사유로 안내되며, 알림이 발송됩니다.\n또한, 해당 회원은 자동으로 ${rejectProcess}됩니다.`
  }

  return `${intro}\n취소 시 입력하신 사유가 회원에게 반려 사유로 안내되며, 알림이 발송됩니다.\n발송 예정인 승인 알림이 있는 경우, 자동으로 취소되며 해당 건만 발송됩니다.`
}

export function resolveVolunteerInterview2CancelPassReasonLabel(
  variant: VolunteerInterview2CancelPassNotifyVariant
): string {
  return variant === 'pendingNotification' ? '취소 사유(반려 사유)' : '취소 사유'
}

/** BE `finalResultStatus=RESERVE*` → `reserve1`…`reserve4` 매핑값 기준 헤더 버튼 라벨 */
export function resolveVolunteerInterview2CancelPassButtonLabel(
  secondInterviewScreeningStatus?: GeneralSecondInterviewScreeningStatus
): string {
  if (secondInterviewScreeningStatus?.startsWith('reserve')) {
    return '예비 합격 취소'
  }
  return '합격 취소'
}
