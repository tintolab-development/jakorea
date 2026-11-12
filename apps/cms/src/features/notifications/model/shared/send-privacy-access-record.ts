import type { NotificationSendPrivacyAccessRecipient } from '@/features/notifications/api/notifications-api-client'

/** 문자·알림톡·메일 발송 수신자 공통 모양(발송 요청 actor 매핑과 같은 필드). */
export type SendPrivacyAccessRecipientSource = {
  id: string
  source: string
  actorType?: string
  actorId?: number
}

function resolveActorId(recipient: SendPrivacyAccessRecipientSource): number | undefined {
  if (recipient.actorId != null && Number.isFinite(recipient.actorId)) return recipient.actorId
  const match = /^actor-[^-]+-(\d+)$/.exec(recipient.id)
  const parsed = match ? Number(match[1]) : undefined
  return parsed != null && Number.isFinite(parsed) ? parsed : undefined
}

/**
 * 정책 CMS-21·22·25: 화면에 원문으로 보이는 MEMBER·ADMIN 수신자만 기록 대상이다.
 * 직접 입력(manual/DIRECT)은 기록하지 않으며, actorId가 없는 행도 제외한다.
 */
export function toSendPrivacyAccessRecipients(
  recipients: readonly SendPrivacyAccessRecipientSource[]
): NotificationSendPrivacyAccessRecipient[] {
  const seen = new Set<string>()
  const result: NotificationSendPrivacyAccessRecipient[] = []
  for (const recipient of recipients) {
    if (recipient.source === 'manual') continue
    const actorType = (recipient.actorType || 'MEMBER').toUpperCase()
    if (actorType !== 'MEMBER' && actorType !== 'ADMIN') continue
    const actorId = resolveActorId(recipient)
    if (actorId == null) continue
    const key = `${actorType}:${actorId}`
    if (seen.has(key)) continue
    seen.add(key)
    result.push({ actorType, actorId })
  }
  return result
}

/** 같은 수신자 집합을 다시 기록하지 않기 위한 정렬 키(순서 무관). */
export function sendPrivacyAccessRecipientsKey(
  recipients: readonly NotificationSendPrivacyAccessRecipient[]
): string {
  return recipients
    .map(item => `${item.actorType}:${item.actorId}`)
    .sort()
    .join(',')
}
