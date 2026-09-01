import dayjs from 'dayjs'
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

export function formatStatusLabel(status: GeminiApprovedTrainingStatus): string {
  return APPROVED_TRAINING_STATUS_LABEL[status]
}

export function formatRegionDisplay(
  row: Pick<GeminiApprovedTrainingRow, 'institutionSido' | 'institutionSigungu'>
): string {
  return `${row.institutionSido} ${row.institutionSigungu}`.trim()
}

export function formatTrainingDatetimeDisplay(
  row: Pick<GeminiApprovedTrainingRow, 'instructorAssigned' | 'trainingDate' | 'trainingTimeText'>
): string {
  if (!row.instructorAssigned) {
    return '-'
  }
  const x = dayjs(row.trainingDate)
  if (!x.isValid()) {
    return '-'
  }
  return `${x.format('YYYY.MM.DD')} | ${row.trainingTimeText}`
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
