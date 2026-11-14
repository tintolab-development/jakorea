/**
 * 교육받은 교사 — 교육일지 설정 (있음/없음). 과제와 별개.
 */
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { useTrainedTeachersRegistrationField } from '@/features/template/ui/form-set/registration-form/trained-teachers/trained-teachers-registration-form-rhf'
import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

export const TRAINED_TEACHERS_EDUCATION_JOURNAL_OVERLAY_KEY =
  'trainedTeachersRegistration.educationCurriculum.educationJournalEnabled' as const

export function TrainedTeachersEducationJournalSettingsRow() {
  // 템플릿 관리 시안(5767:196354): 있음·없음 모두 미선택으로 시작. 등록 위저드·상세는 기존 기본 「없음」
  const isTemplateManagementScreen = useIsTemplateManagementScreen()
  const [educationJournalEnabled, setEducationJournalEnabled] = useTrainedTeachersRegistrationField<
    'yes' | 'no' | ''
  >(TRAINED_TEACHERS_EDUCATION_JOURNAL_OVERLAY_KEY, isTemplateManagementScreen ? '' : 'no')

  return (
    <DetailInfoForm
      title="교육 진행"
      hideHeader
      mode="edit"
      className="program-registration-paragraph"
    >
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="교육일지 설정"
          fullRow
          edit={
            <CmsRadioGroup
              size="medium"
              value={educationJournalEnabled || undefined}
              onChange={e => setEducationJournalEnabled(e.target.value as 'yes' | 'no')}
            >
              <CmsRadio size="medium" value="yes">있음</CmsRadio>
              <CmsRadio size="medium" value="no">없음</CmsRadio>
            </CmsRadioGroup>
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
