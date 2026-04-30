import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'

export function ProgramRegistrationWageInfoParagraph() {
  return (
    <DetailInfoForm title="임금 정보" hideHeader mode="edit">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="1급 강사비"
          fullRow
          edit={
            <div className="detail-info-form-inputs-wrapper">
              <span className="detail-info-form--text">1시간 당</span>
              <CmsInput disabled inputSize="medium" placeholder="직접 입력" width={120} />
              <span className="detail-info-form--text">원 (최대 500,000원)</span>
            </div>
          }
          view="-"
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="2급 강사비"
          fullRow
          edit={
            <div className="detail-info-form-inputs-wrapper">
              <span className="detail-info-form--text">1시간 당</span>
              <CmsInput disabled inputSize="medium" placeholder="직접 입력" width={120} />
              <span className="detail-info-form--text">원 (최대 400,000원)</span>
            </div>
          }
          view="-"
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="3급 강사비"
          fullRow
          edit={
            <div className="detail-info-form-inputs-wrapper">
              <span className="detail-info-form--text">1시간 당</span>
              <CmsInput disabled inputSize="medium" placeholder="직접 입력" width={120} />
              <span className="detail-info-form--text">원 (최대 300,000원)</span>
            </div>
          }
          view="-"
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="지급 항목"
          edit={
            <CmsSelect
              disabled
              inputSize="medium"
              withAllOption={false}
              placeholder="교통비(실비), 숙박비(실비), 기타"
              width="100%"
            />
          }
          view="-"
        />
        <DetailInfoForm.Field
          label="공제 항목"
          edit={
            <CmsSelect
              disabled
              inputSize="medium"
              withAllOption={false}
              placeholder="원천징수 등"
              width="100%"
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
