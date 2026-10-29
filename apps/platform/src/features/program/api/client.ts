import type { InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import type {
  PortalProgramDetail,
  PortalProgramListPage,
  PortalProgramListQuery,
} from './types'

type SkipAuthConfig = InternalAxiosRequestConfig & {
  skipAuth?: boolean
  skipRefresh?: boolean
}

const PORTAL_PROGRAMS_PATH = '/api/portal/programs'

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    if (o.success === true && 'data' in o) {
      return unwrapEnvelope<T>(o.data)
    }
  }
  return payload as T
}

const SKIP_AUTH: SkipAuthConfig = {
  timeout: 8_000,
  skipAuth: true,
  skipRefresh: true,
} as SkipAuthConfig

function appendFilterValues(
  params: URLSearchParams,
  key: string,
  value: PortalProgramListQuery[keyof PortalProgramListQuery],
) {
  if (value == null || typeof value === 'number') return
  const values = Array.isArray(value) ? value : [value]
  for (const item of values) {
    if (typeof item === 'string' && item.trim()) {
      params.append(key, item)
    }
  }
}

/**
 * 목록 query를 Spring `List<String>` 계약의 반복 query parameter로 만든다.
 * Axios의 기본 배열 직렬화(`key[]`)는 사용하지 않는다.
 */
export function toPortalProgramListParams(query: PortalProgramListQuery): URLSearchParams {
  const params = new URLSearchParams()
  params.set('page', String(query.page))
  params.set('size', String(query.size))
  appendFilterValues(params, 'keyword', query.keyword)
  appendFilterValues(params, 'portalTab', query.portalTab)
  appendFilterValues(params, 'applicationType', query.applicationType)
  appendFilterValues(params, 'programType', query.programType)
  appendFilterValues(params, 'recruitmentStatus', query.recruitmentStatus)
  appendFilterValues(params, 'recruitmentTarget', query.recruitmentTarget)
  appendFilterValues(params, 'educationTarget', query.educationTarget)
  appendFilterValues(params, 'educationMethod', query.educationMethod)
  appendFilterValues(params, 'operatingFrom', query.operatingFrom)
  appendFilterValues(params, 'operatingTo', query.operatingTo)
  appendFilterValues(params, 'sort', query.sort)
  return params
}

function normalizeListPage(payload: unknown, fallbackSize: number): PortalProgramListPage {
  const unwrapped = unwrapEnvelope<unknown>(payload)
  if (Array.isArray(unwrapped)) {
    return {
      items: unwrapped,
      page: 0,
      size: fallbackSize,
      totalElements: unwrapped.length,
      totalPages: 1,
    }
  }
  if (!unwrapped || typeof unwrapped !== 'object') {
    return { items: [], page: 0, size: fallbackSize, totalElements: 0, totalPages: 0 }
  }
  const page = unwrapped as PortalProgramListPage
  return {
    items: Array.isArray(page.items) ? page.items : [],
    page: page.page ?? 0,
    size: page.size ?? fallbackSize,
    totalElements: page.totalElements ?? 0,
    totalPages: page.totalPages ?? 0,
  }
}

/** GET /api/portal/programs — CMS 8080, 로그인 전 호출 가능 */
export async function fetchPortalPrograms(
  query: PortalProgramListQuery,
  signal?: AbortSignal,
): Promise<PortalProgramListPage> {
  const { data } = await axiosClient.get<unknown>(PORTAL_PROGRAMS_PATH, {
    ...SKIP_AUTH,
    signal,
    params: toPortalProgramListParams(query),
  })
  return normalizeListPage(data, query.size)
}

export type PortalProgramDetailQuery = {
  recruitmentId?: number
  applicationType?: string
}

/**
 * GET /api/portal/programs/{programId}
 * URL/라우트의 applicationType·recruitmentId 가 있으면 그대로 query 로 보낸다.
 */
export async function fetchPortalProgramDetail(
  programId: number,
  signal?: AbortSignal,
  query?: PortalProgramDetailQuery,
): Promise<PortalProgramDetail> {
  const params: Record<string, string | number> = {}
  if (query?.recruitmentId != null && query.recruitmentId > 0) {
    params.recruitmentId = query.recruitmentId
  }
  if (query?.applicationType?.trim()) {
    params.applicationType = query.applicationType.trim()
  }
  const { data } = await axiosClient.get<unknown>(`${PORTAL_PROGRAMS_PATH}/${programId}`, {
    ...SKIP_AUTH,
    signal,
    params,
  })
  return unwrapEnvelope<PortalProgramDetail>(data)
}
