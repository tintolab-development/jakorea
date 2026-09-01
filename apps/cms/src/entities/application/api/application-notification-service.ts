/**
 * 신청 알림 발송 서비스
 * Phase 4.2: 선정/미선정 안내 발송 (FR-F01)
 * Phase 0.2.3: 문자/이메일/카카오 발송 채널 + 발송 이력 (FR-C04)
 * Task 2.4.2: 실제 문자/이메일/카카오 API 연동 준비 (Provider 호출, 수신자 resolve, 에러 핸들링)
 */

import type { UUID } from '@/types'
import { getReviewMessage } from '@/shared/constants/application-notification'
import type { Application } from '@/types/domain'
import { mockUsers } from '@/data/mock/users'
import { mockSchoolsMap } from '@/data/mock'
import { mockInstructorsMap } from '@/data/mock'
import {
  smsProvider,
  emailProvider,
  kakaoProvider } from './notification-providers'

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
  KAKAO: '카카오' }

// Mock: 알림 발송 상태 저장 (실제로는 DB에 저장)
const notificationStatusMap = new Map<UUID, ApplicationNotificationStatus>()
// Mock: 발송 이력 (Phase 0.2.3)
const notificationHistoryMap = new Map<UUID, NotificationRecord[]>()

interface Recipient {
  phone?: string
  email?: string
}

/**
 * 신청 주체( subjectId )로 수신자 연락처/이메일 조회
 * User → School → Instructor 순으로 매칭
 */
function resolveRecipient(application: Application): Recipient {
  const sid = application.subjectId
  const user = mockUsers.find(u => u.id === sid)
  if (user) {
    return { phone: user.phone, email: user.email }
  }
  const school = mockSchoolsMap.get(sid)
  if (school) {
    return { phone: school.contactPhone, email: school.contactEmail }
  }
  const instructor = mockInstructorsMap.get(sid)
  if (instructor) {
    return { phone: instructor.contactPhone, email: instructor.contactEmail }
  }
  return {}
}

/**
 * 알림 발송 상태 조회
 */
export async function getNotificationStatus(
  applicationId: UUID
): Promise<ApplicationNotificationStatus> {
  await new Promise(resolve => setTimeout(resolve, 100))
  const cached = notificationStatusMap.get(applicationId)
  if (cached) return cached
  const history = notificationHistoryMap.get(applicationId) || []
  const hasSent = history.some(h => h.status === 'SENT')
  const last = history
    .filter(h => h.status === 'SENT')
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt))[0]
  return {
    applicationId,
    notificationSent: hasSent,
    sentAt: last?.sentAt,
    sentBy: last?.sentBy }
}

/**
 * 알림 발송 이력 조회 (Phase 0.2.3)
 */
export async function getNotificationHistory(
  applicationId: UUID
): Promise<NotificationRecord[]> {
  await new Promise(resolve => setTimeout(resolve, 80))
  const list = notificationHistoryMap.get(applicationId) || []
  return [...list].sort((a, b) => b.sentAt.localeCompare(a.sentAt))
}

/**
 * 알림 발송 (채널별 SMS/이메일/카카오)
 * Provider 호출 → 실패 시 FAILED 기록 후 throw, 성공 시 SENT 기록 및 반환
 */
export async function sendApplicationNotification(
  application: Application,
  action: 'APPROVE' | 'REJECT',
  sentBy: UUID,
  channel: NotificationChannel = 'SMS'
): Promise<NotificationRecord> {
  const applicantType =
    application.subjectType === 'school'
      ? 'SCHOOL'
      : application.subjectType === 'student'
        ? 'INDIVIDUAL'
        : 'INSTRUCTOR'

  const { title, content } = getReviewMessage(action, applicantType)
  const recipient = resolveRecipient(application)

  const recordId = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const sentAt = new Date().toISOString()

  const appendRecord = (status: 'SENT' | 'FAILED') => {
    const record: NotificationRecord = {
      id: recordId,
      applicationId: application.id,
      type: channel,
      title,
      content,
      sentAt,
      status,
      sentBy }
    const history = notificationHistoryMap.get(application.id) || []
    history.push(record)
    notificationHistoryMap.set(application.id, history)
    if (status === 'SENT') {
      notificationStatusMap.set(application.id, {
        applicationId: application.id,
        notificationSent: true,
        sentAt,
        sentBy })
    }
    return record
  }

  if (channel === 'SMS') {
    const phone = recipient.phone?.trim() || ''
    if (!phone) {
      appendRecord('FAILED')
      throw new Error('수신자 연락처(휴대폰)를 찾을 수 없습니다.')
    }
    const res = await smsProvider.send({ to: phone, body: content })
    if (!res.success) {
      appendRecord('FAILED')
      throw new Error(res.error ?? '문자 발송에 실패했습니다.')
    }
    return appendRecord('SENT')
  }

  if (channel === 'EMAIL') {
    const email = recipient.email?.trim() || ''
    if (!email) {
      appendRecord('FAILED')
      throw new Error('수신자 이메일을 찾을 수 없습니다.')
    }
    const res = await emailProvider.send({
      to: email,
      subject: title,
      body: content })
    if (!res.success) {
      appendRecord('FAILED')
      throw new Error(res.error ?? '이메일 발송에 실패했습니다.')
    }
    return appendRecord('SENT')
  }

  if (channel === 'KAKAO') {
    const phone = recipient.phone?.trim() || ''
    if (!phone) {
      appendRecord('FAILED')
      throw new Error('카카오 알림 발송을 위한 수신자 연락처를 찾을 수 없습니다.')
    }
    const res = await kakaoProvider.send({ to: phone, body: content })
    if (!res.success) {
      appendRecord('FAILED')
      throw new Error(res.error ?? '카카오 알림 발송에 실패했습니다.')
    }
    return appendRecord('SENT')
  }

  appendRecord('FAILED')
  throw new Error(`지원하지 않는 알림 채널: ${channel}`)
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
    sentBy: sentBy ?? existing?.sentBy })
}

export { channelLabels }
