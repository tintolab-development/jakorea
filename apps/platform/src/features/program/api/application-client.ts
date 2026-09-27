import { axiosClient } from '@/shared/api/axios-instance'
import type {
  PortalApplicationFormResponse,
  PortalApplicationOption,
  PortalApplicationSaveResponse,
  PortalSaveApplicationRequest,
} from './application-types'

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    if (o.success === true && 'data' in o) {
      return unwrapEnvelope<T>(o.data)
    }
  }
  return payload as T
}

const PORTAL_PROGRAMS_PATH = '/api/portal/programs'

/** GET /api/portal/programs/{programId}/application-options — 회원 Bearer */
export async function fetchPortalApplicationOptions(
  programId: number,
  signal?: AbortSignal,
): Promise<PortalApplicationOption[]> {
  const { data } = await axiosClient.get<unknown>(
    `${PORTAL_PROGRAMS_PATH}/${programId}/application-options`,
    { signal },
  )
  const unwrapped = unwrapEnvelope<unknown>(data)
  return Array.isArray(unwrapped) ? (unwrapped as PortalApplicationOption[]) : []
}

/** GET /api/portal/programs/{programId}/form-bindings/{bindingId} — 회원 Bearer */
export async function fetchPortalApplicationForm(
  programId: number,
  bindingId: number,
  query: { recruitmentId: number; applicationType: string },
  signal?: AbortSignal,
): Promise<PortalApplicationFormResponse> {
  const { data } = await axiosClient.get<unknown>(
    `${PORTAL_PROGRAMS_PATH}/${programId}/form-bindings/${bindingId}`,
    {
      signal,
      params: {
        recruitmentId: query.recruitmentId,
        applicationType: query.applicationType,
      },
    },
  )
  return unwrapEnvelope<PortalApplicationFormResponse>(data)
}

/** PUT /api/portal/programs/{programId}/applications/draft */
export async function savePortalApplicationDraft(
  programId: number,
  body: PortalSaveApplicationRequest,
): Promise<PortalApplicationSaveResponse> {
  const { data } = await axiosClient.put<unknown>(
    `${PORTAL_PROGRAMS_PATH}/${programId}/applications/draft`,
    body,
  )
  return unwrapEnvelope<PortalApplicationSaveResponse>(data)
}

/** POST /api/portal/programs/{programId}/applications */
export async function submitPortalApplication(
  programId: number,
  body: PortalSaveApplicationRequest,
): Promise<PortalApplicationSaveResponse> {
  const { data } = await axiosClient.post<unknown>(
    `${PORTAL_PROGRAMS_PATH}/${programId}/applications`,
    body,
  )
  return unwrapEnvelope<PortalApplicationSaveResponse>(data)
}

