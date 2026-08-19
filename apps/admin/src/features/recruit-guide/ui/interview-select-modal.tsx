/**
 * 채용 안내 — 직무 인터뷰 게시글 선택 팝업
 */

import { useCallback, useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { ImpactStory, ImpactStoryListFilter } from '@/entities/impact-stories/model/types'
import { useImpactStoriesPagedList } from '@/features/impact-stories/api/hooks'
import type { InterviewSaveItem } from '@/entities/recruit-guide/model/types'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_SEARCH_BUTTON_WIDTH_PX,
} from '@/shared/constants/filter-field-width'
import { CmsButton, CmsInput, CmsSelect, ContentModal } from '@/shared/ui'

import './interview-select-modal.css'

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 16 }, (_, i) => {
  const year = CURRENT_YEAR - i
  return { label: `${year}년`, value: String(year) }
})

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="6.25" stroke="#9E9E9E" strokeWidth="1.5" />
      <path d="M13.5 13.5L17 17" stroke="#9E9E9E" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function yearRange(year: string): Pick<ImpactStoryListFilter, 'publishedFrom' | 'publishedTo'> {
  if (!year) return {}
  return {
    publishedFrom: `${year}-01-01`,
    publishedTo: `${year}-12-31`,
  }
}

function storyYear(story: ImpactStory): number {
  const y = Number(story.publishedAt.slice(0, 4))
  return Number.isFinite(y) ? y : CURRENT_YEAR
}

type Applied = {
  year: string
  title: string
  page: number
}

type Props = {
  open: boolean
  selectedStoryId?: string
  onCancel: () => void
  onSelect: (item: InterviewSaveItem) => void
}

export function InterviewSelectModal({ open, selectedStoryId, onCancel, onSelect }: Props) {
  const [pendingYear, setPendingYear] = useState('')
  const [pendingTitle, setPendingTitle] = useState('')
  const [applied, setApplied] = useState<Applied>({ year: '', title: '', page: 0 })

  const filter = useMemo<ImpactStoryListFilter>(
    () => ({
      title: applied.title.trim() || undefined,
      page: applied.page,
      ...yearRange(applied.year),
    }),
    [applied]
  )

  const listQuery = useImpactStoriesPagedList(filter, open)
  const pageData = listQuery.data
  const rows = pageData?.items ?? []
  const totalCount = pageData?.totalCount ?? 0
  const totalPages = pageData?.totalPages ?? 0
  const currentPage = (pageData?.page ?? applied.page) + 1

  const handleSearch = useCallback(() => {
    setApplied({
      year: pendingYear,
      title: pendingTitle.trim(),
      page: 0,
    })
  }, [pendingTitle, pendingYear])

  const handleSelect = useCallback(
    (story: ImpactStory) => {
      onSelect({
        storyId: story.id,
        title: story.title,
        publishedYear: storyYear(story),
      })
    },
    [onSelect]
  )

  const columns = useMemo<ColumnsType<ImpactStory>>(
    () => [
      {
        title: '진행년도',
        key: 'year',
        width: 140,
        align: 'center',
        render: (_value, record) => `${storyYear(record)}년`,
      },
      {
        title: '게시글 제목',
        dataIndex: 'title',
        key: 'title',
        align: 'center',
        ellipsis: true,
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
      className="recruit-guide-interview-modal"
      footer={null}
    >
      <div className="recruit-guide-interview-modal__search">
        <CmsSelect
          inputSize="large"
          width={FILTER_CONTROL_MAX_WIDTH_PX}
          placeholder="게시년도"
          withAllOption
          value={pendingYear || undefined}
          options={YEAR_OPTIONS}
          onChange={value => setPendingYear(value == null ? '' : String(value))}
        />
        <CmsInput
          className="recruit-guide-interview-modal__title-input"
          inputSize="large"
          width="100%"
          placeholder="고정 노출할 게시글 제목을 입력하세요"
          icon={<SearchIcon />}
          value={pendingTitle}
          onChange={e => setPendingTitle(e.target.value)}
          onPressEnter={handleSearch}
        />
        <CmsButton
          variant="primary"
          size="large"
          type="button"
          width={FILTER_SEARCH_BUTTON_WIDTH_PX}
          onClick={handleSearch}
        >
          검색
        </CmsButton>
      </div>

      {showEmpty ? (
        <div className="recruit-guide-interview-modal__empty" role="status">
          <p>검색 결과가 없습니다.</p>
          <p>검색 조건 및 검색어를 확인한 후 다시 시도해 주세요.</p>
        </div>
      ) : (
        <>
          <p className="recruit-guide-interview-modal__count">
            총 {totalCount.toLocaleString('ko-KR')}건
          </p>
          <Table<ImpactStory>
            className="cms-data-table recruit-guide-interview-modal__table"
            rowKey="id"
            loading={listQuery.isLoading}
            dataSource={rows}
            columns={columns}
            pagination={false}
            rowClassName={record =>
              record.id === selectedStoryId
                ? 'recruit-guide-interview-modal__row--selected'
                : ''
            }
            onRow={record => ({
              onClick: () => handleSelect(record),
              style: { cursor: 'pointer' },
            })}
            scroll={{ x: true }}
          />
          {totalPages > 0 ? (
            <div className="recruit-guide-interview-modal__pager">
              <button
                type="button"
                className="recruit-guide-interview-modal__pager-btn"
                disabled={applied.page <= 0}
                aria-label="이전 페이지"
                onClick={() =>
                  setApplied(prev => ({ ...prev, page: Math.max(0, prev.page - 1) }))
                }
              >
                ‹
              </button>
              <span className="recruit-guide-interview-modal__pager-status">
                <strong>{currentPage}</strong>
                {' / '}
                {totalPages}
              </span>
              <button
                type="button"
                className="recruit-guide-interview-modal__pager-btn"
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
