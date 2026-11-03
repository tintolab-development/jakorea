import type { ProgramAbsenceReasonItem } from '@/features/program/general/api/absence-reasons'

export const SUBMITTED_ABSENCE_REVIEW_STATUS = 'SUBMITTED'
export const REJECTED_ABSENCE_REVIEW_STATUS = 'REJECTED'

function sameId(left: string | number | null | undefined, right: string | number | null | undefined): boolean {
  if (left == null || right == null) return false
  const a = String(left).trim()
  const b = String(right).trim()
  return a.length > 0 && a === b
}

function reviewStatusOf(item: ProgramAbsenceReasonItem): string {
  return (item.reviewStatus ?? '').trim().toUpperCase()
}

function isLatestRevision(item: ProgramAbsenceReasonItem): boolean {
  return item.latestRevision === true
}

function isSubmittedLatest(item: ProgramAbsenceReasonItem): boolean {
  return isLatestRevision(item) && reviewStatusOf(item) === SUBMITTED_ABSENCE_REVIEW_STATUS
}

function matchesParticipantAndSchedule(
  item: ProgramAbsenceReasonItem,
  input: {
    programId: string | number | null | undefined
    participantId: string | number | null | undefined
    scheduleId: string | number | null | undefined
  }
): boolean {
  if (!sameId(item.scheduleId, input.scheduleId)) return false
  if (!sameId(item.participantId, input.participantId)) return false
  if (input.programId != null && item.programId != null && !sameId(item.programId, input.programId)) {
    return false
  }
  return true
}

function pickLatestSubmitted(
  items: readonly ProgramAbsenceReasonItem[]
): ProgramAbsenceReasonItem | null {
  if (items.length === 0) return null
  return items.reduce((latest, item) => {
    const latestRev = latest.revisionNo ?? 0
    const nextRev = item.revisionNo ?? 0
    return nextRev >= latestRev ? item : latest
  })
}

/**
 * 출결 정정 팝업 사유 시드.
 * 확정된 사유 불참(출석 기록 absenceReason)을 우선하고, 없으면 SUBMITTED 최신 신청 사유만 쓴다.
 * REJECTED·다른 일정·다른 참여자는 쓰지 않는다. 증빙 파일은 반환하지 않는다.
 */
export function resolveAttendanceCorrectionAutoReason(input: {
  items: readonly ProgramAbsenceReasonItem[] | null | undefined
  programId?: string | number | null
  participantId?: string | number | null
  scheduleId?: string | number | null
  confirmedExcusedAbsence: boolean
  confirmedReason?: string | null
}): string {
  const confirmed = input.confirmedReason?.trim() ?? ''
  if (input.confirmedExcusedAbsence && confirmed.length > 0) return confirmed

  const ids = {
    programId: input.programId,
    participantId: input.participantId,
    scheduleId: input.scheduleId,
  }
  if (ids.participantId == null || ids.scheduleId == null) return ''

  const matches = (input.items ?? []).filter(
    item => matchesParticipantAndSchedule(item, ids) && isSubmittedLatest(item)
  )
  const picked = pickLatestSubmitted(matches)
  return picked?.reason?.trim() ?? ''
}
