/**
 * 재능기부 인터뷰 게시글 선택 팝업 (3-3)
 * Figma popup / search / w800 — 임팩트 스토리 검색·선택
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type { ColumnsType } from 'antd/es/table'
import type { ImpactStory, ImpactStoryListFilter } from '@/entities/impact-stories/model/types'
import { useImpactStoriesPagedList } from '@/features/impact-stories/api/hooks'
import { CmsButton, CmsInput, CmsSelect, ContentModal } from '@/shared/ui'

import './interview-post-picker-modal.css'

/** Figma Field / Sorting / M — 게시년도 셀렉트 */
const YEAR_SELECT_WIDTH_PX = 140

type Applied = {
  year: string
  title: string
  page: number
}

type Props = {
  open: boolean
  onCancel: () => void
  onSelect: (payload: { id: string; title: string; thumbnailUrl: string }) => void
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <circle cx="9" cy="9" r="6.25" stroke="#9E9E9E" strokeWidth="1.5" />
      <path d="M13.5 13.5L17 17" stroke="#9E9E9E" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function storyThumbnailUrl(story: ImpactStory): string {
  return story.thumbnail?.dataUrl ?? ''
}

function yearRange(year: string): Pick<ImpactStoryListFilter, 'publishedFrom' | 'publishedTo'> {
  if (!year) return {}
  return {
    publishedFrom: `${year}-01-01`,
    publishedTo: `${year}-12-31`,
  }
}

function storyPublishedYear(story: ImpactStory): string {
  const y = story.publishedAt.slice(0, 4)
  return /^\d{4}$/.test(y) ? y : '-'
}

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 16 }, (_, i) => {
  const year = CURRENT_YEAR - i
  return { label: `${year}년`, value: String(year) }
})

export function InterviewPostPickerModal({ open, onCancel, onSelect }: Props) {
  const [pendingYear, setPendingYear] = useState('')
  const [pendingTitle, setPendingTitle] = useState('')
  const [applied, setApplied] = useState<Applied>({ year: '', title: '', page: 0 })
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    if (!open) return
    setPendingYear('')
    setPendingTitle('')
    setApplied({ year: '', title: '', page: 0 })
    setHasSearched(false)
  }, [open])

  const filter = useMemo<ImpactStoryListFilter>(
    () => ({
      visibility: 'public',
      title: applied.title.trim() || undefined,
      page: applied.page,
      ...yearRange(applied.year),
    }),
    [applied]
  )

  const listQuery = useImpactStoriesPagedList(filter, open && hasSearched)
  const pageData = listQuery.data
  const rows = pageData?.items ?? []
  const totalCount = pageData?.totalCount ?? 0
  const totalPages = pageData?.totalPages ?? 0
  const currentPage = (pageData?.page ?? applied.page) + 1

  const handleSearch = useCallback(() => {
    setHasSearched(true)
    setApplied({
      year: pendingYear,
      title: pendingTitle.trim(),
      page: 0,
    })
  }, [pendingTitle, pendingYear])

  const columns = useMemo<ColumnsType<ImpactStory>>(
    () => [
      {
        title: '게시년도',
        key: 'year',
        width: 160,
        align: 'center',
        className: 'talent-intro-post-picker__year-col',
        render: (_value, record) => storyPublishedYear(record),
      },
      {
        title: '게시글 제목',
        dataIndex: 'title',
        key: 'title',
        align: 'center',
        ellipsis: true,
        render: (v: string) => v || '-',
      },
    ],
    []
  )

  if (!open) return null

  const showEmpty = !listQuery.isLoading && totalCount === 0

  return (
    <ContentModal
      open
      onCancel={onCancel}
      title="인터뷰 게시글 선택"
      width={800}
      className="talent-intro-post-picker"
      footer={null}
    >
      <div className="talent-intro-post-picker__search">
        <CmsSelect
          inputSize="medium"
          width={YEAR_SELECT_WIDTH_PX}
          placeholder="게시년도"
          withAllOption={false}
          allowClear={false}
          value={pendingYear || undefined}
          options={YEAR_OPTIONS}
          onChange={value => setPendingYear(value == null ? '' : String(value))}
        />
        <CmsInput
          className="talent-intro-post-picker__title-input"
          inputSize="medium"
          width="100%"
          placeholder="고정 노출할 게시글 제목을 입력해 주세요"
          icon={<SearchIcon />}
          value={pendingTitle}
          onChange={e => setPendingTitle(e.target.value)}
          onPressEnter={handleSearch}
        />
        <CmsButton variant="primary" size="h40" type="button" onClick={handleSearch}>
          검색
        </CmsButton>
      </div>

      {!hasSearched ? null : showEmpty ? (
        <div className="talent-intro-post-picker__empty" role="status">
          <p>검색 결과가 없습니다.</p>
          <p>검색 조건 및 검색어를 확인한 후 다시 시도해 주세요.</p>
        </div>
      ) : (
        <>
          <p className="talent-intro-post-picker__count">
            총 {totalCount.toLocaleString('ko-KR')}건
          </p>
          <CmsDataTable<ImpactStory>
            className="cms-data-table cms-data-table--skip-auto-no-col talent-intro-post-picker__table"
            rowKey="id"
            loading={listQuery.isLoading}
            dataSource={rows}
            columns={columns}
            pagination={false}
            onRow={record => ({
              onClick: () => {
                onSelect({
                  id: record.id,
                  title: record.title,
                  thumbnailUrl: storyThumbnailUrl(record),
                })
              },
              style: { cursor: 'pointer' },
            })}
            scroll={{ x: true }}
          />
          {totalPages > 0 ? (
            <div className="talent-intro-post-picker__pager">
              <button
                type="button"
                className="talent-intro-post-picker__pager-btn"
                disabled={applied.page <= 0}
                aria-label="이전 페이지"
                onClick={() => setApplied(prev => ({ ...prev, page: Math.max(0, prev.page - 1) }))}
              >
                ‹
              </button>
              <span className="talent-intro-post-picker__pager-status">
                <strong>{currentPage}</strong>
                {' / '}
                {totalPages}
              </span>
              <button
                type="button"
                className="talent-intro-post-picker__pager-btn"
                disabled={applied.page + 1 >= totalPages}
                aria-label="다음 페이지"
                onClick={() =>
                  setApplied(prev => ({
                    ...prev,
                    page: Math.min(totalPages - 1, prev.page + 1),
                  }))
                }
              >
                ›
              </button>
            </div>
          ) : null}
        </>
      )}
    </ContentModal>
  )
}
