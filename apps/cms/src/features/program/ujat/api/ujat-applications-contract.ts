/**
 * UJAT 신청 Admin API — UJAT 전용 query·응답 필드.
 * 값이 없으면 백엔드는 null을 내려준다. 프론트에서 기본값으로 채우지 않는다.
 * @see apps/cms/docs/api/ujat-program-remote-only-gaps-backend-cursor-prompt-2026-10-07.md
 */

import type { ApplicationsListQuery } from '@/features/program/general/api/applications-api-client'
import type { OrganizationApplicationDetailDto } from '@/features/program/general/api/applications-api-client'
import type { OrganizationApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/organizationApplicationListItemResponse'
import type { OrganizationApplicationListItemResponseScheduleConfirmStatus } from '@/shared/api/generated/dashboard/schemas/organizationApplicationListItemResponseScheduleConfirmStatus'
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
  /** 임시 배정 워크플로. applicationStatus가 아님 */
  temporaryAssignmentStatus?: string
}

export type UjatScheduleConfirmStatusWire =
  NonNullable<OrganizationApplicationListItemResponseScheduleConfirmStatus>

export type UjatOrganizationApplicationListItem = OrganizationApplicationListItemResponse

/** `id1365`는 목록에서 마스킹. 원문은 봉사자 상세 unmask `profile.external1365Id` */
export type UjatVolunteerApplicationListItem = VolunteerApplicationListItemResponse

export type UjatOrganizationApplicationDetail = OrganizationApplicationDetailDto

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
