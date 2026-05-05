/**
 * 1사 1교 프로그램 등록 폼 — 임금 정보
 * (강사비 | 강사 장거리비 2열 × 3행 + 지급/공제 1행 — 스크린 구성)
 */
import { useMemo, useState } from 'react'
import { settlementItemSettingSections } from '@/data/mock/settlement-item-settings'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { AppMultiSelect, type AppMultiSelectOption } from '@/shared/ui/app-multi-select'
import { CmsInput } from '@/shared/ui/cms-input'
import '@/features/template/ui/form-set/program-registration-form/paragraphs/program-registration-paragraph.css'

const DEDUCTION_VIEW = '일용근로자 원천징수세액'

/** 스크린 표기: mock `p-2`·`p-7`과 동일 항목, 라벨만 화면 문구에 맞춤 */
const PAYMENT_ID_TRANSPORT_1C1S = 'p-2'
const PAYMENT_ID_LODGING_1C1S = 'p-7'

function hourlyFeeEdit(maxText: string) {
  return (
    <div className="detail-info-form-inputs-wrapper">
      <span className="detail-info-form--text">1시간 당</span>
      <CmsInput inputSize="medium" placeholder="직접 입력" width={120} />
      <span className="detail-info-form--text">원 ({maxText})</span>
    </div>
  )
}

export function OneCOneSRegistrationWageInfoParagraph() {
  const [paymentItemValues, setPaymentItemValues] = useState<string[]>([
    PAYMENT_ID_TRANSPORT_1C1S,
    PAYMENT_ID_LODGING_1C1S,
  ])

  const paymentItemOptions = useMemo((): AppMultiSelectOption[] => {
    const section = settlementItemSettingSections.find(s => s.kind === 'payment')
    return (section?.items ?? []).map(item => {
      if (item.id === PAYMENT_ID_TRANSPORT_1C1S) {
        return { value: item.id, label: '교통비(일사일교)' }
      }
      if (item.id === PAYMENT_ID_LODGING_1C1S) {
        return { value: item.id, label: '숙박비(일사일교)' }
      }
      return { value: item.id, label: item.title }
    })
  }, [])

  return (
    <DetailInfoForm title="임금 정보" hideHeader mode="edit" className="program-registration-paragraph">
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="1급 강사비"
          edit={hourlyFeeEdit('최대 500,000원')}
          view="-"
        />
        <DetailInfoForm.Field
          label="1급 강사 장거리비"
          edit={hourlyFeeEdit('최대 500,000원')}
          view="-"
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="2급 강사비"
          edit={hourlyFeeEdit('최대 400,000원')}
          view="-"
        />
        <DetailInfoForm.Field
          label="2급 강사 장거리비"
          edit={hourlyFeeEdit('최대 400,000원')}
          view="-"
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="3급 강사비"
          edit={hourlyFeeEdit('최대 300,000원')}
          view="-"
        />
        <DetailInfoForm.Field
          label="3급 강사 장거리비"
          edit={hourlyFeeEdit('최대 300,000원')}
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
        <DetailInfoForm.Field label="공제 항목" view={DEDUCTION_VIEW} />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
