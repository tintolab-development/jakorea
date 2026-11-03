import type { FormResponseFeedbackResponse } from '@/shared/api/generated/forms-surveys/schemas'

/** GET /api/admin/form-responses/{responseId}/feedback — BE FormResponseFeedbackListResponse */

export type FormResponseFeedbackListItem = {
  feedbackId?: number | null
  content?: string | null
  rejectReason?: string | null
  createdAt?: string | null
}

export type FormResponseFeedbackListResponse = {
  formResponseId?: number
  feedbacks: FormResponseFeedbackListItem[]
}

function itemTimestamp(item: FormResponseFeedbackListItem): number {
  const raw = item.createdAt?.trim()
  if (!raw) return 0
  const time = new Date(raw).getTime()
  return Number.isNaN(time) ? 0 : time
}

/** 최신 non-empty content, 없으면 rejectReason fallback */
export function pickFormResponseFeedbackDisplayContent(
  response: FormResponseFeedbackListResponse
): string | null {
  const items = [...(response.feedbacks ?? [])].sort(
    (a, b) => itemTimestamp(b) - itemTimestamp(a)
  )
  for (const item of items) {
    const content = item.content?.trim()
    if (content) return content
  }
  for (const item of items) {
    const reason = item.rejectReason?.trim()
    if (reason) return reason
  }
  return null
}

/** GET 목록 또는 POST 성공 후 캐시된 단건 응답 */
export function resolveFormResponseFeedbackDisplayContent(
  data: FormResponseFeedbackListResponse | FormResponseFeedbackResponse | undefined
): string | null {
  if (data == null) return null
  if ('feedbacks' in data && Array.isArray(data.feedbacks)) {
    return pickFormResponseFeedbackDisplayContent(data)
  }
  const singleFeedback = data as FormResponseFeedbackResponse
  return singleFeedback.content?.trim() || null
}
