import type {
  MailSendMemberType,
  MailSendParticipationType,
  MailSendRecipient,
  MailSendRecipientTypeMode,
} from './types'
import { parseNotificationSendProgramId } from '@/features/notifications/model/send-program-id'

export const MAIL_SEND_PARTICIPATION_TYPE_LABEL: Record<
  Exclude<MailSendParticipationType, ''>,
  string
> = {
  participant: '참여자',
  volunteer: '봉사자',
  instructor: '강사',
}

export const MAIL_SEND_MEMBER_TYPE_LABEL: Record<Exclude<MailSendMemberType, ''>, string> = {
  general: '일반',
  school_teacher: '교사',
  instructor: '강사',
  teacher_instructor: '교사 겸 강사',
  admin: '관리자',
}

export const MAIL_SEND_PARTICIPATION_TYPE_OPTIONS = (
  Object.entries(MAIL_SEND_PARTICIPATION_TYPE_LABEL) as [
    Exclude<MailSendParticipationType, ''>,
    string,
  ][]
).map(([value, label]) => ({ value, label }))

export const MAIL_SEND_MEMBER_TYPE_OPTIONS = (
  Object.entries(MAIL_SEND_MEMBER_TYPE_LABEL) as [Exclude<MailSendMemberType, ''>, string][]
).map(([value, label]) => ({ value, label }))

export function mailSendParticipationTypeLabel(type: MailSendParticipationType): string {
  if (!type) return ''
  return MAIL_SEND_PARTICIPATION_TYPE_LABEL[type]
}

export const MAIL_SEND_PARTICIPATION_TYPE_API: Record<
  Exclude<MailSendParticipationType, ''>,
  string
> = {
  participant: 'PARTICIPANT',
  volunteer: 'VOLUNTEER',
  instructor: 'INSTRUCTOR',
}

export const MAIL_SEND_MEMBER_TYPE_API: Record<Exclude<MailSendMemberType, ''>, string> = {
  general: 'GENERAL',
  school_teacher: 'SCHOOL_TEACHER',
  instructor: 'INSTRUCTOR',
  teacher_instructor: 'TEACHER_AND_INSTRUCTOR',
  admin: 'ADMIN',
}

export function resolveMailSendRecipientTypeMode(
  programId: string | undefined
): MailSendRecipientTypeMode {
  if (parseNotificationSendProgramId(programId) == null) return 'member'
  return 'participation'
}

export function mailSendRecipientTypeColumnTitle(mode: MailSendRecipientTypeMode): string {
  return mode === 'member' ? '회원 유형' : '참여 유형'
}

export function mailSendRecipientTypeLabel(recipient: MailSendRecipient): string {
  return recipient.typeLabel?.trim() || ''
}

export function toMailSendParticipantTypeApi(type: string): string | undefined {
  if (type === 'participant' || type === 'volunteer' || type === 'instructor') {
    return MAIL_SEND_PARTICIPATION_TYPE_API[type]
  }
  return undefined
}

export function toMailSendMemberTypeApi(value: string): string | undefined {
  if (
    value === 'general' ||
    value === 'school_teacher' ||
    value === 'instructor' ||
    value === 'teacher_instructor' ||
    value === 'admin'
  ) {
    return MAIL_SEND_MEMBER_TYPE_API[value]
  }
  return undefined
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
  params: {
    typeMode: MailSendRecipientTypeMode
    typeValue: string
    keyword: string
  }
): MailSendRecipient[] {
  const needle = params.keyword.trim().toLowerCase()
  return recipients.filter(recipient => {
    if (params.typeValue) {
      if (params.typeMode === 'member') {
        if (recipient.memberType !== params.typeValue) return false
      } else if (recipient.participationType !== params.typeValue) {
        return false
      }
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
    memberType: '',
    typeLabel: '',
    name: '',
    email: normalized,
    source: 'manual',
    actorType: 'DIRECT',
  }
}
