export const MAIL_SEND_ALL_PROGRAM_ID = 'all'
export const MAIL_SEND_PURPOSE = 'general'
export const MAIL_SEND_PICKER_PAGE_SIZE = 5

export type MailSendPurpose = typeof MAIL_SEND_PURPOSE
export type MailSendTiming = 'immediate' | 'scheduled'
export type MailSendParticipationType = 'participant' | 'volunteer' | 'instructor' | ''
export type MailSendRecipientSource = 'program' | 'manual'

export type MailSendProgram = {
  id: string
  name: string
  year: number
}

export type MailSendRecipient = {
  id: string
  participationType: MailSendParticipationType
  name: string
  email: string
  source: MailSendRecipientSource
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
