import { useCallback, useEffect, useRef, useState } from 'react'
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
import { RegistrationDraftSaveSuccessModal } from '@/features/program/shared/ui/registration/draft-save-success-modal'
import { RegistrationCompleteSuccessModal } from '@/features/program/shared/ui/registration/registration-complete-success-modal'
import { invalidateGeminiRecruitmentListCaches } from '@/features/program/shared/lib/invalidate-program-list-caches-after-registration'
import { geminiVisitingTrainingQueryKeys } from '../../api/visiting-training/query-keys'
import { geminiRecruitmentService } from '../../api/recruitment-service'
import { useGeminiRecruitmentAddTemplateFlow } from '../../hooks/use-recruitment-add-template-flow'
import { formatGeminiRecruitmentDraftError, formatGeminiRecruitmentRegisterError } from '../../lib/recruitment/mutation-error'
import { removeGeminiRecruitmentAddDraft } from '../../lib/recruitment/add-local-save'
import { GEMINI_RECRUITMENT_DEFAULT_TEMPLATE_CODE } from '../../lib/recruitment/add-template'
import { GeminiRecruitmentAddCloseConfirmModal } from './add-close-confirm-modal'
import { GeminiRecruitmentAddPreviewModal } from './add-preview-modal'
import { HideParagraphSelectionChromeContext } from '@/features/template/context/paragraph-selection-chrome-context'
import { RegistrationStepTemplateChrome } from '@/features/program/shared/ui/registration/step-template-banner'
import '@/features/template/ui/template-management/template-fullpage-modal.css'
import '@/features/template/ui/modal/template-preview-modal.css'
import './add-fullpage-modal.css'

const ADD_MODAL_TITLE = '찾아가는 연수 모집 공고 추가'

const GEMINI_DRAFT_SAVE_SUCCESS_BODY = [
  '작성 내용이 임시저장(DRAFT) 상태로 서버에 저장되었습니다.',
  '모집 공고 목록에서 이어서 확인하고 수정할 수 있습니다.',
].join('\n')

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
  const createdDraftIdRef = useRef<string | null>(null)
  const [draftSaveSuccessOpen, setDraftSaveSuccessOpen] = useState(false)
  const [completeSuccessOpen, setCompleteSuccessOpen] = useState(false)

  useEffect(() => {
    if (open) return
    setTemplatePickerOpen(false)
    setDraftSaveSuccessOpen(false)
    setCompleteSuccessOpen(false)
    createdDraftIdRef.current = null
  }, [open])

  const handleDraftSave = useCallback(async () => {
    if (form.isDraftLoading) return
    const snapshot = form.buildSaveSnapshot()
    const endOverlay = beginBlockingOverlay()
    try {
      const saved = await geminiRecruitmentService.saveDraft(
        snapshot,
        createdDraftIdRef.current
      )
      if (saved.id) createdDraftIdRef.current = saved.id
      removeGeminiRecruitmentAddDraft()
      invalidateGeminiRecruitmentListCaches(queryClient)
      form.markSavedBaseline()
      setDraftSaveSuccessOpen(true)
    } catch (error) {
      showAlert({
        title: '임시 저장 실패',
        content: formatGeminiRecruitmentDraftError(error),
      })
    } finally {
      endOverlay()
    }
  }, [form, queryClient, showAlert])

  const handleRegister = useCallback(async () => {
    if (form.isDraftLoading || !form.isRegisterReady) return
    const snapshot = form.buildSaveSnapshot()
    const endOverlay = beginBlockingOverlay()
    try {
      const existingId = createdDraftIdRef.current
      if (existingId) {
        await geminiRecruitmentService.publishExisting(existingId, snapshot)
        await queryClient.invalidateQueries({
          queryKey: geminiVisitingTrainingQueryKeys.recruitmentDetail(existingId),
        })
      } else {
        const created = await geminiRecruitmentService.register(snapshot)
        if (created.id && created.detail) {
          queryClient.setQueryData(
            geminiVisitingTrainingQueryKeys.recruitmentDetail(created.id),
            created.detail
          )
        }
      }
      removeGeminiRecruitmentAddDraft()
      createdDraftIdRef.current = null
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
  }, [form, queryClient, showAlert])

  const handleCompleteSuccessConfirm = useCallback(() => {
    setCompleteSuccessOpen(false)
    onClose()
  }, [onClose])

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
        onSave={() => {
          void handleDraftSave()
        }}
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
          disabled: !form.isRegisterReady,
          onClick: handleRegister,
        }}
      />
      <RegistrationDraftSaveSuccessModal
        open={draftSaveSuccessOpen}
        body={GEMINI_DRAFT_SAVE_SUCCESS_BODY}
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
