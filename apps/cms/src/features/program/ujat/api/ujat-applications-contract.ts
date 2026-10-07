/**
 * UJAT 신청 Admin API — 생성 클라이언트에 아직 없는 UJAT 전용 query·응답 필드.
 * 값이 없으면 백엔드는 null을 내려준다. 프론트에서 기본값으로 채우지 않는다.
 * @see apps/cms/docs/api/ujat-program-remote-only-gaps-backend-cursor-prompt-2026-10-07.md
 */

import type { ApplicationsListQuery } from '@/features/program/general/api/applications-api-client'
import type { OrganizationApplicationDetailDto } from '@/features/program/general/api/applications-api-client'
import type { OrganizationApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/organizationApplicationListItemResponse'
import type { VolunteerApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/volunteerApplicationListItemResponse'

export type UjatApplicationsListQuery = ApplicationsListQuery & {
  grade?: string
  preferredRegion?: string
  hasEducationExperience?: boolean
  /** `YYYY-MM-DD` (KST) */
  assignedInterviewDate?: string
  totalScore?: number
  organizationName?: string
  teacherName?: string
  requestedClassCount?: number
  educationRegionCode?: string
  /** `YYYY-MM-DD` (KST) */
  scheduleDate?: string
}

export type UjatScheduleConfirmStatusWire =
  | 'institution_checking'
  | 'institution_confirmed'
  | 'approval_completed'
  | 'revision_requested'
  | 'application_rejected'

export type UjatOrganizationApplicationListItem = OrganizationApplicationListItemResponse & {
  educationRegionCode?: string | null
  scheduleConfirmStatus?: UjatScheduleConfirmStatusWire | null
  assignedInstructorCount?: number | null
  operatingStudentCount?: number | null
}

export type UjatVolunteerApplicationListItem = VolunteerApplicationListItemResponse & {
  grade?: string | null
  preferredRegion?: string | null
  preferredRegionCode?: string | null
  hasEducationExperience?: boolean | null
  /** `YYYY-MM-DD` */
  birthDate?: string | null
  /** 목록 값은 마스킹. 원문은 봉사자 상세 unmask `profile.external1365Id` */
  id1365?: string | null
  /** 저장 컬럼이 없어 현재 항상 null */
  openingCeremonyAttended?: boolean | null
}

export type UjatOrganizationApplicationGradeBlock = {
  gradeLabel?: string | null
  classCount?: number | null
  classes?: Array<{ classNo?: string | number | null; studentCount?: number | null }> | null
}

export type UjatOrganizationApplicationClassTimeRow = {
  gradeRangeLabel?: string | null
  periods?: string[] | null
}

export type UjatOrganizationApplicationDetail = OrganizationApplicationDetailDto & {
  teacherTel?: string | null
  /** 없으면 null (빈 배열 아님) */
  preferredEducationDates?: string[] | null
  gradeBlocks?: UjatOrganizationApplicationGradeBlock[] | null
  classTimeRows?: UjatOrganizationApplicationClassTimeRow[] | null
}

const SCHEDULE_CONFIRM_STATUSES: readonly UjatScheduleConfirmStatusWire[] = [
  'institution_checking',
  'institution_confirmed',
  'approval_completed',
  'revision_requested',
  'application_rejected',
]

export function parseUjatScheduleConfirmStatus(
  value: unknown
): UjatScheduleConfirmStatusWire | null {
  return typeof value === 'string' &&
    (SCHEDULE_CONFIRM_STATUSES as readonly string[]).includes(value)
    ? (value as UjatScheduleConfirmStatusWire)
    : null
}
