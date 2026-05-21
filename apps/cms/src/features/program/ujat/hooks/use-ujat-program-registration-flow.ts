import { useCallback, useEffect, useMemo, useState } from 'react'
import { findWritingTemplateRowByDefinitionId } from '@/features/template/lib/writing-template-create-helpers'
import {
  lookupTemplateRegistry,
  resolvePreviewHeaderTitle,
} from '@/features/template/model/template-registry/template-registry'
import { useProgramParticipantApplicationEditor } from '@/features/template/hooks/use-program-participant-application-editor'
import type { TemplateEditorVm } from '@/features/template/ui/template-renderers/template-renderer-types'
import { resolveTemplateEditorPanels } from '@/features/template/ui/template-renderers/resolve-template-editor-panels'
import { useUjatProgramRegistrationEditor } from '@/features/template/ui/form-set/registration-form/UJAT/use-ujat-program-registration-editor'
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
  onProgramRegistrationSaved?: () => void
  /** URL `ujatStep` 초기값 */
  initialStep?: UjatProgramRegistrationStepKey
  onStepChange?: (step: UjatProgramRegistrationStepKey) => void
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

  const registrationVm = useUjatProgramRegistrationEditor(open && isProgramStep, programTemplateName, {
    onRegistrationSaved: options?.onProgramRegistrationSaved,
  })

  const participantVm = useProgramParticipantApplicationEditor(
    open && isParticipantStep,
    participantTemplateName,
    participantVariant,
    { ujatRecruitParagraphProps }
  )

  const registryEntry = useMemo(
    () => lookupTemplateRegistry(currentStepDef.templateId),
    [currentStepDef.templateId]
  )

  const editorVm = useMemo((): TemplateEditorVm => {
    const base = {
      registryEntry,
      isProgramRegistration: false,
      isUjatProgramRegistration: isProgramStep,
      isParticipantApplication: isParticipantStep,
      isWritingSurveyList: false,
      programRegistrationVm: registrationVm,
      ujatProgramRegistrationVm: registrationVm,
      programParticipantApplicationVm: participantVm,
      surveyListEditor: registrationVm,
      surveyTableRowSelection: participantVm,
      handleSave: isProgramStep ? registrationVm.handleSave : participantVm.handleSave,
    }
    return base as unknown as TemplateEditorVm
  }, [registryEntry, isProgramStep, isParticipantStep, registrationVm, participantVm])

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

  const handleCompleteRegistration = useCallback(() => {
    if (isProgramStep) {
      registrationVm.handleSave()
      return
    }
    participantVm.handleSave()
    // TODO(api): 프로그램 등록 완료 API 연동 후 모달 닫기·목록 갱신
  }, [isProgramStep, registrationVm, participantVm])

  return {
    activeStep,
    phase,
    currentStepDef,
    selectStep,
    goToPhase,
    panels,
    handlePreview,
    handleSave,
    handleCompleteRegistration,
    registrationVm,
    participantVm,
  }
}
