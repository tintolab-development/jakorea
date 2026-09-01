import dayjs, { type Dayjs } from 'dayjs'
import type { GeminiApprovedTrainingStatus } from '../../model/approved/types'
import { getApprovedInstitutionProgressStatuses } from '../../model/recruitment/institution-application-mock'
import { resolveRecruitmentStatus } from './resolve-status'

export type GeminiRecruitmentProgramProgressLabel =
  | '프로그램 진행 중'
  | '프로그램 진행 예정'
  | '프로그램 미진행'
  | '참여자 모집 중'

/** 조회 전용 — 신청 시작 전 게시 예정, 이후 게시 */
export function resolveRecruitmentAnnouncementDisplayLabel(
  applicationPeriodStart: string,
  referenceDate: Dayjs | string = dayjs()
): '게시' | '게시 예정' {
  const today = (typeof referenceDate === 'string' ? dayjs(referenceDate) : referenceDate).startOf(
    'day'
  )
  const start = dayjs(applicationPeriodStart).startOf('day')
  if (!start.isValid() || today.isBefore(start)) {
    return '게시 예정'
  }
  return '게시'
}

function aggregateProgramProgressFromStatuses(
  statuses: GeminiApprovedTrainingStatus[]
): GeminiRecruitmentProgramProgressLabel | null {
  if (statuses.length === 0) return null
  if (statuses.some(status => status === 'IN_PROGRESS')) {
    return '프로그램 진행 중'
  }
  if (statuses.every(status => status === 'SCHEDULED')) {
    return '프로그램 진행 예정'
  }
  if (statuses.every(status => status === 'NOT_CONDUCTED')) {
    return '프로그램 미진행'
  }
  if (statuses.every(status => status === 'COMPLETED')) {
    return '프로그램 미진행'
  }
  return '프로그램 진행 중'
}

export function resolveRecruitmentProgramProgressLabel(
  recruitmentId: string,
  applicationPeriodStart: string,
  applicationPeriodEnd: string,
  referenceDate: Dayjs | string = dayjs()
): GeminiRecruitmentProgramProgressLabel {
  const approvedStatuses = getApprovedInstitutionProgressStatuses(recruitmentId)
  const aggregated = aggregateProgramProgressFromStatuses(approvedStatuses)
  if (aggregated != null) {
    return aggregated
  }

  const recruitmentStatus = resolveRecruitmentStatus(
    applicationPeriodStart,
    applicationPeriodEnd,
    referenceDate
  )
  if (recruitmentStatus === 'IN_PROGRESS') {
    return '참여자 모집 중'
  }
  if (recruitmentStatus === 'SCHEDULED') {
    return '프로그램 진행 예정'
  }
  return '프로그램 미진행'
}

export function recruitmentProgramProgressModifier(
  label: GeminiRecruitmentProgramProgressLabel
): string {
  switch (label) {
    case '프로그램 진행 중':
    case '참여자 모집 중':
      return 'in-progress'
    case '프로그램 진행 예정':
      return 'scheduled'
    case '프로그램 미진행':
    default:
      return 'not-conducted'
  }
}
