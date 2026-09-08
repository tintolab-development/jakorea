export const SMS_API_CHANNEL_TYPE = 'SMS'

/** NHN Cloud 발신 번호 관리 (기획 시안 링크 — 콘솔 프로젝트 경로는 환경에 맞게 조정) */
export const SMS_NHN_SENDER_NUMBER_CONSOLE_URL =
  'https://console.nhncloud.com/project/eSpBZ77a/notification/notification-hub' as const

/** 발신 번호 유형 (기획 4-2) */
export const SMS_SENDER_NUMBER_TYPE_OPTIONS = [
  '대표자 번호, 사업자 자체 번호',
  '임직원 번호',
  '타사 번호',
  '타인 번호',
] as const

export type SmsSenderNumberType = (typeof SMS_SENDER_NUMBER_TYPE_OPTIONS)[number]

export const SMS_MESSAGE_TYPE_OPTIONS = ['SMS', 'LMS', 'MMS'] as const

export type SmsMessageType = (typeof SMS_MESSAGE_TYPE_OPTIONS)[number]
