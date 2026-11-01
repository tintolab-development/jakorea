/** 교육 형태 — CmsSelect `options` / CmsRadio `value` 공통 */
export type ProgramRegistrationEducationFormOption = {
  value: string
  label: string
}

const PROGRAM_REGISTRATION_EDUCATION_FORM_BASE: ProgramRegistrationEducationFormOption[] = [
  { value: 'online', label: '온라인' },
  { value: 'offline', label: '오프라인' },
  { value: 'hybrid', label: '온/오프라인' },
]

export const EDUCATION_FORM_PARTICIPANT_SELECTION_VALUE = 'participant_selection' as const

const PROGRAM_REGISTRATION_EDUCATION_FORM_PARTICIPANT_SELECTION: ProgramRegistrationEducationFormOption =
  { value: EDUCATION_FORM_PARTICIPANT_SELECTION_VALUE, label: '참여자 선택' }

export type ProgramRegistrationEducationFormOptionsContext = 'common' | 'perScheduleBlock'

/**
 * 참여자 유형이 학교/기관(`participantOrganization`)일 때만 「참여자 선택」 항목을 붙인다.
 * 개인만 선택된 경우는 기본 3개 옵션만.
 *
 * `perScheduleBlock` — 회차/세부 일정 블록 내 교육 형태: 일정 별 상이 설정 시「참여자 선택」제외.
 */
export function getProgramRegistrationEducationFormOptions(
  participantOrganization: boolean,
  options?: { context?: ProgramRegistrationEducationFormOptionsContext }
): ProgramRegistrationEducationFormOption[] {
  const context = options?.context ?? 'common'
  if (!participantOrganization || context === 'perScheduleBlock') {
    return [...PROGRAM_REGISTRATION_EDUCATION_FORM_BASE]
  }
  return [...PROGRAM_REGISTRATION_EDUCATION_FORM_BASE, PROGRAM_REGISTRATION_EDUCATION_FORM_PARTICIPANT_SELECTION]
}

/** 일반(기관) · 복수 회차 — 교육 형태 3라디오 (`참여자 선택` 포함). 커리큘럼형·일정형 공통 */
export function shouldShowEducationFormParticipantSelectionRadio(input: {
  participantOrganization: boolean
  educationStructure: 'curriculum' | 'schedule'
  sessionRound: 'single' | 'multi'
}): boolean {
  return input.participantOrganization && input.sessionRound === 'multi'
}

export type EducationFormTypeSettingsMode = 'common' | 'perSchedule' | 'participant_selection'

export function resolveEducationFormTypeSettingsMode(input: {
  educationFormScheduleDetail: 'common' | 'perSchedule'
  educationForm: string
}): EducationFormTypeSettingsMode {
  if (input.educationFormScheduleDetail === 'perSchedule') return 'perSchedule'
  if (input.educationForm === EDUCATION_FORM_PARTICIPANT_SELECTION_VALUE) {
    return 'participant_selection'
  }
  return 'common'
}

export function applyEducationFormTypeSettingsModeChange(input: {
  next: EducationFormTypeSettingsMode
  currentForm: string
}): {
  educationFormScheduleDetail: 'common' | 'perSchedule'
  educationForm: string
} {
  if (input.next === 'perSchedule') {
    return {
      educationFormScheduleDetail: 'perSchedule',
      educationForm:
        input.currentForm === EDUCATION_FORM_PARTICIPANT_SELECTION_VALUE
          ? 'online'
          : input.currentForm,
    }
  }
  if (input.next === 'participant_selection') {
    return {
      educationFormScheduleDetail: 'common',
      educationForm: EDUCATION_FORM_PARTICIPANT_SELECTION_VALUE,
    }
  }
  return {
    educationFormScheduleDetail: 'common',
    educationForm:
      input.currentForm === EDUCATION_FORM_PARTICIPANT_SELECTION_VALUE
        ? 'online'
        : input.currentForm || 'online',
  }
}

/** 단일 회차 라디오·일정별 블록 UI와 create 매핑이 공유하는 기본값 */
export const DEFAULT_REGISTRATION_EDUCATION_FORM = 'online' as const
export const DEFAULT_REGISTRATION_PARTICIPATION = 'individual' as const

const MULTI_COMMON_EDUCATION_FORM_KEY =
  'generalRegistration.typeSettings.multiCommonEducationForm' as const
const SINGLE_EDUCATION_FORM_KEY =
  'generalRegistration.typeSettings.singleEducationForm' as const
const LEGACY_EDUCATION_FORM_KEY =
  'generalRegistration.typeSettings.educationForm' as const
const MULTI_COMMON_PARTICIPATION_KEY =
  'generalRegistration.typeSettings.multiCommonParticipation' as const
const SINGLE_PARTICIPATION_KEY =
  'generalRegistration.typeSettings.singleParticipation' as const

const PER_SCHEDULE_EDUCATION_FORM_OVERLAY_KEYS = [
  'generalRegistration.educationCurriculum.educationFormBySession',
  'generalRegistration.educationScheduleCurriculum.educationFormByDetail',
] as const

/** institution bridge `showPreferredEducationForm` · schedule sync — basicInfo 제외 */
export const PROGRAM_REGISTRATION_EDUCATION_FORM_BRIDGE_OVERLAY_KEYS: readonly string[] = [
  MULTI_COMMON_EDUCATION_FORM_KEY,
  SINGLE_EDUCATION_FORM_KEY,
  LEGACY_EDUCATION_FORM_KEY,
  ...PER_SCHEDULE_EDUCATION_FORM_OVERLAY_KEYS,
]

function overlayNonEmptyText(overlay: Record<string, unknown>, key: string): string {
  const raw = overlay[key]
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  return ''
}

function overlayValueHasParticipantSelection(value: unknown): boolean {
  if (typeof value === 'string') {
    return isParticipantSelectionEducationFormValue(value)
  }
  if (value == null || typeof value !== 'object') return false
  return Object.values(value).some(
    entry => typeof entry === 'string' && isParticipantSelectionEducationFormValue(entry)
  )
}

function isParticipantSelectionEducationFormValue(value: string): boolean {
  const trimmed = value.trim()
  return (
    trimmed === EDUCATION_FORM_PARTICIPANT_SELECTION_VALUE ||
    trimmed === 'participant_choice' ||
    trimmed.includes('참여자')
  )
}

/**
 * 등록 overlay가 「참여자 선택」인지.
 * 단일/복수/레거시 키를 OR로 본다. 복수회차에 남은 `online`이
 * 단일 회차 `participant_selection`을 가리면 안 된다.
 * 일정별 회차/세부 맵 중 하나라도 해당하면 true.
 */
export function isParticipantSelectionEducationFormInOverlay(
  overlay: Record<string, unknown> | null | undefined
): boolean {
  if (overlay == null) return false
  const commonKeys = [
    MULTI_COMMON_EDUCATION_FORM_KEY,
    SINGLE_EDUCATION_FORM_KEY,
    LEGACY_EDUCATION_FORM_KEY,
  ] as const
  if (
    commonKeys.some(key =>
      isParticipantSelectionEducationFormValue(overlayNonEmptyText(overlay, key))
    )
  ) {
    return true
  }
  return PER_SCHEDULE_EDUCATION_FORM_OVERLAY_KEYS.some(key =>
    overlayValueHasParticipantSelection(overlay[key])
  )
}

/**
 * 보이는 회차 유형 키를 먼저 읽고, 없으면 숨은 키·레거시로 fallback.
 * 장소 규칙(`resolveEducationPlaceCommonEducationForm`)과 같은 회차 기준.
 */
export function resolveRoundScopedCommonValue(
  sessionRoundType: string | undefined,
  multiValue: string,
  singleValue: string,
  fallback: string
): string {
  if (sessionRoundType === 'multi') {
    return multiValue || singleValue || fallback
  }
  return singleValue || multiValue || fallback
}

/**
 * 일정 공통 교육 형태 — create 매핑·필수 검사 동일 해석.
 * 단일 회차는 single 키, 복수는 multi 키. 보이는 키가 비면 숨은 키·레거시·`online`.
 */
export function resolveGeneralRegistrationCommonEducationForm(
  overlay: Record<string, unknown>,
  sessionRoundType?: string
): string {
  return resolveRoundScopedCommonValue(
    sessionRoundType,
    overlayNonEmptyText(overlay, MULTI_COMMON_EDUCATION_FORM_KEY),
    overlayNonEmptyText(overlay, SINGLE_EDUCATION_FORM_KEY) ||
      overlayNonEmptyText(overlay, LEGACY_EDUCATION_FORM_KEY),
    DEFAULT_REGISTRATION_EDUCATION_FORM
  )
}

/**
 * 일정 공통 참여 방식 — create 매핑·필수 검사 동일 해석.
 * 단일 회차는 single 키, 복수는 multi 키. 둘 다 없으면 UI 기본값 `individual`.
 */
export function resolveGeneralRegistrationCommonParticipation(
  overlay: Record<string, unknown>,
  sessionRoundType?: string
): string {
  return resolveRoundScopedCommonValue(
    sessionRoundType,
    overlayNonEmptyText(overlay, MULTI_COMMON_PARTICIPATION_KEY),
    overlayNonEmptyText(overlay, SINGLE_PARTICIPATION_KEY),
    DEFAULT_REGISTRATION_PARTICIPATION
  )
}

/** 회차/세부 일정 블록 교육 형태 — UI `?? 'online'` 과 동일 */
export function resolveIndexedEducationForm(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return value.trim()
  return DEFAULT_REGISTRATION_EDUCATION_FORM
}

/** 회차/세부 일정 블록 참여 방식 — UI `?? 'individual'` 과 동일 */
export function resolveIndexedParticipation(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return value.trim()
  return DEFAULT_REGISTRATION_PARTICIPATION
}
