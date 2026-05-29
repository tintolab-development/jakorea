import type { ProgramParticipantApplicationEditorVariant } from '@/features/template/hooks/use-program-participant-application-editor'

/** 일반 프로그램 전용 — UJAT·1사1교·Gemini 템플릿 제외 */
export const GENERAL_PROGRAM_REGISTRATION_STEP_KEYS = [
  'program',
  'recruit-participant-school',
  'recruit-participant-individual',
  'recruit-instructor',
  'recruit-volunteer',
  'application-participant-school',
  'application-participant-individual',
  'application-instructor',
  'application-volunteer',
] as const

export type GeneralProgramRegistrationStepKey =
  (typeof GENERAL_PROGRAM_REGISTRATION_STEP_KEYS)[number]

export const GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY = 'generalStep' as const

export type GeneralProgramRegistrationPhaseKey = 'program' | 'recruitment' | 'application'

export const GENERAL_PROGRAM_REGISTRATION_PHASE_HINT: Record<
  GeneralProgramRegistrationPhaseKey,
  string
> = {
  program: '* 프로그램 공통 정보를 작성해 주세요',
  recruitment: '',
  application: '',
}

export const GENERAL_PROGRAM_RECRUIT_TAB_KEYS = [
  'recruit-participant-school',
  'recruit-participant-individual',
  'recruit-instructor',
  'recruit-volunteer',
] as const

export type GeneralProgramRecruitTabKey = (typeof GENERAL_PROGRAM_RECRUIT_TAB_KEYS)[number]

export const GENERAL_PROGRAM_RECRUIT_TAB_LABELS: Record<GeneralProgramRecruitTabKey, string> = {
  'recruit-participant-school': '참여자 모집',
  'recruit-participant-individual': '참여자 모집',
  'recruit-instructor': '강사 모집',
  'recruit-volunteer': '봉사자 모집',
}

export const GENERAL_PROGRAM_REGISTRATION_APPLICATION_TAB_KEYS = [
  'application-participant-school',
  'application-participant-individual',
  'application-instructor',
  'application-volunteer',
] as const

export type GeneralProgramRegistrationApplicationTabKey =
  (typeof GENERAL_PROGRAM_REGISTRATION_APPLICATION_TAB_KEYS)[number]

export const GENERAL_PROGRAM_REGISTRATION_APPLICATION_TAB_LABELS: Record<
  GeneralProgramRegistrationApplicationTabKey,
  string
> = {
  'application-participant-school': '참여자 신청',
  'application-participant-individual': '참여자 신청',
  'application-instructor': '강사 신청',
  'application-volunteer': '봉사자 신청',
}

/** 공통정보 「참여자 유형」 체크박스와 동일 */
export type GeneralProgramRegistrationParticipantFlags = {
  individual: boolean
  organization: boolean
  teacherInstructor: boolean
  volunteer: boolean
}

function isRecruitStepVisible(
  key: GeneralProgramRecruitTabKey,
  flags: GeneralProgramRegistrationParticipantFlags
): boolean {
  if (key === 'recruit-participant-school') return flags.organization
  if (key === 'recruit-participant-individual') return flags.individual
  if (key === 'recruit-instructor') return flags.teacherInstructor
  return flags.volunteer
}

function isApplicationStepVisible(
  key: GeneralProgramRegistrationApplicationTabKey,
  flags: GeneralProgramRegistrationParticipantFlags
): boolean {
  if (key === 'application-participant-school') return flags.organization
  if (key === 'application-participant-individual') return flags.individual
  if (key === 'application-instructor') return flags.teacherInstructor
  return flags.volunteer
}

export function getVisibleGeneralProgramRecruitTabKeys(
  flags: GeneralProgramRegistrationParticipantFlags
): GeneralProgramRecruitTabKey[] {
  return GENERAL_PROGRAM_RECRUIT_TAB_KEYS.filter(key => isRecruitStepVisible(key, flags))
}

export function getVisibleGeneralProgramApplicationTabKeys(
  flags: GeneralProgramRegistrationParticipantFlags
): GeneralProgramRegistrationApplicationTabKey[] {
  return GENERAL_PROGRAM_REGISTRATION_APPLICATION_TAB_KEYS.filter(key =>
    isApplicationStepVisible(key, flags)
  )
}

export function isGeneralProgramRegistrationStepVisible(
  step: GeneralProgramRegistrationStepKey,
  flags: GeneralProgramRegistrationParticipantFlags
): boolean {
  if (step === 'program') return true
  const recruitTab = STEP_TO_RECRUIT_TAB[step]
  if (recruitTab != null) return isRecruitStepVisible(recruitTab, flags)
  const applicationKey = step as GeneralProgramRegistrationApplicationTabKey
  if (
    (GENERAL_PROGRAM_REGISTRATION_APPLICATION_TAB_KEYS as readonly string[]).includes(applicationKey)
  ) {
    return isApplicationStepVisible(applicationKey, flags)
  }
  return false
}

export function getDefaultGeneralProgramRecruitStep(
  flags: GeneralProgramRegistrationParticipantFlags
): GeneralProgramRegistrationStepKey {
  const tab = getVisibleGeneralProgramRecruitTabKeys(flags)[0]
  return tab != null ? registrationStepFromRecruitTab(tab) : 'program'
}

export function getDefaultGeneralProgramApplicationStep(
  flags: GeneralProgramRegistrationParticipantFlags
): GeneralProgramRegistrationStepKey {
  const tab = getVisibleGeneralProgramApplicationTabKeys(flags)[0]
  return tab ?? 'program'
}

export function coerceGeneralProgramRegistrationStep(
  step: GeneralProgramRegistrationStepKey,
  flags: GeneralProgramRegistrationParticipantFlags
): GeneralProgramRegistrationStepKey {
  if (step === 'program') return step
  if (isGeneralProgramRegistrationStepVisible(step, flags)) return step
  const phase = getGeneralProgramRegistrationPhase(step)
  if (phase === 'recruitment') return getDefaultGeneralProgramRecruitStep(flags)
  if (phase === 'application') return getDefaultGeneralProgramApplicationStep(flags)
  return 'program'
}

export type GeneralProgramRegistrationStepDefinition = {
  key: GeneralProgramRegistrationStepKey
  phase: GeneralProgramRegistrationPhaseKey
  templateId: string
  editorVariant?: ProgramParticipantApplicationEditorVariant
}

export const GENERAL_PROGRAM_REGISTRATION_STEPS: readonly GeneralProgramRegistrationStepDefinition[] =
  [
    {
      key: 'program',
      phase: 'program',
      templateId: 'registration-general',
    },
    {
      key: 'recruit-participant-school',
      phase: 'recruitment',
      templateId: 'recruitment-participant-school',
      editorVariant: 'applicant-recruit-institution',
    },
    {
      key: 'recruit-participant-individual',
      phase: 'recruitment',
      templateId: 'recruitment-participant-individual',
      editorVariant: 'applicant-recruit-individual',
    },
    {
      key: 'recruit-instructor',
      phase: 'recruitment',
      templateId: 'recruitment-instructor',
      editorVariant: 'recruit-instructor',
    },
    {
      key: 'recruit-volunteer',
      phase: 'recruitment',
      templateId: 'recruitment-volunteer',
      editorVariant: 'recruit-volunteer',
    },
    {
      key: 'application-participant-school',
      phase: 'application',
      templateId: 'application-participant-school',
      editorVariant: 'institution',
    },
    {
      key: 'application-participant-individual',
      phase: 'application',
      templateId: 'application-participant-individual',
      editorVariant: 'individual',
    },
    {
      key: 'application-instructor',
      phase: 'application',
      templateId: 'application-instructor',
      editorVariant: 'instructor',
    },
    {
      key: 'application-volunteer',
      phase: 'application',
      templateId: 'application-volunteer',
      editorVariant: 'volunteer',
    },
  ] as const

const RECRUIT_TAB_TO_STEP: Record<GeneralProgramRecruitTabKey, GeneralProgramRegistrationStepKey> =
  {
    'recruit-participant-school': 'recruit-participant-school',
    'recruit-participant-individual': 'recruit-participant-individual',
    'recruit-instructor': 'recruit-instructor',
    'recruit-volunteer': 'recruit-volunteer',
  }

const STEP_TO_RECRUIT_TAB: Partial<
  Record<GeneralProgramRegistrationStepKey, GeneralProgramRecruitTabKey>
> = {
  'recruit-participant-school': 'recruit-participant-school',
  'recruit-participant-individual': 'recruit-participant-individual',
  'recruit-instructor': 'recruit-instructor',
  'recruit-volunteer': 'recruit-volunteer',
}

export function isGeneralProgramRegistrationStepKey(
  value: string | null | undefined
): value is GeneralProgramRegistrationStepKey {
  if (value == null) return false
  return (GENERAL_PROGRAM_REGISTRATION_STEP_KEYS as readonly string[]).includes(value)
}

export function normalizeGeneralProgramRegistrationStepKey(
  value: string | null | undefined,
  flags?: GeneralProgramRegistrationParticipantFlags
): GeneralProgramRegistrationStepKey {
  if (!isGeneralProgramRegistrationStepKey(value)) return 'program'
  if (flags == null) return value
  return coerceGeneralProgramRegistrationStep(value, flags)
}

export function getGeneralProgramRegistrationPhase(
  key: GeneralProgramRegistrationStepKey
): GeneralProgramRegistrationPhaseKey {
  return GENERAL_PROGRAM_REGISTRATION_STEPS.find(s => s.key === key)?.phase ?? 'program'
}

export function recruitTabKeyFromRegistrationStep(
  key: GeneralProgramRegistrationStepKey
): GeneralProgramRecruitTabKey | null {
  return STEP_TO_RECRUIT_TAB[key] ?? null
}

export function registrationStepFromRecruitTab(
  tab: GeneralProgramRecruitTabKey
): GeneralProgramRegistrationStepKey {
  return RECRUIT_TAB_TO_STEP[tab]
}

export function isParticipantRegistrationStep(
  key: GeneralProgramRegistrationStepKey
): key is Exclude<GeneralProgramRegistrationStepKey, 'program'> {
  return key !== 'program'
}

/** @deprecated 플래그 기반 `getDefaultGeneralProgramRecruitStep` 사용 */
export const GENERAL_PROGRAM_REGISTRATION_DEFAULT_RECRUIT_STEP: GeneralProgramRegistrationStepKey =
  'recruit-participant-school'

/** @deprecated 플래그 기반 `getDefaultGeneralProgramApplicationStep` 사용 */
export const GENERAL_PROGRAM_REGISTRATION_DEFAULT_APPLICATION_STEP: GeneralProgramRegistrationStepKey =
  'application-participant-school'
