import { formatKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'
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

export function smsSendRecipientTypeLabel(recipient: SmsSendRecipient): string {
  return recipient.typeLabel?.trim() || ''
}

export function normalizeSmsSendPhone(value: string): string {
  return formatKoreanPhoneNumber(value.trim())
}

export function mergeSmsSendRecipients(
  current: SmsSendRecipient[],
  incoming: SmsSendRecipient[]
): SmsSendRecipient[] {
  const next = [...current]
  const seen = new Set(current.map(item => item.id))
  for (const recipient of incoming) {
    if (seen.has(recipient.id)) continue
    seen.add(recipient.id)
    next.push(recipient)
  }
  return next
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

export function createManualRecipient(phone: string, name = ''): SmsSendRecipient {
  const normalized = normalizeSmsSendPhone(phone)
  return {
    id: manualRecipientId(normalized),
    participationType: '',
    memberType: '',
    name: name.trim(),
    phone: normalized,
    source: 'manual',
    actorType: 'DIRECT',
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
