import { useCallback, useMemo, useState, type Key } from 'react'
import { Switch, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import { DetailInfoFormTdDivider } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type {
  AwardCreateInput,
  AwardItem,
  AwardListFilter,
  AwardSortKey,
  PublicFilterValue,
} from '@/entities/history-awards-certs/model/types'
import {
  useAwardList,
  useCreateAward,
  useRemoveAward,
  useSetAwardPublic,
  useUpdateAward,
} from '@/features/history-awards-certs/api/hooks'
import { historyAwardsCertsQueryKeys } from '@/features/history-awards-certs/api/query-keys'
import { AWARD_CHANGED_EVENT } from '@/features/history-awards-certs/api/store'
import {
  formatCreatedDateTime,
  formatYmdDot,
} from '@/features/history-awards-certs/lib/format'
import { AwardFormModal } from '@/features/history-awards-certs/ui/award-form-modal'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
  FILTER_SEARCH_BUTTON_WIDTH_PX,
} from '@/shared/constants/filter-field-width'
import { CMS_TABLE_NO_COL_CLASS, CMS_TABLE_USAGE_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
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

type AwardPendingFilters = {
  isPublic: PublicFilterValue
  title: string
  organization: string
  awarded: PendingDateRange
  created: PendingDateRange
  sort: AwardSortKey
}

const INITIAL_PENDING: AwardPendingFilters = {
  isPublic: '',
  title: '',
  organization: '',
  awarded: null,
  created: null,
  sort: 'date',
}

const awardedSyncRef: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }
const createdSyncRef: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }

function parsePublic(raw: string | null): PublicFilterValue {
  if (raw === 'true' || raw === 'false') return raw
  return ''
}

function parseSort(raw: string | null): AwardSortKey {
  return raw === 'created' ? 'created' : 'date'
}

function parseApplied(searchParams: URLSearchParams): AwardListFilter {
  const filter: AwardListFilter = { sort: parseSort(searchParams.get('a_sort')) }
  const isPublic = parsePublic(searchParams.get('a_public'))
  if (isPublic === 'true') filter.isPublic = true
  if (isPublic === 'false') filter.isPublic = false
  const title = (searchParams.get('a_title') ?? '').trim()
  if (title) filter.title = title
  const organization = (searchParams.get('a_org') ?? '').trim()
  if (organization) filter.organization = organization
  const awardedFrom = ymdFromParam(searchParams.get('a_afrom'))
  const awardedTo = ymdFromParam(searchParams.get('a_ato'))
  if (awardedFrom) filter.awardedFrom = awardedFrom
  if (awardedTo) filter.awardedTo = awardedTo
  const createdFrom = ymdFromParam(searchParams.get('a_cfrom'))
  const createdTo = ymdFromParam(searchParams.get('a_cto'))
  if (createdFrom) filter.createdFrom = createdFrom
  if (createdTo) filter.createdTo = createdTo
  return filter
}

const searchSyncRules: readonly TableSearchParamRule<AwardPendingFilters>[] = [
  {
    kind: 'param',
    filterKey: 'isPublic',
    paramKey: 'a_public',
    condition: f => f.isPublic === 'true' || f.isPublic === 'false',
  },
  {
    kind: 'param',
    filterKey: 'title',
    paramKey: 'a_title',
    condition: f => f.title.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'organization',
    paramKey: 'a_org',
    condition: f => f.organization.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'sort',
    paramKey: 'a_sort',
    condition: f => f.sort === 'created',
  },
  {
    kind: 'apply',
    apply: (nextParams, f) => {
      applyDateRangeToSearchParams(nextParams, f.awarded, 'a_afrom', 'a_ato')
      applyDateRangeToSearchParams(nextParams, f.created, 'a_cfrom', 'a_cto')
    },
  },
]

function periodAsPickerValue(period: PendingDateRange): [Dayjs | null, Dayjs | null] {
  if (!period) return [null, null]
  return [period[0] ?? null, period[1] ?? null]
}

export function AwardPanel() {
  const { showAlert } = useCmsAlert()

  const {
    pendingFilters,
    setPendingFilters,
    applied: appliedFilter,
    applySearch,
    patchSearchParams,
  } = useListFilterUrl<AwardPendingFilters, AwardListFilter>({
    initialPending: INITIAL_PENDING,
    paramConfig: searchSyncRules,
    parseApplied,
    syncPendingFromUrl: ({ searchParams, setPendingFilters: setPending }) => {
      const isPublic = parsePublic(searchParams.get('a_public'))
      const title = searchParams.get('a_title') ?? ''
      const organization = searchParams.get('a_org') ?? ''
      const sort = parseSort(searchParams.get('a_sort'))
      const aFrom = searchParams.get('a_afrom')
      const aTo = searchParams.get('a_ato')
      const cFrom = searchParams.get('a_cfrom')
      const cTo = searchParams.get('a_cto')

      setPending(prev => {
        const awarded = resolvePendingDateRangeFromUrl({
          ref: awardedSyncRef,
          from: aFrom,
          to: aTo,
          prev: prev.awarded,
        }) as PendingDateRange
        const created = resolvePendingDateRangeFromUrl({
          ref: createdSyncRef,
          from: cFrom,
          to: cTo,
          prev: prev.created,
        }) as PendingDateRange

        const next: AwardPendingFilters = {
          isPublic,
          title,
          organization,
          awarded,
          created,
          sort,
        }
        if (
          prev.isPublic === next.isPublic &&
          prev.title === next.title &&
          prev.organization === next.organization &&
          prev.sort === next.sort &&
          pendingDateRangeTupleEqual(prev.awarded, next.awarded) &&
          pendingDateRangeTupleEqual(prev.created, next.created)
        ) {
          return prev
        }
        return next
      })
    },
  })

  const listQuery = useAwardList(appliedFilter)
  const createMutation = useCreateAward()
  const updateMutation = useUpdateAward()
  const removeMutation = useRemoveAward()
  const setPublicMutation = useSetAwardPublic()

  const rows = listQuery.data ?? []
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [formVariant, setFormVariant] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<AwardItem | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  useInvalidateOnWindowEvent(AWARD_CHANGED_EVENT, historyAwardsCertsQueryKeys.award.lists())

  const handleSearch = useCallback(() => {
    applySearch()
    setSelectedRowKeys([])
  }, [applySearch])

  const handleSortChange = useCallback(
    (value: AwardSortKey) => {
      setPendingFilters(prev => ({ ...prev, sort: value }))
      patchSearchParams(next => {
        if (value === 'created') {
          next.set('a_sort', value)
        } else {
          next.delete('a_sort')
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

  const openEdit = useCallback((row: AwardItem) => {
    setFormVariant('edit')
    setEditing(row)
    setFormOpen(true)
  }, [])

  const handleFormSubmit = useCallback(
    async (values: AwardCreateInput) => {
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
              ? '수상 수정에 실패했습니다. 다시 시도해 주세요.'
              : '수상 등록에 실패했습니다. 다시 시도해 주세요.',
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
        content: '수상 삭제에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [editing, removeMutation, showAlert])

  const handleDeleteClick = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      showAlert({ title: '선택 항목 없음', content: '삭제할 수상을 선택해 주세요.' })
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
        content: '수상 삭제에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [removeMutation, selectedRowKeys, showAlert])

  const totalCount = rows.length
  const columns = useMemo<ColumnsType<AwardItem>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COLUMN_WIDTHS.index,
        className: CMS_TABLE_NO_COL_CLASS,
        align: 'center',
        render: (_v, _r, index) => totalCount - index,
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
            aria-label={`${record.title} 공개 여부`}
          />
        ),
      },
      {
        title: '상명',
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
      },
      {
        title: '수여 기관명',
        dataIndex: 'organization',
        key: 'organization',
        ellipsis: true,
      },
      {
        title: '수상일',
        key: 'awardedOn',
        width: 120,
        align: 'center',
        render: (_v, record) => formatYmdDot(record.awardedOn),
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
            <p className="admin-filter-area__label">상명</p>
            <CmsInput
              inputSize="large"
              width={FILTER_CONTROL_MAX_WIDTH_PX}
              placeholder="상명을 입력하세요"
              value={pendingFilters.title}
              onChange={e => setPendingFilters(prev => ({ ...prev, title: e.target.value }))}
              onPressEnter={handleSearch}
            />
          </div>
          <div className="admin-filter-area__field admin-filter-area__field--control">
            <p className="admin-filter-area__label">수여 기관명</p>
            <CmsInput
              inputSize="large"
              width={FILTER_CONTROL_MAX_WIDTH_PX}
              placeholder="수여 기관명을 입력하세요"
              value={pendingFilters.organization}
              onChange={e =>
                setPendingFilters(prev => ({ ...prev, organization: e.target.value }))
              }
              onPressEnter={handleSearch}
            />
          </div>
          <div className="admin-filter-area__field admin-filter-area__field--date-range">
            <p className="admin-filter-area__label">수상일</p>
            <CmsDateRangePicker
              inputSize="large"
              width={FILTER_CONTROL_WIDE_FIELD_WIDTH_PX}
              value={periodAsPickerValue(pendingFilters.awarded)}
              onChange={dates =>
                setPendingFilters(prev => ({
                  ...prev,
                  awarded: dates ?? null,
                }))
              }
              placeholder={['시작일', '종료일']}
              allowClear
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
            <span className="table-title">수상 목록</span>
            <span className="table-description">총 {totalCount.toLocaleString()}건</span>
          </div>
          <div className="table-header-actions--wrapper hac-panel__toolbar-actions">
            <CmsSelect
              inputSize="medium"
              width={140}
              value={appliedFilter.sort ?? pendingFilters.sort}
              onChange={v => handleSortChange((v as AwardSortKey) ?? 'date')}
              options={[
                { label: '수상일 순', value: 'date' },
                { label: '작성일 순', value: 'created' },
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
                수상 등록
              </CmsButton>
            </div>
          </div>
        </div>

        <div className="hac-panel__table-scroll">
          <Table<AwardItem>
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

      <AwardFormModal
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
        title="수상 삭제"
        content={`선택한 수상 ${selectedRowKeys.length}건을 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다.`}
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
