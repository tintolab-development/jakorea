/**
 * 숨긴 회차 유형 라디오 값 — 폼 overlay에는 남기고 등록/수정 API 본문에서만 뺀다.
 * 교육 진행 장소 `stripHiddenEducationPlaceFromRegistrationOverlay`와 같은 persist 경계.
 */
import type { Program } from '@/types/domain'
import { extrasFromGeneralProgram } from '@/features/program/general/lib/general-registration-overlay-from-program'

const SINGLE_EDUCATION_FORM_KEY = 'generalRegistration.typeSettings.singleEducationForm'
const MULTI_COMMON_EDUCATION_FORM_KEY =
  'generalRegistration.typeSettings.multiCommonEducationForm'
const SINGLE_PARTICIPATION_KEY = 'generalRegistration.typeSettings.singleParticipation'
const MULTI_COMMON_PARTICIPATION_KEY =
  'generalRegistration.typeSettings.multiCommonParticipation'
const EDUCATION_FORM_BY_SESSION_KEY =
  'generalRegistration.educationCurriculum.educationFormBySession'
const EDUCATION_FORM_BY_DETAIL_KEY =
  'generalRegistration.educationScheduleCurriculum.educationFormByDetail'
const PARTICIPATION_BY_SESSION_KEY =
  'generalRegistration.educationCurriculum.participationBySession'
const PARTICIPATION_BY_DETAIL_KEY =
  'generalRegistration.educationScheduleCurriculum.participationByDetail'
const IPS_BY_SESSION_KEY = 'generalRegistration.educationCurriculum.ipsBySession'
const IPS_BY_DETAIL_KEY = 'generalRegistration.educationScheduleCurriculum.ipsByDetailIndex'

const HIDDEN_TYPE_SETTINGS_KEYS = [
  SINGLE_EDUCATION_FORM_KEY,
  MULTI_COMMON_EDUCATION_FORM_KEY,
  SINGLE_PARTICIPATION_KEY,
  MULTI_COMMON_PARTICIPATION_KEY,
  EDUCATION_FORM_BY_SESSION_KEY,
  EDUCATION_FORM_BY_DETAIL_KEY,
  PARTICIPATION_BY_SESSION_KEY,
  PARTICIPATION_BY_DETAIL_KEY,
  IPS_BY_SESSION_KEY,
  IPS_BY_DETAIL_KEY,
] as const

function withoutKeys(
  overlay: Record<string, unknown>,
  keys: readonly string[]
): Record<string, unknown> {
  if (!keys.some(key => Object.prototype.hasOwnProperty.call(overlay, key))) return overlay
  const next = { ...overlay }
  for (const key of keys) delete next[key]
  return next
}

/**
 * 저장 본문용 overlay — 현재 회차 유형·일정 공통/상이 기준으로 숨은 라디오 키를 뺀 사본.
 * 입력 overlay는 바꾸지 않는다.
 */
export function stripHiddenTypeSettingsFromRegistrationOverlay(
  overlay: Record<string, unknown> | undefined,
  program: Program
): Record<string, unknown> | undefined {
  if (!overlay) return overlay
  if (!HIDDEN_TYPE_SETTINGS_KEYS.some(key => key in overlay)) return overlay

  const extras = extrasFromGeneralProgram({ ...program, registrationOverlay: overlay })
  const isMulti = extras.sessionRoundType === 'multi'
  const formPerSchedule = extras.educationFormScheduleDetail === 'perSchedule'
  const participationPerSchedule = extras.participationScheduleDetail === 'perSchedule'
  const ipsPerSchedule = extras.ipsScheduleDetail === 'perSchedule'
  const isSchedule = extras.programType === 'schedule'

  const hidden: string[] = []
  if (isMulti) {
    hidden.push(SINGLE_EDUCATION_FORM_KEY, SINGLE_PARTICIPATION_KEY)
    if (formPerSchedule) hidden.push(MULTI_COMMON_EDUCATION_FORM_KEY)
    if (participationPerSchedule) hidden.push(MULTI_COMMON_PARTICIPATION_KEY)
  } else {
    hidden.push(MULTI_COMMON_EDUCATION_FORM_KEY, MULTI_COMMON_PARTICIPATION_KEY)
  }

  if (!isMulti || !formPerSchedule) {
    hidden.push(EDUCATION_FORM_BY_SESSION_KEY, EDUCATION_FORM_BY_DETAIL_KEY)
  } else if (isSchedule) {
    hidden.push(EDUCATION_FORM_BY_SESSION_KEY)
  } else {
    hidden.push(EDUCATION_FORM_BY_DETAIL_KEY)
  }

  if (!isMulti || !participationPerSchedule) {
    hidden.push(PARTICIPATION_BY_SESSION_KEY, PARTICIPATION_BY_DETAIL_KEY)
  } else if (isSchedule) {
    hidden.push(PARTICIPATION_BY_SESSION_KEY)
  } else {
    hidden.push(PARTICIPATION_BY_DETAIL_KEY)
  }

  if (!isMulti || !ipsPerSchedule) {
    hidden.push(IPS_BY_SESSION_KEY, IPS_BY_DETAIL_KEY)
  } else if (isSchedule) {
    hidden.push(IPS_BY_SESSION_KEY)
  } else {
    hidden.push(IPS_BY_DETAIL_KEY)
  }

  return withoutKeys(overlay, hidden)
}
