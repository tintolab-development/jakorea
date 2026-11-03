/**
 * 1사1교 기관 모집(recruitment-economy) — RHF typed values ↔ overlay-key adapter.
 * Overlay store를 정본으로 읽지 않는다.
 */
import type {
  CompanySchoolRecruitDetailInfo,
  CompanySchoolRecruitFormState,
  CompanySchoolRecruitRange,
} from './registration-canonical-types'
import { isCompanySchoolInstructorRecruitmentOverlayKey } from './registration-rhf-instructor-recruitment'

const K = {
  maxAssignableInstructors: 'recruit.maxAssignableInstructors',
  maxClassCount: 'recruit.maxClassCount',
  maxScheduleCount: 'recruit.maxScheduleCount',
  maxSessionsPerDay: 'recruit.maxSessionsPerDay',
  announcementPublished: 'recruit.announcementPublished',
  preguidanceRequired: 'recruit.preguidanceRequired',
  studentListRequired: 'recruit.studentListRequired',
  certificateProvided: 'recruit.certificateProvided',
  programAnchorIso: 'recruit.programAnchorIso',
  programRangeSeal: 'recruit.programRangeSeal',
  recruitAnchorIso: 'recruit.recruitAnchorIso',
  recruitRangeSeal: 'recruit.recruitRangeSeal',
  finalAnnounceIso: 'recruit.finalAnnounceIso',
  finalAnnounceMethod: 'recruit.finalAnnounceMethod',
  targetLevels: 'recruit.targetLevels',
  targetLevelDetail: 'recruit.targetLevelDetail',
  inquiryContact: 'recruit.inquiryContact',
  inquiryTel: 'recruit.inquiryTel',
  inquiryEmail: 'recruit.inquiryEmail',
  notesNotApplicable: 'recruit.notesNotApplicable',
  notes: 'recruit.notes',
} as const

const ECONOMY_DETAIL = 'economyRecruit.detailInfo'
const CANONICAL_DETAIL = 'recruit.detailInfo'

const DETAIL_FIELD_BY_SUFFIX: Record<string, keyof CompanySchoolRecruitDetailInfo> = {
  programDescription: 'programDescription',
  recruitmentGuide: 'recruitmentGuide',
  applicationMethod: 'applicationMethod',
  learningSupportContent: 'learningSupportContent',
  additionalContentHtml: 'additionalContentHtml',
  thumbFileObjectId: 'thumbFileObjectId',
  thumbContentUrl: 'thumbContentUrl',
  thumbFileName: 'thumbFileName',
  thumbObjectUrl: 'thumbContentUrl',
  attachmentFileNames: 'attachmentFileNames',
  attachmentFileObjectIds: 'attachmentFileObjectIds',
}

const INSTITUTION_FIELD_BY_KEY: Record<string, keyof CompanySchoolRecruitFormState> = {
  [K.announcementPublished]: 'announcementPublished',
  [K.preguidanceRequired]: 'preguidanceRequired',
  [K.studentListRequired]: 'studentListRequired',
  [K.certificateProvided]: 'certificateProvided',
  [K.maxAssignableInstructors]: 'maxAssignableInstructors',
  [K.maxClassCount]: 'maxClassCount',
  [K.maxScheduleCount]: 'maxScheduleCount',
  [K.maxSessionsPerDay]: 'maxSessionsPerDay',
  [K.programAnchorIso]: 'programAnchorIso',
  [K.programRangeSeal]: 'programRange',
  [K.recruitAnchorIso]: 'recruitAnchorIso',
  [K.recruitRangeSeal]: 'recruitRange',
  [K.finalAnnounceIso]: 'finalAnnounce',
  [K.finalAnnounceMethod]: 'finalAnnounceMethod',
  [K.targetLevels]: 'targetLevels',
  [K.targetLevelDetail]: 'targetLevelDetail',
  [K.inquiryContact]: 'inquiryContact',
  [K.inquiryTel]: 'inquiryTel',
  [K.inquiryEmail]: 'inquiryEmail',
  [K.notesNotApplicable]: 'notesNotApplicable',
  [K.notes]: 'notes',
}

export function emptyCompanySchoolRecruitFormState(): CompanySchoolRecruitFormState {
  return {
    programRange: null,
    recruitRange: null,
    finalAnnounce: null,
    finalAnnounceMethod: '',
    maxAssignableInstructors: null,
    maxClassCount: null,
    maxScheduleCount: null,
    maxSessionsPerDay: null,
    targetLevels: [],
    targetLevelDetail: '',
    inquiryContact: '',
    inquiryTel: '',
    inquiryEmail: '',
    announcementPublished: '',
    preguidanceRequired: '',
    studentListRequired: '',
    certificateProvided: '',
    notes: '',
    notesNotApplicable: false,
    detailInfo: {
      programDescription: '',
      recruitmentGuide: '',
      applicationMethod: '',
      learningSupportContent: '',
      additionalContentHtml: '',
      thumbFileObjectId: null,
      attachmentFileObjectIds: [],
      thumbFileName: '',
      thumbContentUrl: '',
      attachmentFileNames: [],
    },
    programAnchorIso: null,
    recruitAnchorIso: null,
  }
}

export function isCompanySchoolRecruitmentCatalog(
  templateCode: string | null | undefined
): boolean {
  return (
    templateCode == null ||
    templateCode === '' ||
    templateCode === 'recruitment-economy'
  )
}

export function isCompanySchoolOwnedRecruitmentCatalog(
  templateCode: string | null | undefined
): boolean {
  return isCompanySchoolRecruitmentCatalog(templateCode) || templateCode === 'recruitment-instructor'
}

export function isCompanySchoolInstitutionRecruitmentOverlayKey(key: string): boolean {
  if (key.startsWith(`${ECONOMY_DETAIL}.`) || key.startsWith(`${CANONICAL_DETAIL}.`)) return true
  return Object.prototype.hasOwnProperty.call(INSTITUTION_FIELD_BY_KEY, key)
}

export function isCompanySchoolRecruitmentOverlayKey(key: string): boolean {
  return (
    isCompanySchoolInstitutionRecruitmentOverlayKey(key) ||
    isCompanySchoolInstructorRecruitmentOverlayKey(key)
  )
}

export function cloneCompanySchoolRecruitFormState(
  state: CompanySchoolRecruitFormState
): CompanySchoolRecruitFormState {
  return structuredClone(state)
}

export function collectCompanySchoolRecruitmentState(
  state: CompanySchoolRecruitFormState
): CompanySchoolRecruitFormState {
  return cloneCompanySchoolRecruitFormState(state)
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

function asNullableNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function asNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value
    .map(item => (typeof item === 'number' ? item : Number(item)))
    .filter(n => Number.isFinite(n))
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(item => String(item))
}

function asRange(value: unknown): CompanySchoolRecruitRange | null {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return null
  const start = (value as { start?: unknown }).start
  const end = (value as { end?: unknown }).end
  if (typeof start !== 'string' || typeof end !== 'string') return null
  if (!start.trim() || !end.trim()) return null
  return { start, end }
}

function detailSuffix(key: string): string | null {
  if (key.startsWith(`${ECONOMY_DETAIL}.`)) return key.slice(ECONOMY_DETAIL.length + 1)
  if (key.startsWith(`${CANONICAL_DETAIL}.`)) return key.slice(CANONICAL_DETAIL.length + 1)
  return null
}

export function readCompanySchoolRecruitmentOverlayValue(
  state: CompanySchoolRecruitFormState,
  key: string
): unknown {
  const suffix = detailSuffix(key)
  if (suffix != null) {
    const field = DETAIL_FIELD_BY_SUFFIX[suffix]
    if (field == null) return undefined
    return state.detailInfo[field]
  }
  const field = INSTITUTION_FIELD_BY_KEY[key]
  if (field == null) return undefined
  return state[field]
}

export function writeCompanySchoolRecruitmentOverlayValue(
  state: CompanySchoolRecruitFormState,
  key: string,
  value: unknown
): CompanySchoolRecruitFormState {
  const next = cloneCompanySchoolRecruitFormState(state)
  const suffix = detailSuffix(key)
  if (suffix != null) {
    const field = DETAIL_FIELD_BY_SUFFIX[suffix]
    if (field == null) return next
    if (field === 'attachmentFileObjectIds') {
      next.detailInfo.attachmentFileObjectIds = asNumberArray(value)
      return next
    }
    if (field === 'attachmentFileNames') {
      next.detailInfo.attachmentFileNames = asStringArray(value)
      return next
    }
    if (field === 'thumbFileObjectId') {
      next.detailInfo.thumbFileObjectId = asNullableNumber(value)
      return next
    }
    next.detailInfo[field] = asString(value)
    return next
  }
  const field = INSTITUTION_FIELD_BY_KEY[key]
  if (field == null) return next
  if (
    field === 'maxAssignableInstructors' ||
    field === 'maxClassCount' ||
    field === 'maxScheduleCount' ||
    field === 'maxSessionsPerDay'
  ) {
    next[field] = asNullableNumber(value)
    return next
  }
  if (field === 'targetLevels') {
    next.targetLevels = asStringArray(value)
    return next
  }
  if (field === 'programRange' || field === 'recruitRange') {
    next[field] = asRange(value)
    return next
  }
  if (field === 'programAnchorIso' || field === 'recruitAnchorIso' || field === 'finalAnnounce') {
    next[field] = asString(value) || null
    return next
  }
  if (field === 'notesNotApplicable') {
    next.notesNotApplicable = value === true
    return next
  }
  ;(next as Record<string, unknown>)[field] = asString(value)
  return next
}

export function applyCompanySchoolRecruitmentOverlayRecord(
  state: CompanySchoolRecruitFormState,
  overlay: Record<string, unknown>
): CompanySchoolRecruitFormState {
  const rest: Array<[string, unknown]> = []
  const economyDetail: Array<[string, unknown]> = []
  const recruitDetail: Array<[string, unknown]> = []
  for (const [key, value] of Object.entries(overlay)) {
    if (!isCompanySchoolInstitutionRecruitmentOverlayKey(key)) continue
    if (key.startsWith(`${CANONICAL_DETAIL}.`)) recruitDetail.push([key, value])
    else if (key.startsWith(`${ECONOMY_DETAIL}.`)) economyDetail.push([key, value])
    else rest.push([key, value])
  }
  let next = state
  for (const [key, value] of rest) {
    next = writeCompanySchoolRecruitmentOverlayValue(next, key, value)
  }
  for (const [key, value] of economyDetail) {
    next = writeCompanySchoolRecruitmentOverlayValue(next, key, value)
  }
  for (const [key, value] of recruitDetail) {
    next = writeCompanySchoolRecruitmentOverlayValue(next, key, value)
  }
  return next
}

export function importLegacyCompanySchoolRecruitmentOverlay(
  overlay: Record<string, unknown>
): CompanySchoolRecruitFormState {
  return applyCompanySchoolRecruitmentOverlayRecord(emptyCompanySchoolRecruitFormState(), overlay)
}

function omitBlobUrl(url: string): string {
  return url.startsWith('blob:') ? '' : url
}

function writeDetail(
  overlay: Record<string, unknown>,
  suffix: string,
  value: unknown
): void {
  overlay[`${ECONOMY_DETAIL}.${suffix}`] = value
  overlay[`${CANONICAL_DETAIL}.${suffix}`] = value
}

/** Form Version·apply helper 출력. store/peek를 읽지 않는다. */
export function serializeCompanySchoolRecruitmentForFormVersion(
  state: CompanySchoolRecruitFormState
): Record<string, unknown> {
  const overlay: Record<string, unknown> = {
    [K.announcementPublished]: state.announcementPublished,
    [K.preguidanceRequired]: state.preguidanceRequired,
    [K.studentListRequired]: state.studentListRequired,
    [K.certificateProvided]: state.certificateProvided,
    [K.maxAssignableInstructors]: state.maxAssignableInstructors,
    [K.maxClassCount]: state.maxClassCount,
    [K.maxScheduleCount]: state.maxScheduleCount,
    [K.maxSessionsPerDay]: state.maxSessionsPerDay,
    [K.programAnchorIso]: state.programAnchorIso,
    [K.programRangeSeal]: state.programRange,
    [K.recruitAnchorIso]: state.recruitAnchorIso,
    [K.recruitRangeSeal]: state.recruitRange,
    [K.finalAnnounceIso]: state.finalAnnounce,
    [K.finalAnnounceMethod]: state.finalAnnounceMethod,
    [K.targetLevels]: [...state.targetLevels],
    [K.targetLevelDetail]: state.targetLevelDetail,
    [K.inquiryContact]: state.inquiryContact,
    [K.inquiryTel]: state.inquiryTel,
    [K.inquiryEmail]: state.inquiryEmail,
    [K.notesNotApplicable]: state.notesNotApplicable,
    [K.notes]: state.notes,
  }
  writeDetail(overlay, 'programDescription', state.detailInfo.programDescription)
  writeDetail(overlay, 'recruitmentGuide', state.detailInfo.recruitmentGuide)
  writeDetail(overlay, 'applicationMethod', state.detailInfo.applicationMethod)
  writeDetail(overlay, 'learningSupportContent', state.detailInfo.learningSupportContent)
  writeDetail(overlay, 'additionalContentHtml', state.detailInfo.additionalContentHtml)
  writeDetail(overlay, 'thumbFileObjectId', state.detailInfo.thumbFileObjectId)
  writeDetail(overlay, 'thumbFileName', state.detailInfo.thumbFileName)
  writeDetail(overlay, 'thumbContentUrl', omitBlobUrl(state.detailInfo.thumbContentUrl))
  writeDetail(overlay, 'attachmentFileNames', [...state.detailInfo.attachmentFileNames])
  writeDetail(overlay, 'attachmentFileObjectIds', [...state.detailInfo.attachmentFileObjectIds])
  return overlay
}

export function omitCompanySchoolRecruitmentOverlayKeys(
  overlay: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(overlay).filter(([key]) => !isCompanySchoolRecruitmentOverlayKey(key))
  )
}

export function splitCompanySchoolRecruitmentOverlay(
  record: Record<string, unknown>
): { recruitment: Record<string, unknown>; rest: Record<string, unknown> } {
  const recruitment: Record<string, unknown> = {}
  const rest: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (isCompanySchoolInstitutionRecruitmentOverlayKey(key)) recruitment[key] = value
    else rest[key] = value
  }
  return { recruitment, rest }
}
