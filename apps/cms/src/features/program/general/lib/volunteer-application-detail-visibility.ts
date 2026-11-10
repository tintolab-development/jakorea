/**
 * 일반 프로그램 봉사자 신청 상세 — 면접 있음/없음에 따른 섹션·상태 라벨
 */

import type { ApprovalStatusKey } from '@/shared/components/approval-status-text'
import { APPROVAL_STATUS_LABELS } from '@/shared/components/textbook-status-badge'
import type {
  GeneralDocumentScreeningStatus,
  GeneralSecondInterviewScreeningStatus,
} from '@/features/program/general/lib/volunteer-screening-constants'
import { mapApiApplicationStatusToApprovalStatus } from '@/features/program/general/api/adapters/general-applications-adapters'

export function shouldShowVolunteerManagerEvaluationSection(interviewEnabled: boolean): boolean {
  return interviewEnabled
}

export function shouldShowVolunteerInterviewAvailabilitySection(
  interviewEnabled: boolean
): boolean {
  return interviewEnabled
}

export function mapVolunteerDocumentStatusToApprovalStatus(
  status: GeneralDocumentScreeningStatus
): ApprovalStatusKey {
  if (status === 'pass') return 'approved'
  if (status === 'fail') return 'rejected'
  return 'pending'
}

export function volunteerApplicationApprovalStatusLabel(
  status: GeneralDocumentScreeningStatus
): string {
  return APPROVAL_STATUS_LABELS[mapVolunteerDocumentStatusToApprovalStatus(status)]
}

/** 면접 없음 목록·상세 — 신청 승인 상태. 일정 배정과 섞지 않는다. */
export function mapVolunteerProgramApprovalStatus(row: {
  applicationStatus?: string | null
  documentScreeningStatus: GeneralDocumentScreeningStatus
  secondInterviewScreeningStatus?: GeneralSecondInterviewScreeningStatus
}): ApprovalStatusKey {
  const fromApplication = mapApiApplicationStatusToApprovalStatus(
    row.applicationStatus ?? undefined
  )
  if (fromApplication !== 'pending') return fromApplication
  if (row.secondInterviewScreeningStatus === 'pass') return 'approved'
  if (row.secondInterviewScreeningStatus === 'fail') return 'rejected'
  return mapVolunteerDocumentStatusToApprovalStatus(row.documentScreeningStatus)
}

export function volunteerProgramApprovalStatusLabel(row: {
  applicationStatus?: string | null
  documentScreeningStatus: GeneralDocumentScreeningStatus
  secondInterviewScreeningStatus?: GeneralSecondInterviewScreeningStatus
}): string {
  return APPROVAL_STATUS_LABELS[mapVolunteerProgramApprovalStatus(row)]
}

/**
 * 신청 상세 헤더 CTA — 시안(면접 없음 9896:147375 · 면접 있음 3491:112371) 모두 서류 반려/승인.
 * 면접 없음의 팝업 문구는 강사 신청 목록 프로세스(프로그램 신청 승인 안내)를 그대로 쓴다.
 */
export function volunteerApplicationDecisionButtonLabels(_interviewEnabled: boolean): {
  reject: string
  approve: string
} {
  return { reject: '서류 반려', approve: '서류 승인' }
}
