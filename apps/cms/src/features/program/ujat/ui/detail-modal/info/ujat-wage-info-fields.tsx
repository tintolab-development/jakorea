import { useEffect, useMemo } from 'react'
import {
  getUjatWagePaymentItemOptions,
  normalizeUjatPaymentItemSelection,
  resolveUjatWageDeductionLabel,
  UJAT_DEFAULT_PAYMENT_ITEM_VALUES,
  UJAT_WAGE_OVERLAY_PAYMENT_KEY,
  type UjatWageInfoDisplay,
} from '@/features/program/ujat/lib/ujat-wage-info-display'
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
  const paymentItemOptions = useMemo(() => getUjatWagePaymentItemOptions(), [])

  useEffect(() => {
    if (mode !== 'edit') return
    const raw = getUjatProgramRegistrationOverlayRecord()[UJAT_WAGE_OVERLAY_PAYMENT_KEY]
    // 사용자가 []로 비운 값은 유지. 미기록(undefined)만 초기 시드.
    if (raw !== undefined) return
    setPaymentItemValues([...UJAT_DEFAULT_PAYMENT_ITEM_VALUES])
  }, [mode, setPaymentItemValues])

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
              <CmsSelect
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
                placeholder="지급 항목을 선택하세요"
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
