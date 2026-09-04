import { formatKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'
import type {
  AlimtalkSendMemberType,
  AlimtalkSendParticipationType,
  AlimtalkSendRecipient,
  AlimtalkSendRecipientTypeMode,
} from './types'
import { ALIMTALK_SEND_ALL_PROGRAM_ID } from './types'

export const ALIMTALK_SEND_PARTICIPATION_TYPE_LABEL: Record<
  Exclude<AlimtalkSendParticipationType, ''>,
  string
> = {
  participant: '참여자',
  volunteer: '봉사자',
  instructor: '강사',
}

export const ALIMTALK_SEND_MEMBER_TYPE_LABEL: Record<Exclude<AlimtalkSendMemberType, ''>, string> = {
  general: '일반',
  school_teacher: '교사',
  instructor: '강사',
  teacher_instructor: '교사 겸 강사',
  admin: '관리자',
}

/** BE query `participantType` 값 */
export const ALIMTALK_SEND_PARTICIPATION_TYPE_API: Record<
  Exclude<AlimtalkSendParticipationType, ''>,
  string
> = {
  participant: 'PARTICIPANT',
  volunteer: 'VOLUNTEER',
  instructor: 'INSTRUCTOR',
}

/** BE query `memberType` 값 (canonical) */
export const ALIMTALK_SEND_MEMBER_TYPE_API: Record<Exclude<AlimtalkSendMemberType, ''>, string> = {
  general: 'GENERAL',
  school_teacher: 'SCHOOL_TEACHER',
  instructor: 'INSTRUCTOR',
  /** BE canonical — TEACHER_INSTRUCTOR 는 alias */
  teacher_instructor: 'TEACHER_AND_INSTRUCTOR',
  admin: 'ADMIN',
}

export const ALIMTALK_SEND_PARTICIPATION_TYPE_OPTIONS = (
  Object.entries(ALIMTALK_SEND_PARTICIPATION_TYPE_LABEL) as [
    Exclude<AlimtalkSendParticipationType, ''>,
    string,
  ][]
).map(([value, label]) => ({ value, label }))

export const ALIMTALK_SEND_MEMBER_TYPE_OPTIONS = (
  Object.entries(ALIMTALK_SEND_MEMBER_TYPE_LABEL) as [
    Exclude<AlimtalkSendMemberType, ''>,
    string,
  ][]
).map(([value, label]) => ({ value, label }))

export function resolveAlimtalkSendRecipientTypeMode(
  programId: string | undefined
): AlimtalkSendRecipientTypeMode {
  if (!programId || programId === ALIMTALK_SEND_ALL_PROGRAM_ID) return 'member'
  return 'participation'
}

export function alimtalkSendRecipientTypeColumnTitle(mode: AlimtalkSendRecipientTypeMode): string {
  return mode === 'member' ? '회원 유형' : '참여 유형'
}

export function alimtalkSendParticipationTypeLabel(type: AlimtalkSendParticipationType): string {
  if (!type) return ''
  return ALIMTALK_SEND_PARTICIPATION_TYPE_LABEL[type]
}

export function alimtalkSendMemberTypeLabel(type: AlimtalkSendMemberType | undefined): string {
  if (!type) return ''
  return ALIMTALK_SEND_MEMBER_TYPE_LABEL[type]
}

/**
 * 유형 컬럼 셀 SSOT = 서버 typeLabel.
 * memberType / participantType 으로 재번역·덮어쓰기 금지.
 */
export function alimtalkSendRecipientTypeLabel(recipient: AlimtalkSendRecipient): string {
  return recipient.typeLabel?.trim() || ''
}

export function normalizeAlimtalkSendPhone(value: string): string {
  return formatKoreanPhoneNumber(value.trim())
}

export function mergeAlimtalkSendRecipients(
  current: AlimtalkSendRecipient[],
  incoming: AlimtalkSendRecipient[]
): AlimtalkSendRecipient[] {
  const next = [...current]
  const seen = new Set(current.map(item => item.id))
  for (const recipient of incoming) {
    if (seen.has(recipient.id)) continue
    seen.add(recipient.id)
    next.push(recipient)
  }
  return next
}

export function filterAlimtalkSendRecipients(
  recipients: AlimtalkSendRecipient[],
  params: {
    typeMode: AlimtalkSendRecipientTypeMode
    typeValue: string
    keyword: string
  }
): AlimtalkSendRecipient[] {
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
  return `manual-${normalizeAlimtalkSendPhone(phone).replace(/\D/g, '')}`
}

export function createManualRecipient(phone: string, name = ''): AlimtalkSendRecipient {
  const normalized = normalizeAlimtalkSendPhone(phone)
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

export function toAlimtalkSendParticipantTypeApi(
  value: string
): string | undefined {
  if (value === 'participant' || value === 'volunteer' || value === 'instructor') {
    return ALIMTALK_SEND_PARTICIPATION_TYPE_API[value]
  }
  return undefined
}

export function toAlimtalkSendMemberTypeApi(value: string): string | undefined {
  if (
    value === 'general' ||
    value === 'school_teacher' ||
    value === 'instructor' ||
    value === 'teacher_instructor' ||
    value === 'admin'
  ) {
    return ALIMTALK_SEND_MEMBER_TYPE_API[value]
  }
  return undefined
}
