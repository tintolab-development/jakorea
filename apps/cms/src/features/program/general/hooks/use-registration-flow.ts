import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useCmsAlert } from '@/shared/ui'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'
import { resetInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import {
  subscribeInstitutionApplicationBridgeForRegistrationWizard,
  syncInstitutionApplicationBridgeForRegistrationWizard,
} from '@/features/program/general/lib/registration-institution-bridge-sync'
import { clearOperationalSeedDefaultSuppression } from '@/features/template/ui/form-set/shared/operational-seed-default-suppression'
import { resetAllOperationalOverlayStores } from '@/features/template/ui/form-set/shared/set-operational-overlay-scope'
import { getFormTemplateVersionCacheEntry } from '@/features/template/api/form-template-version-cache'
import { useWritingFormSections } from '@/features/template/hooks/use-writing-form-sections'
import { getParticipantApplicationEditorVariantForTemplateCode } from '@/features/template/lib/participant-application-template-id'
import {
  lookupWritingTemplateRegistry,
  resolveWritingTemplateDisplayName,
} from '@/features/template/lib/lookup-writing-template-registry'
import {
  flushParticipantSessionOverlaysToOperationalStores,
  useProgramParticipantApplicationEditor,
} from '@/features/template/hooks/use-program-participant-application-editor'
import {
  getProgramRegistrationOverlayVersion,
  patchRegistrationOverlayProgramTitleKo,
  subscribeProgramRegistrationOverlay,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { buildParticipantApplicationEditorState } from '@/features/template/lib/participant-application-editor-state'
import { useProgramRegistrationEditor } from '@/features/template/hooks/use-program-registration-editor'
import {
  PROGRAM_REGISTRATION_ECONOMY_TEMPLATE_CODE,
  PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE,
} from '@/features/template/lib/program-registration-editor-state'
import { PROGRAM_REGISTRATION_TRAINED_TEACHERS_TEMPLATE_CODE } from '@/features/program/shared/lib/registration-draft-notice'
import { isLocalStorageQuotaExceededError } from '@/features/template/lib/writing-form-template-local-save'
import type { ProgramRegistrationFormVariant } from '@/features/template/model/program-registration-draft'
import type { Program } from '@/types/domain'
import type { TemplateEditorVm } from '@/features/template/ui/template-renderers/template-renderer-types'
import { resolveTemplateEditorPanels } from '@/features/template/ui/template-renderers/resolve-template-editor-panels'
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
import { describeIncompleteApplicationFormThirdPartyRecipient } from '@/features/program/general/lib/application-form-third-party-recipient-required'
import { registrationPendingSnapshotId } from '@/features/program/general/lib/registration-local-save'
import { shouldUseRegistrationCreateFormBindings } from '@/features/program/general/lib/registration-create-form-bindings-capabilities'
import {
  hydrateRegistrationProgramDraft,
  syncRegistrationProgramDraftSession,
} from '@/features/program/general/lib/registration-program-draft-session'
import {
  registrationProgramTypeForTemplateCode,
  type ProgramRegistrationDraftTemplateCode,
} from '@/features/program/shared/lib/registration-draft-notice'
import { listIncompleteGeneralProgramRecruitmentRequiredFields } from '@/features/program/general/lib/registration-recruitment-required-fields'
import { listIncompleteEconomyProgramRecruitmentRequiredFields } from '@/features/program/general/lib/economy-program-registration-required-fields'
import { listIncompleteApplicationFormThirdPartyRecipientFieldKeys } from '@/features/program/general/lib/application-form-third-party-recipient-required'
import { formatRegistrationStepTransitionLabel } from '@/features/program/shared/lib/log-program-registration-create-payload'
import {
  clearRegistrationStepTemplateSelections,
  getRegistrationStepTemplateSelections,
  getSelectedOperationalTemplateCode,
  hydrateRegistrationStepTemplateSelections,
  isDefaultOperationalTemplateSelection,
} from '@/features/program/shared/lib/step-template-selection'
import { applyRegistrationStepTemplateChange } from '@/features/program/shared/lib/step-template-apply'
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

/** 일반프로그램 등록 필수 항목 미입력 검사 — `hasIncompleteGeneralProgramRegistrationRequiredFields` */
const SKIP_GENERAL_REGISTRATION_REQUIRED_FIELDS_CHECK = false

function resetGeneralRegistrationWizardMemory(): void {
  clearOperationalSeedDefaultSuppression()
  resetInstitutionApplicationProgramBridge()
  resetAllOperationalOverlayStores()
}

export type UseGeneralProgramRegistrationFlowOptions = {
  onProgramRegistrationSaved?: (program?: Program) => void
  initialStep?: GeneralProgramRegistrationStepKey
  onStepChange?: (step: GeneralProgramRegistrationStepKey) => void
  registrationFormVariant?: ProgramRegistrationFormVariant
  /** true면 임시저장 복원 없이 시드로 시작 */
  skipDraftRestore?: boolean
  /** 필수 미입력 검증 실패 시 — 인라인 강조용 진단 키 */
  reportValidationIncomplete?: (keys: readonly string[]) => void
}

function resolveStepTemplateName(templateId: string): string {
  return resolveWritingTemplateDisplayName(templateId)
}

/** 1사1교·교육받은 교사 — 봉사자 탭 미노출 */
function tabVisibilityForVariant(
  variant: ProgramRegistrationFormVariant
): { hideVolunteer: true } | undefined {
  if (variant === 'economy' || variant === 'trainedTeachers') {
    return { hideVolunteer: true as const }
  }
  return undefined
}

function coerceRegistrationStepForVariant(
  step: GeneralProgramRegistrationStepKey,
  flags: GeneralProgramRegistrationParticipantFlags,
  variant: ProgramRegistrationFormVariant
): GeneralProgramRegistrationStepKey {
  // 교육받은 교사 전용 step 강제 리다이렉트 없음 — 참여자 플래그 + hideVolunteer만 적용
  return coerceGeneralProgramRegistrationStep(step, flags, tabVisibilityForVariant(variant))
}

export function useGeneralProgramRegistrationFlow(
  open: boolean,
  options?: UseGeneralProgramRegistrationFlowOptions
) {
  const { showAlert } = useCmsAlert()
  const { sections: writingFormSections } = useWritingFormSections()
  const registrationFormVariant = options?.registrationFormVariant ?? 'general'
  const isCompanySchoolRegistration = registrationFormVariant === 'economy'
  const isTrainedTeachersRegistration = registrationFormVariant === 'trainedTeachers'
  const registrationTemplateId = isCompanySchoolRegistration
    ? 'registration-economy'
    : isTrainedTeachersRegistration
      ? 'registration-trained-teachers'
      : 'registration-general'
  const skipDraftRestore = options?.skipDraftRestore === true
  const programType = registrationProgramTypeForTemplateCode(
    registrationTemplateId as ProgramRegistrationDraftTemplateCode
  )
  const freshOverlayResetRef = useRef(false)
  if (!open) {
    freshOverlayResetRef.current = false
  } else if (skipDraftRestore && !freshOverlayResetRef.current) {
    freshOverlayResetRef.current = true
    resetGeneralRegistrationWizardMemory()
    clearRegistrationWizardSessionDrafts()
  }

  const onStepChangeRef = useRef(options?.onStepChange)
  onStepChangeRef.current = options?.onStepChange
  const continueHydratedRef = useRef(false)
  const [stepTemplateByKey, setStepTemplateByKey] = useState<Record<string, string>>({})
  const [wizardDraftRevision, setWizardDraftRevision] = useState(0)

  const registrationVm = useProgramRegistrationEditor(
    open,
    resolveStepTemplateName(registrationTemplateId),
    {
      programRegistrationFormVariant: registrationFormVariant,
      onRegistrationSaved: options?.onProgramRegistrationSaved,
      skipDraftRestore,
      registrationWizardProgramType: programType,
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

  /** 모집·신청 탭 공통 (1사1교·교육받은 교사 봉사자 숨김) */
  const tabVisibility = useMemo(
    () => tabVisibilityForVariant(registrationFormVariant),
    [registrationFormVariant]
  )

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
    if (!open) {
      continueHydratedRef.current = false
      clearRegistrationStepTemplateSelections(programType)
      setStepTemplateByKey({})
      setWizardDraftRevision(0)
    }
  }, [open, programType])

  useEffect(() => {
    if (!open) return
    if (skipDraftRestore) return
    if (continueHydratedRef.current) return
    continueHydratedRef.current = true
    void (async () => {
      const payload = await hydrateRegistrationProgramDraft(programType)
      await hydrateRegistrationOperationalOverlaysFromLocalDrafts(
        programType,
        registrationFormVariant
      )
      if (payload?.selectedOperationalTemplates != null) {
        hydrateRegistrationStepTemplateSelections(
          programType,
          payload.selectedOperationalTemplates
        )
        setStepTemplateByKey(payload.selectedOperationalTemplates)
      }
      if (payload?.activeStep != null) {
        const restored = coerceRegistrationStepForVariant(
          normalizeGeneralProgramRegistrationStepKey(
            payload.activeStep,
            participantFlags,
            tabVisibility
          ),
          participantFlags,
          registrationFormVariant
        )
        setActiveStep(restored)
        onStepChangeRef.current?.(restored)
      }
      const titleKo = payload?.programTitleKo?.trim()
      if (titleKo) {
        patchRegistrationOverlayProgramTitleKo(registrationFormVariant, titleKo)
      }
    })().catch(error => {
      console.warn('[registration-program-draft] hydrate failed', error)
    })
  }, [
    open,
    skipDraftRestore,
    programType,
    registrationFormVariant,
    participantFlags,
    tabVisibility,
  ])

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

  // 참여자 유형 플래그 기반 (TT는 organization 고정 → 참여 기관 모집/신청만 노출)
  const visibleRecruitTabKeys = useMemo(
    () => getVisibleGeneralProgramRecruitTabKeys(participantFlags, tabVisibility),
    [participantFlags, tabVisibility]
  )

  const visibleApplicationTabKeys = useMemo(
    (): GeneralProgramRegistrationApplicationTabKey[] =>
      getVisibleGeneralProgramApplicationTabKeys(participantFlags, tabVisibility),
    [participantFlags, tabVisibility]
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
        if (base.key === 'recruit-participant-school') {
          return {
            ...base,
            templateId: 'recruitment-trained-teachers',
            editorVariant: 'trained-teachers-recruit-institution' as const,
          }
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
      if (base.key === 'recruit-participant-school') {
        return {
          ...base,
          templateId: 'recruitment-economy',
          editorVariant: 'economy-recruit-institution' as const,
        }
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

  const selectedTemplateCode =
    stepTemplateByKey[
      coercedActiveStep === 'recruit-volunteer' ? 'recruit-volunteer' : coercedActiveStep
    ] ??
    getSelectedOperationalTemplateCode(programType, coercedActiveStep, currentStepDef.templateId)

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
    'applicant-recruit-institution'

  const isProgramStep = coercedActiveStep === 'program'
  const isParticipantStep = isParticipantRegistrationStep(coercedActiveStep)
  const { buildCurrentProgramSnapshot } = registrationVm
  const registrationOverlayVersionFrozenRef = useRef(getProgramRegistrationOverlayVersion())
  const subscribeRegistrationOverlayForLinkedProgram = useCallback(
    (onStoreChange: () => void) => {
      if (!open || !isParticipantStep) return () => {}
      return subscribeProgramRegistrationOverlay(onStoreChange)
    },
    [open, isParticipantStep]
  )
  const getRegistrationOverlayVersionForLinkedProgram = useCallback(() => {
    if (!open || !isParticipantStep) {
      return registrationOverlayVersionFrozenRef.current
    }
    const next = getProgramRegistrationOverlayVersion()
    registrationOverlayVersionFrozenRef.current = next
    return next
  }, [open, isParticipantStep])
  const registrationOverlayVersion = useSyncExternalStore(
    subscribeRegistrationOverlayForLinkedProgram,
    getRegistrationOverlayVersionForLinkedProgram,
    getRegistrationOverlayVersionForLinkedProgram
  )
  const registrationWizardLinkedProgram = useMemo(() => {
    if (!open || !isParticipantStep) return null
    return buildCurrentProgramSnapshot(registrationPendingSnapshotId(registrationFormVariant))
  }, [
    open,
    isParticipantStep,
    buildCurrentProgramSnapshot,
    registrationFormVariant,
    registrationOverlayVersion,
    wizardDraftRevision,
  ])
  const instructorScheduleSourceProgram = useMemo(
    () =>
      open && coercedActiveStep === 'application-instructor'
        ? buildCurrentProgramSnapshot()
        : null,
    [open, coercedActiveStep, buildCurrentProgramSnapshot]
  )

  const participantVm = useProgramParticipantApplicationEditor(
    open && isParticipantStep,
    participantTemplateName,
    participantVariant,
    {
      registrationWizardProgramType: programType,
      registrationWizardOpen: open,
      skipDraftRestore,
      templateCode: selectedTemplateCode,
      wizardDraftRevision,
      participantOrganization: participantFlags.organization,
      /** 유형 설정 참여 방식 등 → 개인 신청 팀 정보 단락 노출 (상세 미리보기와 동일) */
      program: registrationWizardLinkedProgram,
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
      instructorScheduleSourceProgram,
      applicantRecruitInstitutionLayoutVariant: isCompanySchoolRegistration
        ? 'economy'
        : isTrainedTeachersRegistration
          ? 'trainedTeachers'
          : undefined,
      applicantRecruitInstitutionDefaults: isCompanySchoolRegistration
        ? {
            studentListRequired: 'none',
            preguidanceRequired: 'need',
            maxAssignableInstructors: 2,
            maxClassCount: 4,
            maxScheduleCount: 2,
            maxSessionsPerDay: 2,
          }
        : isTrainedTeachersRegistration
          ? {
              studentListRequired: 'need',
              maxClassCount: 4,
              maxScheduleCount: 3,
              maxSessionsPerDay: 8,
            }
          : undefined,
      /** 1사1교 — 단락 타이틀 옆 필수(*) (공유 강사 모집 상세 등 선택 시드 포함) */
      forceSeedParagraphsRequired: isCompanySchoolRegistration,
    }
  )

  useEffect(() => {
    if (open) return
    resetGeneralRegistrationWizardMemory()
    clearRegistrationWizardSessionDrafts()
  }, [open])

  const applicantRecruitTemplateCodeForBridge = useMemo(() => {
    if (isTrainedTeachersRegistration) return 'recruitment-trained-teachers'
    if (isCompanySchoolRegistration) return 'recruitment-economy'
    return 'recruitment-participant-school'
  }, [isCompanySchoolRegistration, isTrainedTeachersRegistration])

  const institutionBridgeSyncArgs = useMemo(
    () => ({
      registrationFormVariant,
      programType: registrationVm.programType,
      sessionRound: registrationVm.sessionRoundType,
      educationScheduleMode: registrationVm.educationScheduleMode,
      recruitTemplateCode: applicantRecruitTemplateCodeForBridge,
    }),
    [
      registrationFormVariant,
      applicantRecruitTemplateCodeForBridge,
      registrationVm.programType,
      registrationVm.sessionRoundType,
      registrationVm.educationScheduleMode,
    ]
  )

  useEffect(() => {
    if (!open) return
    syncInstitutionApplicationBridgeForRegistrationWizard(institutionBridgeSyncArgs)
  }, [open, institutionBridgeSyncArgs])

  useEffect(() => {
    if (!open || !isParticipantStep) return
    syncInstitutionApplicationBridgeForRegistrationWizard(institutionBridgeSyncArgs)
    return subscribeInstitutionApplicationBridgeForRegistrationWizard(institutionBridgeSyncArgs)
  }, [open, isParticipantStep, institutionBridgeSyncArgs])

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

  /** 「임시 저장」— 현재 양식과 메타를 localStorage에만 저장한다. */
  const persistDraftSilent = useCallback(async () => {
    await trackRegistrationWizardVisitSave(programType, async () => {
      // 공통정보는 다른 단계에서도 React state에 유지되므로 항상 함께 저장한다.
      await registrationVm.handleSave({ silent: true })
      if (!isProgramStep && isParticipantStep) {
        await participantVm.handleSave({ silent: true })
      }
      flushParticipantSessionOverlaysToOperationalStores()
      await persistRegistrationOperationalOverlaysToLocal(programType, registrationFormVariant)
      syncRegistrationProgramDraftSession({
        programType,
        registrationTemplateCode: registrationTemplateId,
        activeStep: coercedActiveStep,
        programTitleKo: registrationVm.resolveProgramTitleKo(),
      })
    })
  }, [
    coercedActiveStep,
    isParticipantStep,
    isProgramStep,
    participantVm,
    programType,
    registrationFormVariant,
    registrationTemplateId,
    registrationVm,
  ])

  const selectStep = useCallback(
    (key: GeneralProgramRegistrationStepKey) => {
      const next = coerceRegistrationStepForVariant(
        key,
        participantFlags,
        registrationFormVariant
      )
      if (next === coercedActiveStep) return
      const fromPhase = getGeneralProgramRegistrationPhase(coercedActiveStep)
      const toPhase = getGeneralProgramRegistrationPhase(next)
      if (fromPhase !== toPhase) {
        registrationVm.logCurrentRegistrationPayload(
          formatRegistrationStepTransitionLabel(fromPhase, toPhase)
        )
      }
      // 탭/단계 전환은 React state만 유지. 세션·서버 임시저장은 「임시 저장」버튼에서만.
      setActiveStep(next)
      options?.onStepChange?.(next)
    },
    [coercedActiveStep, options, participantFlags, registrationFormVariant, registrationVm]
  )

  const goToPhase = useCallback(
    (nextPhase: GeneralProgramRegistrationPhaseKey) => {
      const shouldCheckRequired =
        !SKIP_GENERAL_REGISTRATION_REQUIRED_FIELDS_CHECK &&
        (registrationFormVariant === 'general' ||
          registrationFormVariant === 'economy' ||
          registrationFormVariant === 'trainedTeachers')

      if (
        shouldCheckRequired &&
        nextPhase !== 'program' &&
        isProgramStep &&
        registrationVm.hasIncompleteRequiredFields()
      ) {
        const incompleteKeys = registrationVm.listIncompleteRequiredFieldKeys()
        options?.reportValidationIncomplete?.(incompleteKeys)
        console.debug(
          '[registration] 공통정보 필수항목 미입력:',
          registrationVm.getIncompleteRequiredFieldsReason?.()
        )
        showAlert({
          title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
          content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
        })
        return
      }
      /** 모집→신청 필수 검사는 일반·1사1교만 — 교육받은 교사는 프로그램 단계 검사만 적용 */
      if (
        shouldCheckRequired &&
        registrationFormVariant !== 'trainedTeachers' &&
        phase === 'recruitment' &&
        nextPhase === 'application'
      ) {
        const recruitCtx = {
          participant: participantFlags,
          programType: registrationVm.programType,
          sessionRoundType: registrationVm.sessionRoundType,
          educationScheduleMode: registrationVm.educationScheduleMode,
          volunteerExceptionScheduleCount: participantVm.volunteerExceptionScheduleCount,
          registrationProgramType: programType,
        }
        const recruitIncompleteKeys =
          registrationFormVariant === 'economy'
            ? listIncompleteEconomyProgramRecruitmentRequiredFields(participantFlags)
            : listIncompleteGeneralProgramRecruitmentRequiredFields(recruitCtx)
        const recruitIncomplete = recruitIncompleteKeys.length > 0
        if (recruitIncomplete) {
          options?.reportValidationIncomplete?.(recruitIncompleteKeys)
          showAlert({
            title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
            content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
          })
          return
        }
      }
      if (nextPhase === 'program') {
        selectStep('program')
        return
      }
      if (nextPhase === 'recruitment') {
        selectStep(getDefaultGeneralProgramRecruitStep(participantFlags, tabVisibility))
        return
      }
      selectStep(getDefaultGeneralProgramApplicationStep(participantFlags, tabVisibility))
    },
    [
      isProgramStep,
      participantFlags,
      participantVm.volunteerExceptionScheduleCount,
      phase,
      programType,
      registrationFormVariant,
      options,
      registrationVm,
      selectStep,
      showAlert,
      tabVisibility,
    ]
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
    if (!SKIP_GENERAL_REGISTRATION_REQUIRED_FIELDS_CHECK) {
      const current =
        isParticipantStep && selectedTemplateCode.startsWith('application-')
          ? {
              templateCode: selectedTemplateCode,
              draft: participantVm.draft,
            }
          : undefined
      const programSnapshot = registrationVm.buildCurrentProgramSnapshot(
        registrationPendingSnapshotId(registrationFormVariant)
      )
      const applicationIncompleteKeys = listIncompleteApplicationFormThirdPartyRecipientFieldKeys({
        program: programSnapshot,
        current,
      })
      const recipientReason =
        applicationIncompleteKeys.length > 0
          ? applicationIncompleteKeys[0]
          : describeIncompleteApplicationFormThirdPartyRecipient({
              program: programSnapshot,
              current,
            })
      if (recipientReason != null) {
        options?.reportValidationIncomplete?.(applicationIncompleteKeys)
        console.debug('[registration] 신청 양식 제공받는 곳 미입력:', recipientReason)
        showAlert({
          title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
          content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
        })
        return
      }
    }

    const applicationOverrides = () =>
      flushApplicationOperationalOverrides({
        current: isParticipantStep
          ? {
              templateCode: selectedTemplateCode,
              draft: participantVm.draft,
              editorState: buildParticipantApplicationEditorState({
                variant: participantVariant,
                volunteerExceptionScheduleCount: participantVm.volunteerExceptionScheduleCount,
                ujatVolunteerApplicationType: participantVm.ujatVolunteerApplicationType,
                ujatGradeApplicationBlockIds:
                  participantVm.ujatProgramApplicationGradeInfo?.applicationGradeBlockIds ?? [],
                ujatApplicationGradeByBlockId:
                  participantVm.ujatProgramApplicationGradeInfo?.applicationGradeByBlockId ?? {},
                ujatGradeClassTimeBlockIds:
                  participantVm.ujatProgramApplicationGradeClassTime?.classTimeBlockIds ?? [],
              }),
            }
          : undefined,
        overlayForTemplateCode: collectOperationalOverlayForCatalogId,
      })

    if (isProgramStep) {
      if (shouldUseRegistrationCreateFormBindings()) {
        void registrationVm.handleCompleteRegistration({
          operationalOverrides: applicationOverrides(),
        })
        return
      }
      void registrationVm.handleCompleteRegistration()
      return
    }
    registrationVm.logCurrentRegistrationPayload('등록 완료')
    void (async () => {
      const completeWithBindings = shouldUseRegistrationCreateFormBindings()
      if (!completeWithBindings) {
        try {
          await participantVm.handleSave({ silent: true })
        } catch (error) {
          console.debug('generalProgramRegistration complete: participant draft save failed', error)
          showAlert({
            title: '임시 저장 실패',
            content: isLocalStorageQuotaExceededError(error)
              ? '임시 저장에 실패했습니다.\n브라우저 저장 공간을 확인한 뒤 다시 시도해 주세요.'
              : '임시 저장에 실패했습니다.\n잠시 후 다시 시도해 주세요.',
          })
          return
        }
        void registrationVm.handleCompleteRegistration()
        return
      }

      void registrationVm.handleCompleteRegistration({
        operationalOverrides: applicationOverrides(),
      })
    })()
  }, [
    selectedTemplateCode,
    isParticipantStep,
    isProgramStep,
    participantVariant,
    participantVm,
    registrationFormVariant,
    registrationVm,
    showAlert,
  ])

  const selectStepTemplate = useCallback(
    async (next: { id: string; latestVersionId?: number; baseTemplateCode?: string; apiTemplateId?: number }) => {
      const result = await applyRegistrationStepTemplateChange({
        programType,
        stepKey: coercedActiveStep,
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
    [coercedActiveStep, currentStepDef.templateId, programType, selectedTemplateCode]
  )

  const isDefaultStepTemplate = isDefaultOperationalTemplateSelection(
    selectedTemplateCode,
    currentStepDef.templateId
  )

  // 목록은 모달을 언마운트해서 닫는다. open=false 효과는 그때 실행되지 않으므로
  // 방문 종료는 이 효과의 cleanup에서 한다. 임시저장하지 않은 양식 변경은 버린다.
  useEffect(() => {
    if (!open) return
    beginRegistrationWizardVisit(programType)
    return () => {
      endRegistrationWizardVisit(programType, resetGeneralRegistrationWizardMemory)
    }
  }, [open, programType])

  const hasRecruitmentPhase = visibleRecruitTabKeys.length > 0
  const hasApplicationPhase = visibleApplicationTabKeys.length > 0

  return {
    activeStep: coercedActiveStep,
    phase,
    currentStepDef,
    registrationTemplateId,
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
    participantFlags,
    visibleRecruitTabKeys,
    visibleApplicationTabKeys,
    hasRecruitmentPhase,
    hasApplicationPhase,
  }
}
