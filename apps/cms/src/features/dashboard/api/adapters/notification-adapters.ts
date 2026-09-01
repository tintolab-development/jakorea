/**
 * GET /api/admin/notifications → UI Notification 타입
 */
import type { Notification, NotificationType } from '../notification-service'

interface NotificationInboxItemDto {
  recipientId?: number
  id?: number | string
  title?: string
  subject?: string
  body?: string
  message?: string
  content?: string
  summary?: string
  linkUrl?: string
  link?: string
  targetUrl?: string
  read?: boolean
  readAt?: string
  readYn?: boolean
  createdAt?: string
  sentAt?: string
  eventType?: string
  category?: string
  programName?: string
  programTitle?: string
}

function mapEventTypeToNotificationType(eventType?: string): NotificationType {
  const normalized = (eventType ?? '').toLowerCase()
  if (normalized.includes('schedule') || normalized.includes('일정')) return 'schedule'
  if (normalized.includes('matching') || normalized.includes('매칭')) return 'matching'
  if (normalized.includes('settlement') || normalized.includes('정산')) return 'settlement'
  return 'system'
}

function pickString(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (value && value.trim()) return value.trim()
  }
  return ''
}

function isReadItem(item: NotificationInboxItemDto): boolean {
  if (item.read === true || item.readYn === true) return true
  return Boolean(item.readAt)
}

export function mapNotificationInboxItem(item: unknown): Notification | null {
  if (item == null || typeof item !== 'object') return null
  const dto = item as NotificationInboxItemDto

  const recipientId = dto.recipientId ?? dto.id
  if (recipientId == null) return null

  const title = pickString(dto.title, dto.subject, '알림')
  const body = pickString(dto.body, dto.message, dto.content, dto.summary, title)
  const link = pickString(dto.linkUrl, dto.link, dto.targetUrl) || undefined
  const createdAt = pickString(dto.createdAt, dto.sentAt) || new Date().toISOString()
  const programName =
    pickString(dto.programName, dto.programTitle) || undefined

  return {
    id: String(recipientId),
    type: mapEventTypeToNotificationType(dto.eventType ?? dto.category),
    title,
    body,
    programName,
    link,
    read: isReadItem(dto),
    createdAt,
  }
}

export function mapNotificationInboxPage(items: unknown[] | undefined): Notification[] {
  return (items ?? [])
    .map(mapNotificationInboxItem)
    .filter((row): row is Notification => row != null)
}
