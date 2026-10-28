/**
 * 1사1교 등록 공통정보 RHF 값.
 * 제품 정본은 canonical 필드. sidecar는 UI overlay 키 호환용이며 overlay store가 아니다.
 */
import {
  surveyItemsRecordFromMenuKeys,
  surveyMenuKeysFromRegistrationOverlay,
} from '@/features/program/general/lib/general-survey-menu-keys'
import {
  COMPANY_SCHOOL_REGISTRATION_CANONICAL_VERSION,
  type CompanySchoolCurriculumSession,
  type CompanySchoolDateRange,
  type CompanySchoolApplicationFormState,
  type CompanySchoolRecruitFormState,
  type CompanySchoolRegistrationCommonCanonical,
} from './registration-canonical-types'
import {
  applyCompanySchoolRecruitmentOverlayRecord,
  cloneCompanySchoolRecruitFormState,
  emptyCompanySchoolRecruitFormState,
  isCompanySchoolRecruitmentOverlayKey,
} from './registration-rhf-recruitment'
import {
  applyCompanySchoolApplicationOverlayRecord,
  cloneCompanySchoolApplicationFormState,
  emptyCompanySchoolApplicationFormState,
  isCompanySchoolApplicationOverlayKey,
} from './registration-rhf-application'

export const COMPANY_SCHOOL_REGISTRATION_OVERLAY_PREFIX = 'economyRegistration.' as const
export const COMPANY_SCHOOL_UNSELECTED = '__all__' as const
export const COMPANY_SCHOOL_DEFAULT_REP_KO = '1사1교 경제금융교육'
export const COMPANY_SCHOOL_DEFAULT_REP_EN =
  '1 Company 1 School Economics and Finance Education'

export const COMPANY_SCHOOL_FIXED_CURRICULUM_SESSIONS = [
  {
    sessionLabel: '1차시',
    title: '1단원 나를 알리는 기술',
    description: '채용 공고 읽기, 이력서 작성하기 등 취업에 필요한 단계들을 알아봅니다.',
  },
  {
    sessionLabel: '2차시',
    title: '2단원 나를 보여주는 기술',
    description: '올바른 면접 태도에 대해 알아보고, 직접 면접 체험을 해보는 시간을 갖습니다.',
  },
] as const

export type CompanySchoolRegistrationRhfValues = CompanySchoolRegistrationCommonCanonical & {
  operationAnchorIso: string | null
  recruitment: CompanySchoolRecruitFormState
  application: CompanySchoolApplicationFormState
  sidecar: Record<string, unknown>
}

const COMMON_INFO_PREFIXES = [
  'economyRegistration.basicInfo.',
  'economyRegistration.kpi.',
  'economyRegistration.educationCurriculum.',
  'economyRegistration.educationScheduleSettings.',
  'economyRegistration.wageInfo.',
] as const

const BASIC_FIELD_BY_SUFFIX: Record<
  string,
  keyof Pick<
    CompanySchoolRegistrationRhfValues,
    | 'repKo'
    | 'repEn'
    | 'publicProgramTitle'
    | 'detailedProgramId'
    | 'detailedProgramName'
    | 'businessField'
    | 'ipOwned'
    | 'courseDeliveredBy'
    | 'ipsCategory'
    | 'educationCourse'
    | 'operationAnchorIso'
  >
> = {
  repKo: 'repKo',
  repEn: 'repEn',
  publicProgramTitle: 'publicProgramTitle',
  detailedProgramId: 'detailedProgramId',
  detailedProgramName: 'detailedProgramName',
  businessField: 'businessField',
  ipOwned: 'ipOwned',
  courseDeliveredBy: 'courseDeliveredBy',
  ipsCategory: 'ipsCategory',
  educationCourse: 'educationCourse',
  operationAnchorIso: 'operationAnchorIso',
}

const KPI_FIELD_BY_SUFFIX: Record<
  string,
  keyof Pick<
    CompanySchoolRegistrationRhfValues,
    'participantCount' | 'instructor' | 'dispatchedSchool' | 'dispatchedClass'
  >
> = {
  participantCount: 'participantCount',
  instructor: 'instructor',
  dispatchedSchool: 'dispatchedSchool',
  dispatchedClass: 'dispatchedClass',
}

const WAGE_FIELD_BY_SUFFIX: Record<
  string,
  keyof Pick<
    CompanySchoolRegistrationRhfValues,
    | 'grade1Fee'
    | 'grade1DistanceFee'
    | 'grade2Fee'
    | 'grade2DistanceFee'
    | 'grade3Fee'
    | 'grade3DistanceFee'
  >
> = {
  grade1Fee: 'grade1Fee',
  grade1DistanceFee: 'grade1DistanceFee',
  grade2Fee: 'grade2Fee',
  grade2DistanceFee: 'grade2DistanceFee',
  grade3Fee: 'grade3Fee',
  grade3DistanceFee: 'grade3DistanceFee',
}

/**
 * C1: 1사1교 공통정보 RHF 명시 필드에 대응하는 정확한 overlay 키(화이트리스트).
 * prefix 판별(isCompanySchoolCommonInfoOverlayKey)은 legacy·sidecar 보존용으로 유지하고,
 * 화이트리스트 밖 키는 sidecar로 보존하면서 dev 경고를 남긴다.
 */
export const COMPANY_SCHOOL_COMMON_INFO_EXACT_KEYS: ReadonlySet<string> = new Set([
  ...Object.keys(BASIC_FIELD_BY_SUFFIX).map(suffix => `economyRegistration.basicInfo.${suffix}`),
  'economyRegistration.basicInfo.partnerInvolvement',
  'economyRegistration.basicInfo.sponsorId',
  'economyRegistration.basicInfo.managerContactIds',
  'economyRegistration.basicInfo.managerContactId',
  'economyRegistration.basicInfo.operationRangeSeal',
  'economyRegistration.basicInfo.surveyItems',
  ...Object.keys(KPI_FIELD_BY_SUFFIX).map(suffix => `economyRegistration.kpi.${suffix}`),
  'economyRegistration.educationCurriculum.session1.title',
  'economyRegistration.educationCurriculum.session1.description',
  'economyRegistration.educationCurriculum.session2.title',
  'economyRegistration.educationCurriculum.session2.description',
  'economyRegistration.educationScheduleSettings.dateRangeSeal',
  ...Object.keys(WAGE_FIELD_BY_SUFFIX).map(suffix => `economyRegistration.wageInfo.${suffix}`),
  'economyRegistration.wageInfo.paymentItemValues',
])

export function isKnownCompanySchoolCommonInfoOverlayKey(key: string): boolean {
  return COMPANY_SCHOOL_COMMON_INFO_EXACT_KEYS.has(key)
}

const warnedUnknownCompanySchoolKeys = new Set<string>()
function warnUnknownCompanySchoolCommonInfoKey(key: string): void {
  if (!import.meta.env.DEV || warnedUnknownCompanySchoolKeys.has(key)) return
  warnedUnknownCompanySchoolKeys.add(key)
  console.warn('[company-school-rhf] 화이트리스트 밖 공통정보 키 — sidecar로 보존', key)
}

export function isCompanySchoolCommonInfoOverlayKey(key: string): boolean {
  return COMMON_INFO_PREFIXES.some(prefix => key.startsWith(prefix))
}

export function omitCompanySchoolCommonInfoOverlayKeys(
  overlay: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(overlay).filter(([key]) => !isCompanySchoolCommonInfoOverlayKey(key))
  )
}

function suffixOf(key: string): string {
  const lastDot = key.lastIndexOf('.')
  return lastDot >= 0 ? key.slice(lastDot + 1) : key
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function asNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value.replace(/,/g, ''))
    return Number.isFinite(n) ? n : null
  }
  return null
}

function asSponsorId(value: unknown): string {
  const id = asString(value).trim()
  return !id || id === COMPANY_SCHOOL_UNSELECTED ? '' : id
}

function asContactIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    const single = asSponsorId(value)
    return single ? [single] : []
  }
  return [
    ...new Set(
      value
        .map(item => String(item).trim())
        .filter(id => id && id !== COMPANY_SCHOOL_UNSELECTED)
    ),
  ]
}

function asDateRange(value: unknown): CompanySchoolDateRange | null {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return null
  const start = (value as { start?: unknown }).start
  const end = (value as { end?: unknown }).end
  if (typeof start !== 'string' || typeof end !== 'string') return null
  if (!start.trim() || !end.trim()) return null
  return { start, end }
}

function ensureTwoSessions(
  sessions: CompanySchoolCurriculumSession[]
): CompanySchoolCurriculumSession[] {
  return COMPANY_SCHOOL_FIXED_CURRICULUM_SESSIONS.map((fallback, index) => ({
    sessionLabel: fallback.sessionLabel,
    title: sessions[index]?.title ?? '',
    description: sessions[index]?.description ?? '',
  }))
}

function curriculumSessionIndex(key: string): { index: number; field: 'title' | 'description' } | null {
  const match = key.match(
    /^economyRegistration\.educationCurriculum\.session(\d+)\.(title|description)$/
  )
  if (!match) return null
  const index = Number(match[1]) - 1
  if (index < 0 || index > 1) return null
  return { index, field: match[2] as 'title' | 'description' }
}

export function createDefaultCompanySchoolRegistrationRhfValues(): CompanySchoolRegistrationRhfValues {
  return {
    repKo: '',
    repEn: '',
    publicProgramTitle: '',
    detailedProgramId: '',
    detailedProgramName: '',
    operationRange: null,
    operationAnchorIso: null,
    businessField: '',
    sponsorId: '',
    managerContactIds: [],
    ipOwned: '',
    courseDeliveredBy: '',
    partnerInvolvement: '',
    ipsCategory: '',
    educationCourse: '',
    participantCount: null,
    instructor: null,
    dispatchedSchool: null,
    dispatchedClass: null,
    grade1Fee: null,
    grade1DistanceFee: null,
    grade2Fee: null,
    grade2DistanceFee: null,
    grade3Fee: null,
    grade3DistanceFee: null,
    paymentItemValues: undefined,
    curriculumSessions: COMPANY_SCHOOL_FIXED_CURRICULUM_SESSIONS.map(session => ({
      sessionLabel: session.sessionLabel,
      title: session.title,
      description: session.description,
    })),
    educationScheduleRange: null,
    educationScheduleMode: 'period',
    educationScheduleLines: [],
    generalSurveyMenuKeys: ['survey', 'satisfaction', 'lecture_evaluation'],
    recruitment: emptyCompanySchoolRecruitFormState(),
    application: emptyCompanySchoolApplicationFormState(),
    sidecar: {},
  }
}

export function cloneCompanySchoolRegistrationRhfValues(
  values: CompanySchoolRegistrationRhfValues
): CompanySchoolRegistrationRhfValues {
  return structuredClone(values)
}

export function isCompanySchoolRegistrationCanonicalSnapshot(value: unknown): value is {
  schemaVersion: typeof COMPANY_SCHOOL_REGISTRATION_CANONICAL_VERSION
  common: CompanySchoolRegistrationCommonCanonical
  recruit?: CompanySchoolRecruitFormState
  application?: CompanySchoolApplicationFormState
  sidecar?: Record<string, unknown>
} {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  return (
    record.schemaVersion === COMPANY_SCHOOL_REGISTRATION_CANONICAL_VERSION &&
    record.common != null &&
    typeof record.common === 'object'
  )
}

export function rhfValuesFromCompanySchoolCanonical(
  common: CompanySchoolRegistrationCommonCanonical,
  sidecar?: Record<string, unknown>,
  recruit?: CompanySchoolRecruitFormState,
  application?: CompanySchoolApplicationFormState
): CompanySchoolRegistrationRhfValues {
  return {
    ...createDefaultCompanySchoolRegistrationRhfValues(),
    ...common,
    managerContactIds: [...common.managerContactIds],
    curriculumSessions: ensureTwoSessions(common.curriculumSessions),
    educationScheduleLines: [...common.educationScheduleLines],
    generalSurveyMenuKeys: [...common.generalSurveyMenuKeys],
    paymentItemValues:
      common.paymentItemValues === undefined ? undefined : [...common.paymentItemValues],
    operationRange: common.operationRange ? { ...common.operationRange } : null,
    operationAnchorIso: common.operationAnchorIso ?? null,
    educationScheduleRange: common.educationScheduleRange
      ? { ...common.educationScheduleRange }
      : null,
    recruitment: cloneCompanySchoolRecruitFormState(
      recruit ?? emptyCompanySchoolRecruitFormState()
    ),
    application: cloneCompanySchoolApplicationFormState(
      application ?? emptyCompanySchoolApplicationFormState()
    ),
    sidecar: sidecar ? { ...sidecar } : {},
  }
}

const derivedOverlaySnapshotCache = new Map<string, { token: string; value: unknown }>()

function cachedDerivedOverlaySnapshot(key: string, token: string, create: () => unknown): unknown {
  const hit = derivedOverlaySnapshotCache.get(key)
  if (hit?.token === token) return hit.value
  const value = create()
  derivedOverlaySnapshotCache.set(key, { token, value })
  return value
}

export function readCompanySchoolRhfOverlayValue(
  values: CompanySchoolRegistrationRhfValues,
  key: string
): unknown {
  if (!isCompanySchoolCommonInfoOverlayKey(key)) return undefined
  if (Object.prototype.hasOwnProperty.call(values.sidecar, key)) {
    return values.sidecar[key]
  }
  const session = curriculumSessionIndex(key)
  if (session) return values.curriculumSessions[session.index]?.[session.field] ?? ''

  const suffix = suffixOf(key)
  if (key.startsWith('economyRegistration.basicInfo.')) {
    if (suffix === 'surveyItems') {
      return cachedDerivedOverlaySnapshot(
        key,
        values.generalSurveyMenuKeys.join('\u0001'),
        () => surveyItemsRecordFromMenuKeys(values.generalSurveyMenuKeys)
      )
    }
    if (suffix === 'operationRangeSeal') {
      if (values.operationRange == null) return null
      return cachedDerivedOverlaySnapshot(
        key,
        `${values.operationRange.start}\u0001${values.operationRange.end}`,
        () => ({ ...values.operationRange })
      )
    }
    if (suffix === 'sponsorId') return values.sponsorId || COMPANY_SCHOOL_UNSELECTED
    if (suffix === 'managerContactIds') {
      return cachedDerivedOverlaySnapshot(
        key,
        values.managerContactIds.join('\u0001'),
        () => [...values.managerContactIds]
      )
    }
    if (suffix === 'managerContactId') {
      return values.managerContactIds[0] ?? COMPANY_SCHOOL_UNSELECTED
    }
    if (suffix === 'partnerInvolvement') return values.partnerInvolvement
    const field = BASIC_FIELD_BY_SUFFIX[suffix]
    if (field != null) return values[field]
  }
  if (key.startsWith('economyRegistration.kpi.')) {
    const field = KPI_FIELD_BY_SUFFIX[suffix]
    if (field != null) return values[field]
  }
  if (key === 'economyRegistration.educationScheduleSettings.dateRangeSeal') {
    if (values.educationScheduleRange == null) return null
    return cachedDerivedOverlaySnapshot(
      key,
      `${values.educationScheduleRange.start}\u0001${values.educationScheduleRange.end}`,
      () => ({ ...values.educationScheduleRange })
    )
  }
  if (key.startsWith('economyRegistration.wageInfo.')) {
    if (suffix === 'paymentItemValues') return values.paymentItemValues
    const field = WAGE_FIELD_BY_SUFFIX[suffix]
    if (field != null) return values[field]
  }
  return values.sidecar[key]
}

export function writeCompanySchoolRhfOverlayValue(
  values: CompanySchoolRegistrationRhfValues,
  key: string,
  value: unknown
): CompanySchoolRegistrationRhfValues {
  if (!isCompanySchoolCommonInfoOverlayKey(key)) return values
  const next = cloneCompanySchoolRegistrationRhfValues(values)
  const session = curriculumSessionIndex(key)
  if (session) {
    next.curriculumSessions = ensureTwoSessions(next.curriculumSessions)
    next.curriculumSessions[session.index] = {
      ...next.curriculumSessions[session.index]!,
      [session.field]: asString(value),
    }
    return next
  }

  const suffix = suffixOf(key)
  if (key.startsWith('economyRegistration.basicInfo.')) {
    if (suffix === 'surveyItems') {
      next.generalSurveyMenuKeys =
        surveyMenuKeysFromRegistrationOverlay({
          'economyRegistration.basicInfo.surveyItems': value,
        }) ?? []
      return next
    }
    if (suffix === 'operationRangeSeal') {
      next.operationRange = asDateRange(value)
      return next
    }
    if (suffix === 'sponsorId') {
      next.sponsorId = asSponsorId(value)
      return next
    }
    if (suffix === 'managerContactIds') {
      next.managerContactIds = asContactIds(value)
      return next
    }
    if (suffix === 'managerContactId') {
      const id = asSponsorId(value)
      next.managerContactIds = id ? [id] : []
      return next
    }
    if (suffix === 'partnerInvolvement') {
      next.partnerInvolvement = value === 'yes' ? 'yes' : value === 'no' ? 'no' : ''
      return next
    }
    const field = BASIC_FIELD_BY_SUFFIX[suffix]
    if (field != null) {
      if (field === 'operationAnchorIso') {
        next.operationAnchorIso = typeof value === 'string' ? value : null
        return next
      }
      ;(next as Record<string, unknown>)[field] = asString(value)
      return next
    }
  }
  if (key.startsWith('economyRegistration.kpi.')) {
    const field = KPI_FIELD_BY_SUFFIX[suffix]
    if (field != null) {
      next[field] = asNullableNumber(value)
      return next
    }
    warnUnknownCompanySchoolCommonInfoKey(key)
    next.sidecar[key] = value
    return next
  }
  if (key === 'economyRegistration.educationScheduleSettings.dateRangeSeal') {
    next.educationScheduleRange = asDateRange(value)
    return next
  }
  if (key.startsWith('economyRegistration.wageInfo.')) {
    if (suffix === 'paymentItemValues') {
      next.paymentItemValues = Array.isArray(value) ? value.map(String) : []
      return next
    }
    const field = WAGE_FIELD_BY_SUFFIX[suffix]
    if (field != null) {
      next[field] = asNullableNumber(value)
      return next
    }
  }
  if (!isKnownCompanySchoolCommonInfoOverlayKey(key)) warnUnknownCompanySchoolCommonInfoKey(key)
  next.sidecar[key] = value
  return next
}

export function applyCompanySchoolRhfOverlayRecord(
  values: CompanySchoolRegistrationRhfValues,
  overlay: Record<string, unknown>
): CompanySchoolRegistrationRhfValues {
  let next = values
  const recruitPartial: Record<string, unknown> = {}
  const applicationPartial: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(overlay)) {
    if (isCompanySchoolRecruitmentOverlayKey(key)) {
      recruitPartial[key] = value
      continue
    }
    if (isCompanySchoolApplicationOverlayKey(key)) {
      applicationPartial[key] = value
      continue
    }
    if (!isCompanySchoolCommonInfoOverlayKey(key)) continue
    next = writeCompanySchoolRhfOverlayValue(next, key, value)
  }
  if (Object.keys(recruitPartial).length > 0) {
    next = {
      ...next,
      recruitment: applyCompanySchoolRecruitmentOverlayRecord(next.recruitment, recruitPartial),
    }
  }
  if (Object.keys(applicationPartial).length > 0) {
    next = {
      ...next,
      application: applyCompanySchoolApplicationOverlayRecord(next.application, applicationPartial),
    }
  }
  return next
}

export function projectCompanySchoolRhfToOverlayRecord(
  values: CompanySchoolRegistrationRhfValues
): Record<string, unknown> {
  const overlay: Record<string, unknown> = { ...values.sidecar }
  overlay['economyRegistration.basicInfo.repKo'] = values.repKo
  overlay['economyRegistration.basicInfo.repEn'] = values.repEn
  overlay['economyRegistration.basicInfo.publicProgramTitle'] = values.publicProgramTitle
  overlay['economyRegistration.basicInfo.detailedProgramId'] = values.detailedProgramId
  overlay['economyRegistration.basicInfo.detailedProgramName'] = values.detailedProgramName
  overlay['economyRegistration.basicInfo.businessField'] = values.businessField
  overlay['economyRegistration.basicInfo.ipOwned'] = values.ipOwned
  overlay['economyRegistration.basicInfo.courseDeliveredBy'] = values.courseDeliveredBy
  overlay['economyRegistration.basicInfo.partnerInvolvement'] = values.partnerInvolvement
  overlay['economyRegistration.basicInfo.ipsCategory'] = values.ipsCategory
  overlay['economyRegistration.basicInfo.educationCourse'] = values.educationCourse
  overlay['economyRegistration.basicInfo.sponsorId'] = values.sponsorId
  overlay['economyRegistration.basicInfo.managerContactIds'] = [...values.managerContactIds]
  overlay['economyRegistration.basicInfo.managerContactId'] = values.managerContactIds[0] ?? ''
  overlay['economyRegistration.basicInfo.operationRangeSeal'] = values.operationRange
  overlay['economyRegistration.basicInfo.operationAnchorIso'] = values.operationAnchorIso
  overlay['economyRegistration.basicInfo.surveyItems'] = surveyItemsRecordFromMenuKeys(
    values.generalSurveyMenuKeys
  )
  overlay['economyRegistration.kpi.participantCount'] = values.participantCount
  overlay['economyRegistration.kpi.instructor'] = values.instructor
  overlay['economyRegistration.kpi.dispatchedSchool'] = values.dispatchedSchool
  overlay['economyRegistration.kpi.dispatchedClass'] = values.dispatchedClass
  overlay['economyRegistration.educationCurriculum.session1.title'] =
    values.curriculumSessions[0]?.title ?? ''
  overlay['economyRegistration.educationCurriculum.session1.description'] =
    values.curriculumSessions[0]?.description ?? ''
  overlay['economyRegistration.educationCurriculum.session2.title'] =
    values.curriculumSessions[1]?.title ?? ''
  overlay['economyRegistration.educationCurriculum.session2.description'] =
    values.curriculumSessions[1]?.description ?? ''
  overlay['economyRegistration.educationScheduleSettings.dateRangeSeal'] =
    values.educationScheduleRange
  overlay['economyRegistration.wageInfo.grade1Fee'] = values.grade1Fee
  overlay['economyRegistration.wageInfo.grade1DistanceFee'] = values.grade1DistanceFee
  overlay['economyRegistration.wageInfo.grade2Fee'] = values.grade2Fee
  overlay['economyRegistration.wageInfo.grade2DistanceFee'] = values.grade2DistanceFee
  overlay['economyRegistration.wageInfo.grade3Fee'] = values.grade3Fee
  overlay['economyRegistration.wageInfo.grade3DistanceFee'] = values.grade3DistanceFee
  if (values.paymentItemValues !== undefined) {
    overlay['economyRegistration.wageInfo.paymentItemValues'] = [...values.paymentItemValues]
  }
  return overlay
}
