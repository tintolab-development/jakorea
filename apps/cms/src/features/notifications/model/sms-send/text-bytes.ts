import type { SmsMessageType } from '@/features/notifications/api/adapters/sms-channel'
import { extractNotificationPlaceholderKeys } from '@/features/notifications/model/shared/notification-placeholder-markup'

/** 국내 SMS(EUC-KR 계열) 본문 한도. UTF-8·`string.length`와 다름. */
export const SMS_BODY_BYTE_LIMIT = 90
export const LMS_MMS_BODY_BYTE_LIMIT = 2000
export const SMS_SUBJECT_BYTE_LIMIT = 40

/**
 * NHN Cloud / 국내 문자 바이트: ASCII(U+0000–U+007F) 1byte, 그 외 코드 포인트 2byte.
 * 서버·발송 화면 카운터가 이 규칙을 공유한다.
 */
export function estimateSmsTextBytes(text: string): number {
  let bytes = 0
  for (const ch of text) {
    bytes += ch.charCodeAt(0) <= 0x7f ? 1 : 2
  }
  return bytes
}

export const SMS_SEND_BODY_BYTE_LIMIT = SMS_BODY_BYTE_LIMIT
export const SMS_SEND_LMS_MMS_BODY_BYTE_LIMIT = LMS_MMS_BODY_BYTE_LIMIT
export const estimateSmsSendBodyBytes = estimateSmsTextBytes
export const estimateSmsBodyBytes = estimateSmsTextBytes

export function smsBodyByteLimit(messageType: SmsMessageType): number {
  return messageType === 'SMS' ? SMS_BODY_BYTE_LIMIT : LMS_MMS_BODY_BYTE_LIMIT
}

export const SMS_COMPOSE_ERROR = {
  smsBodyOver: '본문은 최대 90byte까지 발송할 수 있습니다.',
  lmsMmsBodyOver: '본문은 최대 2,000byte까지 발송할 수 있습니다.',
  subjectOver: '제목은 최대 40byte까지 입력할 수 있습니다.',
  smsSubjectUnsupported: 'SMS에서는 제목을 사용할 수 없습니다.',
  lmsImageUnsupported: 'LMS에서는 이미지를 첨부할 수 없습니다.',
  smsImageUnsupported: 'SMS에서는 이미지를 첨부할 수 없습니다.',
  subjectRequired: '제목을 작성하세요.',
  subjectHasVariable: '제목에는 자동입력 변수를 사용할 수 없습니다.',
  bodyRequired: '내용을 작성하세요.',
} as const

export type SmsComposeFieldIssues = {
  subjectError: string | null
  bodyError: string | null
  attachmentError: string | null
}

export function collectSmsComposeFieldIssues(input: {
  messageType: SmsMessageType
  subject: string
  bodyText: string
  attachmentCount: number
}): SmsComposeFieldIssues {
  const { messageType, subject, bodyText, attachmentCount } = input
  const subjectTrimmed = subject.trim()
  const bodyBytes = estimateSmsTextBytes(bodyText)
  const subjectBytes = estimateSmsTextBytes(subject)
  const hasSubjectPlaceholders = extractNotificationPlaceholderKeys(subject).length > 0

  let subjectError: string | null = null
  if (messageType === 'SMS') {
    if (subjectTrimmed) subjectError = SMS_COMPOSE_ERROR.smsSubjectUnsupported
  } else {
    if (!subjectTrimmed) subjectError = SMS_COMPOSE_ERROR.subjectRequired
    else if (hasSubjectPlaceholders) subjectError = SMS_COMPOSE_ERROR.subjectHasVariable
    else if (subjectBytes > SMS_SUBJECT_BYTE_LIMIT) subjectError = SMS_COMPOSE_ERROR.subjectOver
  }

  let bodyError: string | null = null
  if (!bodyText.trim()) bodyError = SMS_COMPOSE_ERROR.bodyRequired
  else if (messageType === 'SMS' && bodyBytes > SMS_BODY_BYTE_LIMIT) {
    bodyError = SMS_COMPOSE_ERROR.smsBodyOver
  } else if (messageType !== 'SMS' && bodyBytes > LMS_MMS_BODY_BYTE_LIMIT) {
    bodyError = SMS_COMPOSE_ERROR.lmsMmsBodyOver
  }

  let attachmentError: string | null = null
  if (attachmentCount > 0 && messageType === 'LMS') {
    attachmentError = SMS_COMPOSE_ERROR.lmsImageUnsupported
  } else if (attachmentCount > 0 && messageType === 'SMS') {
    attachmentError = SMS_COMPOSE_ERROR.smsImageUnsupported
  }

  return { subjectError, bodyError, attachmentError }
}

export function smsComposeBlocksSend(issues: SmsComposeFieldIssues): boolean {
  return Boolean(issues.subjectError || issues.bodyError || issues.attachmentError)
}

/** 필드 빨간 테두리는 바이트 한도 초과만. 인풋 하단 문구는 쓰지 않는다. */
export function smsComposeInlineMessage(error: string | null): string | undefined {
  if (
    error === SMS_COMPOSE_ERROR.smsBodyOver ||
    error === SMS_COMPOSE_ERROR.lmsMmsBodyOver ||
    error === SMS_COMPOSE_ERROR.subjectOver
  ) {
    return error
  }
  return undefined
}

export function firstSmsComposeIssueMessage(issues: SmsComposeFieldIssues): string | null {
  return issues.subjectError ?? issues.bodyError ?? issues.attachmentError
}
