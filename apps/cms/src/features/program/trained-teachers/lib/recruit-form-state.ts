/**
 * 교육받은 교사 모집 양식 typed state.
 * persist 는 editorState. 내부 apply 만 기존 Program merge 함수를 재사용한다.
 */
import type { Program } from '@/types/domain'
import {
  APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS,
  peekApplicantRecruitInstitutionOverlayRecord,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import { getGeneralRecruitOverlayRecord } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { applyGeneralRecruitOverlayToProgram } from '@/features/program/general/lib/general-recruit-overlay-to-program'
import { flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-additional-content-flush'
import {
  TRAINED_TEACHERS_RECRUIT_EDITOR_KIND,
  type TrainedTeachersRecruitFormState,
  type TrainedTeachersRecruitRange,
} from './registration-canonical-types'

const DETAIL = 'trainedTeachersRecruit.detailInfo'

function asString(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

function asOptionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    return Number.isFinite(n) ? n : undefined
  }
  return undefined
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(item => String(item).trim()).filter(Boolean)
}

function asNumberArray(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) return undefined
  const out = value
    .map(item => (typeof item === 'number' ? item : Number(item)))
    .filter(n => Number.isFinite(n))
  return out.length > 0 ? out : undefined
}

function asRange(value: unknown): TrainedTeachersRecruitRange | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const rec = value as { start?: unknown; end?: unknown }
  return {
    start: typeof rec.start === 'string' ? rec.start : null,
    end: typeof rec.end === 'string' ? rec.end : null,
  }
}

export function emptyTrainedTeachersRecruitFormState(): TrainedTeachersRecruitFormState {
  return {
    announcementPublished: '',
    studentListRequired: '',
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

export function collectTrainedTeachersRecruitFormState(
  overlay?: Record<string, unknown>
): TrainedTeachersRecruitFormState {
  flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay()
  const institution = peekApplicantRecruitInstitutionOverlayRecord('recruitment-trained-teachers')
  const general = overlay ?? {
    ...institution,
    ...getGeneralRecruitOverlayRecord(),
  }
  const K = APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS
  return {
    announcementPublished: asString(general[K.announcementPublished]),
    studentListRequired: asString(general[K.studentListRequired]),
    maxClassCount: asOptionalNumber(general[K.maxClassCount]),
    maxScheduleCount: asOptionalNumber(general[K.maxScheduleCount]),
    maxSessionsPerDay: asOptionalNumber(general[K.maxSessionsPerDay]),
    programAnchorIso: asString(general[K.programAnchorIso]) || null,
    programRangeSeal: asRange(general[K.programRangeSeal]),
    recruitAnchorIso: asString(general[K.recruitAnchorIso]) || null,
    recruitRangeSeal: asRange(general[K.recruitRangeSeal]),
    finalAnnounceIso: asString(general[K.finalAnnounceIso]) || null,
    finalAnnounceMethod: asString(general[K.finalAnnounceMethod]),
    targetLevels: asStringArray(general[K.targetLevels]),
    targetLevelDetail: asString(general[K.targetLevelDetail]),
    inquiryContact: asString(general[K.inquiryContact]),
    inquiryTel: asString(general[K.inquiryTel]),
    inquiryEmail: asString(general[K.inquiryEmail]),
    notesNotApplicable: general[K.notesNotApplicable] === true,
    notes: asString(general[K.notes]),
    programDescription: asString(general[`${DETAIL}.programDescription`]),
    recruitmentGuide: asString(general[`${DETAIL}.recruitmentGuide`]),
    applicationMethod: asString(general[`${DETAIL}.applicationMethod`]),
    learningSupportContent: asString(general[`${DETAIL}.learningSupportContent`]),
    additionalContentHtml: asString(general[`${DETAIL}.additionalContentHtml`]),
    otherNotes: asString(general[`${DETAIL}.otherNotes`]),
    thumbFileObjectId: asOptionalNumber(general[`${DETAIL}.thumbFileObjectId`]),
    thumbContentUrl: asString(general[`${DETAIL}.thumbContentUrl`]) || undefined,
    thumbFileName: asString(general[`${DETAIL}.thumbFileName`]) || undefined,
    attachmentFileNames: asStringArray(general[`${DETAIL}.attachmentFileNames`]),
    attachmentFileObjectIds: asNumberArray(general[`${DETAIL}.attachmentFileObjectIds`]),
  }
}

/** persist/bind 용 키 레코드. 신규 form version overlay 로 저장하지 않는다. */
export function trainedTeachersRecruitStateToApplyRecord(
  state: TrainedTeachersRecruitFormState
): Record<string, unknown> {
  const K = APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS
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
    [K.targetLevels]: state.targetLevels,
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
    [`${DETAIL}.thumbContentUrl`]: state.thumbContentUrl,
    [`${DETAIL}.thumbFileName`]: state.thumbFileName,
    [`${DETAIL}.attachmentFileNames`]: state.attachmentFileNames,
    [`${DETAIL}.attachmentFileObjectIds`]: state.attachmentFileObjectIds,
  }
}

export function applyTrainedTeachersRecruitToProgram(
  program: Program,
  state: TrainedTeachersRecruitFormState
): Program {
  return applyGeneralRecruitOverlayToProgram(
    program,
    trainedTeachersRecruitStateToApplyRecord(state),
    { preferOverlay: true }
  )
}

export function trainedTeachersRecruitEditorState(
  state: TrainedTeachersRecruitFormState
): Record<string, unknown> {
  return {
    kind: TRAINED_TEACHERS_RECRUIT_EDITOR_KIND,
    schemaVersion: 1,
    recruit: state,
  }
}

export function readTrainedTeachersRecruitEditorState(
  editorState: Record<string, unknown> | undefined
): TrainedTeachersRecruitFormState | null {
  if (editorState?.kind !== TRAINED_TEACHERS_RECRUIT_EDITOR_KIND) return null
  const recruit = editorState.recruit
  if (!recruit || typeof recruit !== 'object' || Array.isArray(recruit)) return null
  return { ...emptyTrainedTeachersRecruitFormState(), ...(recruit as TrainedTeachersRecruitFormState) }
}
