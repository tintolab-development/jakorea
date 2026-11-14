import { memo, useCallback, useMemo } from 'react'
import {
  excludeCompanySchoolOnlyPaymentItemOptions,
  normalizeProgramPaymentItemSelection,
  PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL,
  resolveProgramWageDeductionLabel,
  useNormalizeProgramPaymentItemValues,
  useProgramWagePaymentItemOptionsState,
} from '@/features/program/shared/lib/program-wage-payment-item-helpers'
import { paymentItemSelectPlaceholder } from '@/features/template/lib/template-registration-payment-item-options'
import { RegistrationWizardDetailInfoForm as DetailInfoForm } from '@/features/program/shared/ui/registration/registration-wizard-detail-info-form'
import { CmsSelect } from '@/shared/ui/cms-select'
import { RegistrationWageFeeInput } from '@/features/program/shared/ui/registration/wage-fee-input'
import { REGISTRATION_WAGE_GRADE_FEE_MAX } from '@/features/program/shared/lib/wage-fee-input-rules'
import {
  patchProgramRegistrationOverlay,
  useProgramRegistrationOverlayKv,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import './program-registration-paragraph.css'

const WAGE_GRADE_ROWS = [
  { label: '1급 강사비', max: REGISTRATION_WAGE_GRADE_FEE_MAX[1], maxLabel: '500,000' },
  { label: '2급 강사비', max: REGISTRATION_WAGE_GRADE_FEE_MAX[2], maxLabel: '400,000' },
  { label: '3급 강사비', max: REGISTRATION_WAGE_GRADE_FEE_MAX[3], maxLabel: '300,000' },
] as const

const WageGradeFeeField = memo(function WageGradeFeeField({
  overlayKey,
  validationKey,
  row,
}: {
  overlayKey: string
  validationKey: string
  row: (typeof WAGE_GRADE_ROWS)[number]
}) {
  const [value, setValue] = useProgramRegistrationOverlayKv<number | null>(overlayKey, null)
  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field
        label={row.label}
        validationKey={validationKey}
        fullRow
        edit={
          <div className="detail-info-form-inputs-wrapper">
            <span className="detail-info-form--text">1시간당</span>
            <RegistrationWageFeeInput
              value={value}
              onChange={setValue}
              max={row.max}
              aria-label={row.label}
            />
            <span className="detail-info-form--text">원 (최대 {row.maxLabel}원)</span>
          </div>
        }
        view="-"
      />
    </DetailInfoForm.Row>
  )
})

const WagePaymentItemsField = memo(function WagePaymentItemsField() {
  const [paymentItemValues, setPaymentItemValues] = useProgramRegistrationOverlayKv<string[]>(
    'generalRegistration.wageInfo.paymentItemValues',
    []
  )
  const paymentCatalog = useProgramWagePaymentItemOptionsState()
  // R14: 일반 등록에서는 1사1교 전용 지급 항목을 옵션에서 제외(이미 선택된 값은 유지)
  const paymentItemOptions = useMemo(
    () => excludeCompanySchoolOnlyPaymentItemOptions(paymentCatalog.options, paymentItemValues),
    [paymentCatalog.options, paymentItemValues]
  )
  const applyPaymentItemIds = useCallback(
    (ids: string[]) => {
      setPaymentItemValues(ids)
      const labels = ids
        .map(id => paymentItemOptions.find(o => o.value === id)?.label?.trim())
        .filter((label): label is string => Boolean(label))
      patchProgramRegistrationOverlay({
        'generalRegistration.wageInfo.paymentItemLabels':
          labels.length > 0 ? labels.join(', ') : PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL,
      })
    },
    [paymentItemOptions, setPaymentItemValues]
  )
  useNormalizeProgramPaymentItemValues(paymentItemValues, applyPaymentItemIds, paymentCatalog.ready)
  const deductionLabel = resolveProgramWageDeductionLabel(paymentItemValues)

  return (
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
              onChange={next => {
                applyPaymentItemIds(
                  normalizeProgramPaymentItemSelection(next as string[], paymentItemValues)
                )
              }}
              options={paymentItemOptions}
              disabled={!paymentCatalog.ready}
              placeholder={paymentItemSelectPlaceholder(paymentCatalog)}
              style={{ width: '100%', minWidth: 0 }}
            />
          </div>
        }
        view="-"
      />
      <DetailInfoForm.Field label="공제 항목" view={deductionLabel} />
    </DetailInfoForm.Row>
  )
})

export function ProgramRegistrationWageInfoParagraph() {
  return (
    <DetailInfoForm title="임금 정보" hideHeader mode="edit" className="program-registration-paragraph">
      <WageGradeFeeField
        overlayKey="generalRegistration.wageInfo.grade1Fee"
        validationKey="wage.grade1Fee"
        row={WAGE_GRADE_ROWS[0]}
      />
      <WageGradeFeeField
        overlayKey="generalRegistration.wageInfo.grade2Fee"
        validationKey="wage.grade2Fee"
        row={WAGE_GRADE_ROWS[1]}
      />
      <WageGradeFeeField
        overlayKey="generalRegistration.wageInfo.grade3Fee"
        validationKey="wage.grade3Fee"
        row={WAGE_GRADE_ROWS[2]}
      />
      <WagePaymentItemsField />
    </DetailInfoForm>
  )
}
