export const MAIL_SEND_ALL_PROGRAM_ID = 'all'
export const MAIL_SEND_PURPOSE = 'general'
export const MAIL_SEND_PICKER_PAGE_SIZE = 5
export const MAIL_SEND_DEFAULT_PROGRAM_ID = ''
export const MAIL_SEND_DEFAULT_SENDER = {
  name: '',
  email: '',
} as const

export type MailSendPurpose = typeof MAIL_SEND_PURPOSE
export type MailSendTiming = 'immediate' | 'scheduled'
export type MailSendParticipationType = 'participant' | 'volunteer' | 'instructor' | ''
export type MailSendMemberType =
  | 'general'
  | 'school_teacher'
  | 'instructor'
  | 'teacher_instructor'
  | 'admin'
  | ''
export type MailSendRecipientTypeMode = 'participation' | 'member'
export type MailSendRecipientSource = 'program' | 'manual'

export type MailSendProgram = {
  id: string
  name: string
  year: number
}

export type MailSendRecipient = {
  id: string
  participationType: MailSendParticipationType
  memberType?: MailSendMemberType
  /** BE typeLabel 우선 표시 */
  typeLabel?: string
  name: string
  email: string
  source: MailSendRecipientSource
  actorType?: string
  actorId?: number
}

export type MailSendRecipientSearchParams = {
  typeValue: string
  keyword: string
  page: number
}

export type MailSendDraft = {
  programId: string
  templateId?: string
  purpose: MailSendPurpose
  useTemplate: boolean
  senderName: string
  senderEmail: string
  sendTiming: MailSendTiming
  scheduledAt: string | null
  subject: string
  bodyHtml: string
  attachmentFileNames: string[]
  recipients: MailSendRecipient[]
}

export type MailSendPayload = MailSendDraft
