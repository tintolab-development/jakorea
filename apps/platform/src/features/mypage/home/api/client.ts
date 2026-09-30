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
}

export type PortalScheduleItem = {
  scheduleId?: number
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
