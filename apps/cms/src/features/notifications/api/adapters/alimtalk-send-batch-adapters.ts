import type {
  CreateRequest,
  ListNotificationTemplateVariablesCategory,
  ListNotificationTemplateVariablesMemberType,
  ListNotificationTemplateVariablesParams,
  ListNotificationTemplateVariablesParticipantType,
  NotificationCatalogVariableItem,
  NotificationTemplateVariableCatalogResponse,
  RecipientCandidateResponse,
  RecipientRequest,
} from '@/shared/api/generated/notifications/schemas'
import {
  ListNotificationTemplateVariablesCategory as TemplateVariablesCategoryEnum,
  ListNotificationTemplateVariablesMemberType as TemplateVariablesMemberTypeEnum,
  ListNotificationTemplateVariablesParticipantType as TemplateVariablesParticipantTypeEnum,
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
  /** BE SSOT. FE는 이 값만으로 발송 화면 삽입 활성/비활성을 결정한다. */
  enabled: boolean
  programGroups: string[]
  recruitmentTypes: string[]
  participantTypes: string[]
  memberTypes: string[]
  categoryCode?: string
  categoryLabel?: string
}

export type NotificationTemplateVariablesQuery = {
  category?: string
  keyword?: string
  programId?: number
  participantType?: string
  memberType?: string
}

function pickEnumValue<T extends string>(
  raw: string | undefined,
  allowed: readonly T[]
): T | undefined {
  const value = raw?.trim()
  if (!value) return undefined
  return (allowed as readonly string[]).includes(value) ? (value as T) : undefined
}

/** programId 미선택 시 쿼리에서 완전히 제외 (undefined/null 전달 금지) */
export function toTemplateVariablesRequestParams(
  input: NotificationTemplateVariablesQuery = {}
): ListNotificationTemplateVariablesParams {
  const params: ListNotificationTemplateVariablesParams = {}
  const category = pickEnumValue(
    input.category,
    Object.values(TemplateVariablesCategoryEnum) as ListNotificationTemplateVariablesCategory[]
  )
  if (category) params.category = category
  if (input.keyword?.trim()) params.keyword = input.keyword.trim()
  if (input.programId != null && Number.isFinite(input.programId)) {
    params.programId = input.programId
  }
  const participantType = pickEnumValue(
    input.participantType,
    Object.values(
      TemplateVariablesParticipantTypeEnum
    ) as ListNotificationTemplateVariablesParticipantType[]
  )
  if (participantType) params.participantType = participantType
  const memberType = pickEnumValue(
    input.memberType,
    Object.values(TemplateVariablesMemberTypeEnum) as ListNotificationTemplateVariablesMemberType[]
  )
  if (memberType) params.memberType = memberType
  return params
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
  catalog: NotificationTemplateVariableCatalogResponse | null | undefined
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

/** BE MEMBER/ADMIN actor enrich로 채울 수 있는 본문 토큰 (DIRECT는 FE가 명시) */
export const ALIMTALK_MEMBER_ENRICHABLE_PLACEHOLDER_KEYS = new Set([
  '회원명',
  '수신자명',
  '사용자 아이디(이메일)',
  '이메일',
  'email',
  '휴대폰 번호',
  '전화번호',
  'phone',
])

/**
 * Create.variables 에 넣으면 NOTIFICATION_SERVER_RESERVED_VARIABLE 이 나는 키.
 * 서버 enrich / 카탈로그 SYSTEM·문맥 키 — 커스텀 키만 variables로 허용.
 */
export const NOTIFICATION_SERVER_RESERVED_VARIABLE_KEYS = new Set([
  ...ALIMTALK_MEMBER_ENRICHABLE_PLACEHOLDER_KEYS,
  '프로그램명',
  '소속명',
  '담당교사명',
  '동의 항목',
  '만료일시',
])

/** 텍스트들에서 `#{키}` 추출 — contentTemplate·titleTemplate이 SSOT */
export function extractPlaceholderKeysFromTexts(
  ...texts: Array<string | null | undefined>
): Set<string> {
  const keys = new Set<string>()
  for (const text of texts) {
    if (!text) continue
    const normalized = text
      .replace(/&#0*123;/gi, '{')
      .replace(/&#0*125;/gi, '}')
      .replace(/&#x0*7b;/gi, '{')
      .replace(/&#x0*7d;/gi, '}')
      .replace(/&lbrace;/gi, '{')
      .replace(/&rbrace;/gi, '}')
    for (const match of normalized.matchAll(TEMPLATE_PLACEHOLDER_RE)) {
      const key = match[1]?.trim()
      if (key) keys.add(key)
    }
  }
  return keys
}

export {
  formatNotificationFailedReason as formatAlimtalkFailedReason,
  formatNotificationMissingVariablesMessage as formatAlimtalkMissingVariablesMessage,
} from '@/features/notifications/model/shared/format-notification-failed-reason'

function hasNonEmptyVariableValue(
  variables: Record<string, unknown> | null | undefined,
  key: string
): boolean {
  if (!variables) return false
  const value = variables[key]
  if (value == null) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number' || typeof value === 'boolean') return true
  return String(value).trim().length > 0
}

export type AlimtalkRequiredVariableCheckInput = {
  requiredKeys: Iterable<string>
  batchVariables?: Record<string, unknown> | null
  recipients?: Array<{
    actorType?: string
    actorId?: number
    source?: string
    variables?: Record<string, unknown> | null
  }>
}

/**
 * 본문 `#{...}` 대비 batch/recipient variables 누락 키.
 * - MEMBER+actorId: BE가 enrich하는 「사용자 아이디(이메일)」은 충족으로 본다.
 * - DIRECT / 수동 번호: enrich 없음 → 모든 토큰이 variables에 있어야 함.
 */
export function findMissingAlimtalkTemplateVariableKeys(
  input: AlimtalkRequiredVariableCheckInput
): string[] {
  const required = [...input.requiredKeys].map(key => key.trim()).filter(Boolean)
  if (required.length === 0) return []

  const recipients = input.recipients ?? []
  const allMembersWithId =
    recipients.length > 0 &&
    recipients.every(recipient => {
      const actorType = (recipient.actorType || '').trim().toUpperCase()
      const isDirect =
        recipient.source === 'manual' || actorType === 'DIRECT' || recipient.actorId == null
      return !isDirect && Number.isFinite(recipient.actorId)
    })

  const missing: string[] = []
  for (const key of required) {
    if (hasNonEmptyVariableValue(input.batchVariables, key)) continue
    const coveredByRecipient = recipients.some(recipient =>
      hasNonEmptyVariableValue(recipient.variables, key)
    )
    if (coveredByRecipient) continue
    if (allMembersWithId && ALIMTALK_MEMBER_ENRICHABLE_PLACEHOLDER_KEYS.has(key)) continue
    missing.push(key)
  }
  return missing
}

/** 템플릿 본문·제목·버튼 등에 등장하는 `#{키}` 집합 (본문 토큰이 SSOT) */
export function collectTemplatePlaceholderKeys(
  template: {
    content?: string
    titleTemplate?: string
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
    template.titleTemplate ?? '',
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

  return extractPlaceholderKeysFromTexts(...parts)
}

export function pickNonEmptySendVariables(
  values?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!values) return undefined
  const next: Record<string, unknown> = {}
  for (const [key, raw] of Object.entries(values)) {
    const trimmedKey = key.trim()
    if (!trimmedKey) continue
    // 서버 예약·카탈로그 enrich 키는 variables로 덮어쓰지 않음
    if (NOTIFICATION_SERVER_RESERVED_VARIABLE_KEYS.has(trimmedKey)) continue
    if (typeof raw === 'string') {
      const trimmedValue = raw.trim()
      if (!trimmedValue) continue
      next[trimmedKey] = trimmedValue
      continue
    }
    if (raw == null || raw === '') continue
    next[trimmedKey] = raw
  }
  return Object.keys(next).length > 0 ? next : undefined
}

export function buildAlimtalkBatchVariables(
  values: Record<string, string> | null | undefined
): Record<string, unknown> | undefined {
  return pickNonEmptySendVariables(values ?? undefined)
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
  variable: NotificationCatalogVariableItem,
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
    enabled: variable.enabled === true,
    programGroups: variable.programGroups ?? [],
    recruitmentTypes: variable.recruitmentTypes ?? [],
    participantTypes: variable.participantTypes ?? [],
    memberTypes: variable.memberTypes ?? [],
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
  const variables = pickNonEmptySendVariables(input.variables)
  const body: CreateRequest = {
    batchName: input.batchName,
    templateId: input.templateId,
    scheduledAt: input.scheduledAt,
    senderKey: input.senderKey,
    senderProfileId: input.senderProfileId,
    recipients: buildSendBatchRecipients(input.recipients),
  }
  if (input.programId != null) body.programId = input.programId
  if (variables) body.variables = variables
  // ALIMTALK: titleTemplate/contentTemplate 절대 미포함 (BE NOTIFICATION_SEND_BODY_OVERRIDE_NOT_ALLOWED_FOR_ALIMTALK)
  return body
}
