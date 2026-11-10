import type { SmsMessageType } from '@/features/notifications/api/adapters/sms-channel'

const SMS_MESSAGE_TYPE_CODES: readonly SmsMessageType[] = ['SMS', 'LMS', 'MMS']

/** 화면 표시용 발송 유형 — 시안은 「단문/장문」이 아니라 코드(SMS·LMS·MMS)를 그대로 쓴다. */
export function formatSmsMessageTypeCode(value: string | null | undefined): string {
  const code = value?.trim().toUpperCase()
  if (!code) return '-'
  return (SMS_MESSAGE_TYPE_CODES as readonly string[]).includes(code) ? code : '-'
}

/** 작성 화면 발송 유형 — 시안: 처음에는 아무것도 선택되지 않는다. */
export type SmsComposeMessageType = SmsMessageType | ''

export const SMS_MESSAGE_TYPE_REQUIRED_MESSAGE = '발송 유형을 선택해 주세요.'
