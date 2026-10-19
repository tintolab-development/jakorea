import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { RegistrationDevAutofillButton } from '@/features/program/shared/ui/registration/registration-dev-autofill-button'
import { TemplateFullpageModal } from '@/features/template/ui/template-management/template-fullpage-modal'
import { useCmsAlert } from '@/shared/ui'
import { beginBlockingOverlay } from '@/shared/ui/blocking-overlay-store'
import {
  REGISTRATION_DRAFT_MODE_QUERY_KEY,
  shouldSkipRegistrationDraftRestore,
} from '@/features/program/shared/lib/registration-draft-notice'
import { RegistrationDraftOverwriteConfirmModal } from '@/features/program/shared/ui/registration/draft-overwrite-confirm-modal'
import { RegistrationDraftSaveSuccessModal } from '@/features/program/shared/ui/registration/draft-save-success-modal'
import { RegistrationCompleteSuccessModal } from '@/features/program/shared/ui/registration/registration-complete-success-modal'
import { invalidateGeminiRecruitmentListCaches } from '@/features/program/shared/lib/invalidate-program-list-caches-after-registration'
import { geminiRecruitmentService } from '../../api/recruitment-service'
import { useGeminiRecruitmentAddTemplateFlow } from '../../hooks/use-recruitment-add-template-flow'
import {
  peekGeminiRecruitmentAddDraftOverwrite,
  persistGeminiRecruitmentAddDraft,
  removeGeminiRecruitmentAddDraft,
} from '../../lib/recruitment/add-local-save'
import { GEMINI_RECRUITMENT_DEFAULT_TEMPLATE_CODE } from '../../lib/recruitment/add-template'
import { GeminiRecruitmentAddCloseConfirmModal } from './add-close-confirm-modal'
import { GeminiRecruitmentAddPreviewModal } from './add-preview-modal'
import { HideParagraphSelectionChromeContext } from '@/features/template/context/paragraph-selection-chrome-context'
import { RegistrationStepTemplateChrome } from '@/features/program/shared/ui/registration/step-template-banner'
import '@/features/template/ui/template-management/template-fullpage-modal.css'
import '@/features/template/ui/modal/template-preview-modal.css'
import './add-fullpage-modal.css'

const ADD_MODAL_TITLE = '찾아가는 연수 모집 공고 추가'

const DRAFT_SAVE_FAILURE_MESSAGE =
  '임시 저장에 실패했습니다.\n브라우저 저장 공간을 확인한 뒤 다시 시도해 주세요.'

export function GeminiRecruitmentAddFullpageModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { showAlert } = useCmsAlert()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const skipDraftRestore = shouldSkipRegistrationDraftRestore(
    searchParams.get(REGISTRATION_DRAFT_MODE_QUERY_KEY)
  )

  const form = useGeminiRecruitmentAddTemplateFlow(open, { skipDraftRestore })
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSnapshot, setPreviewSnapshot] = useState<ReturnType<
    typeof form.buildSaveSnapshot
  > | null>(null)
  const [overwriteOpen, setOverwriteOpen] = useState(false)
  const [overwriteTitle, setOverwriteTitle] = useState('')
  const [overwriteSaving, setOverwriteSaving] = useState(false)
  const [draftSaveSuccessOpen, setDraftSaveSuccessOpen] = useState(false)
  const [completeSuccessOpen, setCompleteSuccessOpen] = useState(false)

  useEffect(() => {
    if (open) return
    setTemplatePickerOpen(false)
    setOverwriteOpen(false)
    setOverwriteTitle('')
    setOverwriteSaving(false)
    setDraftSaveSuccessOpen(false)
    setCompleteSuccessOpen(false)
  }, [open])

  const runDraftSave = useCallback(() => {
    if (form.isDraftLoading) return
    const snapshot = form.buildSaveSnapshot()
    const ok = persistGeminiRecruitmentAddDraft(snapshot)
    if (!ok) {
      showAlert({
        title: '임시 저장 실패',
        content: DRAFT_SAVE_FAILURE_MESSAGE,
      })
      return
    }
    form.markSavedBaseline()
    setDraftSaveSuccessOpen(true)
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
    setOverwriteSaving(true)
    try {
      runDraftSave()
      setOverwriteOpen(false)
    } finally {
      setOverwriteSaving(false)
    }
  }, [runDraftSave])

  const handleRegister = useCallback(async () => {
    if (form.isDraftLoading || !form.isRegisterReady) return
    const snapshot = form.buildSaveSnapshot()
    const endOverlay = beginBlockingOverlay()
    try {
      await geminiRecruitmentService.register(snapshot)
      removeGeminiRecruitmentAddDraft()
      invalidateGeminiRecruitmentListCaches(queryClient)
      setCompleteSuccessOpen(true)
    } catch {
      showAlert({
        title: '안내',
        content: '모집 공고 등록에 실패했습니다.\n입력값과 서버 상태를 확인한 뒤 다시 시도해 주세요.',
      })
    } finally {
      endOverlay()
    }
  }, [form, queryClient, showAlert])

  const handleCompleteSuccessConfirm = useCallback(() => {
    setCompleteSuccessOpen(false)
    onClose()
  }, [onClose])

  const handleRequestClose = useCallback(() => {
    if (form.isDirty) {
      setCloseConfirmOpen(true)
      return
    }
    onClose()
  }, [form.isDirty, onClose])

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
          disabled: !form.isRegisterReady,
          onClick: handleRegister,
        }}
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
