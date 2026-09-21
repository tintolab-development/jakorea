import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCreateProgram } from '@/features/program/ujat/api/queries'
import type { Program } from '@/types/domain'
import { findWritingTemplateRowByDefinitionId } from '@/features/template/lib/writing-template-create-helpers'
import {
  lookupTemplateRegistry,
  resolvePreviewHeaderTitle,
} from '@/features/template/model/template-registry/template-registry'
import {
  collectParticipantOverlayForVariant,
  useProgramParticipantApplicationEditor,
} from '@/features/template/hooks/use-program-participant-application-editor'
import { buildParticipantApplicationEditorState } from '@/features/template/lib/participant-application-editor-state'
import { getUjatProgramRegistrationOverlayRecord } from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import { buildUjatProgramListRowFromRegistrationSnapshot } from '@/features/program/ujat/lib/ujat-registration-local-save'
import type { TemplateEditorVm } from '@/features/template/ui/template-renderers/template-renderer-types'
import { resolveTemplateEditorPanels } from '@/features/template/ui/template-renderers/resolve-template-editor-panels'
import { useUjatProgramRegistrationEditor } from '@/features/template/ui/form-set/registration-form/UJAT/use-ujat-program-registration-editor'
import { shouldUseRegistrationCreateFormBindings } from '@/features/program/general/lib/registration-create-form-bindings-capabilities'
import {
  hydrateRegistrationProgramDraft,
  syncRegistrationProgramDraftSession,
} from '@/features/program/general/lib/registration-program-draft-session'
import { PROGRAM_REGISTRATION_UJAT_TEMPLATE_CODE } from '@/features/program/shared/lib/registration-draft-notice'
import {
  UJAT_PROGRAM_REGISTRATION_DEFAULT_APPLICATION_STEP,
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

export type UseUjatProgramRegistrationFlowOptions = {
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
  return (
    findWritingTemplateRowByDefinitionId(templateId)?.templateName ??
    resolvePreviewHeaderTitle(lookupTemplateRegistry(templateId), undefined)
  )
}

export function useUjatProgramRegistrationFlow(
  open: boolean,
  options?: UseUjatProgramRegistrationFlowOptions
) {
  const [activeStep, setActiveStep] = useState<UjatProgramRegistrationStepKey>(() => {
    const initial = options?.initialStep
    return initial != null ? normalizeUjatProgramRegistrationStepKey(initial) : 'program'
  })
  const createProgramMutation = useCreateProgram()
  const completionPromiseRef = useRef<Promise<Program> | null>(null)
  const idempotencyKeyRef = useRef(createRegistrationIdempotencyKey())
  const onStepChangeRef = useRef(options?.onStepChange)
  onStepChangeRef.current = options?.onStepChange
  const continueHydratedRef = useRef(false)
  const skipDraftRestore = options?.skipDraftRestore === true
  const programType = 'UJAT' as const

  useEffect(() => {
    if (!open) {
      continueHydratedRef.current = false
    }
  }, [open])

  useEffect(() => {
    if (!open || skipDraftRestore) return
    if (continueHydratedRef.current) return
    continueHydratedRef.current = true
    void hydrateRegistrationProgramDraft(programType)
      .then(payload => {
        if (payload?.activeStep == null) return
        const restored = normalizeUjatProgramRegistrationStepKey(payload.activeStep)
        setActiveStep(restored)
        onStepChangeRef.current?.(restored)
      })
      .catch(error => {
        console.warn('[registration-program-draft] UJAT hydrate failed', error)
      })
  }, [open, skipDraftRestore, programType])

  useEffect(() => {
    if (open) return
    completionPromiseRef.current = null
    idempotencyKeyRef.current = createRegistrationIdempotencyKey()
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

  const programTemplateName = useMemo(
    () => resolveStepTemplateName('registration-ujat'),
    []
  )

  const participantTemplateName = useMemo(
    () => resolveStepTemplateName(currentStepDef.templateId),
    [currentStepDef.templateId]
  )

  const participantVariant =
    currentStepDef.editorVariant ?? ('ujat-recruit-institution' as const)

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
      /** UJAT 등록 위저드 — 단락 타이틀 옆 필수(*) */
      forceSeedParagraphsRequired: true,
    }
  )

  const registryEntry = useMemo(
    () => lookupTemplateRegistry(currentStepDef.templateId),
    [currentStepDef.templateId]
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
      // 탭/단계 전환은 React state만 유지. 세션 임시저장은 「임시 저장」버튼에서만.
      setActiveStep(key)
      options?.onStepChange?.(key)
    },
    [options]
  )

  const goToPhase = useCallback(
    (nextPhase: UjatProgramRegistrationPhaseKey) => {
      if (nextPhase === 'program') {
        selectStep('program')
        return
      }
      if (nextPhase === 'recruitment') {
        selectStep(UJAT_PROGRAM_REGISTRATION_DEFAULT_RECRUIT_STEP)
        return
      }
      selectStep(UJAT_PROGRAM_REGISTRATION_DEFAULT_APPLICATION_STEP)
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
    await registrationVm.handleSave({ silent: true })
    if (!isProgramStep && isParticipantStep) {
      await participantVm.handleSave({ silent: true })
    }
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

    const completion = (async () => {
      const registrationOverlay = { ...getUjatProgramRegistrationOverlayRecord() }
      const registrationSnapshot = {
        draft: registrationVm.draft,
        overlay: registrationOverlay,
      }

      if (shouldUseRegistrationCreateFormBindings()) {
        const program = buildUjatProgramListRowFromRegistrationSnapshot({
          id: `ujat-pending-${idempotencyKeyRef.current}`,
          overlay: registrationOverlay,
        })

        const operationalOverrides = []
        if (isParticipantStep) {
          const participantOverlay = collectParticipantOverlayForVariant(participantVariant)
          const editorState = buildParticipantApplicationEditorState({
            variant: participantVariant,
            volunteerExceptionScheduleCount: participantVm.volunteerExceptionScheduleCount,
            ujatVolunteerApplicationType: participantVm.ujatVolunteerApplicationType,
            ujatGradeApplicationBlockIds:
              participantVm.ujatProgramApplicationGradeInfo?.applicationGradeBlockIds ?? [],
            ujatApplicationGradeByBlockId:
              participantVm.ujatProgramApplicationGradeInfo?.applicationGradeByBlockId ?? {},
            ujatGradeClassTimeBlockIds:
              participantVm.ujatProgramApplicationGradeClassTime?.classTimeBlockIds ?? [],
          })
          operationalOverrides.push({
            templateCode: currentStepDef.templateId,
            draft: participantVm.draft,
            ...(participantOverlay != null ? { overlay: participantOverlay } : {}),
            ...(editorState != null ? { editorState } : {}),
          })
        }

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
      const program = await createProgramMutation.mutateAsync({
        ...snapshot,
        idempotencyKey: idempotencyKeyRef.current,
      })
      options?.onProgramRegistrationSaved?.(program)
      return program
    })().catch(error => {
      completionPromiseRef.current = null
      throw error
    })

    completionPromiseRef.current = completion
    return completion
  }, [
    createProgramMutation,
    currentStepDef.templateId,
    isParticipantStep,
    options,
    participantVariant,
    participantVm,
    registrationVm,
  ])

  return {
    activeStep,
    phase,
    currentStepDef,
    selectStep,
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
