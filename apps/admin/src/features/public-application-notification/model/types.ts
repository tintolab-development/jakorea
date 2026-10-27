export type PublicApplicationNotificationType =
  | 'CAREER_TALENT_APPLICATION'
  | 'CORPORATE_CONSULTATION'
  | 'TALENT_APPLICATION'

export type PublicApplicationNotificationStatus = 'PENDING' | 'RETRYING' | 'SENT' | 'FAILED'

/**
 * 공개 접수 이메일 알림 상태 API 응답.
 * 생성 클라이언트에 해당 경로가 추가되기 전까지 이 feature의 경계 타입으로만 사용한다.
 */
export type PublicApplicationNotification = {
  id: number
  eventKey: string
  notificationType: PublicApplicationNotificationType | string
  aggregateId: number
  status: PublicApplicationNotificationStatus | string
  attempts: number
  nextAttemptAt: string | null
  sentAt: string | null
  lastError: string | null
  createdAt: string
  updatedAt: string
}
