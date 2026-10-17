/**
 * 채용공고 상세
 * 공지사항 상세 페이지 레이아웃·타이포 미러 + 시안(상태 배지·모집기간·조회수)
 * @see apps/admin/src/pages/ja-korea/notices/detail-page.tsx
 */

import { useCallback, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { EyeOutlined, PaperClipOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import type { RecruitPosting, RecruitPostingStatus } from '@/entities/recruit-posting/model/types'
import {
  useRecruitPostingDetail,
  useRemoveRecruitPostings,
  useUpdateRecruitPosting,
} from '@/features/recruit-posting/api/hooks'
import { recruitPostingQueryKeys } from '@/features/recruit-posting/api/query-keys'
import { RECRUIT_POSTINGS_CHANGED_EVENT } from '@/features/recruit-posting/api/store'
import {
  RecruitPostingFormModal,
  type RecruitPostingFormValues,
} from '@/features/recruit-posting/ui/posting-form-modal'
import { formatKoreanYearMonthDayWithWeekday } from '@/shared/lib/format-display'
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

dayjs.locale('ko')

const STATUS_LABEL: Record<RecruitPostingStatus, string> = {
  recruiting: '모집중',
  result: '결과발표',
  closed: '모집완료',
}

function formatMetaDateTime(value: string | undefined | null): string {
  if (!value) return '-'
  const d = dayjs(value)
  if (!d.isValid()) return '-'
  return d.format('YYYY년 M월 D일 HH:mm:ss')
}

function formatRecruitPeriod(start: string, end: string): string {
  if (!start || !end) return '-'
  const s = dayjs(start)
  const e = dayjs(end)
  if (!s.isValid() || !e.isValid()) return '-'
  return `${formatKoreanYearMonthDayWithWeekday(s)} ~ ${formatKoreanYearMonthDayWithWeekday(e)}`
}

function resolveBodyFormat(content: string): 'markdown' | 'html' {
  return content.trim().startsWith('<') ? 'html' : 'markdown'
}

export function RecruitPostingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { showAlert } = useCmsAlert()

  const detailQuery = useRecruitPostingDetail(id)
  const updateMutation = useUpdateRecruitPosting()
  const removeMutation = useRemoveRecruitPostings()

  useInvalidateOnWindowEvent(RECRUIT_POSTINGS_CHANGED_EVENT, recruitPostingQueryKeys.all)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const posting = detailQuery.data ?? null

  const goList = useCallback(
    (replace = false) => {
      navigate({ pathname: '/ja-korea/recruit/postings', search: location.search }, { replace })
    },
    [navigate, location.search],
  )

  const handleDelete = useCallback(async () => {
    if (!id) return
    try {
      await removeMutation.mutateAsync([id])
      goList(true)
    } catch {
      setDeleteOpen(false)
      showAlert({
        title: '삭제 실패',
        content: '채용공고 삭제에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [goList, id, removeMutation, showAlert])

  const handleFormSubmit = useCallback(
    async (values: RecruitPostingFormValues) => {
      if (!id) return
      try {
        await updateMutation.mutateAsync({ ...values, id })
        setEditOpen(false)
        void detailQuery.refetch()
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : '채용공고 저장에 실패했습니다. 다시 시도해 주세요.'
        showAlert({ title: '저장 실패', content: message })
      }
    },
    [detailQuery, id, showAlert, updateMutation],
  )

  if (removeMutation.isSuccess || (removeMutation.isPending && !posting)) {
    return (
      <div className="recruit-posting-detail-page">
        <PageContentLoading variant="viewport" />
      </div>
    )
  }

  if (detailQuery.isLoading) {
    return (
      <div className="recruit-posting-detail-page">
        <PageContentLoading variant="viewport" />
      </div>
    )
  }

  if (!posting) {
    return (
      <div className="recruit-posting-detail-page">
        <div className="recruit-posting-detail-page__inner">
          <div className="recruit-posting-detail-page__empty-wrap">
            <p className="recruit-posting-detail-page__empty" role="alert">
              채용공고를 찾을 수 없습니다.
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
    <RecruitPostingDetailView
      posting={posting}
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
  posting: RecruitPosting
  onList: () => void
  onEdit: () => void
  onDelete: () => void
  editOpen: boolean
  onEditCancel: () => void
  onEditSubmit: (values: RecruitPostingFormValues) => void
  editLoading: boolean
  deleteOpen: boolean
  onDeleteCancel: () => void
  onDeleteConfirm: () => void
  deleteLoading: boolean
}

function MetaDivider() {
  return <span className="recruit-posting-detail-page__meta-divider" aria-hidden />
}

function RecruitPostingDetailView({
  posting,
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

  const hasAttachments = posting.attachments.length > 0

  return (
    <div className="recruit-posting-detail-page">
      <RecruitPostingFormModal
        open={editOpen}
        mode="edit"
        initial={posting}
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
        title="채용공고 삭제"
        content="이 채용공고를 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        danger
        confirmLoading={deleteLoading}
        onCancel={onDeleteCancel}
        onConfirm={onDeleteConfirm}
      />

      <div className="recruit-posting-detail-page__inner">
        <p className="recruit-posting-detail-page__hint">
          * 작성일은 어드민 화면에서만 노출되며, 홈페이지에서는 게시일만 노출됩니다.
        </p>

        <div className="recruit-posting-detail-page__card">
          <div className="recruit-posting-detail-page__top-row">
            <div className="recruit-posting-detail-page__top-left">
              <span
                className={`recruit-posting-detail-page__badge recruit-posting-detail-page__badge--${posting.status}`}
              >
                {STATUS_LABEL[posting.status]}
              </span>
              <span className="recruit-posting-detail-page__period">
                {formatRecruitPeriod(posting.recruitStart, posting.recruitEnd)}
              </span>
            </div>
            <span className="recruit-posting-detail-page__views">
              <EyeOutlined className="recruit-posting-detail-page__views-icon" aria-hidden />
              {posting.viewCount.toLocaleString('ko-KR')}
            </span>
          </div>

          <h1 className="recruit-posting-detail-page__title">{posting.title || '-'}</h1>

          <div className="recruit-posting-detail-page__meta">
            <span className="recruit-posting-detail-page__meta-text">
              작성일 : {formatMetaDateTime(posting.createdAt)}
            </span>
            <MetaDivider />
            <span className="recruit-posting-detail-page__meta-text">
              게시일 : {formatMetaDateTime(posting.publishedAt)}
            </span>
            <MetaDivider />
            <span className="recruit-posting-detail-page__meta-text">
              {posting.authorName.trim() || '-'}
            </span>
          </div>

          {hasAttachments ? (
            <div className="recruit-posting-detail-page__attachments">
              <div className="recruit-posting-detail-page__attachments-head">
                <PaperClipOutlined className="recruit-posting-detail-page__clip" aria-hidden />
                <span>첨부파일</span>
              </div>
              <ul className="recruit-posting-detail-page__attachments-list">
                {posting.attachments.map(item => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="recruit-posting-detail-page__file"
                      onClick={() => handleAttachmentClick(item.name, item.dataUrl)}
                    >
                      <span className="recruit-posting-detail-page__file-name">{item.name}</span>
                      <AttachmentDownloadIcon className="recruit-posting-detail-page__file-icon" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <hr className="recruit-posting-detail-page__section-divider" />
          )}

          <div className="recruit-posting-detail-page__body">
            {posting.contentMarkdown.trim() ? (
              <RichTextViewer
                content={posting.contentMarkdown}
                contentFormat={resolveBodyFormat(posting.contentMarkdown)}
              />
            ) : (
              <p className="recruit-posting-detail-page__body-empty">등록된 내용이 없습니다.</p>
            )}
          </div>
        </div>

        <div className="recruit-posting-detail-page__actions">
          <CmsButton variant="secondary" size="large" type="button" onClick={onList}>
            목록
          </CmsButton>
          <div className="recruit-posting-detail-page__actions-right">
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
