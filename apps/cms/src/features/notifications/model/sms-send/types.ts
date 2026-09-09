import type { SmsMessageType } from '@/features/notifications/api/adapters/sms-channel'

export const SMS_SEND_ALL_PROGRAM_ID = 'all'
export const SMS_SEND_PICKER_PAGE_SIZE = 50
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
  attachmentFileNames: string[]
  sendTiming: SmsSendTiming
  scheduledAt: string | null
  recipients: SmsSendRecipient[]
}
