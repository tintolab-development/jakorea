/** 교육받은 교사 기관 승인 API의 payload 규칙. */

export type TrainedTeacherApproveTiming = 'IMMEDIATE' | 'SCHEDULED' | 'ON_ANNOUNCEMENT'

export type TrainedTeacherApproveRequest = {
  timing?: TrainedTeacherApproveTiming
  scheduledAt?: string
  /** TRAINED_TEACHER + PERIOD에서 서버가 내려준 희망 순위. scheduleId가 아니다. */
  preferredScheduleRank?: number
  selectedScheduleId?: number
  slots?: Array<{ scheduleId: number }>
}

export type TrainedTeacherScheduleAssignmentStatus = 'ASSIGNED' | 'UNASSIGNED'

export type TrainedTeacherOrganizationDecisionResponse = {
  applicationId?: number
  fromStatus?: string
  toStatus?: string
  scheduleAssignmentStatus?: TrainedTeacherScheduleAssignmentStatus | null
}

function normalizePreferredScheduleRank(value: number | null | undefined): number | null {
  if (!Number.isInteger(value) || value == null || value <= 0) return null
  return Math.trunc(value)
}

/** 프로그램 공통정보 기준. PERIOD만 기간형. FIXED_DATE·DATE·date는 날짜형. */
export function isTrainedTeacherPeriodApproveMode(educationScheduleMode?: string | null): boolean {
  return educationScheduleMode?.trim().toUpperCase() === 'PERIOD'
}

function uniquePositiveScheduleIds(ids: readonly (number | null | undefined)[]): number[] {
  const unique: number[] = []
  const seen = new Set<number>()

  for (const value of ids) {
    if (!Number.isInteger(value) || value == null || value <= 0) continue
    const id = Math.trunc(value)
    if (seen.has(id)) continue
    seen.add(id)
    unique.push(id)
  }

  return unique
}

/**
 * TT 승인 payload를 만든다.
 *
 * - 일정이 없고 IMMEDIATE면 undefined를 반환해 기존 무본문 승인을 유지한다.
 * - PERIOD만 서버가 내려준 preferenceRank를 preferredScheduleRank로 보낸다.
 * - DATE(FIXED_DATE 포함)는 preferredScheduleRank를 넣지 않고 선택한 scheduleId만 보낸다.
 * - preferredScheduleRank와 selectedScheduleId·slots를 함께 만들지 않는다.
 * - 단일 일정은 selectedScheduleId만, 복수 일정은 slots만 만든다.
 * - requestedScheduleId는 이 함수의 입력·출력에 포함하지 않는다.
 * - scheduledAt은 SCHEDULED일 때만 포함한다.
 */
export function buildTrainedTeacherApproveRequest(input: {
  timing?: TrainedTeacherApproveTiming | null
  scheduledAt?: string | null
  /** 프로그램 공통정보 educationScheduleMode. PERIOD만 rank, 그 외(DATE·FIXED_DATE)는 scheduleId. */
  educationScheduleMode?: string | null
  preferredScheduleRank?: number | null
  selectedScheduleId?: number | null
  selectedScheduleIds?: readonly (number | null | undefined)[] | null
}): TrainedTeacherApproveRequest | undefined {
  const periodMode = isTrainedTeacherPeriodApproveMode(input.educationScheduleMode)
  const dateMode =
    input.educationScheduleMode != null &&
    input.educationScheduleMode.trim() !== '' &&
    !periodMode
  const preferredScheduleRank = dateMode
    ? null
    : normalizePreferredScheduleRank(input.preferredScheduleRank)
  const ids = periodMode
    ? []
    : uniquePositiveScheduleIds(
        input.selectedScheduleIds != null ? input.selectedScheduleIds : [input.selectedScheduleId]
      )
  const timing = input.timing ?? undefined
  const scheduledAt = input.scheduledAt?.trim()
  const request: TrainedTeacherApproveRequest = {
    ...(timing &&
    !(timing === 'IMMEDIATE' && ids.length === 0 && preferredScheduleRank == null)
      ? { timing }
      : {}),
    ...(timing === 'SCHEDULED' && scheduledAt ? { scheduledAt } : {}),
    ...(preferredScheduleRank != null ? { preferredScheduleRank } : {}),
  }

  if (preferredScheduleRank != null) {
    return Object.keys(request).length > 0 ? request : undefined
  }

  if (ids.length > 1) {
    request.slots = ids.map(scheduleId => ({ scheduleId }))
  } else if (ids.length === 1) {
    request.selectedScheduleId = ids[0]
  }

  return Object.keys(request).length > 0 ? request : undefined
}
