import { useEffect, useMemo } from 'react'
import {
  normalizeUjatPaymentItemSelection,
  remapUjatWagePaymentItemOptions,
  resolveUjatDefaultPaymentItemValues,
  resolveUjatWageDeductionLabel,
  UJAT_WAGE_OVERLAY_PAYMENT_KEY,
  type UjatWageInfoDisplay,
} from '@/features/program/ujat/lib/ujat-wage-info-display'
import {
  useNormalizeProgramPaymentItemValues,
  useProgramWagePaymentItemOptionsState,
} from '@/features/program/shared/lib/program-wage-payment-item-helpers'
import { paymentItemSelectPlaceholder } from '@/features/template/lib/template-registration-payment-item-options'
import {
  getUjatProgramRegistrationOverlayRecord,
  useUjatProgramRegistrationOverlayKv,
} from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsSelect } from '@/shared/ui/cms-select'

export function UjatWageInfoFields({
  mode,
  viewDisplay,
}: {
  mode: 'view' | 'edit'
  viewDisplay?: UjatWageInfoDisplay
}) {
  const [paymentItemValues, setPaymentItemValues] = useUjatProgramRegistrationOverlayKv<string[]>(
    UJAT_WAGE_OVERLAY_PAYMENT_KEY,
    []
  )
  const paymentCatalog = useProgramWagePaymentItemOptionsState()
  const paymentItemOptions = useMemo(
    () => remapUjatWagePaymentItemOptions(paymentCatalog.options),
    [paymentCatalog.options]
  )

  useEffect(() => {
    if (mode !== 'edit' || !paymentCatalog.ready) return
    const raw = getUjatProgramRegistrationOverlayRecord()[UJAT_WAGE_OVERLAY_PAYMENT_KEY]
    // 사용자가 []로 비운 값은 유지. 미기록(undefined)만 초기 시드.
    if (raw !== undefined) return
    setPaymentItemValues(resolveUjatDefaultPaymentItemValues())
  }, [mode, paymentCatalog.ready, setPaymentItemValues])

  useNormalizeProgramPaymentItemValues(
    mode === 'edit' ? paymentItemValues : undefined,
    setPaymentItemValues,
    paymentCatalog.ready
  )

  const editPaymentIds = paymentItemValues
  const editDeductionLabel = resolveUjatWageDeductionLabel(editPaymentIds)

  const viewPaymentText = viewDisplay?.paymentItemsText ?? '-'
  const viewDeductionText = viewDisplay?.deductionItemsText ?? '-'

  return (
    <DetailInfoForm.Row type="double">
      <DetailInfoForm.Field
        label="지급 항목"
        validationKey="wage.paymentItemValues"
        view={viewPaymentText}
        edit={
          mode === 'edit' ? (
            <div className="detail-info-form-inputs-wrapper-no-gap">
              <CmsSelect inputSize="small"
                mode="multiple"
                withAllOption={false}
                value={editPaymentIds}
                onChange={next => {
                  const selected = next as string[]
                  setPaymentItemValues(
                    normalizeUjatPaymentItemSelection(selected, editPaymentIds)
                  )
                }}
                options={paymentItemOptions}
                disabled={!paymentCatalog.ready}
                placeholder={paymentItemSelectPlaceholder(paymentCatalog)}
                style={{ width: '100%', minWidth: 0 }}
              />
            </div>
          ) : undefined
        }
      />
      <DetailInfoForm.Field
        label="공제 항목"
        view={mode === 'edit' ? editDeductionLabel : viewDeductionText}
      />
    </DetailInfoForm.Row>
  )
}
