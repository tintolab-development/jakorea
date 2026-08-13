/**
 * 공지사항 상세
 * CMS admin-notice-detail-page 레이아웃·타이포 미러 + Admin 메타(작성일/게시일)
 * @see apps/cms/src/pages/posts/admin-notice-detail-page.tsx
 * @see apps/cms/src/pages/posts/admin-notice-detail-page.css
 */

import { useCallback, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { EyeOutlined, PaperClipOutlined } from '@ant-design/icons'
import type { Notice } from '@/entities/notices/model/types'
import {
  useNoticeDetail,
  useRemoveNotices,
  useUpdateNotice,
} from '@/features/notices/api/hooks'
import { noticesQueryKeys } from '@/features/notices/api/query-keys'
import { NOTICES_CHANGED_EVENT } from '@/features/notices/api/store'
import {
  NoticeFormModal,
  type NoticeFormValues,
} from '@/features/notices/ui/notice-form-modal'
import { NoticePinnedIcon } from '@/features/notices/ui/notice-pin-icon'
import { downloadFile } from '@/shared/lib/file-download'
import { useInvalidateOnWindowEvent } from '@/shared/lib/use-invalidate-on-window-event'
import { RichTextViewer } from '@/shared/rich-text'
import {
  AttachmentDownloadIcon,
  CmsButton,
  ConfirmModal,
  PageContentLoading,
  useCmsAlert,
} from '@/shared/ui'

import './detail-page.css'

function formatMetaDate(iso: string): string {
  const d = dayjs(iso)
  if (!d.isValid()) return '-'
  return d.format('YYYY년 M월 D일 HH:mm:ss')
}

function resolveNoticeBodyFormat(content: string): 'markdown' | 'html' {
  return content.trim().startsWith('<') ? 'html' : 'markdown'
}

export function NoticeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { showAlert } = useCmsAlert()

  const detailQuery = useNoticeDetail(id)
  const updateMutation = useUpdateNotice()
  const removeMutation = useRemoveNotices()

  useInvalidateOnWindowEvent(NOTICES_CHANGED_EVENT, noticesQueryKeys.all)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const notice = detailQuery.data ?? null

  const goList = useCallback(
    (replace = false) => {
      navigate({ pathname: '/ja-korea/notices', search: location.search }, { replace })
    },
    [navigate, location.search]
  )

  const handleDelete = useCallback(async () => {
    if (!id) return
    try {
      await removeMutation.mutateAsync([id])
      // 상세 캐시 제거 직후 빈 화면이 보이지 않도록 즉시 목록으로 교체 이동
      goList(true)
    } catch {
      setDeleteOpen(false)
      showAlert({
        title: '삭제 실패',
        content: '공지 삭제에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [goList, id, removeMutation, showAlert])

  const handleFormSubmit = useCallback(
    async (values: NoticeFormValues) => {
      if (!id) return
      try {
        await updateMutation.mutateAsync({ ...values, id })
        setEditOpen(false)
        void detailQuery.refetch()
      } catch {
        showAlert({
          title: '저장 실패',
          content: '공지 저장에 실패했습니다. 다시 시도해 주세요.',
        })
      }
    },
    [detailQuery, id, showAlert, updateMutation]
  )

  // 삭제 성공 직후 목록 이동 전: 빈 상태(찾을 수 없음) 대신 로딩 유지
  if (removeMutation.isSuccess || (removeMutation.isPending && !notice)) {
    return (
      <div className="notice-detail-page">
        <PageContentLoading variant="viewport" />
      </div>
    )
  }

  if (detailQuery.isLoading) {
    return (
      <div className="notice-detail-page">
        <PageContentLoading variant="viewport" />
      </div>
    )
  }

  if (!notice) {
    return (
      <div className="notice-detail-page">
        <div className="notice-detail-page__inner">
          <div className="notice-detail-page__empty-wrap">
            <p className="notice-detail-page__empty" role="alert">
              공지를 찾을 수 없습니다.
            </p>
            <CmsButton variant="secondary" size="large" type="button" onClick={() => goList()}>
              목록
            </CmsButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <NoticeDetailView
      notice={notice}
      onList={() => goList()}
      onEdit={() => setEditOpen(true)}
      onDelete={() => setDeleteOpen(true)}
      editOpen={editOpen}
      onEditCancel={() => setEditOpen(false)}
      onEditSubmit={values => {
        void handleFormSubmit(values)
      }}
      editLoading={updateMutation.isPending}
      deleteOpen={deleteOpen}
      onDeleteCancel={() => setDeleteOpen(false)}
      onDeleteConfirm={() => {
        void handleDelete()
      }}
      deleteLoading={removeMutation.isPending}
    />
  )
}

type DetailViewProps = {
  notice: Notice
  onList: () => void
  onEdit: () => void
  onDelete: () => void
  editOpen: boolean
  onEditCancel: () => void
  onEditSubmit: (values: NoticeFormValues) => void
  editLoading: boolean
  deleteOpen: boolean
  onDeleteCancel: () => void
  onDeleteConfirm: () => void
  deleteLoading: boolean
}

function MetaDivider() {
  return <span className="notice-detail-page__meta-divider" aria-hidden />
}

function NoticeDetailView({
  notice,
  onList,
  onEdit,
  onDelete,
  editOpen,
  onEditCancel,
  onEditSubmit,
  editLoading,
  deleteOpen,
  onDeleteCancel,
  onDeleteConfirm,
  deleteLoading,
}: DetailViewProps) {
  const handleAttachmentClick = useCallback((name: string, url?: string) => {
    downloadFile(name, url)
  }, [])

  const hasAttachments = notice.attachments.length > 0

  return (
    <div className="notice-detail-page">
      <NoticeFormModal
        open={editOpen}
        mode="edit"
        initial={notice}
        confirmLoading={editLoading}
        deleteLoading={deleteLoading}
        onCancel={onEditCancel}
        onSubmit={onEditSubmit}
        onDelete={() => {
          onEditCancel()
          onDelete()
        }}
      />
      <ConfirmModal
        open={deleteOpen}
        title="공지사항 삭제"
        content="이 공지사항을 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        danger
        confirmLoading={deleteLoading}
        onCancel={onDeleteCancel}
        onConfirm={onDeleteConfirm}
      />

      <div className="notice-detail-page__inner">
        <p className="notice-detail-page__hint">
          * 작성일은 어드민 화면에서만 노출되며, 홈페이지에서는 게시일만 노출됩니다.
        </p>

        <div className="notice-detail-page__card">
          <div className="notice-detail-page__top-row">
            <span
              className={
                notice.isPublic
                  ? 'notice-detail-page__badge notice-detail-page__badge--public'
                  : 'notice-detail-page__badge notice-detail-page__badge--private'
              }
            >
              {notice.isPublic ? '공개' : '비공개'}
            </span>
            <span className="notice-detail-page__views">
              <EyeOutlined className="notice-detail-page__views-icon" aria-hidden />
              {notice.viewCount.toLocaleString('ko-KR')}
            </span>
          </div>

          <h1 className="notice-detail-page__title">
            {notice.isPinned ? (
              <NoticePinnedIcon className="notice-detail-page__title-pin" size={20} />
            ) : null}
            <span className="notice-detail-page__title-text">{notice.title}</span>
          </h1>

          <div className="notice-detail-page__meta">
            <span className="notice-detail-page__meta-text">
              작성일 : {formatMetaDate(notice.createdAt)}
            </span>
            <MetaDivider />
            <span className="notice-detail-page__meta-text">
              게시일 : {formatMetaDate(notice.publishedAt)}
            </span>
            <MetaDivider />
            <span className="notice-detail-page__meta-text">{notice.authorName}</span>
          </div>

          {hasAttachments ? (
            <div className="notice-detail-page__attachments">
              <div className="notice-detail-page__attachments-head">
                <PaperClipOutlined className="notice-detail-page__clip" aria-hidden />
                <span>첨부파일</span>
              </div>
              <ul className="notice-detail-page__attachments-list">
                {notice.attachments.map(item => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="notice-detail-page__file"
                      onClick={() => handleAttachmentClick(item.name, item.dataUrl)}
                    >
                      <span className="notice-detail-page__file-name">{item.name}</span>
                      <AttachmentDownloadIcon className="notice-detail-page__file-icon" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <hr className="notice-detail-page__section-divider" />
          )}

          <div className="notice-detail-page__body">
            <RichTextViewer
              content={notice.contentMarkdown}
              contentFormat={resolveNoticeBodyFormat(notice.contentMarkdown)}
            />
          </div>
        </div>

        <div className="notice-detail-page__actions">
          <CmsButton variant="secondary" size="large" type="button" onClick={onList}>
            목록
          </CmsButton>
          <div className="notice-detail-page__actions-right">
            <CmsButton variant="delete" size="large" type="button" onClick={onDelete}>
              삭제
            </CmsButton>
            <CmsButton variant="primary" size="large" type="button" onClick={onEdit}>
              수정
            </CmsButton>
          </div>
        </div>
      </div>
    </div>
  )
}
