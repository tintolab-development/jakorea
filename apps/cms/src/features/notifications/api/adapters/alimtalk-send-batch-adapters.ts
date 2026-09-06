import type {
  CatalogResponse,
  CatalogVariableItem,
  CreateRequest,
  RecipientCandidateResponse,
  RecipientRequest,
} from '@/shared/api/generated/notifications/schemas'
import type { AlimtalkSendRecipient } from '@/features/notifications/model/alimtalk-send/types'
import type {
  AlimtalkSendMemberType,
  AlimtalkSendParticipationType,
} from '@/features/notifications/model/alimtalk-send/types'

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

function mapMemberType(candidate: RecipientCandidateResponse): AlimtalkSendMemberType {
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
  // SSOT: typeLabel 서버 한글 그대로. memberType/participantType으로 덮어쓰지 않음
  const fromBe = candidate.typeLabel?.trim()
  if (fromBe) return fromBe
  return undefined
}

export function mapRecipientCandidate(
  candidate: RecipientCandidateResponse
): AlimtalkSendRecipient | null {
  // SSOT: send-batch recipients[].actorId = memberId (participantId 사용 금지)
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

const TEMPLATE_PLACEHOLDER_RE = /#\{([^{}]+)\}/g

/** 템플릿 본문·버튼 등에 등장하는 `#{키}` 집합 */
export function collectTemplatePlaceholderKeys(
  template: {
    content?: string
    extraInfo?: string
    emphasisTitle?: string
    emphasisSubtitle?: string
    templateHeader?: string
    itemTitle?: string
    itemDescription?: string
    itemList?: { name?: string; content?: string }[]
    itemSummary?: { name?: string; content?: string }
    buttons?: { name?: string; destinations?: Record<string, string | undefined> }[]
    quickLinks?: { name?: string; destinations?: Record<string, string | undefined> }[]
  } | null | undefined
): Set<string> {
  if (!template) return new Set()

  const parts: string[] = [
    template.content ?? '',
    template.extraInfo ?? '',
    template.emphasisTitle ?? '',
    template.emphasisSubtitle ?? '',
    template.templateHeader ?? '',
    template.itemTitle ?? '',
    template.itemDescription ?? '',
    template.itemSummary?.name ?? '',
    template.itemSummary?.content ?? '',
  ]

  for (const item of template.itemList ?? []) {
    parts.push(item.name ?? '', item.content ?? '')
  }
  for (const button of template.buttons ?? []) {
    parts.push(button.name ?? '')
    if (button.destinations) parts.push(...Object.values(button.destinations).map(v => v ?? ''))
  }
  for (const link of template.quickLinks ?? []) {
    parts.push(link.name ?? '')
    if (link.destinations) parts.push(...Object.values(link.destinations).map(v => v ?? ''))
  }

  const keys = new Set<string>()
  for (const text of parts) {
    if (!text) continue
    for (const match of text.matchAll(TEMPLATE_PLACEHOLDER_RE)) {
      const key = match[1]?.trim()
      if (key) keys.add(key)
    }
  }
  return keys
}

/** 선택 템플릿이 실제로 쓰는 변수 중 프로그램 스코프가 필요한지 */
export function templateUsesProgramRequiredVariable(
  catalog: AlimtalkTemplateVariable[],
  template: Parameters<typeof collectTemplatePlaceholderKeys>[0]
): boolean {
  const used = collectTemplatePlaceholderKeys(template)
  if (used.size === 0) return false
  return catalog.some(variable => {
    if (!variable.requiresProgram) return false
    const tokenInner = variable.token.replace(/^#\{/, '').replace(/\}$/, '').trim()
    return used.has(variable.key) || used.has(tokenInner)
  })
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
