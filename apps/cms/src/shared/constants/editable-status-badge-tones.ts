/**
 * 편집 가능 상태 배지 톤 — 시안 4종(재직·권한·교재배송·서류평가) 공통
 */

import type { TextbookStatusKey } from '@/features/program/general/model/participating-schools'
import type { InstructorRoleKey } from '@/features/program/general/model/school-detail-types'
import type { UjatManagerEvaluation } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import type { SponsorSponsorshipStatus } from '@/types/domain'
import type { ProgramRole, SchoolTeacherEmploymentStatus } from '@/types/user'
import type { StatusTagTone } from '@/shared/components/status-tag'

export const SCHOOL_TEACHER_EMPLOYMENT_BADGE_LABEL: Record<SchoolTeacherEmploymentStatus, string> = {
  ACTIVE: '재직 중',
  ON_LEAVE: '휴직',
  TRANSFERRED: '전근',
  WITHDRAWN: '탈퇴',
}

/** 공통 StatusTag tone — 값별 색은 이 tone으로만 지정 */
export type EditableStatusBadgeTone = StatusTagTone

export function getEmploymentBadgeTone(
  status: SchoolTeacherEmploymentStatus
): EditableStatusBadgeTone {
  return status === 'ACTIVE' ? 'blue' : 'gray'
}

export function getInstructorRoleBadgeTone(role: InstructorRoleKey): EditableStatusBadgeTone {
  return role === 'lead' ? 'blue' : 'gray'
}

export function getProgramRoleBadgeTone(role: ProgramRole): EditableStatusBadgeTone {
  if (role === 'OWNER') return 'blue'
  if (role === 'PARTNER') return 'green'
  return 'gray'
}

export function getTextbookStatusBadgeTone(status: TextbookStatusKey): EditableStatusBadgeTone {
  if (status === 'preparing') return 'green'
  if (status === 'shipping') return 'blue'
  return 'gray'
}

export function getTextbookDeliveryStatusBadgeTone(
  status: 'before_shipping' | 'shipping' | 'delivered'
): EditableStatusBadgeTone {
  if (status === 'before_shipping') return 'green'
  if (status === 'shipping') return 'blue'
  return 'gray'
}

export type ManagerEvaluationBadgeKey = UjatManagerEvaluation

export function getManagerEvaluationBadgeTone(
  evaluation: ManagerEvaluationBadgeKey
): EditableStatusBadgeTone {
  if (evaluation === 'pass') return 'blue'
  if (evaluation === 'fail') return 'red'
  if (evaluation === 'neutral') return 'greenOverlay'
  return 'gray'
}

export const SPONSOR_SPONSORSHIP_STATUS_LABEL: Record<SponsorSponsorshipStatus, string> = {
  active: '후원 중',
  discussing: '후원 논의중',
  dormant: '후원 휴면',
  ended: '후원 종료',
}

export function getSponsorSponsorshipStatusBadgeTone(
  status: SponsorSponsorshipStatus
): EditableStatusBadgeTone {
  if (status === 'active') return 'blue'
  if (status === 'discussing') return 'green'
  if (status === 'dormant') return 'gray'
  if (status === 'ended') return 'red'
  return 'gray'
}
