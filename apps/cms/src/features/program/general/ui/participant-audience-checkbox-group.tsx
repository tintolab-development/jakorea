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
}

/** 참여자 유형 [개인]/[기관] — 상호 배타, disabled 없음 */
export function GeneralParticipantAudienceCheckboxGroup({
  individual,
  organization,
  onIndividualChange,
  onOrganizationChange,
}: GeneralParticipantAudienceCheckboxGroupProps) {
  return (
    <>
      <CmsCheckbox
        checkboxSize="large"
        checked={individual}
        onChange={event => onIndividualChange(event.target.checked)}
      >
        {participantAudienceLabel('individual')}
      </CmsCheckbox>
      <CmsCheckbox
        checkboxSize="large"
        checked={organization}
        onChange={event => onOrganizationChange(event.target.checked)}
      >
        {participantAudienceLabel('school_institution')}
      </CmsCheckbox>
    </>
  )
}
