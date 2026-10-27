import {
  canRetryNotification,
  findNotificationForApplication,
  getNotificationStatusLabel,
  getNotificationTypeLabel,
  getPublicApplicationDetailPath,
} from './mappings.ts'

const notifications = [
  {
    id: 1,
    eventKey: 'TALENT_APPLICATION:123',
    notificationType: 'TALENT_APPLICATION',
    aggregateId: 123,
    status: 'FAILED',
    attempts: 1,
    nextAttemptAt: null,
    sentAt: null,
    lastError: 'SMTP failed',
    createdAt: '2026-10-27T09:59:50Z',
    updatedAt: '2026-10-27T10:00:00Z',
  },
] as const

if (getNotificationTypeLabel('TALENT_APPLICATION') !== '재능기부 신청') {
  throw new Error('known notification type should be translated')
}
if (getNotificationTypeLabel('UNKNOWN') !== '알 수 없는 알림 유형') {
  throw new Error('unknown notification type should not be classified')
}
if (getNotificationStatusLabel('SENT') !== '발송 완료') {
  throw new Error('known notification status should be translated')
}
if (getNotificationStatusLabel('SUCCESS') !== '알 수 없는 상태') {
  throw new Error('unsupported notification status should not be converted')
}
if (!canRetryNotification('FAILED') || canRetryNotification('SENT')) {
  throw new Error('only FAILED notifications are retryable')
}
if (!findNotificationForApplication(notifications, 'TALENT_APPLICATION', '123')) {
  throw new Error('notification should match by type and aggregate id')
}
if (findNotificationForApplication(notifications, 'CORPORATE_CONSULTATION', '123')) {
  throw new Error('notification type must not be mixed')
}
if (
  getPublicApplicationDetailPath('TALENT_APPLICATION', '123') !==
  '/sponsor/talent/applications?applicationId=123'
) {
  throw new Error('talent application detail route should reuse the admin route contract')
}

console.log('public application notification mapping selfcheck passed')
