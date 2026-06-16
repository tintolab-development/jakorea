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
import { resolveGeneralProgramCommonInfo } from '@/features/program/general/lib/detail-common-info-display'

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

  const triggerSave = useCallback(async (): Promise<boolean> => {
    if (savingRef.current || !onSaveEdit || !program) return false
    savingRef.current = true
    try {
      const isValid = await form.trigger()
      if (!isValid) return false
      const values = form.getValues()
      const patch = generalCommonInfoEditValuesToProgramPatch(values, program)
      const resolvedCommon = resolveGeneralProgramCommonInfo(program)
      const draftToSave: Program = {
        ...program,
        ...patch,
        updatedAt: new Date().toISOString(),
        generalCommonInfo: {
          ...resolvedCommon,
          ...program.generalCommonInfo,
          ...patch.generalCommonInfo,
        },
      }
      await onSaveEdit(draftToSave)
      return true
    } catch {
      return false
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
