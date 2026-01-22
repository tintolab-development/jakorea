/**
 * 신청 알림 발송 서비스
 * Phase 4.2: 선정/미선정 안내 발송 (FR-F01)
 * Phase 0.2.3: 문자/이메일/카카오 발송 채널 + 발송 이력 (FR-C04)
 */

import type { UUID } from '@/types'
import { getReviewMessage } from '@/shared/constants/application-notification'
import type { Application } from '@/types/domain'

export type NotificationChannel = 'SMS' | 'EMAIL' | 'KAKAO'

export interface ApplicationNotificationStatus {
  applicationId: UUID
  notificationSent: boolean
  sentAt?: string
  sentBy?: UUID
}

/** FR-C04: 알림 발송 이력 (Mock) */
export interface NotificationRecord {
  id: string
  applicationId: UUID
  type: NotificationChannel
  title: string
  content: string
  sentAt: string
  status: 'SENT' | 'FAILED'
  sentBy?: UUID
}

const channelLabels: Record<NotificationChannel, string> = {
  SMS: '문자',
  EMAIL: '이메일',
  KAKAO: '카카오',
}

// Mock: 알림 발송 상태 저장 (실제로는 DB에 저장)
const notificationStatusMap = new Map<UUID, ApplicationNotificationStatus>()
// Mock: 발송 이력 (Phase 0.2.3)
const notificationHistoryMap = new Map<UUID, NotificationRecord[]>()

/**
 * 알림 발송 상태 조회
 */
export async function getNotificationStatus(applicationId: UUID): Promise<ApplicationNotificationStatus> {
  await new Promise(resolve => setTimeout(resolve, 100))
  const cached = notificationStatusMap.get(applicationId)
  if (cached) return cached
  const history = notificationHistoryMap.get(applicationId) || []
  const hasSent = history.some(h => h.status === 'SENT')
  const last = history.filter(h => h.status === 'SENT').sort((a, b) => b.sentAt.localeCompare(a.sentAt))[0]
  return {
    applicationId,
    notificationSent: hasSent,
    sentAt: last?.sentAt,
    sentBy: last?.sentBy,
  }
}

/**
 * 알림 발송 이력 조회 (Phase 0.2.3)
 */
export async function getNotificationHistory(applicationId: UUID): Promise<NotificationRecord[]> {
  await new Promise(resolve => setTimeout(resolve, 80))
  const list = notificationHistoryMap.get(applicationId) || []
  return [...list].sort((a, b) => b.sentAt.localeCompare(a.sentAt))
}

/**
 * 알림 발송 (채널별 SMS/이메일/카카오)
 */
export async function sendApplicationNotification(
  application: Application,
  action: 'APPROVE' | 'REJECT',
  sentBy: UUID,
  channel: NotificationChannel = 'SMS'
): Promise<NotificationRecord> {
  await new Promise(resolve => setTimeout(resolve, 500))

  const applicantType =
    application.subjectType === 'school'
      ? 'SCHOOL'
      : application.subjectType === 'student'
        ? 'INDIVIDUAL'
        : 'INSTRUCTOR'

  const { title, content } = getReviewMessage(action, applicantType)

  // Mock: 실제 발송은 외부 API (SMS/이메일/카카오) 호출. 여기서는 시뮬레이션.
  const status: 'SENT' | 'FAILED' = 'SENT'
  const record: NotificationRecord = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    applicationId: application.id,
    type: channel,
    title,
    content,
    sentAt: new Date().toISOString(),
    status,
    sentBy,
  }

  const history = notificationHistoryMap.get(application.id) || []
  history.push(record)
  notificationHistoryMap.set(application.id, history)

  notificationStatusMap.set(application.id, {
    applicationId: application.id,
    notificationSent: true,
    sentAt: record.sentAt,
    sentBy,
  })

  return record
}

/**
 * 알림 발송 상태 업데이트
 */
export async function updateNotificationStatus(
  applicationId: UUID,
  notificationSent: boolean,
  sentBy?: UUID
): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 200))
  const existing = notificationStatusMap.get(applicationId)
  notificationStatusMap.set(applicationId, {
    applicationId,
    notificationSent,
    sentAt: notificationSent ? new Date().toISOString() : existing?.sentAt,
    sentBy: sentBy ?? existing?.sentBy,
  })
}

export { channelLabels }
