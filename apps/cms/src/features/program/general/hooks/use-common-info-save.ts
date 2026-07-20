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
import { useGeneralProgramSponsorEditContext } from '@/features/program/general/hooks/use-general-program-sponsor-edit-context'

export type GeneralProgramCommonInfoSaveResult =
  | { ok: true }
  | { ok: false; kind: 'validation' }
  | { ok: false; kind: 'api'; error: unknown }

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
  const watchedSponsorIds = form.watch('sponsorManagementIds') ?? []
  const sponsorContext = useGeneralProgramSponsorEditContext(watchedSponsorIds)

  const triggerSave = useCallback(async (): Promise<GeneralProgramCommonInfoSaveResult> => {
    if (savingRef.current || !onSaveEdit || !program) {
      return { ok: false, kind: 'validation' }
    }
    savingRef.current = true
    try {
      const isValid = await form.trigger()
      if (!isValid) return { ok: false, kind: 'validation' }
      const values = form.getValues()
      const patch = generalCommonInfoEditValuesToProgramPatch(values, program, sponsorContext)
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
      return { ok: true }
    } catch (error) {
      return { ok: false, kind: 'api', error }
    } finally {
      savingRef.current = false
    }
  }, [form, program, onSaveEdit, sponsorContext])

  const resetToProgram = useCallback(() => {
    if (program) {
      form.reset(programToGeneralCommonInfoEditValues(program, sponsorContext), {
        keepDefaultValues: false,
      })
    }
  }, [form, program, sponsorContext])

  return { triggerSave, resetToProgram }
}
