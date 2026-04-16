/**
 * 게시글 관리 — FAQ 상세 (관리자)
 * 레이아웃·마크업은 공지 상세(admin-notice-detail-page)와 동일 스펙, 본문은 ToastUiMarkdownViewer
 */

import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { message } from 'antd'
import dayjs from 'dayjs'
import { getAdminFaqById } from '@/features/posts/api/admin-faq-mock-store'
import { deleteFaq } from '@/features/posts/api/admin-faq-service'
import { FaqFormModal } from '@/features/posts/ui/faq-form-modal'
import { NoticeDeleteConfirmModal } from '@/features/posts/ui/notice-delete-confirm-modal'
import { ToastUiMarkdownViewer } from '@/shared/components/toast-ui-markdown-viewer'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { CmsButton } from '@/shared/ui'
import './admin-faq-delete-btn.css'
import './admin-faq-detail-page.css'

const ADMIN_FAQ_LIST_PATH = '/admin/posts/faq'

export function AdminFaqDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  /** mock 스토어 갱신 후 동일 id 재조회용 */
  const [storeTick, setStoreTick] = useState(0)

  const faq = useMemo(() => {
    void storeTick
    return id ? getAdminFaqById(id) : undefined
  }, [id, storeTick])

  const goList = useCallback(() => {
    navigate(ADMIN_FAQ_LIST_PATH)
  }, [navigate])

  const handleDelete = useCallback(() => {
    if (!canWrite || !id) return
    setDeleteConfirmOpen(true)
  }, [canWrite, id])

  const handleConfirmDelete = useCallback(async () => {
    if (!id) return
    try {
      await deleteFaq(id)
      message.success('FAQ가 삭제되었습니다.')
      setDeleteConfirmOpen(false)
      goList()
    } catch {
      message.error('FAQ를 삭제할 수 없습니다.')
    }
  }, [id, goList])

  const handleEdit = useCallback(() => {
    if (!canWrite) return
    setEditModalOpen(true)
  }, [canWrite])

  if (!faq) {
    return (
      <div className="admin-faq-detail-page">
        <div className="admin-faq-detail-page__inner">
          <div className="admin-faq-detail-page__empty-wrap">
            <p className="admin-faq-detail-page__empty">FAQ를 찾을 수 없습니다.</p>
            <CmsButton variant="secondary" size="medium" onClick={goList}>
              목록
            </CmsButton>
          </div>
        </div>
      </div>
    )
  }

  const dateStr = dayjs(faq.createdAt).format('YYYY년 M월 D일 HH:mm:ss')
  const isPublic = faq.status === 'published'

  return (
    <div className="admin-faq-detail-page">
      <NoticeDeleteConfirmModal
        open={deleteConfirmOpen}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="FAQ 삭제"
        line1="해당 FAQ를 삭제하시겠습니까?"
        line2="삭제된 목록 및 정보는 되돌릴 수 없습니다. 정말 삭제하시겠습니까?"
      />
      {faq ? (
        <FaqFormModal
          open={editModalOpen}
          mode="edit"
          faq={faq}
          onCancel={() => setEditModalOpen(false)}
          onSuccess={() => setStoreTick(t => t + 1)}
          onDeleted={goList}
        />
      ) : null}
      <div className="admin-faq-detail-page__inner">
        <div className="admin-faq-detail-page__card">
          <div className="admin-faq-detail-page__top-row">
            <span
              className={
                isPublic
                  ? 'admin-faq-detail-page__badge admin-faq-detail-page__badge--public'
                  : 'admin-faq-detail-page__badge admin-faq-detail-page__badge--private'
              }
            >
              {isPublic ? '공개' : '비공개'}
            </span>
            <span className="admin-faq-detail-page__category">{faq.category}</span>
          </div>
          <h1 className="admin-faq-detail-page__title">{faq.question}</h1>
          <div className="admin-faq-detail-page__meta">
            <span className="admin-faq-detail-page__meta-text">{dateStr}</span>
            <span className="admin-faq-detail-page__meta-divider" aria-hidden />
            <span className="admin-faq-detail-page__meta-text">{faq.author}</span>
          </div>
          <hr className="admin-faq-detail-page__section-divider" aria-hidden />
          <div className="admin-faq-detail-page__body">
            <ToastUiMarkdownViewer markdown={faq.answer} />
          </div>
        </div>
        <div className="admin-faq-detail-page__actions">
          <CmsButton variant="secondary" size="medium" onClick={goList}>
            목록
          </CmsButton>
          <div className="admin-faq-detail-page__actions-right">
            <CmsButton
              variant="delete"
              size="medium"
              className="admin-faq-delete-btn"
              onClick={handleDelete}
              disabled={!canWrite}
            >
              삭제
            </CmsButton>
            <CmsButton variant="primary" size="medium" onClick={handleEdit} disabled={!canWrite}>
              수정
            </CmsButton>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminFaqDetailPage
