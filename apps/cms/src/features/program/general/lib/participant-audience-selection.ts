import type { UseFormReturn } from 'react-hook-form'
import type { GeneralProgramCommonInfoEditFormValues } from '@/features/program/general/model/common-info-edit-schema'
import type { GeneralProgramParticipantType, Program } from '@/types/domain'
import { getGeneralParticipantTypes } from '@/features/program/general/lib/detail-meta'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'
import { TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS } from '@/features/template/lib/template-form-select-options'

export type GeneralParticipantAudienceKind = 'individual' | 'organization'

export type GeneralParticipantAudienceSelectValue = GeneralParticipantAudienceKind

export type GeneralParticipantAudienceFlags = {
  individual: boolean
  organization: boolean
}

/** 등록 위저드 `participant`와 동일한 체크 상태 */
export type GeneralParticipantRegistrationFlags = GeneralParticipantAudienceFlags & {
  teacherInstructor: boolean
  volunteer: boolean
}

export type SavedGeneralParticipantTypeLocks = {
  individual: boolean
  organization: boolean
  teacherInstructor: boolean
  volunteer: boolean
}

function recruitmentTypeOf(row: { recruitmentType?: string | null }): string {
  return (row.recruitmentType ?? '').toUpperCase()
}

/**
 * 이미 등록된 참여자 유형은 수정할 수 없다.
 * 개인/기관은 한 모집행의 신청 유형이므로 한쪽이 있으면 둘 다 잠근다.
 * 강사·봉사자는 저장된 행이 없을 때만 새 모집 단위로 선택할 수 있다.
 */
export function savedGeneralParticipantTypeLocks(
  program: Pick<Program, 'generalParticipantTypes' | 'programRecruitments'>
): SavedGeneralParticipantTypeLocks {
  const types = new Set(program.generalParticipantTypes ?? [])
  const rows = program.programRecruitments ?? []
  const saved = (predicate: (row: (typeof rows)[number]) => boolean) =>
    rows.some(row => row.id != null && predicate(row))
  const participantSaved =
    types.has('individual') ||
    types.has('school_institution') ||
    saved(row => recruitmentTypeOf(row) === 'PARTICIPANT')
  const instructorSaved =
    types.has('teacher_instructor') || saved(row => recruitmentTypeOf(row) === 'INSTRUCTOR')
  const volunteerSaved =
    types.has('volunteer') || saved(row => recruitmentTypeOf(row) === 'VOLUNTEER')
  return {
    individual: participantSaved,
    organization: participantSaved,
    teacherInstructor: instructorSaved,
    volunteer: volunteerSaved,
  }
}

const PARTICIPANT_AUDIENCE_LABEL_BY_KIND: Record<GeneralParticipantAudienceSelectValue, string> = {
  individual:
    TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS.find(option => option.value === 'individual')?.label ??
    '개인',
  organization:
    TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS.find(option => option.value === 'school_institution')
      ?.label ?? '학교/기관',
}

export const GENERAL_PARTICIPANT_AUDIENCE_SELECT_OPTIONS: ReadonlyArray<{
  value: GeneralParticipantAudienceSelectValue
  label: string
}> = [
  { value: 'individual', label: PARTICIPANT_AUDIENCE_LABEL_BY_KIND.individual },
  { value: 'organization', label: PARTICIPANT_AUDIENCE_LABEL_BY_KIND.organization },
]

export function resolveGeneralParticipantAudienceSelectValue(
  flags: GeneralParticipantAudienceFlags
): GeneralParticipantAudienceSelectValue {
  return flags.individual ? 'individual' : 'organization'
}

/** [개인]/[기관] 상호 배타 — 한쪽 해제 시 반대쪽 자동 선택 */
export function applyGeneralParticipantAudienceSelection(
  kind: GeneralParticipantAudienceKind,
  checked: boolean
): GeneralParticipantAudienceFlags {
  if (kind === 'individual') {
    return checked
      ? { individual: true, organization: false }
      : { individual: false, organization: true }
  }
  return checked
    ? { individual: false, organization: true }
    : { individual: true, organization: false }
}

/** 기관 대상으로 전환될 때 참여 일정 상세를 공통으로 되돌린다 */
export function shouldResetParticipationScheduleDetailForAudience(
  next: GeneralParticipantAudienceFlags
): boolean {
  return next.organization
}

export function applyGeneralParticipantAudienceToEditForm(
  editForm: UseFormReturn<GeneralProgramCommonInfoEditFormValues>,
  kind: GeneralParticipantAudienceKind,
  checked: boolean
): GeneralParticipantAudienceFlags {
  const next = applyGeneralParticipantAudienceSelection(kind, checked)
  applyGeneralParticipantAudienceFlagsToEditForm(editForm, next)
  return next
}

function applyGeneralParticipantAudienceFlagsToEditForm(
  editForm: UseFormReturn<GeneralProgramCommonInfoEditFormValues>,
  next: GeneralParticipantAudienceFlags
): void {
  editForm.setValue('participantIndividual', next.individual, {
    shouldDirty: true,
    shouldValidate: true,
  })
  editForm.setValue('participantOrganization', next.organization, {
    shouldDirty: true,
    shouldValidate: true,
  })

  if (shouldResetParticipationScheduleDetailForAudience(next)) {
    editForm.setValue('participationScheduleDetail', 'common', { shouldDirty: true })
  }

  if (next.individual) {
    editForm.setValue('kpiFinalSchools', 0, { shouldDirty: true })
    editForm.setValue('kpiFinalClasses', 0, { shouldDirty: true })
  }
}

/** [개인]/[학교·기관] 대분류 — 수정 시 셀렉트 */
export function applyGeneralParticipantAudienceSelectToEditForm(
  editForm: UseFormReturn<GeneralProgramCommonInfoEditFormValues>,
  value: GeneralParticipantAudienceSelectValue
): GeneralParticipantAudienceFlags {
  const next =
    value === 'individual'
      ? { individual: true, organization: false }
      : { individual: false, organization: true }
  applyGeneralParticipantAudienceFlagsToEditForm(editForm, next)
  return next
}

/**
 * 등록·상세 수정 KPI 비활성.
 * 최종 파견 학교/학급 수는 개인·기관 모두 해당 없음(비활성).
 */
export function resolveGeneralRegistrationKpiFieldAvailability(
  participant: GeneralParticipantRegistrationFlags
): {
  instructorDisabled: boolean
  volunteerDisabled: boolean
  dispatchedSchoolDisabled: boolean
  dispatchedClassDisabled: boolean
} {
  return {
    instructorDisabled: participant.teacherInstructor !== true,
    volunteerDisabled: participant.volunteer !== true,
    dispatchedSchoolDisabled: true,
    dispatchedClassDisabled: true,
  }
}

export function generalParticipantTypesFromFlags(
  flags: GeneralParticipantRegistrationFlags
): GeneralProgramParticipantType[] {
  const types: GeneralProgramParticipantType[] = []
  if (flags.individual) types.push('individual')
  if (flags.organization) types.push('school_institution')
  if (flags.teacherInstructor) types.push('teacher_instructor')
  if (flags.volunteer) types.push('volunteer')
  return types.length > 0 ? types : ['school_institution']
}

export function participantFlagsFromGeneralProgram(
  program: Program
): GeneralParticipantRegistrationFlags {
  const types = new Set(getGeneralParticipantTypes(program))
  let individual = types.has('individual')
  let organization = types.has('school_institution')
  if (individual && organization) {
    if (isGeneralIndividualProgram(program)) organization = false
    else individual = false
  }
  if (!individual && !organization) {
    if (isGeneralIndividualProgram(program)) individual = true
    else organization = true
  }
  return {
    individual,
    organization,
    teacherInstructor: types.has('teacher_instructor'),
    volunteer: types.has('volunteer'),
  }
}
