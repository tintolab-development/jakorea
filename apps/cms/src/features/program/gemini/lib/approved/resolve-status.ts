import dayjs, { type Dayjs } from 'dayjs'
import type {
  GeminiApprovedTrainingRow,
  GeminiApprovedTrainingStatus,
} from '../../model/approved/types'

export type ApprovedTrainingStatusRow = Pick<
  GeminiApprovedTrainingRow,
  'instructorAssigned' | 'lastPreferredDate' | 'trainingDate'
>

/** 연수일 필터·표시용 — 강사 매칭 시 trainingDate, 미매칭 시 lastPreferredDate */
export function resolveApprovedTrainingFilterDate(
  row: Pick<GeminiApprovedTrainingRow, 'instructorAssigned' | 'lastPreferredDate' | 'trainingDate'>
): string {
  return row.instructorAssigned ? row.trainingDate : row.lastPreferredDate
}

/**
 * 승인 연수 진행 현황 파생
 * 1. 미매칭 + 3지망 마지막 날짜 경과 → 미진행
 * 2. 미매칭 + 3지망 남음 → 예정
 * 3. 매칭 + 연수일 전 → 예정
 * 4. 매칭 + 연수일 당일 → 진행 중
 * 5. 매칭 + 연수일 경과 → 완료
 */
export function resolveApprovedTrainingStatus(
  row: ApprovedTrainingStatusRow,
  referenceDate: Dayjs | string = dayjs()
): GeminiApprovedTrainingStatus {
  const today = (typeof referenceDate === 'string' ? dayjs(referenceDate) : referenceDate).startOf(
    'day'
  )
  const lastPreferred = dayjs(row.lastPreferredDate).startOf('day')

  if (!row.instructorAssigned) {
    if (lastPreferred.isValid() && today.isAfter(lastPreferred)) {
      return 'NOT_CONDUCTED'
    }
    return 'SCHEDULED'
  }

  const trainingDay = dayjs(row.trainingDate).startOf('day')
  if (!trainingDay.isValid()) {
    return 'SCHEDULED'
  }
  if (today.isBefore(trainingDay)) {
    return 'SCHEDULED'
  }
  if (today.isSame(trainingDay, 'day')) {
    return 'IN_PROGRESS'
  }
  return 'COMPLETED'
}
