import type { RecipientCandidateResponse } from '@/shared/api/generated/notifications/schemas'
import type { MailSendParticipationType, MailSendRecipient } from '@/features/notifications/model/mail-send/types'

function mapParticipationType(
  candidate: RecipientCandidateResponse
): MailSendParticipationType {
  const raw = (candidate.participantType || '').trim().toUpperCase()
  if (!raw) return ''
  if (raw === 'PARTICIPANT' || raw.includes('PARTICIPANT') || raw.includes('참여')) {
    return 'participant'
  }
  if (raw === 'VOLUNTEER' || raw.includes('VOLUNTEER') || raw.includes('봉사')) {
    return 'volunteer'
  }
  if (raw === 'INSTRUCTOR' || raw.includes('INSTRUCTOR') || raw.includes('강사')) {
    return 'instructor'
  }
  return ''
}

function resolveTypeLabel(candidate: RecipientCandidateResponse): string | undefined {
  const fromBackend = candidate.typeLabel?.trim()
  return fromBackend || undefined
}

export function mapMailRecipientCandidate(
  candidate: RecipientCandidateResponse
): MailSendRecipient | null {
  const memberId = candidate.memberId
  const actorType = (candidate.actorType || 'MEMBER').trim() || 'MEMBER'
  if (memberId == null && actorType !== 'DIRECT') return null

  const id =
    memberId != null
      ? `actor-${actorType}-${memberId}`
      : `contact-${candidate.recipientContactMasked ?? Math.random()}`

  return {
    id,
    participationType: mapParticipationType(candidate),
    typeLabel: resolveTypeLabel(candidate),
    name: candidate.recipientNameMasked?.trim() || '-',
    email: candidate.recipientContactMasked?.trim() || '-',
    source: 'program',
    actorType,
    actorId: memberId ?? undefined,
  }
}

export function mapMailRecipientCandidates(
  items: RecipientCandidateResponse[] | undefined
): MailSendRecipient[] {
  return (items ?? [])
    .map(mapMailRecipientCandidate)
    .filter((row): row is MailSendRecipient => row != null)
}
