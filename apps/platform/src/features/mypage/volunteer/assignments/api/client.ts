import { axiosClient } from '@/shared/api/axios-instance'
import type { ProgramApplicationType } from '@/features/mypage/education/applications/api/types'

const APPLICATIONS_PATH = '/api/portal/me/program-applications'

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (record.success === true && 'data' in record) {
      return unwrapEnvelope<T>(record.data)
    }
  }
  return payload as T
}

export type PortalVolunteerAssignmentStatus = 'WAITING' | 'CANCELLED' | string

export type PortalVolunteerAssignedItem = {
  id?: string | number
  scheduleId?: number
  locationName?: string
  region?: string
  schoolName?: string
  educationGrade?: string
  distanceKm?: number | null
  /** 표기 전용. 없으면 접미어 없음 (FE km 판정 금지) */
  longDistance?: boolean | null
  scheduleLines?: string[]
  scheduleLine?: string
}

export type PortalVolunteerWaitingItem = {
  id?: string | number
  scheduleId?: number
  locationName?: string
  region?: string
  schoolName?: string
  desiredGrade?: string
  distanceKm?: number | null
  /** 표기 전용. 없으면 접미어 없음 */
  longDistance?: boolean | null
  scheduleLine?: string
  assignmentStatus?: PortalVolunteerAssignmentStatus
}

export type PortalVolunteerAssignmentsResponse = {
  programAudience?: 'individual' | 'organization' | string
  assigned?: PortalVolunteerAssignedItem[]
  waiting?: PortalVolunteerWaitingItem[]
}

/**
 * 봉사 배정현황 — GET .../program-applications/{type}/{id}/assignments
 * 진행 중·완료만 200. 미선정 등 → 403 PARTICIPATION_REQUIRED (schedules 게이트와 동일).
 */
export async function fetchVolunteerAssignments(
  applicationType: ProgramApplicationType,
  applicationId: string,
  signal?: AbortSignal,
): Promise<PortalVolunteerAssignmentsResponse> {
  const { data } = await axiosClient.get<unknown>(
    `${APPLICATIONS_PATH}/${applicationType}/${applicationId}/assignments`,
    { signal },
  )
  return unwrapEnvelope<PortalVolunteerAssignmentsResponse>(data) ?? {}
}
