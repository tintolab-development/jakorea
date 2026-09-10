/**
 * 교육받은 교사 프로그램 등록 폼 — 기본 정보
 * (참여자 유형: 학교/기관 기본 선택·편집 가능, 나머지 비활성. 프로그램명·후원사·IPS 등 스크린 기본값)
 */
import type { ProgramRegistrationParticipantState } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { ProgramRegistrationBasicInfoParagraph } from '@/features/template/ui/form-set/registration-form/general/paragraphs/basic-info-paragraph'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS } from '@/features/template/lib/template-form-select-options'

type TrainedTeachersRegistrationBasicInfoParagraphProps = {
  participant: ProgramRegistrationParticipantState
  onIndividualChange: (checked: boolean) => void
  onOrganizationChange: (checked: boolean) => void
  onTeacherInstructorChange: (checked: boolean) => void
  onVolunteerChange: (checked: boolean) => void
}

function participantTypeLabel(
  value: (typeof TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS)[number]['value']
) {
  return TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS.find(o => o.value === value)?.label ?? value
}

export function TrainedTeachersRegistrationBasicInfoParagraph({
  participant,
  onIndividualChange,
  onOrganizationChange,
  onTeacherInstructorChange,
  onVolunteerChange,
}: TrainedTeachersRegistrationBasicInfoParagraphProps) {
  return (
    <ProgramRegistrationBasicInfoParagraph
      participant={participant}
      onIndividualChange={onIndividualChange}
      onOrganizationChange={onOrganizationChange}
      onTeacherInstructorChange={onTeacherInstructorChange}
      onVolunteerChange={onVolunteerChange}
      hideEducationPlace
      includeFooterIpsType
      trainedTeachersDefaults
      participantTypesEdit={
        <div className="detail-info-form-inputs-wrapper">
          <CmsCheckbox checkboxSize="large" checked={false} disabled>
            {participantTypeLabel('individual')}
          </CmsCheckbox>
          <CmsCheckbox
            checkboxSize="large"
            checked={participant.organization}
            onChange={e => onOrganizationChange(e.target.checked)}
          >
            {participantTypeLabel('school_institution')}
          </CmsCheckbox>
          <CmsCheckbox checkboxSize="large" checked={false} disabled>
            {participantTypeLabel('teacher_instructor')}
          </CmsCheckbox>
          <CmsCheckbox checkboxSize="large" checked={false} disabled>
            {participantTypeLabel('volunteer')}
          </CmsCheckbox>
        </div>
      }
    />
  )
}
