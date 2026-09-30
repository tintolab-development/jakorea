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
import { applyGeneralRegistrationOverlayToProgram } from '@/features/program/general/lib/registration-overlay-to-program'
import {
  getGeneralRegistrationDetailEditExtras,
  hasIncompleteGeneralProgramDetailEditRequiredFields,
  readGeneralRegistrationOverlayForSave,
  resyncGeneralRegistrationOverlayFromProgram,
} from '@/features/program/general/lib/registration-overlay-sync'
import { useGeneralProgramSponsorEditContext } from '@/features/program/general/hooks/use-general-program-sponsor-edit-context'
import { useDetailedProgramOptionsQuery } from '@/features/detailed-program/hooks/use-detailed-program-options-query'
import { useProgramWagePaymentItemOptions } from '@/features/program/shared/lib/program-wage-payment-item-helpers'
import { resolvePersistedProgramTargetLevels } from '@/features/program/shared/lib/program-detail-info-constants'
import { showUpdateCompletedAlert } from '@/shared/ui'

export type GeneralProgramCommonInfoSaveResult =
  | { ok: true }
  | { ok: false; kind: 'validation' }
  | { ok: false; kind: 'api'; error: unknown }

export interface UseGeneralProgramCommonInfoSaveOptions {
  form: UseFormReturn<GeneralProgramCommonInfoEditFormValues>
  program: Program | null
  /** draft = 화면용 병합본, patch = remote PATCH에 실을 변경 키만 */
  onSaveEdit?: (draft: Program, patch: Partial<Program>) => Promise<void>
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

  const triggerSave = useCallback(async (): Promise<GeneralProgramCommonInfoSaveResult> => {
    if (savingRef.current || !onSaveEdit || !program) {
      return { ok: false, kind: 'validation' }
    }
    savingRef.current = true
    try {
      const overlay = readGeneralRegistrationOverlayForSave()
      const extras = getGeneralRegistrationDetailEditExtras()
      if (hasIncompleteGeneralProgramDetailEditRequiredFields(overlay, extras)) {
        return { ok: false, kind: 'validation' }
      }
      const applied = applyGeneralRegistrationOverlayToProgram(program, overlay, extras)
      const withType: Program = {
        ...applied,
        generalProgramEducationStructure: extras.programType,
        generalProgramSessionRound: extras.sessionRoundType,
        registrationOverlay: overlay,
        updatedAt: new Date().toISOString(),
      }
      const syncedOverlay = resyncGeneralRegistrationOverlayFromProgram(withType, overlay)
      const withOverlay: Program = {
        ...withType,
        registrationOverlay: syncedOverlay,
      }
      const values = {
        ...programToGeneralCommonInfoEditValues(
          withOverlay,
          sponsorContext,
          detailedProgramCatalog
        ),
        educationStructure: extras.programType,
        sessionRound: extras.sessionRoundType,
      }
      const patch = generalCommonInfoEditValuesToProgramPatch(
        values,
        withOverlay,
        sponsorContext,
        detailedProgramCatalog,
        paymentItemOptions
      )
      const persistedTargetLevels = resolvePersistedProgramTargetLevels(program)
      const draftToSave: Program = {
        ...withOverlay,
        ...patch,
        registrationOverlay: syncedOverlay,
        generalCommonInfo: {
          ...withOverlay.generalCommonInfo,
          ...patch.generalCommonInfo,
        },
        ...(persistedTargetLevels.length > 0
          ? { targetLevels: persistedTargetLevels, targetLevel: persistedTargetLevels[0] }
          : {}),
      }
      await onSaveEdit(draftToSave, {
        ...patch,
        registrationOverlay: syncedOverlay,
        ...(persistedTargetLevels.length > 0 ? { targetLevels: persistedTargetLevels } : {}),
      })
      showUpdateCompletedAlert()
      return { ok: true }
    } catch (error) {
      return { ok: false, kind: 'api', error }
    } finally {
      savingRef.current = false
    }
  }, [program, onSaveEdit, sponsorContext, detailedProgramCatalog, paymentItemOptions])

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
