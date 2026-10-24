/**
 * 테스트 전용 입력 어댑터.
 * Phase 1-A plain overlay record → CommonInfoFormValues.
 * 프로덕션 Builder는 이 모듈을 import하지 않는다.
 */
import type { CommonInfoFormValues, CommonInfoSidecars, OptionalField } from './common-info-form-values'
import { FIELD_ABSENT, presentField } from './common-info-form-values'
import { COMMON_INFO_OWNED_PERSIST_KEY_SET, COMMON_INFO_PERSIST_KEYS as K } from './common-info-persist-keys'
import { emptyCurriculumMaps, emptyScheduleMaps } from './common-info-domain'
import type { CommonInfoCurriculumMaps, CommonInfoIpsValue, CommonInfoScheduleMaps } from './common-info-form-values'

function optionalFromOverlay<T>(
  overlay: Record<string, unknown>,
  key: string,
  parse: (raw: unknown) => T
): OptionalField<T> {
  if (!Object.prototype.hasOwnProperty.call(overlay, key)) return FIELD_ABSENT
  const raw = overlay[key]
  return presentField(parse(raw), raw)
}

function asText(raw: unknown): string {
  if (typeof raw === 'string') return raw.trim()
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw)
  return ''
}

function asNullableNumber(raw: unknown): number | null {
  if (raw == null) return null
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string' && raw.trim()) {
    const n = Number(raw.replace(/,/g, ''))
    return Number.isFinite(n) ? n : null
  }
  return null
}

function asOptionalNumber(raw: unknown): number | undefined {
  const n = asNullableNumber(raw)
  return n == null ? undefined : n
}

function asStringList(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.map(String) : []
}

function asIndexRecord<T>(raw: unknown): Record<number, T> {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: Record<number, T> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const n = Number(key)
    if (!Number.isFinite(n)) continue
    out[n] = value as T
  }
  return out
}

function asSeal(raw: unknown): { start: string; end: string } | null {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return null
  const start = (raw as { start?: unknown }).start
  const end = (raw as { end?: unknown }).end
  if (typeof start !== 'string' || typeof end !== 'string') return null
  if (!start.trim() || !end.trim()) return null
  return { start, end }
}

function asIps(raw: unknown): CommonInfoIpsValue {
  if (raw != null && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as CommonInfoIpsValue
  }
  return { category: '', detail: '' }
}

function asSurvey(raw: unknown): CommonInfoFormValues['surveyItems'] extends OptionalField<infer T>
  ? T
  : never {
  if (raw != null && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as { survey?: boolean; satisfaction?: boolean; lecture_evaluation?: boolean }
  }
  return {}
}

function curriculumFromOverlay(overlay: Record<string, unknown>): CommonInfoCurriculumMaps {
  return {
    unitNameBySession: asIndexRecord<string>(overlay[K.unitNameBySession]),
    unitContentBySession: asIndexRecord<string>(overlay[K.unitContentBySession]),
    progressSessionByRound: asIndexRecord<string>(overlay[K.progressSessionByRound]),
    roundContentByRound: asIndexRecord<string>(overlay[K.roundContentByRound]),
    educationFormBySession: asIndexRecord<string>(overlay[K.educationFormBySession]),
    participationBySession: asIndexRecord<string>(overlay[K.participationBySession]),
    ipsBySession: asIndexRecord<CommonInfoIpsValue>(overlay[K.ipsBySession]),
    assignmentByRound: asIndexRecord(overlay[K.assignmentByRound]),
    preEducationScheduleName: asText(overlay[K.preEducationScheduleName]),
    preEducationScheduleLine: asText(overlay[K.preEducationScheduleLine]),
    teacherTrainingEducationForm: asText(overlay[K.teacherTrainingEducationForm]),
  }
}

function scheduleFromOverlay(overlay: Record<string, unknown>): CommonInfoScheduleMaps {
  return {
    eventNameByDetail: asIndexRecord<string>(overlay[K.eventNameByDetail]),
    scheduleDateByDetailIso: asIndexRecord<string | null>(overlay[K.scheduleDateByDetailIso]),
    groupTimesByDetail: asIndexRecord(overlay[K.groupTimesByDetail]),
    educationFormByDetail: asIndexRecord<string>(overlay[K.educationFormByDetail]),
    participationByDetail: asIndexRecord<string>(overlay[K.participationByDetail]),
    ipsByDetailIndex: asIndexRecord<CommonInfoIpsValue>(overlay[K.ipsByDetailIndex]),
    assignmentByDetail: asIndexRecord(overlay[K.assignmentByDetail]),
    preEducationName: asText(overlay[K.preEducationName]),
  }
}

export function overlayKvToCommonInfoFormValues(
  overlay: Record<string, unknown>
): CommonInfoFormValues {
  return {
    programTitleKo: optionalFromOverlay(overlay, K.programTitleKo, asText),
    programTitleEn: optionalFromOverlay(overlay, K.programTitleEn, asText),
    publicProgramTitle: optionalFromOverlay(overlay, K.publicProgramTitle, asText),
    detailedProgramId: optionalFromOverlay(overlay, K.detailedProgramId, asText),
    detailedProgramName: optionalFromOverlay(overlay, K.detailedProgramName, asText),
    businessField: optionalFromOverlay(overlay, K.businessField, asText),
    partnerInvolvement: optionalFromOverlay(overlay, K.partnerInvolvement, asText),
    educationVenueKind: optionalFromOverlay(overlay, K.educationVenueKind, asText),
    educationVenueDetail: optionalFromOverlay(overlay, K.educationVenueDetail, asText),
    educationCourse: optionalFromOverlay(overlay, K.educationCourse, asText),
    ipOwned: optionalFromOverlay(overlay, K.ipOwned, asText),
    courseDeliveredBy: optionalFromOverlay(overlay, K.courseDeliveredBy, asText),
    operationRangeSeal: optionalFromOverlay(overlay, K.operationRangeSeal, asSeal),
    surveyItems: optionalFromOverlay(overlay, K.surveyItems, asSurvey),
    sponsorIds: optionalFromOverlay(overlay, K.sponsorIds, asStringList),
    sponsorId: optionalFromOverlay(overlay, K.sponsorId, asText),
    managerContactIds: optionalFromOverlay(overlay, K.managerContactIds, asStringList),
    managerContactId: optionalFromOverlay(overlay, K.managerContactId, asText),
    sponsorManagerLine: optionalFromOverlay(overlay, K.sponsorManagerLine, asText),
    kpiParticipantCount: optionalFromOverlay(overlay, K.kpiParticipantCount, asNullableNumber),
    kpiInstructor: optionalFromOverlay(overlay, K.kpiInstructor, asNullableNumber),
    kpiVolunteer: optionalFromOverlay(overlay, K.kpiVolunteer, asNullableNumber),
    kpiDispatchedSchool: optionalFromOverlay(overlay, K.kpiDispatchedSchool, asNullableNumber),
    kpiDispatchedClass: optionalFromOverlay(overlay, K.kpiDispatchedClass, asNullableNumber),
    wageGrade1Fee: optionalFromOverlay(overlay, K.wageGrade1Fee, asOptionalNumber),
    wageGrade2Fee: optionalFromOverlay(overlay, K.wageGrade2Fee, asOptionalNumber),
    wageGrade3Fee: optionalFromOverlay(overlay, K.wageGrade3Fee, asOptionalNumber),
    paymentItemValues: optionalFromOverlay(overlay, K.paymentItemValues, asStringList),
    paymentItemLabels: optionalFromOverlay(overlay, K.paymentItemLabels, asText),
    singleEducationForm: optionalFromOverlay(overlay, K.singleEducationForm, asText),
    multiCommonEducationForm: optionalFromOverlay(overlay, K.multiCommonEducationForm, asText),
    legacyEducationForm: optionalFromOverlay(overlay, K.legacyEducationForm, asText),
    singleParticipation: optionalFromOverlay(overlay, K.singleParticipation, asText),
    multiCommonParticipation: optionalFromOverlay(overlay, K.multiCommonParticipation, asText),
    ipsType: optionalFromOverlay(overlay, K.ipsType, asIps),
    scheduleLines: optionalFromOverlay(overlay, K.scheduleLines, asStringList),
    curriculum: Object.keys(overlay).some(key => key.startsWith('generalRegistration.educationCurriculum.'))
      ? curriculumFromOverlay(overlay)
      : emptyCurriculumMaps(),
    schedule: Object.keys(overlay).some(key =>
      key.startsWith('generalRegistration.educationScheduleCurriculum.')
    )
      ? scheduleFromOverlay(overlay)
      : emptyScheduleMaps(),
  }
}

export function overlayKvToCommonInfoSidecars(
  overlay: Record<string, unknown>
): CommonInfoSidecars {
  const unownedOverlay: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(overlay)) {
    if (!COMMON_INFO_OWNED_PERSIST_KEY_SET.has(key)) unownedOverlay[key] = value
  }
  return { unownedOverlay, overlayKeyOrder: Object.keys(overlay) }
}

export function overlayKvToIndependentCommonInfoInput(overlay: Record<string, unknown>): {
  formValues: CommonInfoFormValues
  sidecars: CommonInfoSidecars
} {
  return {
    formValues: overlayKvToCommonInfoFormValues(overlay),
    sidecars: overlayKvToCommonInfoSidecars(overlay),
  }
}
