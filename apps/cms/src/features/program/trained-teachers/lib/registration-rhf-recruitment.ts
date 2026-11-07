/**
 * TT 등록 모집정보 — RHF typed values ↔ overlay-key adapter / Form Version serializer.
 * Overlay store를 정본으로 읽지 않는다.
 */
import type { TrainedTeachersRecruitFormState } from './registration-canonical-types'
import { normalizeTargetLevelValue } from '@/features/program/shared/lib/program-detail-info-constants'

const K = {
  maxAssignableInstructors: 'recruit.maxAssignableInstructors',
  maxClassCount: 'recruit.maxClassCount',
  maxScheduleCount: 'recruit.maxScheduleCount',
  maxSessionsPerDay: 'recruit.maxSessionsPerDay',
  announcementPublished: 'recruit.announcementPublished',
  preguidanceRequired: 'recruit.preguidanceRequired',
  studentListRequired: 'recruit.studentListRequired',
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

export function emptyTrainedTeachersRecruitFormState(): TrainedTeachersRecruitFormState {
  return {
    announcementPublished: '',
    studentListRequired: '',
    maxClassCount: null,
    maxScheduleCount: null,
    maxSessionsPerDay: null,
    programAnchorIso: null,
    programRangeSeal: null,
    recruitAnchorIso: null,
    recruitRangeSeal: null,
    finalAnnounceIso: null,
    finalAnnounceMethod: '',
    targetLevels: [],
    targetLevelDetail: '',
    inquiryContact: '',
    inquiryTel: '',
    inquiryEmail: '',
    notesNotApplicable: false,
    notes: '',
    programDescription: '',
    recruitmentGuide: '',
    applicationMethod: '',
    learningSupportContent: '',
    additionalContentHtml: '',
    otherNotes: '',
  }
}

const DETAIL = 'trainedTeachersRecruit.detailInfo'

const DETAIL_FIELD_BY_SUFFIX: Record<string, keyof TrainedTeachersRecruitFormState> = {
  programDescription: 'programDescription',
  recruitmentGuide: 'recruitmentGuide',
  applicationMethod: 'applicationMethod',
  learningSupportContent: 'learningSupportContent',
  additionalContentHtml: 'additionalContentHtml',
  otherNotes: 'otherNotes',
  thumbFileObjectId: 'thumbFileObjectId',
  thumbContentUrl: 'thumbContentUrl',
  thumbFileName: 'thumbFileName',
  attachmentFileNames: 'attachmentFileNames',
  attachmentFileObjectIds: 'attachmentFileObjectIds',
}

const INSTITUTION_FIELD_BY_KEY: Record<string, keyof TrainedTeachersRecruitFormState> = {
  [K.announcementPublished]: 'announcementPublished',
  [K.studentListRequired]: 'studentListRequired',
  [K.maxClassCount]: 'maxClassCount',
  [K.maxScheduleCount]: 'maxScheduleCount',
  [K.maxSessionsPerDay]: 'maxSessionsPerDay',
  [K.programAnchorIso]: 'programAnchorIso',
  [K.programRangeSeal]: 'programRangeSeal',
  [K.recruitAnchorIso]: 'recruitAnchorIso',
  [K.recruitRangeSeal]: 'recruitRangeSeal',
  [K.finalAnnounceIso]: 'finalAnnounceIso',
  [K.finalAnnounceMethod]: 'finalAnnounceMethod',
  [K.targetLevels]: 'targetLevels',
  [K.targetLevelDetail]: 'targetLevelDetail',
  [K.inquiryContact]: 'inquiryContact',
  [K.inquiryTel]: 'inquiryTel',
  [K.inquiryEmail]: 'inquiryEmail',
  [K.notesNotApplicable]: 'notesNotApplicable',
  [K.notes]: 'notes',
}

export function isTrainedTeachersRecruitmentOverlayKey(key: string): boolean {
  if (key.startsWith(`${DETAIL}.`)) return true
  return Object.prototype.hasOwnProperty.call(INSTITUTION_FIELD_BY_KEY, key)
}

export function isTrainedTeachersRecruitmentCatalog(templateCode: string | null | undefined): boolean {
  return templateCode == null || templateCode === '' || templateCode === 'recruitment-trained-teachers'
}

export function cloneTrainedTeachersRecruitmentState(
  state: TrainedTeachersRecruitFormState
): TrainedTeachersRecruitFormState {
  return structuredClone(state)
}

export function collectTrainedTeachersRecruitmentState(
  state: TrainedTeachersRecruitFormState
): TrainedTeachersRecruitFormState {
  return cloneTrainedTeachersRecruitmentState(state)
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

function asOptionalNumber(value: unknown): number | undefined {
  if (value == null || value === '') return undefined
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

function asNullableNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const levels = value
    .map(item => normalizeTargetLevelValue(item) ?? String(item).trim())
    .filter(Boolean)
  return [...new Set(levels)]
}

function asNumberArray(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) return undefined
  const out = value
    .map(item => (typeof item === 'number' ? item : Number(item)))
    .filter(n => Number.isFinite(n))
  return out
}

function asRange(value: unknown): TrainedTeachersRecruitFormState['programRangeSeal'] {
  if (value == null) return null
  if (typeof value !== 'object' || Array.isArray(value)) return null
  const rec = value as { start?: unknown; end?: unknown }
  return {
    start: typeof rec.start === 'string' ? rec.start : null,
    end: typeof rec.end === 'string' ? rec.end : null,
  }
}

export function readTrainedTeachersRecruitmentOverlayValue(
  state: TrainedTeachersRecruitFormState,
  key: string
): unknown {
  if (key.startsWith(`${DETAIL}.`)) {
    const field = DETAIL_FIELD_BY_SUFFIX[key.slice(DETAIL.length + 1)]
    if (field == null) return undefined
    return state[field]
  }
  const field = INSTITUTION_FIELD_BY_KEY[key]
  if (field == null) return undefined
  return state[field]
}

export function writeTrainedTeachersRecruitmentOverlayValue(
  state: TrainedTeachersRecruitFormState,
  key: string,
  value: unknown
): TrainedTeachersRecruitFormState {
  const next = cloneTrainedTeachersRecruitmentState(state)
  if (key.startsWith(`${DETAIL}.`)) {
    const field = DETAIL_FIELD_BY_SUFFIX[key.slice(DETAIL.length + 1)]
    if (field == null) return next
    if (field === 'attachmentFileObjectIds') {
      next.attachmentFileObjectIds = asNumberArray(value)
      return next
    }
    if (field === 'attachmentFileNames') {
      next.attachmentFileNames = asStringArray(value)
      return next
    }
    if (field === 'thumbFileObjectId') {
      next.thumbFileObjectId = asOptionalNumber(value)
      return next
    }
    ;(next as Record<string, unknown>)[field] =
      field === 'thumbContentUrl' || field === 'thumbFileName'
        ? asString(value) || undefined
        : asString(value)
    return next
  }
  const field = INSTITUTION_FIELD_BY_KEY[key]
  if (field == null) return next
  if (field === 'maxClassCount' || field === 'maxScheduleCount' || field === 'maxSessionsPerDay') {
    next[field] = asNullableNumber(value)
    return next
  }
  if (field === 'targetLevels') {
    next.targetLevels = asStringArray(value)
    return next
  }
  if (field === 'programRangeSeal' || field === 'recruitRangeSeal') {
    next[field] = asRange(value)
    return next
  }
  if (field === 'programAnchorIso' || field === 'recruitAnchorIso' || field === 'finalAnnounceIso') {
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

export function applyTrainedTeachersRecruitmentOverlayRecord(
  state: TrainedTeachersRecruitFormState,
  overlay: Record<string, unknown>
): TrainedTeachersRecruitFormState {
  let next = state
  for (const [key, value] of Object.entries(overlay)) {
    if (!isTrainedTeachersRecruitmentOverlayKey(key)) continue
    next = writeTrainedTeachersRecruitmentOverlayValue(next, key, value)
  }
  return next
}

export function importLegacyTrainedTeachersRecruitmentOverlay(
  overlay: Record<string, unknown>
): TrainedTeachersRecruitFormState {
  return applyTrainedTeachersRecruitmentOverlayRecord(emptyTrainedTeachersRecruitFormState(), overlay)
}

function omitBlobUrl(url: string | undefined): string | undefined {
  if (url == null || url === '' || url.startsWith('blob:')) return undefined
  return url
}

/** Form Version extensionJson.overlay 출력. store/peek를 읽지 않는다. */
export function serializeTrainedTeachersRecruitmentForFormVersion(
  state: TrainedTeachersRecruitFormState
): Record<string, unknown> {
  return {
    [K.announcementPublished]: state.announcementPublished,
    [K.studentListRequired]: state.studentListRequired,
    [K.maxClassCount]: state.maxClassCount,
    [K.maxScheduleCount]: state.maxScheduleCount,
    [K.maxSessionsPerDay]: state.maxSessionsPerDay,
    [K.maxAssignableInstructors]: 0,
    [K.preguidanceRequired]: false,
    [K.programAnchorIso]: state.programAnchorIso,
    [K.programRangeSeal]: state.programRangeSeal,
    [K.recruitAnchorIso]: state.recruitAnchorIso,
    [K.recruitRangeSeal]: state.recruitRangeSeal,
    [K.finalAnnounceIso]: state.finalAnnounceIso,
    [K.finalAnnounceMethod]: state.finalAnnounceMethod,
    [K.targetLevels]: [...state.targetLevels],
    [K.targetLevelDetail]: state.targetLevelDetail,
    [K.inquiryContact]: state.inquiryContact,
    [K.inquiryTel]: state.inquiryTel,
    [K.inquiryEmail]: state.inquiryEmail,
    [K.notesNotApplicable]: state.notesNotApplicable,
    [K.notes]: state.notes,
    [`${DETAIL}.programDescription`]: state.programDescription,
    [`${DETAIL}.recruitmentGuide`]: state.recruitmentGuide,
    [`${DETAIL}.applicationMethod`]: state.applicationMethod,
    [`${DETAIL}.learningSupportContent`]: state.learningSupportContent,
    [`${DETAIL}.additionalContentHtml`]: state.additionalContentHtml,
    [`${DETAIL}.otherNotes`]: state.otherNotes,
    [`${DETAIL}.thumbFileObjectId`]: state.thumbFileObjectId,
    [`${DETAIL}.thumbContentUrl`]: omitBlobUrl(state.thumbContentUrl),
    [`${DETAIL}.thumbFileName`]: state.thumbFileName,
    [`${DETAIL}.attachmentFileNames`]: state.attachmentFileNames ? [...state.attachmentFileNames] : [],
    [`${DETAIL}.attachmentFileObjectIds`]: state.attachmentFileObjectIds
      ? [...state.attachmentFileObjectIds]
      : [],
  }
}

export function splitTrainedTeachersRecruitmentOverlay(
  record: Record<string, unknown>
): { recruitment: Record<string, unknown>; rest: Record<string, unknown> } {
  const recruitment: Record<string, unknown> = {}
  const rest: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (isTrainedTeachersRecruitmentOverlayKey(key)) recruitment[key] = value
    else rest[key] = value
  }
  return { recruitment, rest }
}
