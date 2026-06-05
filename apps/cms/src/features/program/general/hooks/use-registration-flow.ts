import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  patchInstitutionApplicationProgramBridge,
  resetInstitutionApplicationProgramBridge,
} from '@/features/program/general/lib/institution-application-program-bridge'
import { resetApplicantRecruitInstitutionOverlay } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import { findWritingTemplateRowByDefinitionId } from '@/features/template/lib/writing-template-create-helpers'
import {
  lookupTemplateRegistry,
  resolvePreviewHeaderTitle,
} from '@/features/template/model/template-registry/template-registry'
import { useProgramParticipantApplicationEditor } from '@/features/template/hooks/use-program-participant-application-editor'
import { useProgramRegistrationEditor } from '@/features/template/hooks/use-program-registration-editor'
import type { TemplateEditorVm } from '@/features/template/ui/template-renderers/template-renderer-types'
import { resolveTemplateEditorPanels } from '@/features/template/ui/template-renderers/resolve-template-editor-panels'
import {
  coerceGeneralProgramRegistrationStep,
  getDefaultGeneralProgramApplicationStep,
  getDefaultGeneralProgramRecruitStep,
  getVisibleGeneralProgramApplicationTabKeys,
  getVisibleGeneralProgramRecruitTabKeys,
  GENERAL_PROGRAM_REGISTRATION_STEPS,
  getGeneralProgramRegistrationPhase,
  isParticipantRegistrationStep,
  normalizeGeneralProgramRegistrationStepKey,
  type GeneralProgramRegistrationParticipantFlags,
  type GeneralProgramRegistrationPhaseKey,
  type GeneralProgramRegistrationStepKey,
} from '@/features/program/general/model/registration-flow'

export type UseGeneralProgramRegistrationFlowOptions = {
  onProgramRegistrationSaved?: () => void
  initialStep?: GeneralProgramRegistrationStepKey
  onStepChange?: (step: GeneralProgramRegistrationStepKey) => void
}

function resolveStepTemplateName(templateId: string): string {
  return (
    findWritingTemplateRowByDefinitionId(templateId)?.templateName ??
    resolvePreviewHeaderTitle(lookupTemplateRegistry(templateId), undefined)
  )
}

export function useGeneralProgramRegistrationFlow(
  open: boolean,
  options?: UseGeneralProgramRegistrationFlowOptions
) {
  const registrationVm = useProgramRegistrationEditor(
    open,
    resolveStepTemplateName('registration-general'),
    {
      programRegistrationFormVariant: 'general',
      onRegistrationSaved: options?.onProgramRegistrationSaved,
    }
  )

  const participantFlags: GeneralProgramRegistrationParticipantFlags = registrationVm.participant

  const [activeStep, setActiveStep] = useState<GeneralProgramRegistrationStepKey>(() => {
    const initial = options?.initialStep
    if (initial == null) return 'program'
    return normalizeGeneralProgramRegistrationStepKey(initial, participantFlags)
  })

  useEffect(() => {
    if (!open) return
    const fromUrl = options?.initialStep
    if (fromUrl == null) return
    const normalized = normalizeGeneralProgramRegistrationStepKey(fromUrl, participantFlags)
    if (normalized === activeStep) return
    setActiveStep(normalized)
  }, [open, options?.initialStep, activeStep, participantFlags])

  const visibleRecruitTabKeys = useMemo(
    () => getVisibleGeneralProgramRecruitTabKeys(participantFlags),
    [participantFlags]
  )

  const visibleApplicationTabKeys = useMemo(
    () => getVisibleGeneralProgramApplicationTabKeys(participantFlags),
    [participantFlags]
  )

  const coercedActiveStep = useMemo(
    () => coerceGeneralProgramRegistrationStep(activeStep, participantFlags),
    [activeStep, participantFlags]
  )

  useEffect(() => {
    if (!open) return
    if (coercedActiveStep === activeStep) return
    setActiveStep(coercedActiveStep)
    options?.onStepChange?.(coercedActiveStep)
  }, [open, coercedActiveStep, activeStep, options?.onStepChange])

  const phase = useMemo(
    () => getGeneralProgramRegistrationPhase(coercedActiveStep),
    [coercedActiveStep]
  )

  const currentStepDef = useMemo(
    () =>
      GENERAL_PROGRAM_REGISTRATION_STEPS.find(s => s.key === coercedActiveStep) ??
      GENERAL_PROGRAM_REGISTRATION_STEPS[0],
    [coercedActiveStep]
  )

  const participantTemplateName = useMemo(
    () => resolveStepTemplateName(currentStepDef.templateId),
    [currentStepDef.templateId]
  )

  const participantVariant = currentStepDef.editorVariant ?? 'applicant-recruit-institution'

  const isProgramStep = coercedActiveStep === 'program'
  const isParticipantStep = isParticipantRegistrationStep(coercedActiveStep)

  const participantVm = useProgramParticipantApplicationEditor(
    open && isParticipantStep,
    participantTemplateName,
    participantVariant,
    { participantOrganization: participantFlags.organization }
  )

  useEffect(() => {
    if (!open) {
      resetInstitutionApplicationProgramBridge()
      resetApplicantRecruitInstitutionOverlay()
      return
    }
    patchInstitutionApplicationProgramBridge({
      educationStructure: registrationVm.programType,
      sessionRound: registrationVm.sessionRoundType,
    })
  }, [open, registrationVm.programType, registrationVm.sessionRoundType])

  const registryEntry = useMemo(
    () => lookupTemplateRegistry(currentStepDef.templateId),
    [currentStepDef.templateId]
  )

  const editorVm = useMemo((): TemplateEditorVm => {
    return {
      registryEntry,
      isProgramRegistration: isProgramStep,
      isUjatProgramRegistration: false,
      isParticipantApplication: isParticipantStep,
      isWritingSurveyList: false,
      programRegistrationVm: registrationVm,
      ujatProgramRegistrationVm: registrationVm,
      programParticipantApplicationVm: participantVm,
      surveyListEditor: registrationVm,
      surveyTableRowSelection: participantVm,
      handleSave: isProgramStep ? registrationVm.handleSave : participantVm.handleSave,
    } as unknown as TemplateEditorVm
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
    (key: GeneralProgramRegistrationStepKey) => {
      const next = coerceGeneralProgramRegistrationStep(key, participantFlags)
      setActiveStep(next)
      options?.onStepChange?.(next)
    },
    [options, participantFlags]
  )

  const goToPhase = useCallback(
    (nextPhase: GeneralProgramRegistrationPhaseKey) => {
      if (nextPhase === 'program') {
        selectStep('program')
        return
      }
      if (nextPhase === 'recruitment') {
        selectStep(getDefaultGeneralProgramRecruitStep(participantFlags))
        return
      }
      selectStep(getDefaultGeneralProgramApplicationStep(participantFlags))
    },
    [selectStep, participantFlags]
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
    registrationVm.handleSave()
  }, [isProgramStep, registrationVm, participantVm])

  const hasRecruitmentPhase = visibleRecruitTabKeys.length > 0
  const hasApplicationPhase = visibleApplicationTabKeys.length > 0

  return {
    activeStep: coercedActiveStep,
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
    participantFlags,
    visibleRecruitTabKeys,
    visibleApplicationTabKeys,
    hasRecruitmentPhase,
    hasApplicationPhase,
  }
}
