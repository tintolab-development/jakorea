/**
 * 1사1교 강사 모집 — RHF typed values ↔ Form Version KV adapter.
 * Overlay store를 정본으로 읽지 않는다.
 */
import { RECRUIT_ANNOUNCEMENT_PUBLISHED_DEFAULT } from '@/features/program/general/lib/recruit-radio-defaults'
import {
  COMPANY_SCHOOL_INSTRUCTOR_RECRUIT_EDITOR_KIND,
  type CompanySchoolInstructorRecruitFormState,
  type CompanySchoolRecruitDetailInfo,
  type CompanySchoolRecruitRange,
} from './registration-canonical-types'

const K = {
  recruitRangeSeal: 'recruit.instructor.recruitRangeSeal',
  programRangeSeal: 'recruit.instructor.programRangeSeal',
  recruitTargets: 'recruit.instructor.recruitTargets',
  recruitTargetDetail: 'recruit.instructor.recruitTargetDetail',
  announcementPublished: 'recruit.instructor.announcementPublished',
  inquiryContact: 'recruit.instructor.inquiryContact',
  inquiryTel: 'recruit.instructor.inquiryTel',
  inquiryEmail: 'recruit.instructor.inquiryEmail',
  notes: 'recruit.instructor.notes',
  notesNotApplicable: 'recruit.instructor.notesNotApplicable',
  finalAnnounceIso: 'recruit.instructor.finalAnnounceIso',
  finalAnnounceMethod: 'recruit.instructor.finalAnnounceMethod',
  programAnchorIso: 'recruit.instructor.programAnchorIso',
  recruitAnchorIso: 'recruit.instructor.recruitAnchorIso',
} as const

const INSTRUCTOR_DETAIL = 'recruitInstructor.detailInfo'

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

const FIELD_BY_KEY: Record<string, keyof CompanySchoolInstructorRecruitFormState> = {
  [K.announcementPublished]: 'announcementPublished',
  [K.recruitTargets]: 'recruitTargets',
  [K.recruitTargetDetail]: 'recruitTargetDetail',
  [K.programAnchorIso]: 'programAnchorIso',
  [K.programRangeSeal]: 'programRange',
  [K.recruitAnchorIso]: 'recruitAnchorIso',
  [K.recruitRangeSeal]: 'recruitRange',
  [K.finalAnnounceIso]: 'finalAnnounce',
  [K.finalAnnounceMethod]: 'finalAnnounceMethod',
  [K.inquiryContact]: 'inquiryContact',
  [K.inquiryTel]: 'inquiryTel',
  [K.inquiryEmail]: 'inquiryEmail',
  [K.notes]: 'notes',
  [K.notesNotApplicable]: 'notesNotApplicable',
}

function emptyDetailInfo(): CompanySchoolRecruitDetailInfo {
  return {
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
  }
}

export function emptyCompanySchoolInstructorRecruitFormState(): CompanySchoolInstructorRecruitFormState {
  return {
    programRange: null,
    recruitRange: null,
    recruitTargets: [],
    recruitTargetDetail: '',
    announcementPublished: undefined,
    inquiryContact: '',
    inquiryTel: '',
    inquiryEmail: '',
    notes: '',
    notesNotApplicable: undefined,
    otherNotes: '',
    finalAnnounce: null,
    finalAnnounceMethod: '',
    programAnchorIso: null,
    recruitAnchorIso: null,
    detailInfo: emptyDetailInfo(),
  }
}

export function isCompanySchoolInstructorRecruitmentOverlayKey(key: string): boolean {
  if (key.startsWith(`${INSTRUCTOR_DETAIL}.`)) return true
  return Object.prototype.hasOwnProperty.call(FIELD_BY_KEY, key)
}

export function cloneCompanySchoolInstructorRecruitFormState(
  state: CompanySchoolInstructorRecruitFormState
): CompanySchoolInstructorRecruitFormState {
  return structuredClone(state)
}

export function collectCompanySchoolInstructorRecruitmentState(
  state: CompanySchoolInstructorRecruitFormState
): CompanySchoolInstructorRecruitFormState {
  return cloneCompanySchoolInstructorRecruitFormState(state)
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
  if (key.startsWith(`${INSTRUCTOR_DETAIL}.`)) return key.slice(INSTRUCTOR_DETAIL.length + 1)
  return null
}

export function readCompanySchoolInstructorRecruitmentOverlayValue(
  state: CompanySchoolInstructorRecruitFormState,
  key: string
): unknown {
  const suffix = detailSuffix(key)
  if (suffix != null) {
    if (suffix === 'otherNotes') return state.otherNotes
    const field = DETAIL_FIELD_BY_SUFFIX[suffix]
    if (field == null) return undefined
    return state.detailInfo[field]
  }
  const field = FIELD_BY_KEY[key]
  if (field == null) return undefined
  return state[field]
}

export function writeCompanySchoolInstructorRecruitmentOverlayValue(
  state: CompanySchoolInstructorRecruitFormState,
  key: string,
  value: unknown
): CompanySchoolInstructorRecruitFormState {
  const next = cloneCompanySchoolInstructorRecruitFormState(state)
  const suffix = detailSuffix(key)
  if (suffix != null) {
    if (suffix === 'otherNotes') {
      next.otherNotes = asString(value)
      return next
    }
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
  const field = FIELD_BY_KEY[key]
  if (field == null) return next
  if (field === 'recruitTargets') {
    next.recruitTargets = asStringArray(value)
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
  if (field === 'announcementPublished') {
    if (value == null) {
      next.announcementPublished = undefined
      return next
    }
    next.announcementPublished = asString(value)
    return next
  }
  if (field === 'notesNotApplicable') {
    next.notesNotApplicable = value === true ? true : value === false ? false : undefined
    return next
  }
  ;(next as Record<string, unknown>)[field] = asString(value)
  return next
}

export function applyCompanySchoolInstructorRecruitmentOverlayRecord(
  state: CompanySchoolInstructorRecruitFormState,
  overlay: Record<string, unknown>
): CompanySchoolInstructorRecruitFormState {
  let next = state
  for (const [key, value] of Object.entries(overlay)) {
    if (!isCompanySchoolInstructorRecruitmentOverlayKey(key)) continue
    next = writeCompanySchoolInstructorRecruitmentOverlayValue(next, key, value)
  }
  return next
}

export function importLegacyCompanySchoolInstructorRecruitmentOverlay(
  overlay: Record<string, unknown>
): CompanySchoolInstructorRecruitFormState {
  return applyCompanySchoolInstructorRecruitmentOverlayRecord(
    emptyCompanySchoolInstructorRecruitFormState(),
    overlay
  )
}

/**
 * 강사 탭 미조작(undefined)만 화면 기본 게시. 명시적 '' 는 미선택으로 둔다.
 */
export function withCompanySchoolInstructorRecruitCreateDefaults(
  state: CompanySchoolInstructorRecruitFormState
): CompanySchoolInstructorRecruitFormState {
  if (state.announcementPublished !== undefined) return state
  return {
    ...cloneCompanySchoolInstructorRecruitFormState(state),
    announcementPublished: RECRUIT_ANNOUNCEMENT_PUBLISHED_DEFAULT,
  }
}

function omitBlobUrl(url: string): string {
  return url.startsWith('blob:') ? '' : url
}

/** Form Version·apply helper 출력. store/peek를 읽지 않는다. */
export function serializeCompanySchoolInstructorRecruitmentForFormVersion(
  state: CompanySchoolInstructorRecruitFormState
): Record<string, unknown> {
  const overlay: Record<string, unknown> = {
    [K.recruitTargets]: [...state.recruitTargets],
    [K.recruitTargetDetail]: state.recruitTargetDetail,
    [K.programAnchorIso]: state.programAnchorIso,
    [K.programRangeSeal]: state.programRange,
    [K.recruitAnchorIso]: state.recruitAnchorIso,
    [K.recruitRangeSeal]: state.recruitRange,
    [K.finalAnnounceIso]: state.finalAnnounce,
    [K.finalAnnounceMethod]: state.finalAnnounceMethod,
    [K.inquiryContact]: state.inquiryContact,
    [K.inquiryTel]: state.inquiryTel,
    [K.inquiryEmail]: state.inquiryEmail,
    [K.notes]: state.notes,
  }
  if (state.notesNotApplicable !== undefined) {
    overlay[K.notesNotApplicable] = state.notesNotApplicable
  }
  if (state.announcementPublished !== undefined) {
    overlay[K.announcementPublished] = state.announcementPublished
  }
  overlay[`${INSTRUCTOR_DETAIL}.programDescription`] = state.detailInfo.programDescription
  overlay[`${INSTRUCTOR_DETAIL}.recruitmentGuide`] = state.detailInfo.recruitmentGuide
  overlay[`${INSTRUCTOR_DETAIL}.applicationMethod`] = state.detailInfo.applicationMethod
  overlay[`${INSTRUCTOR_DETAIL}.learningSupportContent`] = state.detailInfo.learningSupportContent
  overlay[`${INSTRUCTOR_DETAIL}.additionalContentHtml`] = state.detailInfo.additionalContentHtml
  overlay[`${INSTRUCTOR_DETAIL}.otherNotes`] = state.otherNotes
  overlay[`${INSTRUCTOR_DETAIL}.thumbFileObjectId`] = state.detailInfo.thumbFileObjectId
  overlay[`${INSTRUCTOR_DETAIL}.thumbFileName`] = state.detailInfo.thumbFileName
  overlay[`${INSTRUCTOR_DETAIL}.thumbContentUrl`] = omitBlobUrl(state.detailInfo.thumbContentUrl)
  overlay[`${INSTRUCTOR_DETAIL}.attachmentFileNames`] = [...state.detailInfo.attachmentFileNames]
  overlay[`${INSTRUCTOR_DETAIL}.attachmentFileObjectIds`] = [
    ...state.detailInfo.attachmentFileObjectIds,
  ]
  return overlay
}

export function splitCompanySchoolInstructorRecruitmentOverlay(
  record: Record<string, unknown>
): { instructorRecruit: Record<string, unknown>; rest: Record<string, unknown> } {
  const instructorRecruit: Record<string, unknown> = {}
  const rest: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (isCompanySchoolInstructorRecruitmentOverlayKey(key)) instructorRecruit[key] = value
    else rest[key] = value
  }
  return { instructorRecruit, rest }
}

export function companySchoolInstructorRecruitEditorState(
  state: CompanySchoolInstructorRecruitFormState
): Record<string, unknown> {
  return {
    kind: COMPANY_SCHOOL_INSTRUCTOR_RECRUIT_EDITOR_KIND,
    schemaVersion: 1,
    instructorRecruit: cloneCompanySchoolInstructorRecruitFormState(state),
  }
}

export function readCompanySchoolInstructorRecruitEditorState(
  editorState: Record<string, unknown> | undefined
): CompanySchoolInstructorRecruitFormState | null {
  if (editorState?.kind !== COMPANY_SCHOOL_INSTRUCTOR_RECRUIT_EDITOR_KIND) return null
  const instructorRecruit = editorState.instructorRecruit
  if (!instructorRecruit || typeof instructorRecruit !== 'object' || Array.isArray(instructorRecruit)) {
    return null
  }
  return {
    ...emptyCompanySchoolInstructorRecruitFormState(),
    ...(instructorRecruit as CompanySchoolInstructorRecruitFormState),
  }
}
