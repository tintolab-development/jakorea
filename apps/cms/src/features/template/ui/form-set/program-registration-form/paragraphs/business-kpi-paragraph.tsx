import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import './program-registration-paragraph.css'

export function ProgramRegistrationBusinessKpiParagraph() {
  return (
    <DetailInfoForm
      title="사업 KPI 목표"
      hideHeader
      mode="edit"
      className="program-registration-paragraph"
    >
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="참여자 최종 인원"
          edit={<CmsInput disabled inputSize="medium" placeholder="목표값 입력" width={120} />}
          view="-"
        />
        <DetailInfoForm.Field
          label="교육진행자 최종 인원"
          edit={
            <div className="program-registration-paragraph__inline">
              <span className="detail-info-form--text mr-6">강사</span>
              <CmsInput disabled inputSize="medium" placeholder="목표값 입력" width={120} />
              <DetailInfoForm.InputsSeparator />
              <span className="detail-info-form--text mr-6">봉사자</span>
              <CmsInput disabled inputSize="medium" placeholder="목표값 입력" width={120} />
            </div>
          }
          view="-"
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="최초 편성 건수"
          edit={<CmsInput disabled inputSize="medium" placeholder="해당 없음" width={120} />}
          view="-"
        />
        <DetailInfoForm.Field
          label="최종 편성 건수"
          edit={<CmsInput disabled inputSize="medium" placeholder="해당 없음" width={120} />}
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
