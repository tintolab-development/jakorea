import { useCallback, useMemo, useState, type Key } from 'react'
import { Switch, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import { DetailInfoFormTdDivider } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type {
  CertCreateInput,
  CertItem,
  CertListFilter,
  CertSortKey,
  PublicFilterValue,
} from '@/entities/history-awards-certs/model/types'
import {
  useCertList,
  useCreateCert,
  useRemoveCert,
  useSetCertPublic,
  useUpdateCert,
} from '@/features/history-awards-certs/api/hooks'
import { historyAwardsCertsQueryKeys } from '@/features/history-awards-certs/api/query-keys'
import { CERT_CHANGED_EVENT } from '@/features/history-awards-certs/api/store'
import {
  formatCreatedDateTime,
  formatYmdDot,
} from '@/features/history-awards-certs/lib/format'
import { CertFormModal } from '@/features/history-awards-certs/ui/cert-form-modal'
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

type CertPendingFilters = {
  isPublic: PublicFilterValue
  content: string
  organization: string
  certified: PendingDateRange
  created: PendingDateRange
  sort: CertSortKey
}

const INITIAL_PENDING: CertPendingFilters = {
  isPublic: '',
  content: '',
  organization: '',
  certified: null,
  created: null,
  sort: 'date',
}

const certifiedSyncRef: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }
const createdSyncRef: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }

function parsePublic(raw: string | null): PublicFilterValue {
  if (raw === 'true' || raw === 'false') return raw
  return ''
}

function parseSort(raw: string | null): CertSortKey {
  return raw === 'created' ? 'created' : 'date'
}

function parseApplied(searchParams: URLSearchParams): CertListFilter {
  const filter: CertListFilter = { sort: parseSort(searchParams.get('c_sort')) }
  const isPublic = parsePublic(searchParams.get('c_public'))
  if (isPublic === 'true') filter.isPublic = true
  if (isPublic === 'false') filter.isPublic = false
  const content = (searchParams.get('c_content') ?? '').trim()
  if (content) filter.content = content
  const organization = (searchParams.get('c_org') ?? '').trim()
  if (organization) filter.organization = organization
  const certifiedFrom = ymdFromParam(searchParams.get('c_cfrom'))
  const certifiedTo = ymdFromParam(searchParams.get('c_cto'))
  if (certifiedFrom) filter.certifiedFrom = certifiedFrom
  if (certifiedTo) filter.certifiedTo = certifiedTo
  const createdFrom = ymdFromParam(searchParams.get('c_crfrom'))
  const createdTo = ymdFromParam(searchParams.get('c_crto'))
  if (createdFrom) filter.createdFrom = createdFrom
  if (createdTo) filter.createdTo = createdTo
  return filter
}

const searchSyncRules: readonly TableSearchParamRule<CertPendingFilters>[] = [
  {
    kind: 'param',
    filterKey: 'isPublic',
    paramKey: 'c_public',
    condition: f => f.isPublic === 'true' || f.isPublic === 'false',
  },
  {
    kind: 'param',
    filterKey: 'content',
    paramKey: 'c_content',
    condition: f => f.content.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'organization',
    paramKey: 'c_org',
    condition: f => f.organization.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'sort',
    paramKey: 'c_sort',
    condition: f => f.sort === 'created',
  },
  {
    kind: 'apply',
    apply: (nextParams, f) => {
      applyDateRangeToSearchParams(nextParams, f.certified, 'c_cfrom', 'c_cto')
      applyDateRangeToSearchParams(nextParams, f.created, 'c_crfrom', 'c_crto')
    },
  },
]

function periodAsPickerValue(period: PendingDateRange): [Dayjs | null, Dayjs | null] {
  if (!period) return [null, null]
  return [period[0] ?? null, period[1] ?? null]
}

export function CertPanel() {
  const { showAlert } = useCmsAlert()

  const {
    pendingFilters,
    setPendingFilters,
    applied: appliedFilter,
    applySearch,
    patchSearchParams,
  } = useListFilterUrl<CertPendingFilters, CertListFilter>({
    initialPending: INITIAL_PENDING,
    paramConfig: searchSyncRules,
    parseApplied,
    syncPendingFromUrl: ({ searchParams, setPendingFilters: setPending }) => {
      const isPublic = parsePublic(searchParams.get('c_public'))
      const content = searchParams.get('c_content') ?? ''
      const organization = searchParams.get('c_org') ?? ''
      const sort = parseSort(searchParams.get('c_sort'))
      const certFrom = searchParams.get('c_cfrom')
      const certTo = searchParams.get('c_cto')
      const crFrom = searchParams.get('c_crfrom')
      const crTo = searchParams.get('c_crto')

      setPending(prev => {
        const certified = resolvePendingDateRangeFromUrl({
          ref: certifiedSyncRef,
          from: certFrom,
          to: certTo,
          prev: prev.certified,
        }) as PendingDateRange
        const created = resolvePendingDateRangeFromUrl({
          ref: createdSyncRef,
          from: crFrom,
          to: crTo,
          prev: prev.created,
        }) as PendingDateRange

        const next: CertPendingFilters = {
          isPublic,
          content,
          organization,
          certified,
          created,
          sort,
        }
        if (
          prev.isPublic === next.isPublic &&
          prev.content === next.content &&
          prev.organization === next.organization &&
          prev.sort === next.sort &&
          pendingDateRangeTupleEqual(prev.certified, next.certified) &&
          pendingDateRangeTupleEqual(prev.created, next.created)
        ) {
          return prev
        }
        return next
      })
    },
  })

  const listQuery = useCertList(appliedFilter)
  const createMutation = useCreateCert()
  const updateMutation = useUpdateCert()
  const removeMutation = useRemoveCert()
  const setPublicMutation = useSetCertPublic()

  const rows = listQuery.data ?? []
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [formVariant, setFormVariant] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<CertItem | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  useInvalidateOnWindowEvent(CERT_CHANGED_EVENT, historyAwardsCertsQueryKeys.cert.lists())

  const handleSearch = useCallback(() => {
    applySearch()
    setSelectedRowKeys([])
  }, [applySearch])

  const handleSortChange = useCallback(
    (value: CertSortKey) => {
      setPendingFilters(prev => ({ ...prev, sort: value }))
      patchSearchParams(next => {
        if (value === 'created') {
          next.set('c_sort', value)
        } else {
          next.delete('c_sort')
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

  const openEdit = useCallback((row: CertItem) => {
    setFormVariant('edit')
    setEditing(row)
    setFormOpen(true)
  }, [])

  const handleFormSubmit = useCallback(
    async (values: CertCreateInput) => {
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
              ? '인증 수정에 실패했습니다. 다시 시도해 주세요.'
              : '인증 등록에 실패했습니다. 다시 시도해 주세요.',
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
        content: '인증 삭제에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [editing, removeMutation, showAlert])

  const handleDeleteClick = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      showAlert({ title: '선택 항목 없음', content: '삭제할 인증을 선택해 주세요.' })
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
        content: '인증 삭제에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [removeMutation, selectedRowKeys, showAlert])

  const totalCount = rows.length
  const columns = useMemo<ColumnsType<CertItem>>(
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
        title: '내용',
        dataIndex: 'content',
        key: 'content',
        ellipsis: true,
      },
      {
        title: '인증 기관명',
        dataIndex: 'organization',
        key: 'organization',
        ellipsis: true,
      },
      {
        title: '인증일',
        key: 'certifiedOn',
        width: 120,
        align: 'center',
        render: (_v, record) => formatYmdDot(record.certifiedOn),
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
            <p className="admin-filter-area__label">내용</p>
            <CmsInput
              inputSize="large"
              width={FILTER_CONTROL_MAX_WIDTH_PX}
              placeholder="내용을 입력하세요"
              value={pendingFilters.content}
              onChange={e => setPendingFilters(prev => ({ ...prev, content: e.target.value }))}
              onPressEnter={handleSearch}
            />
          </div>
          <div className="admin-filter-area__field admin-filter-area__field--control">
            <p className="admin-filter-area__label">인증 기관명</p>
            <CmsInput
              inputSize="large"
              width={FILTER_CONTROL_MAX_WIDTH_PX}
              placeholder="인증 기관명을 입력하세요"
              value={pendingFilters.organization}
              onChange={e =>
                setPendingFilters(prev => ({ ...prev, organization: e.target.value }))
              }
              onPressEnter={handleSearch}
            />
          </div>
          <div className="admin-filter-area__field admin-filter-area__field--date-range">
            <p className="admin-filter-area__label">인증일</p>
            <CmsDateRangePicker
              inputSize="large"
              width={FILTER_CONTROL_WIDE_FIELD_WIDTH_PX}
              value={periodAsPickerValue(pendingFilters.certified)}
              onChange={dates =>
                setPendingFilters(prev => ({
                  ...prev,
                  certified: dates ?? null,
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
            <span className="table-title">인증 목록</span>
            <span className="table-description">총 {totalCount.toLocaleString()}건</span>
          </div>
          <div className="table-header-actions--wrapper hac-panel__toolbar-actions">
            <CmsSelect
              inputSize="medium"
              width={140}
              value={appliedFilter.sort ?? pendingFilters.sort}
              onChange={v => handleSortChange((v as CertSortKey) ?? 'date')}
              options={[
                { label: '인증일 순', value: 'date' },
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
                인증 등록
              </CmsButton>
            </div>
          </div>
        </div>

        <div className="hac-panel__table-scroll">
          <Table<CertItem>
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

      <CertFormModal
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
        title="인증 삭제"
        content={`선택한 인증 ${selectedRowKeys.length}건을 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다.`}
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
