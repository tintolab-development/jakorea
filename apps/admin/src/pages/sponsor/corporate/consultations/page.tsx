/**
 * 기업 후원 상담 신청 관리 목록
 */

import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import type { Dayjs } from 'dayjs'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type { ColumnsType } from 'antd/es/table'
import type {
  ConsultationStatus,
  CorporateConsultation,
  CorporateConsultationListFilter,
} from '@/entities/corporate-consultation/model/types'
import {
  useConfirmCorporateConsultations,
  useCorporateConsultationsList,
  useRemoveCorporateConsultations,
} from '@/features/corporate-consultation/api/hooks'
import { corporateConsultationQueryKeys } from '@/features/corporate-consultation/api/query-keys'
import { isAdminForbidden, isAdminNotFound } from '@/features/system-inbox/lib/http-status'
import { getCorporateConsultationService } from '@/features/corporate-consultation/api/service'
import { formatDateTimeDot } from '@/shared/lib/format-display'
import {
  CORPORATE_CONSULTATIONS_CHANGED_EVENT,
  DEFAULT_CONFIRM_ACTOR,
} from '@/features/corporate-consultation/api/store'
import { corporateConsultationMutationFailureAlert } from '@/features/corporate-consultation/lib/mutation-failure-alert'
import { displayServerPiiAsIs } from '@/shared/lib/homepage-pii-display'
import { CorporateConsultationDetailModal } from '@/features/corporate-consultation/ui/detail-modal'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
} from '@/shared/constants/filter-field-width'
import { CMS_TABLE_NO_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import { isTableSelectionClick } from '@/shared/lib/is-table-selection-click'
import { useInvalidateOnWindowEvent } from '@/shared/lib/use-invalidate-on-window-event'
import { useListFilterUrl } from '@/shared/lib/use-list-filter-url'
import { useUrlDetailId } from '@/shared/lib/use-url-detail-id'
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
  NO_SELECTION_ALERT,
  showChangeCompletedAlert,
  showDeleteCompletedAlert,
  useCmsAlert,
  FilterTableLayout,
} from '@/shared/ui'

import './page.css'
import { ADMIN_ACCESS_DENIED_ALERT } from '@/shared/lib/admin-access-denied'

type StatusPending = '' | ConsultationStatus

type ConsultationPendingFilters = {
  status: StatusPending
  companyName: string
  contactName: string
  departmentTitle: string
  appliedRange: PendingDateRange
  confirmedRange: PendingDateRange
}

const INITIAL_PENDING: ConsultationPendingFilters = {
  status: '',
  companyName: '',
  contactName: '',
  departmentTitle: '',
  appliedRange: null,
  confirmedRange: null,
}

const appliedSyncRef: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }
const confirmedSyncRef: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }
const DETAIL_QUERY_KEYS = ['applicationId', 'consultationId'] as const

const COL = {
  checkbox: TABLE_COLUMN_WIDTHS.checkbox,
  no: TABLE_COLUMN_WIDTHS.index,
  status: 120,
  company: 160,
  contact: 110,
  department: 140,
  phone: TABLE_COLUMN_WIDTHS.phone,
  applied: 160,
  confirmed: 160,
} as const

/**
 * 상담 목록의 최소 테이블 폭.
 * 기업명 열은 이 폭을 기준으로 화면의 잔여 폭을 사용하고,
 * 나머지 열은 신청 확인 전후에도 같은 폭을 유지한다.
 */
const TABLE_MIN_WIDTH =
  COL.checkbox +
  COL.no +
  COL.status +
  COL.company +
  COL.contact +
  COL.department +
  COL.phone +
  COL.applied +
  COL.confirmed

function parseStatus(raw: string | null): StatusPending {
  if (raw === 'pending' || raw === 'confirmed') return raw
  return ''
}

function parseApplied(searchParams: URLSearchParams): CorporateConsultationListFilter {
  const filter: CorporateConsultationListFilter = {}
  const status = parseStatus(searchParams.get('cc_status'))
  if (status === 'pending' || status === 'confirmed') {
    filter.status = status
  }
  const companyName = (searchParams.get('cc_company') ?? '').trim()
  if (companyName) filter.companyName = companyName
  const contactName = (searchParams.get('cc_contact') ?? '').trim()
  if (contactName) filter.contactName = contactName
  const departmentTitle = (searchParams.get('cc_dept') ?? '').trim()
  if (departmentTitle) filter.departmentTitle = departmentTitle
  const appliedFrom = ymdFromParam(searchParams.get('cc_applied_from'))
  const appliedTo = ymdFromParam(searchParams.get('cc_applied_to'))
  if (appliedFrom) filter.appliedFrom = appliedFrom
  if (appliedTo) filter.appliedTo = appliedTo
  const confirmedFrom = ymdFromParam(searchParams.get('cc_confirmed_from'))
  const confirmedTo = ymdFromParam(searchParams.get('cc_confirmed_to'))
  if (confirmedFrom) filter.confirmedFrom = confirmedFrom
  if (confirmedTo) filter.confirmedTo = confirmedTo
  return filter
}

const searchSyncRules: readonly TableSearchParamRule<ConsultationPendingFilters>[] = [
  {
    kind: 'param',
    filterKey: 'status',
    paramKey: 'cc_status',
    condition: f => f.status === 'pending' || f.status === 'confirmed',
  },
  {
    kind: 'param',
    filterKey: 'companyName',
    paramKey: 'cc_company',
    condition: f => f.companyName.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'contactName',
    paramKey: 'cc_contact',
    condition: f => f.contactName.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'departmentTitle',
    paramKey: 'cc_dept',
    condition: f => f.departmentTitle.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'apply',
    apply: (nextParams, f) => {
      applyDateRangeToSearchParams(nextParams, f.appliedRange, 'cc_applied_from', 'cc_applied_to')
      applyDateRangeToSearchParams(
        nextParams,
        f.confirmedRange,
        'cc_confirmed_from',
        'cc_confirmed_to'
      )
    },
  },
]

function rangeAsPicker(period: PendingDateRange): [Dayjs | null, Dayjs | null] {
  if (!period) return [null, null]
  return [period[0] ?? null, period[1] ?? null]
}

function formatDateTime(iso: string | null | undefined): string {
  return formatDateTimeDot(iso)
}

function statusLabel(status: ConsultationStatus): string {
  return status === 'confirmed' ? '확인 완료' : '확인 대기'
}

export function CorporateConsultationsPage() {
  const { showAlert } = useCmsAlert()

  const {
    pendingFilters,
    setPendingFilters,
    patchPendingFilters,
    applied: appliedFilter,
    applySearch,
    searchParams,
    patchSearchParams,
    hasActiveFilters,
  } = useListFilterUrl<ConsultationPendingFilters, CorporateConsultationListFilter>({
    initialPending: INITIAL_PENDING,
    paramConfig: searchSyncRules,
    parseApplied,
    syncPendingFromUrl: ({ searchParams, setPendingFilters: setPending }) => {
      const status = parseStatus(searchParams.get('cc_status'))
      const companyName = searchParams.get('cc_company') ?? ''
      const contactName = searchParams.get('cc_contact') ?? ''
      const departmentTitle = searchParams.get('cc_dept') ?? ''
      const appliedFrom = searchParams.get('cc_applied_from')
      const appliedTo = searchParams.get('cc_applied_to')
      const confirmedFrom = searchParams.get('cc_confirmed_from')
      const confirmedTo = searchParams.get('cc_confirmed_to')

      setPending(prev => {
        const appliedRange = resolvePendingDateRangeFromUrl({
          ref: appliedSyncRef,
          from: appliedFrom,
          to: appliedTo,
          prev: prev.appliedRange,
        }) as PendingDateRange
        const confirmedRange = resolvePendingDateRangeFromUrl({
          ref: confirmedSyncRef,
          from: confirmedFrom,
          to: confirmedTo,
          prev: prev.confirmedRange,
        }) as PendingDateRange

        const next: ConsultationPendingFilters = {
          status,
          companyName,
          contactName,
          departmentTitle,
          appliedRange,
          confirmedRange,
        }
        if (
          prev.status === next.status &&
          prev.companyName === next.companyName &&
          prev.contactName === next.contactName &&
          prev.departmentTitle === next.departmentTitle &&
          pendingDateRangeTupleEqual(prev.appliedRange, next.appliedRange) &&
          pendingDateRangeTupleEqual(prev.confirmedRange, next.confirmedRange)
        ) {
          return prev
        }
        return next
      })
    },
  })

  const listQuery = useCorporateConsultationsList(appliedFilter)
  const removeMutation = useRemoveCorporateConsultations(appliedFilter)
  const confirmMutation = useConfirmCorporateConsultations(appliedFilter)

  const { sentinelRef } = useGatedInfiniteScroll({
    hasNextPage: listQuery.hasNextPage,
    isFetchingNextPage: listQuery.isFetchingNextPage,
    fetchNextPage: listQuery.fetchNextPage,
    resetKey: JSON.stringify(appliedFilter),
  })

  useInvalidateOnWindowEvent(
    CORPORATE_CONSULTATIONS_CHANGED_EVENT,
    corporateConsultationQueryKeys.all
  )

  const rows = listQuery.rows
  const totalCount = listQuery.totalCount

  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [detailRow, setDetailRow] = useState<CorporateConsultation | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false)
  const { detailId, openDetail, closeDetail } = useUrlDetailId(
    searchParams,
    patchSearchParams,
    DETAIL_QUERY_KEYS
  )
  const detailOpen = detailId != null

  const rowNoMap = useMemo(() => {
    const map = new Map<string, number>()
    const total = totalCount
    rows.forEach((row, index) => {
      map.set(row.id, total - index)
    })
    return map
  }, [totalCount, rows])

  const handleSearch = useCallback(() => {
    applySearch()
    setSelectedRowKeys([])
  }, [applySearch])

  useEffect(() => {
    if (!detailId) {
      setDetailRow(null)
      setDetailLoading(false)
      return
    }

    setDetailRow(null)
    setDetailLoading(true)
    let cancelled = false
    void getCorporateConsultationService(detailId, DEFAULT_CONFIRM_ACTOR)
      .then(item => {
        if (cancelled) return
        if (!item) {
          showAlert({
            title: '신청을 찾을 수 없음',
            content: '신청 정보를 찾을 수 없습니다.',
          })
          closeDetail()
          return
        }
        setDetailRow(item)
      })
      .catch(error => {
        if (cancelled) return
        if (isAdminForbidden(error)) {
          showAlert({ ...ADMIN_ACCESS_DENIED_ALERT })
          closeDetail()
          return
        }
        if (isAdminNotFound(error)) {
          showAlert({
            title: '신청을 찾을 수 없음',
            content: '신청 정보를 찾을 수 없습니다.',
          })
          closeDetail()
          return
        }
        showAlert({
          title: '조회 실패',
          content: '신청 상세를 불러오지 못했습니다. 다시 시도해 주세요.',
        })
        closeDetail()
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [closeDetail, detailId, showAlert])

  const refreshDetailFromList = useCallback(
    async (id: string) => {
      void listQuery.refetch()
      const detail = await getCorporateConsultationService(id, DEFAULT_CONFIRM_ACTOR)
      setDetailRow(detail)
      if (!detail) closeDetail()
    },
    [closeDetail, listQuery]
  )

  const handleBulkDeleteClick = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      showAlert(NO_SELECTION_ALERT)
      return
    }
    setBulkDeleteOpen(true)
  }, [selectedRowKeys.length, showAlert])

  const handleBulkConfirmClick = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      showAlert(NO_SELECTION_ALERT)
      return
    }
    setBulkConfirmOpen(true)
  }, [selectedRowKeys.length, showAlert])

  const handleBulkDeleteConfirm = useCallback(async () => {
    try {
      await removeMutation.mutateAsync(selectedRowKeys.map(String))
      setSelectedRowKeys([])
      setBulkDeleteOpen(false)
      if (detailRow && selectedRowKeys.map(String).includes(detailRow.id)) {
        closeDetail()
      }
      showDeleteCompletedAlert()
    } catch (error) {
      showAlert(
        corporateConsultationMutationFailureAlert(
          error,
          '상담 신청 삭제에 실패했습니다. 다시 시도해 주세요.'
        )
      )
      void listQuery.refetch()
    }
  }, [closeDetail, detailRow, listQuery, removeMutation, selectedRowKeys, showAlert])

  const handleBulkConfirm = useCallback(async () => {
    try {
      await confirmMutation.mutateAsync({
        ids: selectedRowKeys.map(String),
        actorName: DEFAULT_CONFIRM_ACTOR,
      })
      setSelectedRowKeys([])
      setBulkConfirmOpen(false)
      if (detailRow && selectedRowKeys.map(String).includes(detailRow.id)) {
        await refreshDetailFromList(detailRow.id)
      }
      showChangeCompletedAlert()
    } catch (error) {
      showAlert(
        corporateConsultationMutationFailureAlert(
          error,
          '상담 신청 확인에 실패했습니다. 다시 시도해 주세요.'
        )
      )
      void listQuery.refetch()
    }
  }, [confirmMutation, detailRow, listQuery, refreshDetailFromList, selectedRowKeys, showAlert])

  const handleDetailConfirm = useCallback(async () => {
    if (!detailRow) return
    try {
      await confirmMutation.mutateAsync({
        ids: [detailRow.id],
        actorName: DEFAULT_CONFIRM_ACTOR,
      })
      await refreshDetailFromList(detailRow.id)
      showChangeCompletedAlert()
    } catch (error) {
      showAlert(
        corporateConsultationMutationFailureAlert(
          error,
          '상담 신청 확인에 실패했습니다. 다시 시도해 주세요.'
        )
      )
    }
  }, [confirmMutation, detailRow, refreshDetailFromList, showAlert])

  const handleDetailDelete = useCallback(async () => {
    if (!detailRow) return
    try {
      await removeMutation.mutateAsync([detailRow.id])
      setSelectedRowKeys(prev => prev.filter(k => k !== detailRow.id))
      closeDetail()
      showDeleteCompletedAlert()
    } catch (error) {
      showAlert(
        corporateConsultationMutationFailureAlert(
          error,
          '상담 신청 삭제에 실패했습니다. 다시 시도해 주세요.'
        )
      )
    }
  }, [closeDetail, detailRow, removeMutation, showAlert])

  const columns: ColumnsType<CorporateConsultation> = useMemo(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: COL.no,
        className: CMS_TABLE_NO_COL_CLASS,
        align: 'center',
        render: (_, row) => rowNoMap.get(row.id) ?? '-',
      },
      {
        title: '처리 상태',
        dataIndex: 'status',
        key: 'status',
        width: COL.status,
        align: 'center',
        render: (value: ConsultationStatus) => (
          <span
            className={
              value === 'pending'
                ? 'corp-consultations-page__status corp-consultations-page__status--pending'
                : 'corp-consultations-page__status corp-consultations-page__status--confirmed'
            }
          >
            {statusLabel(value)}
          </span>
        ),
      },
      {
        title: '기업명',
        dataIndex: 'companyName',
        key: 'companyName',
        // 유연 열: 넓은 화면에서 남는 폭 흡수 (CmsDataTable 정확 폭 모드)
        minWidth: COL.company,
        align: 'center',
        ellipsis: true,
        render: (v: string) => v || '-',
      },
      {
        title: '담당자명',
        dataIndex: 'contactName',
        key: 'contactName',
        width: COL.contact,
        align: 'center',
        ellipsis: true,
        render: (v: string) => displayServerPiiAsIs(v),
      },
      {
        title: '부서/직함명',
        dataIndex: 'departmentTitle',
        key: 'departmentTitle',
        width: COL.department,
        align: 'center',
        ellipsis: true,
        render: (v: string) => v || '-',
      },
      {
        title: '담당자 연락처',
        dataIndex: 'phone',
        key: 'phone',
        width: COL.phone,
        align: 'center',
        render: (v: string) => displayServerPiiAsIs(v),
      },
      {
        title: '신청일시',
        dataIndex: 'appliedAt',
        key: 'appliedAt',
        width: COL.applied,
        align: 'center',
        render: (v: string) => formatDateTime(v),
      },
      {
        title: '확인일시',
        dataIndex: 'confirmedAt',
        key: 'confirmedAt',
        width: COL.confirmed,
        align: 'center',
        render: (v: string | null) => formatDateTime(v),
      },
    ],
    [rowNoMap]
  )

  return (
    <div className="corp-consultations-page">
      <FilterTableLayout
        hasActiveFilters={hasActiveFilters}
        filter={
          <div className="admin-filter-area admin-filter-area--split corp-consultations-page__filter">
            <div className="admin-filter-area__head">
              <div className="admin-filter-area__field admin-filter-area__field--control">
                <p className="admin-filter-area__label">처리 상태</p>
                <CmsSelect
                  inputSize="medium"
                  width={FILTER_CONTROL_MAX_WIDTH_PX}
                  withAllOption
                  value={pendingFilters.status}
                  placeholder="전체"
                  options={[
                    { value: 'pending', label: '확인 대기' },
                    { value: 'confirmed', label: '확인 완료' },
                  ]}
                  onChange={v =>
                    setPendingFilters(prev => ({
                      ...prev,
                      status: (v as StatusPending) || '',
                    }))
                  }
                />
              </div>
              <div className="admin-filter-area__field admin-filter-area__field--control">
                <p className="admin-filter-area__label">기업명</p>
                <AdminFilterTextInput
                  inputSize="medium"
                  width={FILTER_CONTROL_MAX_WIDTH_PX}
                  value={pendingFilters.companyName}
                  placeholder="기업명을 입력해 주세요"
                  onChange={value => patchPendingFilters(prev => ({ ...prev, companyName: value }))}
                  onPressEnter={handleSearch}
                />
              </div>
              <div className="admin-filter-area__field admin-filter-area__field--control">
                <p className="admin-filter-area__label">담당자명</p>
                <AdminFilterTextInput
                  inputSize="medium"
                  width={FILTER_CONTROL_MAX_WIDTH_PX}
                  value={pendingFilters.contactName}
                  placeholder="담당자명을 입력해 주세요"
                  onChange={value => patchPendingFilters(prev => ({ ...prev, contactName: value }))}
                  onPressEnter={handleSearch}
                />
              </div>
              <div className="admin-filter-area__field admin-filter-area__field--control">
                <p className="admin-filter-area__label">부서/직함명</p>
                <AdminFilterTextInput
                  inputSize="medium"
                  width={FILTER_CONTROL_MAX_WIDTH_PX}
                  value={pendingFilters.departmentTitle}
                  placeholder="부서/직함명을 입력해 주세요"
                  onChange={value =>
                    patchPendingFilters(prev => ({ ...prev, departmentTitle: value }))
                  }
                  onPressEnter={handleSearch}
                />
              </div>
            </div>
            <div className="admin-filter-area__bottom">
              <div className="admin-filter-area__bottom-fields">
                <div className="admin-filter-area__field admin-filter-area__field--date-range">
                  <p className="admin-filter-area__label">신청일</p>
                  <CmsDateRangePicker
                    inputSize="medium"
                    width={FILTER_CONTROL_WIDE_FIELD_WIDTH_PX}
                    value={rangeAsPicker(pendingFilters.appliedRange)}
                    placeholder={['시작일', '종료일']}
                    allowClear
                    onChange={dates => {
                      if (!dates || (!dates[0] && !dates[1])) {
                        setPendingFilters(prev => ({ ...prev, appliedRange: null }))
                        return
                      }
                      setPendingFilters(prev => ({
                        ...prev,
                        appliedRange: [dates[0] ?? null, dates[1] ?? null],
                      }))
                    }}
                  />
                </div>
                <div className="admin-filter-area__field admin-filter-area__field--date-range">
                  <p className="admin-filter-area__label">확인일</p>
                  <CmsDateRangePicker
                    inputSize="medium"
                    width={FILTER_CONTROL_WIDE_FIELD_WIDTH_PX}
                    value={rangeAsPicker(pendingFilters.confirmedRange)}
                    placeholder={['시작일', '종료일']}
                    allowClear
                    onChange={dates => {
                      if (!dates || (!dates[0] && !dates[1])) {
                        setPendingFilters(prev => ({ ...prev, confirmedRange: null }))
                        return
                      }
                      setPendingFilters(prev => ({
                        ...prev,
                        confirmedRange: [dates[0] ?? null, dates[1] ?? null],
                      }))
                    }}
                  />
                </div>
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
          </div>
        }
        title="기업 후원 상담 신청 목록"
        description={`총 ${totalCount.toLocaleString('ko-KR')}건`}
        actions={
          <>
            <CmsButton
              variant="delete"
              size="h40"
              type="button"
              loading={removeMutation.isPending && !detailOpen}
              onClick={handleBulkDeleteClick}
            >
              선택 삭제
            </CmsButton>
            <CmsButton
              variant="secondary"
              size="h40"
              type="button"
              loading={confirmMutation.isPending && !detailOpen}
              onClick={handleBulkConfirmClick}
            >
              선택 확인
            </CmsButton>
          </>
        }
      >
        <div className="corp-consultations-page__table-scroll">
          <CmsDataTable<CorporateConsultation>
            className="cms-data-table corp-consultations-page__table"
            rowKey="id"
            loading={listQuery.isLoading}
            dataSource={rows}
            columns={columns}
            pagination={false}
            rowSelection={{
              selectedRowKeys,
              onChange: keys => setSelectedRowKeys(keys),
              columnWidth: COL.checkbox,
            }}
            onRow={record => ({
              onClick: e => {
                if (isTableSelectionClick(e)) return
                openDetail(record.id)
              },
              style: { cursor: 'pointer' },
            })}
            scroll={{ x: TABLE_MIN_WIDTH }}
          />
          <AdminInfiniteTableFooter
            sentinelRef={sentinelRef}
            isFetchingNextPage={listQuery.isFetchingNextPage}
          />
        </div>
      </FilterTableLayout>

      <CorporateConsultationDetailModal
        open={detailOpen}
        loading={detailLoading}
        data={detailRow}
        confirmLoading={confirmMutation.isPending && detailOpen}
        deleteLoading={removeMutation.isPending && detailOpen}
        onCancel={closeDetail}
        onConfirm={() => {
          void handleDetailConfirm()
        }}
        onDelete={() => {
          void handleDetailDelete()
        }}
      />

      <ConfirmModal
        open={bulkDeleteOpen}
        title="상담 신청 삭제"
        content={`선택한 상담 신청 ${selectedRowKeys.length}건을 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        danger
        confirmLoading={removeMutation.isPending}
        onCancel={() => setBulkDeleteOpen(false)}
        onConfirm={() => {
          void handleBulkDeleteConfirm()
        }}
      />

      <ConfirmModal
        open={bulkConfirmOpen}
        title="상담 신청 확인"
        content={`선택한 상담 신청 ${selectedRowKeys.length}건을 확인 완료 처리하시겠습니까?`}
        confirmText="확인"
        cancelText="취소"
        confirmLoading={confirmMutation.isPending}
        onCancel={() => setBulkConfirmOpen(false)}
        onConfirm={() => {
          void handleBulkConfirm()
        }}
      />
    </div>
  )
}
