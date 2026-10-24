/**
 * 1사1교 기관 신청(application-economy) — RHF typed values ↔ overlay-key adapter.
 * Overlay store를 정본으로 읽지 않는다. Dayjs는 UI 경계에서만 변환한다.
 */
import type {
  CompanySchoolApplicationFormState,
  CompanySchoolApplicationGuidanceAnswers,
  CompanySchoolPreferredScheduleBlock,
} from './registration-canonical-types'

const PREFIX = 'application.economy'
const BASIC_PREFIX = `${PREFIX}.basicInfo.`

const BASIC_KEYS = [
  'applicationGrade',
  'classCount',
  'totalStudents',
  'educationFormat',
  'educationPlace',
  'educationPlaceDetail',
  'detailAddress',
  'teacherTel',
  'teacherMobile',
  'teacherEmail',
  'applicationReason',
  'otherRequests',
] as const

const GUIDANCE_KEYS = ['computer-in-room', 'waiting-place', 'meal', 'other-notes'] as const

export function emptyCompanySchoolGuidanceAnswers(): CompanySchoolApplicationGuidanceAnswers {
  return {
    'computer-in-room': '',
    'waiting-place': '',
    meal: '',
    'other-notes': '',
  }
}

export function emptyCompanySchoolPreferredScheduleBlock(): CompanySchoolPreferredScheduleBlock {
  return {
    date: null,
    session: '',
    firstClassPeriod: '',
    firstStart: null,
    firstEnd: null,
    secondClassPeriod: '',
    secondStart: null,
    secondEnd: null,
  }
}

export function emptyCompanySchoolApplicationFormState(): CompanySchoolApplicationFormState {
  return {
    basicInfo: {
      applicationGrade: '',
      classCount: '',
      totalStudents: '',
      educationFormat: 'online',
      educationPlace: 'inside',
      educationPlaceDetail: '',
      detailAddress: '',
      teacherTel: '',
      teacherMobile: '',
      teacherEmail: '',
      applicationReason: '',
      otherRequests: '',
    },
    guidanceAnswers: emptyCompanySchoolGuidanceAnswers(),
    lessonReply: {
      companyType: 'partner',
      customCompanyName: '',
    },
    previousYearParticipation: '',
    schedule: {
      first: emptyCompanySchoolPreferredScheduleBlock(),
      second: emptyCompanySchoolPreferredScheduleBlock(),
    },
  }
}

export function isCompanySchoolApplicationCatalog(
  templateCode: string | null | undefined
): boolean {
  return templateCode == null || templateCode === '' || templateCode === 'application-economy'
}

export function isCompanySchoolApplicationOverlayKey(key: string): boolean {
  return key.startsWith(`${PREFIX}.`)
}

export function cloneCompanySchoolApplicationFormState(
  state: CompanySchoolApplicationFormState
): CompanySchoolApplicationFormState {
  return structuredClone(state)
}

export function collectCompanySchoolApplicationState(
  state: CompanySchoolApplicationFormState
): CompanySchoolApplicationFormState {
  return cloneCompanySchoolApplicationFormState(state)
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

function seoulCalendarDate(value: unknown): string | null {
  if (value == null || value === '') return null
  if (typeof value === 'object' && value !== null && 'format' in value) {
    const formatted = (value as { format: (token: string) => string }).format('YYYY-MM-DD')
    return formatted || null
  }
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const dateOnly = trimmed.match(/^(\d{4}-\d{2}-\d{2})/)
  if (dateOnly && !trimmed.includes('T')) return dateOnly[1]
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return dateOnly?.[1] ?? trimmed
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(parsed)
  const year = parts.find(part => part.type === 'year')?.value
  const month = parts.find(part => part.type === 'month')?.value
  const day = parts.find(part => part.type === 'day')?.value
  if (!year || !month || !day) return dateOnly?.[1] ?? null
  return `${year}-${month}-${day}`
}

function persistTime(value: unknown): string | null {
  if (value == null || value === '') return null
  if (typeof value === 'object' && value !== null && 'format' in value) {
    const formatted = (value as { format: (token: string) => string }).format('HH:mm')
    return formatted || null
  }
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const hhmm = trimmed.match(/^(\d{2}:\d{2})/)
  if (hhmm && !trimmed.includes('T')) return hhmm[1]
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return hhmm?.[1] ?? trimmed
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(parsed)
  const hour = parts.find(part => part.type === 'hour')?.value
  const minute = parts.find(part => part.type === 'minute')?.value
  if (!hour || !minute) return hhmm?.[1] ?? null
  return `${hour}:${minute}`
}

function asSession(value: unknown): '1' | '2' | '' {
  const raw = asString(value)
  if (raw === '1' || raw === '2') return raw
  return ''
}

function asCompanyType(value: unknown): 'partner' | 'none' | 'custom' | '' {
  const raw = asString(value)
  if (raw === 'partner' || raw === 'none' || raw === 'custom' || raw === '') return raw
  return ''
}

function asPreviousYear(value: unknown): 'yes' | 'no' | '' {
  const raw = asString(value)
  if (raw === 'yes' || raw === 'no' || raw === '') return raw
  return ''
}

export function persistCompanySchoolPreferredScheduleBlock(
  raw: unknown
): CompanySchoolPreferredScheduleBlock {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return emptyCompanySchoolPreferredScheduleBlock()
  }
  const rec = raw as Record<string, unknown>
  return {
    date: seoulCalendarDate(rec.date),
    session: asSession(rec.session),
    firstClassPeriod: asString(rec.firstClassPeriod),
    firstStart: persistTime(rec.firstStart),
    firstEnd: persistTime(rec.firstEnd),
    secondClassPeriod: asString(rec.secondClassPeriod),
    secondStart: persistTime(rec.secondStart),
    secondEnd: persistTime(rec.secondEnd),
  }
}

function persistGuidanceAnswers(raw: unknown): CompanySchoolApplicationGuidanceAnswers {
  const next = emptyCompanySchoolGuidanceAnswers()
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return next
  const rec = raw as Record<string, unknown>
  for (const key of GUIDANCE_KEYS) {
    if (Object.prototype.hasOwnProperty.call(rec, key)) next[key] = asString(rec[key])
  }
  return next
}

const derivedApplicationSnapshotCache = new Map<string, { token: string; value: unknown }>()

function cachedApplicationSnapshot(key: string, token: string, create: () => unknown): unknown {
  const hit = derivedApplicationSnapshotCache.get(key)
  if (hit?.token === token) return hit.value
  const value = create()
  derivedApplicationSnapshotCache.set(key, { token, value })
  return value
}

function scheduleSnapshotToken(block: CompanySchoolPreferredScheduleBlock): string {
  return [
    block.date ?? '',
    block.session,
    block.firstClassPeriod,
    block.firstStart ?? '',
    block.firstEnd ?? '',
    block.secondClassPeriod,
    block.secondStart ?? '',
    block.secondEnd ?? '',
  ].join('\u0001')
}

export function readCompanySchoolApplicationOverlayValue(
  state: CompanySchoolApplicationFormState,
  key: string
): unknown {
  if (key === `${PREFIX}.guidanceAnswers`) {
    const answers = state.guidanceAnswers
    return cachedApplicationSnapshot(
      key,
      GUIDANCE_KEYS.map(item => answers[item]).join('\u0001'),
      () => ({ ...answers })
    )
  }
  if (key === `${PREFIX}.previousYearParticipation`) return state.previousYearParticipation
  if (key === `${PREFIX}.lessonReply.companyType`) return state.lessonReply.companyType
  if (key === `${PREFIX}.lessonReply.customCompanyName`) return state.lessonReply.customCompanyName
  if (key === `${PREFIX}.schedule.first`) {
    return cachedApplicationSnapshot(key, scheduleSnapshotToken(state.schedule.first), () => ({
      ...state.schedule.first,
    }))
  }
  if (key === `${PREFIX}.schedule.second`) {
    return cachedApplicationSnapshot(key, scheduleSnapshotToken(state.schedule.second), () => ({
      ...state.schedule.second,
    }))
  }
  if (key.startsWith(BASIC_PREFIX)) {
    const field = key.slice(BASIC_PREFIX.length) as keyof CompanySchoolApplicationFormState['basicInfo']
    if ((BASIC_KEYS as readonly string[]).includes(field)) return state.basicInfo[field]
  }
  return undefined
}

export function writeCompanySchoolApplicationOverlayValue(
  state: CompanySchoolApplicationFormState,
  key: string,
  value: unknown
): CompanySchoolApplicationFormState {
  const next = cloneCompanySchoolApplicationFormState(state)
  if (key === `${PREFIX}.guidanceAnswers`) {
    next.guidanceAnswers = persistGuidanceAnswers({
      ...next.guidanceAnswers,
      ...(value != null && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {}),
    })
    return next
  }
  if (key === `${PREFIX}.previousYearParticipation`) {
    next.previousYearParticipation = asPreviousYear(value)
    return next
  }
  if (key === `${PREFIX}.lessonReply.companyType`) {
    next.lessonReply.companyType = asCompanyType(value)
    return next
  }
  if (key === `${PREFIX}.lessonReply.customCompanyName`) {
    next.lessonReply.customCompanyName = asString(value)
    return next
  }
  if (key === `${PREFIX}.schedule.first`) {
    next.schedule.first = persistCompanySchoolPreferredScheduleBlock(value)
    return next
  }
  if (key === `${PREFIX}.schedule.second`) {
    next.schedule.second = persistCompanySchoolPreferredScheduleBlock(value)
    return next
  }
  if (key.startsWith(BASIC_PREFIX)) {
    const field = key.slice(BASIC_PREFIX.length) as keyof CompanySchoolApplicationFormState['basicInfo']
    if ((BASIC_KEYS as readonly string[]).includes(field)) next.basicInfo[field] = asString(value)
  }
  return next
}

export function applyCompanySchoolApplicationOverlayRecord(
  state: CompanySchoolApplicationFormState,
  overlay: Record<string, unknown>
): CompanySchoolApplicationFormState {
  let next = state
  for (const [key, value] of Object.entries(overlay)) {
    if (!isCompanySchoolApplicationOverlayKey(key)) continue
    next = writeCompanySchoolApplicationOverlayValue(next, key, value)
  }
  return next
}

export function importLegacyCompanySchoolApplicationOverlay(
  overlay: Record<string, unknown>
): CompanySchoolApplicationFormState {
  const defaults = emptyCompanySchoolApplicationFormState()
  const has = (key: string) => Object.prototype.hasOwnProperty.call(overlay, key)
  const next = applyCompanySchoolApplicationOverlayRecord(defaults, overlay)
  if (!has(`${BASIC_PREFIX}educationFormat`)) next.basicInfo.educationFormat = defaults.basicInfo.educationFormat
  if (!has(`${BASIC_PREFIX}educationPlace`)) next.basicInfo.educationPlace = defaults.basicInfo.educationPlace
  if (!has(`${PREFIX}.lessonReply.companyType`)) {
    next.lessonReply.companyType = defaults.lessonReply.companyType
  }
  if (has(`${PREFIX}.guidanceAnswers`)) {
    next.guidanceAnswers = persistGuidanceAnswers(overlay[`${PREFIX}.guidanceAnswers`])
  }
  return next
}

export function serializeCompanySchoolApplicationForFormVersion(
  state: CompanySchoolApplicationFormState
): Record<string, unknown> {
  const overlay: Record<string, unknown> = {
    [`${PREFIX}.guidanceAnswers`]: { ...state.guidanceAnswers },
    [`${PREFIX}.lessonReply.companyType`]: state.lessonReply.companyType,
    [`${PREFIX}.lessonReply.customCompanyName`]: state.lessonReply.customCompanyName,
    [`${PREFIX}.previousYearParticipation`]: state.previousYearParticipation,
    [`${PREFIX}.schedule.first`]: { ...state.schedule.first },
    [`${PREFIX}.schedule.second`]: { ...state.schedule.second },
  }
  for (const key of BASIC_KEYS) {
    overlay[`${BASIC_PREFIX}${key}`] = state.basicInfo[key]
  }
  return overlay
}

export function omitCompanySchoolApplicationOverlayKeys(
  overlay: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(overlay).filter(([key]) => !isCompanySchoolApplicationOverlayKey(key))
  )
}

export function splitCompanySchoolApplicationOverlay(
  record: Record<string, unknown>
): { application: Record<string, unknown>; rest: Record<string, unknown> } {
  const application: Record<string, unknown> = {}
  const rest: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (isCompanySchoolApplicationOverlayKey(key)) application[key] = value
    else rest[key] = value
  }
  return { application, rest }
}

export function scheduleBlockToken(block: CompanySchoolPreferredScheduleBlock): string {
  return [
    block.date ?? '',
    block.session,
    block.firstClassPeriod,
    block.firstStart ?? '',
    block.firstEnd ?? '',
    block.secondClassPeriod,
    block.secondStart ?? '',
    block.secondEnd ?? '',
  ].join('\u0001')
}
