import { useMemo } from 'react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import {
  normalizeUjatPaymentItemSelection,
  remapUjatWagePaymentItemOptions,
  resolveUjatWageDeductionLabel,
  type UjatWageInfoDisplay,
} from '@/features/program/ujat/lib/ujat-wage-info-display'
import {
  useNormalizeProgramPaymentItemValues,
  useProgramWagePaymentItemOptionsState,
} from '@/features/program/shared/lib/program-wage-payment-item-helpers'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
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
  // 지급 항목 목록(정산 설정)은 수정 모드 선택지에만 쓴다. 보기 모드는 viewDisplay 문구를 쓰므로 부르지 않는다.
  const paymentCatalog = useProgramWagePaymentItemOptionsState(mode === 'edit')
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
            // 시안(등록 폼_공통 · 임금 정보)은 지급 항목 선택 박스만 둔다. `기본 항목 추가` 버튼을 다시 넣지 않는다.
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
                  placeholder="선택해 주세요"
                  style={{ width: '100%', minWidth: 0 }}
                />
              )}
            />
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
