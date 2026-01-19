/**
 * 정산 폼 로직 훅
 */

import { useMemo } from 'react'
import { useFieldArray, useForm, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { settlementSchema, type SettlementFormData } from '@/entities/settlement/model/schema'
import type { Settlement } from '@/types/domain'
import { mockMatchings } from '@/data/mock'
import { calculateSettlementTotal } from '../lib/settlement-helpers'

interface UseSettlementFormResult {
  form: UseFormReturn<SettlementFormData>
  fields: ReturnType<typeof useFieldArray<SettlementFormData>>['fields']
  append: ReturnType<typeof useFieldArray<SettlementFormData>>['append']
  remove: ReturnType<typeof useFieldArray<SettlementFormData>>['remove']
  selectedProgramId?: string
  selectedInstructorId?: string
  availableMatchings: typeof mockMatchings
  totalAmount: number
}

export function useSettlementForm(settlement?: Settlement): UseSettlementFormResult {
  const form = useForm<SettlementFormData>({
    resolver: zodResolver(settlementSchema),
    defaultValues: (() => {
      if (settlement) {
        const status: SettlementFormData['status'] =
          settlement.status === 'review' ? 'calculated' : settlement.status
        return {
          programId: settlement.programId,
          instructorId: settlement.instructorId,
          matchingId: settlement.matchingId,
          period: settlement.period,
          items: settlement.items,
          status,
          notes: settlement.notes || '',
        }
      }
      return {
        items: [{ type: 'instructor_fee', description: '강사비', amount: 0 }],
        status: 'pending' as const,
      }
    })(),
  })

  const { control, watch } = form

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const selectedProgramId = watch('programId')
  const selectedInstructorId = watch('instructorId')

  const filteredMatchings = selectedProgramId
    ? mockMatchings.filter(m => m.programId === selectedProgramId)
    : []

  const availableMatchings = selectedInstructorId
    ? filteredMatchings.filter(m => m.instructorId === selectedInstructorId)
    : filteredMatchings

  const totalAmount = useMemo(
    () => calculateSettlementTotal(watch('items') || []),
    [watch]
  )

  return {
    form,
    fields,
    append,
    remove,
    selectedProgramId,
    selectedInstructorId,
    availableMatchings,
    totalAmount,
  }
}
