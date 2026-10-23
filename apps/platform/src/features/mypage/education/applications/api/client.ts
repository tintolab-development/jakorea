import { axiosClient } from '@/shared/api/axios-instance'
import type {
  PortalProgramApplicationDetail,
  PortalProgramApplicationListPage,
  PortalProgramApplicationListQuery,
  ProgramApplicationType,
} from './types'

const MY_PROGRAM_APPLICATIONS_PATH = '/api/portal/me/program-applications'

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    if (o.success === true && 'data' in o) {
      return unwrapEnvelope<T>(o.data)
    }
  }
  return payload as T
}

function compactParams(query: PortalProgramApplicationListQuery): Record<string, string | number> {
  const params: Record<string, string | number> = {
    applicationType: query.applicationType,
    page: query.page,
    size: query.size,
  }
  if (query.statusGroup) params.statusGroup = query.statusGroup
  if (query.status) params.status = query.status
  if (query.programGroup) params.programGroup = query.programGroup
  if (query.keyword) params.keyword = query.keyword
  if (query.from) params.from = query.from
  if (query.to) params.to = query.to
  return params
}

function normalizeListPage(payload: unknown, fallbackSize: number): PortalProgramApplicationListPage {
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
  const page = unwrapped as PortalProgramApplicationListPage
  return {
    items: Array.isArray(page.items) ? page.items : [],
    page: page.page ?? 0,
    size: page.size ?? fallbackSize,
    totalElements: page.totalElements ?? 0,
    totalPages: page.totalPages ?? 0,
  }
}

export async function fetchMyProgramApplications(
  query: PortalProgramApplicationListQuery,
  signal?: AbortSignal,
): Promise<PortalProgramApplicationListPage> {
  const { data } = await axiosClient.get<unknown>(MY_PROGRAM_APPLICATIONS_PATH, {
    signal,
    params: compactParams(query),
  })
  return normalizeListPage(data, query.size)
}

export async function fetchMyProgramApplicationDetail(
  applicationType: ProgramApplicationType,
  applicationId: string,
  signal?: AbortSignal,
): Promise<PortalProgramApplicationDetail> {
  const { data } = await axiosClient.get<unknown>(
    `${MY_PROGRAM_APPLICATIONS_PATH}/${applicationType}/${applicationId}`,
    { signal },
  )
  return unwrapEnvelope<PortalProgramApplicationDetail>(data)
}

/**
 * 제출된 신청의 양식 runtime.
 * GET /api/portal/programs/{programId}/form-bindings/{bindingId} 는 제출 후
 * APPLICATION_ALREADY_SUBMITTED 로 거절된다.
 */
export async function fetchPortalMeFormBindingRender(
  programId: number,
  bindingId: number,
  signal?: AbortSignal,
): Promise<Record<string, unknown>> {
  const { data } = await axiosClient.get<unknown>(
    `/api/portal/me/programs/${programId}/form-bindings/${bindingId}/render`,
    { signal },
  )
  const unwrapped = unwrapEnvelope<unknown>(data)
  if (unwrapped && typeof unwrapped === 'object' && !Array.isArray(unwrapped)) {
    return unwrapped as Record<string, unknown>
  }
  return {}
}

/** 서버 `reason`은 필수(@NotBlank)지만 신청 취소 모달에는 사유 입력이 없다. */
const MEMBER_CANCEL_REQUEST = {
  reasonCode: 'MEMBER_REQUEST',
  reason: '회원 요청에 의한 신청 취소',
} as const

export async function cancelMyProgramApplication(
  applicationType: ProgramApplicationType,
  applicationId: string,
): Promise<void> {
  await axiosClient.post(
    `${MY_PROGRAM_APPLICATIONS_PATH}/${applicationType}/${applicationId}/cancel`,
    MEMBER_CANCEL_REQUEST,
  )
}
