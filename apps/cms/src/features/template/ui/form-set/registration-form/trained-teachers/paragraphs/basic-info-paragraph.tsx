/**
 * 교육받은 교사 프로그램 등록 폼 — 기본 정보
 * (참여자 유형: 학교/기관 checked·disabled 고정.
 *  IPS 설정은 프로그램 유형 설정 단락에서 관리. 템플릿 관리 화면만 시안 5767:196354 하단 「IPS 유형」 행을 보인다 —
 *  저장 빌더 미연결, `basic-info-ips-category-field.tsx` 참고)
 */
import type { ProgramRegistrationParticipantState } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { ProgramRegistrationBasicInfoParagraph } from '@/features/template/ui/form-set/registration-form/general/paragraphs/basic-info-paragraph'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS } from '@/features/template/lib/template-form-select-options'
import { RegistrationWizardDetailInfoForm as DetailInfoForm } from '@/features/program/shared/ui/registration/registration-wizard-detail-info-form'
import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'
import { TrainedTeachersBasicInfoIpsCategoryField } from '@/features/template/ui/form-set/registration-form/trained-teachers/paragraphs/basic-info-ips-category-field'

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
  const isTemplateManagementScreen = useIsTemplateManagementScreen()
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
      footerExtraRows={
        isTemplateManagementScreen ? (
          <DetailInfoForm.Row type="single">
            <TrainedTeachersBasicInfoIpsCategoryField />
          </DetailInfoForm.Row>
        ) : null
      }
      participantTypesEdit={
        <div className="detail-info-form-inputs-wrapper cms-checkbox-group cms-checkbox-group--medium">
          <CmsCheckbox checkboxSize="medium" checked={false} disabled>
            {participantTypeLabel('individual')}
          </CmsCheckbox>
          <CmsCheckbox checkboxSize="medium" checked disabled>
            {participantTypeLabel('school_institution')}
          </CmsCheckbox>
          <CmsCheckbox checkboxSize="medium" checked={false} disabled>
            {participantTypeLabel('teacher_instructor')}
          </CmsCheckbox>
          <CmsCheckbox checkboxSize="medium" checked={false} disabled>
            {participantTypeLabel('volunteer')}
          </CmsCheckbox>
        </div>
      }
    />
  )
}
