import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

export function UjatPaymentInfoParagraph() {
  return (
    <DetailInfoForm title="입금 정보" hideHeader mode="edit" className="program-registration-paragraph">
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="은행명"
          edit={<CmsInput inputSize="medium" width="100%" placeholder="은행명을 입력해 주세요" />}
          view="-"
        />
        <DetailInfoForm.Field
          label="계좌번호"
          edit={<CmsInput inputSize="medium" width="100%" placeholder="계좌번호를 입력해 주세요" />}
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
