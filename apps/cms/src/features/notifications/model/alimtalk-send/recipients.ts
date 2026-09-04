import { formatKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'
import type { AlimtalkSendParticipationType, AlimtalkSendRecipient } from './types'

export const ALIMTALK_SEND_PARTICIPATION_TYPE_LABEL: Record<
  Exclude<AlimtalkSendParticipationType, ''>,
  string
> = {
  participant: '참여자',
  volunteer: '봉사자',
  instructor: '강사',
}

export const ALIMTALK_SEND_PARTICIPATION_TYPE_OPTIONS = (
  Object.entries(ALIMTALK_SEND_PARTICIPATION_TYPE_LABEL) as [
    Exclude<AlimtalkSendParticipationType, ''>,
    string,
  ][]
).map(([value, label]) => ({ value, label }))

export function alimtalkSendParticipationTypeLabel(type: AlimtalkSendParticipationType): string {
  if (!type) return ''
  return ALIMTALK_SEND_PARTICIPATION_TYPE_LABEL[type]
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
  params: { participationType: AlimtalkSendParticipationType | ''; keyword: string }
): AlimtalkSendRecipient[] {
  const needle = params.keyword.trim().toLowerCase()
  return recipients.filter(recipient => {
    if (params.participationType && recipient.participationType !== params.participationType) {
      return false
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
    name: name.trim(),
    phone: normalized,
    source: 'manual',
    actorType: 'DIRECT',
  }
}
