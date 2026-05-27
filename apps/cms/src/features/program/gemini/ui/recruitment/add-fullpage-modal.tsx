import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TemplateFullpageModal } from '@/features/template/ui/template-management/template-fullpage-modal'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import { FEATURE_COMING_SOON_ALERT_MESSAGE } from '@/shared/constants/messages'
import {
  GEMINI_RECRUITMENT_ADD_ACTIVE,
  GEMINI_RECRUITMENT_ADD_PARAM,
  isGeminiRecruitmentAddOpen,
} from '../../lib/recruitment/add-url'
import {
  GEMINI_RECRUITMENT_ID_PARAM,
  GEMINI_RECRUITMENT_LNB_PARAM,
} from '../../lib/recruitment/detail-url'
import { GeminiRecruitmentAddForm } from './add-form'
import '@/features/template/ui/template-management/template-fullpage-modal.css'
import '@/features/template/ui/modal/template-preview-modal.css'
import './add-fullpage-modal.css'

const ADD_MODAL_TITLE = '찾아가는 연수 모집 공고 추가'

export function GeminiRecruitmentAddFullpageModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { showAlert } = useCmsAlert()

  const handleDraftSave = useCallback(() => {
    // TODO(api): 모집 공고 임시저장 API 연동
    showAlert({
      title: '준비 중',
      content: FEATURE_COMING_SOON_ALERT_MESSAGE,
    })
  }, [showAlert])

  const handleRegister = useCallback(() => {
    // TODO(api): 모집 공고 등록 API 연동
    showAlert({
      title: '준비 중',
      content: FEATURE_COMING_SOON_ALERT_MESSAGE,
    })
  }, [showAlert])

  return (
    <TemplateFullpageModal
      className="gemini-recruitment-add-fullpage-modal template-preview-modal--form-layout"
      open={open}
      onClose={onClose}
      title={ADD_MODAL_TITLE}
      titleReadOnly
      templateTabType="writing"
      registrationUserMode
      onPreview={() => {}}
      onSave={handleDraftSave}
      bodyHeaderLeading={
        <div className="gemini-recruitment-add-fullpage-modal__header-actions">
          <CmsButton type="button" variant="secondary" size="large" onClick={handleDraftSave}>
            임시저장
          </CmsButton>
          <CmsButton type="button" size="large" onClick={handleRegister}>
            프로그램 등록
          </CmsButton>
        </div>
      }
      leftContent={<GeminiRecruitmentAddForm onCancel={onClose} />}
      rightNavigation={
        <span className="gemini-recruitment-add-fullpage-modal__nav-placeholder" aria-hidden />
      }
    />
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
