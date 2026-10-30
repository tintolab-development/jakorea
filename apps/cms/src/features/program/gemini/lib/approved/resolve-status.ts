import dayjs, { type Dayjs } from 'dayjs'
import type {
  GeminiApprovedTrainingRow,
  GeminiApprovedTrainingStatus,
} from '../../model/approved/types'

export type ApprovedTrainingStatusRow = Pick<
  GeminiApprovedTrainingRow,
  'instructorAssigned' | 'lastPreferredDate' | 'trainingDate'
> & {
  trainingDateCandidates?: ReadonlyArray<{ trainingDate: string }>
}

function toDay(value: string | undefined): Dayjs | null {
  const raw = value?.trim()
  if (!raw) return null
  const day = dayjs(raw).startOf('day')
  return day.isValid() ? day : null
}

/** 미지정 시 희망 연수 일정(1~3지망) 중 가장 늦은 날. 없으면 lastPreferredDate. */
function latestUnmatchedScheduleDay(row: ApprovedTrainingStatusRow): Dayjs | null {
  let latest: Dayjs | null = null
  for (const candidate of row.trainingDateCandidates ?? []) {
    const day = toDay(candidate.trainingDate)
    if (day != null && (latest == null || day.isAfter(latest))) latest = day
  }
  const fallback = toDay(row.lastPreferredDate)
  if (fallback != null && (latest == null || fallback.isAfter(latest))) latest = fallback
  return latest
}

/** 연수일 필터·표시용 — 강사 지정 시 확정 연수일, 미지정 시 희망 연수 일정 마지막일 */
export function resolveApprovedTrainingFilterDate(
  row: ApprovedTrainingStatusRow
): string {
  if (row.instructorAssigned) return row.trainingDate
  return latestUnmatchedScheduleDay(row)?.format('YYYY-MM-DD') ?? row.lastPreferredDate
}

/**
 * 승인 연수 진행 현황 — 연수 일정 + 강사 지정/미지정만 본다.
 * 연수 요청 가능기간·모집기간은 쓰지 않는다.
 * 1. 미지정 + 희망 연수 일정 마지막일 경과 → 미진행
 * 2. 미지정 + 희망 연수 일정이 남음 → 예정
 * 3. 지정 + 확정 연수일 전 → 예정
 * 4. 지정 + 확정 연수일 당일 → 진행 중
 * 5. 지정 + 확정 연수일 경과 → 완료
 */
export function resolveApprovedTrainingStatus(
  row: ApprovedTrainingStatusRow,
  referenceDate: Dayjs | string = dayjs()
): GeminiApprovedTrainingStatus {
  const today = (typeof referenceDate === 'string' ? dayjs(referenceDate) : referenceDate).startOf(
    'day'
  )

  if (!row.instructorAssigned) {
    const lastSchedule = latestUnmatchedScheduleDay(row)
    if (lastSchedule != null && today.isAfter(lastSchedule)) {
      return 'NOT_CONDUCTED'
    }
    return 'SCHEDULED'
  }

  const trainingDay = toDay(row.trainingDate)
  if (trainingDay == null) {
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
