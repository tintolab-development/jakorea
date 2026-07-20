import { useMemo, useState } from 'react'
import {
  getProgramWagePaymentItemOptions,
  normalizeProgramPaymentItemSelection,
  resolveProgramWageDeductionLabel,
} from '@/features/program/shared/lib/program-wage-payment-item-helpers'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import './program-registration-paragraph.css'

const WAGE_GRADE_ROWS = [
  { label: '1급 강사비', max: 500_000, maxLabel: '500,000' },
  { label: '2급 강사비', max: 400_000, maxLabel: '400,000' },
  { label: '3급 강사비', max: 300_000, maxLabel: '300,000' },
] as const

export function ProgramRegistrationWageInfoParagraph() {
  const [paymentItemValues, setPaymentItemValues] = useState<string[]>([])

  const paymentItemOptions = useMemo(() => getProgramWagePaymentItemOptions(), [])
  const deductionLabel = resolveProgramWageDeductionLabel(paymentItemValues)

  return (
    <DetailInfoForm title="임금 정보" hideHeader mode="edit" className="program-registration-paragraph">
      {WAGE_GRADE_ROWS.map(row => (
        <DetailInfoForm.Row key={row.label} type="single">
          <DetailInfoForm.Field
            label={row.label}
            fullRow
            edit={
              <div className="detail-info-form-inputs-wrapper">
                <span className="detail-info-form--text">1시간 당</span>
                <CmsNumericInput
                  mode="currency"
                  min={0}
                  max={row.max}
                  allowNegative={false}
                  inputSize="medium"
                  placeholder="직접 입력"
                  width={120}
                />
                <span className="detail-info-form--text">원 (최대 {row.maxLabel}원)</span>
              </div>
            }
            view="-"
          />
        </DetailInfoForm.Row>
      ))}
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="지급 항목"
          edit={
            <div className="detail-info-form-inputs-wrapper-no-gap">
              <CmsSelect
                mode="multiple"
                withAllOption={false}
                value={paymentItemValues}
                onChange={next =>
                  setPaymentItemValues(prev =>
                    normalizeProgramPaymentItemSelection(next as string[], prev)
                  )
                }
                options={paymentItemOptions}
                placeholder="지급 항목을 선택하세요"
                style={{ width: '100%', minWidth: 0 }}
              />
            </div>
          }
          view="-"
        />
        <DetailInfoForm.Field label="공제 항목" view={deductionLabel} />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
