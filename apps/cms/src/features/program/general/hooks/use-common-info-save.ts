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
import { useSponsorOptionsQuery } from '@/features/sponsor/hooks/use-sponsor-options-query'
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'
import { useProgramWagePaymentItemOptionsState } from '@/features/program/shared/lib/program-wage-payment-item-helpers'
import { showUpdateCompletedAlert } from '@/shared/ui'
import type { GeneralProgramUpdateSerializeOptions } from '@/features/program/general/api/adapters/general-program-adapters'
import { createGeneralProgramCommonInfoIndependentSave } from '@/features/program/general/lib/overlay-phase1/common-info-independent-save'
import { isTrainedTeachersDetailProgram } from '@/features/program/trained-teachers/lib/is-trained-teachers-detail-program'
import {
  getGeneralProgramApiErrorCode,
  getGeneralProgramApiErrorMessage,
} from '@/features/program/general/api/get-general-program-api-error'
import { getApiErrorField } from '@/shared/lib/extract-api-error-message'
import { resolveProgramDetailSaveApiFormField } from '@/features/program/shared/lib/program-detail-save-api-error'

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
  /**
   * 공통 정보 수정 모드일 때만 후원사 담당자 선택지(GET …/sponsors/{id}/contacts)를 받는다.
   * 그 API는 원문 + 「후원사 담당자 정보를 확인하기 위함」 자동 기록(CMS-17)이라 조회 모드·상세 진입에서 부르면 안 된다.
   */
  isEditMode?: boolean
}

function collectDirtyFormKeys(dirtyFields: unknown): ReadonlySet<string> | undefined {
  if (dirtyFields == null || typeof dirtyFields !== 'object' || Array.isArray(dirtyFields)) {
    return undefined
  }
  return new Set(Object.keys(dirtyFields as Record<string, unknown>))
}

const EMPTY_SPONSOR_ROWS: SponsorManagementRow[] = []

export function useGeneralProgramCommonInfoSave({
  form,
  program,
  onSaveEdit,
  isEditMode = false,
}: UseGeneralProgramCommonInfoSaveOptions) {
  const savingRef = useRef(false)
  const watchedSponsorIds = form.watch('sponsorManagementIds') ?? []
  // 조회만 한다. 수정 모드에서 edit form 이 같은 키로 받아 둔 캐시를 쓴다.
  const sponsorsQuery = useSponsorOptionsQuery(false)
  // 저장 시 담당자 표시 줄을 만들 때만 쓴다 — 수정 모드에서만 조회(공통 정보 보기는 배정 응답만 사용)
  const sponsorContext = useGeneralProgramSponsorEditContext(watchedSponsorIds, isEditMode, {
    sponsorRows: sponsorsQuery.data ?? EMPTY_SPONSOR_ROWS,
  })
  // 조회만 한다. 수정 모드 진입 시 handleInfoEdit·edit form 이 같은 키로 받아 둔 캐시를 쓴다.
  const detailedProgramsQuery = useDetailedProgramOptionsQuery(false)
  const detailedProgramCatalog = detailedProgramsQuery.data
  // 조회만 한다. 수정 모드의 강사비 영역이 같은 키로 받아 둔 캐시를 쓴다(상세 진입만으로 정산 설정을 부르지 않는다).
  const paymentItemOptions = useProgramWagePaymentItemOptionsState(false).options
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
      const message = getGeneralProgramApiErrorMessage(error, '')
      const field = resolveProgramDetailSaveApiFormField({
        apiField: getApiErrorField(error),
        message,
        errorCode: getGeneralProgramApiErrorCode(error),
      })
      if (field && message) {
        form.setError(field as never, { type: 'server', message })
        form.setFocus(field as never)
      }
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

  /** `catalogOverride`: 수정 진입 직전에 받아 둔 세부 프로그램 목록 (hook 상태가 아직 갱신 전일 때) */
  const resetToProgram = useCallback(
    (catalogOverride?: typeof detailedProgramCatalog) => {
      if (program) {
        form.reset(
          programToGeneralCommonInfoEditValues(
            program,
            sponsorContext,
            catalogOverride ?? detailedProgramCatalog
          ),
          {
            keepDefaultValues: false,
          }
        )
      }
    },
    [form, program, sponsorContext, detailedProgramCatalog]
  )

  return { triggerSave, resetToProgram }
}
