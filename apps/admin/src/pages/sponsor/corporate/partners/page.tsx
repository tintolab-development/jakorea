/**
 * 후원사 목록 관리
 */

import { useCallback, useMemo, useState, type Key } from 'react'
import type { Dayjs } from 'dayjs'
import { Image, Switch } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type {
  CorporatePartner,
  CorporatePartnerListFilter,
} from '@/entities/corporate-partner/model/types'
import { formatDateTimeDot } from '@/shared/lib/format-display'
import {
  useCorporatePartnersList,
  useCreateCorporatePartner,
  useRemoveCorporatePartners,
  useReorderCorporatePartners,
  useSetCorporatePartnerPublic,
  useUpdateCorporatePartner,
} from '@/features/corporate-partner/api/hooks'
import { corporatePartnerQueryKeys } from '@/features/corporate-partner/api/query-keys'
import { CORPORATE_PARTNERS_CHANGED_EVENT } from '@/features/corporate-partner/api/store'
import { corporatePartnerMutationFailureAlert } from '@/features/corporate-partner/lib/mutation-failure-alert'
import {
  CorporatePartnerFormModal,
  type CorporatePartnerFormValues,
} from '@/features/corporate-partner/ui/form-modal'
import {
  CorporatePartnerDragHandle,
  CorporatePartnersSortableTable,
} from '@/features/corporate-partner/ui/sortable-table'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
  FILTER_SEARCH_BUTTON_WIDTH_PX,
} from '@/shared/constants/filter-field-width'
import {
  CMS_TABLE_NO_COL_CLASS,
  CMS_TABLE_SORT_COL_CLASS,
  CMS_TABLE_USAGE_COL_CLASS,
  TABLE_COLUMN_WIDTHS,
} from '@/shared/constants/table'
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

type PublicFilterValue = '' | 'true' | 'false'

type PartnerPendingFilters = {
  isPublic: PublicFilterValue
  name: string
  registeredRange: PendingDateRange
}

const INITIAL_PENDING: PartnerPendingFilters = {
  isPublic: '',
  name: '',
  registeredRange: null,
}

const registeredSyncRef: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }

function parsePublic(raw: string | null): PublicFilterValue {
  if (raw === 'true' || raw === 'false') return raw
  return ''
}

function parseApplied(searchParams: URLSearchParams): CorporatePartnerListFilter {
  const filter: CorporatePartnerListFilter = {}
  const pub = parsePublic(searchParams.get('sp_public'))
  if (pub === 'true') filter.isPublic = true
  if (pub === 'false') filter.isPublic = false
  const name = (searchParams.get('sp_name') ?? '').trim()
  if (name) filter.name = name
  const from = ymdFromParam(searchParams.get('sp_from'))
  const to = ymdFromParam(searchParams.get('sp_to'))
  if (from) filter.registeredFrom = from
  if (to) filter.registeredTo = to
  return filter
}

const searchSyncRules: readonly TableSearchParamRule<PartnerPendingFilters>[] = [
  {
    kind: 'param',
    filterKey: 'isPublic',
    paramKey: 'sp_public',
    condition: f => f.isPublic === 'true' || f.isPublic === 'false',
  },
  {
    kind: 'param',
    filterKey: 'name',
    paramKey: 'sp_name',
    condition: f => f.name.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'apply',
    apply: (nextParams, f) => {
      applyDateRangeToSearchParams(nextParams, f.registeredRange, 'sp_from', 'sp_to')
    },
  },
]

function formatCreatedAt(iso: string): string {
  return formatDateTimeDot(iso)
}

function periodAsPickerValue(
  period: PendingDateRange
): [Dayjs | null, Dayjs | null] {
  if (!period) return [null, null]
  return [period[0] ?? null, period[1] ?? null]
}

export function CorporatePartnersPage() {
  const { showAlert } = useCmsAlert()

  const {
    pendingFilters,
    setPendingFilters,
    applied: appliedFilter,
    applySearch,
  } = useListFilterUrl<PartnerPendingFilters, CorporatePartnerListFilter>({
    initialPending: INITIAL_PENDING,
    paramConfig: searchSyncRules,
    parseApplied,
    syncPendingFromUrl: ({ searchParams, setPendingFilters: setPending }) => {
      const isPublic = parsePublic(searchParams.get('sp_public'))
      const name = searchParams.get('sp_name') ?? ''
      const from = searchParams.get('sp_from')
      const to = searchParams.get('sp_to')

      setPending(prev => {
        const registeredRange = resolvePendingDateRangeFromUrl({
          ref: registeredSyncRef,
          from,
          to,
          prev: prev.registeredRange,
        }) as PendingDateRange

        const next: PartnerPendingFilters = { isPublic, name, registeredRange }
        if (
          prev.isPublic === next.isPublic &&
          prev.name === next.name &&
          pendingDateRangeTupleEqual(prev.registeredRange, next.registeredRange)
        ) {
          return prev
        }
        return next
      })
    },
  })

  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editingPartner, setEditingPartner] = useState<CorporatePartner | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const hasActiveFilter = useMemo(() => {
    return (
      appliedFilter.isPublic !== undefined ||
      Boolean(appliedFilter.name?.trim()) ||
      Boolean(appliedFilter.registeredFrom) ||
      Boolean(appliedFilter.registeredTo)
    )
  }, [appliedFilter])

  const listQuery = useCorporatePartnersList(appliedFilter)
  /**
   * 등록 모달용 전체 건수.
   * 필터 없는 목록이면 listQuery.totalCount로 충분하고,
   * 필터 중 등록 시에만 별도 전체 목록 GET (필터 GET과 혼동 방지).
   */
  const unfilteredCountQuery = useCorporatePartnersList(
    undefined,
    formOpen && formMode === 'create' && hasActiveFilter,
  )
  const createMutation = useCreateCorporatePartner()
  const updateMutation = useUpdateCorporatePartner(appliedFilter)
  const removeMutation = useRemoveCorporatePartners(appliedFilter)
  const reorderMutation = useReorderCorporatePartners(appliedFilter)
  const setPublicMutation = useSetCorporatePartnerPublic(appliedFilter)

  const rows = useMemo(() => listQuery.data?.items ?? [], [listQuery.data?.items])
  const totalCount = listQuery.data?.totalCount ?? rows.length
  const allCount = hasActiveFilter
    ? (unfilteredCountQuery.data?.totalCount ??
      unfilteredCountQuery.data?.items.length ??
      0)
    : totalCount

  useInvalidateOnWindowEvent(
    CORPORATE_PARTNERS_CHANGED_EVENT,
    corporatePartnerQueryKeys.lists()
  )

  const handleSearch = useCallback(() => {
    applySearch()
    setSelectedRowKeys([])
  }, [applySearch])

  const handleRowsReorder = useCallback(
    (reorderedRows: CorporatePartner[]) => {
      void reorderMutation
        .mutateAsync(reorderedRows.map(row => row.id))
        .catch(error => {
          const alert = corporatePartnerMutationFailureAlert(
            error,
            '후원사 순서 저장에 실패했습니다. 목록을 다시 불러옵니다.',
          )
          showAlert(alert)
          void listQuery.refetch()
        })
    },
    [listQuery, reorderMutation, showAlert]
  )

  const handleTogglePublic = useCallback(
    (id: string, isPublic: boolean) => {
      void setPublicMutation.mutateAsync({ id, isPublic }).catch(error => {
        const alert = corporatePartnerMutationFailureAlert(
          error,
          '공개 여부 변경에 실패했습니다. 다시 시도해 주세요.',
        )
        showAlert(alert)
        void listQuery.refetch()
      })
    },
    [listQuery, setPublicMutation, showAlert]
  )

  const openCreate = useCallback(() => {
    setFormMode('create')
    setEditingPartner(null)
    setFormOpen(true)
  }, [])

  const openEdit = useCallback((partner: CorporatePartner) => {
    setFormMode('edit')
    setEditingPartner(partner)
    setFormOpen(true)
  }, [])

  const handleFormSubmit = useCallback(
    async (values: CorporatePartnerFormValues) => {
      try {
        if (formMode === 'edit' && editingPartner) {
          await updateMutation.mutateAsync({ id: editingPartner.id, patch: values })
        } else {
          await createMutation.mutateAsync(values)
        }
        setFormOpen(false)
        setEditingPartner(null)
      } catch (error) {
        const alert = corporatePartnerMutationFailureAlert(
          error,
          formMode === 'edit'
            ? '후원사 수정에 실패했습니다. 다시 시도해 주세요.'
            : '후원사 등록에 실패했습니다. 다시 시도해 주세요.',
        )
        showAlert(alert)
      }
    },
    [createMutation, editingPartner, formMode, showAlert, updateMutation]
  )

  const handleDeleteClick = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      showAlert({
        title: '선택 항목 없음',
        content: '삭제할 후원사를 선택해 주세요.',
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
    } catch (error) {
      const alert = corporatePartnerMutationFailureAlert(
        error,
        '후원사 삭제에 실패했습니다. 다시 시도해 주세요.',
      )
      showAlert(alert)
    }
  }, [removeMutation, selectedRowKeys, showAlert])

  const columns = useMemo<ColumnsType<CorporatePartner>>(
    () => [
      {
        title: '순서',
        key: 'sort',
        width: TABLE_COLUMN_WIDTHS.sort,
        className: CMS_TABLE_SORT_COL_CLASS,
        align: 'center',
        render: () => <CorporatePartnerDragHandle />,
      },
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COLUMN_WIDTHS.index,
        className: CMS_TABLE_NO_COL_CLASS,
        align: 'center',
        render: (_value, _record, index) => index + 1,
      },
      {
        title: '공개 여부',
        key: 'isPublic',
        width: TABLE_COLUMN_WIDTHS.usage,
        align: 'center',
        className: CMS_TABLE_USAGE_COL_CLASS,
        render: (_value, record) => (
          <Switch
            checked={record.isPublic}
            disabled={setPublicMutation.isPending}
            onChange={checked => handleTogglePublic(record.id, checked)}
            aria-label={`${record.name || '후원사'} 공개 여부`}
          />
        ),
      },
      {
        title: '로고 이미지',
        key: 'logo',
        width: 290,
        align: 'center',
        render: (_value, record) => (
          <div className="corporate-partners-page__thumb-wrap">
            <Image
              className="corporate-partners-page__thumb"
              src={record.logoUrl}
              alt={record.logoFileName || record.name || '후원사 로고'}
              preview={{ mask: '이미지 보기' }}
            />
          </div>
        ),
      },
      {
        title: '기업명',
        dataIndex: 'name',
        key: 'name',
        align: 'center',
        ellipsis: true,
      },
      {
        title: '등록일시',
        key: 'createdAt',
        width: 160,
        align: 'center',
        render: (_value, record) => formatCreatedAt(record.createdAt),
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
              openEdit(record)
            }}
          >
            수정
          </CmsButton>
        ),
      },
    ],
    [handleTogglePublic, openEdit, setPublicMutation.isPending]
  )

  const formLoading =
    formMode === 'edit' ? updateMutation.isPending : createMutation.isPending

  const emptyText = hasActiveFilter
    ? '검색 결과가 없습니다. 필터 조건을 변경해 주세요.'
    : '등록된 후원사가 없습니다.'

  return (
    <div className="corporate-partners-page">
      <div className="admin-list-card corporate-partners-page__filter-card">
        <div className="admin-filter-area corporate-partners-page__filter-row">
          <div className="admin-filter-area__field admin-filter-area__field--control">
            <span className="admin-filter-area__label">공개 여부</span>
            <CmsSelect
              inputSize="large"
              width={FILTER_CONTROL_MAX_WIDTH_PX}
              withAllOption
              value={pendingFilters.isPublic}
              onChange={value =>
                setPendingFilters(prev => ({
                  ...prev,
                  isPublic: (value as PublicFilterValue) ?? '',
                }))
              }
              options={[
                { label: '공개', value: 'true' },
                { label: '비공개', value: 'false' },
              ]}
              placeholder="전체"
            />
          </div>
          <div className="admin-filter-area__field admin-filter-area__field--control">
            <span className="admin-filter-area__label">기업명</span>
            <CmsInput
              inputSize="large"
              width={FILTER_CONTROL_MAX_WIDTH_PX}
              placeholder="기업명 검색"
              value={pendingFilters.name}
              onChange={e => setPendingFilters(prev => ({ ...prev, name: e.target.value }))}
              onPressEnter={handleSearch}
            />
          </div>
          <div className="admin-filter-area__field admin-filter-area__field--date-range">
            <span className="admin-filter-area__label">등록일</span>
            <CmsDateRangePicker
              inputSize="large"
              width={FILTER_CONTROL_WIDE_FIELD_WIDTH_PX}
              value={periodAsPickerValue(pendingFilters.registeredRange)}
              onChange={dates =>
                setPendingFilters(prev => ({
                  ...prev,
                  registeredRange: dates ?? null,
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
            <span className="table-title">후원사 목록</span>
            <span className="table-description">총 {totalCount.toLocaleString()}건</span>
          </div>
          <div className="table-header-actions--wrapper">
            <CmsButton
              variant="delete"
              size="large"
              type="button"
              onClick={handleDeleteClick}
              disabled={removeMutation.isPending}
            >
              선택 삭제
            </CmsButton>
            <CmsButton
              variant="primary"
              size="large"
              type="button"
              onClick={openCreate}
            >
              후원사 등록
            </CmsButton>
          </div>
        </div>

        <CorporatePartnersSortableTable
          rows={rows}
          columns={columns}
          loading={listQuery.isLoading || reorderMutation.isPending}
          disabled={reorderMutation.isPending}
          onRowsReorder={handleRowsReorder}
          locale={{ emptyText }}
          rowSelection={{
            selectedRowKeys,
            onChange: keys => setSelectedRowKeys(keys),
          }}
        />
      </div>

      <CorporatePartnerFormModal
        open={formOpen}
        mode={formMode}
        initial={editingPartner}
        totalCount={allCount}
        confirmLoading={formLoading}
        onCancel={() => {
          setFormOpen(false)
          setEditingPartner(null)
        }}
        onSubmit={values => {
          void handleFormSubmit(values)
        }}
      />

      <ConfirmModal
        open={deleteConfirmOpen}
        title="후원사 삭제"
        content={`선택한 후원사 ${selectedRowKeys.length}건을 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다.`}
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
