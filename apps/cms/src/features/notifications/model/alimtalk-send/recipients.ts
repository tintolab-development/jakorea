import {
  formatKoreanPhoneNumber,
  isValidKoreanPhoneNumber,
} from '@jakorea/domain/shared/korean-phone'
import type {
  AlimtalkSendMemberType,
  AlimtalkSendParticipationType,
  AlimtalkSendRecipient,
  AlimtalkSendRecipientTypeMode,
} from './types'
import { parseNotificationSendProgramId } from '@/features/notifications/model/send-program-id'

/** 프로그램 선택 시 직접 입력 버튼을 숨긴 채 표시하는 운영 안내 */
export const ALIMTALK_PROGRAM_SELECTED_DIRECT_GUIDANCE =
  '프로그램을 선택한 경우 해당 프로그램의 등록 회원에게만 발송할 수 있습니다. 직접 입력한 휴대폰 번호로 발송하려면 프로그램을 선택하지 않고 진행해 주세요.'

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
  if (parseNotificationSendProgramId(programId) == null) return 'member'
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

export const ALIMTALK_DUPLICATE_PHONE_MESSAGE =
  '같은 휴대폰 번호는 1건만 발송 대상에 포함됩니다.'

export type AlimtalkPhoneDuplicateNotice = {
  kept: AlimtalkSendRecipient
  skipped: AlimtalkSendRecipient
}

function describeAlimtalkDuplicateRecipient(recipient: AlimtalkSendRecipient): string {
  const kind =
    recipient.source === 'manual' || recipient.actorType === 'DIRECT' ? '직접 입력' : '회원'
  const name = recipient.name?.trim()
  const named = name && name !== '-' ? `${kind} ${name}` : kind
  return recipient.actorId != null ? `${named} (actorId ${recipient.actorId})` : named
}

/** 하이픈 차이를 없앤 비교 키. 마스킹·미완성 번호는 중복으로 보지 않는다. */
export function alimtalkSendPhoneDedupKey(phone: string): string | null {
  if (phone.includes('*')) return null
  if (!isValidKoreanPhoneNumber(phone)) return null
  const digits = phone.replace(/\D/g, '')
  return digits || null
}

/**
 * 수신자 ID가 달라도 같은 휴대폰 번호는 먼저 들어온 1건만 남긴다.
 * 회원-회원, 회원-직접입력, 직접입력-직접입력에 같이 적용한다.
 */
export function dedupeAlimtalkSendRecipients(
  recipients: AlimtalkSendRecipient[]
): AlimtalkSendRecipient[] {
  const next: AlimtalkSendRecipient[] = []
  const seenIds = new Set<string>()
  const seenPhones = new Set<string>()
  for (const recipient of recipients) {
    if (seenIds.has(recipient.id)) continue
    const phoneKey = alimtalkSendPhoneDedupKey(recipient.phone)
    if (phoneKey && seenPhones.has(phoneKey)) continue
    seenIds.add(recipient.id)
    if (phoneKey) seenPhones.add(phoneKey)
    next.push(recipient)
  }
  return next
}

export function mergeAlimtalkSendRecipients(
  current: AlimtalkSendRecipient[],
  incoming: AlimtalkSendRecipient[]
): AlimtalkSendRecipient[] {
  return dedupeAlimtalkSendRecipients([...current, ...incoming])
}

export function countDroppedAlimtalkSendRecipients(
  current: AlimtalkSendRecipient[],
  incoming: AlimtalkSendRecipient[]
): number {
  const mergedIds = new Set(mergeAlimtalkSendRecipients(current, incoming).map(item => item.id))
  const currentIds = new Set(current.map(item => item.id))
  return incoming.filter(item => !mergedIds.has(item.id) && !currentIds.has(item.id)).length
}

/**
 * 같은 번호는 먼저 있던 수신자를 유지한다.
 * 변수값·actorId는 합치지 않는다. 마스킹 번호는 키가 없어 여기 포함되지 않는다.
 */
export function listAlimtalkPhoneDuplicateNotices(
  current: AlimtalkSendRecipient[],
  incoming: AlimtalkSendRecipient[]
): AlimtalkPhoneDuplicateNotice[] {
  const keptByPhone = new Map<string, AlimtalkSendRecipient>()
  const notices: AlimtalkPhoneDuplicateNotice[] = []
  for (const recipient of [...current, ...incoming]) {
    const phoneKey = alimtalkSendPhoneDedupKey(recipient.phone)
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

export function formatAlimtalkPhoneDuplicateMessage(
  notices: AlimtalkPhoneDuplicateNotice[]
): string {
  if (notices.length === 0) return ALIMTALK_DUPLICATE_PHONE_MESSAGE
  const lines = [
    '같은 휴대폰 번호는 1건만 발송합니다. 이미 있는 수신자를 유지하고, 새로 고른 같은 번호는 추가하지 않습니다.',
  ]
  for (const notice of notices.slice(0, 8)) {
    lines.push(
      `${notice.kept.phone}: 유지 ${describeAlimtalkDuplicateRecipient(notice.kept)} / 제외 ${describeAlimtalkDuplicateRecipient(notice.skipped)}`
    )
  }
  if (notices.length > 8) lines.push(`외 ${notices.length - 8}건`)
  return lines.join('\n')
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

export function createManualRecipient(
  phone: string,
  name = '',
  variables?: Record<string, string>
): AlimtalkSendRecipient {
  const normalized = normalizeAlimtalkSendPhone(phone)
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
