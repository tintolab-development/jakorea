import { axiosClient } from '@/shared/api/axios-instance'

const DASHBOARD_PATH = '/api/portal/me/dashboard'
const CALENDAR_PATH = '/api/portal/me/calendar'

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (record.success === true && 'data' in record) {
      return unwrapEnvelope<T>(record.data)
    }
  }
  return payload as T
}

export type PortalApplicationSummary = {
  total?: number
  draft?: number
  submitted?: number
  approved?: number
  rejected?: number
  cancelled?: number
  inProgress?: number
  completed?: number
  giveUp?: number
  /** 교육·봉사 현황 `statusGroup=COMPLETED`(표시: 진행 완료·활동 포기·신청 반려·신청 취소) */
  ended?: number
}

export type PortalScheduleItem = {
  scheduleId?: number
  applicationId?: number
  applicationType?: string
  /**
   * BE 캘린더 이벤트 유형(과제·설문·교육 일정·LECTURE_REPORT_DEADLINE 등).
   * OpenAPI PortalScheduleItem에는 아직 없으며, 응답에 있으면 매퍼가 구분한다.
   */
  eventType?: string
  /** OpenAPI 미기재. 마감·과제 등 scheduleId가 없는 이벤트 공통 식별자. */
  eventId?: number | string
  id?: number | string
  programId?: number
  programTitle?: string
  scheduleName?: string
  startAt?: string
  endAt?: string
  allDay?: boolean
  locationName?: string
  address?: string
  participationRole?: string
}

export type PortalDashboardResponse = {
  applications?: PortalApplicationSummary
  upcomingSchedules?: PortalScheduleItem[]
}

export type PortalCalendarResponse = {
  from?: string
  to?: string
  items?: PortalScheduleItem[]
}

export async function fetchPortalDashboard(signal?: AbortSignal): Promise<PortalDashboardResponse> {
  const { data } = await axiosClient.get<unknown>(DASHBOARD_PATH, { signal })
  return unwrapEnvelope<PortalDashboardResponse>(data)
}

export async function fetchPortalCalendar(
  from: string,
  to: string,
  signal?: AbortSignal,
): Promise<PortalCalendarResponse> {
  const { data } = await axiosClient.get<unknown>(CALENDAR_PATH, {
    signal,
    params: { from, to },
  })
  const unwrapped = unwrapEnvelope<PortalCalendarResponse | PortalScheduleItem[]>(data)
  if (Array.isArray(unwrapped)) return { items: unwrapped, from, to }
  return unwrapped
}
