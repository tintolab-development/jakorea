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

function compactParams(query: PortalProgramListQuery): Record<string, string | number> {
  const params: Record<string, string | number> = {
    page: query.page,
    size: query.size,
  }
  if (query.keyword) params.keyword = query.keyword
  if (query.portalTab) params.portalTab = query.portalTab
  if (query.programType) params.programType = query.programType
  if (query.recruitmentStatus) params.recruitmentStatus = query.recruitmentStatus
  if (query.educationTargets) params.educationTargets = query.educationTargets
  if (query.educationMethod) params.educationMethod = query.educationMethod
  if (query.operatingFrom) params.operatingFrom = query.operatingFrom
  if (query.operatingTo) params.operatingTo = query.operatingTo
  if (query.sort) params.sort = query.sort
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
    params: compactParams(query),
  })
  return normalizeListPage(data, query.size)
}

export type PortalProgramDetailQuery = {
  recruitmentId?: number
  applicationType?: string
}

/** GET /api/portal/programs/{programId} — CMS 8080, 로그인 전 호출 가능 */
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
