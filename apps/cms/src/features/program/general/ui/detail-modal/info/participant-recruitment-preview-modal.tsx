/**
 * 일반 프로그램 상세 — 참여자 모집 정보 사용자 미리보기
 * Platform 사용자 페이지 전체본을 A4 비율로 스케일 다운해 표시한다.
 */

import { CloseOutlined } from '@ant-design/icons'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Program } from '@/types/domain'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { TemplatePreviewPageNavigator } from '@/features/template/ui/modal/template-preview-page-navigator'
import {
  ParticipantRecruitmentUserPage,
  RECRUITMENT_USER_PREVIEW_PAGE_HEIGHT,
} from '@/features/program/general/ui/user-preview'
import { PARTICIPANT_RECRUITMENT_PREVIEW_MODAL_Z_INDEX } from '@/features/program/general/lib/general-program-modal-z-index'
import '@/features/template/ui/modal/template-preview-modal.css'
import './participant-recruitment-preview-modal.css'

const PREVIEW_HEADER_TITLE = '참여자 모집 폼 미리보기'

export function ParticipantRecruitmentPreviewModal({
  open,
  onClose,
  program,
  sponsorName,
}: {
  open: boolean
  onClose: () => void
  program: Program
  sponsorName?: string
}) {
  const pageContentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState(RECRUITMENT_USER_PREVIEW_PAGE_HEIGHT)
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(contentHeight / RECRUITMENT_USER_PREVIEW_PAGE_HEIGHT))

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  useEffect(() => {
    if (!open) {
      setCurrentPage(1)
    }
  }, [open])

  useLayoutEffect(() => {
    if (!open) return

    const node = pageContentRef.current
    if (!node) return

    const updateHeight = () => {
      setContentHeight(node.getBoundingClientRect().height)
    }

    updateHeight()

    const observer = new ResizeObserver(() => {
      updateHeight()
    })
    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [open, program.id, sponsorName])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const pageOffset = (currentPage - 1) * RECRUITMENT_USER_PREVIEW_PAGE_HEIGHT

  return (
    <TealHeaderModal
      open={open}
      onCancel={onClose}
      title=""
      size="full"
      hideHeader
      className="template-preview-modal template-preview-modal--form-layout template-preview-modal--agreement-layout template-preview-modal--survey-layout teal-header-modal--full participant-recruitment-preview-modal"
      zIndex={PARTICIPANT_RECRUITMENT_PREVIEW_MODAL_Z_INDEX}
    >
      <div className="template-preview-modal__shell">
        <header className="template-preview-modal__title-row">
          <div className="template-preview-modal__title-left">
            <span className="template-preview-modal__title-text">{PREVIEW_HEADER_TITLE}</span>
            <span className="template-preview-modal__badge">미리보기</span>
          </div>
          <button
            type="button"
            className="template-preview-modal__title-close"
            onClick={onClose}
            aria-label="닫기"
          >
            <CloseOutlined />
          </button>
        </header>

        <div className="template-preview-modal__body">
          <div className="template-preview-modal__notice-wrap">
            <div className="template-preview-modal__notice">
              <span className="template-preview-modal__notice-text">
                현재 화면은 미리보기 화면입니다.
              </span>
              <div className="template-preview-modal__notice-actions">
                <CmsButton
                  type="button"
                  variant="secondary"
                  size="large"
                  width={140}
                  className="template-preview-modal__notice-close-btn"
                  onClick={onClose}
                >
                  미리보기 닫기
                </CmsButton>
              </div>
            </div>
          </div>

          <div className="template-preview-modal__pages">
            <div className="template-preview-modal__a4-stage">
              <div className="template-preview-modal__a4-stack">
                <div className="template-preview-modal__a4-frame">
                  <div className="template-preview-modal__a4-scale-inner">
                    <div
                      className="participant-recruitment-preview-modal__page-shift"
                      style={{ transform: `translateY(-${pageOffset}px)` }}
                    >
                      <ParticipantRecruitmentUserPage
                        ref={pageContentRef}
                        program={program}
                        sponsorName={sponsorName}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <TemplatePreviewPageNavigator
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </TealHeaderModal>
  )
}
