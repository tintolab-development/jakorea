import { axiosClient } from '@/shared/api/axios-instance'
import type {
  PortalApplicationFormResponse,
  PortalApplicationOption,
  PortalApplicationSaveResponse,
  PortalDraftAttachment,
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function normalizeDraftAttachments(raw: unknown): PortalDraftAttachment[] {
  if (!Array.isArray(raw)) return []
  const attachments: PortalDraftAttachment[] = []
  for (const item of raw) {
    if (!isRecord(item)) continue
    const questionKey = typeof item.questionKey === 'string' ? item.questionKey : ''
    const fileObjectId =
      typeof item.fileObjectId === 'number' ? item.fileObjectId : Number(item.fileObjectId)
    const originalFileName =
      typeof item.originalFileName === 'string' ? item.originalFileName : ''
    if (!questionKey || !Number.isSafeInteger(fileObjectId) || fileObjectId <= 0 || !originalFileName) {
      continue
    }
    attachments.push({
      questionKey,
      fileObjectId,
      originalFileName,
      contentType: typeof item.contentType === 'string' ? item.contentType : null,
      fileSize:
        typeof item.fileSize === 'number' && Number.isFinite(item.fileSize)
          ? item.fileSize
          : null,
    })
  }
  return attachments
}

/**
 * 임시저장 없음 → draftApplicationId/draftFormResponseId = null,
 * draftAnswers = {}, draftAttachments = [] (null 금지).
 */
function normalizeApplicationFormResponse(
  raw: PortalApplicationFormResponse,
): PortalApplicationFormResponse {
  const draftAnswers =
    raw.draftAnswers && isRecord(raw.draftAnswers) ? raw.draftAnswers : {}
  return {
    ...raw,
    draftApplicationId: raw.draftApplicationId ?? null,
    draftFormResponseId: raw.draftFormResponseId ?? null,
    draftAnswers,
    draftAttachments: normalizeDraftAttachments(raw.draftAttachments),
  }
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

/**
 * GET /api/portal/programs/{programId}/form-bindings/{bindingId}
 * — APPLICATION 바인딩 전용. me 세그먼트·render 접미사를 붙이지 않는다.
 * recruitmentId·applicationType query 필수.
 */
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
  return normalizeApplicationFormResponse(
    unwrapEnvelope<PortalApplicationFormResponse>(data),
  )
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

