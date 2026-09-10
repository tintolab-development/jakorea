import { axiosClient } from '@/shared/api/axios-instance'
import { portalMePaths } from '@/features/auth/sign-in'

export type PortalFormFeedbackItem = {
  feedbackId?: number
  content: string
  authorLabel?: string
  createdAt?: string
}

export type PortalFormFeedbackResponse = {
  formResponseId?: number
  responseStatus?: string
  reviewedAt?: string
  canResubmit?: boolean
  feedbacks: PortalFormFeedbackItem[]
}

function unwrapData(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>
  if (root.success === true && root.data && typeof root.data === 'object') {
    return root.data as Record<string, unknown>
  }
  return root
}

function optionalString(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function optionalNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function optionalBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : undefined
}

export function parsePortalFormFeedbackResponse(payload: unknown): PortalFormFeedbackResponse {
  const root = unwrapData(payload)
  if (!root) {
    throw new Error('피드백 응답을 해석할 수 없습니다.')
  }

  const rawList = Array.isArray(root.feedbacks) ? root.feedbacks : []
  const feedbacks: PortalFormFeedbackItem[] = []
  for (const item of rawList) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const content = optionalString(row.content)?.trim()
    if (!content) continue
    feedbacks.push({
      feedbackId: optionalNumber(row.feedbackId),
      content,
      authorLabel: optionalString(row.authorLabel),
      createdAt: optionalString(row.createdAt),
    })
  }

  return {
    formResponseId: optionalNumber(root.formResponseId),
    responseStatus: optionalString(root.responseStatus),
    reviewedAt: optionalString(root.reviewedAt),
    canResubmit: optionalBoolean(root.canResubmit),
    feedbacks,
  }
}

/** GET /api/portal/me/form-responses/{formResponseId}/feedback */
export async function getPortalFormResponseFeedback(
  formResponseId: number,
  signal?: AbortSignal,
): Promise<PortalFormFeedbackResponse> {
  const { data } = await axiosClient.get<unknown>(
    portalMePaths.formResponseFeedback(formResponseId),
    { signal },
  )
  return parsePortalFormFeedbackResponse(data)
}
