import type { SmsMessageType } from '@/features/notifications/api/adapters/sms-channel'

export const SMS_SEND_ALL_PROGRAM_ID = 'all'
export const SMS_SEND_PICKER_PAGE_SIZE = 5
export const SMS_SEND_DEFAULT_PROGRAM_ID = ''

export type SmsSendTiming = 'immediate' | 'scheduled'
export type SmsSendRecipientSource = 'program' | 'manual'
export type SmsSendParticipationType = 'participant' | 'volunteer' | 'instructor' | ''
export type SmsSendMemberType =
  | 'general'
  | 'school_teacher'
  | 'instructor'
  | 'teacher_instructor'
  | 'admin'
  | ''
export type SmsSendRecipientTypeMode = 'member' | 'participation'

export type SmsSendProgram = {
  id: string
  name: string
  year: number
}

export type SmsSendRecipient = {
  id: string
  participationType: SmsSendParticipationType
  memberType?: SmsSendMemberType
  typeLabel?: string
  name: string
  phone: string
  source: SmsSendRecipientSource
  actorType?: string
  actorId?: number
  /**
   * 수신자별 수동 변수.
   * SYSTEM·서버 예약 키는 발송 요청에 넣지 않는다.
   */
  variables?: Record<string, string>
}

export type SmsSendRecipientSearchParams = {
  typeValue: string
  keyword: string
  page: number
}

export type SmsSendDraft = {
  programId: string
  templateId?: string
  senderPhone: string
  messageType: SmsMessageType
  subject: string
  bodyText: string
  /** 화면 표시용 첨부 파일명(요청 첨부가 있으면 요청 첨부, 없으면 템플릿 첨부) */
  attachmentFileNames: string[]
  /**
   * 발송 요청 첨부 fileObjectId (선택 순서, CLEAN·AVAILABLE 확인 완료분만).
   * MMS일 때만 `attachmentFileIds`로 전송. 템플릿 MMS에서 비어 있으면 템플릿 첨부가 발송된다.
   */
  attachmentFileIds?: number[]
  /** 업로드·보안 검사 중인 요청 첨부가 있으면 true — 발송 차단 */
  attachmentUploadPending?: boolean
  sendTiming: SmsSendTiming
  scheduledAt: string | null
  recipients: SmsSendRecipient[]
}
