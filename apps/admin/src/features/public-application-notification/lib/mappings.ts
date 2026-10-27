import type {
  PublicApplicationNotification,
  PublicApplicationNotificationStatus,
  PublicApplicationNotificationType,
} from '../model/types'

export const notificationTypeLabel: Record<PublicApplicationNotificationType, string> = {
  CAREER_TALENT_APPLICATION: '인재채용 지원',
  CORPORATE_CONSULTATION: '기업 후원 상담',
  TALENT_APPLICATION: '재능기부 신청',
}

export const notificationStatusLabel: Record<PublicApplicationNotificationStatus, string> = {
  PENDING: '발송 대기',
  RETRYING: '재시도 중',
  SENT: '발송 완료',
  FAILED: '발송 실패',
}

export function getNotificationTypeLabel(type: string): string {
  return notificationTypeLabel[type as PublicApplicationNotificationType] ?? '알 수 없는 알림 유형'
}

export function getNotificationStatusLabel(status: string): string {
  return notificationStatusLabel[status as PublicApplicationNotificationStatus] ?? '알 수 없는 상태'
}

export function canRetryNotification(status: string): boolean {
  return status === 'FAILED'
}

export function findNotificationForApplication(
  notifications: readonly PublicApplicationNotification[] | undefined,
  notificationType: PublicApplicationNotificationType,
  aggregateId: string
): PublicApplicationNotification | undefined {
  return notifications?.find(
    notification =>
      notification.notificationType === notificationType &&
      String(notification.aggregateId) === aggregateId
  )
}

export function getPublicApplicationDetailPath(
  notificationType: PublicApplicationNotificationType,
  aggregateId: string
): string {
  const encodedId = encodeURIComponent(aggregateId)
  switch (notificationType) {
    case 'CAREER_TALENT_APPLICATION':
      return `/ja-korea/recruit/applicants?applicationId=${encodedId}`
    case 'CORPORATE_CONSULTATION':
      return `/sponsor/corporate/consultations?consultationId=${encodedId}`
    case 'TALENT_APPLICATION':
      return `/sponsor/talent/applications?applicationId=${encodedId}`
  }
}

export function formatNotificationErrorMessage(error: unknown): {
  title: string
  content: string
} {
  const responseStatus =
    typeof error === 'object' && error !== null && 'response' in error
      ? (error as { response?: { status?: unknown } }).response?.status
      : undefined

  if (responseStatus === 401) {
    return { title: '알림 조회 실패', content: '로그인이 만료되었습니다. 다시 로그인해 주세요.' }
  }
  if (responseStatus === 403) {
    return { title: '알림 조회 실패', content: '알림 이력을 조회할 권한이 없습니다.' }
  }
  if (responseStatus === 404) {
    return { title: '재시도 실패', content: '대상 알림이 없거나 재시도할 수 없습니다.' }
  }
  return {
    title: '알림 조회 실패',
    content: '알림 이력을 불러오지 못했습니다. 다시 시도해 주세요.',
  }
}
