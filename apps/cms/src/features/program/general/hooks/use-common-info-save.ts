/**
 * 일반 프로그램 상세 — 공통 정보 저장/리셋
 * RHF form.getValues() → Independent PATCH → nested-ssot serialize
 */

import { useCallback, useRef } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import {
  generalCommonInfoEditValuesToProgramPatch,
  programToGeneralCommonInfoEditValues,
  type GeneralProgramCommonInfoEditFormValues,
} from '@/features/program/general/model/common-info-edit-schema'
import {
  hasCurriculumMultiDateScheduleCountMismatch,
  listIncompleteGeneralProgramRegistrationRequiredFields,
} from '@/features/program/general/lib/registration-required-fields'
import {
  hasRhfCurriculumMultiDateScheduleCountMismatch,
  parseGeneralCommonInfoRhfValidation,
  type GeneralCommonInfoValidationAlertKind,
} from '@/features/program/general/lib/overlay-phase1/common-info-rhf-validation'
import { logGeneralProgramCommonInfoIndependentSave } from '@/features/program/general/lib/common-info-edit-payload-log'
import { applyGeneralRegistrationOverlayToProgram } from '@/features/program/general/lib/registration-overlay-to-program'
import {
  generalRegistrationRequiredFieldContextFromDetailEdit,
  getGeneralRegistrationDetailEditExtras,
  readGeneralRegistrationOverlayForSave,
  resyncGeneralRegistrationOverlayFromProgram,
  writeGeneralRegistrationOverlayFromCommonInfoFormValues,
} from '@/features/program/general/lib/registration-overlay-sync'
import { useGeneralProgramSponsorEditContext } from '@/features/program/general/hooks/use-general-program-sponsor-edit-context'
import { useDetailedProgramOptionsQuery } from '@/features/detailed-program/hooks/use-detailed-program-options-query'
import { useProgramWagePaymentItemOptions } from '@/features/program/shared/lib/program-wage-payment-item-helpers'
import { resolvePersistedProgramTargetLevels } from '@/features/program/shared/lib/program-detail-info-constants'
import { showUpdateCompletedAlert } from '@/shared/ui'
import type { GeneralProgramUpdateSerializeOptions } from '@/features/program/general/api/adapters/general-program-adapters'
import { createGeneralProgramCommonInfoIndependentSave } from '@/features/program/general/lib/overlay-phase1/common-info-independent-save'
import { isTrainedTeachersDetailProgram } from '@/features/program/trained-teachers/lib/is-trained-teachers-detail-program'

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

function saveViaLegacyOverlayFirst(args: {
  form: UseFormReturn<GeneralProgramCommonInfoEditFormValues>
  program: Program
  onSaveEdit: NonNullable<UseGeneralProgramCommonInfoSaveOptions['onSaveEdit']>
  sponsorContext: ReturnType<typeof useGeneralProgramSponsorEditContext>
  detailedProgramCatalog: ReturnType<typeof useDetailedProgramOptionsQuery>['data']
  paymentItemOptions: ReturnType<typeof useProgramWagePaymentItemOptions>
}): Promise<void> {
  const extras = getGeneralRegistrationDetailEditExtras()
  const overlay = readGeneralRegistrationOverlayForSave()
  const appliedFromOverlay = applyGeneralRegistrationOverlayToProgram(
    args.program,
    overlay,
    extras
  )
  const withType: Program = {
    ...appliedFromOverlay,
    generalProgramEducationStructure: extras.programType,
    generalProgramSessionRound: extras.sessionRoundType,
  }
  const syncedOverlay = resyncGeneralRegistrationOverlayFromProgram(withType, overlay)
  const persistedTargetLevels = resolvePersistedProgramTargetLevels(args.program)
  const draftToSave: Program = {
    ...withType,
    registrationOverlay: syncedOverlay,
    ...(persistedTargetLevels.length > 0
      ? { targetLevels: persistedTargetLevels, targetLevel: persistedTargetLevels[0] }
      : {}),
    updatedAt: new Date().toISOString(),
  }
  const valuesFromDraft = programToGeneralCommonInfoEditValues(
    draftToSave,
    args.sponsorContext,
    args.detailedProgramCatalog
  )
  const patch = generalCommonInfoEditValuesToProgramPatch(
    {
      ...valuesFromDraft,
      educationStructure: extras.programType,
      sessionRound: extras.sessionRoundType,
    },
    draftToSave,
    args.sponsorContext,
    args.detailedProgramCatalog,
    args.paymentItemOptions
  )
  return args.onSaveEdit(
    draftToSave,
    {
      ...patch,
      registrationOverlay: syncedOverlay,
      generalProgramEducationStructure: extras.programType,
      generalProgramSessionRound: extras.sessionRoundType,
      ...(persistedTargetLevels.length > 0 ? { targetLevels: persistedTargetLevels } : {}),
    },
    args.program
  )
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
      const values = form.getValues()
      const changedFormKeys = collectDirtyFormKeys(dirtyFields)
      const independent = isTrainedTeachersDetailProgram(program)
        ? null
        : createGeneralProgramCommonInfoIndependentSave({
            values,
            program,
            context: sponsorContext,
            detailedProgramCatalog,
            paymentItemOptions,
            changedFormKeys,
          })

      if (independent) {
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
      }

      const extras = getGeneralRegistrationDetailEditExtras()
      const overlay = readGeneralRegistrationOverlayForSave()
      const requiredCtx = generalRegistrationRequiredFieldContextFromDetailEdit(overlay, extras)
      const incompleteKeys = listIncompleteGeneralProgramRegistrationRequiredFields(
        overlay,
        requiredCtx
      )
      if (incompleteKeys.length > 0) {
        return { ok: false, kind: 'validation', keys: incompleteKeys }
      }
      if (hasCurriculumMultiDateScheduleCountMismatch(overlay, requiredCtx)) {
        return { ok: false, kind: 'schedule-count-mismatch' }
      }

      await saveViaLegacyOverlayFirst({
        form,
        program,
        onSaveEdit,
        sponsorContext,
        detailedProgramCatalog,
        paymentItemOptions,
      })
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
