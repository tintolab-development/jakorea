import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { RegistrationDevAutofillButton } from '@/features/program/shared/ui/registration/registration-dev-autofill-button'
import { TemplateFullpageModal } from '@/features/template/ui/template-management/template-fullpage-modal'
import { useCmsAlert } from '@/shared/ui'
import {
  buildRequiredFieldsIncompleteAlertContent,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'
import {
  RegistrationWizardValidationHighlightProvider,
  useRegistrationWizardValidationHighlight,
} from '@/features/program/shared/ui/registration/registration-wizard-validation-highlight'
import { listGeminiRecruitmentInstitutionMissingFields } from '../../lib/recruitment/snapshot-from-overlay'
import { beginBlockingOverlay } from '@/shared/ui/blocking-overlay-store'
import {
  REGISTRATION_DRAFT_MODE_QUERY_KEY,
  shouldRemoveRegistrationDraftAfterCompletion,
  shouldSkipRegistrationDraftRestore,
} from '@/features/program/shared/lib/registration-draft-notice'
import { RegistrationDraftSaveSuccessModal } from '@/features/program/shared/ui/registration/draft-save-success-modal'
import { RegistrationDraftOverwriteConfirmModal } from '@/features/program/shared/ui/registration/draft-overwrite-confirm-modal'
import { RegistrationCompleteSuccessModal } from '@/features/program/shared/ui/registration/registration-complete-success-modal'
import { invalidateGeminiRecruitmentListCaches } from '@/features/program/shared/lib/invalidate-program-list-caches-after-registration'
import { geminiVisitingTrainingQueryKeys } from '../../api/visiting-training/query-keys'
import { geminiRecruitmentService } from '../../api/recruitment-service'
import { useGeminiRecruitmentAddTemplateFlow } from '../../hooks/use-recruitment-add-template-flow'
import { formatGeminiRecruitmentRegisterError } from '../../lib/recruitment/mutation-error'
import {
  peekGeminiRecruitmentAddDraftOverwrite,
  persistGeminiRecruitmentAddDraft,
  removeGeminiRecruitmentAddDraft,
} from '../../lib/recruitment/add-local-save'
import { GEMINI_RECRUITMENT_DEFAULT_TEMPLATE_CODE } from '../../lib/recruitment/add-template'
import { GEMINI_RECRUITMENT_ADD_PARAM } from '../../lib/recruitment/add-url'
import {
  GEMINI_RECRUITMENT_ID_PARAM,
  GEMINI_RECRUITMENT_LNB_PARAM,
} from '../../lib/recruitment/detail-url'
import { GeminiRecruitmentAddCloseConfirmModal } from './add-close-confirm-modal'
import { GeminiRecruitmentAddPreviewModal } from './add-preview-modal'
import { HideParagraphSelectionChromeContext } from '@/features/template/context/paragraph-selection-chrome-context'
import { RegistrationStepTemplateChrome } from '@/features/program/shared/ui/registration/step-template-banner'
import '@/features/template/ui/template-management/template-fullpage-modal.css'
import '@/features/template/ui/modal/template-preview-modal.css'
import './add-fullpage-modal.css'

const ADD_MODAL_TITLE = '찾아가는 연수 모집 공고 추가'

/** 임시 저장은 브라우저 localStorage에만 둔다 — 프로그램 유형 공통 (서버 API 호출 없음) */
const GEMINI_DRAFT_SAVE_FAILURE_MESSAGE =
  '임시 저장에 실패했습니다.\n브라우저 저장 공간을 확인한 뒤 다시 시도해 주세요.'

type GeminiRecruitmentAddFullpageModalProps = {
  open: boolean
  onClose: () => void
}

/** QA-0390: 등록 시 누락 항목 입력란 강조(일반 프로그램 등록과 같은 Provider) */
export function GeminiRecruitmentAddFullpageModal(props: GeminiRecruitmentAddFullpageModalProps) {
  return (
    <RegistrationWizardValidationHighlightProvider variant="general">
      <GeminiRecruitmentAddFullpageModalInner {...props} />
    </RegistrationWizardValidationHighlightProvider>
  )
}

function GeminiRecruitmentAddFullpageModalInner({
  open,
  onClose,
}: GeminiRecruitmentAddFullpageModalProps) {
  const { showAlert } = useCmsAlert()
  const { reportIncomplete, clearHighlight } = useRegistrationWizardValidationHighlight()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const draftMode = searchParams.get(REGISTRATION_DRAFT_MODE_QUERY_KEY)
  const skipDraftRestore = shouldSkipRegistrationDraftRestore(draftMode)
  const shouldRemoveSavedDraftAfterCompletion =
    shouldRemoveRegistrationDraftAfterCompletion(draftMode)

  const form = useGeminiRecruitmentAddTemplateFlow(open, { skipDraftRestore })
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSnapshot, setPreviewSnapshot] = useState<ReturnType<
    typeof form.buildSaveSnapshot
  > | null>(null)
  const pendingDetailIdRef = useRef<string | null>(null)
  const [draftSaveSuccessOpen, setDraftSaveSuccessOpen] = useState(false)
  const [overwriteOpen, setOverwriteOpen] = useState(false)
  const [overwriteTitle, setOverwriteTitle] = useState('')
  const [completeSuccessOpen, setCompleteSuccessOpen] = useState(false)

  useEffect(() => {
    if (open) return
    setTemplatePickerOpen(false)
    setDraftSaveSuccessOpen(false)
    setCompleteSuccessOpen(false)
    setOverwriteOpen(false)
    pendingDetailIdRef.current = null
  }, [open])

  const runDraftSave = useCallback((): boolean => {
    if (form.isDraftLoading) return false
    const saved = persistGeminiRecruitmentAddDraft(form.buildSaveSnapshot())
    if (!saved) {
      showAlert({ title: '임시 저장 실패', content: GEMINI_DRAFT_SAVE_FAILURE_MESSAGE })
      return false
    }
    form.markSavedBaseline()
    setDraftSaveSuccessOpen(true)
    return true
  }, [form, showAlert])

  const handleDraftSave = useCallback(() => {
    if (form.isDraftLoading) return
    const existing = peekGeminiRecruitmentAddDraftOverwrite()
    if (existing != null) {
      setOverwriteTitle(existing.title)
      setOverwriteOpen(true)
      return
    }
    runDraftSave()
  }, [form.isDraftLoading, runDraftSave])

  const handleOverwriteConfirm = useCallback(() => {
    if (runDraftSave()) setOverwriteOpen(false)
  }, [runDraftSave])

  const handleRegister = useCallback(async () => {
    if (form.isDraftLoading) return
    const snapshot = form.buildSaveSnapshot()
    // QA-0390: 버튼을 막아 두지 않고, 누르면 빠진 항목을 알리고 입력란을 강조한다
    const missing = listGeminiRecruitmentInstitutionMissingFields(snapshot)
    if (missing.length > 0 || !form.isRegisterReady) {
      reportIncomplete(missing.map(field => field.key))
      showAlert({
        title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
        content: buildRequiredFieldsIncompleteAlertContent(missing.map(field => field.label)),
      })
      return
    }
    clearHighlight()
    const endOverlay = beginBlockingOverlay()
    try {
      const created = await geminiRecruitmentService.register(snapshot)
      if (created.id && created.detail) {
        queryClient.setQueryData(
          geminiVisitingTrainingQueryKeys.recruitmentDetail(created.id),
          created.detail
        )
      }
      pendingDetailIdRef.current = created.id?.trim() || null
      // 이어서 작성한 저장본만 등록 성공 후 지운다 (일반·UJAT와 같은 규칙)
      if (shouldRemoveSavedDraftAfterCompletion) removeGeminiRecruitmentAddDraft()
      invalidateGeminiRecruitmentListCaches(queryClient)
      setCompleteSuccessOpen(true)
    } catch (error) {
      showAlert({
        title: '안내',
        content: formatGeminiRecruitmentRegisterError(error),
      })
    } finally {
      endOverlay()
    }
  }, [
    clearHighlight,
    form,
    queryClient,
    reportIncomplete,
    shouldRemoveSavedDraftAfterCompletion,
    showAlert,
  ])

  const handleCompleteSuccessConfirm = useCallback(() => {
    const createdId = pendingDetailIdRef.current
    pendingDetailIdRef.current = null
    setCompleteSuccessOpen(false)
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.delete(GEMINI_RECRUITMENT_ADD_PARAM)
        next.delete(REGISTRATION_DRAFT_MODE_QUERY_KEY)
        if (createdId) {
          next.set(GEMINI_RECRUITMENT_ID_PARAM, createdId)
          next.delete(GEMINI_RECRUITMENT_LNB_PARAM)
        }
        return next
      },
      { replace: true }
    )
  }, [setSearchParams])

  const handleRequestClose = useCallback(() => {
    setCloseConfirmOpen(true)
  }, [])

  const handleConfirmClose = useCallback(() => {
    setCloseConfirmOpen(false)
    onClose()
  }, [onClose])

  const handlePreview = useCallback(() => {
    if (form.isDraftLoading) return
    setPreviewSnapshot(form.buildSaveSnapshot())
    setPreviewOpen(true)
  }, [form])

  return (
    <>
      <TemplateFullpageModal
        className="gemini-recruitment-add-fullpage-modal template-preview-modal--form-layout"
        open={open}
        onClose={handleRequestClose}
        title={ADD_MODAL_TITLE}
        titleReadOnly
        templateTabType="writing"
        registrationUserMode
        onPreview={handlePreview}
        onSave={handleDraftSave}
        bodyLoading={form.isDraftLoading}
        bodyHeaderBelow={
          <RegistrationStepTemplateChrome
            templateName={form.stepTemplateName}
            isDefault={form.isDefaultStepTemplate}
            category="application"
            familyBaseTemplateCode={GEMINI_RECRUITMENT_DEFAULT_TEMPLATE_CODE}
            allowedFamilyBaseTemplateCode={GEMINI_RECRUITMENT_DEFAULT_TEMPLATE_CODE}
            pickerOpen={templatePickerOpen}
            onOpenPicker={() => setTemplatePickerOpen(true)}
            onClosePicker={() => setTemplatePickerOpen(false)}
            onUseTemplate={row => {
              void form.selectStepTemplate(row).then(() => setTemplatePickerOpen(false))
            }}
          />
        }
        headerActionsLeading={
          <RegistrationDevAutofillButton onClick={() => form.applyDevAutofill()} />
        }
        leftContent={
          <HideParagraphSelectionChromeContext.Provider
            key={`${form.selectedTemplateCode}::${form.wizardDraftRevision}`}
            value
          >
            {form.panels.leftContent}
          </HideParagraphSelectionChromeContext.Provider>
        }
        rightNavigation={null}
        footerAction={{
          label: '프로그램 등록 완료',
          disabled: form.isDraftLoading,
          onClick: handleRegister,
        }}
      />
      <RegistrationDraftSaveSuccessModal
        open={draftSaveSuccessOpen}
        onConfirm={() => setDraftSaveSuccessOpen(false)}
      />
      <RegistrationDraftOverwriteConfirmModal
        open={overwriteOpen}
        draftTitle={overwriteTitle}
        onCancel={() => setOverwriteOpen(false)}
        onConfirm={handleOverwriteConfirm}
      />
      <RegistrationCompleteSuccessModal
        open={completeSuccessOpen}
        onConfirm={handleCompleteSuccessConfirm}
      />
      <GeminiRecruitmentAddCloseConfirmModal
        open={closeConfirmOpen}
        onConfirm={handleConfirmClose}
        onCancel={() => setCloseConfirmOpen(false)}
      />
      <GeminiRecruitmentAddPreviewModal
        open={previewOpen}
        snapshot={previewSnapshot}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  )
}

export { useGeminiRecruitmentAddUrl } from './recruitment-add-url'
