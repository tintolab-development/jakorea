/**
 * 1사 1교 프로그램 등록 폼 — 임금 정보
 * (강사비 | 강사 장거리비 2열 × 3행 + 지급/공제 1행 — 스크린 구성)
 */
import { useEffect, useMemo } from 'react'
import {
  paymentItemSelectPlaceholder,
  usePaymentItemCatalogState,
} from '@/features/template/lib/template-registration-payment-item-options'
import {
  COMPANY_SCHOOL_WAGE_DEDUCTION_LABEL,
  nextCompanySchoolWagePaymentItemValues,
} from '@/features/program/1c-1s/lib/company-school-wage-defaults'
import { RegistrationWizardDetailInfoForm as DetailInfoForm } from '@/features/program/shared/ui/registration/registration-wizard-detail-info-form'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { CmsSelectMultipleOption } from '@/shared/ui/cms-select-multiple'
import { RegistrationWageFeeInput } from '@/features/program/shared/ui/registration/wage-fee-input'
import { REGISTRATION_WAGE_GRADE_FEE_MAX } from '@/features/program/shared/lib/wage-fee-input-rules'
import {
  getProgramRegistrationOverlayRecord,
  useProgramRegistrationOverlayKv,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

/** 화면 라벨 — 카탈로그 원문과 매칭해 실제 마스터 id 를 고른다 */
const PAYMENT_LABEL_TRANSPORT_CATALOG = '강사 교통비'
const PAYMENT_LABEL_LODGING_CATALOG = '숙박비 (1사1교)'
/** 시안(9899:215345) 표시 라벨 —「강사 교통비, 숙박비(1사1교)」. 카탈로그 id·정산 키는 그대로 */
const PAYMENT_LABEL_TRANSPORT_1C1S = '강사 교통비'
const PAYMENT_LABEL_LODGING_1C1S = '숙박비(1사1교)'
/** 1사1교 전용 교통·숙박 카탈로그 라벨(`교통비(일사일교)` 등) */
function isCompanySchoolTransportLabel(label: string): boolean {
  return /^교통비\((일사일교|1사1교)\)$/.test(label.replace(/\s+/g, ''))
}
function isCompanySchoolLodgingLabel(label: string): boolean {
  return /^숙박비\((일사일교|1사1교)\)$/.test(label.replace(/\s+/g, ''))
}

const WAGE_FEE_ROWS = [
  {
    feeLabel: '1급 강사비',
    distanceLabel: '1급 강사 장거리비',
    feeKey: 'economyRegistration.wageInfo.grade1Fee',
    distanceKey: 'economyRegistration.wageInfo.grade1DistanceFee',
    maxText: '최대 500,000원',
    max: REGISTRATION_WAGE_GRADE_FEE_MAX[1],
    validationFeeKey: 'wage.grade1Fee',
    validationDistanceKey: 'wage.grade1DistanceFee',
  },
  {
    feeLabel: '2급 강사비',
    distanceLabel: '2급 강사 장거리비',
    feeKey: 'economyRegistration.wageInfo.grade2Fee',
    distanceKey: 'economyRegistration.wageInfo.grade2DistanceFee',
    maxText: '최대 400,000원',
    max: REGISTRATION_WAGE_GRADE_FEE_MAX[2],
    validationFeeKey: 'wage.grade2Fee',
    validationDistanceKey: 'wage.grade2DistanceFee',
  },
  {
    feeLabel: '3급 강사비',
    distanceLabel: '3급 강사 장거리비',
    feeKey: 'economyRegistration.wageInfo.grade3Fee',
    distanceKey: 'economyRegistration.wageInfo.grade3DistanceFee',
    maxText: '최대 300,000원',
    max: REGISTRATION_WAGE_GRADE_FEE_MAX[3],
    validationFeeKey: 'wage.grade3Fee',
    validationDistanceKey: 'wage.grade3DistanceFee',
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
      <RegistrationWageFeeInput value={value} onChange={setValue} max={max} />
      <span className="detail-info-form--text">원 ({maxText})</span>
    </div>
  )
}

export function OneCOneSRegistrationWageInfoParagraph() {
  const [paymentItemValues, setPaymentItemValues] = useProgramRegistrationOverlayKv<string[]>(
    'economyRegistration.wageInfo.paymentItemValues',
    []
  )

  const paymentCatalog = usePaymentItemCatalogState()
  const remotePaymentOptions = paymentCatalog.options
  const paymentItemOptions = useMemo((): CmsSelectMultipleOption[] => {
    return remotePaymentOptions.map(opt => {
      const label = opt.label.trim()
      // 카탈로그 라벨이 「교통비(일사일교)」「숙박비(일사일교)」여도 시안 표기로 보여 준다(QA 2026-11-13 1사1교 #2)
      if (label === PAYMENT_LABEL_TRANSPORT_CATALOG || isCompanySchoolTransportLabel(label)) {
        return { ...opt, label: PAYMENT_LABEL_TRANSPORT_1C1S }
      }
      if (label === PAYMENT_LABEL_LODGING_CATALOG || isCompanySchoolLodgingLabel(label)) {
        return { ...opt, label: PAYMENT_LABEL_LODGING_1C1S }
      }
      return opt
    })
  }, [remotePaymentOptions])

  useEffect(() => {
    const raw =
      getProgramRegistrationOverlayRecord()['economyRegistration.wageInfo.paymentItemValues']
    const next = nextCompanySchoolWagePaymentItemValues(raw, paymentCatalog.ready)
    if (next == null) return
    setPaymentItemValues(next)
  }, [paymentCatalog.ready, paymentItemValues, remotePaymentOptions, setPaymentItemValues])

  return (
    <DetailInfoForm title="임금 정보" hideHeader mode="edit" className="program-registration-paragraph">
      {WAGE_FEE_ROWS.map(row => (
        <DetailInfoForm.Row key={row.feeLabel} type="double">
          <DetailInfoForm.Field
            label={row.feeLabel}
            validationKey={row.validationFeeKey}
            edit={<HourlyFeeInput overlayKey={row.feeKey} max={row.max} maxText={row.maxText} />}
            view="-"
          />
          <DetailInfoForm.Field
            label={row.distanceLabel}
            validationKey={row.validationDistanceKey}
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
          validationKey="wage.paymentItemValues"
          edit={
            <div className="detail-info-form-inputs-wrapper-no-gap">
              <CmsSelect inputSize="small"
                mode="multiple"
                withAllOption={false}
                value={paymentItemValues}
                onChange={next => setPaymentItemValues(next as string[])}
                options={paymentItemOptions}
                disabled={!paymentCatalog.ready}
                placeholder={paymentItemSelectPlaceholder(paymentCatalog)}
                style={{ width: '100%', minWidth: 0 }}
              />
            </div>
          }
          view="-"
        />
        <DetailInfoForm.Field label="공제 항목" view={COMPANY_SCHOOL_WAGE_DEDUCTION_LABEL} />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
