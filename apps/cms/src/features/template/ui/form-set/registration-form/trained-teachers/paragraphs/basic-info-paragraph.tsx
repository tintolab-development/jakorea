/**
 * 교육받은 교사 프로그램 등록 폼 — 기본 정보
 * (일반과 동일 + 참여자 유형: 학교/기관 디폴트, 나머지 비활성)
 */
import { useEffect } from 'react'
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
  useEffect(() => {
    if (!participant.organization) onOrganizationChange(true)
    if (participant.individual) onIndividualChange(false)
    if (participant.teacherInstructor) onTeacherInstructorChange(false)
    if (participant.volunteer) onVolunteerChange(false)
  }, [
    participant.organization,
    participant.individual,
    participant.teacherInstructor,
    participant.volunteer,
    onOrganizationChange,
    onIndividualChange,
    onTeacherInstructorChange,
    onVolunteerChange,
  ])

  return (
    <ProgramRegistrationBasicInfoParagraph
      participant={participant}
      onIndividualChange={onIndividualChange}
      onOrganizationChange={onOrganizationChange}
      onTeacherInstructorChange={onTeacherInstructorChange}
      onVolunteerChange={onVolunteerChange}
      hideEducationPlace
      includeFooterIpsType
      participantTypesEdit={
        <div className="detail-info-form-inputs-wrapper">
          <CmsCheckbox checkboxSize="large" checked={false} disabled>
            {participantTypeLabel('individual')}
          </CmsCheckbox>
          <CmsCheckbox checkboxSize="large" checked={participant.organization} disabled>
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
