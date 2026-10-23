/**
 * Overlay persist 키 → 위저드 RHF nested path.
 * 제품 정본은 RHF path. Overlay 키는 호환 projection / 구버전 hydrate 전용.
 */
import { COMMON_INFO_PERSIST_KEYS as K } from './common-info-persist-keys'

export const REGISTRATION_WIZARD_OPERATION_ANCHOR_KEY =
  'generalRegistration.basicInfo.operationAnchorIso' as const
export const REGISTRATION_WIZARD_SINGLE_DATE_ISO_KEY =
  'generalRegistration.educationScheduleSettings.singleDateIso' as const
export const REGISTRATION_WIZARD_PERIOD_DATE_ISO_KEY =
  'generalRegistration.educationScheduleSettings.periodDateIso' as const
export const REGISTRATION_WIZARD_FOOTER_IPS_KEY =
  'generalRegistration.basicInfo.footerIpsType' as const

export const REGISTRATION_WIZARD_OVERLAY_TO_UI_PATH: Record<string, string> = {
  [K.programTitleKo]: 'programTitleKo',
  [K.programTitleEn]: 'programTitleEn',
  [K.publicProgramTitle]: 'publicProgramTitle',
  [K.detailedProgramId]: 'detailedProgramId',
  [K.detailedProgramName]: 'detailedProgramName',
  [K.businessField]: 'businessField',
  [K.partnerInvolvement]: 'partnerInvolvement',
  [K.educationVenueKind]: 'educationVenueKind',
  [K.educationVenueDetail]: 'educationVenueDetail',
  [K.educationCourse]: 'educationCourse',
  [K.ipOwned]: 'ipOwned',
  [K.courseDeliveredBy]: 'courseDeliveredBy',
  [K.operationRangeSeal]: 'operationRangeSeal',
  [REGISTRATION_WIZARD_OPERATION_ANCHOR_KEY]: 'operationAnchorIso',
  [K.surveyItems]: 'surveyItems',
  [K.sponsorIds]: 'sponsorIds',
  [K.sponsorId]: 'sponsorId',
  [K.managerContactIds]: 'managerContactIds',
  [K.managerContactId]: 'managerContactId',
  [K.sponsorManagerLine]: 'sponsorManagerLine',
  [K.kpiParticipantCount]: 'kpiParticipantCount',
  [K.kpiInstructor]: 'kpiInstructor',
  [K.kpiVolunteer]: 'kpiVolunteer',
  [K.kpiDispatchedSchool]: 'kpiDispatchedSchool',
  [K.kpiDispatchedClass]: 'kpiDispatchedClass',
  [K.wageGrade1Fee]: 'wageGrade1Fee',
  [K.wageGrade2Fee]: 'wageGrade2Fee',
  [K.wageGrade3Fee]: 'wageGrade3Fee',
  [K.paymentItemValues]: 'paymentItemValues',
  [K.paymentItemLabels]: 'paymentItemLabels',
  [K.singleEducationForm]: 'singleEducationForm',
  [K.multiCommonEducationForm]: 'multiCommonEducationForm',
  [K.legacyEducationForm]: 'legacyEducationForm',
  [K.singleParticipation]: 'singleParticipation',
  [K.multiCommonParticipation]: 'multiCommonParticipation',
  [K.ipsType]: 'ipsType',
  [K.scheduleLines]: 'scheduleLines',
  [REGISTRATION_WIZARD_SINGLE_DATE_ISO_KEY]: 'singleDateIso',
  [REGISTRATION_WIZARD_PERIOD_DATE_ISO_KEY]: 'periodDateIso',
  [REGISTRATION_WIZARD_FOOTER_IPS_KEY]: 'footerIpsType',
  [K.unitNameBySession]: 'curriculum.unitNameBySession',
  [K.unitContentBySession]: 'curriculum.unitContentBySession',
  [K.progressSessionByRound]: 'curriculum.progressSessionByRound',
  [K.roundContentByRound]: 'curriculum.roundContentByRound',
  [K.educationFormBySession]: 'curriculum.educationFormBySession',
  [K.participationBySession]: 'curriculum.participationBySession',
  [K.ipsBySession]: 'curriculum.ipsBySession',
  [K.assignmentByRound]: 'curriculum.assignmentByRound',
  [K.preEducationScheduleName]: 'curriculum.preEducationScheduleName',
  [K.preEducationScheduleLine]: 'curriculum.preEducationScheduleLine',
  [K.teacherTrainingEducationForm]: 'curriculum.teacherTrainingEducationForm',
  [K.eventNameByDetail]: 'schedule.eventNameByDetail',
  [K.scheduleDateByDetailIso]: 'schedule.scheduleDateByDetailIso',
  [K.groupTimesByDetail]: 'schedule.groupTimesByDetail',
  [K.educationFormByDetail]: 'schedule.educationFormByDetail',
  [K.participationByDetail]: 'schedule.participationByDetail',
  [K.ipsByDetailIndex]: 'schedule.ipsByDetailIndex',
  [K.assignmentByDetail]: 'schedule.assignmentByDetail',
  [K.preEducationName]: 'schedule.preEducationName',
}

const UI_PATH_TO_OVERLAY_KEY: Record<string, string> = (() => {
  const out: Record<string, string> = {}
  for (const [overlayKey, path] of Object.entries(REGISTRATION_WIZARD_OVERLAY_TO_UI_PATH)) {
    if (out[path] == null) out[path] = overlayKey
  }
  return out
})()

export function overlayKeyToWizardUiPath(key: string): string | null {
  return REGISTRATION_WIZARD_OVERLAY_TO_UI_PATH[key] ?? null
}

export function wizardUiPathToOverlayKey(path: string): string | null {
  return UI_PATH_TO_OVERLAY_KEY[path] ?? null
}

export function isRegistrationWizardOwnedOverlayKey(key: string): boolean {
  return overlayKeyToWizardUiPath(key) != null
}

export function getNestedValue(source: unknown, path: string): unknown {
  if (!path) return source
  const parts = path.split('.')
  let current: unknown = source
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

export function setNestedValue<T>(source: T, path: string, value: unknown): T {
  if (!path) return value as T
  const parts = path.split('.')
  const root =
    source != null && typeof source === 'object' && !Array.isArray(source)
      ? { ...(source as Record<string, unknown>) }
      : {}
  let cursor = root
  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = parts[index]
    const next = cursor[key]
    if (next != null && typeof next === 'object' && !Array.isArray(next)) {
      cursor[key] = { ...(next as Record<string, unknown>) }
    } else {
      cursor[key] = {}
    }
    cursor = cursor[key] as Record<string, unknown>
  }
  cursor[parts[parts.length - 1]] = value
  return root as T
}
