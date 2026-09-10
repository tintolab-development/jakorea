import type { CreateRequest } from '@/shared/api/generated/notifications/schemas'
import { normalizeNotificationPlaceholderMarkup } from '@/features/notifications/model/shared/notification-placeholder-markup'

const EMAIL_TITLE_MAX = 1000
const SMS_LMS_MMS_TITLE_MAX = 40

export type NotificationSendBodySnapshotBaseline = {
  title?: string | null
  content?: string | null
}

/**
 * SMS/EMAIL 발송 시점 본문 스냅샷 → CreateRequest.titleTemplate / contentTemplate.
 * - 등록 템플릿 PATCH 금지 (스냅샷 ≠ 마스터 저장)
 * - 편집본이 baseline과 동일하면 omit (등록본 사용)
 * - ALIMTALK에는 호출하지 말 것
 */
export function applyNotificationSendBodySnapshot(
  body: CreateRequest,
  input: {
    channel: 'EMAIL' | 'SMS'
    title?: string | null
    content?: string | null
    baseline?: NotificationSendBodySnapshotBaseline | null
  }
): void {
  const title = normalizeNotificationPlaceholderMarkup((input.title ?? '').trim())
  const content = normalizeNotificationPlaceholderMarkup(input.content ?? '')
  const baselineTitle = normalizeNotificationPlaceholderMarkup(
    (input.baseline?.title ?? '').trim()
  )
  const baselineContent = normalizeNotificationPlaceholderMarkup(
    input.baseline?.content ?? ''
  )

  const titleMax = input.channel === 'EMAIL' ? EMAIL_TITLE_MAX : SMS_LMS_MMS_TITLE_MAX
  const titleChanged = input.baseline == null || title !== baselineTitle
  const contentChanged = input.baseline == null || content !== baselineContent

  if (titleChanged && title) {
    body.titleTemplate = title.slice(0, titleMax)
  }
  if (contentChanged && content.trim()) {
    body.contentTemplate = content
  }
}
