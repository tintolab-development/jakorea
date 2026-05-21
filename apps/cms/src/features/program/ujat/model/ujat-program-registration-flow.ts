import type { ProgramParticipantApplicationEditorVariant } from '@/features/template/hooks/use-program-participant-application-editor'
import {
  UJAT_RECRUIT_TAB_KEYS,
  UJAT_RECRUIT_TAB_LABELS,
  type UjatRecruitTabKey,
  volunteerHalfFromRecruitTab,
} from '@/features/program/ujat/ui/detail-modal/info/ujat-program-detail-recruitment-tabs'

export const UJAT_PROGRAM_REGISTRATION_STEP_KEYS = [
  'program',
  'recruit-participant',
  'recruit-volunteer-h1',
  'recruit-volunteer-h2',
  'application-school',
  'application-volunteer',
] as const

export type UjatProgramRegistrationStepKey = (typeof UJAT_PROGRAM_REGISTRATION_STEP_KEYS)[number]

export const UJAT_PROGRAM_REGISTRATION_FLOW_QUERY_KEY = 'ujatStep' as const

export type UjatProgramRegistrationPhaseKey = 'program' | 'recruitment' | 'application'

export const UJAT_PROGRAM_REGISTRATION_PHASE_HINT: Record<UjatProgramRegistrationPhaseKey, string> = {
  program: '* 프로그램 공통 정보를 작성해 주세요',
  recruitment: '',
  application: '',
}

export const UJAT_PROGRAM_REGISTRATION_APPLICATION_TAB_KEYS = [
  'application-school',
  'application-volunteer',
] as const

export type UjatProgramRegistrationApplicationTabKey =
  (typeof UJAT_PROGRAM_REGISTRATION_APPLICATION_TAB_KEYS)[number]

export const UJAT_PROGRAM_REGISTRATION_APPLICATION_TAB_LABELS: Record<
  UjatProgramRegistrationApplicationTabKey,
  string
> = {
  'application-school': '참여자 신청 정보',
  'application-volunteer': '봉사자 신청 정보',
}

export type UjatProgramRegistrationStepDefinition = {
  key: UjatProgramRegistrationStepKey
  phase: UjatProgramRegistrationPhaseKey
  templateId: string
  editorVariant?: ProgramParticipantApplicationEditorVariant
}

/** UJAT 프로그램 신규 등록 — 단계별 템플릿 */
export const UJAT_PROGRAM_REGISTRATION_STEPS: readonly UjatProgramRegistrationStepDefinition[] = [
  {
    key: 'program',
    phase: 'program',
    templateId: 'registration-ujat',
  },
  {
    key: 'recruit-participant',
    phase: 'recruitment',
    templateId: 'recruitment-ujat-school',
    editorVariant: 'ujat-recruit-institution',
  },
  {
    key: 'recruit-volunteer-h1',
    phase: 'recruitment',
    templateId: 'recruitment-ujat-volunteer',
    editorVariant: 'ujat-recruit-volunteer',
  },
  {
    key: 'recruit-volunteer-h2',
    phase: 'recruitment',
    templateId: 'recruitment-ujat-volunteer',
    editorVariant: 'ujat-recruit-volunteer',
  },
  {
    key: 'application-school',
    phase: 'application',
    templateId: 'application-ujat-school',
    editorVariant: 'ujat-application-institution',
  },
  {
    key: 'application-volunteer',
    phase: 'application',
    templateId: 'application-ujat-volunteer',
    editorVariant: 'ujat-application-volunteer',
  },
] as const

const RECRUIT_TAB_TO_STEP: Record<UjatRecruitTabKey, UjatProgramRegistrationStepKey> = {
  recruit_participant: 'recruit-participant',
  recruit_volunteer_h1: 'recruit-volunteer-h1',
  recruit_volunteer_h2: 'recruit-volunteer-h2',
}

const STEP_TO_RECRUIT_TAB: Partial<Record<UjatProgramRegistrationStepKey, UjatRecruitTabKey>> = {
  'recruit-participant': 'recruit_participant',
  'recruit-volunteer-h1': 'recruit_volunteer_h1',
  'recruit-volunteer-h2': 'recruit_volunteer_h2',
}

export function isUjatProgramRegistrationStepKey(
  value: string | null | undefined
): value is UjatProgramRegistrationStepKey {
  if (value == null) return false
  if (value === 'recruit-volunteer') return true
  return (UJAT_PROGRAM_REGISTRATION_STEP_KEYS as readonly string[]).includes(value)
}

export function normalizeUjatProgramRegistrationStepKey(
  value: string | null | undefined
): UjatProgramRegistrationStepKey {
  if (value === 'recruit-volunteer') return 'recruit-volunteer-h1'
  if (isUjatProgramRegistrationStepKey(value)) return value
  return 'program'
}

export function getUjatProgramRegistrationPhase(
  key: UjatProgramRegistrationStepKey
): UjatProgramRegistrationPhaseKey {
  return UJAT_PROGRAM_REGISTRATION_STEPS.find(s => s.key === key)?.phase ?? 'program'
}

export function getUjatProgramRegistrationStepIndex(key: UjatProgramRegistrationStepKey): number {
  return UJAT_PROGRAM_REGISTRATION_STEP_KEYS.indexOf(key)
}

export function recruitTabKeyFromRegistrationStep(
  key: UjatProgramRegistrationStepKey
): UjatRecruitTabKey | null {
  return STEP_TO_RECRUIT_TAB[key] ?? null
}

export function registrationStepFromRecruitTab(
  tab: UjatRecruitTabKey
): UjatProgramRegistrationStepKey {
  return RECRUIT_TAB_TO_STEP[tab]
}

export function volunteerHalfFromRegistrationStep(
  key: UjatProgramRegistrationStepKey
): 'h1' | 'h2' | null {
  const tab = recruitTabKeyFromRegistrationStep(key)
  if (tab == null) return null
  return volunteerHalfFromRecruitTab(tab)
}

export function volunteerRecruitSectionTitleFromRegistrationStep(
  key: UjatProgramRegistrationStepKey
): string | undefined {
  const tab = recruitTabKeyFromRegistrationStep(key)
  if (tab === 'recruit_volunteer_h1' || tab === 'recruit_volunteer_h2') {
    return UJAT_RECRUIT_TAB_LABELS[tab]
  }
  return undefined
}

export { UJAT_RECRUIT_TAB_KEYS, UJAT_RECRUIT_TAB_LABELS }

export function isParticipantRegistrationStep(
  key: UjatProgramRegistrationStepKey
): key is Exclude<UjatProgramRegistrationStepKey, 'program'> {
  return key !== 'program'
}

export const UJAT_PROGRAM_REGISTRATION_DEFAULT_RECRUIT_STEP: UjatProgramRegistrationStepKey =
  'recruit-participant'

export const UJAT_PROGRAM_REGISTRATION_DEFAULT_APPLICATION_STEP: UjatProgramRegistrationStepKey =
  'application-school'
