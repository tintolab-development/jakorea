/**
 * 1사 1교 프로그램 등록 폼 — 임금 정보
 * (강사비 | 강사 장거리비 2열 × 3행 + 지급/공제 1행 — 스크린 구성)
 */
import { useMemo } from 'react'
import { getTemplateRegistrationPaymentItemOptions } from '@/features/template/lib/template-registration-payment-item-options'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { CmsSelectMultipleOption } from '@/shared/ui/cms-select-multiple'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { useProgramRegistrationOverlayKv } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

const DEDUCTION_VIEW = '일용근로자 원천징수세액'

/** 스크린 표기: mock `p-2`·`p-7`과 동일 항목, 라벨만 화면 문구에 맞춤 */
const PAYMENT_ID_TRANSPORT_1C1S = 'p-2'
const PAYMENT_ID_LODGING_1C1S = 'p-7'

const WAGE_FEE_ROWS = [
  {
    feeLabel: '1급 강사비',
    distanceLabel: '1급 강사 장거리비',
    feeKey: 'economyRegistration.wageInfo.grade1Fee',
    distanceKey: 'economyRegistration.wageInfo.grade1DistanceFee',
    maxText: '최대 500,000원',
    max: 500_000,
  },
  {
    feeLabel: '2급 강사비',
    distanceLabel: '2급 강사 장거리비',
    feeKey: 'economyRegistration.wageInfo.grade2Fee',
    distanceKey: 'economyRegistration.wageInfo.grade2DistanceFee',
    maxText: '최대 400,000원',
    max: 400_000,
  },
  {
    feeLabel: '3급 강사비',
    distanceLabel: '3급 강사 장거리비',
    feeKey: 'economyRegistration.wageInfo.grade3Fee',
    distanceKey: 'economyRegistration.wageInfo.grade3DistanceFee',
    maxText: '최대 300,000원',
    max: 300_000,
  },
] as const

function HourlyFeeInput({
  overlayKey,
  max,
  maxText,
}: {
  overlayKey: string
  max: number
  maxText: string
}) {
  const [value, setValue] = useProgramRegistrationOverlayKv<number | null>(overlayKey, null)
  return (
    <div className="detail-info-form-inputs-wrapper">
      <span className="detail-info-form--text">1시간 당</span>
      <CmsNumericInput
        mode="currency"
        min={0}
        max={max}
        allowNegative={false}
        inputSize="medium"
        placeholder="직접 입력"
        width={120}
        value={value == null ? '' : String(value)}
        onValueChange={raw => {
          const trimmed = raw.trim()
          if (!trimmed) {
            setValue(null)
            return
          }
          const n = Number(trimmed.replace(/,/g, ''))
          setValue(Number.isFinite(n) ? n : null)
        }}
      />
      <span className="detail-info-form--text">원 ({maxText})</span>
    </div>
  )
}

export function OneCOneSRegistrationWageInfoParagraph() {
  const [paymentItemValues, setPaymentItemValues] = useProgramRegistrationOverlayKv<string[]>(
    'economyRegistration.wageInfo.paymentItemValues',
    [PAYMENT_ID_TRANSPORT_1C1S, PAYMENT_ID_LODGING_1C1S]
  )

  const paymentItemOptions = useMemo((): CmsSelectMultipleOption[] => {
    return getTemplateRegistrationPaymentItemOptions().map(opt => {
      if (opt.value === PAYMENT_ID_TRANSPORT_1C1S) {
        return { ...opt, label: '교통비(일사일교)' }
      }
      if (opt.value === PAYMENT_ID_LODGING_1C1S) {
        return { ...opt, label: '숙박비(일사일교)' }
      }
      return opt
    })
  }, [])

  return (
    <DetailInfoForm title="임금 정보" hideHeader mode="edit" className="program-registration-paragraph">
      {WAGE_FEE_ROWS.map(row => (
        <DetailInfoForm.Row key={row.feeLabel} type="double">
          <DetailInfoForm.Field
            label={row.feeLabel}
            edit={<HourlyFeeInput overlayKey={row.feeKey} max={row.max} maxText={row.maxText} />}
            view="-"
          />
          <DetailInfoForm.Field
            label={row.distanceLabel}
            edit={
              <HourlyFeeInput overlayKey={row.distanceKey} max={row.max} maxText={row.maxText} />
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
                onChange={next => setPaymentItemValues(next as string[])}
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
