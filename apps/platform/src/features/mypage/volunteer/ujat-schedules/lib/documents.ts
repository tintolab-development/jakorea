const DISPLAY_DATE_TIMEZONE = 'Asia/Seoul'

export type UjatEducationDocumentKind = 'PLAN' | 'JOURNAL'

export type UjatEducationDocumentStatus =
  | 'NOT_SUBMITTED'
  | 'SUBMITTED'
  | 'DEADLINE_MISSED'
  | 'REVISED'

export type UjatEducationDocumentUnavailableReason =
  | 'FORM_TEMPLATE_VERSION_NOT_PUBLISHED'
  | 'FORM_BINDING_NOT_FOUND'
  | 'FORM_TEMPLATE_DISABLED'
  | null

export type UjatEducationDocumentTemplateSetup = {
  templateCode: string | null
  templateName: string | null
  templateId: number | null
  publishedTemplateVersionId: number | null
  programFormBindingId: number | null
  unavailableReason: UjatEducationDocumentUnavailableReason
}

export type UjatEducationDocumentSlot = {
  documentKind: UjatEducationDocumentKind
  status: UjatEducationDocumentStatus
  deadlineAt: string | null
  deadlineDate: string | null
  canSubmit: boolean
  canRevise: boolean
  hasFeedback: boolean
  formResponseId: number | null
  programFormBindingId: number | null
  templateVersionId: number | null
  contextType: string | null
  contextId: number | null
  submittedAt: string | null
}

export type UjatEducationDayDocuments = {
  scheduleId: number
  educationDate: string | null
  assignmentStatus: string | null
  classLabel: string | null
  organizationApplicationId: number | null
  plan: UjatEducationDocumentSlot
  journal: UjatEducationDocumentSlot
}

export type UjatEducationDocumentsResponse = {
  applicationId: number | null
  applicationType: string | null
  programId: number | null
  recruitmentId: number | null
  recruitTerm: string | null
  participantId: number | null
  planSetup: UjatEducationDocumentTemplateSetup | null
  journalSetup: UjatEducationDocumentTemplateSetup | null
  items: UjatEducationDayDocuments[]
}

export const UJAT_EDUCATION_DOCUMENT_KIND_PLAN = 'PLAN' as const
export const UJAT_EDUCATION_DOCUMENT_KIND_JOURNAL = 'JOURNAL' as const

const SEOUL_YMD = new Intl.DateTimeFormat('en-CA', {
  timeZone: DISPLAY_DATE_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const SEOUL_HMS = new Intl.DateTimeFormat('en-GB', {
  timeZone: DISPLAY_DATE_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function optionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function optionalNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function optionalBoolean(value: unknown): boolean {
  return value === true
}

function parseStatus(value: unknown): UjatEducationDocumentStatus | null {
  const code = optionalString(value)?.toUpperCase()
  if (
    code === 'NOT_SUBMITTED' ||
    code === 'SUBMITTED' ||
    code === 'DEADLINE_MISSED' ||
    code === 'REVISED'
  ) {
    return code
  }
  return null
}

function parseKind(value: unknown): UjatEducationDocumentKind | null {
  const code = optionalString(value)?.toUpperCase()
  if (code === 'PLAN' || code === 'JOURNAL') return code
  return null
}

function parseUnavailableReason(value: unknown): UjatEducationDocumentUnavailableReason {
  const code = optionalString(value)?.toUpperCase()
  if (
    code === 'FORM_TEMPLATE_VERSION_NOT_PUBLISHED' ||
    code === 'FORM_BINDING_NOT_FOUND' ||
    code === 'FORM_TEMPLATE_DISABLED'
  ) {
    return code
  }
  return null
}

export function parseUjatEducationDocumentSetup(
  value: unknown,
): UjatEducationDocumentTemplateSetup | null {
  if (!isRecord(value)) return null
  return {
    templateCode: optionalString(value.templateCode),
    templateName: optionalString(value.templateName),
    templateId: optionalNumber(value.templateId),
    publishedTemplateVersionId: optionalNumber(value.publishedTemplateVersionId),
    programFormBindingId: optionalNumber(value.programFormBindingId),
    unavailableReason: parseUnavailableReason(value.unavailableReason),
  }
}

export function parseUjatEducationDocumentSlot(
  value: unknown,
  fallbackKind: UjatEducationDocumentKind,
): UjatEducationDocumentSlot | null {
  if (!isRecord(value)) return null
  const documentKind = parseKind(value.documentKind) ?? fallbackKind
  const status = parseStatus(value.status) ?? 'NOT_SUBMITTED'
  return {
    documentKind,
    status,
    deadlineAt: optionalString(value.deadlineAt),
    deadlineDate: optionalString(value.deadlineDate),
    canSubmit: optionalBoolean(value.canSubmit),
    canRevise: optionalBoolean(value.canRevise),
    hasFeedback: optionalBoolean(value.hasFeedback),
    formResponseId: optionalNumber(value.formResponseId),
    programFormBindingId: optionalNumber(value.programFormBindingId),
    templateVersionId: optionalNumber(value.templateVersionId),
    contextType: optionalString(value.contextType),
    contextId: optionalNumber(value.contextId),
    submittedAt: optionalString(value.submittedAt),
  }
}

export function parseUjatEducationDayDocuments(value: unknown): UjatEducationDayDocuments | null {
  if (!isRecord(value)) return null
  const scheduleId = optionalNumber(value.scheduleId)
  if (scheduleId == null || scheduleId <= 0) return null
  const plan = parseUjatEducationDocumentSlot(value.plan, 'PLAN')
  const journal = parseUjatEducationDocumentSlot(value.journal, 'JOURNAL')
  if (!plan || !journal) return null
  return {
    scheduleId,
    educationDate: optionalString(value.educationDate),
    assignmentStatus: optionalString(value.assignmentStatus),
    classLabel: optionalString(value.classLabel),
    organizationApplicationId: optionalNumber(value.organizationApplicationId),
    plan,
    journal,
  }
}

export function parseUjatEducationDocumentsResponse(
  payload: unknown,
): UjatEducationDocumentsResponse {
  const root = isRecord(payload) ? payload : {}
  const rawItems = Array.isArray(root.items) ? root.items : []
  const items: UjatEducationDayDocuments[] = []
  for (const row of rawItems) {
    const parsed = parseUjatEducationDayDocuments(row)
    if (parsed) items.push(parsed)
  }
  return {
    applicationId: optionalNumber(root.applicationId),
    applicationType: optionalString(root.applicationType),
    programId: optionalNumber(root.programId),
    recruitmentId: optionalNumber(root.recruitmentId),
    recruitTerm: optionalString(root.recruitTerm),
    participantId: optionalNumber(root.participantId),
    planSetup: parseUjatEducationDocumentSetup(root.planSetup),
    journalSetup: parseUjatEducationDocumentSetup(root.journalSetup),
    items,
  }
}

export function ujatEducationDocumentTitle(kind: UjatEducationDocumentKind): string {
  return kind === 'JOURNAL' ? '교육일지' : '교육계획서'
}

export function ujatEducationDocumentStatusLabel(status: UjatEducationDocumentStatus): string {
  switch (status) {
    case 'SUBMITTED':
      return '제출 완료'
    case 'DEADLINE_MISSED':
      return '기한 미준수'
    case 'REVISED':
      return '수정 제출 완료'
    default:
      return '미제출'
  }
}

export function ujatEducationDocumentStatusTone(
  status: UjatEducationDocumentStatus,
): 'submitted' | 'unsubmitted' {
  return status === 'SUBMITTED' || status === 'REVISED' ? 'submitted' : 'unsubmitted'
}

export function formatUjatEducationDocumentDeadline(
  slot: Pick<UjatEducationDocumentSlot, 'deadlineAt' | 'deadlineDate'>,
): string | null {
  const dateOnly = slot.deadlineDate
  if (dateOnly && /^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    return `${dateOnly} 24:00`
  }
  if (!slot.deadlineAt) return null
  const instant = new Date(slot.deadlineAt)
  if (Number.isNaN(instant.getTime())) return null
  const ymd = SEOUL_YMD.format(instant)
  const clock = SEOUL_HMS.format(instant)
  if (clock === '00:00:00') {
    return `${previousIsoDate(ymd)} 24:00`
  }
  return `${ymd} ${clock.slice(0, 5)}`
}

function previousIsoDate(ymd: string): string {
  const [year, month, day] = ymd.split('-').map(Number)
  const previous = new Date(Date.UTC(year, month - 1, day) - 24 * 60 * 60 * 1000)
  const nextYear = previous.getUTCFullYear()
  const nextMonth = String(previous.getUTCMonth() + 1).padStart(2, '0')
  const nextDay = String(previous.getUTCDate()).padStart(2, '0')
  return `${nextYear}-${nextMonth}-${nextDay}`
}

export function ujatEducationDocumentSetupMessage(
  kind: UjatEducationDocumentKind,
  reason: UjatEducationDocumentUnavailableReason | undefined,
): string {
  const title = ujatEducationDocumentTitle(kind)
  if (reason === 'FORM_TEMPLATE_DISABLED') {
    return `${title} 양식을 사용할 수 없습니다.`
  }
  if (reason === 'FORM_TEMPLATE_VERSION_NOT_PUBLISHED') {
    return `${title} 양식이 아직 공개되지 않았습니다.`
  }
  return `${title} 양식이 아직 준비되지 않았습니다.`
}

export function ujatEducationDocumentGuideMessage(
  kind: UjatEducationDocumentKind,
  slot: UjatEducationDocumentSlot,
  setup: UjatEducationDocumentTemplateSetup | null,
): string {
  const title = ujatEducationDocumentTitle(kind)
  if (!canEnterUjatEducationDocumentWrite(slot) && !slot.formResponseId) {
    const reason = setup?.unavailableReason
    if (reason || slot.programFormBindingId == null || slot.templateVersionId == null) {
      return ujatEducationDocumentSetupMessage(kind, reason ?? setup?.unavailableReason ?? null)
    }
  }
  if (slot.hasFeedback) return `담당자의 ${title} 피드백이 있어요`
  if (slot.status === 'REVISED') return `${title} 수정 제출이 완료되었어요`
  if (slot.status === 'SUBMITTED') return `${title} 제출이 완료되었어요`
  if (slot.status === 'DEADLINE_MISSED' && slot.formResponseId == null) {
    return `${title} 제출 기한이 지났어요. 최초 제출은 가능하면 버튼이 활성화됩니다.`
  }
  return `${title}를 제출해 주세요.`
}

export function canEnterUjatEducationDocumentWrite(slot: UjatEducationDocumentSlot): boolean {
  return (
    slot.canSubmit === true &&
    slot.programFormBindingId != null &&
    slot.programFormBindingId > 0 &&
    slot.templateVersionId != null &&
    slot.templateVersionId > 0
  )
}

export function canEnterUjatEducationDocumentRevise(slot: UjatEducationDocumentSlot): boolean {
  return slot.canRevise === true && slot.formResponseId != null && slot.formResponseId > 0
}

export function canViewUjatEducationDocumentFeedback(slot: UjatEducationDocumentSlot): boolean {
  return slot.hasFeedback === true && slot.formResponseId != null && slot.formResponseId > 0
}

export function canViewUjatEducationDocumentResponse(slot: UjatEducationDocumentSlot): boolean {
  return slot.formResponseId != null && slot.formResponseId > 0
}

export function indexUjatEducationDocumentsByScheduleId(
  items: readonly UjatEducationDayDocuments[],
): Map<number, UjatEducationDayDocuments> {
  const map = new Map<number, UjatEducationDayDocuments>()
  for (const item of items) {
    map.set(item.scheduleId, item)
  }
  return map
}

