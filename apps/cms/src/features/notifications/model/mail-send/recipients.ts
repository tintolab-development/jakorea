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

/**
 * 대소문자를 없앤 이메일 비교 키.
 * 공란·형식 오류·마스킹 주소는 중복으로 보지 않는다.
 */
export function mailSendEmailDedupKey(email: string): string | null {
  const trimmed = email.trim()
  if (!trimmed || trimmed.includes('*')) return null
  if (!isMailSendEmail(trimmed)) return null
  return trimmed.toLowerCase()
}

export const MAIL_DUPLICATE_EMAIL_MESSAGE = '같은 이메일 주소는 1건만 발송 대상에 포함됩니다.'

export type MailEmailDuplicateNotice = {
  kept: MailSendRecipient
  skipped: MailSendRecipient
}

function describeMailDuplicateRecipient(recipient: MailSendRecipient): string {
  const kind =
    recipient.source === 'manual' || recipient.actorType === 'DIRECT' ? '직접 입력' : '회원'
  const name = recipient.name?.trim()
  const named = name && name !== '-' ? `${kind} ${name}` : kind
  return recipient.actorId != null ? `${named} (actorId ${recipient.actorId})` : named
}

/**
 * 수신자 ID가 달라도 같은 이메일 주소는 먼저 들어온 1건만 남긴다.
 * actorId·변수값은 합치지 않는다.
 */
export function dedupeMailSendRecipients(recipients: MailSendRecipient[]): MailSendRecipient[] {
  const next: MailSendRecipient[] = []
  const seenIds = new Set<string>()
  const seenEmails = new Set<string>()
  for (const recipient of recipients) {
    if (seenIds.has(recipient.id)) continue
    const emailKey = mailSendEmailDedupKey(recipient.email)
    if (emailKey && seenEmails.has(emailKey)) continue
    seenIds.add(recipient.id)
    if (emailKey) seenEmails.add(emailKey)
    next.push(recipient)
  }
  return next
}

export function mergeMailSendRecipients(
  current: MailSendRecipient[],
  incoming: MailSendRecipient[]
): MailSendRecipient[] {
  return dedupeMailSendRecipients([...current, ...incoming])
}

/** 같은 주소는 먼저 있던 수신자를 유지한다. 변수값·actorId는 합치지 않는다. */
export function listMailEmailDuplicateNotices(
  current: MailSendRecipient[],
  incoming: MailSendRecipient[]
): MailEmailDuplicateNotice[] {
  const keptByEmail = new Map<string, MailSendRecipient>()
  const notices: MailEmailDuplicateNotice[] = []
  for (const recipient of [...current, ...incoming]) {
    const emailKey = mailSendEmailDedupKey(recipient.email)
    if (!emailKey) continue
    const kept = keptByEmail.get(emailKey)
    if (!kept) {
      keptByEmail.set(emailKey, recipient)
      continue
    }
    if (kept.id === recipient.id) continue
    notices.push({ kept, skipped: recipient })
  }
  return notices
}

export function formatMailEmailDuplicateMessage(notices: MailEmailDuplicateNotice[]): string {
  if (notices.length === 0) return MAIL_DUPLICATE_EMAIL_MESSAGE
  const lines = [
    '같은 이메일 주소는 1건만 발송합니다. 이미 있는 수신자를 유지하고, 새로 고른 같은 주소는 추가하지 않습니다.',
  ]
  for (const notice of notices.slice(0, 8)) {
    lines.push(
      `${notice.kept.email}: 유지 ${describeMailDuplicateRecipient(notice.kept)} / 제외 ${describeMailDuplicateRecipient(notice.skipped)}`
    )
  }
  if (notices.length > 8) lines.push(`외 ${notices.length - 8}건`)
  return lines.join('\n')
}

/**
 * 직접 입력 팝업 결과 반영.
 * 팝업에서 지운 행은 발송 목록에 남긴다.
 * 같은 주소의 기존 직접 입력 행은 변수값만 갱신하고, 회원 행의 actorId·변수값은 유지한다.
 */
export function applyMailManualEntries(
  current: MailSendRecipient[],
  entries: Array<{ contact: string; variables?: Record<string, string> }>
): MailSendRecipient[] {
  const incoming = entries.map(entry => createManualRecipient(entry.contact, entry.variables))
  const incomingByKey = new Map<string, MailSendRecipient>()
  for (const item of incoming) {
    const key = mailSendEmailDedupKey(item.email)
    if (!key || incomingByKey.has(key)) continue
    incomingByKey.set(key, item)
  }
  const updated = current.map(item => {
    if (item.source !== 'manual' && item.actorType !== 'DIRECT') return item
    const key = mailSendEmailDedupKey(item.email)
    if (!key) return item
    const edited = incomingByKey.get(key)
    if (!edited?.variables) return item
    return { ...item, variables: { ...edited.variables } }
  })
  return dedupeMailSendRecipients([...updated, ...incoming])
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

export function createManualRecipient(
  email: string,
  variables?: Record<string, string>
): MailSendRecipient {
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
    ...(variables ? { variables: { ...variables } } : {}),
  }
}
