import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

function CurriculumRow({ index }: { index: number }) {
  return (
    <DetailInfoForm.Row type="double">
      <DetailInfoForm.Field
        label={`${index}차시 단원명`}
        edit={<CmsInput inputSize="medium" placeholder="단원명을 입력하세요" width="100%" />}
        view="-"
      />
      <DetailInfoForm.Field
        label={`${index}차시 교육 내용`}
        edit={<CmsInput inputSize="medium" placeholder="교육 내용을 작성하세요" width="100%" />}
        view="-"
      />
    </DetailInfoForm.Row>
  )
}

export function OneCOneSRegistrationEducationCurriculumParagraph() {
  return (
    <DetailInfoForm
      title="교육 진행 (커리큘럼)"
      hideHeader
      mode="edit"
      className="program-registration-paragraph"
    >
      <CurriculumRow index={1} />
      <CurriculumRow index={2} />
    </DetailInfoForm>
  )
}
