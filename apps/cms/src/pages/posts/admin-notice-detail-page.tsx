/**
 * 게시글 관리 — 공지사항 상세 (관리자)
 */

import { Fragment, useCallback, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  NOTICE_DETAIL_UPDATED_AT_GUIDE,
  resolveNoticeDetailMetaDates,
} from '@/features/posts/lib/posts-detail-meta-dates'
import { Spin } from 'antd'
import { EyeOutlined, PaperClipOutlined } from '@ant-design/icons'
import { AdminDetailBackLink, AdminDetailMoreMenu } from '@jakorea/admin-ui/post-detail'
import { AttachmentDownloadIcon } from '@/shared/ui'
import { downloadNoticeAttachment } from '@/features/posts/api/notices/notice-attachments'
import { getPostsApiErrorMessage } from '@/features/posts/api/get-posts-api-error'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import { useLeaveDeletedDetail } from '@/features/posts/hooks/use-leave-deleted-detail'
import { useNoticeDetailQuery } from '@/features/posts/hooks/use-notice-detail-query'
import { useNoticeMutations } from '@/features/posts/hooks/use-notice-mutations'
import { resolvePostsDeleteConfirmCopy } from '@/features/posts/lib/posts-delete-confirm-copy'
import { NoticeDeleteConfirmModal } from '@/features/posts/ui/notice-delete-confirm-modal'
import { NoticeFormModal } from '@/features/posts/ui/notice-form-modal'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { ActionResultModal, CmsButton, showDeleteCompletedAlert } from '@/shared/ui'
import { RichTextViewer } from '@/shared/rich-text'
import './admin-notice-detail-page.css'

export function AdminNoticeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const { detailEnabled, goList, leaveToList, suspendDetailQuery, resumeDetailQuery } =
    useLeaveDeletedDetail(
      '/admin/posts/notices',
      id ? postsQueryKeys.notices.detail(id) : undefined
    )
  const detailQuery = useNoticeDetailQuery(id, { enabled: detailEnabled })
  const { deleteMutation } = useNoticeMutations()

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [actionResultOpen, setActionResultOpen] = useState(false)
  const [actionResultTitle, setActionResultTitle] = useState('')
  const [actionResultMessage, setActionResultMessage] = useState('')

  const notice = detailQuery.data

  const handleDelete = useCallback(() => {
    if (!canWrite || !id) return
    setDeleteConfirmOpen(true)
  }, [canWrite, id])

  const handleConfirmDelete = useCallback(async () => {
    if (!id) return
    suspendDetailQuery()
    try {
      await deleteMutation.mutateAsync(id)
      setDeleteConfirmOpen(false)
      showDeleteCompletedAlert({ onConfirm: leaveToList })
    } catch (error) {
      resumeDetailQuery()
      setActionResultTitle('공지 삭제 실패')
      setActionResultMessage(getPostsApiErrorMessage(error, '삭제에 실패했습니다.'))
      setActionResultOpen(true)
    }
  }, [deleteMutation, id, leaveToList, resumeDetailQuery, suspendDetailQuery])

  const handleEdit = useCallback(() => {
    if (!canWrite) return
    setEditModalOpen(true)
  }, [canWrite])

  const handleAttachmentClick = useCallback((item: { name: string; fileUrl?: string; fileObjectId?: number }) => {
    void downloadNoticeAttachment(item).catch(error => {
      setActionResultTitle('첨부 다운로드 실패')
      setActionResultMessage(getPostsApiErrorMessage(error, '첨부파일 다운로드에 실패했습니다.'))
      setActionResultOpen(true)
    })
  }, [])

  const attachmentItems = useMemo(() => notice?.attachments ?? [], [notice?.attachments])

  if (detailQuery.isLoading) {
    return (
      <div className="admin-notice-detail-page">
        <div
          className="page-content-loading page-content-loading--viewport"
          role="status"
          aria-label="공지 불러오는 중"
        >
          <Spin size="large" />
        </div>
      </div>
    )
  }

  if (!notice) {
    return (
      <div className="admin-notice-detail-page">
        <div className="admin-notice-detail-page__inner">
          <div className="admin-notice-detail-page__empty-wrap">
            <p className="admin-notice-detail-page__empty">공지를 찾을 수 없습니다.</p>
            <CmsButton variant="secondary" size="medium" onClick={goList}>
              목록
            </CmsButton>
          </div>
        </div>
      </div>
    )
  }

  const metaDates = resolveNoticeDetailMetaDates(notice)
  const isPublic = notice.status === 'published'

  return (
    <div className="admin-notice-detail-page">
      <NoticeDeleteConfirmModal
        open={deleteConfirmOpen}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        preset="notice"
        {...resolvePostsDeleteConfirmCopy('notice', 'single', 1, [notice.title])}
      />
      <NoticeFormModal
        open={editModalOpen}
        mode="edit"
        notice={notice}
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
      <div className="admin-notice-detail-page__inner">
        <AdminDetailBackLink onClick={goList} />
        <div className="admin-notice-detail-page__card">
          <div className="admin-notice-detail-page__header">
            <div className="admin-notice-detail-page__top-row">
              <div className="admin-notice-detail-page__top-badges">
                <span
                  className={
                    isPublic
                      ? 'admin-notice-detail-page__badge admin-notice-detail-page__badge--public'
                      : 'admin-notice-detail-page__badge admin-notice-detail-page__badge--private'
                  }
                >
                  {isPublic ? '공개' : '비공개'}
                </span>
                {notice.category ? (
                  <span className="admin-notice-detail-page__category">{notice.category}</span>
                ) : null}
              </div>
              <span className="admin-detail-top-actions">
                <span className="admin-notice-detail-page__views">
                  <EyeOutlined className="admin-notice-detail-page__views-icon" aria-hidden />
                  {notice.viewCount.toLocaleString('ko-KR')}
                </span>
                <AdminDetailMoreMenu
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  disabled={!canWrite}
                />
              </span>
            </div>
            <h1 className="admin-notice-detail-page__title">{notice.title}</h1>
            <div className="admin-notice-detail-page__meta">
              {metaDates.map((item, index) => (
                <Fragment key={item.key}>
                  {index > 0 ? (
                    <span className="admin-notice-detail-page__meta-divider" aria-hidden />
                  ) : null}
                  <span className="admin-notice-detail-page__meta-text">{item.text}</span>
                </Fragment>
              ))}
              {notice.author ? (
                <>
                  <span className="admin-notice-detail-page__meta-divider" aria-hidden />
                  <span className="admin-notice-detail-page__meta-text">{notice.author}</span>
                </>
              ) : null}
            </div>
            <p className="admin-notice-detail-page__meta-guide">{NOTICE_DETAIL_UPDATED_AT_GUIDE}</p>
          </div>
          {attachmentItems.length > 0 ? null : (
            <hr className="admin-notice-detail-page__section-divider" />
          )}
          {attachmentItems.length > 0 ? (
            <div className="admin-notice-detail-page__attachments">
              <div className="admin-notice-detail-page__attachments-head">
                <PaperClipOutlined className="admin-notice-detail-page__clip" aria-hidden />
                <span>첨부 파일</span>
              </div>
              <ul className="admin-notice-detail-page__attachments-list">
                {attachmentItems.map((item, index) => (
                  <li key={`${item.name}-${index}`}>
                    <button
                      type="button"
                      className="admin-notice-detail-page__file"
                      onClick={() => handleAttachmentClick(item)}
                    >
                      <span className="admin-notice-detail-page__file-name">{item.name}</span>
                      <AttachmentDownloadIcon className="admin-notice-detail-page__file-icon" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="admin-notice-detail-page__body">
            <RichTextViewer content={notice.content} maxHeight="100%" />
          </div>
        </div>
        <div className="admin-notice-detail-page__actions">
          <CmsButton variant="secondary" size="large" onClick={goList}>
            목록
          </CmsButton>
          <div className="admin-notice-detail-page__actions-right">
            <CmsButton variant="delete" size="large" onClick={handleDelete}>
              삭제
            </CmsButton>
            <CmsButton variant="primary" size="large" adminAction="write" onClick={handleEdit}>
              수정
            </CmsButton>
          </div>
        </div>
      </div>
    </div>
  )
}
