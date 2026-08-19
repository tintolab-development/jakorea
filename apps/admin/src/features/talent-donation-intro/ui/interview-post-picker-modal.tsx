/**
 * 재능기부 인터뷰 게시글 선택 팝업 (3-3)
 * 채용 안내 직무 인터뷰 선택과 동일 UI — 임팩트 스토리에서 검색·선택
 */

import { useCallback, useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { ImpactStory, ImpactStoryListFilter } from '@/entities/impact-stories/model/types'
import { useImpactStoriesList } from '@/features/impact-stories/api/hooks'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_SEARCH_BUTTON_WIDTH_PX,
} from '@/shared/constants/filter-field-width'
import { CmsButton, CmsInput, CmsSelect, ContentModal } from '@/shared/ui'

import './interview-post-picker-modal.css'

type Props = {
  open: boolean
  onCancel: () => void
  onSelect: (payload: { id: string; title: string; thumbnailUrl: string }) => void
}

function storyThumbnailUrl(story: ImpactStory): string {
  return story.attachments[0]?.dataUrl ?? ''
}

function publishedYear(iso: string): string {
  const y = iso.slice(0, 4)
  return /^\d{4}$/.test(y) ? y : '-'
}

function buildYearOptions(): { value: string; label: string }[] {
  const current = new Date().getFullYear()
  const years: { value: string; label: string }[] = []
  for (let y = current; y >= 2018; y -= 1) {
    years.push({ value: String(y), label: String(y) })
  }
  return years
}

const YEAR_OPTIONS = buildYearOptions()

const EMPTY_FILTER: ImpactStoryListFilter = { visibility: 'public' }

export function InterviewPostPickerModal({ open, onCancel, onSelect }: Props) {
  if (!open) return null
  return <PickerBody onCancel={onCancel} onSelect={onSelect} />
}

function PickerBody({
  onCancel,
  onSelect,
}: Pick<Props, 'onCancel' | 'onSelect'>) {
  const [pendingYear, setPendingYear] = useState('')
  const [pendingTitle, setPendingTitle] = useState('')
  const [applied, setApplied] = useState<ImpactStoryListFilter | null>(null)

  const listQuery = useImpactStoriesList(applied ?? EMPTY_FILTER, applied != null)
  const rows = useMemo(() => listQuery.data ?? [], [listQuery.data])

  const handleSearch = useCallback(() => {
    const year = pendingYear.trim()
    const title = pendingTitle.trim()
    const filter: ImpactStoryListFilter = { visibility: 'public' }
    if (year) {
      filter.publishedFrom = `${year}-01-01`
      filter.publishedTo = `${year}-12-31`
    }
    if (title) filter.title = title
    setApplied(filter)
  }, [pendingTitle, pendingYear])

  const columns = useMemo<ColumnsType<ImpactStory>>(
    () => [
      {
        title: '진행년도',
        key: 'year',
        width: 120,
        align: 'center',
        render: (_value, record) => publishedYear(record.publishedAt),
      },
      {
        title: '게시글 제목',
        dataIndex: 'title',
        key: 'title',
        align: 'left',
        ellipsis: true,
        render: (v: string) => v || '-',
      },
    ],
    []
  )

  return (
    <ContentModal
      open
      onCancel={onCancel}
      title="인터뷰 게시글 선택"
      size="medium"
      className="talent-intro-post-picker"
      footer={null}
    >
      <div className="admin-filter-area talent-intro-post-picker__filter">
        <div className="admin-filter-area__field admin-filter-area__field--control">
          <p className="admin-filter-area__label">게시년도</p>
          <CmsSelect
            inputSize="large"
            width={FILTER_CONTROL_MAX_WIDTH_PX}
            withAllOption
            value={pendingYear}
            placeholder="전체"
            options={YEAR_OPTIONS}
            onChange={v => setPendingYear(String(v ?? ''))}
          />
        </div>
        <div className="admin-filter-area__field admin-filter-area__field--control talent-intro-post-picker__title-field">
          <p className="admin-filter-area__label">게시글 제목</p>
          <CmsInput
            inputSize="large"
            width="100%"
            value={pendingTitle}
            placeholder="고정 노출할 게시글 제목을 입력하세요"
            onChange={e => setPendingTitle(e.target.value)}
            onPressEnter={handleSearch}
          />
        </div>
        <div className="admin-filter-area__actions">
          <CmsButton
            className="admin-filter-area__search-button"
            variant="primary"
            size="large"
            type="button"
            width={FILTER_SEARCH_BUTTON_WIDTH_PX}
            onClick={handleSearch}
          >
            검색
          </CmsButton>
        </div>
      </div>

      <Table<ImpactStory>
        className="cms-data-table talent-intro-post-picker__table"
        rowKey="id"
        loading={listQuery.isFetching}
        dataSource={applied ? rows : []}
        columns={columns}
        pagination={false}
        locale={{ emptyText: applied ? '검색 결과가 없습니다.' : '검색 조건을 입력한 뒤 검색해 주세요.' }}
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
    </ContentModal>
  )
}
