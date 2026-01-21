/**
 * 신청 알림 발송 서비스
 * Phase 4.2: 선정/미선정 안내 발송 (FR-F01)
 */

import type { UUID } from '@/types'
import { getReviewMessage } from '@/shared/constants/application-notification'
import type { Application } from '@/types/domain'

export interface ApplicationNotificationStatus {
  applicationId: UUID
  notificationSent: boolean
  sentAt?: string
  sentBy?: UUID
}

// Mock: 알림 발송 상태 저장 (실제로는 DB에 저장)
const notificationStatusMap = new Map<UUID, ApplicationNotificationStatus>()

/**
 * 알림 발송 상태 조회
 */
export async function getNotificationStatus(applicationId: UUID): Promise<ApplicationNotificationStatus> {
  await new Promise(resolve => setTimeout(resolve, 100))
  
  return notificationStatusMap.get(applicationId) || {
    applicationId,
    notificationSent: false,
  }
}

/**
 * 알림 발송
 */
export async function sendApplicationNotification(
  application: Application,
  action: 'APPROVE' | 'REJECT',
  sentBy: UUID
): Promise<void> {
  // Mock: 실제로는 SMS/이메일 발송 API 호출
  await new Promise(resolve => setTimeout(resolve, 500))

  const applicantType = application.subjectType === 'school' 
    ? 'SCHOOL' 
    : application.subjectType === 'student' 
      ? 'INDIVIDUAL'
      : 'INSTRUCTOR'

  const message = getReviewMessage(action, applicantType)
  
  // Mock: 알림 발송 로그
  console.log('알림 발송:', {
    applicationId: application.id,
    action,
    message,
    recipient: application.subjectId,
  })

  // 알림 발송 상태 저장
  notificationStatusMap.set(application.id, {
    applicationId: application.id,
    notificationSent: true,
    sentAt: new Date().toISOString(),
    sentBy,
  })
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

  notificationStatusMap.set(applicationId, {
    applicationId,
    notificationSent,
    sentAt: notificationSent ? new Date().toISOString() : undefined,
    sentBy: sentBy || notificationStatusMap.get(applicationId)?.sentBy,
  })
}
