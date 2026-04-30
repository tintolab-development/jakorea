import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'

export function ProgramRegistrationEducationCurriculumParagraph() {
  return (
    <DetailInfoForm
      title="교육 진행 (커리큘럼)"
      hideHeader
      mode="edit"
      className="program-registration-paragraph"
    >
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="1차시 진행명"
          edit={<CmsInput disabled inputSize="large" placeholder="강의명을 입력해주세요" width="100%" />}
          view="-"
        />
        <DetailInfoForm.Field
          label="1차시 교육 내용"
          edit={<CmsInput disabled inputSize="large" placeholder="교육 내용을 입력해주세요" width="100%" />}
          view="-"
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="2차시 진행명"
          edit={<CmsInput disabled inputSize="large" placeholder="강의명을 입력해주세요" width="100%" />}
          view="-"
        />
        <DetailInfoForm.Field
          label="2차시 교육 내용"
          edit={<CmsInput disabled inputSize="large" placeholder="교육 내용을 입력해주세요" width="100%" />}
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
