/**
 * 교육받은 교사 — 교육일지 설정 (있음/없음). 과제와 별개.
 */
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { useProgramRegistrationOverlayKv } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

export const TRAINED_TEACHERS_EDUCATION_JOURNAL_OVERLAY_KEY =
  'trainedTeachersRegistration.educationCurriculum.educationJournalEnabled' as const

export function TrainedTeachersEducationJournalSettingsRow() {
  const [educationJournalEnabled, setEducationJournalEnabled] = useProgramRegistrationOverlayKv<
    'yes' | 'no'
  >(TRAINED_TEACHERS_EDUCATION_JOURNAL_OVERLAY_KEY, 'yes')

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
              size="large"
              value={educationJournalEnabled}
              onChange={e => setEducationJournalEnabled(e.target.value as 'yes' | 'no')}
            >
              <CmsRadio value="yes">있음</CmsRadio>
              <CmsRadio value="no">없음</CmsRadio>
            </CmsRadioGroup>
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
