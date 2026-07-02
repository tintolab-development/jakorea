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
import type { ProgramRegistrationFormVariant } from '@/features/template/model/program-registration-draft'
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
  type GeneralProgramRegistrationApplicationTabKey,
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
  registrationFormVariant?: ProgramRegistrationFormVariant
}

function resolveStepTemplateName(templateId: string): string {
  return (
    findWritingTemplateRowByDefinitionId(templateId)?.templateName ??
    resolvePreviewHeaderTitle(lookupTemplateRegistry(templateId), undefined)
  )
}

function coerceRegistrationStepForVariant(
  step: GeneralProgramRegistrationStepKey,
  flags: GeneralProgramRegistrationParticipantFlags,
  variant: ProgramRegistrationFormVariant
): GeneralProgramRegistrationStepKey {
  const coercedStep = coerceGeneralProgramRegistrationStep(step, flags)
  if (variant !== 'trainedTeachers') return coercedStep
  if (coercedStep === 'program') return coercedStep
  return 'application-participant-school'
}

export function useGeneralProgramRegistrationFlow(
  open: boolean,
  options?: UseGeneralProgramRegistrationFlowOptions
) {
  const registrationFormVariant = options?.registrationFormVariant ?? 'general'
  const isCompanySchoolRegistration = registrationFormVariant === 'economy'
  const isTrainedTeachersRegistration = registrationFormVariant === 'trainedTeachers'
  const registrationTemplateId = isCompanySchoolRegistration
    ? 'registration-economy'
    : isTrainedTeachersRegistration
      ? 'registration-trained-teachers'
      : 'registration-general'
  const registrationVm = useProgramRegistrationEditor(
    open,
    resolveStepTemplateName(registrationTemplateId),
    {
      programRegistrationFormVariant: registrationFormVariant,
      onRegistrationSaved: options?.onProgramRegistrationSaved,
    }
  )

  const participantFlags: GeneralProgramRegistrationParticipantFlags = registrationVm.participant

  const [activeStep, setActiveStep] = useState<GeneralProgramRegistrationStepKey>(() => {
    const initial = options?.initialStep
    if (initial == null) return 'program'
    return coerceRegistrationStepForVariant(
      normalizeGeneralProgramRegistrationStepKey(initial, participantFlags),
      participantFlags,
      registrationFormVariant
    )
  })

  useEffect(() => {
    if (!open) return
    const fromUrl = options?.initialStep
    if (fromUrl == null) return
    const normalized = coerceRegistrationStepForVariant(
      normalizeGeneralProgramRegistrationStepKey(fromUrl, participantFlags),
      participantFlags,
      registrationFormVariant
    )
    if (normalized === activeStep) return
    setActiveStep(normalized)
  }, [open, options?.initialStep, activeStep, participantFlags, registrationFormVariant])

  const visibleRecruitTabKeys = useMemo(
    () =>
      isTrainedTeachersRegistration ? [] : getVisibleGeneralProgramRecruitTabKeys(participantFlags),
    [isTrainedTeachersRegistration, participantFlags]
  )

  const visibleApplicationTabKeys = useMemo(
    (): GeneralProgramRegistrationApplicationTabKey[] =>
      isTrainedTeachersRegistration
        ? ['application-participant-school']
        : getVisibleGeneralProgramApplicationTabKeys(participantFlags),
    [isTrainedTeachersRegistration, participantFlags]
  )

  const coercedActiveStep = useMemo(
    () => coerceRegistrationStepForVariant(activeStep, participantFlags, registrationFormVariant),
    [activeStep, participantFlags, registrationFormVariant]
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
    () => {
      const base =
        GENERAL_PROGRAM_REGISTRATION_STEPS.find(s => s.key === coercedActiveStep) ??
        GENERAL_PROGRAM_REGISTRATION_STEPS[0]
      if (isTrainedTeachersRegistration) {
        if (base.key === 'program') {
          return { ...base, templateId: 'registration-trained-teachers' }
        }
        if (base.key === 'application-participant-school') {
          return {
            ...base,
            templateId: 'application-trained-teachers',
            editorVariant: 'trained-teachers-application-institution' as const,
          }
        }
        return base
      }
      if (!isCompanySchoolRegistration) return base
      if (base.key === 'program') {
        return { ...base, templateId: 'registration-economy' }
      }
      if (base.key === 'application-participant-school') {
        return {
          ...base,
          templateId: 'application-economy',
          editorVariant: 'economy-application-institution' as const,
        }
      }
      return base
    },
    [coercedActiveStep, isCompanySchoolRegistration, isTrainedTeachersRegistration]
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
    {
      participantOrganization: participantFlags.organization,
      applicantRecruitInstitutionLayoutVariant: isCompanySchoolRegistration ? 'economy' : undefined,
      applicantRecruitInstitutionDefaults: isCompanySchoolRegistration
        ? {
            studentListRequired: 'none',
            preguidanceRequired: 'need',
            maxAssignableInstructors: 2,
            maxClassCount: 4,
            maxScheduleCount: 2,
            maxSessionsPerDay: 2,
          }
        : undefined,
    }
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
      educationScheduleMode: registrationVm.educationScheduleMode,
    })
  }, [
    open,
    registrationVm.programType,
    registrationVm.sessionRoundType,
    registrationVm.educationScheduleMode,
  ])

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
      const next = coerceRegistrationStepForVariant(
        key,
        participantFlags,
        registrationFormVariant
      )
      setActiveStep(next)
      options?.onStepChange?.(next)
    },
    [options, participantFlags, registrationFormVariant]
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
      selectStep(
        isTrainedTeachersRegistration
          ? 'application-participant-school'
          : getDefaultGeneralProgramApplicationStep(participantFlags)
      )
    },
    [selectStep, participantFlags, isTrainedTeachersRegistration]
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
