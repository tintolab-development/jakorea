import { formatKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'
import { alimtalkSendPhoneDedupKey } from '@/features/notifications/model/alimtalk-send/recipients'
import type {
  SmsSendMemberType,
  SmsSendParticipationType,
  SmsSendRecipient,
  SmsSendRecipientTypeMode,
} from './types'
import { parseNotificationSendProgramId } from '@/features/notifications/model/send-program-id'

export const SMS_SEND_PARTICIPATION_TYPE_LABEL: Record<
  Exclude<SmsSendParticipationType, ''>,
  string
> = {
  participant: '참여자',
  volunteer: '봉사자',
  instructor: '강사',
}

export const SMS_SEND_MEMBER_TYPE_LABEL: Record<Exclude<SmsSendMemberType, ''>, string> = {
  general: '일반',
  school_teacher: '교사',
  instructor: '강사',
  teacher_instructor: '교사 겸 강사',
  admin: '관리자',
}

export const SMS_SEND_PARTICIPATION_TYPE_API: Record<
  Exclude<SmsSendParticipationType, ''>,
  string
> = {
  participant: 'PARTICIPANT',
  volunteer: 'VOLUNTEER',
  instructor: 'INSTRUCTOR',
}

export const SMS_SEND_MEMBER_TYPE_API: Record<Exclude<SmsSendMemberType, ''>, string> = {
  general: 'GENERAL',
  school_teacher: 'SCHOOL_TEACHER',
  instructor: 'INSTRUCTOR',
  teacher_instructor: 'TEACHER_AND_INSTRUCTOR',
  admin: 'ADMIN',
}

export const SMS_SEND_PARTICIPATION_TYPE_OPTIONS = (
  Object.entries(SMS_SEND_PARTICIPATION_TYPE_LABEL) as [
    Exclude<SmsSendParticipationType, ''>,
    string,
  ][]
).map(([value, label]) => ({ value, label }))

export const SMS_SEND_MEMBER_TYPE_OPTIONS = (
  Object.entries(SMS_SEND_MEMBER_TYPE_LABEL) as [Exclude<SmsSendMemberType, ''>, string][]
).map(([value, label]) => ({ value, label }))

export function resolveSmsSendRecipientTypeMode(
  programId: string | undefined
): SmsSendRecipientTypeMode {
  if (parseNotificationSendProgramId(programId) == null) return 'member'
  return 'participation'
}

export function smsSendRecipientTypeColumnTitle(mode: SmsSendRecipientTypeMode): string {
  return mode === 'member' ? '회원 유형' : '참여 유형'
}

export function smsSendRecipientTypeLabel(
  recipient: SmsSendRecipient,
  mode: SmsSendRecipientTypeMode = 'member'
): string {
  if (mode === 'participation') {
    if (recipient.participationType) {
      return SMS_SEND_PARTICIPATION_TYPE_LABEL[recipient.participationType]
    }
  } else if (recipient.memberType) {
    return SMS_SEND_MEMBER_TYPE_LABEL[recipient.memberType]
  }
  return recipient.typeLabel?.trim() || ''
}

export function normalizeSmsSendPhone(value: string): string {
  const trimmed = value.trim()
  if (!trimmed || trimmed === '-') return trimmed
  if (trimmed.includes('*')) return trimmed
  return formatKoreanPhoneNumber(trimmed) || trimmed
}

/** 알림톡과 같은 휴대폰 비교 키. 마스킹·미완성 번호는 중복으로 보지 않는다. */
export function smsSendPhoneDedupKey(phone: string): string | null {
  return alimtalkSendPhoneDedupKey(phone)
}

export const SMS_DUPLICATE_PHONE_MESSAGE = '같은 휴대폰 번호는 1건만 발송 대상에 포함됩니다.'

export type SmsPhoneDuplicateNotice = {
  kept: SmsSendRecipient
  skipped: SmsSendRecipient
}

function describeSmsDuplicateRecipient(recipient: SmsSendRecipient): string {
  const kind =
    recipient.source === 'manual' || recipient.actorType === 'DIRECT' ? '직접 입력' : '회원'
  const name = recipient.name?.trim()
  const named = name && name !== '-' ? `${kind} ${name}` : kind
  return recipient.actorId != null ? `${named} (actorId ${recipient.actorId})` : named
}

/**
 * 수신자 ID가 달라도 같은 휴대폰 번호는 먼저 들어온 1건만 남긴다.
 * actorId·변수값은 합치지 않는다.
 */
export function dedupeSmsSendRecipients(recipients: SmsSendRecipient[]): SmsSendRecipient[] {
  const next: SmsSendRecipient[] = []
  const seenIds = new Set<string>()
  const seenPhones = new Set<string>()
  for (const recipient of recipients) {
    if (seenIds.has(recipient.id)) continue
    const phoneKey = smsSendPhoneDedupKey(recipient.phone)
    if (phoneKey && seenPhones.has(phoneKey)) continue
    seenIds.add(recipient.id)
    if (phoneKey) seenPhones.add(phoneKey)
    next.push(recipient)
  }
  return next
}

export function mergeSmsSendRecipients(
  current: SmsSendRecipient[],
  incoming: SmsSendRecipient[]
): SmsSendRecipient[] {
  return dedupeSmsSendRecipients([...current, ...incoming])
}

/** 같은 번호는 먼저 있던 수신자를 유지한다. 변수값·actorId는 합치지 않는다. */
export function listSmsPhoneDuplicateNotices(
  current: SmsSendRecipient[],
  incoming: SmsSendRecipient[]
): SmsPhoneDuplicateNotice[] {
  const keptByPhone = new Map<string, SmsSendRecipient>()
  const notices: SmsPhoneDuplicateNotice[] = []
  for (const recipient of [...current, ...incoming]) {
    const phoneKey = smsSendPhoneDedupKey(recipient.phone)
    if (!phoneKey) continue
    const kept = keptByPhone.get(phoneKey)
    if (!kept) {
      keptByPhone.set(phoneKey, recipient)
      continue
    }
    if (kept.id === recipient.id) continue
    notices.push({ kept, skipped: recipient })
  }
  return notices
}

export function formatSmsPhoneDuplicateMessage(notices: SmsPhoneDuplicateNotice[]): string {
  if (notices.length === 0) return SMS_DUPLICATE_PHONE_MESSAGE
  const lines = [
    '같은 휴대폰 번호는 1건만 발송합니다. 이미 있는 수신자를 유지하고, 새로 고른 같은 번호는 추가하지 않습니다.',
  ]
  for (const notice of notices.slice(0, 8)) {
    lines.push(
      `${notice.kept.phone}: 유지 ${describeSmsDuplicateRecipient(notice.kept)} / 제외 ${describeSmsDuplicateRecipient(notice.skipped)}`
    )
  }
  if (notices.length > 8) lines.push(`외 ${notices.length - 8}건`)
  return lines.join('\n')
}

export function filterSmsSendRecipients(
  recipients: SmsSendRecipient[],
  params: {
    typeMode: SmsSendRecipientTypeMode
    typeValue: string
    keyword: string
  }
): SmsSendRecipient[] {
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
      recipient.phone.replace(/\D/g, '').includes(needle.replace(/\D/g, ''))
    )
  })
}

export function manualRecipientId(phone: string): string {
  return `manual-${normalizeSmsSendPhone(phone).replace(/\D/g, '')}`
}

export function createManualRecipient(
  phone: string,
  name = '',
  variables?: Record<string, string>
): SmsSendRecipient {
  const normalized = normalizeSmsSendPhone(phone)
  return {
    id: manualRecipientId(normalized),
    participationType: '',
    memberType: '',
    name: name.trim(),
    phone: normalized,
    source: 'manual',
    actorType: 'DIRECT',
    ...(variables ? { variables: { ...variables } } : {}),
  }
}

export function toSmsSendParticipantTypeApi(value: string): string | undefined {
  if (value === 'participant' || value === 'volunteer' || value === 'instructor') {
    return SMS_SEND_PARTICIPATION_TYPE_API[value]
  }
  return undefined
}

export function toSmsSendMemberTypeApi(value: string): string | undefined {
  if (
    value === 'general' ||
    value === 'school_teacher' ||
    value === 'instructor' ||
    value === 'teacher_instructor' ||
    value === 'admin'
  ) {
    return SMS_SEND_MEMBER_TYPE_API[value]
  }
  return undefined
}
