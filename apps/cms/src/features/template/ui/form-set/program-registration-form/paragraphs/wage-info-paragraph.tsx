import { useMemo, useState } from 'react'
import { settlementItemSettingSections } from '@/data/mock/settlement-item-settings'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { AppMultiSelect, type AppMultiSelectOption } from '@/shared/ui/app-multi-select'
import { CmsInput } from '@/shared/ui/cms-input'

export function ProgramRegistrationWageInfoParagraph() {
  const [paymentItemValues, setPaymentItemValues] = useState<string[]>([])

  const paymentItemOptions = useMemo((): AppMultiSelectOption[] => {
    const section = settlementItemSettingSections.find(s => s.kind === 'payment')
    return (section?.items ?? []).map(item => ({
      value: item.id,
      label: item.title,
    }))
  }, [])

  return (
    <DetailInfoForm title="임금 정보" hideHeader mode="edit">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="1급 강사비"
          fullRow
          edit={
            <div className="detail-info-form-inputs-wrapper">
              <span className="detail-info-form--text">1시간 당</span>
              <CmsInput inputSize="medium" placeholder="직접 입력" width={120} />
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
              <CmsInput inputSize="medium" placeholder="직접 입력" width={120} />
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
              <CmsInput inputSize="medium" placeholder="직접 입력" width={120} />
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
            <div className="detail-info-form-inputs-wrapper-no-gap">
              <AppMultiSelect
                value={paymentItemValues}
                onChange={setPaymentItemValues}
                options={paymentItemOptions}
                placeholder="지급 항목을 선택하세요"
                style={{ width: '100%', minWidth: 0 }}
              />
            </div>
          }
          view="-"
        />
        <DetailInfoForm.Field label="공제 항목" view="일용근로자 원천징수세액" />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
