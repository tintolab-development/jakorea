import type { MailSendParticipationType, MailSendRecipient } from './types'

export const MAIL_SEND_PARTICIPATION_TYPE_LABEL: Record<
  Exclude<MailSendParticipationType, ''>,
  string
> = {
  participant: '참여자',
  volunteer: '봉사자',
  instructor: '강사',
}

export const MAIL_SEND_PARTICIPATION_TYPE_OPTIONS = (
  Object.entries(MAIL_SEND_PARTICIPATION_TYPE_LABEL) as [
    Exclude<MailSendParticipationType, ''>,
    string,
  ][]
).map(([value, label]) => ({ value, label }))

export function mailSendParticipationTypeLabel(type: MailSendParticipationType): string {
  if (!type) return ''
  return MAIL_SEND_PARTICIPATION_TYPE_LABEL[type]
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isMailSendEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim())
}

export function normalizeMailSendEmail(value: string): string {
  return value.trim()
}

export function mergeMailSendRecipients(
  current: MailSendRecipient[],
  incoming: MailSendRecipient[]
): MailSendRecipient[] {
  const next = [...current]
  const seen = new Set(current.map(item => item.id))
  for (const recipient of incoming) {
    if (seen.has(recipient.id)) continue
    seen.add(recipient.id)
    next.push(recipient)
  }
  return next
}

export function filterMailSendRecipients(
  recipients: MailSendRecipient[],
  params: { participationType: MailSendParticipationType | ''; keyword: string }
): MailSendRecipient[] {
  const needle = params.keyword.trim().toLowerCase()
  return recipients.filter(recipient => {
    if (params.participationType && recipient.participationType !== params.participationType) {
      return false
    }
    if (!needle) return true
    return (
      recipient.name.toLowerCase().includes(needle) ||
      recipient.email.toLowerCase().includes(needle)
    )
  })
}

export function manualRecipientId(email: string): string {
  return `manual-${normalizeMailSendEmail(email).toLowerCase()}`
}

export function createManualRecipient(email: string): MailSendRecipient {
  const normalized = normalizeMailSendEmail(email)
  return {
    id: manualRecipientId(normalized),
    participationType: '',
    name: '',
    email: normalized,
    source: 'manual',
  }
}
