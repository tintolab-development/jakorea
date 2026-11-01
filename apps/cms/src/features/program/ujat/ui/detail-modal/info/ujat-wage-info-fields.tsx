import { useMemo } from 'react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import {
  normalizeUjatPaymentItemSelection,
  remapUjatWagePaymentItemOptions,
  resolveUjatDefaultPaymentItemValues,
  resolveUjatWageDeductionLabel,
  type UjatWageInfoDisplay,
} from '@/features/program/ujat/lib/ujat-wage-info-display'
import {
  useNormalizeProgramPaymentItemValues,
  useProgramWagePaymentItemOptionsState,
} from '@/features/program/shared/lib/program-wage-payment-item-helpers'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsSelect } from '@/shared/ui/cms-select'

export function UjatWageInfoFields({
  mode,
  viewDisplay,
  form,
}: {
  mode: 'view' | 'edit'
  viewDisplay?: UjatWageInfoDisplay
  form?: UseFormReturn<ProgramDetailEditFormValues>
}) {
  const paymentCatalog = useProgramWagePaymentItemOptionsState()
  const paymentItemOptions = useMemo(
    () => remapUjatWagePaymentItemOptions(paymentCatalog.options),
    [paymentCatalog.options]
  )
  const watchedIds = form?.watch('wagePaymentItemIds') ?? []
  const setPaymentItemValues = (next: string[]) => {
    form?.setValue('wagePaymentItemIds', next, { shouldDirty: true, shouldValidate: true })
  }

  useNormalizeProgramPaymentItemValues(
    mode === 'edit' && form != null ? watchedIds : undefined,
    setPaymentItemValues,
    paymentCatalog.ready
  )

  const editPaymentIds = watchedIds
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
          mode === 'edit' && form != null ? (
            <div className="detail-info-form-inputs-wrapper-no-gap">
              <Controller
                name="wagePaymentItemIds"
                control={form.control}
                render={({ field }) => (
                  <CmsSelect
                    inputSize="small"
                    mode="multiple"
                    withAllOption={false}
                    value={field.value ?? []}
                    onChange={next => {
                      const selected = next as string[]
                      field.onChange(normalizeUjatPaymentItemSelection(selected, field.value ?? []))
                    }}
                    options={paymentItemOptions}
                    disabled={!paymentCatalog.ready}
                    placeholder="선택하세요"
                    style={{ width: '100%', minWidth: 0 }}
                  />
                )}
              />
              {editPaymentIds.length === 0 ? (
                <CmsButton
                  type="button"
                  variant="secondary"
                  size="small"
                  onClick={() =>
                    setPaymentItemValues(resolveUjatDefaultPaymentItemValues())
                  }
                >
                  기본 항목 추가
                </CmsButton>
              ) : null}
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
