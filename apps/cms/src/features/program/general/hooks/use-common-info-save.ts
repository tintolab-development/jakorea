/**
 * 일반 프로그램 상세 — 공통 정보 저장/리셋
 */

import { useCallback, useRef } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import {
  generalCommonInfoEditValuesToProgramPatch,
  programToGeneralCommonInfoEditValues,
  type GeneralProgramCommonInfoEditFormValues,
} from '@/features/program/general/model/common-info-edit-schema'

export interface UseGeneralProgramCommonInfoSaveOptions {
  form: UseFormReturn<GeneralProgramCommonInfoEditFormValues>
  program: Program | null
  onSaveEdit?: (draft: Program) => Promise<void>
}

export function useGeneralProgramCommonInfoSave({
  form,
  program,
  onSaveEdit,
}: UseGeneralProgramCommonInfoSaveOptions) {
  const savingRef = useRef(false)

  const triggerSave = useCallback(async () => {
    if (savingRef.current || !onSaveEdit || !program) return
    savingRef.current = true
    try {
      const isValid = await form.trigger()
      if (!isValid) return
      const values = form.getValues()
      const patch = generalCommonInfoEditValuesToProgramPatch(values, program)
      const draftToSave: Program = {
        ...program,
        ...patch,
        generalCommonInfo: {
          ...program.generalCommonInfo,
          ...patch.generalCommonInfo,
        },
      }
      await onSaveEdit(draftToSave)
    } finally {
      savingRef.current = false
    }
  }, [form, program, onSaveEdit])

  const resetToProgram = useCallback(() => {
    if (program) {
      form.reset(programToGeneralCommonInfoEditValues(program), { keepDefaultValues: false })
    }
  }, [form, program])

  return { triggerSave, resetToProgram }
}
