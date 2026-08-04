import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TemplateFullpageModal } from '@/features/template/ui/template-management/template-fullpage-modal'
import { useCmsAlert } from '@/shared/ui'
import { geminiRecruitmentService } from '../../api/recruitment-service'
import { useGeminiRecruitmentAddForm } from '../../hooks/use-gemini-recruitment-add-form'
import { persistGeminiRecruitmentAddDraft } from '../../lib/recruitment/add-local-save'
import {
  GEMINI_RECRUITMENT_ADD_ACTIVE,
  GEMINI_RECRUITMENT_ADD_PARAM,
  isGeminiRecruitmentAddOpen,
} from '../../lib/recruitment/add-url'
import {
  GEMINI_RECRUITMENT_ID_PARAM,
  GEMINI_RECRUITMENT_LNB_PARAM,
} from '../../lib/recruitment/detail-url'
import { GeminiRecruitmentAddCloseConfirmModal } from './add-close-confirm-modal'
import { GeminiRecruitmentAddForm } from './add-form'
import { GeminiRecruitmentAddFormSidebar } from './add-form-sidebar'
import { GeminiRecruitmentAddPreviewModal } from './add-preview-modal'
import '@/features/template/ui/template-management/template-fullpage-modal.css'
import '@/features/template/ui/modal/template-preview-modal.css'
import './add-fullpage-modal.css'

const ADD_MODAL_TITLE = '찾아가는 연수 모집 공고 추가'

const DRAFT_SAVE_SUCCESS_MESSAGE =
  '작성 내용을 임시 저장하였습니다.\n임시 저장본은 가장 최근에 저장한 1개의 항목만 유지됩니다.'

const DRAFT_SAVE_FAILURE_MESSAGE =
  '임시 저장에 실패했습니다.\n브라우저 저장 공간을 확인한 뒤 다시 시도해 주세요.'

const REGISTER_SUCCESS_MESSAGE = '모집 공고가 등록되었습니다.'

export function GeminiRecruitmentAddFullpageModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { showAlert } = useCmsAlert()
  const form = useGeminiRecruitmentAddForm(open)
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSnapshot, setPreviewSnapshot] = useState<ReturnType<
    typeof form.buildSaveSnapshot
  > | null>(null)

  const handleDraftSave = useCallback(() => {
    if (!form.hydrated) return
    const snapshot = form.buildSaveSnapshot()
    const ok = persistGeminiRecruitmentAddDraft(snapshot)
    if (ok) {
      form.markSavedBaseline()
    }
    showAlert({
      title: '안내',
      content: ok ? DRAFT_SAVE_SUCCESS_MESSAGE : DRAFT_SAVE_FAILURE_MESSAGE,
    })
  }, [form, showAlert])

  const handleRegister = useCallback(async () => {
    if (!form.hydrated || !form.isRegisterReady) return
    const snapshot = form.buildSaveSnapshot()
    try {
      await geminiRecruitmentService.register(snapshot)
      showAlert({
        title: '안내',
        content: REGISTER_SUCCESS_MESSAGE,
      })
      onClose()
    } catch {
      showAlert({
        title: '안내',
        content: '모집 공고 등록에 실패했습니다.\n입력값과 서버 상태를 확인한 뒤 다시 시도해 주세요.',
      })
    }
  }, [form, onClose, showAlert])

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
    if (!form.hydrated) return
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
        leftContent={<GeminiRecruitmentAddForm form={form} />}
        rightNavigation={<GeminiRecruitmentAddFormSidebar />}
        footerAction={{
          label: '프로그램 등록 완료',
          disabled: !form.isRegisterReady,
          onClick: handleRegister,
        }}
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

export function useGeminiRecruitmentAddUrl() {
  const [searchParams, setSearchParams] = useSearchParams()
  const isAddOpen = isGeminiRecruitmentAddOpen(searchParams.get(GEMINI_RECRUITMENT_ADD_PARAM))

  const openAdd = useCallback(() => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.set(GEMINI_RECRUITMENT_ADD_PARAM, GEMINI_RECRUITMENT_ADD_ACTIVE)
        next.delete(GEMINI_RECRUITMENT_ID_PARAM)
        next.delete(GEMINI_RECRUITMENT_LNB_PARAM)
        return next
      },
      { replace: false }
    )
  }, [setSearchParams])

  const closeAdd = useCallback(() => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.delete(GEMINI_RECRUITMENT_ADD_PARAM)
        return next
      },
      { replace: true }
    )
  }, [setSearchParams])

  return { isAddOpen, openAdd, closeAdd }
}
