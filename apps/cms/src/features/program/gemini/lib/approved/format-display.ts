import dayjs from 'dayjs'
import { formatDateDotWithWeekday } from '@/shared/utils/date'
import type { GeminiApprovedTrainingDetail } from '../../model/approved/detail-types'
import type {
  GeminiApprovedTrainingRow,
  GeminiApprovedTrainingStatus,
} from '../../model/approved/types'

export const APPROVED_TRAINING_STATUS_LABEL: Record<GeminiApprovedTrainingStatus, string> = {
  SCHEDULED: '프로그램 진행 예정',
  IN_PROGRESS: '프로그램 진행 중',
  COMPLETED: '프로그램 진행 완료',
  NOT_CONDUCTED: '프로그램 미진행',
}

/** 승인 연수 Text 표현 — 목록·상세·엑셀은 같은 label registry를 사용한다. */
const APPROVED_TRAINING_STATUS_ACCENT: Record<GeminiApprovedTrainingStatus, string> = {
  SCHEDULED: 'var(--color-green, #1e8c29)',
  IN_PROGRESS: 'var(--color-blue, #017eaf)',
  COMPLETED: 'var(--main-BK, #3d3d3d)',
  NOT_CONDUCTED: 'var(--main-BK, #3d3d3d)',
}

export function getGeminiApprovedTrainingStatusPresentation(status: GeminiApprovedTrainingStatus) {
  return {
    label: APPROVED_TRAINING_STATUS_LABEL[status],
    accentColor: APPROVED_TRAINING_STATUS_ACCENT[status],
    muted: status === 'NOT_CONDUCTED',
  }
}

const KOREAN_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

type AssignedTrainingScheduleRow = Pick<
  GeminiApprovedTrainingRow,
  'instructorAssigned' | 'trainingDate' | 'trainingTimeText'
>

function formatDateTimeLabel(date: string | undefined, timeText: string | undefined): string {
  const x = dayjs(date)
  if (!x.isValid()) return '-'
  const dateLabel = x.format('YYYY.MM.DD')
  const time = timeText?.trim() ?? ''
  if (!time || time === '-') return dateLabel
  return `${dateLabel} | ${time}`
}

/** 강사 배정 완료 후에만 API 확정 일정을 표시한다. 후보·lastPreferred 대체 없음. */
function formatAssignedTrainingDatetimeDisplay(row: AssignedTrainingScheduleRow): string {
  if (!row.instructorAssigned) return '-'
  const label = formatDateTimeLabel(row.trainingDate, row.trainingTimeText)
  return label
}

/** 승인 연수 삭제 안내 식별자. 강사 미배정이면 기관명만. */
export function formatApprovedTrainingDeleteDisplayName(
  row: Pick<GeminiApprovedTrainingRow, 'institutionName' | 'trainingDate' | 'instructorAssigned'>
): string {
  const institutionName = row.institutionName.trim() || '기관명 없음'
  if (!row.instructorAssigned) return institutionName
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

export type GeminiInstructorApprovalTrainingSummaryLabels = {
  institutionName: string
  trainingDateLabel: string
  trainingTimeLabel: string
}

export function formatTrainingTimeTextWithClassCount(
  timeText: string,
  classCount: number | null | undefined
): string {
  if (!timeText) return '-'
  const classCountText = classCount == null ? '-' : `${classCount}차시`
  return `${timeText} (${classCountText})`
}

/**
 * 강사 승인 모달 info callout. 확정 일정 필드만 사용한다 (상세 GET SSOT).
 */
export function resolveGeminiInstructorApprovalTrainingSummary(
  detail: Pick<
    GeminiApprovedTrainingDetail,
    'institutionName' | 'instructorAssigned' | 'trainingDate' | 'trainingTimeText' | 'classCount'
  >
): GeminiInstructorApprovalTrainingSummaryLabels {
  const institutionName = detail.institutionName.trim() || '-'
  const dateRaw = detail.trainingDate.trim()
  const parsedDate = dayjs(dateRaw)
  const hasDate = Boolean(dateRaw) && parsedDate.isValid()
  const trainingDateLabel = hasDate ? formatDateDotWithWeekday(parsedDate) : '-'
  const trainingTimeLabel = hasDate
    ? formatTrainingTimeTextWithClassCount(detail.trainingTimeText, detail.classCount)
    : '-'
  return { institutionName, trainingDateLabel, trainingTimeLabel }
}

/** 목록·엑셀 연수일시. 강사 배정 완료 + API 확정 필드만. */
export function formatConfirmedTrainingDatetimeDisplay(row: AssignedTrainingScheduleRow): string {
  return formatAssignedTrainingDatetimeDisplay(row)
}

/** @deprecated 목록은 formatConfirmedTrainingDatetimeDisplay 사용. 동일 규칙. */
export function formatTrainingDatetimeDisplay(row: AssignedTrainingScheduleRow): string {
  return formatAssignedTrainingDatetimeDisplay(row)
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
