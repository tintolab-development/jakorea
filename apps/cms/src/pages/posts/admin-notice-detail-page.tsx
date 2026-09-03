/**
 * 게시글 관리 — 공지사항 상세 (관리자)
 */

import { useCallback, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { Spin } from 'antd'
import { EyeOutlined, PaperClipOutlined } from '@ant-design/icons'
import { AttachmentDownloadIcon } from '@/shared/ui'
import { getPostsApiErrorMessage } from '@/features/posts/api/get-posts-api-error'
import { shouldUseNoticesRemoteApi } from '@/features/posts/api/notices/admin-notices-service'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import { useLeaveDeletedDetail } from '@/features/posts/hooks/use-leave-deleted-detail'
import { useNoticeDetailQuery } from '@/features/posts/hooks/use-notice-detail-query'
import { useNoticeMutations } from '@/features/posts/hooks/use-notice-mutations'
import { NoticeDeleteConfirmModal } from '@/features/posts/ui/notice-delete-confirm-modal'
import { NoticeFormModal } from '@/features/posts/ui/notice-form-modal'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { ActionResultModal, CmsButton } from '@/shared/ui'
import { downloadFile } from '@/shared/lib/file-download'
import { RichTextViewer } from '@/shared/rich-text'
import './admin-notice-detail-page.css'

export function AdminNoticeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const remoteEnabled = shouldUseNoticesRemoteApi()
  const { detailEnabled, goList, leaveToList, runDeleteThenLeave } = useLeaveDeletedDetail(
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
    try {
      await runDeleteThenLeave(() => deleteMutation.mutateAsync(id))
      setDeleteConfirmOpen(false)
    } catch (error) {
      setActionResultTitle('공지 삭제 실패')
      setActionResultMessage(getPostsApiErrorMessage(error, '삭제에 실패했습니다.'))
      setActionResultOpen(true)
    }
  }, [deleteMutation, id, runDeleteThenLeave])

  const handleEdit = useCallback(() => {
    if (!canWrite) return
    setEditModalOpen(true)
  }, [canWrite])

  const handleAttachmentClick = useCallback((fileName: string, fileUrl?: string) => {
    void downloadFile(fileName, fileUrl)
  }, [])

  const attachmentItems = useMemo(() => {
    if (!notice?.hasAttachment) return []
    if (remoteEnabled) return []
    return notice.attachments?.length ? notice.attachments : [{ name: '첨부파일.pdf' }]
  }, [notice?.attachments, notice?.hasAttachment, remoteEnabled])

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

  const dateStr = dayjs(notice.createdAt).format('YYYY년 M월 D일 HH:mm:ss')
  const isPublic = notice.status === 'published'

  return (
    <div className="admin-notice-detail-page">
      <NoticeDeleteConfirmModal
        open={deleteConfirmOpen}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        preset="notice"
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
              <span className="admin-notice-detail-page__views">
                <EyeOutlined className="admin-notice-detail-page__views-icon" aria-hidden />
                {notice.viewCount.toLocaleString('ko-KR')}
              </span>
            </div>
            <h1 className="admin-notice-detail-page__title">{notice.title}</h1>
            <div className="admin-notice-detail-page__meta">
              <span className="admin-notice-detail-page__meta-text">{dateStr}</span>
              {notice.author ? (
                <>
                  <span className="admin-notice-detail-page__meta-divider" aria-hidden />
                  <span className="admin-notice-detail-page__meta-text">{notice.author}</span>
                </>
              ) : null}
            </div>
          </div>
          <hr className="admin-notice-detail-page__section-divider" />
          {attachmentItems.length > 0 ? (
            <div className="admin-notice-detail-page__attachments">
              <div className="admin-notice-detail-page__attachments-head">
                <PaperClipOutlined className="admin-notice-detail-page__clip" aria-hidden />
                <span>첨부파일</span>
              </div>
              <ul className="admin-notice-detail-page__attachments-list">
                {attachmentItems.map((item, index) => (
                  <li key={`${item.name}-${index}`}>
                    <button
                      type="button"
                      className="admin-notice-detail-page__file"
                      onClick={() => handleAttachmentClick(item.name, item.fileUrl)}
                    >
                      <span className="admin-notice-detail-page__file-name">{item.name}</span>
                      <AttachmentDownloadIcon className="admin-notice-detail-page__file-icon" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : notice.hasAttachment && remoteEnabled ? (
            <div className="admin-notice-detail-page__attachments">
              <div className="admin-notice-detail-page__attachments-head">
                <PaperClipOutlined className="admin-notice-detail-page__clip" aria-hidden />
                <span>첨부파일</span>
              </div>
              <p className="admin-notice-detail-page__attachment-hint">첨부파일이 있습니다.</p>
            </div>
          ) : null}
          <div className="admin-notice-detail-page__body">
            <RichTextViewer content={notice.content} />
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
