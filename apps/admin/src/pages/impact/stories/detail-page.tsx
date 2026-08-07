/**
 * 임팩트 스토리 상세
 * 공지사항 상세 페이지 스펙 정렬 + 카테고리 배지
 */

import { useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { EyeOutlined, PaperClipOutlined } from '@ant-design/icons'
import type { ImpactStory } from '@/entities/impact-stories/model/types'
import {
  useImpactStoryCategories,
  useImpactStoryDetail,
  usePinnedImpactStoryCount,
  useRemoveImpactStories,
  useUpdateImpactStory,
} from '@/features/impact-stories/api/hooks'
import { impactStoriesQueryKeys } from '@/features/impact-stories/api/query-keys'
import { IMPACT_STORIES_CHANGED_EVENT } from '@/features/impact-stories/api/store'
import { isPinLimitError } from '@/features/impact-stories/lib/pin-limits'
import {
  StoryFormModal,
  type StoryFormValues,
} from '@/features/impact-stories/ui/story-form-modal'
import { StoryPinnedIcon } from '@/features/impact-stories/ui/story-pin-icon'
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

export function ImpactStoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { showAlert } = useCmsAlert()

  const detailQuery = useImpactStoryDetail(id)
  const categoriesQuery = useImpactStoryCategories()
  const updateMutation = useUpdateImpactStory()
  const removeMutation = useRemoveImpactStories()
  const pinCountQuery = usePinnedImpactStoryCount(id)

  useInvalidateOnWindowEvent(IMPACT_STORIES_CHANGED_EVENT, impactStoriesQueryKeys.all)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const story = detailQuery.data ?? null
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data])
  const categoryName = useMemo(() => {
    if (!story) return ''
    return categories.find(c => c.id === story.categoryId)?.name ?? ''
  }, [categories, story])

  const goList = useCallback(() => {
    navigate({ pathname: '/impact/stories', search: location.search })
  }, [navigate, location.search])

  const handleDelete = useCallback(async () => {
    if (!id) return
    try {
      await removeMutation.mutateAsync([id])
      setDeleteOpen(false)
      goList()
    } catch {
      showAlert({
        title: '삭제 실패',
        content: '게시글 삭제에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [goList, id, removeMutation, showAlert])

  const handleFormSubmit = useCallback(
    async (values: StoryFormValues) => {
      if (!id) return
      try {
        await updateMutation.mutateAsync({ ...values, id })
        setEditOpen(false)
        void detailQuery.refetch()
      } catch (error) {
        if (isPinLimitError(error)) {
          showAlert({
            title: '상단 고정 제한',
            content: error.message,
          })
          return
        }
        showAlert({
          title: '저장 실패',
          content: '게시글 저장에 실패했습니다. 다시 시도해 주세요.',
        })
      }
    },
    [detailQuery, id, showAlert, updateMutation]
  )

  if (detailQuery.isLoading) {
    return (
      <div className="impact-story-detail-page">
        <PageContentLoading variant="viewport" />
      </div>
    )
  }

  if (!story) {
    return (
      <div className="impact-story-detail-page">
        <div className="impact-story-detail-page__inner">
          <div className="impact-story-detail-page__empty-wrap">
            <p className="impact-story-detail-page__empty" role="alert">
              게시글을 찾을 수 없습니다.
            </p>
            <CmsButton variant="secondary" size="large" type="button" onClick={goList}>
              목록
            </CmsButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ImpactStoryDetailView
      story={story}
      categoryName={categoryName}
      categories={categories}
      pinnedCountExcludingSelf={pinCountQuery.data ?? 0}
      onList={goList}
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
  story: ImpactStory
  categoryName: string
  categories: import('@/entities/impact-stories/model/types').ImpactStoryCategory[]
  pinnedCountExcludingSelf: number
  onList: () => void
  onEdit: () => void
  onDelete: () => void
  editOpen: boolean
  onEditCancel: () => void
  onEditSubmit: (values: StoryFormValues) => void
  editLoading: boolean
  deleteOpen: boolean
  onDeleteCancel: () => void
  onDeleteConfirm: () => void
  deleteLoading: boolean
}

function MetaDivider() {
  return <span className="impact-story-detail-page__meta-divider" aria-hidden />
}

function ImpactStoryDetailView({
  story,
  categoryName,
  categories,
  pinnedCountExcludingSelf,
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

  const hasAttachments = story.attachments.length > 0

  return (
    <div className="impact-story-detail-page">
      <StoryFormModal
        open={editOpen}
        mode="edit"
        initial={story}
        categories={categories}
        pinnedCountExcludingSelf={pinnedCountExcludingSelf}
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
        title="게시글 삭제"
        content="이 게시글을 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        danger
        confirmLoading={deleteLoading}
        onCancel={onDeleteCancel}
        onConfirm={onDeleteConfirm}
      />

      <div className="impact-story-detail-page__inner">
        <p className="impact-story-detail-page__hint">
          * 작성일은 어드민 화면에서만 노출되며, 홈페이지에서는 게시일만 노출됩니다.
        </p>

        <div className="impact-story-detail-page__card">
          <div className="impact-story-detail-page__top-row">
            <div className="impact-story-detail-page__top-badges">
              <span
                className={
                  story.isPublic
                    ? 'impact-story-detail-page__badge impact-story-detail-page__badge--public'
                    : 'impact-story-detail-page__badge impact-story-detail-page__badge--private'
                }
              >
                {story.isPublic ? '공개' : '비공개'}
              </span>
              {categoryName ? (
                <span className="impact-story-detail-page__badge impact-story-detail-page__badge--category">
                  {categoryName}
                </span>
              ) : null}
            </div>
            <span className="impact-story-detail-page__views">
              <EyeOutlined className="impact-story-detail-page__views-icon" aria-hidden />
              {story.viewCount.toLocaleString('ko-KR')}
            </span>
          </div>

          <h1 className="impact-story-detail-page__title">
            {story.isPinned ? (
              <StoryPinnedIcon className="impact-story-detail-page__title-pin" size={20} />
            ) : null}
            <span className="impact-story-detail-page__title-text">{story.title}</span>
          </h1>

          <div className="impact-story-detail-page__meta">
            <span className="impact-story-detail-page__meta-text">
              작성일 : {formatMetaDate(story.createdAt)}
            </span>
            <MetaDivider />
            <span className="impact-story-detail-page__meta-text">
              게시일 : {formatMetaDate(story.publishedAt)}
            </span>
            <MetaDivider />
            <span className="impact-story-detail-page__meta-text">{story.authorName}</span>
          </div>

          {hasAttachments ? (
            <div className="impact-story-detail-page__attachments">
              <div className="impact-story-detail-page__attachments-head">
                <PaperClipOutlined
                  className="impact-story-detail-page__clip"
                  aria-hidden
                />
                <span>첨부파일</span>
              </div>
              <ul className="impact-story-detail-page__attachments-list">
                {story.attachments.map(item => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="impact-story-detail-page__file"
                      onClick={() => handleAttachmentClick(item.name, item.dataUrl)}
                    >
                      <span className="impact-story-detail-page__file-name">
                        {item.name}
                      </span>
                      <AttachmentDownloadIcon className="impact-story-detail-page__file-icon" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <hr className="impact-story-detail-page__section-divider" />
          )}

          <div className="impact-story-detail-page__body">
            <RichTextViewer content={story.contentMarkdown} contentFormat="markdown" />
          </div>
        </div>

        <div className="impact-story-detail-page__actions">
          <CmsButton variant="secondary" size="large" type="button" onClick={onList}>
            목록
          </CmsButton>
          <div className="impact-story-detail-page__actions-right">
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
