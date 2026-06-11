import type { UseFormReturn } from 'react-hook-form'
import type { GeneralProgramCommonInfoEditFormValues } from '@/features/program/general/model/common-info-edit-schema'

export type GeneralParticipantAudienceKind = 'individual' | 'organization'

export type GeneralParticipantAudienceFlags = {
  individual: boolean
  organization: boolean
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
  editForm.setValue('participantIndividual', next.individual, {
    shouldDirty: true,
    shouldValidate: true,
  })
  editForm.setValue('participantOrganization', next.organization, {
    shouldDirty: true,
    shouldValidate: true,
  })
  return next
}
