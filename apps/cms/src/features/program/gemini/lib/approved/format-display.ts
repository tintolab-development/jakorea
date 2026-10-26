import dayjs from 'dayjs'
import type {
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

export function formatStatusLabel(status: GeminiApprovedTrainingStatus): string {
  return APPROVED_TRAINING_STATUS_LABEL[status]
}

export function formatRegionDisplay(
  row: Pick<GeminiApprovedTrainingRow, 'institutionSido' | 'institutionSigungu'>
): string {
  return `${row.institutionSido} ${row.institutionSigungu}`.trim()
}

/** 강사 매칭으로 확정된 연수일시만. 미확정이면 `-` */
export function formatConfirmedTrainingDatetimeDisplay(
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

/** 확정 연수일시. 미확정이면 기관 신청 희망 일정(1~3지망) */
export function formatTrainingDatetimeDisplay(
  row: Pick<
    GeminiApprovedTrainingRow,
    'instructorAssigned' | 'trainingDate' | 'trainingTimeText' | 'trainingDateCandidates'
  >
): string {
  const confirmed = formatConfirmedTrainingDatetimeDisplay(row)
  if (confirmed !== '-') return confirmed
  return formatTrainingDateCandidatesDisplay(row.trainingDateCandidates)
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
