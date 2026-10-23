import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS } from '@/features/template/lib/template-form-select-options'

function participantAudienceLabel(value: 'individual' | 'school_institution'): string {
  return TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS.find(option => option.value === value)?.label ?? value
}

export type GeneralParticipantAudienceCheckboxGroupProps = {
  individual: boolean
  organization: boolean
  onIndividualChange: (checked: boolean) => void
  onOrganizationChange: (checked: boolean) => void
  disabled?: boolean
  individualDisabled?: boolean
  organizationDisabled?: boolean
}

/** 참여자 유형 [개인]/[기관] — 상호 배타. 상세 수정에서는 전부 잠근다. */
export function GeneralParticipantAudienceCheckboxGroup({
  individual,
  organization,
  onIndividualChange,
  onOrganizationChange,
  disabled = false,
  individualDisabled,
  organizationDisabled,
}: GeneralParticipantAudienceCheckboxGroupProps) {
  return (
    <>
      <CmsCheckbox
        checkboxSize="medium"
        checked={individual}
        disabled={individualDisabled ?? disabled}
        onChange={event => onIndividualChange(event.target.checked)}
      >
        {participantAudienceLabel('individual')}
      </CmsCheckbox>
      <CmsCheckbox
        checkboxSize="medium"
        checked={organization}
        disabled={organizationDisabled ?? disabled}
        onChange={event => onOrganizationChange(event.target.checked)}
      >
        {participantAudienceLabel('school_institution')}
      </CmsCheckbox>
    </>
  )
}
