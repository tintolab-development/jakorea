/** 알림톡·메일·문자 수동 발송 API 성공 후 공통 안내 */
export const NOTIFICATION_SEND_REQUEST_COMPLETED_TITLE = '발송 요청 완료'

export const NOTIFICATION_SEND_REQUEST_COMPLETED_MESSAGE =
  '발송 요청이 정상적으로 접수되었습니다.\n실제 발송 결과(성공/실패)는 발송 이력에서 확인해 주세요.'

export type NotificationSendHistoryChannel = 'alimtalk' | 'mail' | 'sms'

export const NOTIFICATION_SEND_HISTORY_PATH: Record<NotificationSendHistoryChannel, string> = {
  alimtalk: '/admin/notifications/kakao-alimtalk',
  mail: '/admin/notifications/mail',
  sms: '/admin/notifications/sms',
}

export const NOTIFICATION_SEND_HISTORY_TAB_PARAM = 'send-history'
