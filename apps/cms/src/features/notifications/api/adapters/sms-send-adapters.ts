import type { RecipientCandidateResponse } from '@/shared/api/generated/notifications/schemas'
import type {
  SmsSendMemberType,
  SmsSendParticipationType,
  SmsSendRecipient,
} from '@/features/notifications/model/sms-send/types'

function mapParticipationType(candidate: RecipientCandidateResponse): SmsSendParticipationType {
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

function mapMemberType(candidate: RecipientCandidateResponse): SmsSendMemberType {
  const raw = (candidate.memberType || '').trim().toUpperCase()
  if (!raw) return ''
  if (
    raw === 'TEACHER_AND_INSTRUCTOR' ||
    raw === 'TEACHER_INSTRUCTOR' ||
    raw.includes('INSTRUCTOR_DUAL') ||
    raw === 'DUAL'
  ) {
    return 'teacher_instructor'
  }
  if (raw.includes('SCHOOL_TEACHER') || raw === 'TEACHER' || raw.includes('교사')) {
    if (raw.includes('INSTRUCTOR') || raw.includes('강사')) return 'teacher_instructor'
    return 'school_teacher'
  }
  if (raw.includes('ADMIN') || raw.includes('관리자')) return 'admin'
  if (raw.includes('INSTRUCTOR') || (raw.includes('강사') && !raw.includes('교사'))) {
    return 'instructor'
  }
  if (raw.includes('GENERAL') || raw.includes('일반')) return 'general'
  return ''
}

function resolveTypeLabel(candidate: RecipientCandidateResponse): string | undefined {
  const fromBackend = candidate.typeLabel?.trim()
  if (fromBackend) return fromBackend
  return undefined
}

export function mapSmsRecipientCandidate(
  candidate: RecipientCandidateResponse
): SmsSendRecipient | null {
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
    memberType: mapMemberType(candidate),
    typeLabel: resolveTypeLabel(candidate),
    name: candidate.recipientNameMasked?.trim() || '-',
    phone: candidate.recipientContactMasked?.trim() || '-',
    source: 'program',
    actorType,
    actorId: memberId ?? undefined,
  }
}

export function mapSmsRecipientCandidates(
  items: RecipientCandidateResponse[] | undefined
): SmsSendRecipient[] {
  return (items ?? [])
    .map(mapSmsRecipientCandidate)
    .filter((item): item is SmsSendRecipient => item != null)
}
