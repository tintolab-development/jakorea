import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useCmsAlert } from '@/shared/ui'
import { beginBlockingOverlay } from '@/shared/ui/blocking-overlay-store'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'
import { useCreateProgram } from '@/features/program/ujat/api/queries'
import {
  describeIncompleteUjatProgramRegistrationRequiredFields,
  describeIncompleteUjatProgramRecruitmentRequiredFields,
  describeIncompleteUjatProgramRegistrationWizardRequiredFields,
  hasIncompleteUjatProgramRegistrationRequiredFields,
  hasIncompleteUjatProgramRecruitmentRequiredFields,
  listIncompleteUjatProgramRegistrationRequiredFields,
  listIncompleteUjatProgramRecruitmentRequiredFields,
  listIncompleteUjatProgramRegistrationWizardRequiredFields,
  UjatRegistrationRequiredFieldsIncompleteError,
} from '@/features/program/ujat/lib/ujat-program-registration-required-fields'
import type { Program } from '@/types/domain'
import { getFormTemplateVersionCacheEntry } from '@/features/template/api/form-template-version-cache'
import { useWritingFormSections } from '@/features/template/hooks/use-writing-form-sections'
import { getParticipantApplicationEditorVariantForTemplateCode } from '@/features/template/lib/participant-application-template-id'
import { buildParticipantApplicationEditorState } from '@/features/template/lib/participant-application-editor-state'
import {
  lookupWritingTemplateRegistry,
  resolveWritingTemplateDisplayName,
} from '@/features/template/lib/lookup-writing-template-registry'
import {
  flushParticipantSessionOverlaysToOperationalStores,
  useProgramParticipantApplicationEditor,
} from '@/features/template/hooks/use-program-participant-application-editor'
import {
  getUjatProgramRegistrationOverlayVersion,
  subscribeUjatProgramRegistrationOverlay,
  getUjatProgramRegistrationOverlayRecord,
  patchUjatProgramRegistrationOverlay,
} from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import {
  normalizeOverlayPaymentItemsBeforeSubmit,
  PAYMENT_ITEM_RESELECT_ALERT,
} from '@/features/program/shared/lib/program-wage-payment-item-helpers'
import { UJAT_WAGE_OVERLAY_PAYMENT_KEY } from '@/features/program/ujat/lib/ujat-wage-info-display'
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
  describeIncompleteApplicationFormThirdPartyRecipient,
  listIncompleteApplicationFormThirdPartyRecipientFieldKeys,
} from '@/features/program/general/lib/application-form-third-party-recipient-required'
import {
  collectOperationalOverlayForCatalogId,
  hydrateRegistrationOperationalOverlaysFromLocalDrafts,
  persistRegistrationOperationalOverlaysToLocal,
} from '@/features/program/general/lib/registration-operational-form-drafts'
import {
  clearRegistrationWizardSessionDrafts,
  flushApplicationOperationalOverrides,
} from '@/features/program/general/lib/registration-wizard-session-drafts'
import {
  beginRegistrationWizardVisit,
  endRegistrationWizardVisit,
  trackRegistrationWizardVisitSave,
} from '@/features/program/general/lib/registration-wizard-visit'
import { clearOperationalSeedDefaultSuppression } from '@/features/template/ui/form-set/shared/operational-seed-default-suppression'
import { resetAllOperationalOverlayStores } from '@/features/template/ui/form-set/shared/set-operational-overlay-scope'
import {
  hydrateRegistrationProgramDraft,
  syncRegistrationProgramDraftSession,
} from '@/features/program/general/lib/registration-program-draft-session'
import { PROGRAM_REGISTRATION_UJAT_TEMPLATE_CODE } from '@/features/program/shared/lib/registration-draft-notice'
import {
  UJAT_PROGRAM_REGISTRATION_DEFAULT_RECRUIT_STEP,
  UJAT_PROGRAM_REGISTRATION_DEFAULT_APPLICATION_STEP,
  getUjatProgramRegistrationPhase,
  getUjatProgramRegistrationPhaseValidationTarget,
  isParticipantRegistrationStep,
  normalizeUjatProgramRegistrationStepKey,
  UJAT_PROGRAM_REGISTRATION_STEPS,
  volunteerHalfFromRegistrationStep,
  volunteerRecruitSectionTitleFromRegistrationStep,
  type UjatProgramRegistrationPhaseKey,
  type UjatProgramRegistrationStepKey,
} from '@/features/program/ujat/model/ujat-program-registration-flow'
import {
  getUjatRecruitInstitutionOverlayVersion,
  subscribeUjatRecruitInstitutionOverlay,
} from '@/features/template/ui/form-set/recruit-form/UJAT-institution/ujat-recruit-institution-overlay-sync'
import {
  getUjatRecruitVolunteerOverlayVersion,
  subscribeUjatRecruitVolunteerOverlay,
} from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer/ujat-recruit-volunteer-overlay-sync'
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

function resetUjatRegistrationWizardMemory(): void {
  clearOperationalSeedDefaultSuppression()
  resetAllOperationalOverlayStores()
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
  const freshOverlayResetRef = useRef(false)
  if (!open) {
    freshOverlayResetRef.current = false
  } else if (skipDraftRestore && !freshOverlayResetRef.current) {
    freshOverlayResetRef.current = true
    resetUjatRegistrationWizardMemory()
    clearRegistrationWizardSessionDrafts()
  }
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
      const titleKo = payload?.programTitleKo?.trim()
      if (titleKo) {
        patchUjatProgramRegistrationOverlay({
          'ujat.basicInfo.programManagementName': titleKo,
        })
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
    resetUjatRegistrationWizardMemory()
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
  const isApplicationStep = phase === 'application'

  // 신청 Form은 공통정보와 모집정보 overlay로 만든 현재 프로그램 snapshot을
  // 입력 단락의 source로 사용한다. 세 store를 구독해야 모집 탭에서 수정한
  // 학년·일정 정보가 신청 탭 진입 시 즉시 재수화된다.
  const registrationOverlayVersion = useSyncExternalStore(
    subscribeUjatProgramRegistrationOverlay,
    getUjatProgramRegistrationOverlayVersion,
    getUjatProgramRegistrationOverlayVersion
  )
  const recruitInstitutionOverlayVersion = useSyncExternalStore(
    subscribeUjatRecruitInstitutionOverlay,
    getUjatRecruitInstitutionOverlayVersion,
    getUjatRecruitInstitutionOverlayVersion
  )
  const recruitVolunteerOverlayVersion = useSyncExternalStore(
    subscribeUjatRecruitVolunteerOverlay,
    getUjatRecruitVolunteerOverlayVersion,
    getUjatRecruitVolunteerOverlayVersion
  )

  const registrationWizardLinkedProgram = useMemo(() => {
    if (!open || !isApplicationStep) return null
    return buildUjatProgramListRowFromRegistrationSnapshot({
      id: 'ujat-registration-linked',
      overlay: collectUjatRegistrationCreateOverlay(
        getUjatProgramRegistrationOverlayRecord()
      ),
    })
  }, [
    open,
    isApplicationStep,
    registrationOverlayVersion,
    recruitInstitutionOverlayVersion,
    recruitVolunteerOverlayVersion,
    wizardDraftRevision,
  ])

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
      program: registrationWizardLinkedProgram,
      programLinkedInstitutionApplicationForm:
        participantVariant === 'ujat-application-institution',
      programLinkedApplicationFormPreview:
        participantVariant === 'ujat-application-institution' ||
        participantVariant === 'ujat-application-volunteer',
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
      const validationTarget = getUjatProgramRegistrationPhaseValidationTarget(
        fromPhase,
        toPhase
      )
      if (
        validationTarget === 'program' &&
        hasIncompleteUjatProgramRegistrationRequiredFields()
      ) {
        const incompleteKeys = listIncompleteUjatProgramRegistrationRequiredFields()
        options?.reportValidationIncomplete?.(incompleteKeys)
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
      if (
        validationTarget === 'recruitment' &&
        hasIncompleteUjatProgramRecruitmentRequiredFields()
      ) {
        const incompleteKeys = listIncompleteUjatProgramRecruitmentRequiredFields()
        options?.reportValidationIncomplete?.(incompleteKeys)
        console.debug(
          '[registration] UJAT 모집정보 필수항목 미입력:',
          describeIncompleteUjatProgramRecruitmentRequiredFields()
        )
        showAlert({
          title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
          content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
        })
        return
      }
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
      // 인메모리 스냅샷은 탭 복원용으로 직전 단계 overlay·draft를 남긴다.
      if (isParticipantStep) {
        participantVm.flushSessionSnapshot()
      }
      setActiveStep(key)
      options?.onStepChange?.(key)
    },
    [activeStep, isParticipantStep, options, participantVm, registrationVm.draft, showAlert]
  )

  const goToPhase = useCallback(
    (nextPhase: UjatProgramRegistrationPhaseKey) => {
      if (nextPhase === 'program') {
        selectStep('program')
        return
      }
      selectStep(
        nextPhase === 'application'
          ? UJAT_PROGRAM_REGISTRATION_DEFAULT_APPLICATION_STEP
          : UJAT_PROGRAM_REGISTRATION_DEFAULT_RECRUIT_STEP
      )
    },
    [selectStep]
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
    await trackRegistrationWizardVisitSave(programType, async () => {
      await registrationVm.handleSave({ silent: true })
      if (!isProgramStep && isParticipantStep) {
        await participantVm.handleSave({ silent: true })
      }
      flushParticipantSessionOverlaysToOperationalStores({
        excludeCatalogId: isParticipantStep ? selectedTemplateCode : undefined,
      })
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
    })
  }, [
    activeStep,
    isParticipantStep,
    isProgramStep,
    participantVm,
    programType,
    registrationVm,
    selectedTemplateCode,
  ])

  const handleCompleteRegistration = useCallback(() => {
    if (completionPromiseRef.current) return completionPromiseRef.current

    const currentApplication =
      isApplicationStep && selectedTemplateCode.startsWith('application-')
        ? {
            templateCode: selectedTemplateCode,
            draft: participantVm.draft,
          }
        : undefined
    const applicationProgram = buildUjatProgramListRowFromRegistrationSnapshot({
      id: 'ujat-registration-validation',
      overlay: collectUjatRegistrationCreateOverlay(
        getUjatProgramRegistrationOverlayRecord()
      ),
    })
    const applicationIncompleteKeys = listIncompleteApplicationFormThirdPartyRecipientFieldKeys({
      program: applicationProgram,
      current: currentApplication,
    })
    const applicationRecipientReason =
      applicationIncompleteKeys.length > 0
        ? applicationIncompleteKeys[0]
        : describeIncompleteApplicationFormThirdPartyRecipient({
            program: applicationProgram,
            current: currentApplication,
          })
    if (applicationRecipientReason != null) {
      options?.reportValidationIncomplete?.(applicationIncompleteKeys)
      console.debug(
        '[registration] UJAT 신청 양식 제공받는 곳 미입력:',
        applicationRecipientReason
      )
      showAlert({
        title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
        content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
      })
      return Promise.reject(new UjatRegistrationRequiredFieldsIncompleteError())
    }

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
        const paymentItems = await normalizeOverlayPaymentItemsBeforeSubmit(
          getUjatProgramRegistrationOverlayRecord(),
          [{ valuesKey: UJAT_WAGE_OVERLAY_PAYMENT_KEY }]
        )
        if (Object.keys(paymentItems.patch).length > 0) {
          patchUjatProgramRegistrationOverlay(paymentItems.patch)
        }
        if (paymentItems.clearedKeys.length > 0) {
          showAlert(PAYMENT_ITEM_RESELECT_ALERT)
          throw new UjatRegistrationRequiredFieldsIncompleteError()
        }
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
            current: isParticipantStep
              ? {
                  templateCode: selectedTemplateCode,
                  draft: participantVm.draft,
                  editorState: buildParticipantApplicationEditorState({
                    variant: participantVariant,
                    volunteerExceptionScheduleCount:
                      participantVm.volunteerExceptionScheduleCount,
                    ujatVolunteerApplicationType: participantVm.ujatVolunteerApplicationType,
                    ujatGradeApplicationBlockIds:
                      participantVm.ujatProgramApplicationGradeInfo?.applicationGradeBlockIds ??
                      [],
                    ujatApplicationGradeByBlockId:
                      participantVm.ujatProgramApplicationGradeInfo
                        ?.applicationGradeByBlockId ?? {},
                    ujatGradeClassTimeBlockIds:
                      participantVm.ujatProgramApplicationGradeClassTime?.classTimeBlockIds ??
                      [],
                  }),
                }
              : undefined,
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
    isApplicationStep,
    options,
    participantVariant,
    participantVm,
    registrationVm,
    selectedTemplateCode,
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

  // 목록은 모달을 언마운트해서 닫는다. 임시저장하지 않은 양식 변경은 방문 종료 때 버린다.
  useEffect(() => {
    if (!open) return
    beginRegistrationWizardVisit(programType)
    return () => {
      endRegistrationWizardVisit(programType, resetUjatRegistrationWizardMemory)
    }
  }, [open, programType])

  return {
    activeStep,
    phase,
    currentStepDef,
    selectStep,
    selectStepTemplate,
    stepTemplateName: participantTemplateName,
    isDefaultStepTemplate,
    selectedTemplateCode,
    wizardDraftRevision,
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
