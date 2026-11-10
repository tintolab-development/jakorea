import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { RegistrationWizardIncompleteMapVariant } from '@/features/program/shared/lib/registration-wizard-incomplete-map'
import { resolveRegistrationWizardIncompleteParagraphIds } from '@/features/program/shared/lib/registration-wizard-incomplete-map'
import {
  RegistrationWizardValidationHighlightProvider,
  scrollToFirstRegistrationWizardIncompleteParagraph,
  useRegistrationWizardValidationHighlight,
} from '@/features/program/shared/ui/registration/registration-wizard-validation-highlight'
import { useSearchParams } from 'react-router-dom'
import { TEMPLATE_USER_PREVIEW_ACTIVE } from '@/features/template/lib/template-user-preview-url'
import { TemplateFullpageModal } from '@/features/template/ui/template-management/template-fullpage-modal'
import type { TemplateFullpageModalFooterAction } from '@/features/template/ui/template-management/template-fullpage-modal'
import type { Program } from '@/types/domain'
import type { ProgramRegistrationFormVariant } from '@/features/template/model/program-registration-draft'
import {
  GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY,
  GENERAL_PROGRAM_REGISTRATION_PROGRAM_PHASE_HINT_GENERAL,
  generalRegistrationRecruitmentPreviewTitle,
  normalizeGeneralProgramRegistrationStepKey,
  recruitmentPreviewAudienceFromRegistrationStep,
} from '@/features/program/general/model/registration-flow'
import {
  ParticipantRecruitmentPreviewModal,
  type RecruitmentUserPreviewAudience,
} from '@/features/program/general/ui/detail-modal/info/participant-recruitment-preview-modal'
import { PlatformPreviewModal } from '@/features/program/shared/ui/platform-preview/platform-preview-modal'
import {
  buildApplicationPlatformPreviewMessage,
  resolveApplicationStepPreviewSpec,
} from '@/features/program/general/lib/application-platform-preview'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import type { GeneralProgramRegistrationStepKey } from '@/features/program/general/model/registration-flow'
import { useGeneralProgramRegistrationFlow } from '@/features/program/general/hooks/use-registration-flow'
import { useRegistrationWizardHistoryLeaveGuard } from '@/features/program/general/hooks/use-registration-wizard-history-leave-guard'
import { GeneralProgramRegistrationBodyHeader } from '@/features/program/general/ui/registration/registration-body-header'
import { RegistrationStepTemplateChrome } from '@/features/program/shared/ui/registration/step-template-banner'
import {
  HideParagraphSelectionChromeContext,
  ShowParagraphActiveOutlineContext,
} from '@/features/template/context/paragraph-selection-chrome-context'
import { GeneralRegistrationWizardContext } from '@/features/template/context/general-registration-wizard-context'
import {
  REGISTRATION_DRAFT_MODE_QUERY_KEY,
  clearRegistrationDraftForFreshStart,
  peekRegistrationDraftNotice,
  registrationProgramTypeForTemplateCode,
  shouldRemoveRegistrationDraftAfterCompletion,
  shouldSkipRegistrationDraftRestore,
  type ProgramRegistrationDraftTemplateCode,
} from '@/features/program/shared/lib/registration-draft-notice'
import {
  assertRegistrationWizardRemoteReady,
  shouldUseRegistrationCreateFormBindings,
} from '@/features/program/general/lib/registration-create-form-bindings-capabilities'
import { hasPendingRegistrationFormApplyFailures } from '@/features/program/general/lib/apply-registration-forms-after-create'
import { RegistrationDraftOverwriteConfirmModal } from '@/features/program/shared/ui/registration/draft-overwrite-confirm-modal'
import { RegistrationDraftSaveSuccessModal } from '@/features/program/shared/ui/registration/draft-save-success-modal'
import { invalidateProgramListCachesAfterRegistration } from '@/features/program/shared/lib/invalidate-program-list-caches-after-registration'
import { RegistrationCompleteSuccessModal } from '@/features/program/shared/ui/registration/registration-complete-success-modal'
import { RegistrationGeneralDevAutofillToolbar } from '@/features/program/general/ui/registration/registration-general-dev-autofill-toolbar'
import { RegistrationDevAutofillButton } from '@/features/program/shared/ui/registration/registration-dev-autofill-button'
import type { GeneralRegistrationDevAutofillCaseId } from '@/features/program/general/lib/registration-dev-autofill-cases'
import { TrainedTeachersDevAutofillToolbar } from '@/features/program/trained-teachers/ui/registration/trained-teachers-dev-autofill-toolbar'
import type { TrainedTeachersRegistrationDevAutofillCaseId } from '@/features/program/trained-teachers/lib/registration-dev-autofill-cases'
import { useCmsAlert } from '@/shared/ui'
import { registrationStepForOperationDateFocus } from '@/features/program/shared/lib/program-date-outside-open-period-alert'
import { useProgramOperationDateErrorFocus } from '@/features/program/shared/lib/use-program-operation-date-error-focus'
import { isLocalStorageQuotaExceededError } from '@/features/template/lib/writing-form-template-local-save'
import { useSponsorNameById } from '@/features/sponsor/hooks/use-sponsor-name-by-id'
import { getProgramRegistrationOverlayVersion } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { useRegistrationWizardLeaveGuard } from '@/features/program/shared/lib/registration-wizard-leave-guard'
import { RegistrationWizardLeaveConfirmModal } from '@/features/program/shared/ui/registration/registration-wizard-leave-confirm-modal'
import { GeneralRegistrationWizardFormProvider } from '@/features/program/general/ui/registration/registration-wizard-form-provider'
import { peekGeneralRegistrationWizardRhf } from '@/features/program/general/lib/overlay-phase1/registration-wizard-rhf-api'
import { TrainedTeachersRegistrationWizardFormProvider } from '@/features/program/trained-teachers/ui/registration/registration-wizard-form-provider'
import { peekTrainedTeachersRegistrationRhf } from '@/features/program/trained-teachers/lib/registration-rhf-api'
import { CompanySchoolRegistrationWizardFormProvider } from '@/features/program/1c-1s/ui/registration/registration-wizard-form-provider'
import { RegistrationBusinessPeriodConstraintProvider } from '@/features/program/shared/ui/registration/registration-business-period-constraint'

const GENERAL_REGISTRATION_MODAL_TITLE = '일반 프로그램 등록'
const COMPANY_SCHOOL_REGISTRATION_MODAL_TITLE = '1사1교 프로그램 등록'
const TRAINED_TEACHERS_REGISTRATION_MODAL_TITLE = '교육받은 교사 프로그램 등록'

function registrationWizardHighlightVariant(
  variant: ProgramRegistrationFormVariant
): RegistrationWizardIncompleteMapVariant {
  if (variant === 'economy') return 'economy'
  if (variant === 'trainedTeachers') return 'trainedTeachers'
  return 'general'
}

const DRAFT_SAVE_FAILURE_QUOTA_MESSAGE =
  '임시 저장에 실패했습니다.\n브라우저 저장 공간을 확인한 뒤 다시 시도해 주세요.'
const DRAFT_SAVE_FAILURE_GENERIC_MESSAGE = '임시 저장에 실패했습니다.\n잠시 후 다시 시도해 주세요.'

function draftSaveFailureMessage(error: unknown): string {
  return isLocalStorageQuotaExceededError(error)
    ? DRAFT_SAVE_FAILURE_QUOTA_MESSAGE
    : DRAFT_SAVE_FAILURE_GENERIC_MESSAGE
}

export type GeneralProgramRegistrationFullpageModalProps = {
  open: boolean
  onClose: () => void
  onProgramRegistrationSaved?: (program?: Program) => void
  registrationFormVariant?: ProgramRegistrationFormVariant
}

export function GeneralProgramRegistrationFullpageModal(
  props: GeneralProgramRegistrationFullpageModalProps
) {
  const variant = props.registrationFormVariant ?? 'general'
  const inner = <GeneralProgramRegistrationFullpageModalInner {...props} />
  return (
    <RegistrationWizardValidationHighlightProvider
      variant={registrationWizardHighlightVariant(variant)}
    >
      {variant === 'general' ? (
        <GeneralRegistrationWizardFormProvider>
          <RegistrationBusinessPeriodConstraintProvider>
            {inner}
          </RegistrationBusinessPeriodConstraintProvider>
        </GeneralRegistrationWizardFormProvider>
      ) : variant === 'trainedTeachers' ? (
        <TrainedTeachersRegistrationWizardFormProvider>
          <RegistrationBusinessPeriodConstraintProvider>
            {inner}
          </RegistrationBusinessPeriodConstraintProvider>
        </TrainedTeachersRegistrationWizardFormProvider>
      ) : variant === 'economy' ? (
        <CompanySchoolRegistrationWizardFormProvider>
          <RegistrationBusinessPeriodConstraintProvider>
            {inner}
          </RegistrationBusinessPeriodConstraintProvider>
        </CompanySchoolRegistrationWizardFormProvider>
      ) : (
        <RegistrationBusinessPeriodConstraintProvider>
          {inner}
        </RegistrationBusinessPeriodConstraintProvider>
      )}
    </RegistrationWizardValidationHighlightProvider>
  )
}

function GeneralProgramRegistrationFullpageModalInner({
  open,
  onClose,
  onProgramRegistrationSaved,
  registrationFormVariant = 'general',
}: GeneralProgramRegistrationFullpageModalProps) {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const { showAlert } = useCmsAlert()
  const { reportIncomplete } = useRegistrationWizardValidationHighlight()
  const reportValidationIncomplete = useCallback(
    (keys: readonly string[]) => {
      reportIncomplete(keys)
      scrollToFirstRegistrationWizardIncompleteParagraph(
        resolveRegistrationWizardIncompleteParagraphIds(
          keys,
          registrationWizardHighlightVariant(registrationFormVariant)
        )
      )
    },
    [reportIncomplete, registrationFormVariant]
  )

  const [overwriteOpen, setOverwriteOpen] = useState(false)
  const [overwriteTitle, setOverwriteTitle] = useState('')
  const [overwriteSaving, setOverwriteSaving] = useState(false)
  const [draftSaveSuccessOpen, setDraftSaveSuccessOpen] = useState(false)
  const [completeSuccessOpen, setCompleteSuccessOpen] = useState(false)
  const [recruitmentPreviewOpen, setRecruitmentPreviewOpen] = useState(false)
  const [recruitmentPreviewProgram, setRecruitmentPreviewProgram] = useState<Program | null>(null)
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)
  const [devAutofillCaseId, setDevAutofillCaseId] =
    useState<GeneralRegistrationDevAutofillCaseId>(1)
  const [trainedTeachersDevAutofillCaseId, setTrainedTeachersDevAutofillCaseId] =
    useState<TrainedTeachersRegistrationDevAutofillCaseId>(1)
  const [recruitmentPreviewAudience, setRecruitmentPreviewAudience] =
    useState<RecruitmentUserPreviewAudience>('institutions')
  const [recruitmentPreviewTitle, setRecruitmentPreviewTitle] = useState<string | undefined>()
  /** 신청 정보 단계 미리보기 — Platform 「프로그램 신청하기」 화면 (일반 프로그램 등록만) */
  const [applicationPreview, setApplicationPreview] = useState<{
    program: Program
    step: GeneralProgramRegistrationStepKey
    draft: WritingFormDraft
  } | null>(null)
  const pendingCreatedProgramRef = useRef<Program | undefined>(undefined)

  // 안내 팝업에서 「이어서 작성」을 명시한 경우만 복원한다.
  // mode 누락(직접 URL 진입 포함)은 새 폼으로 시작해 저장본이 조용히 노출되지 않게 한다.
  const skipDraftRestore = shouldSkipRegistrationDraftRestore(
    searchParams.get(REGISTRATION_DRAFT_MODE_QUERY_KEY)
  )
  const shouldRemoveSavedDraftAfterCompletion = shouldRemoveRegistrationDraftAfterCompletion(
    searchParams.get(REGISTRATION_DRAFT_MODE_QUERY_KEY)
  )

  // 일반·TT: 브라우저 뒤로/앞으로 가드와 새 작성 시작 단계 정규화. 1사1교·기타는 기존 동작 유지.
  const guardsBrowserHistory =
    registrationFormVariant === 'general' || registrationFormVariant === 'trainedTeachers'

  // 새 작성(fresh·mode 없음)으로 열릴 때 URL 단계가 공통 정보가 아니면(앞으로 가기·직접 진입)
  // 공통 정보 검증을 건너뛰지 않도록 첫 단계로 시작하고 URL도 replace한다. 열릴 때 한 번만 판단한다.
  const rawUrlStep = searchParams.get(GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY)
  const freshOpenStepResetRef = useRef<boolean | null>(null)
  if (!open) {
    freshOpenStepResetRef.current = null
  } else if (freshOpenStepResetRef.current == null) {
    freshOpenStepResetRef.current =
      guardsBrowserHistory &&
      skipDraftRestore &&
      rawUrlStep != null &&
      normalizeGeneralProgramRegistrationStepKey(rawUrlStep) !== 'program'
  } else if (freshOpenStepResetRef.current && rawUrlStep === 'program') {
    freshOpenStepResetRef.current = false
  }
  const forceFreshOpenProgramStep = open && freshOpenStepResetRef.current === true

  const initialStep = useMemo(() => {
    if (forceFreshOpenProgramStep) return 'program'
    return normalizeGeneralProgramRegistrationStepKey(rawUrlStep)
  }, [forceFreshOpenProgramStep, rawUrlStep])

  const syncStepToUrl = useCallback(
    (step: string) => {
      const next = new URLSearchParams(searchParams)
      next.set(GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY, step)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  useEffect(() => {
    if (!open) return
    if (!shouldUseRegistrationCreateFormBindings()) {
      try {
        assertRegistrationWizardRemoteReady()
      } catch {
        showAlert({
          title: '프로그램 등록 불가',
          content:
            '프로그램 등록은 forms-surveys·programs remote API가 활성화된 환경에서만 이용할 수 있습니다.',
          onConfirm: onClose,
        })
      }
      return
    }
    if (searchParams.has(GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY)) return
    const next = new URLSearchParams(searchParams)
    next.set(GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY, 'program')
    setSearchParams(next, { replace: true })
  }, [open, searchParams, setSearchParams])

  useEffect(() => {
    if (!forceFreshOpenProgramStep) return
    const next = new URLSearchParams(searchParams)
    next.set(GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY, 'program')
    setSearchParams(next, { replace: true })
  }, [forceFreshOpenProgramStep, searchParams, setSearchParams])

  useEffect(() => {
    if (open) return
    setOverwriteOpen(false)
    setOverwriteTitle('')
    setOverwriteSaving(false)
    setDraftSaveSuccessOpen(false)
    setCompleteSuccessOpen(false)
    setRecruitmentPreviewOpen(false)
    setRecruitmentPreviewProgram(null)
    setApplicationPreview(null)
    setTemplatePickerOpen(false)
    pendingCreatedProgramRef.current = undefined
  }, [open])

  const handleRegistrationCreated = useCallback(
    (program?: Program) => {
      // 등록 위자드는 mutation onSuccess를 타지 않으므로 목록·위젯을 여기서 무효화한다.
      invalidateProgramListCachesAfterRegistration(queryClient, registrationFormVariant)
      pendingCreatedProgramRef.current = program
      setCompleteSuccessOpen(!hasPendingRegistrationFormApplyFailures())
    },
    [queryClient, registrationFormVariant]
  )

  const recruitmentPreviewSponsorName = useSponsorNameById(recruitmentPreviewProgram?.sponsorId)
  const applicationPreviewSponsorName = useSponsorNameById(applicationPreview?.program.sponsorId)
  const applicationPreviewMessage = useMemo(
    () =>
      applicationPreview
        ? buildApplicationPlatformPreviewMessage({
            ...applicationPreview,
            sponsorName: applicationPreviewSponsorName,
          })
        : null,
    [applicationPreview, applicationPreviewSponsorName]
  )

  const flow = useGeneralProgramRegistrationFlow(open, {
    initialStep,
    onProgramRegistrationSaved: handleRegistrationCreated,
    onStepChange: syncStepToUrl,
    registrationFormVariant,
    skipDraftRestore,
    reportValidationIncomplete,
  })
  useProgramOperationDateErrorFocus(open, focus => {
    const step = registrationStepForOperationDateFocus(
      focus.recruitmentType,
      flow.visibleRecruitTabKeys
    )
    if (step) flow.selectStep(step)
    reportValidationIncomplete(focus.highlightKeys)
  })

  const handleClose = useCallback(() => {
    const next = new URLSearchParams(searchParams)
    next.delete(GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY)
    next.delete(REGISTRATION_DRAFT_MODE_QUERY_KEY)
    next.delete('userPreview')
    setSearchParams(next, { replace: true })
    onClose()
  }, [onClose, searchParams, setSearchParams])

  const wizardProgramType = useMemo(
    () =>
      registrationProgramTypeForTemplateCode(
        flow.registrationTemplateId as ProgramRegistrationDraftTemplateCode
      ),
    [flow.registrationTemplateId]
  )

  const {
    leaveConfirmOpen,
    requestLeave,
    confirmLeave,
    cancelLeave,
    markLeaveBaseline,
  } = useRegistrationWizardLeaveGuard({
    open,
    programType: wizardProgramType,
    getOverlayVersion:
      registrationFormVariant === 'general' ? undefined : getProgramRegistrationOverlayVersion,
    isDirtyOverride: () => true,
    onLeave: handleClose,
  })
  useRegistrationWizardHistoryLeaveGuard(open && guardsBrowserHistory, requestLeave)

  const handlePreview = useCallback(() => {
    if (flow.phase === 'recruitment') {
      setRecruitmentPreviewProgram(flow.registrationVm.buildCurrentProgramSnapshot())
      setRecruitmentPreviewAudience(recruitmentPreviewAudienceFromRegistrationStep(flow.activeStep))
      setRecruitmentPreviewTitle(
        registrationFormVariant === 'general'
          ? generalRegistrationRecruitmentPreviewTitle(flow.activeStep)
          : undefined
      )
      setRecruitmentPreviewOpen(true)
      return
    }
    if (
      flow.phase === 'application' &&
      registrationFormVariant === 'general' &&
      resolveApplicationStepPreviewSpec(flow.activeStep)
    ) {
      setApplicationPreview({
        program: flow.registrationVm.buildCurrentProgramSnapshot(),
        step: flow.activeStep,
        draft: flow.participantVm.draft,
      })
      return
    }
    const next = new URLSearchParams(searchParams)
    next.set('userPreview', TEMPLATE_USER_PREVIEW_ACTIVE)
    setSearchParams(next, { replace: false })
    flow.handlePreview()
  }, [flow, registrationFormVariant, searchParams, setSearchParams])

  const runDraftSave = useCallback(async () => {
    try {
      await flow.persistDraftSilent()
      peekGeneralRegistrationWizardRhf()?.markBaseline()
      peekTrainedTeachersRegistrationRhf()?.markBaseline()
      markLeaveBaseline()
      setDraftSaveSuccessOpen(true)
    } catch (error) {
      console.debug('generalProgramRegistration draft save failed', error)
      showAlert({
        title: '임시 저장 실패',
        content: draftSaveFailureMessage(error),
      })
    }
  }, [flow, markLeaveBaseline, showAlert])

  const handleSaveClick = useCallback(() => {
    const existing = peekRegistrationDraftNotice(
      flow.registrationTemplateId as ProgramRegistrationDraftTemplateCode
    )
    if (existing != null) {
      setOverwriteTitle(existing.title)
      setOverwriteOpen(true)
      return
    }
    void runDraftSave()
  }, [flow.registrationTemplateId, runDraftSave])

  const handleOverwriteConfirm = useCallback(() => {
    void (async () => {
      setOverwriteSaving(true)
      try {
        await flow.persistDraftSilent()
        markLeaveBaseline()
        setOverwriteOpen(false)
        setDraftSaveSuccessOpen(true)
      } catch (error) {
        console.debug('generalProgramRegistration draft overwrite save failed', error)
        showAlert({
          title: '임시 저장 실패',
          content: draftSaveFailureMessage(error),
        })
      } finally {
        setOverwriteSaving(false)
      }
    })()
  }, [flow, markLeaveBaseline, showAlert])

  const handleCompleteSuccessConfirm = useCallback(() => {
    const created = pendingCreatedProgramRef.current
    pendingCreatedProgramRef.current = undefined
    setCompleteSuccessOpen(false)
    const registrationTemplateCode =
      flow.registrationTemplateId as ProgramRegistrationDraftTemplateCode
    // 서버 임시저장 DELETE 없음 — 임시저장은 localStorage 전용.
    // CREATE 후 양식 적용이 일부 실패했으면 재시도할 수 있게 임시저장본을 남긴다.
    if (shouldRemoveSavedDraftAfterCompletion && !hasPendingRegistrationFormApplyFailures()) {
      void clearRegistrationDraftForFreshStart(registrationTemplateCode)
    }
    onProgramRegistrationSaved?.(created)
  }, [
    flow.registrationTemplateId,
    onProgramRegistrationSaved,
    registrationFormVariant,
    shouldRemoveSavedDraftAfterCompletion,
  ])

  /** 공통·모집: 우측 커스텀 필드 숨김. 신청 정보 단계는 유지 */
  const hideCustomFieldNav = flow.phase === 'program' || flow.phase === 'recruitment'
  /** 공통 정보에서만 미리보기 버튼 제거 */
  const showPreview = flow.phase !== 'program'

  const footerActions = useMemo((): TemplateFullpageModalFooterAction[] | undefined => {
    if (flow.phase === 'program') {
      if (flow.hasRecruitmentPhase) {
        return [
          {
            label: '모집 정보 작성하기',
            variant: 'primary',
            showArrow: true,
            onClick: () => flow.goToPhase('recruitment'),
          },
        ]
      }
      if (flow.hasApplicationPhase) {
        return [
          {
            label: '신청 정보 작성하기',
            variant: 'primary',
            showArrow: true,
            onClick: () => flow.goToPhase('application'),
          },
        ]
      }
      return undefined
    }
    if (flow.phase === 'recruitment') {
      const actions: TemplateFullpageModalFooterAction[] = [
        {
          label: '공통 정보 돌아가기',
          variant: 'secondary',
          onClick: () => flow.goToPhase('program'),
        },
      ]
      if (flow.hasApplicationPhase) {
        actions.push({
          label: '신청 정보 작성하기',
          variant: 'primary',
          showArrow: true,
          onClick: () => flow.goToPhase('application'),
        })
      }
      return actions
    }
    if (flow.phase === 'application') {
      const actions: TemplateFullpageModalFooterAction[] = []
      if (flow.hasRecruitmentPhase) {
        actions.push({
          label: '모집 정보 돌아가기',
          variant: 'secondary',
          onClick: () => flow.goToPhase('recruitment'),
        })
      } else {
        actions.push({
          label: '공통 정보 돌아가기',
          variant: 'secondary',
          onClick: () => flow.goToPhase('program'),
        })
      }
      actions.push({
        label: '프로그램 등록 완료',
        variant: 'primary',
        showArrow: false,
        onClick: flow.handleCompleteRegistration,
      })
      return actions
    }
    return undefined
  }, [flow])

  /** 일반 프로그램 등록만 시안 분기(상단 행 고정·단락 테두리·배너 제목·모집/신청 폼 문구). 1사1교·교육받은 교사는 기존 유지 */
  const isGeneralVariant = registrationFormVariant === 'general'

  return (
    <>
      <TemplateFullpageModal
        open={open}
        className={isGeneralVariant ? 'full-page-modal--sticky-body-header' : undefined}
        bodyLoading={flow.isDraftLoading}
        scrollResetKey={flow.activeStep}
        onClose={requestLeave}
        title={
          registrationFormVariant === 'economy'
            ? COMPANY_SCHOOL_REGISTRATION_MODAL_TITLE
            : registrationFormVariant === 'trainedTeachers'
              ? TRAINED_TEACHERS_REGISTRATION_MODAL_TITLE
              : GENERAL_REGISTRATION_MODAL_TITLE
        }
        titleReadOnly
        templateTabType="writing"
        registrationUserMode
        showCloseButton
        onPreview={handlePreview}
        showPreview={showPreview}
        onSave={handleSaveClick}
        bodyHeaderLeading={
          <GeneralProgramRegistrationBodyHeader
            activeStep={flow.activeStep}
            visibleRecruitTabKeys={flow.visibleRecruitTabKeys}
            visibleApplicationTabKeys={flow.visibleApplicationTabKeys}
            programPhaseHint={
              isGeneralVariant ? GENERAL_PROGRAM_REGISTRATION_PROGRAM_PHASE_HINT_GENERAL : undefined
            }
            onSelectStep={key => {
              setTemplatePickerOpen(false)
              flow.selectStep(key)
            }}
          />
        }
        bodyHeaderBelow={
          flow.phase === 'program' ? undefined : (
            <RegistrationStepTemplateChrome
              templateName={flow.stepTemplateName}
              isDefault={flow.isDefaultStepTemplate}
              category={flow.phase === 'application' ? 'application_form' : 'application'}
              allowedFamilyBaseTemplateCode={flow.currentStepDef.templateId}
              showTitle={isGeneralVariant}
              pickerOpen={templatePickerOpen}
              onOpenPicker={() => setTemplatePickerOpen(true)}
              onClosePicker={() => setTemplatePickerOpen(false)}
              onUseTemplate={row => {
                void flow.selectStepTemplate(row).then(() => setTemplatePickerOpen(false))
              }}
            />
          )
        }
        headerActionsLeading={
          registrationFormVariant === 'general' ? (
            <RegistrationGeneralDevAutofillToolbar
              caseId={devAutofillCaseId}
              onCaseIdChange={setDevAutofillCaseId}
              onAutofill={caseId => flow.registrationVm.applyDevAutofill(caseId)}
            />
          ) : registrationFormVariant === 'trainedTeachers' ? (
            <TrainedTeachersDevAutofillToolbar
              caseId={trainedTeachersDevAutofillCaseId}
              onCaseIdChange={setTrainedTeachersDevAutofillCaseId}
              onAutofill={caseId => flow.registrationVm.applyDevAutofill(caseId)}
            />
          ) : (
            <RegistrationDevAutofillButton
              onClick={() => void flow.registrationVm.applyDevAutofill()}
            />
          )
        }
        footerActions={footerActions}
        leftContent={
          <GeneralRegistrationWizardContext.Provider value={isGeneralVariant}>
            <HideParagraphSelectionChromeContext.Provider
              key={`${flow.selectedTemplateCode}::${flow.wizardDraftRevision}`}
              value={flow.phase !== 'application'}
            >
              <ShowParagraphActiveOutlineContext.Provider value={isGeneralVariant}>
                {flow.panels.leftContent}
              </ShowParagraphActiveOutlineContext.Provider>
            </HideParagraphSelectionChromeContext.Provider>
          </GeneralRegistrationWizardContext.Provider>
        }
        rightNavigation={hideCustomFieldNav ? null : flow.panels.rightNavigation}
      />
      <RegistrationWizardLeaveConfirmModal
        open={leaveConfirmOpen}
        onConfirm={confirmLeave}
        onCancel={cancelLeave}
      />
      <RegistrationDraftOverwriteConfirmModal
        open={overwriteOpen}
        draftTitle={overwriteTitle}
        confirmLoading={overwriteSaving}
        onCancel={() => {
          if (overwriteSaving) return
          setOverwriteOpen(false)
        }}
        onConfirm={handleOverwriteConfirm}
      />
      <RegistrationDraftSaveSuccessModal
        open={draftSaveSuccessOpen}
        onConfirm={() => setDraftSaveSuccessOpen(false)}
      />
      <RegistrationCompleteSuccessModal
        open={completeSuccessOpen}
        onConfirm={handleCompleteSuccessConfirm}
      />
      {recruitmentPreviewProgram ? (
        <ParticipantRecruitmentPreviewModal
          open={recruitmentPreviewOpen}
          onClose={() => {
            setRecruitmentPreviewOpen(false)
            setRecruitmentPreviewProgram(null)
          }}
          program={recruitmentPreviewProgram}
          sponsorName={recruitmentPreviewSponsorName}
          audience={recruitmentPreviewAudience}
          title={recruitmentPreviewTitle}
        />
      ) : null}
      {applicationPreview ? (
        <PlatformPreviewModal
          open
          onClose={() => setApplicationPreview(null)}
          title={resolveApplicationStepPreviewSpec(applicationPreview.step)?.title ?? '신청 정보 미리보기'}
          message={applicationPreviewMessage}
        />
      ) : null}
    </>
  )
}
