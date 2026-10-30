/**
 * 일반 프로그램 봉사자 신청 상세 — 면접 있음/없음에 따른 섹션·상태 라벨
 */

import type { ApprovalStatusKey } from '@/shared/components/approval-status-text'
import { APPROVAL_STATUS_LABELS } from '@/shared/components/textbook-status-badge'
import type { GeneralDocumentScreeningStatus } from '@/features/program/general/lib/volunteer-screening-constants'

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
