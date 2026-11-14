/**
 * GET /api/admin/notifications → UI Notification 타입
 */
import type {
  Notification,
  NotificationLinkTarget,
  NotificationType,
} from '../notification-service'
import { resolveNotificationInboxTitle } from '../../model/notification-event-type-labels'

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
  /** BE 탭 분류 SSOT (APPLICATION_MATCHING 등) */
  notificationCategory?: string | null
  /** notificationCategory가 없을 때만 쓰는 대체값 */
  category?: string
  /** 발행 시점 프로그램명 스냅샷. 없으면 null */
  programName?: string | null
  programTitle?: string
  sourceDomain?: string
  linkType?: string
  linkId?: number | string
  programId?: number | string
}

function idString(value: number | string | undefined | null): string | undefined {
  if (value == null) return undefined
  const text = String(value).trim()
  return text ? text : undefined
}

function mapNotificationLinkTarget(
  dto: NotificationInboxItemDto,
  eventType: string | undefined
): NotificationLinkTarget | undefined {
  const target: NotificationLinkTarget = {
    ...(eventType ? { eventType } : {}),
    ...(pickString(dto.sourceDomain) ? { sourceDomain: pickString(dto.sourceDomain) } : {}),
    ...(pickString(dto.linkType) ? { linkType: pickString(dto.linkType).toUpperCase() } : {}),
    ...(idString(dto.linkId) ? { linkId: idString(dto.linkId) } : {}),
    ...(idString(dto.programId) ? { programId: idString(dto.programId) } : {}),
  }
  return Object.keys(target).length > 0 ? target : undefined
}

/**
 * BE `notificationCategory` → 드롭다운 탭.
 * eventType으로 탭을 정하지 않는다(이벤트가 늘어나도 카테고리 SSOT를 따른다).
 * INQUIRY_SYSTEM은 문의 알림만 담는다(보안 알림은 SYSTEM). 모르는 값은 system.
 */
const NOTIFICATION_CATEGORY_TO_TYPE: Readonly<Record<string, NotificationType>> = {
  APPLICATION_MATCHING: 'matching',
  PROGRAM_PROGRESS: 'progress',
  SETTLEMENT: 'settlement',
  INQUIRY_SYSTEM: 'inquiry',
  UPDATE: 'schedule',
  SYSTEM: 'system',
  APPROVAL_REJECTION: 'system',
}

function mapNotificationCategoryToType(category: string): NotificationType {
  const key = category.trim().toUpperCase()
  return NOTIFICATION_CATEGORY_TO_TYPE[key] ?? 'system'
}

function pickString(...values: Array<string | null | undefined>): string {
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

  const eventType = pickString(dto.eventType) || undefined
  const rawTitle = pickString(dto.title, dto.subject)
  const title = resolveNotificationInboxTitle({ title: rawTitle, eventType })
  const body = pickString(dto.body, dto.message, dto.content, dto.summary, title)
  const link = pickString(dto.linkUrl, dto.link, dto.targetUrl) || undefined
  const createdAt = pickString(dto.createdAt, dto.sentAt) || new Date().toISOString()
  const programName = pickString(dto.programName, dto.programTitle) || undefined

  return {
    id: String(recipientId),
    type: mapNotificationCategoryToType(pickString(dto.notificationCategory, dto.category)),
    title,
    body,
    programName,
    link,
    target: mapNotificationLinkTarget(dto, eventType),
    read: isReadItem(dto),
    createdAt,
  }
}

export function mapNotificationInboxPage(items: unknown[] | undefined): Notification[] {
  return (items ?? [])
    .map(mapNotificationInboxItem)
    .filter((row): row is Notification => row != null)
}
