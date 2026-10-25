import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
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
import {
  UJAT_PROGRAM_REGISTRATION_FLOW_QUERY_KEY,
  normalizeUjatProgramRegistrationStepKey,
  recruitmentPreviewAudienceFromUjatRegistrationStep,
} from '@/features/program/ujat/model/ujat-program-registration-flow'
import {
  ParticipantRecruitmentPreviewModal,
  type RecruitmentUserPreviewAudience,
} from '@/features/program/general/ui/detail-modal/info/participant-recruitment-preview-modal'
import { useUjatProgramRegistrationFlow } from '@/features/program/ujat/hooks/use-ujat-program-registration-flow'
import { UjatProgramRegistrationBodyHeader } from '@/features/program/ujat/ui/registration/ujat-program-registration-body-header'
import { RegistrationStepTemplateChrome } from '@/features/program/shared/ui/registration/step-template-banner'
import { HideParagraphSelectionChromeContext } from '@/features/template/context/paragraph-selection-chrome-context'
import type { Program } from '@/types/domain'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { deleteRegistrationProgramDraftRemote } from '@/features/program/general/lib/registration-program-draft-session'
import {
  clearRegistrationDraftForFreshStart,
  peekRegistrationDraftNotice,
  PROGRAM_REGISTRATION_UJAT_TEMPLATE_CODE,
  REGISTRATION_DRAFT_MODE_QUERY_KEY,
  shouldRemoveRegistrationDraftAfterCompletion,
  shouldSkipRegistrationDraftRestore,
} from '@/features/program/shared/lib/registration-draft-notice'
import { RegistrationDraftOverwriteConfirmModal } from '@/features/program/shared/ui/registration/draft-overwrite-confirm-modal'
import { RegistrationDraftSaveSuccessModal } from '@/features/program/shared/ui/registration/draft-save-success-modal'
import { invalidateUjatProgramListCaches } from '@/features/program/shared/lib/invalidate-program-list-caches-after-registration'
import { RegistrationCompleteSuccessModal } from '@/features/program/shared/ui/registration/registration-complete-success-modal'
import { UjatDevAutofillToolbar } from '@/features/program/ujat/ui/registration/dev-autofill-toolbar'
import {
  resolveUjatDevAutofillDefaultBusinessYear,
  UJAT_DEV_AUTOFILL_DEFAULT_CASE_ID,
  type UjatDevAutofillCaseId,
} from '@/features/program/ujat/lib/dev-autofill-cases'
import { UjatRegistrationRequiredFieldsIncompleteError } from '@/features/program/ujat/lib/ujat-program-registration-required-fields'
import { isLocalStorageQuotaExceededError } from '@/features/template/lib/writing-form-template-local-save'
import { useSponsorNameById } from '@/features/sponsor/hooks/use-sponsor-name-by-id'
import { getUjatProgramRegistrationOverlayVersion } from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import { useRegistrationWizardLeaveGuard } from '@/features/program/shared/lib/registration-wizard-leave-guard'
import { RegistrationWizardLeaveConfirmModal } from '@/features/program/shared/ui/registration/registration-wizard-leave-confirm-modal'

const UJAT_REGISTRATION_MODAL_TITLE = 'UJAT 프로그램 등록'

const DRAFT_SAVE_FAILURE_QUOTA_MESSAGE =
  '임시 저장에 실패했습니다.\n브라우저 저장 공간을 확인한 뒤 다시 시도해 주세요.'
const DRAFT_SAVE_FAILURE_GENERIC_MESSAGE =
  '임시 저장에 실패했습니다.\n잠시 후 다시 시도해 주세요.'

function draftSaveFailureMessage(error: unknown): string {
  return isLocalStorageQuotaExceededError(error)
    ? DRAFT_SAVE_FAILURE_QUOTA_MESSAGE
    : DRAFT_SAVE_FAILURE_GENERIC_MESSAGE
}

export type UjatProgramRegistrationFullpageModalProps = {
  open: boolean
  onClose: () => void
  onProgramRegistrationSaved?: (program: Program) => void
}

export function UjatProgramRegistrationFullpageModal(props: UjatProgramRegistrationFullpageModalProps) {
  return (
    <RegistrationWizardValidationHighlightProvider variant="ujat">
      <UjatProgramRegistrationFullpageModalInner {...props} />
    </RegistrationWizardValidationHighlightProvider>
  )
}

function UjatProgramRegistrationFullpageModalInner({
  open,
  onClose,
  onProgramRegistrationSaved,
}: UjatProgramRegistrationFullpageModalProps) {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const { showAlert } = useCmsAlert()
  const { reportIncomplete } = useRegistrationWizardValidationHighlight()
  const reportValidationIncomplete = useCallback((keys: readonly string[]) => {
    reportIncomplete(keys)
    scrollToFirstRegistrationWizardIncompleteParagraph(
      resolveRegistrationWizardIncompleteParagraphIds(keys, 'ujat')
    )
  }, [reportIncomplete])

  const [overwriteOpen, setOverwriteOpen] = useState(false)
  const [overwriteTitle, setOverwriteTitle] = useState('')
  const [overwriteSaving, setOverwriteSaving] = useState(false)
  const [draftSaveSuccessOpen, setDraftSaveSuccessOpen] = useState(false)
  const [completeSuccessOpen, setCompleteSuccessOpen] = useState(false)
  const [recruitmentPreviewOpen, setRecruitmentPreviewOpen] = useState(false)
  const [recruitmentPreviewProgram, setRecruitmentPreviewProgram] = useState<Program | null>(null)
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)
  const [devAutofillCaseId, setDevAutofillCaseId] = useState<UjatDevAutofillCaseId>(
    UJAT_DEV_AUTOFILL_DEFAULT_CASE_ID
  )
  const [devAutofillBusinessYear] = useState(() => resolveUjatDevAutofillDefaultBusinessYear())
  const [recruitmentPreviewAudience, setRecruitmentPreviewAudience] =
    useState<RecruitmentUserPreviewAudience>('institutions')
  const pendingCreatedProgramRef = useRef<Program | undefined>(undefined)

  // 안내 팝업에서 「이어서 작성」을 명시한 경우만 저장본을 복원한다.
  const skipDraftRestore = shouldSkipRegistrationDraftRestore(
    searchParams.get(REGISTRATION_DRAFT_MODE_QUERY_KEY)
  )
  const shouldRemoveSavedDraftAfterCompletion =
    shouldRemoveRegistrationDraftAfterCompletion(
      searchParams.get(REGISTRATION_DRAFT_MODE_QUERY_KEY)
    )

  const initialStep = useMemo(() => {
    const raw = searchParams.get(UJAT_PROGRAM_REGISTRATION_FLOW_QUERY_KEY)
    if (raw == null) return undefined
    return normalizeUjatProgramRegistrationStepKey(raw)
  }, [searchParams])

  const syncStepToUrl = useCallback(
    (step: string) => {
      const next = new URLSearchParams(searchParams)
      next.set(UJAT_PROGRAM_REGISTRATION_FLOW_QUERY_KEY, step)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  useEffect(() => {
    if (!open) return
    if (searchParams.has(UJAT_PROGRAM_REGISTRATION_FLOW_QUERY_KEY)) return
    if (!skipDraftRestore) return
    const next = new URLSearchParams(searchParams)
    next.set(UJAT_PROGRAM_REGISTRATION_FLOW_QUERY_KEY, 'program')
    setSearchParams(next, { replace: true })
  }, [open, searchParams, setSearchParams, skipDraftRestore])

  useEffect(() => {
    if (open) return
    setOverwriteOpen(false)
    setOverwriteTitle('')
    setOverwriteSaving(false)
    setDraftSaveSuccessOpen(false)
    setCompleteSuccessOpen(false)
    setRecruitmentPreviewOpen(false)
    setRecruitmentPreviewProgram(null)
    setTemplatePickerOpen(false)
    pendingCreatedProgramRef.current = undefined
  }, [open])

  const handleRegistrationCreated = useCallback(
    (program: Program) => {
      invalidateUjatProgramListCaches(queryClient)
      pendingCreatedProgramRef.current = program
      setCompleteSuccessOpen(true)
    },
    [queryClient]
  )

  const recruitmentPreviewSponsorName = useSponsorNameById(recruitmentPreviewProgram?.sponsorId)

  const flow = useUjatProgramRegistrationFlow(open, {
    initialStep,
    onProgramRegistrationSaved: handleRegistrationCreated,
    onStepChange: syncStepToUrl,
    skipDraftRestore,
    reportValidationIncomplete,
  })

  const handleCompleteSuccessConfirm = useCallback(() => {
    const created = pendingCreatedProgramRef.current
    pendingCreatedProgramRef.current = undefined
    setCompleteSuccessOpen(false)
    void deleteRegistrationProgramDraftRemote('UJAT')
    if (shouldRemoveSavedDraftAfterCompletion) {
      void clearRegistrationDraftForFreshStart(PROGRAM_REGISTRATION_UJAT_TEMPLATE_CODE)
    }
    if (created != null) {
      onProgramRegistrationSaved?.(created)
    }
  }, [onProgramRegistrationSaved, shouldRemoveSavedDraftAfterCompletion])

  const handleClose = useCallback(() => {
    const next = new URLSearchParams(searchParams)
    next.delete(UJAT_PROGRAM_REGISTRATION_FLOW_QUERY_KEY)
    next.delete(REGISTRATION_DRAFT_MODE_QUERY_KEY)
    next.delete('userPreview')
    setSearchParams(next, { replace: true })
    onClose()
  }, [onClose, searchParams, setSearchParams])

  const {
    leaveConfirmOpen,
    requestLeave,
    confirmLeave,
    cancelLeave,
    markLeaveBaseline,
  } = useRegistrationWizardLeaveGuard({
    open,
    programType: 'UJAT',
    getOverlayVersion: getUjatProgramRegistrationOverlayVersion,
    onLeave: handleClose,
  })

  const handlePreview = useCallback(() => {
    if (flow.phase === 'recruitment') {
      if (flow.recruitmentPreviewProgram == null) return
      setRecruitmentPreviewProgram(flow.recruitmentPreviewProgram)
      setRecruitmentPreviewAudience(
        recruitmentPreviewAudienceFromUjatRegistrationStep(flow.activeStep)
      )
      setRecruitmentPreviewOpen(true)
      return
    }
    const next = new URLSearchParams(searchParams)
    next.set('userPreview', TEMPLATE_USER_PREVIEW_ACTIVE)
    setSearchParams(next, { replace: false })
    flow.handlePreview()
  }, [flow, searchParams, setSearchParams])

  const runDraftSave = useCallback(async () => {
    try {
      await flow.persistDraftSilent()
      markLeaveBaseline()
      setDraftSaveSuccessOpen(true)
    } catch (error) {
      console.debug('ujatProgramRegistration draft save failed', error)
      showAlert({
        title: '임시 저장 실패',
        content: draftSaveFailureMessage(error),
      })
    }
  }, [flow, markLeaveBaseline, showAlert])

  const handleSaveClick = useCallback(() => {
    const existing = peekRegistrationDraftNotice(PROGRAM_REGISTRATION_UJAT_TEMPLATE_CODE)
    if (existing != null) {
      setOverwriteTitle(existing.title)
      setOverwriteOpen(true)
      return
    }
    void runDraftSave()
  }, [runDraftSave])

  const handleOverwriteConfirm = useCallback(() => {
    void (async () => {
      setOverwriteSaving(true)
      try {
        await flow.persistDraftSilent()
        markLeaveBaseline()
        setOverwriteOpen(false)
        setDraftSaveSuccessOpen(true)
      } catch (error) {
        console.debug('ujatProgramRegistration draft overwrite save failed', error)
        showAlert({
          title: '임시 저장 실패',
          content: draftSaveFailureMessage(error),
        })
      } finally {
        setOverwriteSaving(false)
      }
    })()
  }, [flow, markLeaveBaseline, showAlert])

  const footerActions = useMemo((): TemplateFullpageModalFooterAction[] | undefined => {
    if (flow.phase === 'program') {
      return [
        {
          label: '모집 정보 작성하기',
          variant: 'primary',
          showArrow: true,
          onClick: () => flow.goToPhase('recruitment'),
        },
      ]
    }
    if (flow.phase === 'recruitment') {
      return [
        {
          label: '공통 정보 돌아가기',
          variant: 'secondary',
          onClick: () => flow.goToPhase('program'),
        },
        {
          label: '신청 정보 작성하기',
          variant: 'primary',
          showArrow: true,
          onClick: () => flow.goToPhase('application'),
        },
      ]
    }
    if (flow.phase === 'application') {
      return [
        {
          label: '모집 정보 돌아가기',
          variant: 'secondary',
          onClick: () => flow.goToPhase('recruitment'),
        },
        {
          label: '프로그램 등록 완료',
          variant: 'primary',
          showArrow: false,
          disabled: flow.isCompletingRegistration,
          onClick: () => {
            void flow.handleCompleteRegistration().catch(error => {
              if (error instanceof UjatRegistrationRequiredFieldsIncompleteError) return
              console.debug('UJAT program registration completion failed', error)
              showAlert({
                title: '프로그램 등록 실패',
                content: '입력 내용은 유지됩니다. 잠시 후 다시 시도해 주세요.',
              })
            })
          },
        },
      ]
    }
    return undefined
  }, [flow, showAlert])

  return (
    <>
      <TemplateFullpageModal
        open={open}
        bodyLoading={flow.isDraftLoading}
        scrollResetKey={flow.activeStep}
        onClose={requestLeave}
        title={UJAT_REGISTRATION_MODAL_TITLE}
        titleReadOnly
        templateTabType="writing"
        registrationUserMode
        showCloseButton
        onPreview={handlePreview}
        showPreview={flow.phase !== 'program'}
        onSave={handleSaveClick}
        bodyHeaderLeading={
          <UjatProgramRegistrationBodyHeader
            activeStep={flow.activeStep}
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
          <UjatDevAutofillToolbar
            caseId={devAutofillCaseId}
            businessYear={devAutofillBusinessYear}
            onCaseIdChange={setDevAutofillCaseId}
          />
        }
        footerActions={footerActions}
        leftContent={
          <HideParagraphSelectionChromeContext.Provider
            // 상·하반기는 같은 모집 템플릿을 사용하지만 서로 다른 RHF/overlay
            // 범위를 가진다. 단계 키까지 포함해야 탭 왕복 시 이전 반기의 Form
            // 인스턴스를 재사용하지 않고 현재 반기 값으로 재수화한다.
            key={`${flow.activeStep}::${flow.selectedTemplateCode}::${flow.wizardDraftRevision}`}
            value
          >
            {flow.panels.leftContent}
          </HideParagraphSelectionChromeContext.Provider>
        }
        rightNavigation={flow.phase === 'application' ? flow.panels.rightNavigation : null}
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
          programKind="ujat"
        />
      ) : null}
    </>
  )
}
