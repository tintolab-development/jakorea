export type PaymentOrderRejectNotificationType = 'IMMEDIATE' | 'ON_ANNOUNCEMENT' | 'MANUAL'

export type PaymentOrderRejectSubmitPayload = {
  reason: string
  notificationType: PaymentOrderRejectNotificationType
  scheduledNotificationAt?: string
}
