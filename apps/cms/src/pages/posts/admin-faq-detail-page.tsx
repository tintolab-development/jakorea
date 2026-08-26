/**
 * 게시글 관리 — FAQ 상세 (관리자)
 */

import { useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { Spin } from 'antd'
import { getPostsApiErrorMessage } from '@/features/posts/api/get-posts-api-error'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import { useFaqDetailQuery } from '@/features/posts/hooks/use-faq-detail-query'
import { useFaqMutations } from '@/features/posts/hooks/use-faq-mutations'
import { useLeaveDeletedDetail } from '@/features/posts/hooks/use-leave-deleted-detail'
import { FaqFormModal } from '@/features/posts/ui/faq-form-modal'
import { NoticeDeleteConfirmModal } from '@/features/posts/ui/notice-delete-confirm-modal'
import { RichTextViewer } from '@/shared/rich-text'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { ActionResultModal, CmsButton } from '@/shared/ui'
import './admin-faq-delete-btn.css'
import './admin-faq-detail-page.css'

const ADMIN_FAQ_LIST_PATH = '/admin/posts/faq'

export function AdminFaqDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const { detailEnabled, goList, leaveToList, runDeleteThenLeave } = useLeaveDeletedDetail(
    ADMIN_FAQ_LIST_PATH,
    id ? postsQueryKeys.faqs.detail(id) : undefined
  )
  const detailQuery = useFaqDetailQuery(id, { enabled: detailEnabled })
  const { deleteMutation } = useFaqMutations()

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [actionResultOpen, setActionResultOpen] = useState(false)
  const [actionResultTitle, setActionResultTitle] = useState('')
  const [actionResultMessage, setActionResultMessage] = useState('')

  const faq = detailQuery.data

  const handleDelete = useCallback(() => {
    if (!canWrite || !id) return
    setDeleteConfirmOpen(true)
  }, [canWrite, id])

  const handleConfirmDelete = useCallback(async () => {
    if (!id) return
    try {
      await runDeleteThenLeave(() => deleteMutation.mutateAsync(id))
      setDeleteConfirmOpen(false)
    } catch (error) {
      setActionResultTitle('FAQ 삭제 실패')
      setActionResultMessage(getPostsApiErrorMessage(error, '삭제에 실패했습니다.'))
      setActionResultOpen(true)
    }
  }, [deleteMutation, id, runDeleteThenLeave])

  const handleEdit = useCallback(() => {
    if (!canWrite) return
    setEditModalOpen(true)
  }, [canWrite])

  if (detailQuery.isLoading) {
    return (
      <div className="admin-faq-detail-page">
        <div
          className="page-content-loading page-content-loading--viewport"
          role="status"
          aria-label="FAQ 불러오는 중"
        >
          <Spin size="large" />
        </div>
      </div>
    )
  }

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
        preset="faq"
        title="FAQ 삭제"
      />
      <FaqFormModal
        open={editModalOpen}
        mode="edit"
        faq={faq}
        onCancel={() => setEditModalOpen(false)}
        onSuccess={() => {
          setEditModalOpen(false)
        }}
        onDeleted={leaveToList}
      />
      <ActionResultModal
        open={actionResultOpen}
        title={actionResultTitle}
        body={actionResultMessage}
        onClose={() => setActionResultOpen(false)}
      />
      <div className="admin-faq-detail-page__inner">
        <div className="admin-faq-detail-page__card">
          <div className="admin-faq-detail-page__header">
            <div className="admin-faq-detail-page__top-row">
              <div className="admin-faq-detail-page__top-badges">
                <span
                  className={
                    isPublic
                      ? 'admin-faq-detail-page__badge admin-faq-detail-page__badge--public'
                      : 'admin-faq-detail-page__badge admin-faq-detail-page__badge--private'
                  }
                >
                  {isPublic ? '공개' : '비공개'}
                </span>
                {faq.category ? (
                  <span className="admin-faq-detail-page__category">{faq.category}</span>
                ) : null}
              </div>
            </div>
            <h1 className="admin-faq-detail-page__title">{faq.question}</h1>
            <div className="admin-faq-detail-page__meta">
              <span className="admin-faq-detail-page__meta-text">{dateStr}</span>
              {faq.author ? (
                <>
                  <span className="admin-faq-detail-page__meta-divider" aria-hidden />
                  <span className="admin-faq-detail-page__meta-text">{faq.author}</span>
                </>
              ) : null}
            </div>
          </div>
          <hr className="admin-faq-detail-page__section-divider" />
          <div className="admin-faq-detail-page__body">
            <RichTextViewer content={faq.answer} />
          </div>
        </div>
        <div className="admin-faq-detail-page__actions">
          <CmsButton variant="secondary" size="large" onClick={goList}>
            목록
          </CmsButton>
          <div className="admin-faq-detail-page__actions-right">
            <CmsButton
              variant="delete"
              size="large"
              className="admin-faq-delete-btn"
              onClick={handleDelete}
              disabled={!canWrite}
            >
              삭제
            </CmsButton>
            <CmsButton variant="primary" size="large" onClick={handleEdit} disabled={!canWrite}>
              수정
            </CmsButton>
          </div>
        </div>
      </div>
    </div>
  )
}
