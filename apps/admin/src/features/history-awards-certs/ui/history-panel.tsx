import { useCallback, useMemo, useState, type Key } from 'react'
import { Switch } from 'antd'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import type {
  HistoryCreateInput,
  HistoryItem,
  HistoryListFilter,
  PublicFilterValue,
} from '@/entities/history-awards-certs/model/types'
import {
  useCreateHistory,
  useHistoryList,
  useRemoveHistory,
  useSetHistoryPublic,
  useUpdateHistory,
} from '@/features/history-awards-certs/api/hooks'
import { historyAwardsCertsQueryKeys } from '@/features/history-awards-certs/api/query-keys'
import { HISTORY_CHANGED_EVENT } from '@/features/history-awards-certs/api/store'
import { formatCreatedDateTime, formatYearMonth } from '@/features/history-awards-certs/lib/format'
import {
  deleteConfirmContent,
  deleteFailureAlert,
} from '@/features/history-awards-certs/lib/delete-guards'
import { historyAwardsCertsListRowNo } from '@/features/history-awards-certs/lib/list-row-no'
import { HistoryFormModal } from '@/features/history-awards-certs/ui/form-modal'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
} from '@/shared/constants/filter-field-width'
import {
  CMS_TABLE_NO_COL_CLASS,
  CMS_TABLE_USAGE_COL_CLASS,
  TABLE_COLUMN_WIDTHS,
} from '@/shared/constants/table'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import { useInvalidateOnWindowEvent } from '@/shared/lib/use-invalidate-on-window-event'
import { useListFilterUrl } from '@/shared/lib/use-list-filter-url'
import type { TableSearchParamRule } from '@/shared/lib/use-table-search'
import {
  applyDateRangeToSearchParams,
  pendingDateRangeTupleEqual,
  resolvePendingDateRangeFromUrl,
  type PendingDateRange,
  type UrlDateRangePendingSyncRef,
  ymdFromParam,
} from '@/shared/lib/url-date-range-pending-sync'
import {
  AdminInfiniteTableFooter,
  CmsButton,
  CmsDateRangePicker,
  AdminFilterTextInput,
  CmsSelect,
  ConfirmModal,
  useCmsAlert,
  FilterTableLayout,
  NO_SELECTION_ALERT,
  showDeleteCompletedAlert,
  showRegisterCompletedAlert,
  showUpdateCompletedAlert,
} from '@/shared/ui'

const YEAR_OPTIONS = Array.from({ length: 20 }, (_, i) => {
  const y = 2026 - i
  return { label: `${y}년`, value: String(y) }
})

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  label: `${i + 1}월`,
  value: String(i + 1),
}))

/** 검색 필터 — 미선택(전체) 표기를 셀렉트별로 구분 (값 '' 항목이 있으면 공통 '전체'를 덧붙이지 않음) */
const YEAR_FILTER_OPTIONS = [{ label: '연도 전체', value: '' }, ...YEAR_OPTIONS]
const MONTH_FILTER_OPTIONS = [{ label: '월 전체', value: '' }, ...MONTH_OPTIONS]

type HistoryPendingFilters = {
  isPublic: PublicFilterValue
  year: string
  month: string
  content: string
  created: PendingDateRange
}

const INITIAL_PENDING: HistoryPendingFilters = {
  isPublic: '',
  year: '',
  month: '',
  content: '',
  created: null,
}

const createdSyncRef: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }

function parsePublic(raw: string | null): PublicFilterValue {
  if (raw === 'true' || raw === 'false') return raw
  return ''
}

function parseApplied(searchParams: URLSearchParams): HistoryListFilter {
  const filter: HistoryListFilter = {}
  const isPublic = parsePublic(searchParams.get('h_public'))
  if (isPublic === 'true') filter.isPublic = true
  if (isPublic === 'false') filter.isPublic = false
  const year = searchParams.get('h_year')
  if (year && !Number.isNaN(Number(year))) filter.year = Number(year)
  const month = searchParams.get('h_month')
  if (month && !Number.isNaN(Number(month))) filter.month = Number(month)
  const content = (searchParams.get('h_q') ?? '').trim()
  if (content) filter.content = content
  const from = ymdFromParam(searchParams.get('h_cfrom'))
  const to = ymdFromParam(searchParams.get('h_cto'))
  if (from) filter.createdFrom = from
  if (to) filter.createdTo = to
  return filter
}

const searchSyncRules: readonly TableSearchParamRule<HistoryPendingFilters>[] = [
  {
    kind: 'param',
    filterKey: 'isPublic',
    paramKey: 'h_public',
    condition: f => f.isPublic === 'true' || f.isPublic === 'false',
  },
  {
    kind: 'param',
    filterKey: 'year',
    paramKey: 'h_year',
    condition: f => f.year.length > 0,
  },
  {
    kind: 'param',
    filterKey: 'month',
    paramKey: 'h_month',
    condition: f => f.month.length > 0,
  },
  {
    kind: 'param',
    filterKey: 'content',
    paramKey: 'h_q',
    condition: f => f.content.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'apply',
    apply: (nextParams, f) => {
      applyDateRangeToSearchParams(nextParams, f.created, 'h_cfrom', 'h_cto')
    },
  },
]

function periodAsPickerValue(period: PendingDateRange): [Dayjs | null, Dayjs | null] {
  if (!period) return [null, null]
  return [period[0] ?? null, period[1] ?? null]
}

export function HistoryPanel() {
  const { showAlert } = useCmsAlert()

  const {
    pendingFilters,
    setPendingFilters,
    patchPendingFilters,
    applied: appliedFilter,
    applySearch,
    hasActiveFilters,
  } = useListFilterUrl<HistoryPendingFilters, HistoryListFilter>({
    initialPending: INITIAL_PENDING,
    paramConfig: searchSyncRules,
    parseApplied,
    syncPendingFromUrl: ({ searchParams, setPendingFilters: setPending }) => {
      const isPublic = parsePublic(searchParams.get('h_public'))
      const year = searchParams.get('h_year') ?? ''
      const month = searchParams.get('h_month') ?? ''
      const content = searchParams.get('h_q') ?? ''
      const from = searchParams.get('h_cfrom')
      const to = searchParams.get('h_cto')

      setPending(prev => {
        const created = resolvePendingDateRangeFromUrl({
          ref: createdSyncRef,
          from,
          to,
          prev: prev.created,
        }) as PendingDateRange

        const next: HistoryPendingFilters = {
          isPublic,
          year,
          month,
          content,
          created,
        }
        if (
          prev.isPublic === next.isPublic &&
          prev.year === next.year &&
          prev.month === next.month &&
          prev.content === next.content &&
          pendingDateRangeTupleEqual(prev.created, next.created)
        ) {
          return prev
        }
        return next
      })
    },
  })

  const listQuery = useHistoryList(appliedFilter)
  const createMutation = useCreateHistory()
  const updateMutation = useUpdateHistory()
  const removeMutation = useRemoveHistory()
  const setPublicMutation = useSetHistoryPublic()

  const { sentinelRef } = useGatedInfiniteScroll({
    hasNextPage: listQuery.hasNextPage,
    isFetchingNextPage: listQuery.isFetchingNextPage,
    fetchNextPage: listQuery.fetchNextPage,
    resetKey: JSON.stringify(appliedFilter),
  })

  const rows = listQuery.rows
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [formVariant, setFormVariant] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<HistoryItem | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  useInvalidateOnWindowEvent(HISTORY_CHANGED_EVENT, historyAwardsCertsQueryKeys.history.lists())

  const handleSearch = useCallback(() => {
    applySearch()
    setSelectedRowKeys([])
  }, [applySearch])

  const handleTogglePublic = useCallback(
    (id: string, isPublic: boolean) => {
      void setPublicMutation.mutateAsync({ id, isPublic }).catch(() => {
        showAlert({
          title: '공개 여부 변경 실패',
          content: '공개 여부 변경에 실패했습니다. 다시 시도해 주세요.',
        })
        void listQuery.refetch()
      })
    },
    [listQuery, setPublicMutation, showAlert]
  )

  const openCreate = useCallback(() => {
    setFormVariant('create')
    setEditing(null)
    setFormOpen(true)
  }, [])

  const openEdit = useCallback((row: HistoryItem) => {
    setFormVariant('edit')
    setEditing(row)
    setFormOpen(true)
  }, [])

  const handleFormSubmit = useCallback(
    async (values: HistoryCreateInput) => {
      try {
        if (formVariant === 'edit' && editing) {
          await updateMutation.mutateAsync({ id: editing.id, input: values })
          showUpdateCompletedAlert()
        } else {
          await createMutation.mutateAsync(values)
          showRegisterCompletedAlert()
        }
        setFormOpen(false)
        setEditing(null)
      } catch {
        showAlert({
          title: formVariant === 'edit' ? '수정 실패' : '등록 실패',
          content:
            formVariant === 'edit'
              ? '연혁 수정에 실패했습니다. 다시 시도해 주세요.'
              : '연혁 등록에 실패했습니다. 다시 시도해 주세요.',
        })
      }
    },
    [createMutation, editing, formVariant, showAlert, updateMutation]
  )

  const handleDetailDelete = useCallback(async () => {
    if (!editing) return
    try {
      await removeMutation.mutateAsync([editing.id])
      setFormOpen(false)
      setEditing(null)
      setSelectedRowKeys(prev => prev.filter(k => String(k) !== editing.id))
      showDeleteCompletedAlert()
    } catch (error) {
      showAlert(deleteFailureAlert('연혁', error))
    }
  }, [editing, removeMutation, showAlert])

  const handleDeleteClick = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      showAlert(NO_SELECTION_ALERT)
      return
    }
    setDeleteConfirmOpen(true)
  }, [selectedRowKeys, showAlert])

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await removeMutation.mutateAsync(selectedRowKeys.map(String))
      setSelectedRowKeys([])
      setDeleteConfirmOpen(false)
      showDeleteCompletedAlert()
    } catch (error) {
      showAlert(deleteFailureAlert('연혁', error))
    }
  }, [removeMutation, selectedRowKeys, showAlert])

  const totalCount = listQuery.totalCount
  const columns = useMemo<ColumnsType<HistoryItem>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COLUMN_WIDTHS.index,
        className: CMS_TABLE_NO_COL_CLASS,
        align: 'center',
        render: (_v, _r, index) => historyAwardsCertsListRowNo(totalCount, index),
      },
      {
        title: '공개 여부',
        key: 'isPublic',
        width: TABLE_COLUMN_WIDTHS.usage,
        className: CMS_TABLE_USAGE_COL_CLASS,
        align: 'center',
        render: (_v, record) => (
          <Switch
            checked={record.isPublic}
            onChange={checked => handleTogglePublic(record.id, checked)}
            aria-label={`${record.content.slice(0, 20)} 공개 여부`}
          />
        ),
      },
      {
        title: '연혁 연도/월',
        key: 'yearMonth',
        width: 240,
        align: 'center',
        render: (_v, record) => formatYearMonth(record.year, record.month),
      },
      {
        title: '내용',
        dataIndex: 'content',
        key: 'content',
        // 시안(Figma 2094:131215, 표 1538): 선택 60 · No. 80 · 공개 100 · 연도/월 240 · 내용 718 · 작성일시 200 · 관리 140
        // 내용은 폭 미지정 — 남는 폭(시안 기준 718)을 흡수
        ellipsis: true,
      },
      {
        title: '작성일시',
        key: 'createdAt',
        width: 200,
        align: 'center',
        render: (_v, record) => formatCreatedDateTime(record.createdAt),
      },
      {
        title: '관리',
        key: 'actions',
        width: 140,
        align: 'center',
        render: (_v, record) => (
          <CmsButton
            variant="secondary"
            size="small"
            type="button"
            onClick={e => {
              e.stopPropagation()
              openEdit(record)
            }}
          >
            수정
          </CmsButton>
        ),
      },
    ],
    [handleTogglePublic, openEdit, totalCount]
  )

  return (
    <div className="hac-panel">
      <FilterTableLayout
        hasActiveFilters={hasActiveFilters}
        filter={
          <div className="admin-filter-area">
            <div className="admin-filter-area__field admin-filter-area__field--control">
              <p className="admin-filter-area__label">공개 여부</p>
              <CmsSelect
                inputSize="medium"
                withAllOption
                width={FILTER_CONTROL_MAX_WIDTH_PX}
                value={pendingFilters.isPublic}
                onChange={v =>
                  setPendingFilters(prev => ({
                    ...prev,
                    isPublic: (v as PublicFilterValue) ?? '',
                  }))
                }
                options={[
                  { label: '공개', value: 'true' },
                  { label: '비공개', value: 'false' },
                ]}
              />
            </div>
            <div className="admin-filter-area__field admin-filter-area__field--select-pair">
              <p className="admin-filter-area__label">연혁 연도/월</p>
              <div
                className="admin-filter-area__select-pair"
                role="group"
                aria-label="연혁 연도/월"
              >
                <CmsSelect
                  inputSize="medium"
                  withAllOption
                  popupMatchSelectWidth={false}
                  value={pendingFilters.year}
                  onChange={v => setPendingFilters(prev => ({ ...prev, year: String(v ?? '') }))}
                  options={YEAR_FILTER_OPTIONS}
                />
                <CmsSelect
                  inputSize="medium"
                  withAllOption
                  popupMatchSelectWidth={false}
                  value={pendingFilters.month}
                  onChange={v => setPendingFilters(prev => ({ ...prev, month: String(v ?? '') }))}
                  options={MONTH_FILTER_OPTIONS}
                />
              </div>
            </div>
            <div className="admin-filter-area__field admin-filter-area__field--control">
              <p className="admin-filter-area__label">내용</p>
              <AdminFilterTextInput
                inputSize="medium"
                width={FILTER_CONTROL_MAX_WIDTH_PX}
                placeholder="검색어를 입력해 주세요"
                value={pendingFilters.content}
                onChange={value => patchPendingFilters(prev => ({ ...prev, content: value }))}
                onPressEnter={handleSearch}
              />
            </div>
            <div className="admin-filter-area__field admin-filter-area__field--date-range">
              <p className="admin-filter-area__label">작성일</p>
              <CmsDateRangePicker
                inputSize="medium"
                width={FILTER_CONTROL_WIDE_FIELD_WIDTH_PX}
                value={periodAsPickerValue(pendingFilters.created)}
                onChange={dates =>
                  setPendingFilters(prev => ({
                    ...prev,
                    created: dates ?? null,
                  }))
                }
                placeholder={['시작일', '종료일']}
                allowClear
              />
            </div>
            <div className="admin-filter-area__actions">
              <CmsButton
                className="admin-filter-area__search-button"
                variant="primary"
                size="medium"
                type="button"
                onClick={handleSearch}
              >
                조회
              </CmsButton>
            </div>
          </div>
        }
        title="연혁 목록"
        description={`총 ${totalCount.toLocaleString()}건`}
        actions={
          <div className="hac-panel__toolbar-buttons">
            <CmsButton
              variant="delete"
              size="h40"
              type="button"
              onClick={handleDeleteClick}
              loading={removeMutation.isPending}
            >
              선택 삭제
            </CmsButton>
            <CmsButton variant="primary" size="h40" type="button" onClick={openCreate}>
              연혁 등록
            </CmsButton>
          </div>
        }
      >
        <div className="hac-panel__table-scroll">
          <CmsDataTable<HistoryItem>
            className="cms-data-table hac-table"
            rowKey="id"
            loading={listQuery.isLoading}
            columns={columns}
            dataSource={rows}
            pagination={false}
            rowSelection={{
              selectedRowKeys,
              onChange: keys => setSelectedRowKeys(keys),
              columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
            }}
          />
          <AdminInfiniteTableFooter
            sentinelRef={sentinelRef}
            isFetchingNextPage={listQuery.isFetchingNextPage}
          />
        </div>
      </FilterTableLayout>

      <HistoryFormModal
        open={formOpen}
        variant={formVariant}
        initial={editing}
        confirmLoading={
          formVariant === 'edit' ? updateMutation.isPending : createMutation.isPending
        }
        deleteLoading={removeMutation.isPending}
        onCancel={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSubmit={values => {
          void handleFormSubmit(values)
        }}
        onDelete={
          formVariant === 'edit'
            ? () => {
                void handleDetailDelete()
              }
            : undefined
        }
      />

      <ConfirmModal
        open={deleteConfirmOpen}
        title="연혁 삭제"
        content={deleteConfirmContent('연혁', selectedRowKeys.length)}
        confirmText="삭제"
        cancelText="취소"
        danger
        confirmLoading={removeMutation.isPending}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          void handleDeleteConfirm()
        }}
      />
    </div>
  )
}
