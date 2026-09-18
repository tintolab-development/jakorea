/**
 * 교육받은 교사 프로그램 등록 폼 — 기본 정보
 * (참여자 유형: 학교/기관 checked·disabled 고정. IPS는 유형 설정에서만 관리)
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
  participant: _participant,
  onIndividualChange,
  onOrganizationChange: _onOrganizationChange,
  onTeacherInstructorChange,
  onVolunteerChange,
}: TrainedTeachersRegistrationBasicInfoParagraphProps) {
  // 학교/기관 고정 — UI·form state 모두 organization=true 유지
  const lockedParticipant: ProgramRegistrationParticipantState = {
    individual: false,
    organization: true,
    teacherInstructor: false,
    volunteer: false,
  }

  return (
    <ProgramRegistrationBasicInfoParagraph
      participant={lockedParticipant}
      onIndividualChange={onIndividualChange}
      onOrganizationChange={() => {
        /* TT: 학교/기관 해제 불가 */
      }}
      onTeacherInstructorChange={onTeacherInstructorChange}
      onVolunteerChange={onVolunteerChange}
      hideEducationPlace
      trainedTeachersDefaults
      participantTypesEdit={
        <div className="detail-info-form-inputs-wrapper">
          <CmsCheckbox checkboxSize="large" checked={false} disabled>
            {participantTypeLabel('individual')}
          </CmsCheckbox>
          <CmsCheckbox checkboxSize="large" checked disabled>
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
