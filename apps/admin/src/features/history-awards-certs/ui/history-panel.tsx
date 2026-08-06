import { useCallback, useMemo, useState, type Key } from 'react'
import { Switch, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import { DetailInfoFormTdDivider } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type {
  HistoryCreateInput,
  HistoryItem,
  HistoryListFilter,
  HistorySortKey,
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
import {
  formatCreatedDateTime,
  formatYearMonth,
} from '@/features/history-awards-certs/lib/format'
import { HistoryFormModal } from '@/features/history-awards-certs/ui/history-form-modal'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
  FILTER_SEARCH_BUTTON_WIDTH_PX,
} from '@/shared/constants/filter-field-width'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
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
  CmsButton,
  CmsDateRangePicker,
  CmsInput,
  CmsSelect,
  ConfirmModal,
  useCmsAlert,
} from '@/shared/ui'

const YEAR_OPTIONS = [
  { label: '년도 전체', value: '' },
  ...Array.from({ length: 20 }, (_, i) => {
    const y = 2026 - i
    return { label: `${y}년`, value: String(y) }
  }),
]

const MONTH_OPTIONS = [
  { label: '월 전체', value: '' },
  ...Array.from({ length: 12 }, (_, i) => ({
    label: `${i + 1}월`,
    value: String(i + 1),
  })),
]

type HistoryPendingFilters = {
  isPublic: PublicFilterValue
  year: string
  month: string
  content: string
  created: PendingDateRange
  sort: HistorySortKey
}

const INITIAL_PENDING: HistoryPendingFilters = {
  isPublic: '',
  year: '',
  month: '',
  content: '',
  created: null,
  sort: 'event',
}

const createdSyncRef: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }

function parsePublic(raw: string | null): PublicFilterValue {
  if (raw === 'true' || raw === 'false') return raw
  return ''
}

function parseSort(raw: string | null): HistorySortKey {
  return raw === 'created' ? 'created' : 'event'
}

function parseApplied(searchParams: URLSearchParams): HistoryListFilter {
  const filter: HistoryListFilter = { sort: parseSort(searchParams.get('h_sort')) }
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
    kind: 'param',
    filterKey: 'sort',
    paramKey: 'h_sort',
    condition: f => f.sort === 'created',
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
    applied: appliedFilter,
    applySearch,
    patchSearchParams,
  } = useListFilterUrl<HistoryPendingFilters, HistoryListFilter>({
    initialPending: INITIAL_PENDING,
    paramConfig: searchSyncRules,
    parseApplied,
    syncPendingFromUrl: ({ searchParams, setPendingFilters: setPending }) => {
      const isPublic = parsePublic(searchParams.get('h_public'))
      const year = searchParams.get('h_year') ?? ''
      const month = searchParams.get('h_month') ?? ''
      const content = searchParams.get('h_q') ?? ''
      const sort = parseSort(searchParams.get('h_sort'))
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
          sort,
        }
        if (
          prev.isPublic === next.isPublic &&
          prev.year === next.year &&
          prev.month === next.month &&
          prev.content === next.content &&
          prev.sort === next.sort &&
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

  const rows = listQuery.data ?? []
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

  const handleSortChange = useCallback(
    (value: HistorySortKey) => {
      setPendingFilters(prev => ({ ...prev, sort: value }))
      patchSearchParams(next => {
        if (value === 'created') {
          next.set('h_sort', value)
        } else {
          next.delete('h_sort')
        }
      })
      setSelectedRowKeys([])
    },
    [patchSearchParams, setPendingFilters]
  )

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
        } else {
          await createMutation.mutateAsync(values)
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
    } catch {
      showAlert({
        title: '삭제 실패',
        content: '연혁 삭제에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [editing, removeMutation, showAlert])

  const handleDeleteClick = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      showAlert({ title: '선택 항목 없음', content: '삭제할 연혁을 선택해 주세요.' })
      return
    }
    setDeleteConfirmOpen(true)
  }, [selectedRowKeys.length, showAlert])

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await removeMutation.mutateAsync(selectedRowKeys.map(String))
      setSelectedRowKeys([])
      setDeleteConfirmOpen(false)
    } catch {
      showAlert({
        title: '삭제 실패',
        content: '연혁 삭제에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [removeMutation, selectedRowKeys, showAlert])

  const totalCount = rows.length
  const columns = useMemo<ColumnsType<HistoryItem>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COLUMN_WIDTHS.index,
        align: 'center',
        render: (_v, _r, index) => totalCount - index,
      },
      {
        title: '공개 여부',
        key: 'isPublic',
        width: 100,
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
        title: '연혁년도/월',
        key: 'yearMonth',
        width: 120,
        align: 'center',
        render: (_v, record) => formatYearMonth(record.year, record.month),
      },
      {
        title: '내용',
        dataIndex: 'content',
        key: 'content',
        ellipsis: true,
      },
      {
        title: '작성일시',
        key: 'createdAt',
        width: 160,
        align: 'center',
        render: (_v, record) => formatCreatedDateTime(record.createdAt),
      },
      {
        title: '관리',
        key: 'actions',
        width: 120,
        align: 'center',
        render: (_v, record) => (
          <CmsButton
            variant="secondary"
            size="medium"
            width={88}
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
      <div className="admin-list-card">
        <div className="admin-filter-area">
          <div className="admin-filter-area__field admin-filter-area__field--control">
            <p className="admin-filter-area__label">공개 여부</p>
            <CmsSelect
              inputSize="large"
              width={FILTER_CONTROL_MAX_WIDTH_PX}
              value={pendingFilters.isPublic}
              onChange={v =>
                setPendingFilters(prev => ({
                  ...prev,
                  isPublic: (v as PublicFilterValue) ?? '',
                }))
              }
              options={[
                { label: '전체', value: '' },
                { label: '공개', value: 'true' },
                { label: '비공개', value: 'false' },
              ]}
            />
          </div>
          <div className="admin-filter-area__field admin-filter-area__field--control">
            <p className="admin-filter-area__label">연혁년도/월</p>
            <div className="hac-panel__year-month-filters">
              <CmsSelect
                inputSize="large"
                width={116}
                value={pendingFilters.year}
                onChange={v => setPendingFilters(prev => ({ ...prev, year: String(v ?? '') }))}
                options={YEAR_OPTIONS}
              />
              <CmsSelect
                inputSize="large"
                width={116}
                value={pendingFilters.month}
                onChange={v => setPendingFilters(prev => ({ ...prev, month: String(v ?? '') }))}
                options={MONTH_OPTIONS}
              />
            </div>
          </div>
          <div className="admin-filter-area__field admin-filter-area__field--control">
            <p className="admin-filter-area__label">내용</p>
            <CmsInput
              inputSize="large"
              width={FILTER_CONTROL_MAX_WIDTH_PX}
              placeholder="검색어를 입력하세요"
              value={pendingFilters.content}
              onChange={e => setPendingFilters(prev => ({ ...prev, content: e.target.value }))}
              onPressEnter={handleSearch}
            />
          </div>
          <div className="admin-filter-area__field admin-filter-area__field--date-range">
            <p className="admin-filter-area__label">작성일</p>
            <CmsDateRangePicker
              inputSize="large"
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

      <div className="admin-list-card">
        <div className="admin-list-toolbar">
          <div className="table-header-title--wrapper">
            <span className="table-title">연혁 목록</span>
            <span className="table-description">총 {totalCount.toLocaleString()}건</span>
          </div>
          <div className="table-header-actions--wrapper hac-panel__toolbar-actions">
            <CmsSelect
              inputSize="medium"
              width={140}
              value={appliedFilter.sort ?? pendingFilters.sort}
              onChange={v => handleSortChange((v as HistorySortKey) ?? 'event')}
              options={[
                { label: '연혁일순', value: 'event' },
                { label: '작성일순', value: 'created' },
              ]}
            />
            <DetailInfoFormTdDivider />
            <div className="hac-panel__toolbar-buttons">
              <CmsButton
                variant="delete"
                size="large"
                type="button"
                onClick={handleDeleteClick}
                loading={removeMutation.isPending}
              >
                선택 삭제
              </CmsButton>
              <CmsButton variant="primary" size="large" type="button" onClick={openCreate}>
                연혁 등록
              </CmsButton>
            </div>
          </div>
        </div>

        <div className="hac-panel__table-scroll">
          <Table<HistoryItem>
            className="cms-data-table"
            rowKey="id"
            loading={listQuery.isLoading}
            columns={columns}
            dataSource={rows}
            pagination={false}
            scroll={{ x: 'max-content' }}
            rowSelection={{
              selectedRowKeys,
              onChange: keys => setSelectedRowKeys(keys),
              columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
            }}
          />
        </div>
      </div>

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
        content={`선택한 연혁 ${selectedRowKeys.length}건을 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다.`}
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
