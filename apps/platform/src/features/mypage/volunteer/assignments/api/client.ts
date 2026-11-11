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
  /**
   * N6 — 백엔드 추가 예정(OpenAPI `MemberPortalVolunteerAssignedItem` 미반영, 재생성 시 대체).
   * scheduleLines와 순서·길이가 같다(index i끼리 같은 일정). 일정이 없으면 []. 구버전 응답에는 키가 없다.
   */
  scheduleIds?: number[]
  /** N6 — scheduleLines[i]의 회차 번호(program_schedule.session_no). 사전교육·회차 없음은 null */
  sessionNos?: (number | null)[]
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
  /**
   * N6 — 이 일정의 회차 번호(program_schedule.session_no). 사전교육·회차 없음은 null.
   * OpenAPI `MemberPortalVolunteerWaitingItem` 미반영(재생성 시 대체). 구버전 응답에는 키가 없다.
   */
  sessionNo?: number | null
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
