import type {
  CatalogResponse,
  CatalogVariableItem,
  CreateRequest,
  RecipientCandidateResponse,
  RecipientRequest,
} from '@/shared/api/generated/notifications/schemas'
import type { AlimtalkSendRecipient } from '@/features/notifications/model/alimtalk-send/types'
import type { AlimtalkSendParticipationType } from '@/features/notifications/model/alimtalk-send/types'

export type AlimtalkTemplateVariable = {
  key: string
  token: string
  description: string
  requiresProgram: boolean
  categoryCode?: string
  categoryLabel?: string
}

function mapParticipationType(
  candidate: RecipientCandidateResponse
): AlimtalkSendParticipationType {
  const raw = (
    candidate.participantType ||
    candidate.memberType ||
    candidate.actorType ||
    ''
  )
    .trim()
    .toUpperCase()
  if (raw.includes('INSTRUCTOR') || raw.includes('강사')) return 'instructor'
  if (raw.includes('VOLUNTEER') || raw.includes('봉사')) return 'volunteer'
  if (raw.includes('PARTICIPANT') || raw.includes('참여')) return 'participant'
  return 'participant'
}

export function mapRecipientCandidate(
  candidate: RecipientCandidateResponse
): AlimtalkSendRecipient | null {
  const actorId = candidate.memberId ?? candidate.participantId
  const actorType = (candidate.actorType || 'MEMBER').trim() || 'MEMBER'
  if (actorId == null && actorType !== 'DIRECT') return null

  const id =
    actorId != null
      ? `actor-${actorType}-${actorId}`
      : `contact-${candidate.recipientContactMasked ?? Math.random()}`

  return {
    id,
    participationType: mapParticipationType(candidate),
    name: candidate.recipientNameMasked?.trim() || candidate.typeLabel?.trim() || '-',
    phone: candidate.recipientContactMasked?.trim() || '-',
    source: 'program',
    actorType,
    actorId: actorId ?? undefined,
  }
}

export function mapRecipientCandidates(
  items: RecipientCandidateResponse[] | undefined
): AlimtalkSendRecipient[] {
  return (items ?? [])
    .map(mapRecipientCandidate)
    .filter((item): item is AlimtalkSendRecipient => item != null)
}

export function mapTemplateVariablesCatalog(
  catalog: CatalogResponse | null | undefined
): AlimtalkTemplateVariable[] {
  const result: AlimtalkTemplateVariable[] = []
  for (const category of catalog?.categories ?? []) {
    for (const variable of category.variables ?? []) {
      const mapped = mapCatalogVariable(variable, category.categoryCode, category.categoryLabel)
      if (mapped) result.push(mapped)
    }
  }
  return result
}

function mapCatalogVariable(
  variable: CatalogVariableItem,
  categoryCode?: string,
  categoryLabel?: string
): AlimtalkTemplateVariable | null {
  const key = variable.key?.trim()
  if (!key) return null
  return {
    key,
    token: variable.token?.trim() || `#{${key}}`,
    description: variable.description?.trim() || key,
    requiresProgram: variable.requiresProgram === true,
    categoryCode,
    categoryLabel,
  }
}

export function buildSendBatchRecipients(
  recipients: AlimtalkSendRecipient[]
): RecipientRequest[] {
  return recipients.map(recipient => {
    if (recipient.source === 'manual' || recipient.actorType === 'DIRECT') {
      return {
        actorType: 'DIRECT',
        recipientContact: recipient.phone.replace(/\D/g, '') || recipient.phone,
        recipientName: recipient.name.trim() || undefined,
      }
    }
    return {
      actorType: recipient.actorType || 'MEMBER',
      actorId: recipient.actorId,
      recipientName: recipient.name.trim() || undefined,
      recipientContact: recipient.phone.includes('*')
        ? undefined
        : recipient.phone.replace(/\D/g, '') || undefined,
    }
  })
}

export function buildCreateSendBatchRequest(input: {
  batchName: string
  templateId: number
  programId?: number
  scheduledAt?: string
  senderKey?: string
  senderProfileId?: number
  recipients: AlimtalkSendRecipient[]
  variables?: Record<string, unknown>
}): CreateRequest {
  return {
    batchName: input.batchName,
    templateId: input.templateId,
    programId: input.programId,
    scheduledAt: input.scheduledAt,
    senderKey: input.senderKey,
    senderProfileId: input.senderProfileId,
    variables: input.variables,
    recipients: buildSendBatchRecipients(input.recipients),
  }
}
