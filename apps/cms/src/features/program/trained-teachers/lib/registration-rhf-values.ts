/**
 * 교육받은 교사 등록 공통정보 RHF 값.
 * 제품 정본은 canonical 필드. sidecar는 UI overlay 키 호환용이며 overlay store가 아니다.
 */
import type { GeneralProgramSurveyMenuKey } from '@/types/domain'
import type { ProgramRegistrationParticipantSelection } from '@/features/template/lib/program-registration-editor-state'
import type { ProgramRegistrationScheduleDetailKind } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import {
  surveyItemsRecordFromMenuKeys,
  surveyMenuKeysFromRegistrationOverlay,
} from '@/features/program/general/lib/general-survey-menu-keys'
import { educationScheduleRangeFromPeriodLines } from '@/features/template/lib/format-education-schedule-line'
import {
  applyTrainedTeachersApplicationOverlayRecord,
  emptyTrainedTeachersApplicationFormState,
  isTrainedTeachersApplicationOverlayKey,
} from './registration-rhf-application'
import {
  applyTrainedTeachersRecruitmentOverlayRecord,
  emptyTrainedTeachersRecruitFormState,
  isTrainedTeachersRecruitmentOverlayKey,
} from './registration-rhf-recruitment'
import {
  TRAINED_TEACHERS_REGISTRATION_CANONICAL_VERSION,
  type TrainedTeachersApplicationFormState,
  type TrainedTeachersRecruitFormState,
  type TrainedTeachersRegistrationCommonCanonical,
  type TrainedTeachersRegistrationEditorMeta,
} from './registration-canonical-types'

export type TrainedTeachersRegistrationRhfValues = TrainedTeachersRegistrationCommonCanonical & {
  educationFormScheduleDetail: ProgramRegistrationScheduleDetailKind
  participationScheduleDetail: ProgramRegistrationScheduleDetailKind
  ipsScheduleDetail: ProgramRegistrationScheduleDetailKind
  curriculumSessionCount: number
  curriculumChartSessionCount: number
  scheduleCurriculumDetailCount: number
  scheduleCurriculumGroupCount: number
  participant: ProgramRegistrationParticipantSelection
  sidecar: Record<string, unknown>
  recruitment: TrainedTeachersRecruitFormState
  application: TrainedTeachersApplicationFormState
}

const COMMON_INFO_PREFIXES = [
  'trainedTeachersRegistration.basicInfo.',
  'trainedTeachersRegistration.typeSettings.',
  'trainedTeachersRegistration.educationCurriculum.',
  'trainedTeachersRegistration.educationScheduleCurriculum.',
  'trainedTeachersRegistration.educationScheduleSettings.',
  'generalRegistration.basicInfo.',
  'generalRegistration.typeSettings.',
  'generalRegistration.educationCurriculum.',
  'generalRegistration.educationScheduleCurriculum.',
  'generalRegistration.educationScheduleSettings.',
] as const

const FIELD_BY_SUFFIX: Record<string, keyof TrainedTeachersRegistrationCommonCanonical> = {
  programTitleKo: 'mainTitle',
  localProgramTitleKo: 'mainTitle',
  programTitleEn: 'titleEn',
  publicProgramTitle: 'announcementTitle',
  detailedProgramId: 'detailedProgramId',
  detailedProgramName: 'detailedProgramName',
  textbookName: 'textbookName',
  businessField: 'businessArea',
  educationVenueKind: 'venueKind',
  educationVenueDetail: 'venueDetail',
  educationCourse: 'educationProcess',
  ipOwned: 'ipOwned',
  courseDeliveredBy: 'courseDeliveredBy',
  educationJournalEnabled: 'educationJournalEnabled',
  scheduleLines: 'educationScheduleLines',
}

const SPONSOR_ID_SUFFIXES = new Set(['sponsorId', 'localSponsorId'])
const SPONSOR_IDS_SUFFIXES = new Set(['sponsorIds', 'localSponsorIds'])
const CONTACT_ID_SUFFIXES = new Set(['managerContactId', 'localManagerContactId'])
const CONTACT_IDS_SUFFIXES = new Set(['managerContactIds', 'localManagerContactIds'])

export function isTrainedTeachersCommonInfoOverlayKey(key: string): boolean {
  return COMMON_INFO_PREFIXES.some(prefix => key.startsWith(prefix))
}

export function omitTrainedTeachersCommonInfoOverlayKeys(
  overlay: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(overlay).filter(([key]) => !isTrainedTeachersCommonInfoOverlayKey(key))
  )
}

function suffixOf(key: string): string {
  const lastDot = key.lastIndexOf('.')
  return lastDot >= 0 ? key.slice(lastDot + 1) : key
}

function defaultParticipant(): ProgramRegistrationParticipantSelection {
  return {
    individual: false,
    organization: true,
    teacherInstructor: false,
    volunteer: false,
  }
}

export function createDefaultTrainedTeachersRegistrationRhfValues(
  extras?: Partial<TrainedTeachersRegistrationEditorMeta>
): TrainedTeachersRegistrationRhfValues {
  const educationStructure = extras?.educationStructure ?? 'curriculum'
  const sessionRound = extras?.sessionRound ?? 'single'
  return {
    title: '',
    mainTitle: '',
    titleEn: '',
    announcementTitle: '',
    detailedProgramId: '',
    detailedProgramName: '',
    textbookName: '',
    businessArea: '',
    partnerInvolvement: true,
    sponsorManagementIds: [],
    sponsorManagerContactIds: [],
    venueDetail: '',
    educationStructure,
    sessionRound,
    teacherTrainingEnabled: extras?.teacherTrainingEnabled ?? false,
    educationJournalEnabled: false,
    curriculumSessions: [],
    scheduleDetails: [],
    educationScheduleMode: extras?.educationScheduleMode ?? 'date',
    educationScheduleLines: [],
    educationScheduleRange: null,
    generalSurveyMenuKeys: ['survey', 'satisfaction', 'lecture_evaluation'],
    educationFormScheduleDetail: extras?.educationFormScheduleDetail ?? 'common',
    participationScheduleDetail: extras?.participationScheduleDetail ?? 'common',
    ipsScheduleDetail: extras?.ipsScheduleDetail ?? 'common',
    curriculumSessionCount: extras?.curriculumSessionCount ?? 1,
    curriculumChartSessionCount: extras?.curriculumChartSessionCount ?? 1,
    scheduleCurriculumDetailCount: extras?.scheduleCurriculumDetailCount ?? 1,
    scheduleCurriculumGroupCount: extras?.scheduleCurriculumGroupCount ?? 1,
    participant: extras?.participant ?? defaultParticipant(),
    sidecar: {},
    recruitment: emptyTrainedTeachersRecruitFormState(),
    application: emptyTrainedTeachersApplicationFormState(),
  }
}

export function cloneTrainedTeachersRegistrationRhfValues(
  values: TrainedTeachersRegistrationRhfValues
): TrainedTeachersRegistrationRhfValues {
  return structuredClone(values)
}

export function trainedTeachersRhfToEditorMeta(
  values: TrainedTeachersRegistrationRhfValues
): TrainedTeachersRegistrationEditorMeta {
  return {
    educationStructure: values.educationStructure,
    sessionRound: values.sessionRound,
    educationFormScheduleDetail: values.educationFormScheduleDetail,
    participationScheduleDetail: values.participationScheduleDetail,
    ipsScheduleDetail: values.ipsScheduleDetail,
    curriculumSessionCount: values.curriculumSessionCount,
    curriculumChartSessionCount: values.curriculumChartSessionCount,
    scheduleCurriculumDetailCount: values.scheduleCurriculumDetailCount,
    scheduleCurriculumGroupCount: values.scheduleCurriculumGroupCount,
    educationScheduleMode: values.educationScheduleMode,
    teacherTrainingEnabled: values.teacherTrainingEnabled,
    participant: values.participant,
  }
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    const single = typeof value === 'string' ? value.trim() : ''
    return single ? [single] : []
  }
  return [...new Set(value.map(item => String(item).trim()).filter(Boolean))]
}

function partnerInvolvementFromOverlay(value: unknown): boolean {
  if (value === false || value === 'no') return false
  return true
}

function partnerInvolvementToOverlay(value: boolean): string {
  return value ? 'yes' : 'no'
}

const derivedOverlaySnapshotCache = new Map<string, { token: string; value: unknown }>()

function cachedDerivedOverlaySnapshot(key: string, token: string, create: () => unknown): unknown {
  const hit = derivedOverlaySnapshotCache.get(key)
  if (hit?.token === token) return hit.value
  const value = create()
  derivedOverlaySnapshotCache.set(key, { token, value })
  return value
}

export function readTrainedTeachersRhfOverlayValue(
  values: TrainedTeachersRegistrationRhfValues,
  key: string
): unknown {
  if (!isTrainedTeachersCommonInfoOverlayKey(key)) return undefined
  if (Object.prototype.hasOwnProperty.call(values.sidecar, key)) {
    return values.sidecar[key]
  }
  const suffix = suffixOf(key)
  if (suffix === 'surveyItems') {
    return cachedDerivedOverlaySnapshot(
      key,
      values.generalSurveyMenuKeys.join('\u0001'),
      () => surveyItemsRecordFromMenuKeys(values.generalSurveyMenuKeys)
    )
  }
  if (SPONSOR_IDS_SUFFIXES.has(suffix) || SPONSOR_ID_SUFFIXES.has(suffix)) {
    return SPONSOR_IDS_SUFFIXES.has(suffix)
      ? values.sponsorManagementIds
      : (values.sponsorManagementIds[0] ?? '')
  }
  if (CONTACT_IDS_SUFFIXES.has(suffix) || CONTACT_ID_SUFFIXES.has(suffix)) {
    return CONTACT_IDS_SUFFIXES.has(suffix)
      ? values.sponsorManagerContactIds
      : (values.sponsorManagerContactIds[0] ?? '')
  }
  if (suffix === 'partnerInvolvement') {
    return partnerInvolvementToOverlay(values.partnerInvolvement)
  }
  if (suffix === 'operationRangeSeal') {
    if (values.startDate == null && values.endDate == null) return null
    return cachedDerivedOverlaySnapshot(
      key,
      `${values.startDate ?? ''}\u0001${values.endDate ?? ''}`,
      () => ({ start: values.startDate ?? '', end: values.endDate ?? '' })
    )
  }
  const field = FIELD_BY_SUFFIX[suffix]
  if (field != null) return values[field]
  return values.sidecar[key]
}

export function writeTrainedTeachersRhfOverlayValue(
  values: TrainedTeachersRegistrationRhfValues,
  key: string,
  value: unknown
): TrainedTeachersRegistrationRhfValues {
  if (!isTrainedTeachersCommonInfoOverlayKey(key)) return values
  const next = cloneTrainedTeachersRegistrationRhfValues(values)
  const suffix = suffixOf(key)
  if (suffix === 'surveyItems') {
    const keys = surveyMenuKeysFromRegistrationOverlay({
      'trainedTeachersRegistration.basicInfo.surveyItems': value,
    })
    next.generalSurveyMenuKeys = keys ?? []
    return next
  }
  if (SPONSOR_IDS_SUFFIXES.has(suffix)) {
    next.sponsorManagementIds = asStringList(value)
    return next
  }
  if (SPONSOR_ID_SUFFIXES.has(suffix)) {
    const id = typeof value === 'string' ? value.trim() : ''
    next.sponsorManagementIds = id ? [id] : []
    return next
  }
  if (CONTACT_IDS_SUFFIXES.has(suffix)) {
    next.sponsorManagerContactIds = asStringList(value)
    return next
  }
  if (CONTACT_ID_SUFFIXES.has(suffix)) {
    const id = typeof value === 'string' ? value.trim() : ''
    next.sponsorManagerContactIds = id ? [id] : []
    return next
  }
  if (suffix === 'partnerInvolvement') {
    next.partnerInvolvement = partnerInvolvementFromOverlay(value)
    return next
  }
  if (suffix === 'operationRangeSeal') {
    const seal = value as { start?: string; end?: string } | null
    next.startDate = seal?.start || undefined
    next.endDate = seal?.end || undefined
    next.sidecar[key] = value
    return next
  }
  const field = FIELD_BY_SUFFIX[suffix]
  if (field != null) {
    ;(next as Record<string, unknown>)[field] = value
    if (field === 'educationScheduleLines') {
      next.educationScheduleLines = Array.isArray(value)
        ? value.filter((line): line is string => typeof line === 'string')
        : []
      next.educationScheduleRange = educationScheduleRangeFromPeriodLines({
        mode: next.educationScheduleMode,
        lines: next.educationScheduleLines,
      })
    }
    return next
  }
  next.sidecar[key] = value
  return next
}

export function applyTrainedTeachersRhfOverlayRecord(
  values: TrainedTeachersRegistrationRhfValues,
  overlay: Record<string, unknown>
): TrainedTeachersRegistrationRhfValues {
  let next = values
  const recruitPartial: Record<string, unknown> = {}
  const applicationPartial: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(overlay)) {
    if (isTrainedTeachersRecruitmentOverlayKey(key)) {
      recruitPartial[key] = value
      continue
    }
    if (isTrainedTeachersApplicationOverlayKey(key)) {
      applicationPartial[key] = value
      continue
    }
    if (!isTrainedTeachersCommonInfoOverlayKey(key)) continue
    next = writeTrainedTeachersRhfOverlayValue(next, key, value)
  }
  if (Object.keys(recruitPartial).length > 0) {
    next = {
      ...next,
      recruitment: applyTrainedTeachersRecruitmentOverlayRecord(next.recruitment, recruitPartial),
    }
  }
  if (Object.keys(applicationPartial).length > 0) {
    next = {
      ...next,
      application: applyTrainedTeachersApplicationOverlayRecord(
        next.application ?? emptyTrainedTeachersApplicationFormState(),
        applicationPartial
      ),
    }
  }
  return next
}

export function projectTrainedTeachersRhfToOverlayRecord(
  values: TrainedTeachersRegistrationRhfValues
): Record<string, unknown> {
  const overlay: Record<string, unknown> = { ...values.sidecar }
  overlay['trainedTeachersRegistration.basicInfo.programTitleKo'] = values.mainTitle
  overlay['trainedTeachersRegistration.basicInfo.programTitleEn'] = values.titleEn
  overlay['trainedTeachersRegistration.basicInfo.publicProgramTitle'] = values.announcementTitle
  overlay['trainedTeachersRegistration.basicInfo.detailedProgramId'] = values.detailedProgramId
  overlay['trainedTeachersRegistration.basicInfo.detailedProgramName'] = values.detailedProgramName
  overlay['trainedTeachersRegistration.basicInfo.textbookName'] = values.textbookName
  overlay['trainedTeachersRegistration.basicInfo.businessField'] = values.businessArea
  overlay['trainedTeachersRegistration.basicInfo.educationVenueKind'] = values.venueKind
  overlay['trainedTeachersRegistration.basicInfo.educationVenueDetail'] = values.venueDetail
  overlay['trainedTeachersRegistration.basicInfo.educationCourse'] = values.educationProcess
  overlay['trainedTeachersRegistration.basicInfo.ipOwned'] = values.ipOwned
  overlay['trainedTeachersRegistration.basicInfo.courseDeliveredBy'] = values.courseDeliveredBy
  overlay['trainedTeachersRegistration.basicInfo.partnerInvolvement'] =
    partnerInvolvementToOverlay(values.partnerInvolvement)
  overlay['trainedTeachersRegistration.basicInfo.sponsorIds'] = [...values.sponsorManagementIds]
  overlay['trainedTeachersRegistration.basicInfo.sponsorId'] = values.sponsorManagementIds[0] ?? ''
  overlay['trainedTeachersRegistration.basicInfo.managerContactIds'] = [
    ...values.sponsorManagerContactIds,
  ]
  overlay['trainedTeachersRegistration.basicInfo.managerContactId'] =
    values.sponsorManagerContactIds[0] ?? ''
  overlay['trainedTeachersRegistration.basicInfo.surveyItems'] = surveyItemsRecordFromMenuKeys(
    values.generalSurveyMenuKeys
  )
  overlay['trainedTeachersRegistration.educationCurriculum.educationJournalEnabled'] =
    values.educationJournalEnabled
  overlay['trainedTeachersRegistration.educationScheduleSettings.scheduleLines'] = [
    ...values.educationScheduleLines,
  ]
  if (values.startDate != null || values.endDate != null) {
    overlay['trainedTeachersRegistration.basicInfo.operationRangeSeal'] = {
      start: values.startDate ?? '',
      end: values.endDate ?? '',
    }
  }
  return overlay
}

function overlayStringBySuffix(overlay: Record<string, unknown>, suffix: string): string {
  for (const [key, value] of Object.entries(overlay)) {
    if (!isTrainedTeachersCommonInfoOverlayKey(key)) continue
    if (suffixOf(key) !== suffix) continue
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

/**
 * RHF 제목이 비어 있을 때만 overlay(programTitleKo 등)로 채운다.
 * hydrate가 title/mainTitle을 서로 덮지 않게 빈 칸만 보정한다.
 */
export function fillEmptyTrainedTeachersTitlesFromOverlay(
  values: TrainedTeachersRegistrationRhfValues,
  overlay: Record<string, unknown>
): TrainedTeachersRegistrationRhfValues {
  const mainTitle =
    values.mainTitle.trim() || overlayStringBySuffix(overlay, 'programTitleKo')
  const titleEn = values.titleEn.trim() || overlayStringBySuffix(overlay, 'programTitleEn')
  const announcementTitle =
    values.announcementTitle.trim() ||
    overlayStringBySuffix(overlay, 'publicProgramTitle')
  if (
    mainTitle === values.mainTitle &&
    titleEn === values.titleEn &&
    announcementTitle === values.announcementTitle
  ) {
    return values
  }
  return {
    ...values,
    mainTitle,
    titleEn,
    announcementTitle,
    title: announcementTitle || values.title,
  }
}

export function rhfValuesFromTrainedTeachersCanonicalCommon(
  common: TrainedTeachersRegistrationCommonCanonical,
  editor: TrainedTeachersRegistrationEditorMeta,
  sidecar?: Record<string, unknown>,
  recruitment?: TrainedTeachersRecruitFormState,
  application?: TrainedTeachersApplicationFormState
): TrainedTeachersRegistrationRhfValues {
  return {
    ...createDefaultTrainedTeachersRegistrationRhfValues(editor),
    ...common,
    sponsorManagementIds: [...common.sponsorManagementIds],
    sponsorManagerContactIds: [...common.sponsorManagerContactIds],
    curriculumSessions: [...common.curriculumSessions],
    scheduleDetails: [...common.scheduleDetails],
    educationScheduleLines: [...common.educationScheduleLines],
    educationScheduleRange: educationScheduleRangeFromPeriodLines({
      mode: common.educationScheduleMode,
      lines: common.educationScheduleLines,
    }),
    generalSurveyMenuKeys: [...common.generalSurveyMenuKeys] as GeneralProgramSurveyMenuKey[],
    educationStructure: common.educationStructure,
    sessionRound: common.sessionRound,
    teacherTrainingEnabled: common.teacherTrainingEnabled,
    educationScheduleMode: common.educationScheduleMode,
    educationFormScheduleDetail: editor.educationFormScheduleDetail,
    participationScheduleDetail: editor.participationScheduleDetail,
    ipsScheduleDetail: editor.ipsScheduleDetail,
    curriculumSessionCount: editor.curriculumSessionCount,
    curriculumChartSessionCount: editor.curriculumChartSessionCount,
    scheduleCurriculumDetailCount: editor.scheduleCurriculumDetailCount,
    scheduleCurriculumGroupCount: editor.scheduleCurriculumGroupCount,
    participant: editor.participant,
    sidecar: sidecar ? { ...sidecar } : {},
    recruitment: recruitment
      ? structuredClone(recruitment)
      : emptyTrainedTeachersRecruitFormState(),
    application: application
      ? structuredClone(application)
      : emptyTrainedTeachersApplicationFormState(),
  }
}

export function isTrainedTeachersRegistrationCanonicalSnapshot(
  value: unknown
):   value is {
    schemaVersion: typeof TRAINED_TEACHERS_REGISTRATION_CANONICAL_VERSION
    editor: TrainedTeachersRegistrationEditorMeta
    common: TrainedTeachersRegistrationCommonCanonical
    recruit?: TrainedTeachersRecruitFormState
    application?: TrainedTeachersApplicationFormState
    sidecar?: Record<string, unknown>
  } {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  return (
    record.schemaVersion === TRAINED_TEACHERS_REGISTRATION_CANONICAL_VERSION &&
    record.common != null &&
    typeof record.common === 'object' &&
    record.editor != null &&
    typeof record.editor === 'object'
  )
}
