import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  patchInstitutionApplicationProgramBridge,
  resetInstitutionApplicationProgramBridge,
} from '@/features/program/general/lib/institution-application-program-bridge'
import { resetApplicantRecruitInstitutionOverlay } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import { resetGeneralRecruitOverlay } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { resetGeneralApplicationOverlay } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { resetProgramRegistrationOverlay } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { findWritingTemplateRowByDefinitionId } from '@/features/template/lib/writing-template-create-helpers'
import {
  lookupTemplateRegistry,
  resolvePreviewHeaderTitle,
} from '@/features/template/model/template-registry/template-registry'
import { useProgramParticipantApplicationEditor } from '@/features/template/hooks/use-program-participant-application-editor'
import { useProgramRegistrationEditor } from '@/features/template/hooks/use-program-registration-editor'
import {
  PROGRAM_REGISTRATION_ECONOMY_TEMPLATE_CODE,
  PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE,
} from '@/features/template/lib/program-registration-editor-state'
import { PROGRAM_REGISTRATION_TRAINED_TEACHERS_TEMPLATE_CODE } from '@/features/program/shared/lib/registration-draft-notice'
import type { ProgramRegistrationFormVariant } from '@/features/template/model/program-registration-draft'
import type { Program } from '@/types/domain'
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
  onProgramRegistrationSaved?: (program?: Program) => void
  initialStep?: GeneralProgramRegistrationStepKey
  onStepChange?: (step: GeneralProgramRegistrationStepKey) => void
  registrationFormVariant?: ProgramRegistrationFormVariant
  /** true면 임시저장 복원 없이 시드로 시작 */
  skipDraftRestore?: boolean
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
  const recruitOptions =
    variant === 'economy' ? ({ hideVolunteer: true } as const) : undefined
  const coercedStep = coerceGeneralProgramRegistrationStep(step, flags, recruitOptions)
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
      skipDraftRestore: options?.skipDraftRestore === true,
      templateCode:
        registrationFormVariant === 'general'
          ? PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE
          : registrationFormVariant === 'economy'
            ? PROGRAM_REGISTRATION_ECONOMY_TEMPLATE_CODE
            : registrationFormVariant === 'trainedTeachers'
              ? PROGRAM_REGISTRATION_TRAINED_TEACHERS_TEMPLATE_CODE
              : undefined,
    }
  )

  const participantFlags: GeneralProgramRegistrationParticipantFlags = registrationVm.participant

  const recruitTabVisibility = useMemo(
    () => (isCompanySchoolRegistration ? { hideVolunteer: true as const } : undefined),
    [isCompanySchoolRegistration]
  )
  /** 모집·신청 탭 공통 (1사1교 봉사자 숨김) */
  const tabVisibility = recruitTabVisibility

  const [activeStep, setActiveStep] = useState<GeneralProgramRegistrationStepKey>(() => {
    const initial = options?.initialStep
    if (initial == null) return 'program'
    return coerceRegistrationStepForVariant(
      normalizeGeneralProgramRegistrationStepKey(initial, participantFlags, tabVisibility),
      participantFlags,
      registrationFormVariant
    )
  })

  useEffect(() => {
    if (!open) return
    const fromUrl = options?.initialStep
    if (fromUrl == null) return
    const normalized = coerceRegistrationStepForVariant(
      normalizeGeneralProgramRegistrationStepKey(fromUrl, participantFlags, tabVisibility),
      participantFlags,
      registrationFormVariant
    )
    if (normalized === activeStep) return
    setActiveStep(normalized)
  }, [
    open,
    options?.initialStep,
    activeStep,
    participantFlags,
    registrationFormVariant,
    tabVisibility,
  ])

  const visibleRecruitTabKeys = useMemo(
    () =>
      isTrainedTeachersRegistration
        ? []
        : getVisibleGeneralProgramRecruitTabKeys(participantFlags, tabVisibility),
    [isTrainedTeachersRegistration, participantFlags, tabVisibility]
  )

  const visibleApplicationTabKeys = useMemo(
    (): GeneralProgramRegistrationApplicationTabKey[] =>
      isTrainedTeachersRegistration
        ? ['application-participant-school']
        : getVisibleGeneralProgramApplicationTabKeys(participantFlags, tabVisibility),
    [isTrainedTeachersRegistration, participantFlags, tabVisibility]
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
      /** 등록 위저드 신청 단계 — 기관 기본정보·강사/봉사자 일정 자동 반영 미리보기 */
      programLinkedInstitutionApplicationForm:
        participantVariant === 'institution' ||
        participantVariant === 'economy-application-institution' ||
        participantVariant === 'trained-teachers-application-institution',
      programLinkedApplicationFormPreview:
        participantVariant === 'institution' ||
        participantVariant === 'individual' ||
        participantVariant === 'instructor' ||
        participantVariant === 'volunteer' ||
        participantVariant === 'economy-application-institution' ||
        participantVariant === 'trained-teachers-application-institution',
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
      resetGeneralRecruitOverlay()
      resetGeneralApplicationOverlay()
      resetProgramRegistrationOverlay()
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
    const isDraftLoading = isProgramStep
      ? registrationVm.isDraftLoading
      : isParticipantStep
        ? participantVm.isDraftLoading
        : false
    return {
      registryEntry,
      isProgramRegistration: isProgramStep,
      isUjatProgramRegistration: false,
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

  const persistDraftSilent = useCallback(async () => {
    if (isProgramStep) {
      await registrationVm.handleSave({ silent: true })
      return
    }
    await participantVm.handleSave({ silent: true })
  }, [isProgramStep, registrationVm, participantVm])

  const selectStep = useCallback(
    (key: GeneralProgramRegistrationStepKey) => {
      const next = coerceRegistrationStepForVariant(
        key,
        participantFlags,
        registrationFormVariant
      )
      if (next === coercedActiveStep) return
      void persistDraftSilent().finally(() => {
        setActiveStep(next)
        options?.onStepChange?.(next)
      })
    },
    [
      coercedActiveStep,
      options,
      participantFlags,
      persistDraftSilent,
      registrationFormVariant,
    ]
  )

  const goToPhase = useCallback(
    (nextPhase: GeneralProgramRegistrationPhaseKey) => {
      if (nextPhase === 'program') {
        selectStep('program')
        return
      }
      if (nextPhase === 'recruitment') {
        selectStep(getDefaultGeneralProgramRecruitStep(participantFlags, tabVisibility))
        return
      }
      selectStep(
        isTrainedTeachersRegistration
          ? 'application-participant-school'
          : getDefaultGeneralProgramApplicationStep(participantFlags, tabVisibility)
      )
    },
    [selectStep, participantFlags, isTrainedTeachersRegistration, tabVisibility]
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
      void registrationVm.handleSave()
      return
    }
    void participantVm.handleSave()
  }, [isProgramStep, registrationVm, participantVm])

  const handleCompleteRegistration = useCallback(() => {
    if (isProgramStep) {
      void registrationVm.handleCompleteRegistration()
      return
    }
    void participantVm.handleSave({ silent: true }).finally(() => {
      void registrationVm.handleCompleteRegistration()
    })
  }, [isProgramStep, registrationVm, participantVm])

  const hasRecruitmentPhase = visibleRecruitTabKeys.length > 0
  const hasApplicationPhase = visibleApplicationTabKeys.length > 0

  return {
    activeStep: coercedActiveStep,
    phase,
    currentStepDef,
    registrationTemplateId,
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
    participantFlags,
    visibleRecruitTabKeys,
    visibleApplicationTabKeys,
    hasRecruitmentPhase,
    hasApplicationPhase,
  }
}
