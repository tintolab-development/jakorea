/**
 * 임팩트 스토리 목록
 */

import { useCallback, useMemo, useState, type Key } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import dayjs, { type Dayjs } from 'dayjs'
import { Switch, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type {
  ImpactStory,
  ImpactStoryListFilter,
} from '@/entities/impact-stories/model/types'
import {
  useCreateImpactStory,
  useImpactStoriesList,
  useImpactStoryCategories,
  usePinnedImpactStoryCount,
  useRemoveImpactStories,
  useSaveImpactStoryCategories,
  useSetImpactStoryPublic,
  useUpdateImpactStory,
} from '@/features/impact-stories/api/hooks'
import { impactStoriesQueryKeys } from '@/features/impact-stories/api/query-keys'
import { IMPACT_STORIES_CHANGED_EVENT } from '@/features/impact-stories/api/store'
import { isPinLimitError } from '@/features/impact-stories/lib/pin-limits'
import { CategoryManagementModal } from '@/features/impact-stories/ui/category-management-modal'
import {
  StoryFormModal,
  type StoryFormValues,
} from '@/features/impact-stories/ui/story-form-modal'
import { StoryPinnedIcon } from '@/features/impact-stories/ui/story-pin-icon'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
  FILTER_SEARCH_BUTTON_WIDTH_PX,
} from '@/shared/constants/filter-field-width'
import { CMS_TABLE_NO_COL_CLASS, CMS_TABLE_USAGE_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { isTableSelectionClick } from '@/shared/lib/is-table-selection-click'
import { useInvalidateOnWindowEvent } from '@/shared/lib/use-invalidate-on-window-event'
import { useListFilterUrl } from '@/shared/lib/use-list-filter-url'
import type { TableSearchParamRule } from '@/shared/lib/use-table-search'
import {
  applyDateRangeToSearchParams,
  pendingDateRangeTupleEqual,
  resolvePendingDateRangeFromUrl,
  type PendingDateRange,
  type UrlDateRangePendingSyncRef,
} from '@/shared/lib/url-date-range-pending-sync'
import {
  CmsButton,
  CmsDateRangePicker,
  CmsInput,
  CmsSelect,
  ConfirmModal,
  useCmsAlert,
} from '@/shared/ui'

import './page.css'

type VisibilityPending = '' | 'public' | 'private'

type StoryPendingFilters = {
  visibility: VisibilityPending
  categoryId: string
  title: string
  authorName: string
  publishedRange: PendingDateRange
  createdRange: PendingDateRange
}

const INITIAL_PENDING: StoryPendingFilters = {
  visibility: '',
  categoryId: '',
  title: '',
  authorName: '',
  publishedRange: null,
  createdRange: null,
}

const publishedSyncRef: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }
const createdSyncRef: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }

function parseVisibility(raw: string | null): VisibilityPending {
  if (raw === 'public' || raw === 'private') return raw
  return ''
}

function parseApplied(searchParams: URLSearchParams): ImpactStoryListFilter {
  const filter: ImpactStoryListFilter = {}
  const visibility = parseVisibility(searchParams.get('is_vis'))
  if (visibility === 'public' || visibility === 'private') {
    filter.visibility = visibility
  }
  const categoryId = (searchParams.get('is_cat') ?? '').trim()
  if (categoryId) filter.categoryId = categoryId
  const title = (searchParams.get('is_title') ?? '').trim()
  if (title) filter.title = title
  const authorName = (searchParams.get('is_author') ?? '').trim()
  if (authorName) filter.authorName = authorName
  const pubFrom = searchParams.get('is_pub_from')
  const pubTo = searchParams.get('is_pub_to')
  if (pubFrom) filter.publishedFrom = pubFrom
  if (pubTo) filter.publishedTo = pubTo
  const creFrom = searchParams.get('is_cre_from')
  const creTo = searchParams.get('is_cre_to')
  if (creFrom) filter.createdFrom = creFrom
  if (creTo) filter.createdTo = creTo
  return filter
}

const searchSyncRules: readonly TableSearchParamRule<StoryPendingFilters>[] = [
  {
    kind: 'param',
    filterKey: 'visibility',
    paramKey: 'is_vis',
    condition: f => f.visibility === 'public' || f.visibility === 'private',
  },
  {
    kind: 'param',
    filterKey: 'categoryId',
    paramKey: 'is_cat',
    condition: f => f.categoryId.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'title',
    paramKey: 'is_title',
    condition: f => f.title.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'authorName',
    paramKey: 'is_author',
    condition: f => f.authorName.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'apply',
    apply: (nextParams, f) => {
      applyDateRangeToSearchParams(nextParams, f.publishedRange, 'is_pub_from', 'is_pub_to')
      applyDateRangeToSearchParams(nextParams, f.createdRange, 'is_cre_from', 'is_cre_to')
    },
  },
]

function rangeAsPicker(period: PendingDateRange): [Dayjs | null, Dayjs | null] {
  if (!period) return [null, null]
  return [period[0] ?? null, period[1] ?? null]
}

function formatDateTime(iso: string): string {
  const d = dayjs(iso)
  if (!d.isValid()) return '-'
  return d.format('YYYY.MM.DD HH:mm')
}

export function ImpactStoriesPage() {
  const { showAlert } = useCmsAlert()
  const navigate = useNavigate()
  const location = useLocation()

  const {
    pendingFilters,
    setPendingFilters,
    applied: appliedFilter,
    applySearch,
  } = useListFilterUrl<StoryPendingFilters, ImpactStoryListFilter>({
    initialPending: INITIAL_PENDING,
    paramConfig: searchSyncRules,
    parseApplied,
    syncPendingFromUrl: ({ searchParams, setPendingFilters: setPending }) => {
      const visibility = parseVisibility(searchParams.get('is_vis'))
      const categoryId = searchParams.get('is_cat') ?? ''
      const title = searchParams.get('is_title') ?? ''
      const authorName = searchParams.get('is_author') ?? ''
      const pubFrom = searchParams.get('is_pub_from')
      const pubTo = searchParams.get('is_pub_to')
      const creFrom = searchParams.get('is_cre_from')
      const creTo = searchParams.get('is_cre_to')

      setPending(prev => {
        const publishedRange = resolvePendingDateRangeFromUrl({
          ref: publishedSyncRef,
          from: pubFrom,
          to: pubTo,
          prev: prev.publishedRange,
        }) as PendingDateRange
        const createdRange = resolvePendingDateRangeFromUrl({
          ref: createdSyncRef,
          from: creFrom,
          to: creTo,
          prev: prev.createdRange,
        }) as PendingDateRange

        const next: StoryPendingFilters = {
          visibility,
          categoryId,
          title,
          authorName,
          publishedRange,
          createdRange,
        }
        if (
          prev.visibility === next.visibility &&
          prev.categoryId === next.categoryId &&
          prev.title === next.title &&
          prev.authorName === next.authorName &&
          pendingDateRangeTupleEqual(prev.publishedRange, next.publishedRange) &&
          pendingDateRangeTupleEqual(prev.createdRange, next.createdRange)
        ) {
          return prev
        }
        return next
      })
    },
  })

  const listQuery = useImpactStoriesList(appliedFilter)
  const categoriesQuery = useImpactStoryCategories()
  const allStoriesQuery = useImpactStoriesList({})
  const createMutation = useCreateImpactStory()
  const updateMutation = useUpdateImpactStory()
  const removeMutation = useRemoveImpactStories()
  const setPublicMutation = useSetImpactStoryPublic()
  const saveCategoriesMutation = useSaveImpactStoryCategories()
  const pinCountQuery = usePinnedImpactStoryCount(undefined)

  // lists만 — all이면 공개 토글 시 categories GET까지 과호출됨
  useInvalidateOnWindowEvent(IMPACT_STORIES_CHANGED_EVENT, impactStoriesQueryKeys.lists())

  const rows = useMemo(() => listQuery.data ?? [], [listQuery.data])
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data])
  const allStories = useMemo(() => allStoriesQuery.data ?? [], [allStoriesQuery.data])
  const categoryNameMap = useMemo(
    () => new Map(categories.map(c => [c.id, c.name])),
    [categories]
  )

  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<ImpactStory | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)

  const rowNoMap = useMemo(() => {
    const map = new Map<string, number>()
    const nonPinned = rows.filter(r => !r.isPinned)
    const totalNonPinned = nonPinned.length
    for (const row of rows) {
      if (row.isPinned) continue
      const idx = nonPinned.findIndex(r => r.id === row.id)
      map.set(row.id, totalNonPinned - idx)
    }
    return map
  }, [rows])

  const handleSearch = useCallback(() => {
    applySearch()
    setSelectedRowKeys([])
  }, [applySearch])

  const openCreate = useCallback(() => {
    setFormMode('create')
    setEditing(null)
    setFormOpen(true)
  }, [])

  const goDetail = useCallback(
    (story: ImpactStory) => {
      navigate(`/impact/stories/${story.id}${location.search}`)
    },
    [navigate, location.search]
  )

  const handleTogglePublic = useCallback(
    (id: string, isPublic: boolean) => {
      void setPublicMutation.mutateAsync({ id, isPublic }).catch(() => {
        showAlert({
          title: '공개 여부 변경 실패',
          content: '공개 여부를 변경하지 못했습니다. 다시 시도해 주세요.',
        })
        void listQuery.refetch()
      })
    },
    [listQuery, setPublicMutation, showAlert]
  )

  const handleBulkDeleteClick = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      showAlert({
        title: '항목 선택',
        content: '선택된 항목이 없습니다.',
      })
      return
    }
    setBulkDeleteOpen(true)
  }, [selectedRowKeys.length, showAlert])

  const handleBulkDeleteConfirm = useCallback(async () => {
    try {
      await removeMutation.mutateAsync(selectedRowKeys.map(String))
      setSelectedRowKeys([])
      setBulkDeleteOpen(false)
    } catch {
      showAlert({
        title: '삭제 실패',
        content: '게시글 삭제에 실패했습니다. 다시 시도해 주세요.',
      })
      void listQuery.refetch()
    }
  }, [listQuery, removeMutation, selectedRowKeys, showAlert])

  const handleFormSubmit = useCallback(
    async (values: StoryFormValues) => {
      try {
        if (formMode === 'edit' && editing) {
          await updateMutation.mutateAsync({ ...values, id: editing.id })
        } else {
          await createMutation.mutateAsync(values)
        }
        setFormOpen(false)
        setEditing(null)
      } catch (error) {
        if (isPinLimitError(error)) {
          showAlert({
            title: '상단 고정 제한',
            content: error.message,
          })
          return
        }
        showAlert({
          title: formMode === 'edit' ? '저장 실패' : '등록 실패',
          content: '요청을 처리하지 못했습니다. 다시 시도해 주세요.',
        })
      }
    },
    [createMutation, editing, formMode, showAlert, updateMutation]
  )

  const formLoading = createMutation.isPending || updateMutation.isPending
  const pinnedExcludingSelf =
    formMode === 'edit' && editing?.isPinned
      ? Math.max(0, (pinCountQuery.data ?? 0) - 1)
      : (pinCountQuery.data ?? 0)

  const columns: ColumnsType<ImpactStory> = useMemo(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COLUMN_WIDTHS.index,
        className: CMS_TABLE_NO_COL_CLASS,
        render: (_, row) => (row.isPinned ? '공지' : (rowNoMap.get(row.id) ?? '-')),
      },
      {
        title: '공개 여부',
        dataIndex: 'isPublic',
        key: 'isPublic',
        width: TABLE_COLUMN_WIDTHS.usage,
        className: CMS_TABLE_USAGE_COL_CLASS,
        render: (value: boolean, row) => (
          <Switch
            checked={value}
            onClick={(_, e) => e.stopPropagation()}
            onChange={checked => {
              handleTogglePublic(row.id, checked)
            }}
          />
        ),
      },
      {
        title: '카테고리',
        dataIndex: 'categoryId',
        key: 'categoryId',
        width: 120,
        render: (id: string, row: ImpactStory) =>
          categoryNameMap.get(id) ?? row.categoryName ?? '-',
      },
      {
        title: '제목',
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
        align: 'center',
        render: (value: string, row) => (
          <span
            className={
              row.isPinned
                ? 'impact-stories-page__title-cell impact-stories-page__title-cell--pinned'
                : 'impact-stories-page__title-cell'
            }
          >
            {row.isPinned ? (
              <StoryPinnedIcon className="impact-stories-page__pin" size={20} />
            ) : null}
            <span className="impact-stories-page__title-text">{value}</span>
          </span>
        ),
      },
      {
        title: '작성자명',
        dataIndex: 'authorName',
        key: 'authorName',
        width: 120,
      },
      {
        title: '게시일시',
        dataIndex: 'publishedAt',
        key: 'publishedAt',
        width: 150,
        render: (v: string) => formatDateTime(v),
      },
      {
        title: '작성일시',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 150,
        render: (v: string) => formatDateTime(v),
      },
      {
        title: '조회수',
        dataIndex: 'viewCount',
        key: 'viewCount',
        width: 110,
        align: 'right',
        render: (v: number) => v.toLocaleString('ko-KR'),
      },
    ],
    [categoryNameMap, handleTogglePublic, rowNoMap]
  )

  const categoryFilterOptions = useMemo(
    () => categories.map(c => ({ value: c.id, label: c.name })),
    [categories]
  )

  return (
    <div className="impact-stories-page">
      <div className="admin-list-card impact-stories-page__filter-card">
        <div className="admin-filter-area admin-filter-area--split impact-stories-page__filter">
          <div className="admin-filter-area__head">
            <div className="admin-filter-area__field admin-filter-area__field--control">
              <p className="admin-filter-area__label">공개 여부</p>
              <CmsSelect
                inputSize="large"
                width={FILTER_CONTROL_MAX_WIDTH_PX}
                withAllOption
                value={pendingFilters.visibility}
                placeholder="전체"
                options={[
                  { value: 'public', label: '공개' },
                  { value: 'private', label: '비공개' },
                ]}
                onChange={v =>
                  setPendingFilters(prev => ({
                    ...prev,
                    visibility: (v as VisibilityPending) || '',
                  }))
                }
              />
            </div>
            <div className="admin-filter-area__field admin-filter-area__field--control">
              <p className="admin-filter-area__label">카테고리</p>
              <CmsSelect
                inputSize="large"
                width={FILTER_CONTROL_MAX_WIDTH_PX}
                withAllOption
                value={pendingFilters.categoryId}
                placeholder="전체"
                options={categoryFilterOptions}
                onChange={v =>
                  setPendingFilters(prev => ({
                    ...prev,
                    categoryId: String(v ?? ''),
                  }))
                }
              />
            </div>
            <div className="admin-filter-area__field admin-filter-area__field--control">
              <p className="admin-filter-area__label">제목</p>
              <CmsInput
                inputSize="large"
                width={FILTER_CONTROL_MAX_WIDTH_PX}
                value={pendingFilters.title}
                placeholder="제목을 입력하세요"
                onChange={e =>
                  setPendingFilters(prev => ({ ...prev, title: e.target.value }))
                }
                onPressEnter={handleSearch}
              />
            </div>
            <div className="admin-filter-area__field admin-filter-area__field--control">
              <p className="admin-filter-area__label">작성자명</p>
              <CmsInput
                inputSize="large"
                width={FILTER_CONTROL_MAX_WIDTH_PX}
                value={pendingFilters.authorName}
                placeholder="작성자명을 입력하세요"
                onChange={e =>
                  setPendingFilters(prev => ({ ...prev, authorName: e.target.value }))
                }
                onPressEnter={handleSearch}
              />
            </div>
          </div>
          <div className="admin-filter-area__bottom">
            <div className="admin-filter-area__bottom-fields">
              <div className="admin-filter-area__field admin-filter-area__field--date-range">
                <p className="admin-filter-area__label">게시일</p>
                <CmsDateRangePicker
                  inputSize="large"
                  width={FILTER_CONTROL_WIDE_FIELD_WIDTH_PX}
                  value={rangeAsPicker(pendingFilters.publishedRange)}
                  placeholder={['시작일', '종료일']}
                  allowClear
                  onChange={dates => {
                    if (!dates || (!dates[0] && !dates[1])) {
                      setPendingFilters(prev => ({ ...prev, publishedRange: null }))
                      return
                    }
                    setPendingFilters(prev => ({
                      ...prev,
                      publishedRange: [dates[0] ?? null, dates[1] ?? null],
                    }))
                  }}
                />
              </div>
              <div className="admin-filter-area__field admin-filter-area__field--date-range">
                <p className="admin-filter-area__label">작성일</p>
                <CmsDateRangePicker
                  inputSize="large"
                  width={FILTER_CONTROL_WIDE_FIELD_WIDTH_PX}
                  value={rangeAsPicker(pendingFilters.createdRange)}
                  placeholder={['시작일', '종료일']}
                  allowClear
                  onChange={dates => {
                    if (!dates || (!dates[0] && !dates[1])) {
                      setPendingFilters(prev => ({ ...prev, createdRange: null }))
                      return
                    }
                    setPendingFilters(prev => ({
                      ...prev,
                      createdRange: [dates[0] ?? null, dates[1] ?? null],
                    }))
                  }}
                />
              </div>
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
                조회
              </CmsButton>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-list-card">
        <div className="admin-list-toolbar">
          <div className="table-header-title--wrapper">
            <span className="table-title">임팩트 스토리 목록</span>
            <span className="table-description">
              총 {rows.length.toLocaleString('ko-KR')}건 · 상단 고정 게시글은 최대 9개까지 설정
              가능합니다.
            </span>
          </div>
          <div className="table-header-actions--wrapper">
            <CmsButton
              variant="delete"
              size="large"
              type="button"
              loading={removeMutation.isPending && !formOpen}
              onClick={handleBulkDeleteClick}
            >
              선택 삭제
            </CmsButton>
            <CmsButton
              variant="secondary"
              size="large"
              type="button"
              onClick={() => setCategoryOpen(true)}
            >
              카테고리 관리
            </CmsButton>
            <CmsButton variant="primary" size="large" type="button" onClick={openCreate}>
              게시글 등록
            </CmsButton>
          </div>
        </div>

        <div className="impact-stories-page__table-scroll">
          <Table<ImpactStory>
            className="cms-data-table impact-stories-page__table"
            rowKey="id"
            loading={listQuery.isLoading}
            dataSource={rows}
            columns={columns}
            pagination={false}
            rowSelection={{
              selectedRowKeys,
              onChange: keys => setSelectedRowKeys(keys),
              columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
            }}
            onRow={record => ({
              onClick: e => {
                if (isTableSelectionClick(e)) return
                goDetail(record)
              },
              style: { cursor: 'pointer' },
            })}
            scroll={{ x: true }}
          />
        </div>
      </div>

      <StoryFormModal
        open={formOpen}
        mode={formMode}
        initial={editing}
        categories={categories}
        pinnedCountExcludingSelf={pinnedExcludingSelf}
        confirmLoading={formLoading}
        deleteLoading={removeMutation.isPending}
        onCancel={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSubmit={values => {
          void handleFormSubmit(values)
        }}
      />

      <CategoryManagementModal
        open={categoryOpen}
        onCancel={() => setCategoryOpen(false)}
        categories={categories}
        stories={allStories}
        saving={saveCategoriesMutation.isPending}
        onSave={async next => {
          await saveCategoriesMutation.mutateAsync(next)
        }}
      />

      <ConfirmModal
        open={bulkDeleteOpen}
        title="게시글 삭제"
        content={`선택한 게시글 ${selectedRowKeys.length}건을 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        danger
        confirmLoading={removeMutation.isPending}
        onCancel={() => setBulkDeleteOpen(false)}
        onConfirm={() => {
          void handleBulkDeleteConfirm()
        }}
      />
    </div>
  )
}
