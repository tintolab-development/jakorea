/**
 * 게시글 관리 — 공지사항 상세 (관리자)
 */

import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { EyeOutlined, PaperClipOutlined } from '@ant-design/icons'
import { NoticeAttachmentDownloadIcon } from '@/features/posts/ui/notice-attachment-download-icon'
import { getAdminNoticeById } from '@/features/posts/api/admin-notice-mock-store'
import { deleteNotice } from '@/features/posts/api/admin-notice-service'
import { NoticeDeleteConfirmModal } from '@/features/posts/ui/notice-delete-confirm-modal'
import { NoticeFormModal } from '@/features/posts/ui/notice-form-modal'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { CmsButton } from '@/shared/ui'
import { downloadFile } from '@/shared/lib/file-download'
import { RichTextViewer } from '@/shared/rich-text'
import './admin-notice-detail-page.css'

export function AdminNoticeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  /** mock 스토어 갱신 후 동일 id 재조회용 */
  const [storeTick, setStoreTick] = useState(0)

  const notice = useMemo(() => {
    void storeTick
    return id ? getAdminNoticeById(id) : undefined
  }, [id, storeTick])

  const goList = useCallback(() => {
    navigate('/admin/posts/notices')
  }, [navigate])

  const handleDelete = useCallback(() => {
    if (!canWrite || !id) return
    setDeleteConfirmOpen(true)
  }, [canWrite, id])

  const handleConfirmDelete = useCallback(async () => {
    if (!id) return
    try {
      await deleteNotice(id)
      setDeleteConfirmOpen(false)
      goList()
    } catch (error) {
      console.debug('adminNoticeDetailPage delete failed', error)
    }
  }, [id, goList])

  const handleEdit = useCallback(() => {
    if (!canWrite) return
    setEditModalOpen(true)
  }, [canWrite])

  const handleAttachmentClick = useCallback((fileName: string, fileUrl?: string) => {
    downloadFile(fileName, fileUrl)
  }, [])

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
  const attachmentItems = notice.hasAttachment
    ? notice.attachments?.length
      ? notice.attachments
      : [{ name: '첨부파일.pdf' }]
    : []

  return (
    <div className="admin-notice-detail-page">
      <NoticeDeleteConfirmModal
        open={deleteConfirmOpen}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        preset="notice"
      />
      {notice ? (
        <NoticeFormModal
          open={editModalOpen}
          mode="edit"
          notice={notice}
          onCancel={() => setEditModalOpen(false)}
          onSuccess={() => setStoreTick(t => t + 1)}
          onDeleted={goList}
        />
      ) : null}
      <div className="admin-notice-detail-page__inner">
        <div className="admin-notice-detail-page__card">
          <div className="admin-notice-detail-page__top-row">
            <span
              className={
                isPublic
                  ? 'admin-notice-detail-page__badge admin-notice-detail-page__badge--public'
                  : 'admin-notice-detail-page__badge admin-notice-detail-page__badge--private'
              }
            >
              {isPublic ? '공개' : '비공개'}
            </span>
            <span className="admin-notice-detail-page__views">
              <EyeOutlined className="admin-notice-detail-page__views-icon" aria-hidden />
              {notice.viewCount.toLocaleString('ko-KR')}
            </span>
          </div>
          <h1 className="admin-notice-detail-page__title">{notice.title}</h1>
          <div className="admin-notice-detail-page__meta">
            <span className="admin-notice-detail-page__meta-text">{dateStr}</span>
            <span className="admin-notice-detail-page__meta-divider" aria-hidden />
            <span className="admin-notice-detail-page__meta-text">{notice.author}</span>
          </div>
          {attachmentItems.length > 0 ? (
            <div className="admin-notice-detail-page__attachments">
              <div className="admin-notice-detail-page__attachments-head">
                <PaperClipOutlined className="admin-notice-detail-page__clip" aria-hidden />
                첨부파일
              </div>
              <ul className="admin-notice-detail-page__attachments-list">
                {attachmentItems.map((att, index) => (
                  <li key={`${att.name}-${index}`}>
                    <button
                      type="button"
                      className="admin-notice-detail-page__file"
                      onClick={() => handleAttachmentClick(att.name, att.fileUrl)}
                    >
                      <NoticeAttachmentDownloadIcon className="admin-notice-detail-page__file-icon" />
                      <span className="admin-notice-detail-page__file-name">{att.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <hr className="admin-notice-detail-page__section-divider" aria-hidden />
          )}
          <div className="admin-notice-detail-page__body">
            <RichTextViewer markdown={notice.content} />
          </div>
        </div>
        <div className="admin-notice-detail-page__actions">
          <CmsButton variant="secondary" size="medium" onClick={goList}>
            목록
          </CmsButton>
          <div className="admin-notice-detail-page__actions-right">
            <CmsButton variant="delete" size="medium" onClick={handleDelete} disabled={!canWrite}>
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
