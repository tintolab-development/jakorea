import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCmsAlert } from '@/shared/ui'
import { beginBlockingOverlay } from '@/shared/ui/blocking-overlay-store'
import {
  buildRequiredFieldsIncompleteAlertContent,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'
import { useCreateProgram } from '@/features/program/ujat/api/queries'
import {
  formatUjatRegistrationRequiredFieldReasons,
  listIncompleteUjatProgramRegistrationRequiredFields,
  listIncompleteUjatProgramRecruitmentTypedRequiredFields,
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
  normalizeOverlayPaymentItemsBeforeSubmit,
  PAYMENT_ITEM_RESELECT_ALERT,
} from '@/features/program/shared/lib/program-wage-payment-item-helpers'
import { UJAT_WAGE_OVERLAY_PAYMENT_KEY } from '@/features/program/ujat/lib/ujat-wage-info-display'
import { toCreateRequest } from '@/features/program/ujat/api/adapters'
import { buildUjatProgramListRowFromRegistrationSnapshot } from '@/features/program/ujat/lib/ujat-registration-local-save'
import {
  applyUjatRegistrationRecruitmentFormsToProgram,
  programToUjatRecruitCanonicalFormValues,
  type UjatRecruitDisplayKind,
} from '@/features/program/ujat/lib/ujat-recruit-display-program'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { mergeDevAutofillSparse } from '@/features/program/shared/lib/merge-dev-autofill-sparse'
import { useProgramDetailEditForm } from '@/features/program/general/hooks/use-program-detail-edit-form'
import {
  formatRegistrationStepTransitionLabel,
  logProgramRegistrationCreatePayload,
  logRegistrationStepTransitionPayload,
} from '@/features/program/shared/lib/log-program-registration-create-payload'
import type { TemplateEditorVm } from '@/features/template/ui/template-renderers/template-renderer-types'
import { resolveTemplateEditorPanels } from '@/features/template/ui/template-renderers/resolve-template-editor-panels'
import { publishUjatRegistrationBusinessPeriod } from '@/features/program/shared/lib/registration-business-period-issues'
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
  loadRegistrationWizardFormDraft,
  persistRegistrationWizardFormDraft,
} from '@/features/program/general/lib/registration-wizard-form-draft'
import {
  beginRegistrationWizardVisit,
  endRegistrationWizardVisit,
  trackRegistrationWizardVisitSave,
} from '@/features/program/general/lib/registration-wizard-visit'
import { clearOperationalSeedDefaultSuppression } from '@/features/template/ui/form-set/shared/operational-seed-default-suppression'
import { resetAllOperationalOverlayStores } from '@/features/template/ui/form-set/shared/set-operational-overlay-scope'
import {
  hydrateRegistrationProgramDraft,
  peekRegistrationProgramDraftPayload,
  syncRegistrationProgramDraftSession,
} from '@/features/program/general/lib/registration-wizard-draft-session'
import { overlayRecordToInterviewConfig } from '@/features/program/ujat/lib/recruitment-typed-contract'
import {
  peekActiveUjatRecruitInstitutionOverlayRecord,
  peekActiveUjatRecruitVolunteerOverlayRecord,
  registerUjatRegistrationRecruitRhf,
} from '@/features/program/ujat/lib/ujat-registration-rhf-api'
import { getRecruitTypedInterviewRecord } from '@/features/template/ui/form-set/application-form/volunteer/lib/interview-schedule-overlay-sync'
import { ujatVolunteerRecruitInterviewNamespace } from '@/features/program/ujat/lib/ujat-recruit-volunteer-half-overlay'
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
import { setUjatTypedRecruitmentOverlayWritesBlocked } from '@/features/program/ujat/lib/ujat-typed-recruitment-overlay-write-block'

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

function ujatRequiredFieldsIncompleteAlertContent(keys: readonly string[]) {
  return buildRequiredFieldsIncompleteAlertContent(
    formatUjatRegistrationRequiredFieldReasons(keys)
  )
}

/** 신규 UJAT Wizard의 모집 입력은 GET row/Typed RHF만 읽는다. */
function mapUjatRegistrationRecruitmentFormValues(
  program: Program,
  kind: UjatRecruitDisplayKind
): ProgramDetailEditFormValues {
  return programToUjatRecruitCanonicalFormValues(program, kind)
}

function resolveStepTemplateName(templateId: string): string {
  return resolveWritingTemplateDisplayName(templateId)
}

const UJAT_RECRUITMENT_TYPED_DRAFT_TEMPLATE = 'recruitment-ujat-typed'

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
  const typedRecruitmentDraftHydratedRef = useRef(false)
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
    setUjatTypedRecruitmentOverlayWritesBlocked(open)
    return () => setUjatTypedRecruitmentOverlayWritesBlocked(false)
  }, [open])

  useEffect(() => {
    if (!open) {
      continueHydratedRef.current = false
      typedRecruitmentDraftHydratedRef.current = false
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
        hydrateRegistrationStepTemplateSelections(programType, payload.selectedOperationalTemplates)
        setStepTemplateByKey(payload.selectedOperationalTemplates)
      }
      if (payload?.activeStep == null) return
      const restored = normalizeUjatProgramRegistrationStepKey(payload.activeStep)
      setActiveStep(restored)
      onStepChangeRef.current?.(restored)
    })().catch(error => {
      console.warn('[registration-wizard-draft] UJAT hydrate failed', error)
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
    () =>
      UJAT_PROGRAM_REGISTRATION_STEPS.find(s => s.key === activeStep) ??
      UJAT_PROGRAM_REGISTRATION_STEPS[0],
    [activeStep]
  )

  const selectedTemplateCode =
    stepTemplateByKey[
      activeStep === 'recruit-volunteer-h1' || activeStep === 'recruit-volunteer-h2'
        ? 'recruit-volunteer'
        : activeStep
    ] ?? getSelectedOperationalTemplateCode(programType, activeStep, currentStepDef.templateId)

  const programTemplateName = useMemo(() => resolveStepTemplateName('registration-ujat'), [])

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

  const registrationVm = useUjatProgramRegistrationEditor(open, programTemplateName, {
    skipDraftRestore,
    registrationWizardProgramType: programType,
  })
  const ujatBusinessPeriodStart = registrationVm.basicInfoForm.watch('startDate')
  const ujatBusinessPeriodEnd = registrationVm.basicInfoForm.watch('endDate')

  useEffect(() => {
    if (!open) {
      publishUjatRegistrationBusinessPeriod(null)
      return
    }
    publishUjatRegistrationBusinessPeriod({
      start: ujatBusinessPeriodStart,
      end: ujatBusinessPeriodEnd,
    })
  }, [open, ujatBusinessPeriodEnd, ujatBusinessPeriodStart])

  useEffect(() => {
    return () => publishUjatRegistrationBusinessPeriod(null)
  }, [])

  const registrationWizardBaseProgram = useMemo(() => {
    if (!open) return null
    return buildUjatProgramListRowFromRegistrationSnapshot({
      id: 'ujat-registration-linked',
      overlay: {},
      basicInfo: registrationVm.basicInfoValues,
    })
  }, [open, registrationVm.basicInfoValues, wizardDraftRevision])

  useEffect(() => {
    if (!open || skipDraftRestore) return
    const payload = peekRegistrationProgramDraftPayload(programType)
    const titleKo = payload?.programTitleKo?.trim()
    if (!titleKo) return
    registrationVm.basicInfoForm.setValue('title', titleKo, {
      shouldDirty: false,
    })
  }, [open, programType, registrationVm.basicInfoForm, skipDraftRestore])

  const mapInstitutionRecruitmentFormValues = useCallback(
    (program: Program) => mapUjatRegistrationRecruitmentFormValues(program, 'institution'),
    []
  )
  const mapVolunteerH1RecruitmentFormValues = useCallback(
    (program: Program) => mapUjatRegistrationRecruitmentFormValues(program, 'volunteer_h1'),
    []
  )
  const mapVolunteerH2RecruitmentFormValues = useCallback(
    (program: Program) => mapUjatRegistrationRecruitmentFormValues(program, 'volunteer_h2'),
    []
  )
  const institutionRecruitmentForm = useProgramDetailEditForm({
    program: registrationWizardBaseProgram,
    isEditMode: true,
    holdValuesWhileEditing: true,
    resetOnProgramChange: false,
    mapToValues: mapInstitutionRecruitmentFormValues,
  })
  const volunteerH1RecruitmentForm = useProgramDetailEditForm({
    program: registrationWizardBaseProgram,
    isEditMode: true,
    holdValuesWhileEditing: true,
    resetOnProgramChange: false,
    mapToValues: mapVolunteerH1RecruitmentFormValues,
  })
  const volunteerH2RecruitmentForm = useProgramDetailEditForm({
    program: registrationWizardBaseProgram,
    isEditMode: true,
    holdValuesWhileEditing: true,
    resetOnProgramChange: false,
    mapToValues: mapVolunteerH2RecruitmentFormValues,
  })

  useEffect(() => {
    if (!open) {
      registerUjatRegistrationRecruitRhf(null)
      return
    }
    registerUjatRegistrationRecruitRhf({
      getInstitution: () => institutionRecruitmentForm.getValues(),
      getVolunteerH1: () => volunteerH1RecruitmentForm.getValues(),
      getVolunteerH2: () => volunteerH2RecruitmentForm.getValues(),
    })
    return () => registerUjatRegistrationRecruitRhf(null)
  }, [institutionRecruitmentForm, open, volunteerH1RecruitmentForm, volunteerH2RecruitmentForm])

  const buildRegistrationWizardLinkedProgram = useCallback(() => {
    if (!registrationWizardBaseProgram) return null
    return applyUjatRegistrationRecruitmentFormsToProgram(registrationWizardBaseProgram, {
      institution: institutionRecruitmentForm.getValues(),
      volunteerH1: volunteerH1RecruitmentForm.getValues(),
      volunteerH2: volunteerH2RecruitmentForm.getValues(),
    })
  }, [
    institutionRecruitmentForm,
    registrationWizardBaseProgram,
    volunteerH1RecruitmentForm,
    volunteerH2RecruitmentForm,
  ])

  // 키 입력마다 Program을 다시 만들지 않는다. 단계 전환·복원·미리보기·제출 시 getValues()로 합성한다.
  const registrationWizardLinkedProgram = useMemo(
    () => buildRegistrationWizardLinkedProgram(),
    [activeStep, buildRegistrationWizardLinkedProgram, wizardDraftRevision]
  )

  const persistTypedRecruitmentDraft = useCallback(async () => {
    const half = volunteerHalfFromRegistrationStep(activeStep)
    const liveInterview = getRecruitTypedInterviewRecord()
    if (liveInterview != null && half) {
      const config = overlayRecordToInterviewConfig(
        liveInterview,
        ujatVolunteerRecruitInterviewNamespace(half)
      )
      if (half === 'h1') {
        volunteerH1RecruitmentForm.setValue('volunteerInterviewConfig', config, {
          shouldDirty: true,
        })
      } else {
        volunteerH2RecruitmentForm.setValue('volunteerInterviewConfig', config, {
          shouldDirty: true,
        })
      }
    }
    const institution = institutionRecruitmentForm.getValues()
    const volunteerH1 = volunteerH1RecruitmentForm.getValues()
    const volunteerH2 = volunteerH2RecruitmentForm.getValues()
    const recruitments = applyUjatRegistrationRecruitmentFormsToProgram(
      registrationWizardBaseProgram ??
        ({
          id: 'ujat-registration-draft',
          programRecruitments: [],
        } as unknown as Program),
      { institution, volunteerH1, volunteerH2 }
    ).programRecruitments
    await persistRegistrationWizardFormDraft({
      programType,
      templateCode: UJAT_RECRUITMENT_TYPED_DRAFT_TEMPLATE,
      draft: registrationVm.draft,
      settingsJson: {
        recruitments,
        institution,
        volunteerH1,
        volunteerH2,
      },
    })
    syncRegistrationProgramDraftSession({
      programType,
      registrationTemplateCode: PROGRAM_REGISTRATION_UJAT_TEMPLATE_CODE,
      activeStep,
      recruitments,
    })
    return recruitments
  }, [
    activeStep,
    institutionRecruitmentForm,
    programType,
    registrationVm.draft,
    registrationWizardBaseProgram,
    volunteerH1RecruitmentForm,
    volunteerH2RecruitmentForm,
  ])

  useEffect(() => {
    if (!open) return
    const handleDevAutofillComplete = (event: Event) => {
      const detail =
        event instanceof CustomEvent && event.detail != null && typeof event.detail === 'object'
          ? (event.detail as {
              typedRecruitment?: {
                institution?: ProgramDetailEditFormValues
                volunteerH1?: ProgramDetailEditFormValues
                volunteerH2?: ProgramDetailEditFormValues
              }
            })
          : null
      const typedRecruitment = detail?.typedRecruitment
      if (typedRecruitment?.institution) {
        institutionRecruitmentForm.reset(
          mergeDevAutofillSparse(
            institutionRecruitmentForm.getValues() as Record<string, unknown>,
            typedRecruitment.institution as Record<string, unknown>
          ) as ProgramDetailEditFormValues
        )
      }
      if (typedRecruitment?.volunteerH1) {
        volunteerH1RecruitmentForm.reset(
          mergeDevAutofillSparse(
            volunteerH1RecruitmentForm.getValues() as Record<string, unknown>,
            typedRecruitment.volunteerH1 as Record<string, unknown>
          ) as ProgramDetailEditFormValues
        )
      }
      if (typedRecruitment?.volunteerH2) {
        volunteerH2RecruitmentForm.reset(
          mergeDevAutofillSparse(
            volunteerH2RecruitmentForm.getValues() as Record<string, unknown>,
            typedRecruitment.volunteerH2 as Record<string, unknown>
          ) as ProgramDetailEditFormValues
        )
      }
      typedRecruitmentDraftHydratedRef.current = true
      setWizardDraftRevision(value => value + 1)
      void persistTypedRecruitmentDraft()
    }
    window.addEventListener('cms:registration-dev-autofill-complete', handleDevAutofillComplete)
    return () => {
      window.removeEventListener(
        'cms:registration-dev-autofill-complete',
        handleDevAutofillComplete
      )
    }
  }, [
    institutionRecruitmentForm,
    open,
    persistTypedRecruitmentDraft,
    volunteerH1RecruitmentForm,
    volunteerH2RecruitmentForm,
  ])

  useEffect(() => {
    if (!open || skipDraftRestore) return
    let cancelled = false
    void loadRegistrationWizardFormDraft({
      programType,
      templateCode: UJAT_RECRUITMENT_TYPED_DRAFT_TEMPLATE,
    })
      .then(saved => {
        if (cancelled) return
        typedRecruitmentDraftHydratedRef.current = true
        const savedForms = saved?.settingsJson as
          | {
              recruitments?: unknown
              institution?: ProgramDetailEditFormValues
              volunteerH1?: ProgramDetailEditFormValues
              volunteerH2?: ProgramDetailEditFormValues
            }
          | undefined
        if (
          savedForms?.institution != null &&
          savedForms.volunteerH1 != null &&
          savedForms.volunteerH2 != null
        ) {
          institutionRecruitmentForm.reset(savedForms.institution)
          volunteerH1RecruitmentForm.reset(savedForms.volunteerH1)
          volunteerH2RecruitmentForm.reset(savedForms.volunteerH2)
          setWizardDraftRevision(value => value + 1)
          return
        }
        const payloadRecruitments = peekRegistrationProgramDraftPayload(programType)?.recruitments
        const savedRecruitments = savedForms?.recruitments
        const recruitments =
          Array.isArray(payloadRecruitments) && payloadRecruitments.length > 0
            ? payloadRecruitments
            : Array.isArray(savedRecruitments) && savedRecruitments.length > 0
              ? savedRecruitments
              : null
        if (recruitments != null) {
          const snapshot = {
            id: 'ujat-registration-draft',
            programRecruitments: recruitments,
          } as Program
          institutionRecruitmentForm.reset(
            mapUjatRegistrationRecruitmentFormValues(snapshot, 'institution')
          )
          volunteerH1RecruitmentForm.reset(
            mapUjatRegistrationRecruitmentFormValues(snapshot, 'volunteer_h1')
          )
          volunteerH2RecruitmentForm.reset(
            mapUjatRegistrationRecruitmentFormValues(snapshot, 'volunteer_h2')
          )
          setWizardDraftRevision(value => value + 1)
          return
        }
        const raw = saved?.settingsJson?.ujatRecruitment
        if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return
        const values = raw as {
          institution?: Partial<ProgramDetailEditFormValues>
          volunteerH1?: Partial<ProgramDetailEditFormValues>
          volunteerH2?: Partial<ProgramDetailEditFormValues>
        }
        if (!institutionRecruitmentForm.formState.isDirty && values.institution != null) {
          institutionRecruitmentForm.reset(values.institution as ProgramDetailEditFormValues)
        }
        if (!volunteerH1RecruitmentForm.formState.isDirty && values.volunteerH1 != null) {
          volunteerH1RecruitmentForm.reset(values.volunteerH1 as ProgramDetailEditFormValues)
        }
        if (!volunteerH2RecruitmentForm.formState.isDirty && values.volunteerH2 != null) {
          volunteerH2RecruitmentForm.reset(values.volunteerH2 as ProgramDetailEditFormValues)
        }
      })
      .catch(error => {
        console.warn('[registration-recruitment-typed-draft] hydrate failed', error)
      })
    return () => {
      cancelled = true
    }
  }, [
    institutionRecruitmentForm,
    open,
    programType,
    skipDraftRestore,
    volunteerH1RecruitmentForm,
    volunteerH2RecruitmentForm,
  ])

  const ujatRecruitParagraphProps = useMemo(() => {
    const half = volunteerHalfFromRegistrationStep(activeStep)
    if (registrationWizardLinkedProgram == null) return undefined
    if (activeStep === 'recruit-participant') {
      return {
        mode: 'edit' as const,
        program: registrationWizardLinkedProgram,
        form: institutionRecruitmentForm,
        hideSectionHeader: true,
      }
    }
    if (half == null) return undefined
    return {
      mode: 'edit' as const,
      program: registrationWizardLinkedProgram,
      form: half === 'h1' ? volunteerH1RecruitmentForm : volunteerH2RecruitmentForm,
      volunteerHalf: half,
      hideSectionHeader: true,
    }
  }, [
    activeStep,
    institutionRecruitmentForm,
    registrationWizardLinkedProgram,
    volunteerH1RecruitmentForm,
    volunteerH2RecruitmentForm,
  ])

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
      const validationTarget = getUjatProgramRegistrationPhaseValidationTarget(fromPhase, toPhase)
      // 단계 이동은 화면에 보이는 최신 RHF 값을 직접 읽어 검증한다.
      const currentBasicInfo = registrationVm.basicInfoForm.getValues()
      const incompleteKeys =
        validationTarget === 'program'
          ? listIncompleteUjatProgramRegistrationRequiredFields(
              {},
              currentBasicInfo,
              registrationVm.educationScheduleForm.getValues()
            )
          : []
      if (incompleteKeys.length > 0) {
        options?.reportValidationIncomplete?.(incompleteKeys)
        console.debug('[registration] UJAT 공통정보 필수항목 미입력:', incompleteKeys)
        showAlert({
          title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
          content: ujatRequiredFieldsIncompleteAlertContent(incompleteKeys),
        })
        return
      }
      if (validationTarget === 'recruitment') {
        const recruitIncompleteKeys = listIncompleteUjatProgramRecruitmentTypedRequiredFields({
          institution: institutionRecruitmentForm.getValues(),
          volunteerH1: volunteerH1RecruitmentForm.getValues(),
          volunteerH2: volunteerH2RecruitmentForm.getValues(),
        })
        if (recruitIncompleteKeys.length > 0) {
          options?.reportValidationIncomplete?.(recruitIncompleteKeys)
          console.debug('[registration] UJAT 모집정보 필수항목 미입력:', recruitIncompleteKeys)
          showAlert({
            title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
            content: ujatRequiredFieldsIncompleteAlertContent(recruitIncompleteKeys),
          })
          return
        }
      }
      if (fromPhase !== toPhase) {
        const registrationOverlay: Record<string, unknown> = {}
        const program = buildUjatProgramListRowFromRegistrationSnapshot({
          id: 'debug',
          overlay: registrationOverlay,
          basicInfo: currentBasicInfo,
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
    [
      activeStep,
      isParticipantStep,
      options,
      participantVm,
      registrationVm.basicInfoForm,
      registrationVm.draft,
      registrationVm.educationScheduleForm,
      institutionRecruitmentForm,
      volunteerH1RecruitmentForm,
      volunteerH2RecruitmentForm,
      showAlert,
    ]
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
      const recruitments = await persistTypedRecruitmentDraft()
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
          overlay: {},
          basicInfo: registrationVm.basicInfoValues,
        }).title,
        recruitments,
      })
    })
  }, [
    activeStep,
    isParticipantStep,
    isProgramStep,
    participantVm,
    programType,
    persistTypedRecruitmentDraft,
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
    const applicationProgram =
      buildRegistrationWizardLinkedProgram() ??
      buildUjatProgramListRowFromRegistrationSnapshot({
        id: 'ujat-registration-validation',
        overlay: {},
        basicInfo: registrationVm.basicInfoValues,
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
      console.debug('[registration] UJAT 신청 양식 제공받는 곳 미입력:', applicationRecipientReason)
      showAlert({
        title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
        content: ujatRequiredFieldsIncompleteAlertContent(applicationIncompleteKeys),
      })
      return Promise.reject(new UjatRegistrationRequiredFieldsIncompleteError())
    }

    const typedRecruitment = {
      institution: institutionRecruitmentForm.getValues(),
      volunteerH1: volunteerH1RecruitmentForm.getValues(),
      volunteerH2: volunteerH2RecruitmentForm.getValues(),
    }
    const wizardIncompleteKeys = listIncompleteUjatProgramRegistrationWizardRequiredFields(
      registrationVm.basicInfoValues,
      registrationVm.educationScheduleForm.getValues(),
      typedRecruitment
    )
    if (wizardIncompleteKeys.length > 0) {
      options?.reportValidationIncomplete?.(wizardIncompleteKeys)
      console.debug('[registration] UJAT 등록 완료 필수항목 미입력:', wizardIncompleteKeys)
      showAlert({
        title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
        content: ujatRequiredFieldsIncompleteAlertContent(wizardIncompleteKeys),
      })
      return Promise.reject(new UjatRegistrationRequiredFieldsIncompleteError())
    }

    const registrationOverlayForLog: Record<string, unknown> = {}
    const programForLog =
      buildRegistrationWizardLinkedProgram() ??
      buildUjatProgramListRowFromRegistrationSnapshot({
        id: 'debug',
        overlay: registrationOverlayForLog,
        basicInfo: registrationVm.basicInfoValues,
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
        const wagePaymentItemIds =
          registrationVm.basicInfoForm.getValues('wagePaymentItemIds') ?? []
        const paymentItems = await normalizeOverlayPaymentItemsBeforeSubmit(
          { [UJAT_WAGE_OVERLAY_PAYMENT_KEY]: wagePaymentItemIds },
          [{ valuesKey: UJAT_WAGE_OVERLAY_PAYMENT_KEY }]
        )
        const nextPaymentIds = paymentItems.patch[UJAT_WAGE_OVERLAY_PAYMENT_KEY]
        if (Array.isArray(nextPaymentIds)) {
          registrationVm.basicInfoForm.setValue('wagePaymentItemIds', nextPaymentIds as string[], {
            shouldDirty: true,
          })
        }
        if (paymentItems.clearedKeys.length > 0) {
          showAlert(PAYMENT_ITEM_RESELECT_ALERT)
          throw new UjatRegistrationRequiredFieldsIncompleteError()
        }
        const registrationOverlay: Record<string, unknown> = {}
        const registrationSnapshot = {
          draft: registrationVm.draft,
          overlay: registrationOverlay,
          basicInfo: registrationVm.basicInfoValues,
          typedDetail: registrationVm.getTypedDetail(),
        }
        await persistTypedRecruitmentDraft()

        if (shouldUseRegistrationCreateFormBindings()) {
          const program =
            buildRegistrationWizardLinkedProgram() ??
            buildUjatProgramListRowFromRegistrationSnapshot({
              id: `ujat-pending-${idempotencyKeyRef.current}`,
              overlay: registrationOverlay,
              basicInfo: registrationVm.basicInfoValues,
            })

          const operationalOverrides = flushApplicationOperationalOverrides({
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
                      participantVm.ujatProgramApplicationGradeInfo?.applicationGradeByBlockId ??
                      {},
                    ujatGradeClassTimeBlockIds:
                      participantVm.ujatProgramApplicationGradeClassTime?.classTimeBlockIds ?? [],
                  }),
                }
              : undefined,
            overlayForTemplateCode: code => {
              if (code === 'recruitment-ujat-school') {
                return peekActiveUjatRecruitInstitutionOverlayRecord()
              }
              if (code === 'recruitment-ujat-volunteer') {
                return peekActiveUjatRecruitVolunteerOverlayRecord()
              }
              return collectOperationalOverlayForCatalogId(code)
            },
          })

          const { prepareRegistrationCreateFormBindings } =
            await import('@/features/program/general/lib/prepare-registration-create-form-bindings')
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
            basicInfo: registrationVm.basicInfoValues,
            idempotencyKey: idempotencyKeyRef.current,
            program,
            preparedFormBindings,
          })
          options?.onProgramRegistrationSaved?.(createdProgram)
          return createdProgram
        }

        if (isParticipantStep) {
          await participantVm.handleSave()
        }
        const snapshot = await registrationVm.persistDraft()
        const programForLog =
          buildRegistrationWizardLinkedProgram() ??
          buildUjatProgramListRowFromRegistrationSnapshot({
            id: `ujat-pending-${idempotencyKeyRef.current}`,
            overlay: registrationOverlay,
            basicInfo: registrationVm.basicInfoValues,
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
          basicInfo: registrationVm.basicInfoValues,
          idempotencyKey: idempotencyKeyRef.current,
          program: programForLog,
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
    persistTypedRecruitmentDraft,
    registrationVm,
    buildRegistrationWizardLinkedProgram,
    institutionRecruitmentForm,
    volunteerH1RecruitmentForm,
    volunteerH2RecruitmentForm,
    selectedTemplateCode,
    showAlert,
  ])

  const selectStepTemplate = useCallback(
    async (next: {
      id: string
      latestVersionId?: number
      baseTemplateCode?: string
      apiTemplateId?: number
    }) => {
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
    /** 모집 미리보기는 클릭 시점 Typed RHF 값으로 만든 canonical 행만 사용한다. */
    recruitmentPreviewProgram: registrationWizardLinkedProgram,
    buildRecruitmentPreviewProgram: buildRegistrationWizardLinkedProgram,
    isCompletingRegistration: createProgramMutation.isPending,
  }
}
