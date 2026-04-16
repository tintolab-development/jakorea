/**
 * 게시글 관리 — 공지사항 상세 (관리자)
 */

import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { message } from 'antd'
import dayjs from 'dayjs'
import { EyeOutlined, PaperClipOutlined } from '@ant-design/icons'
import { NoticeAttachmentDownloadIcon } from '@/features/posts/ui/notice-attachment-download-icon'
import { getAdminNoticeById } from '@/data/mock/notices'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { CmsButton } from '@/shared/ui'
import { ToastUiMarkdownViewer } from '@/shared/components/toast-ui-markdown-viewer'
import './admin-notice-detail-page.css'

export function AdminNoticeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)

  const notice = id ? getAdminNoticeById(id) : undefined

  const goList = useCallback(() => {
    navigate('/admin/posts/notices')
  }, [navigate])

  const handleDelete = useCallback(() => {
    if (!canWrite) return
    message.info('공지사항 삭제는 추후 연결됩니다.')
  }, [canWrite])

  const handleEdit = useCallback(() => {
    if (!canWrite) return
    message.info('공지사항 수정은 추후 연결됩니다.')
  }, [canWrite])

  const handleAttachmentClick = useCallback(() => {
    message.info('첨부파일 다운로드는 추후 연결됩니다.')
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
                {attachmentItems.map(att => (
                  <li key={att.name}>
                    <button
                      type="button"
                      className="admin-notice-detail-page__file"
                      onClick={handleAttachmentClick}
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
            <ToastUiMarkdownViewer markdown={notice.content} />
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
