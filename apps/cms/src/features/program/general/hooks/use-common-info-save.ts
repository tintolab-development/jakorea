/**
 * 일반 프로그램 상세 — 공통 정보 저장/리셋
 * RHF form.getValues() → Independent PATCH → nested-ssot serialize
 *
 * 교육받은 교사는 이 훅에서 overlay-first 저장하지 않는다.
 * 전용 모달(`ProgramDetailFullPageModal` + nested persist)만 사용한다.
 */

import { useCallback, useRef } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import {
  programToGeneralCommonInfoEditValues,
  type GeneralProgramCommonInfoEditFormValues,
} from '@/features/program/general/model/common-info-edit-schema'
import {
  hasRhfCurriculumMultiDateScheduleCountMismatch,
  parseGeneralCommonInfoRhfValidation,
  type GeneralCommonInfoValidationAlertKind,
} from '@/features/program/general/lib/overlay-phase1/common-info-rhf-validation'
import { logGeneralProgramCommonInfoIndependentSave } from '@/features/program/general/lib/common-info-edit-payload-log'
import { writeGeneralRegistrationOverlayFromCommonInfoFormValues } from '@/features/program/general/lib/registration-overlay-sync'
import { useGeneralProgramSponsorEditContext } from '@/features/program/general/hooks/use-general-program-sponsor-edit-context'
import { useDetailedProgramOptionsQuery } from '@/features/detailed-program/hooks/use-detailed-program-options-query'
import { useProgramWagePaymentItemOptions } from '@/features/program/shared/lib/program-wage-payment-item-helpers'
import { showUpdateCompletedAlert } from '@/shared/ui'
import type { GeneralProgramUpdateSerializeOptions } from '@/features/program/general/api/adapters/general-program-adapters'
import { createGeneralProgramCommonInfoIndependentSave } from '@/features/program/general/lib/overlay-phase1/common-info-independent-save'
import { isTrainedTeachersDetailProgram } from '@/features/program/trained-teachers/lib/is-trained-teachers-detail-program'

export const TRAINED_TEACHERS_DEDICATED_DETAIL_SAVE_KIND =
  'trained-teachers-dedicated-path' as const

export type GeneralProgramCommonInfoSaveResult =
  | { ok: true }
  | {
      ok: false
      kind: 'validation'
      keys: readonly string[]
      message?: string
      title?: string
      alertKind?: GeneralCommonInfoValidationAlertKind
    }
  | { ok: false; kind: 'schedule-count-mismatch' }
  | { ok: false; kind: typeof TRAINED_TEACHERS_DEDICATED_DETAIL_SAVE_KIND }
  | { ok: false; kind: 'api'; error: unknown }

export interface UseGeneralProgramCommonInfoSaveOptions {
  form: UseFormReturn<GeneralProgramCommonInfoEditFormValues>
  program: Program | null
  /** draft = 화면용 병합본, patch = remote PATCH에 실을 변경 키만 */
  onSaveEdit?: (
    draft: Program,
    patch: Partial<Program>,
    baseline: Program,
    serializeOptions?: GeneralProgramUpdateSerializeOptions
  ) => Promise<void>
}

function collectDirtyFormKeys(dirtyFields: unknown): ReadonlySet<string> | undefined {
  if (dirtyFields == null || typeof dirtyFields !== 'object' || Array.isArray(dirtyFields)) {
    return undefined
  }
  return new Set(Object.keys(dirtyFields as Record<string, unknown>))
}

export function useGeneralProgramCommonInfoSave({
  form,
  program,
  onSaveEdit,
}: UseGeneralProgramCommonInfoSaveOptions) {
  const savingRef = useRef(false)
  const watchedSponsorIds = form.watch('sponsorManagementIds') ?? []
  const sponsorContext = useGeneralProgramSponsorEditContext(watchedSponsorIds)
  const detailedProgramsQuery = useDetailedProgramOptionsQuery(Boolean(program))
  const detailedProgramCatalog = detailedProgramsQuery.data
  const paymentItemOptions = useProgramWagePaymentItemOptions()
  // dirtyFields 는 render 구독이 있어야 저장 시점에도 최신이다. callback 안에서만 읽으면 항상 {} 가 된다.
  const dirtyFields = form.formState.dirtyFields

  const triggerSave = useCallback(async (): Promise<GeneralProgramCommonInfoSaveResult> => {
    if (savingRef.current || !onSaveEdit || !program) {
      return { ok: false, kind: 'validation', keys: [] }
    }
    savingRef.current = true
    try {
      if (isTrainedTeachersDetailProgram(program)) {
        return { ok: false, kind: TRAINED_TEACHERS_DEDICATED_DETAIL_SAVE_KIND }
      }
      const values = form.getValues()
      const changedFormKeys = collectDirtyFormKeys(dirtyFields)
      const independent = createGeneralProgramCommonInfoIndependentSave({
        values,
        program,
        context: sponsorContext,
        detailedProgramCatalog,
        paymentItemOptions,
        changedFormKeys,
      })
      const rhfValidation = parseGeneralCommonInfoRhfValidation(values)
      logGeneralProgramCommonInfoIndependentSave({
        programId: program.id,
        values,
        rhfValidation,
        patch: independent.patch,
      })
      if (!rhfValidation.ok) {
        if (typeof form.trigger === 'function') {
          await form.trigger()
        }
        const firstPath = rhfValidation.issues[0]?.path
        if (firstPath && firstPath.length > 0 && typeof form.setFocus === 'function') {
          const name = firstPath
            .filter(part => typeof part === 'string' || typeof part === 'number')
            .join('.')
          form.setFocus(name as never)
        }
        return {
          ok: false,
          kind: 'validation',
          keys: rhfValidation.keys,
          message: rhfValidation.message,
          title: rhfValidation.title,
          alertKind: rhfValidation.alertKind,
        }
      }
      if (hasRhfCurriculumMultiDateScheduleCountMismatch(values)) {
        return { ok: false, kind: 'schedule-count-mismatch' }
      }
      writeGeneralRegistrationOverlayFromCommonInfoFormValues(independent.programDraft)
      await onSaveEdit(
        independent.programDraft,
        independent.patch,
        program,
        independent.serializeOptions
      )
      showUpdateCompletedAlert()
      return { ok: true }
    } catch (error) {
      return { ok: false, kind: 'api', error }
    } finally {
      savingRef.current = false
    }
  }, [
    form,
    program,
    onSaveEdit,
    sponsorContext,
    detailedProgramCatalog,
    paymentItemOptions,
    dirtyFields,
  ])

  const resetToProgram = useCallback(() => {
    if (program) {
      form.reset(
        programToGeneralCommonInfoEditValues(program, sponsorContext, detailedProgramCatalog),
        {
          keepDefaultValues: false,
        }
      )
    }
  }, [form, program, sponsorContext, detailedProgramCatalog])

  return { triggerSave, resetToProgram }
}
