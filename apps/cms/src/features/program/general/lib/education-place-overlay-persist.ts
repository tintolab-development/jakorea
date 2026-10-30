/**
 * 「교육 진행 장소」 저장 경계 — 숨김 값은 폼(overlay KV·RHF)에는 남기고 등록/수정 API 본문에서만 뺀다.
 * 노출 규칙은 `program-registration-education-place-rules.ts`와 같다.
 * - 대상 아님(참여자 <개인> 아님·기관 선택): 4키 모두 제외
 * - 일정 공통: 공통 장소가 숨김(교육 형태 온라인)이면 주소 제외, 행 맵은 항상 제외
 * - 일정 별 상이: 공통 주소 제외, 행 맵은 노출 행(1부터, 사전 교육 0 제외)만 남김
 * - 와이어 정규화: 주소·행 값은 trim, 빈 값('')은 키째 생략, 모드는 'common' | 'perSchedule'만
 */
import type { Program } from '@/types/domain'
import { extrasFromGeneralProgram } from '@/features/program/general/lib/general-registration-overlay-from-program'
import {
  REGISTRATION_WIZARD_EDUCATION_PLACE_ADDRESS_KEY,
  REGISTRATION_WIZARD_EDUCATION_PLACE_BY_DETAIL_KEY,
  REGISTRATION_WIZARD_EDUCATION_PLACE_BY_SESSION_KEY,
  REGISTRATION_WIZARD_EDUCATION_PLACE_SCHEDULE_DETAIL_KEY,
} from '@/features/program/general/lib/overlay-phase1/registration-wizard-overlay-path-map'
import {
  isEducationFormPerScheduleRows,
  isEducationPlaceRowVisible,
  isEducationPlaceTypeSettingsRowVisible,
  resolveEducationPlaceCommonEducationForm,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-education-place-rules'

const EDUCATION_PLACE_OVERLAY_KEYS = [
  REGISTRATION_WIZARD_EDUCATION_PLACE_SCHEDULE_DETAIL_KEY,
  REGISTRATION_WIZARD_EDUCATION_PLACE_ADDRESS_KEY,
  REGISTRATION_WIZARD_EDUCATION_PLACE_BY_SESSION_KEY,
  REGISTRATION_WIZARD_EDUCATION_PLACE_BY_DETAIL_KEY,
] as const

const CURRICULUM_EDUCATION_FORM_BY_SESSION_KEY =
  'generalRegistration.educationCurriculum.educationFormBySession'
const SCHEDULE_EDUCATION_FORM_BY_DETAIL_KEY =
  'generalRegistration.educationScheduleCurriculum.educationFormByDetail'

function recordOf(value: unknown): Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function withoutKeys(
  overlay: Record<string, unknown>,
  keys: readonly string[]
): Record<string, unknown> {
  if (!keys.some(key => Object.prototype.hasOwnProperty.call(overlay, key))) return overlay
  const next = { ...overlay }
  for (const key of keys) delete next[key]
  return next
}

function trimmedText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const text = value.trim()
  return text ? text : undefined
}

/** 주소 trim·빈 값 생략, 행 맵은 trim 후 빈 행 삭제(비면 키 삭제), 모드 리터럴 외 값 삭제. */
function normalizeEducationPlaceOverlayValues(
  overlay: Record<string, unknown>
): Record<string, unknown> {
  let next: Record<string, unknown> | undefined
  const write = (key: string, value: unknown) => {
    next ??= { ...overlay }
    if (value === undefined) delete next[key]
    else next[key] = value
  }
  const has = (key: string) => Object.prototype.hasOwnProperty.call(overlay, key)

  const mode = overlay[REGISTRATION_WIZARD_EDUCATION_PLACE_SCHEDULE_DETAIL_KEY]
  if (
    has(REGISTRATION_WIZARD_EDUCATION_PLACE_SCHEDULE_DETAIL_KEY) &&
    mode !== 'common' &&
    mode !== 'perSchedule'
  ) {
    write(REGISTRATION_WIZARD_EDUCATION_PLACE_SCHEDULE_DETAIL_KEY, undefined)
  }
  if (has(REGISTRATION_WIZARD_EDUCATION_PLACE_ADDRESS_KEY)) {
    const raw = overlay[REGISTRATION_WIZARD_EDUCATION_PLACE_ADDRESS_KEY]
    const address = trimmedText(raw)
    if (address !== raw) write(REGISTRATION_WIZARD_EDUCATION_PLACE_ADDRESS_KEY, address)
  }
  for (const rowKey of [
    REGISTRATION_WIZARD_EDUCATION_PLACE_BY_SESSION_KEY,
    REGISTRATION_WIZARD_EDUCATION_PLACE_BY_DETAIL_KEY,
  ]) {
    if (!has(rowKey)) continue
    const raw = recordOf(overlay[rowKey])
    const rows: Record<string, string> = {}
    for (const [index, value] of Object.entries(raw)) {
      const text = trimmedText(value)
      if (text) rows[index] = text
    }
    const entries = Object.entries(rows)
    const unchanged =
      overlay[rowKey] === raw &&
      entries.length === Object.keys(raw).length &&
      entries.every(([index, text]) => raw[index] === text)
    if (entries.length === 0) write(rowKey, undefined)
    else if (!unchanged) write(rowKey, rows)
  }
  return next ?? overlay
}

/**
 * 저장 본문용 overlay — 숨긴 교육 진행 장소 값을 빼고 와이어 값을 정규화한 사본.
 * 등록 위저드·상세 공통정보 모달 저장이 모두 `serializeGeneralProgramServiceDetailJson`에서 이 함수를 지난다.
 * 입력 overlay는 바꾸지 않는다.
 */
export function stripHiddenEducationPlaceFromRegistrationOverlay(
  overlay: Record<string, unknown> | undefined,
  program: Program
): Record<string, unknown> | undefined {
  const stripped = stripHiddenEducationPlaceKeys(overlay, program)
  return stripped ? normalizeEducationPlaceOverlayValues(stripped) : stripped
}

function stripHiddenEducationPlaceKeys(
  overlay: Record<string, unknown> | undefined,
  program: Program
): Record<string, unknown> | undefined {
  if (!overlay) return overlay
  if (!EDUCATION_PLACE_OVERLAY_KEYS.some(key => key in overlay)) return overlay
  const extras = extrasFromGeneralProgram({ ...program, registrationOverlay: overlay })
  const enabled = extras.participantIndividual === true && extras.participantOrganization !== true
  if (!enabled) return withoutKeys(overlay, EDUCATION_PLACE_OVERLAY_KEYS)

  const isSchedule = extras.programType === 'schedule'
  const visibility = {
    sessionRoundType: extras.sessionRoundType,
    educationFormScheduleDetail: extras.educationFormScheduleDetail ?? 'common',
    commonEducationForm: resolveEducationPlaceCommonEducationForm({
      sessionRoundType: extras.sessionRoundType,
      singleEducationForm: overlay['generalRegistration.typeSettings.singleEducationForm'],
      multiCommonEducationForm:
        overlay['generalRegistration.typeSettings.multiCommonEducationForm'],
    }),
  }
  const rowCount = Math.max(
    1,
    isSchedule
      ? (extras.scheduleCurriculumDetailCount ?? 1)
      : extras.sessionRoundType === 'single'
        ? (extras.curriculumChartSessionCount ?? 1)
        : (extras.curriculumSessionCount ?? 1)
  )
  const formByIndex = recordOf(
    overlay[
      isSchedule ? SCHEDULE_EDUCATION_FORM_BY_DETAIL_KEY : CURRICULUM_EDUCATION_FORM_BY_SESSION_KEY
    ]
  )
  const isRowVisible = (index: number) =>
    index >= 1 &&
    index <= rowCount &&
    isEducationPlaceRowVisible({ ...visibility, rowEducationForm: formByIndex[index] })
  const visibleRowCount = Array.from({ length: rowCount }, (_, i) => i + 1).filter(
    isRowVisible
  ).length
  const typeRowVisible =
    isEducationPlaceTypeSettingsRowVisible(visibility) &&
    (!isEducationFormPerScheduleRows(visibility) || visibleRowCount > 0)
  if (!typeRowVisible) return withoutKeys(overlay, EDUCATION_PLACE_OVERLAY_KEYS)

  const rowKey = isSchedule
    ? REGISTRATION_WIZARD_EDUCATION_PLACE_BY_DETAIL_KEY
    : REGISTRATION_WIZARD_EDUCATION_PLACE_BY_SESSION_KEY
  const otherRowKey = isSchedule
    ? REGISTRATION_WIZARD_EDUCATION_PLACE_BY_SESSION_KEY
    : REGISTRATION_WIZARD_EDUCATION_PLACE_BY_DETAIL_KEY
  if (overlay[REGISTRATION_WIZARD_EDUCATION_PLACE_SCHEDULE_DETAIL_KEY] !== 'perSchedule') {
    return withoutKeys(overlay, [rowKey, otherRowKey])
  }
  const rows = recordOf(overlay[rowKey])
  const visibleRows = Object.fromEntries(
    Object.entries(rows).filter(([index]) => isRowVisible(Number(index)))
  )
  const next = withoutKeys(overlay, [REGISTRATION_WIZARD_EDUCATION_PLACE_ADDRESS_KEY, otherRowKey])
  if (!(rowKey in overlay)) return next
  return { ...next, [rowKey]: visibleRows }
}
