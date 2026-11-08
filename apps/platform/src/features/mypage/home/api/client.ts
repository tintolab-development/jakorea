import { axiosClient } from '@/shared/api/axios-instance'
import { readPortalDashboard } from './dashboard-stats'

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

/**
 * GET /api/portal/me/calendar PortalScheduleItem.
 * eventType: PROGRAM_SCHEDULE | ASSIGNMENT_DEADLINE | SATISFACTION_DEADLINE |
 * SURVEY_DEADLINE | EXPENSE_RECEIPT_DEADLINE | LECTURE_REPORT_DEADLINE.
 * null eventType 은 PROGRAM_SCHEDULE. PROGRAM_PERIOD 는 신규 계약에 없고, 오면 그리지 않는다.
 */
export type PortalScheduleItem = {
  eventId?: number | string | null
  eventType?: string | null
  title?: string | null
  id?: number | string | null
  programId?: number | null
  programTitle?: string | null
  scheduleId?: number | null
  scheduleName?: string | null
  applicationId?: number | null
  applicationType?: string | null
  assignmentId?: number | null
  lectureReportId?: number | null
  reportStatus?: string | null
  canSubmit?: boolean | null
  isOverdue?: boolean | null
  formBindingId?: number | null
  formResponseId?: number | null
  receiptId?: number | null
  startAt?: string | null
  endAt?: string | null
  allDay?: boolean | null
  deadlineAt?: string | null
  deadlineDate?: string | null
  /** 서버 effectiveDeadline Instant. deadlineDate와 동일 시각. 없으면 null. */
  submitDueAt?: string | null
  status?: string | null
  participationRole?: string | null
  timeAvailability?: string | null
  locationName?: string | null
  address?: string | null
}

/** 홈은 applications 카운트만 사용. pending/schedules/notices/instructorRoleRequest는 파싱하지 않는다. */
export type PortalDashboardResponse = {
  applications?: PortalApplicationSummary
}

export type PortalCalendarResponse = {
  from?: string
  to?: string
  items?: PortalScheduleItem[]
}

export async function fetchPortalDashboard(signal?: AbortSignal): Promise<PortalDashboardResponse> {
  const { data } = await axiosClient.get<unknown>(DASHBOARD_PATH, { signal })
  return readPortalDashboard(data)
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
