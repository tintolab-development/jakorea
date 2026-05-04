/**
 * 1사 1교 프로그램 등록 폼 — 임금 정보 (강사비 + 장거리비)
 */
import { useMemo, useState, type ReactNode } from 'react'
import { settlementItemSettingSections } from '@/data/mock/settlement-item-settings'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { AppMultiSelect, type AppMultiSelectOption } from '@/shared/ui/app-multi-select'
import { CmsInput } from '@/shared/ui/cms-input'
import '@/features/template/ui/form-set/program-registration-form/paragraphs/program-registration-paragraph.css'

function gradeFeeRow(label: string, maxLabel: string): ReactNode {
  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field
        label={label}
        fullRow
        edit={
          <div className="detail-info-form-inputs-wrapper">
            <span className="detail-info-form--text">1시간 당</span>
            <CmsInput inputSize="medium" placeholder="직접 입력" width={120} />
            <span className="detail-info-form--text">원 ({maxLabel})</span>
          </div>
        }
        view="-"
      />
    </DetailInfoForm.Row>
  )
}

export function OneCOneSRegistrationWageInfoParagraph() {
  const [paymentItemValues, setPaymentItemValues] = useState<string[]>([])

  const paymentItemOptions = useMemo((): AppMultiSelectOption[] => {
    const section = settlementItemSettingSections.find(s => s.kind === 'payment')
    return (section?.items ?? []).map(item => ({
      value: item.id,
      label: item.title,
    }))
  }, [])

  return (
    <DetailInfoForm title="임금 정보" hideHeader mode="edit" className="program-registration-paragraph">
      {gradeFeeRow('1급 강사비', '최대 500,000원')}
      {gradeFeeRow('1급 장거리비', '최대 200,000원')}
      {gradeFeeRow('2급 강사비', '최대 400,000원')}
      {gradeFeeRow('2급 장거리비', '최대 150,000원')}
      {gradeFeeRow('3급 강사비', '최대 300,000원')}
      {gradeFeeRow('3급 장거리비', '최대 100,000원')}
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
        <DetailInfoForm.Field label="공제 항목" view="원천징수(지방소득세 포함)" />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
