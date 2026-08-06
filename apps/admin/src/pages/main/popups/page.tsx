/**
 * 메인 팝업 관리
 */

import { useCallback, useMemo, useState, type Key } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { Image, Switch } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  MAX_ACTIVE_POPUPS,
  PopupActiveLimitError,
  type Popup,
  type PopupListFilter,
} from '@/entities/popup/model/types'
import {
  useCreatePopup,
  usePopupsList,
  useRemovePopups,
  useReorderPopups,
  useSetPopupActive,
  useUpdatePopup,
} from '@/features/popup/api/hooks'
import { popupQueryKeys } from '@/features/popup/api/query-keys'
import { POPUPS_CHANGED_EVENT } from '@/features/popup/api/store'
import {
  PopupFormModal,
  type PopupFormValues,
} from '@/features/popup/ui/form-modal'
import {
  PopupDragHandle,
  PopupsSortableTable,
} from '@/features/popup/ui/sortable-table'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
  FILTER_SEARCH_BUTTON_WIDTH_PX,
} from '@/shared/constants/filter-field-width'
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

import './page.css'

type ActiveFilterValue = '' | 'true' | 'false'

type PopupPendingFilters = {
  isActive: ActiveFilterValue
  name: string
  altText: string
  periodRange: PendingDateRange
}

const INITIAL_PENDING: PopupPendingFilters = {
  isActive: '',
  name: '',
  altText: '',
  periodRange: null,
}

const periodSyncRef: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }

function parseActive(raw: string | null): ActiveFilterValue {
  if (raw === 'true' || raw === 'false') return raw
  return ''
}

function parseApplied(searchParams: URLSearchParams): PopupListFilter {
  const filter: PopupListFilter = {}
  const active = parseActive(searchParams.get('pu_active'))
  if (active === 'true') filter.isActive = true
  if (active === 'false') filter.isActive = false
  const name = (searchParams.get('pu_name') ?? '').trim()
  if (name) filter.name = name
  const altText = (searchParams.get('pu_alt') ?? '').trim()
  if (altText) filter.altText = altText
  const start = ymdFromParam(searchParams.get('pu_from'))
  const end = ymdFromParam(searchParams.get('pu_to'))
  if (start) filter.periodStart = start
  if (end) filter.periodEnd = end
  return filter
}

const searchSyncRules: readonly TableSearchParamRule<PopupPendingFilters>[] = [
  {
    kind: 'param',
    filterKey: 'isActive',
    paramKey: 'pu_active',
    condition: f => f.isActive === 'true' || f.isActive === 'false',
  },
  {
    kind: 'param',
    filterKey: 'name',
    paramKey: 'pu_name',
    condition: f => f.name.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'altText',
    paramKey: 'pu_alt',
    condition: f => f.altText.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'apply',
    apply: (nextParams, f) => {
      applyDateRangeToSearchParams(nextParams, f.periodRange, 'pu_from', 'pu_to')
    },
  },
]

function formatPeriodDot(start: string, end: string): string {
  const s = start.replace(/-/g, '.')
  const e = end.replace(/-/g, '.')
  return `${s} ~ ${e}`
}

function formatCreatedDate(iso: string): string {
  const d = dayjs(iso)
  if (!d.isValid()) return '-'
  return d.format('YYYY.MM.DD')
}

function matchesClientFilter(row: Popup, filter: PopupListFilter): boolean {
  if (filter.isActive === true && !row.isActive) return false
  if (filter.isActive === false && row.isActive) return false

  const nameQ = filter.name?.trim().toLowerCase()
  if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false

  const altQ = filter.altText?.trim().toLowerCase()
  if (altQ && !row.altText.toLowerCase().includes(altQ)) return false

  const fStart = filter.periodStart?.trim()
  const fEnd = filter.periodEnd?.trim()
  if (fStart || fEnd) {
    const rangeStart = fStart || '0000-01-01'
    const rangeEnd = fEnd || '9999-12-31'
    if (!(row.periodStart <= rangeEnd && rangeStart <= row.periodEnd)) {
      return false
    }
  }
  return true
}

function periodAsPickerValue(period: PendingDateRange): [Dayjs | null, Dayjs | null] {
  if (!period) return [null, null]
  return [period[0] ?? null, period[1] ?? null]
}

export function PopupsPage() {
  const { showAlert } = useCmsAlert()
  const listQuery = usePopupsList()
  const createMutation = useCreatePopup()
  const updateMutation = useUpdatePopup()
  const removeMutation = useRemovePopups()
  const reorderMutation = useReorderPopups()
  const setActiveMutation = useSetPopupActive()

  const {
    pendingFilters,
    setPendingFilters,
    applied: appliedFilter,
    applySearch,
  } = useListFilterUrl<PopupPendingFilters, PopupListFilter>({
    initialPending: INITIAL_PENDING,
    paramConfig: searchSyncRules,
    parseApplied,
    syncPendingFromUrl: ({ searchParams, setPendingFilters: setPending }) => {
      const isActive = parseActive(searchParams.get('pu_active'))
      const name = searchParams.get('pu_name') ?? ''
      const altText = searchParams.get('pu_alt') ?? ''
      const from = searchParams.get('pu_from')
      const to = searchParams.get('pu_to')

      setPending(prev => {
        const periodRange = resolvePendingDateRangeFromUrl({
          ref: periodSyncRef,
          from,
          to,
          prev: prev.periodRange,
        }) as PendingDateRange

        const next: PopupPendingFilters = { isActive, name, altText, periodRange }
        if (
          prev.isActive === next.isActive &&
          prev.name === next.name &&
          prev.altText === next.altText &&
          pendingDateRangeTupleEqual(prev.periodRange, next.periodRange)
        ) {
          return prev
        }
        return next
      })
    },
  })

  const allRows = useMemo(() => listQuery.data ?? [], [listQuery.data])
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [formVariant, setFormVariant] = useState<'create' | 'detail'>('create')
  const [editingPopup, setEditingPopup] = useState<Popup | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  useInvalidateOnWindowEvent(POPUPS_CHANGED_EVENT, popupQueryKeys.lists())

  const rows = useMemo(
    () => allRows.filter(row => matchesClientFilter(row, appliedFilter)),
    [allRows, appliedFilter]
  )

  const handleSearch = useCallback(() => {
    applySearch()
    setSelectedRowKeys([])
  }, [applySearch])

  const handleRowsReorder = useCallback(
    (reorderedRows: Popup[]) => {
      const reorderedIds = reorderedRows.map(row => row.id)
      let cursor = 0
      const mergedIds =
        reorderedRows.length === allRows.length
          ? reorderedIds
          : allRows.map(row => {
              if (matchesClientFilter(row, appliedFilter)) {
                return reorderedIds[cursor++]!
              }
              return row.id
            })

      void reorderMutation.mutateAsync(mergedIds).catch(() => {
        showAlert({
          title: '순서 변경 실패',
          content: '팝업 순서 저장에 실패했습니다. 목록을 다시 불러옵니다.',
        })
        void listQuery.refetch()
      })
    },
    [allRows, appliedFilter, listQuery, reorderMutation, showAlert]
  )

  const handleToggleActive = useCallback(
    (id: string, isActive: boolean) => {
      void setActiveMutation.mutateAsync({ id, isActive }).catch(error => {
        if (error instanceof PopupActiveLimitError || error?.name === 'PopupActiveLimitError') {
          showAlert({
            title: '사용 제한',
            content: `팝업은 최대 ${MAX_ACTIVE_POPUPS}개까지 동시 사용 가능합니다.`,
          })
        } else {
          showAlert({
            title: '사용 여부 변경 실패',
            content: '사용 여부 변경에 실패했습니다. 다시 시도해 주세요.',
          })
        }
        void listQuery.refetch()
      })
    },
    [listQuery, setActiveMutation, showAlert]
  )

  const openCreate = useCallback(() => {
    setFormVariant('create')
    setEditingPopup(null)
    setFormOpen(true)
  }, [])

  const openDetail = useCallback((popup: Popup) => {
    setFormVariant('detail')
    setEditingPopup(popup)
    setFormOpen(true)
  }, [])

  const handleFormSubmit = useCallback(
    async (values: PopupFormValues) => {
      try {
        if (formVariant === 'detail' && editingPopup) {
          await updateMutation.mutateAsync({ id: editingPopup.id, patch: values })
        } else {
          await createMutation.mutateAsync(values)
        }
        setFormOpen(false)
        setEditingPopup(null)
      } catch (error) {
        if (error instanceof PopupActiveLimitError || (error as Error)?.name === 'PopupActiveLimitError') {
          showAlert({
            title: '사용 제한',
            content: `팝업은 최대 ${MAX_ACTIVE_POPUPS}개까지 동시 사용 가능합니다.`,
          })
          return
        }
        showAlert({
          title: formVariant === 'detail' ? '수정 실패' : '등록 실패',
          content:
            formVariant === 'detail'
              ? '팝업 수정에 실패했습니다. 다시 시도해 주세요.'
              : '팝업 등록에 실패했습니다. 다시 시도해 주세요.',
        })
      }
    },
    [createMutation, editingPopup, formVariant, showAlert, updateMutation]
  )

  const handleDetailDelete = useCallback(async () => {
    if (!editingPopup) return
    try {
      await removeMutation.mutateAsync([editingPopup.id])
      setFormOpen(false)
      setEditingPopup(null)
      setSelectedRowKeys(keys => keys.filter(key => String(key) !== editingPopup.id))
    } catch {
      showAlert({
        title: '삭제 실패',
        content: '팝업 삭제에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [editingPopup, removeMutation, showAlert])

  const handleDeleteClick = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      showAlert({
        title: '선택 항목 없음',
        content: '삭제할 팝업을 선택해 주세요.',
      })
      return
    }
    setDeleteConfirmOpen(true)
  }, [selectedRowKeys.length, showAlert])

  const handleDeleteConfirm = useCallback(async () => {
    const ids = selectedRowKeys.map(String)
    try {
      await removeMutation.mutateAsync(ids)
      setSelectedRowKeys([])
      setDeleteConfirmOpen(false)
    } catch {
      showAlert({
        title: '삭제 실패',
        content: '팝업 삭제에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [removeMutation, selectedRowKeys, showAlert])

  const columns = useMemo<ColumnsType<Popup>>(
    () => [
      {
        title: '순서',
        key: 'sort',
        width: 72,
        align: 'center',
        render: () => <PopupDragHandle />,
      },
      {
        title: 'No.',
        key: 'no',
        width: 72,
        align: 'center',
        render: (_value, _record, index) => index + 1,
      },
      {
        title: '사용 여부',
        key: 'isActive',
        width: 100,
        align: 'center',
        render: (_value, record) => (
          <Switch
            checked={record.isActive}
            onChange={checked => handleToggleActive(record.id, checked)}
            aria-label={`${record.name || '팝업'} 사용 여부`}
          />
        ),
      },
      {
        title: '이미지',
        key: 'image',
        width: 160,
        align: 'center',
        render: (_value, record) => (
          <div className="popups-page__thumb-wrap">
            <Image
              className="popups-page__thumb"
              src={record.imageUrl}
              alt={record.altText || record.imageFileName || '팝업 이미지'}
              preview={{ mask: '이미지 보기' }}
            />
          </div>
        ),
      },
      {
        title: '팝업명',
        dataIndex: 'name',
        key: 'name',
        ellipsis: true,
      },
      {
        title: '대체 텍스트 (설명)',
        dataIndex: 'altText',
        key: 'altText',
        ellipsis: true,
      },
      {
        title: '게시 기간',
        key: 'period',
        width: 220,
        align: 'center',
        render: (_value, record) => formatPeriodDot(record.periodStart, record.periodEnd),
      },
      {
        title: '등록일',
        key: 'createdAt',
        width: 120,
        align: 'center',
        render: (_value, record) => formatCreatedDate(record.createdAt),
      },
      {
        title: '관리',
        key: 'actions',
        width: 120,
        align: 'center',
        render: (_value, record) => (
          <CmsButton
            variant="secondary"
            size="medium"
            width={88}
            type="button"
            onClick={e => {
              e.stopPropagation()
              openDetail(record)
            }}
          >
            수정
          </CmsButton>
        ),
      },
    ],
    [handleToggleActive, openDetail]
  )

  const totalCount = rows.length
  const formLoading =
    formVariant === 'detail' ? updateMutation.isPending : createMutation.isPending

  return (
    <div className="popups-page">
      <div className="admin-list-card popups-page__filter-card">
        <div className="admin-filter-area popups-page__filter-row">
          <div className="admin-filter-area__field admin-filter-area__field--control">
            <span className="admin-filter-area__label">사용 여부</span>
            <CmsSelect
              inputSize="large"
              width={FILTER_CONTROL_MAX_WIDTH_PX}
              withAllOption
              value={pendingFilters.isActive}
              onChange={value =>
                setPendingFilters(prev => ({
                  ...prev,
                  isActive: (value as ActiveFilterValue) ?? '',
                }))
              }
              options={[
                { label: '사용', value: 'true' },
                { label: '미사용', value: 'false' },
              ]}
              placeholder="전체"
            />
          </div>
          <div className="admin-filter-area__field admin-filter-area__field--control">
            <span className="admin-filter-area__label">팝업명</span>
            <CmsInput
              inputSize="large"
              width={FILTER_CONTROL_MAX_WIDTH_PX}
              placeholder="팝업명 검색"
              value={pendingFilters.name}
              onChange={e => setPendingFilters(prev => ({ ...prev, name: e.target.value }))}
              onPressEnter={handleSearch}
            />
          </div>
          <div className="admin-filter-area__field admin-filter-area__field--control">
            <span className="admin-filter-area__label">대체 텍스트</span>
            <CmsInput
              inputSize="large"
              width={FILTER_CONTROL_MAX_WIDTH_PX}
              placeholder="대체 텍스트 검색"
              value={pendingFilters.altText}
              onChange={e => setPendingFilters(prev => ({ ...prev, altText: e.target.value }))}
              onPressEnter={handleSearch}
            />
          </div>
          <div className="admin-filter-area__field admin-filter-area__field--date-range">
            <span className="admin-filter-area__label">게시 기간</span>
            <CmsDateRangePicker
              inputSize="large"
              width={FILTER_CONTROL_WIDE_FIELD_WIDTH_PX}
              value={periodAsPickerValue(pendingFilters.periodRange)}
              onChange={dates =>
                setPendingFilters(prev => ({
                  ...prev,
                  periodRange: dates ?? null,
                }))
              }
              placeholder={['시작일', '종료일']}
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
            <span className="table-title">팝업 목록</span>
            <span className="table-description">
              총 {totalCount.toLocaleString()}건 (팝업은 최대 {MAX_ACTIVE_POPUPS}
              개까지 동시 사용 가능합니다.)
            </span>
          </div>
          <div className="table-header-actions--wrapper">
            <CmsButton
              variant="delete"
              size="medium"
              type="button"
              onClick={handleDeleteClick}
              loading={removeMutation.isPending && !formOpen}
            >
              선택 삭제
            </CmsButton>
            <CmsButton variant="primary" size="medium" type="button" onClick={openCreate}>
              팝업 등록
            </CmsButton>
          </div>
        </div>

        <div className="popups-page__table-scroll">
          <PopupsSortableTable
            rows={rows}
            columns={columns}
            loading={listQuery.isLoading}
            onRowsReorder={handleRowsReorder}
            rowSelection={{
              selectedRowKeys,
              onChange: keys => setSelectedRowKeys(keys),
              columnWidth: 68,
            }}
          />
        </div>
      </div>

      <PopupFormModal
        open={formOpen}
        variant={formVariant}
        initial={editingPopup}
        confirmLoading={formLoading}
        deleteLoading={removeMutation.isPending && formVariant === 'detail'}
        onCancel={() => {
          setFormOpen(false)
          setEditingPopup(null)
        }}
        onSubmit={values => {
          void handleFormSubmit(values)
        }}
        onDelete={
          formVariant === 'detail'
            ? () => {
                void handleDetailDelete()
              }
            : undefined
        }
      />

      <ConfirmModal
        open={deleteConfirmOpen}
        title="팝업 삭제"
        content={`선택한 팝업 ${selectedRowKeys.length}건을 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다.`}
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
