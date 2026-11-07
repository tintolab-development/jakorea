/**
 * TT 공통 정보 조회 표시 — GET 정본 매핑.
 * 모드 누락을 common/perSchedule로 추정하지 않는다.
 */
import type { Program, ProgramType } from '@/types/domain'
import { TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS } from '@/features/template/lib/template-form-select-options'
import { getProgramRegistrationEducationFormOptions } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-education-form-options'

export const TRAINED_TEACHER_EDUCATION_PROCESS_OPTIONS = [
  ...TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS,
]

export const TRAINED_TEACHER_IP_OWNED_OPTIONS = [
  { value: 'JA', label: 'JA' },
  { value: 'Partner', label: 'Partner' },
  { value: 'Jointly', label: 'Jointly' },
  { value: 'Joint', label: 'Joint' },
] as const

export const TRAINED_TEACHER_COURSE_DELIVERED_BY_OPTIONS = [
  { value: 'JA', label: 'JA' },
  { value: 'Jointly', label: 'Jointly' },
  { value: 'Partner', label: 'Partner' },
] as const

const EDUCATION_FORM_OPTIONS = getProgramRegistrationEducationFormOptions(false)

export function educationFormLabelFromProgramType(
  type: ProgramType | string | undefined
): string | undefined {
  const normalized = type?.trim().toLowerCase()
  if (normalized === 'online' || normalized === 'offline' || normalized === 'hybrid') {
    return EDUCATION_FORM_OPTIONS.find(option => option.value === normalized)?.label
  }
  return undefined
}

export function resolveTrainedTeachersEducationFormView(input: {
  programType: ProgramType | string | undefined
  educationFormScheduleDetail?: 'common' | 'perSchedule'
  educationFormLabel?: string | null
}): { modeLabel?: string; formLabel: string } {
  const mode = input.educationFormScheduleDetail
  if (mode === 'perSchedule') {
    return { modeLabel: '일정 별 상이', formLabel: '일정 별 상이' }
  }
  const fromType = educationFormLabelFromProgramType(input.programType)
  const formLabel = fromType || input.educationFormLabel?.trim() || '-'
  if (mode === 'common') {
    return { modeLabel: '일정 공통', formLabel }
  }
  return { formLabel }
}

export function resolveTrainedTeachersIpsTypeView(input: {
  ipsScheduleDetail?: 'common' | 'perSchedule'
  ips?: Program['ips'] | string | null
}): { modeLabel?: string; ipsLabel: string } {
  const mode = input.ipsScheduleDetail
  const ipsLabel = typeof input.ips === 'string' && input.ips.trim() ? input.ips.trim() : '-'
  if (mode === 'perSchedule') {
    return { modeLabel: '일정 별 상이', ipsLabel: '일정 별 상이' }
  }
  if (mode === 'common') {
    return { modeLabel: '일정 공통', ipsLabel }
  }
  return { modeLabel: undefined, ipsLabel }
}

export function shouldShowSessionIpsSummary(input: {
  ipsScheduleDetail?: 'common' | 'perSchedule'
  ipsTypeSummary?: string | null
}): boolean {
  if (input.ipsScheduleDetail === 'perSchedule') return true
  if (input.ipsScheduleDetail === 'common') return false
  return Boolean(input.ipsTypeSummary?.trim())
}

export function trainedTeacherOptionLabel(
  options: readonly { value: string; label: string }[],
  value: string | undefined | null
): string {
  if (!value?.trim()) return '-'
  const trimmed = value.trim()
  const match = options.find(option => option.value === trimmed || option.label === trimmed)
  return match?.label ?? '-'
}

export function participantTypeChecked(
  types: Program['generalParticipantTypes'] | undefined,
  key: 'individual' | 'school_institution' | 'teacher_instructor' | 'volunteer'
): boolean {
  return Array.isArray(types) && types.includes(key)
}
