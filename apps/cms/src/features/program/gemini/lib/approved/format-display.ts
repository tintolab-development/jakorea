import dayjs from 'dayjs'
import type {
  GeminiApprovedTrainingDateCandidate,
  GeminiApprovedTrainingRow,
  GeminiApprovedTrainingStatus,
} from '../../model/approved/types'
import { formatTrainingDateCandidatesDisplay } from './training-date-candidates'

export const APPROVED_TRAINING_STATUS_LABEL: Record<GeminiApprovedTrainingStatus, string> = {
  SCHEDULED: '프로그램 진행 예정',
  IN_PROGRESS: '프로그램 진행 중',
  COMPLETED: '프로그램 진행 완료',
  NOT_CONDUCTED: '프로그램 미진행',
}

const KOREAN_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

/** 승인 연수 삭제 안내에 표시할 식별자. 확정 연수일이 없으면 기관명만 반환한다. */
export function formatApprovedTrainingDeleteDisplayName(
  row: Pick<GeminiApprovedTrainingRow, 'institutionName' | 'trainingDate'>
): string {
  const institutionName = row.institutionName.trim() || '기관명 없음'
  const trainingDate = row.trainingDate.trim()
  const parsed = dayjs(trainingDate)
  if (!trainingDate || !parsed.isValid()) return institutionName

  return `${institutionName} · ${parsed.format('YYYY.MM.DD')}(${KOREAN_WEEKDAYS[parsed.day()]})`
}

export function formatStatusLabel(status: GeminiApprovedTrainingStatus): string {
  return APPROVED_TRAINING_STATUS_LABEL[status]
}

export function formatRegionDisplay(
  row: Pick<GeminiApprovedTrainingRow, 'institutionSido' | 'institutionSigungu'>
): string {
  return `${row.institutionSido} ${row.institutionSigungu}`.trim()
}

function formatDateTimeLabel(date: string | undefined, timeText: string | undefined): string {
  const x = dayjs(date)
  if (!x.isValid()) return '-'
  const dateLabel = x.format('YYYY.MM.DD')
  const time = timeText?.trim() ?? ''
  if (!time || time === '-') return dateLabel
  return `${dateLabel} | ${time}`
}

function firstPreferredCandidate(
  candidates: readonly GeminiApprovedTrainingDateCandidate[] | undefined
): GeminiApprovedTrainingDateCandidate | undefined {
  if (!candidates?.length) return undefined
  return [...candidates].sort((a, b) => a.preferenceRank - b.preferenceRank)[0]
}

/** 승인된 연수일시 한 줄. 강사 미지정이어도 확정일 또는 1지망을 보여 준다. */
export function formatConfirmedTrainingDatetimeDisplay(
  row: Pick<
    GeminiApprovedTrainingRow,
    'trainingDate' | 'trainingTimeText' | 'trainingDateCandidates'
  > & {
    instructorAssigned?: boolean
  }
): string {
  const confirmed = formatDateTimeLabel(row.trainingDate, row.trainingTimeText)
  if (confirmed !== '-') return confirmed
  const first = firstPreferredCandidate(row.trainingDateCandidates)
  if (!first) return '-'
  return formatDateTimeLabel(first.trainingDate, first.trainingTimeText)
}

function formatLastPreferredDateDisplay(lastPreferredDate: string | undefined): string {
  const x = dayjs(lastPreferredDate)
  return x.isValid() ? x.format('YYYY.MM.DD') : '-'
}

/** 확정 연수일시. 미확정이면 기관 신청 희망 일정(1~3지망), 없으면 lastPreferredDate */
export function formatTrainingDatetimeDisplay(
  row: Pick<
    GeminiApprovedTrainingRow,
    | 'instructorAssigned'
    | 'trainingDate'
    | 'trainingTimeText'
    | 'trainingDateCandidates'
    | 'lastPreferredDate'
  >
): string {
  const confirmed = formatDateTimeLabel(row.trainingDate, row.trainingTimeText)
  if (confirmed !== '-') return confirmed
  const candidates = formatTrainingDateCandidatesDisplay(row.trainingDateCandidates)
  if (candidates !== '-') return candidates
  return formatLastPreferredDateDisplay(row.lastPreferredDate)
}

export function formatInstructorDisplay(row: GeminiApprovedTrainingRow): string {
  return row.instructorAssigned ? row.instructorName : '미지정'
}

export function approvedTrainingStatusModifier(status: GeminiApprovedTrainingStatus): string {
  switch (status) {
    case 'SCHEDULED':
      return 'scheduled'
    case 'IN_PROGRESS':
      return 'in-progress'
    case 'COMPLETED':
      return 'completed'
    case 'NOT_CONDUCTED':
      return 'not-conducted'
  }
}
