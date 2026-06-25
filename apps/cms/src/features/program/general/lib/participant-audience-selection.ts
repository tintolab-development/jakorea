import type { UseFormReturn } from 'react-hook-form'
import type { GeneralProgramCommonInfoEditFormValues } from '@/features/program/general/model/common-info-edit-schema'
import { TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS } from '@/features/template/lib/template-form-select-options'

export type GeneralParticipantAudienceKind = 'individual' | 'organization'

export type GeneralParticipantAudienceSelectValue = GeneralParticipantAudienceKind

export type GeneralParticipantAudienceFlags = {
  individual: boolean
  organization: boolean
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
