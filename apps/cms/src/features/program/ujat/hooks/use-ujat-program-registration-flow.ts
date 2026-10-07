import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCmsAlert } from '@/shared/ui'
import { beginBlockingOverlay } from '@/shared/ui/blocking-overlay-store'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'
import { useCreateProgram } from '@/features/program/ujat/api/queries'
import {
  describeIncompleteUjatProgramRegistrationRequiredFields,
  describeIncompleteUjatProgramRegistrationWizardRequiredFields,
  hasIncompleteUjatProgramRegistrationRequiredFields,
  listIncompleteUjatProgramRegistrationRequiredFields,
  listIncompleteUjatProgramRegistrationWizardRequiredFields,
  UjatRegistrationRequiredFieldsIncompleteError,
} from '@/features/program/ujat/lib/ujat-program-registration-required-fields'
import type { Program } from '@/types/domain'
import { getFormTemplateVersionCacheEntry } from '@/features/template/api/form-template-version-cache'
import { useWritingFormSections } from '@/features/template/hooks/use-writing-form-sections'
import { getParticipantApplicationEditorVariantForTemplateCode } from '@/features/template/lib/participant-application-template-id'
import {
  lookupWritingTemplateRegistry,
  resolveWritingTemplateDisplayName,
} from '@/features/template/lib/lookup-writing-template-registry'
import { useProgramParticipantApplicationEditor } from '@/features/template/hooks/use-program-participant-application-editor'
import {
  getUjatProgramRegistrationOverlayRecord,
  resetUjatProgramRegistrationOverlay,
} from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import { toCreateRequest } from '@/features/program/ujat/api/adapters'
import {
  buildUjatProgramListRowFromRegistrationSnapshot,
  collectUjatRegistrationCreateOverlay,
} from '@/features/program/ujat/lib/ujat-registration-local-save'
import {
  formatRegistrationStepTransitionLabel,
  logProgramRegistrationCreatePayload,
  logRegistrationStepTransitionPayload,
} from '@/features/program/shared/lib/log-program-registration-create-payload'
import type { TemplateEditorVm } from '@/features/template/ui/template-renderers/template-renderer-types'
import { resolveTemplateEditorPanels } from '@/features/template/ui/template-renderers/resolve-template-editor-panels'
import { useUjatProgramRegistrationEditor } from '@/features/template/ui/form-set/registration-form/UJAT/use-ujat-program-registration-editor'
import { shouldUseRegistrationCreateFormBindings } from '@/features/program/general/lib/registration-create-form-bindings-capabilities'
import {
  collectOperationalOverlayForCatalogId,
  hydrateRegistrationOperationalOverlaysFromLocalDrafts,
  persistRegistrationOperationalOverlaysToLocal,
} from '@/features/program/general/lib/registration-operational-form-drafts'
import {
  clearRegistrationWizardSessionDrafts,
  flushApplicationOperationalOverrides,
} from '@/features/program/general/lib/registration-wizard-session-drafts'
import { resetGeneralRecruitOverlay } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { resetUjatRecruitInstitutionOverlay } from '@/features/template/ui/form-set/recruit-form/UJAT-institution/ujat-recruit-institution-overlay-sync'
import { resetUjatRecruitVolunteerOverlay } from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer/ujat-recruit-volunteer-overlay-sync'
import { resetUjatApplicationInstitutionOverlay } from '@/features/template/ui/form-set/application-form/UJAT-institution/ujat-application-institution-overlay-sync'
import { resetUjatApplicationVolunteerOverlay } from '@/features/template/ui/form-set/application-form/UJAT-volunteer/ujat-application-volunteer-overlay-sync'
import {
  hydrateRegistrationProgramDraft,
  syncRegistrationProgramDraftSession,
} from '@/features/program/general/lib/registration-program-draft-session'
import { PROGRAM_REGISTRATION_UJAT_TEMPLATE_CODE } from '@/features/program/shared/lib/registration-draft-notice'
import {
  UJAT_PROGRAM_REGISTRATION_DEFAULT_RECRUIT_STEP,
  getUjatProgramRegistrationPhase,
  isParticipantRegistrationStep,
  normalizeUjatProgramRegistrationStepKey,
  UJAT_PROGRAM_REGISTRATION_STEPS,
  volunteerHalfFromRegistrationStep,
  volunteerRecruitSectionTitleFromRegistrationStep,
  type UjatProgramRegistrationPhaseKey,
  type UjatProgramRegistrationStepKey,
} from '@/features/program/ujat/model/ujat-program-registration-flow'
import {
  clearRegistrationStepTemplateSelections,
  getRegistrationStepTemplateSelections,
  getSelectedOperationalTemplateCode,
  hydrateRegistrationStepTemplateSelections,
  isDefaultOperationalTemplateSelection,
} from '@/features/program/shared/lib/step-template-selection'
import { applyRegistrationStepTemplateChange } from '@/features/program/shared/lib/step-template-apply'

export type UseUjatProgramRegistrationFlowOptions = {
  /** 필수 미입력 검증 실패 시 — 인라인 강조용 진단 키 */
  reportValidationIncomplete?: (keys: readonly string[]) => void
  /** 1단계(프로그램 등록) 저장 성공 후 — 목록 갱신·모달 닫기 등 */
  onProgramRegistrationSaved?: (program: Program) => void
  /** URL `ujatStep` 초기값 */
  initialStep?: UjatProgramRegistrationStepKey
  onStepChange?: (step: UjatProgramRegistrationStepKey) => void
  /** true면 임시저장 복원 없이 시드로 시작 */
  skipDraftRestore?: boolean
}

function createRegistrationIdempotencyKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function resolveStepTemplateName(templateId: string): string {
  return resolveWritingTemplateDisplayName(templateId)
}

export function useUjatProgramRegistrationFlow(
  open: boolean,
  options?: UseUjatProgramRegistrationFlowOptions
) {
  const [activeStep, setActiveStep] = useState<UjatProgramRegistrationStepKey>(() => {
    const initial = options?.initialStep
    return initial != null ? normalizeUjatProgramRegistrationStepKey(initial) : 'program'
  })
  const { showAlert } = useCmsAlert()
  const { sections: writingFormSections } = useWritingFormSections()
  const createProgramMutation = useCreateProgram()
  const completionPromiseRef = useRef<Promise<Program> | null>(null)
  const idempotencyKeyRef = useRef(createRegistrationIdempotencyKey())
  const onStepChangeRef = useRef(options?.onStepChange)
  onStepChangeRef.current = options?.onStepChange
  const continueHydratedRef = useRef(false)
  const skipDraftRestore = options?.skipDraftRestore === true
  const programType = 'UJAT' as const
  const [stepTemplateByKey, setStepTemplateByKey] = useState<Record<string, string>>({})
  const [wizardDraftRevision, setWizardDraftRevision] = useState(0)

  useEffect(() => {
    if (!open) {
      continueHydratedRef.current = false
      clearRegistrationStepTemplateSelections(programType)
      setStepTemplateByKey({})
      setWizardDraftRevision(0)
    }
  }, [open, programType])

  useEffect(() => {
    if (!open || skipDraftRestore) return
    if (continueHydratedRef.current) return
    continueHydratedRef.current = true
    void (async () => {
      const payload = await hydrateRegistrationProgramDraft(programType)
      await hydrateRegistrationOperationalOverlaysFromLocalDrafts(programType, 'ujat')
      if (payload?.selectedOperationalTemplates != null) {
        hydrateRegistrationStepTemplateSelections(
          programType,
          payload.selectedOperationalTemplates
        )
        setStepTemplateByKey(payload.selectedOperationalTemplates)
      }
      if (payload?.activeStep == null) return
      const restored = normalizeUjatProgramRegistrationStepKey(payload.activeStep)
      setActiveStep(restored)
      onStepChangeRef.current?.(restored)
    })().catch(error => {
      console.warn('[registration-program-draft] UJAT hydrate failed', error)
    })
  }, [open, skipDraftRestore, programType])

  useEffect(() => {
    if (open) return
    completionPromiseRef.current = null
    idempotencyKeyRef.current = createRegistrationIdempotencyKey()
    resetUjatProgramRegistrationOverlay()
    resetUjatRecruitInstitutionOverlay()
    resetUjatRecruitVolunteerOverlay()
    resetUjatApplicationInstitutionOverlay()
    resetUjatApplicationVolunteerOverlay()
    resetGeneralRecruitOverlay()
    clearRegistrationWizardSessionDrafts()
  }, [open])

  useEffect(() => {
    if (!open) return
    const fromUrl = options?.initialStep
    if (fromUrl == null) return
    const normalized = normalizeUjatProgramRegistrationStepKey(fromUrl)
    if (normalized === activeStep) return
    setActiveStep(normalized)
  }, [open, options?.initialStep, activeStep])

  const phase = useMemo(() => getUjatProgramRegistrationPhase(activeStep), [activeStep])

  const currentStepDef = useMemo(
    () => UJAT_PROGRAM_REGISTRATION_STEPS.find(s => s.key === activeStep) ?? UJAT_PROGRAM_REGISTRATION_STEPS[0],
    [activeStep]
  )

  const selectedTemplateCode =
    stepTemplateByKey[
      activeStep === 'recruit-volunteer-h1' || activeStep === 'recruit-volunteer-h2'
        ? 'recruit-volunteer'
        : activeStep
    ] ?? getSelectedOperationalTemplateCode(programType, activeStep, currentStepDef.templateId)

  const programTemplateName = useMemo(
    () => resolveStepTemplateName('registration-ujat'),
    []
  )

  const participantTemplateName = useMemo(
    () => resolveStepTemplateName(selectedTemplateCode),
    [selectedTemplateCode, writingFormSections]
  )

  const participantVariant =
    getParticipantApplicationEditorVariantForTemplateCode(
      selectedTemplateCode,
      getFormTemplateVersionCacheEntry(selectedTemplateCode)?.baseTemplateCode
    ) ??
    currentStepDef.editorVariant ??
    ('ujat-recruit-institution' as const)

  const isProgramStep = activeStep === 'program'
  const isParticipantStep = isParticipantRegistrationStep(activeStep)

  const ujatRecruitParagraphProps = useMemo(() => {
    const half = volunteerHalfFromRegistrationStep(activeStep)
    if (half == null) return undefined
    return {
      volunteerHalf: half,
      sectionTitle: volunteerRecruitSectionTitleFromRegistrationStep(activeStep),
    }
  }, [activeStep])

  // 공통 정보 overlay는 모집·신청 단계로 이동한 뒤 완료할 때까지 유지되어야 한다.
  const registrationVm = useUjatProgramRegistrationEditor(open, programTemplateName, {
    skipDraftRestore,
    registrationWizardProgramType: programType,
  })

  const participantVm = useProgramParticipantApplicationEditor(
    open && isParticipantStep,
    participantTemplateName,
    participantVariant,
    {
      ujatRecruitParagraphProps,
      registrationWizardProgramType: programType,
      registrationWizardOpen: open,
      skipDraftRestore,
      templateCode: selectedTemplateCode,
      wizardDraftRevision,
      /** UJAT 등록 위저드 — 단락 타이틀 옆 필수(*) */
      forceSeedParagraphsRequired: true,
    }
  )

  const registryEntry = useMemo(
    () => lookupWritingTemplateRegistry(selectedTemplateCode),
    [selectedTemplateCode, writingFormSections]
  )

  const editorVm = useMemo((): TemplateEditorVm => {
    const isDraftLoading = isProgramStep
      ? registrationVm.isDraftLoading
      : isParticipantStep
        ? participantVm.isDraftLoading
        : false
    return {
      registryEntry,
      isProgramRegistration: false,
      isUjatProgramRegistration: isProgramStep,
      isParticipantApplication: isParticipantStep,
      isWritingSurveyList: false,
      isDraftLoading,
      programRegistrationVm: registrationVm,
      ujatProgramRegistrationVm: registrationVm,
      programParticipantApplicationVm: participantVm,
      surveyListEditor: registrationVm,
      surveyTableRowSelection: participantVm,
      handleSave: isProgramStep ? registrationVm.handleSave : participantVm.handleSave,
    } as unknown as TemplateEditorVm
  }, [registryEntry, isProgramStep, isParticipantStep, registrationVm, participantVm])

  const isDraftLoading = editorVm.isDraftLoading === true

  const panels = useMemo(
    () =>
      resolveTemplateEditorPanels({
        registryEntry,
        editorVm,
        generic: {
          orderedLeftContentConfig: [],
          activeCardId: null,
          setActiveCardId: () => {},
          applyOrderedCards: () => {},
          rightNavigationConfig: { sectionTitle: '커스텀 필드', items: [] },
        },
      }),
    [registryEntry, editorVm]
  )

  const selectStep = useCallback(
    (key: UjatProgramRegistrationStepKey) => {
      if (key === activeStep) return
      const fromPhase = getUjatProgramRegistrationPhase(activeStep)
      const toPhase = getUjatProgramRegistrationPhase(key)
      if (fromPhase !== toPhase) {
        const registrationOverlay = collectUjatRegistrationCreateOverlay(
          getUjatProgramRegistrationOverlayRecord()
        )
        const program = buildUjatProgramListRowFromRegistrationSnapshot({
          id: 'debug',
          overlay: registrationOverlay,
        })
        logRegistrationStepTransitionPayload({
          program,
          variant: 'ujat',
          ujatBaseRequest: toCreateRequest(program, {
            draft: registrationVm.draft,
            overlay: registrationOverlay,
          }),
          stepLabel: formatRegistrationStepTransitionLabel(fromPhase, toPhase),
        })
      }
      // 탭/단계 전환은 React state만 유지. 세션 임시저장은 「임시 저장」버튼에서만.
      setActiveStep(key)
      options?.onStepChange?.(key)
    },
    [activeStep, options, registrationVm.draft]
  )

  const goToPhase = useCallback(
    (nextPhase: UjatProgramRegistrationPhaseKey) => {
      if (
        nextPhase !== 'program' &&
        phase === 'program' &&
        hasIncompleteUjatProgramRegistrationRequiredFields()
      ) {
        options?.reportValidationIncomplete?.(
          listIncompleteUjatProgramRegistrationRequiredFields()
        )
        console.debug(
          '[registration] UJAT 공통정보 필수항목 미입력:',
          describeIncompleteUjatProgramRegistrationRequiredFields()
        )
        showAlert({
          title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
          content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
        })
        return
      }
      if (nextPhase === 'program') {
        selectStep('program')
        return
      }
      selectStep(UJAT_PROGRAM_REGISTRATION_DEFAULT_RECRUIT_STEP)
    },
    [phase, selectStep, showAlert]
  )

  const handlePreview = useCallback(() => {
    if (isProgramStep) {
      registrationVm.handlePreview()
      return
    }
    participantVm.handlePreview()
  }, [isProgramStep, registrationVm, participantVm])

  const handleSave = useCallback(() => {
    if (isProgramStep) {
      registrationVm.handleSave()
      return
    }
    participantVm.handleSave()
  }, [isProgramStep, registrationVm, participantVm])

  /** 「임시 저장」— 현재 양식과 메타를 localStorage에만 저장한다. */
  const persistDraftSilent = useCallback(async () => {
    await registrationVm.handleSave({ silent: true })
    if (!isProgramStep && isParticipantStep) {
      await participantVm.handleSave({ silent: true })
    }
    await persistRegistrationOperationalOverlaysToLocal(programType, 'ujat')
    syncRegistrationProgramDraftSession({
      programType,
      registrationTemplateCode: PROGRAM_REGISTRATION_UJAT_TEMPLATE_CODE,
      activeStep,
      programTitleKo: buildUjatProgramListRowFromRegistrationSnapshot({
        id: 'ujat-local-draft',
        overlay: { ...getUjatProgramRegistrationOverlayRecord() },
      }).title,
    })
  }, [
    activeStep,
    isParticipantStep,
    isProgramStep,
    participantVm,
    programType,
    registrationVm,
  ])

  const handleCompleteRegistration = useCallback(() => {
    if (completionPromiseRef.current) return completionPromiseRef.current

    if (describeIncompleteUjatProgramRegistrationWizardRequiredFields() != null) {
      options?.reportValidationIncomplete?.(
        listIncompleteUjatProgramRegistrationWizardRequiredFields()
      )
      console.debug(
        '[registration] UJAT 등록 완료 필수항목 미입력:',
        describeIncompleteUjatProgramRegistrationWizardRequiredFields()
      )
      showAlert({
        title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
        content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
      })
      return Promise.reject(new UjatRegistrationRequiredFieldsIncompleteError())
    }

    const registrationOverlayForLog = collectUjatRegistrationCreateOverlay(
      getUjatProgramRegistrationOverlayRecord()
    )
    const programForLog = buildUjatProgramListRowFromRegistrationSnapshot({
      id: 'debug',
      overlay: registrationOverlayForLog,
    })
    logRegistrationStepTransitionPayload({
      program: programForLog,
      variant: 'ujat',
      ujatBaseRequest: toCreateRequest(programForLog, {
        draft: registrationVm.draft,
        overlay: registrationOverlayForLog,
      }),
      stepLabel: '등록 완료',
    })

    const completion = (async () => {
      const endOverlay = beginBlockingOverlay()
      try {
        const registrationOverlay = collectUjatRegistrationCreateOverlay(
          getUjatProgramRegistrationOverlayRecord()
        )
        const registrationSnapshot = {
          draft: registrationVm.draft,
          overlay: registrationOverlay,
        }

        if (shouldUseRegistrationCreateFormBindings()) {
          const program = buildUjatProgramListRowFromRegistrationSnapshot({
            id: `ujat-pending-${idempotencyKeyRef.current}`,
            overlay: registrationOverlay,
          })

          const operationalOverrides = flushApplicationOperationalOverrides({
            overlayForTemplateCode: collectOperationalOverlayForCatalogId,
          })

          const { prepareRegistrationCreateFormBindings } = await import(
            '@/features/program/general/lib/prepare-registration-create-form-bindings'
          )
          const preparedFormBindings = await prepareRegistrationCreateFormBindings({
            program,
            registration: {
              templateCode: PROGRAM_REGISTRATION_UJAT_TEMPLATE_CODE,
              draft: registrationVm.draft,
              overlay: registrationOverlay,
            },
            operationalOverrides,
          })

          await logProgramRegistrationCreatePayload({
            program,
            variant: 'ujat',
            ujatBaseRequest: toCreateRequest(program, registrationSnapshot),
            preparedFormBindings,
            stepLabel: '등록 완료',
          })

          const createdProgram = await createProgramMutation.mutateAsync({
            ...registrationSnapshot,
            idempotencyKey: idempotencyKeyRef.current,
            preparedFormBindings,
          })
          options?.onProgramRegistrationSaved?.(createdProgram)
          return createdProgram
        }

        if (isParticipantStep) {
          await participantVm.handleSave()
        }
        const snapshot = await registrationVm.persistDraft()
        const programForLog = buildUjatProgramListRowFromRegistrationSnapshot({
          id: `ujat-pending-${idempotencyKeyRef.current}`,
          overlay: registrationOverlay,
        })
        await logProgramRegistrationCreatePayload({
          program: programForLog,
          variant: 'ujat',
          ujatBaseRequest: toCreateRequest(programForLog, snapshot),
          preparedFormBindings: null,
          stepLabel: '등록 완료',
        })
        const program = await createProgramMutation.mutateAsync({
          ...snapshot,
          idempotencyKey: idempotencyKeyRef.current,
        })
        options?.onProgramRegistrationSaved?.(program)
        return program
      } finally {
        endOverlay()
        completionPromiseRef.current = null
      }
    })().catch(error => {
      throw error
    })

    completionPromiseRef.current = completion
    return completion
  }, [
    createProgramMutation,
    isParticipantStep,
    options,
    participantVm,
    registrationVm,
    showAlert,
  ])

  const selectStepTemplate = useCallback(
    async (next: { id: string; latestVersionId?: number; baseTemplateCode?: string; apiTemplateId?: number }) => {
      const result = await applyRegistrationStepTemplateChange({
        programType,
        stepKey: activeStep,
        previousCode: selectedTemplateCode,
        nextCode: next.id,
        defaultCode: currentStepDef.templateId,
        latestVersionId: next.latestVersionId,
        baseTemplateCode: next.baseTemplateCode,
        apiTemplateId: next.apiTemplateId,
      })
      if (result === 'unchanged') return
      setStepTemplateByKey(getRegistrationStepTemplateSelections(programType))
      setWizardDraftRevision(value => value + 1)
    },
    [activeStep, currentStepDef.templateId, programType, selectedTemplateCode]
  )

  const isDefaultStepTemplate = isDefaultOperationalTemplateSelection(
    selectedTemplateCode,
    currentStepDef.templateId
  )

  return {
    activeStep,
    phase,
    currentStepDef,
    selectStep,
    selectStepTemplate,
    stepTemplateName: participantTemplateName,
    isDefaultStepTemplate,
    goToPhase,
    panels,
    isDraftLoading,
    handlePreview,
    handleSave,
    persistDraftSilent,
    handleCompleteRegistration,
    registrationVm,
    participantVm,
    isCompletingRegistration: createProgramMutation.isPending,
  }
}
