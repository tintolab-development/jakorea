import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { ProgramCalendarItemResponse } from '@/shared/api/generated/dashboard/schemas/programCalendarItemResponse'

dayjs.extend(utc)
dayjs.extend(timezone)

const SEOUL = 'Asia/Seoul'

export type AdminProgramCalendarQuery = {
  includeOperationalEvents: true
  startDate: string
  endDate: string
  programType?: string
  programStatus?: string
  keyword?: string
  programId?: number
}

/**
 * calendar_1 응답 항목. BE 계약상 organizationName은 해당 없으면 JSON null로 오지만
 * 생성 타입은 string|undefined라 null만 좁게 허용한다.
 */
export type AdminProgramCalendarItem = Omit<ProgramCalendarItemResponse, 'organizationName'> & {
  organizationName?: string | null
}

export type AdminProgramCalendarRequestParams = {
  includeOperationalEvents: true
  startDate: string
  endDate: string
  startAt: string
  endAt: string
  myProgramsOnly: false
  programType?: string
  programStatus?: string
  viewType?: string
  keyword?: string
  programId?: number
}

/** YYYY-MM-DD(양끝 포함, Asia/Seoul) → Instant. startDate가 있으면 BE가 Instant보다 날짜를 우선한다. */
export function seoulInclusiveRangeInstants(
  startDate: string,
  endDate: string
): { startAt: string; endAt: string } {
  return {
    startAt: dayjs.tz(startDate, SEOUL).startOf('day').utc().toISOString(),
    endAt: dayjs.tz(endDate, SEOUL).endOf('day').utc().toISOString(),
  }
}

export function buildAdminProgramCalendarRequestParams(
  params: AdminProgramCalendarQuery
): AdminProgramCalendarRequestParams {
  const { startAt, endAt } = seoulInclusiveRangeInstants(params.startDate, params.endDate)
  const out: AdminProgramCalendarRequestParams = {
    includeOperationalEvents: true,
    startDate: params.startDate,
    endDate: params.endDate,
    startAt,
    endAt,
    myProgramsOnly: false,
  }
  if (params.programType?.trim()) out.programType = params.programType.trim()
  const status = params.programStatus?.trim()
  if (status && status !== 'ALL') {
    out.programStatus = status
    out.viewType = status
  }
  if (params.keyword?.trim()) out.keyword = params.keyword.trim()
  if (params.programId != null) out.programId = params.programId
  return out
}

function asCalendarItemArray(payload: unknown): AdminProgramCalendarItem[] {
  const body = unwrapApiBody<unknown>(payload)
  if (Array.isArray(body)) return body as AdminProgramCalendarItem[]
  if (body != null && typeof body === 'object') {
    const record = body as Record<string, unknown>
    if (Array.isArray(record.items)) return record.items as AdminProgramCalendarItem[]
    if (Array.isArray(record.content)) return record.content as AdminProgramCalendarItem[]
  }
  return []
}

/** GET /api/admin/program-calendar — 프로그램 관리 월간·주간 캘린더 전용 */
export async function fetchAdminProgramCalendarRemote(
  params: AdminProgramCalendarQuery
): Promise<AdminProgramCalendarItem[]> {
  return asCalendarItemArray(
    await customInstance({
      url: '/api/admin/program-calendar',
      method: 'GET',
      params: buildAdminProgramCalendarRequestParams(params),
    })
  )
}
