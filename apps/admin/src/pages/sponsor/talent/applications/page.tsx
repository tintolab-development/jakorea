/**
 * 재능기부 신청 관리 목록
 */

import { useCallback, useMemo, useState, type Key } from 'react'
import type { Dayjs } from 'dayjs'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type {
  ApplicationStatus,
  JaProgramHistoryFilter,
  TalentDonationApplication,
  TalentDonationApplicationListFilter,
} from '@/entities/talent-donation-application/model/types'
import {
  useConfirmTalentDonationApplications,
  useRemoveTalentDonationApplications,
  useTalentDonationApplicationsList,
} from '@/features/talent-donation-application/api/hooks'
import { talentDonationApplicationQueryKeys } from '@/features/talent-donation-application/api/query-keys'
import { getTalentDonationApplicationService } from '@/features/talent-donation-application/api/service'
import {
  DEFAULT_CONFIRM_ACTOR,
  TALENT_DONATION_APPLICATIONS_CHANGED_EVENT,
} from '@/features/talent-donation-application/api/store'
import { talentDonationApplicationMutationFailureAlert } from '@/features/talent-donation-application/lib/mutation-failure-alert'
import { maskEmail, maskPhoneNumber } from '@/features/talent-donation-application/lib/mask'
import { TalentDonationApplicationDetailModal } from '@/features/talent-donation-application/ui/detail-modal'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
  FILTER_SEARCH_BUTTON_WIDTH_PX,
} from '@/shared/constants/filter-field-width'
import { CMS_TABLE_NO_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { formatDateTimeDot, formatNumberDisplay } from '@/shared/lib/format-display'
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

type StatusPending = '' | ApplicationStatus
type HistoryPending = '' | JaProgramHistoryFilter

type ApplicationPendingFilters = {
  status: StatusPending
  applicantName: string
  phone: string
  email: string
  jaProgramHistory: HistoryPending
  appliedRange: PendingDateRange
  confirmedRange: PendingDateRange
}

const INITIAL_PENDING: ApplicationPendingFilters = {
  status: '',
  applicantName: '',
  phone: '',
  email: '',
  jaProgramHistory: '',
  appliedRange: null,
  confirmedRange: null,
}

const appliedSyncRef: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }
const confirmedSyncRef: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }

const COL = {
  checkbox: TABLE_COLUMN_WIDTHS.checkbox,
  no: TABLE_COLUMN_WIDTHS.index,
  status: 120,
  name: TABLE_COLUMN_WIDTHS.name,
  phone: TABLE_COLUMN_WIDTHS.phone,
  email: TABLE_COLUMN_WIDTHS.email,
  history: 180,
  applied: 160,
  confirmed: 160,
} as const

function parseStatus(raw: string | null): StatusPending {
  if (raw === 'pending' || raw === 'confirmed') return raw
  return ''
}

function parseHistory(raw: string | null): HistoryPending {
  if (raw === 'yes' || raw === 'no') return raw
  return ''
}

function parseApplied(searchParams: URLSearchParams): TalentDonationApplicationListFilter {
  const filter: TalentDonationApplicationListFilter = {}
  const status = parseStatus(searchParams.get('td_status'))
  if (status === 'pending' || status === 'confirmed') {
    filter.status = status
  }
  const applicantName = (searchParams.get('td_name') ?? '').trim()
  if (applicantName) filter.applicantName = applicantName
  const phone = (searchParams.get('td_phone') ?? '').trim()
  if (phone) filter.phone = phone
  const email = (searchParams.get('td_email') ?? '').trim()
  if (email) filter.email = email
  const history = parseHistory(searchParams.get('td_history'))
  if (history === 'yes' || history === 'no') {
    filter.jaProgramHistory = history
  }
  const appliedFrom = ymdFromParam(searchParams.get('td_applied_from'))
  const appliedTo = ymdFromParam(searchParams.get('td_applied_to'))
  if (appliedFrom) filter.appliedFrom = appliedFrom
  if (appliedTo) filter.appliedTo = appliedTo
  const confirmedFrom = ymdFromParam(searchParams.get('td_confirmed_from'))
  const confirmedTo = ymdFromParam(searchParams.get('td_confirmed_to'))
  if (confirmedFrom) filter.confirmedFrom = confirmedFrom
  if (confirmedTo) filter.confirmedTo = confirmedTo
  return filter
}

const searchSyncRules: readonly TableSearchParamRule<ApplicationPendingFilters>[] = [
  {
    kind: 'param',
    filterKey: 'status',
    paramKey: 'td_status',
    condition: f => f.status === 'pending' || f.status === 'confirmed',
  },
  {
    kind: 'param',
    filterKey: 'applicantName',
    paramKey: 'td_name',
    condition: f => f.applicantName.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'phone',
    paramKey: 'td_phone',
    condition: f => f.phone.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'email',
    paramKey: 'td_email',
    condition: f => f.email.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'jaProgramHistory',
    paramKey: 'td_history',
    condition: f => f.jaProgramHistory === 'yes' || f.jaProgramHistory === 'no',
  },
  {
    kind: 'apply',
    apply: (nextParams, f) => {
      applyDateRangeToSearchParams(nextParams, f.appliedRange, 'td_applied_from', 'td_applied_to')
      applyDateRangeToSearchParams(
        nextParams,
        f.confirmedRange,
        'td_confirmed_from',
        'td_confirmed_to'
      )
    },
  },
]

function rangeAsPicker(period: PendingDateRange): [Dayjs | null, Dayjs | null] {
  if (!period) return [null, null]
  return [period[0] ?? null, period[1] ?? null]
}

function statusLabel(status: ApplicationStatus): string {
  return status === 'confirmed' ? '확인 완료' : '확인 대기'
}

export function TalentDonationApplicationsPage() {
  const { showAlert } = useCmsAlert()

  const {
    pendingFilters,
    setPendingFilters,
    applied: appliedFilter,
    applySearch,
  } = useListFilterUrl<ApplicationPendingFilters, TalentDonationApplicationListFilter>({
    initialPending: INITIAL_PENDING,
    paramConfig: searchSyncRules,
    parseApplied,
    syncPendingFromUrl: ({ searchParams, setPendingFilters: setPending }) => {
      const status = parseStatus(searchParams.get('td_status'))
      const applicantName = searchParams.get('td_name') ?? ''
      const phone = searchParams.get('td_phone') ?? ''
      const email = searchParams.get('td_email') ?? ''
      const jaProgramHistory = parseHistory(searchParams.get('td_history'))
      const appliedFrom = searchParams.get('td_applied_from')
      const appliedTo = searchParams.get('td_applied_to')
      const confirmedFrom = searchParams.get('td_confirmed_from')
      const confirmedTo = searchParams.get('td_confirmed_to')

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

        const next: ApplicationPendingFilters = {
          status,
          applicantName,
          phone,
          email,
          jaProgramHistory,
          appliedRange,
          confirmedRange,
        }
        if (
          prev.status === next.status &&
          prev.applicantName === next.applicantName &&
          prev.phone === next.phone &&
          prev.email === next.email &&
          prev.jaProgramHistory === next.jaProgramHistory &&
          pendingDateRangeTupleEqual(prev.appliedRange, next.appliedRange) &&
          pendingDateRangeTupleEqual(prev.confirmedRange, next.confirmedRange)
        ) {
          return prev
        }
        return next
      })
    },
  })

  const listQuery = useTalentDonationApplicationsList(appliedFilter)
  const removeMutation = useRemoveTalentDonationApplications(appliedFilter)
  const confirmMutation = useConfirmTalentDonationApplications(appliedFilter)

  useInvalidateOnWindowEvent(
    TALENT_DONATION_APPLICATIONS_CHANGED_EVENT,
    talentDonationApplicationQueryKeys.all
  )

  const rows = useMemo(() => listQuery.data?.items ?? [], [listQuery.data?.items])
  const totalCount = listQuery.data?.totalCount ?? rows.length

  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRow, setDetailRow] = useState<TalentDonationApplication | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false)

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

  const openDetail = useCallback((row: TalentDonationApplication) => {
    setDetailRow(row)
    setDetailOpen(true)
    void getTalentDonationApplicationService(row.id, DEFAULT_CONFIRM_ACTOR)
      .then(item => {
        if (item) setDetailRow(item)
      })
      .catch(() => {
        /* 목록 행 데이터로 표시 유지 */
      })
  }, [])

  const closeDetail = useCallback(() => {
    setDetailOpen(false)
    setDetailRow(null)
  }, [])

  const refreshDetailFromList = useCallback(
    async (id: string) => {
      const next = await listQuery.refetch()
      const found = (next.data?.items ?? []).find(r => r.id === id) ?? null
      if (found) {
        setDetailRow(found)
        return
      }
      const detail = await getTalentDonationApplicationService(id, DEFAULT_CONFIRM_ACTOR)
      setDetailRow(detail)
      if (!detail) setDetailOpen(false)
    },
    [listQuery]
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

  const handleBulkConfirmClick = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      showAlert({
        title: '항목 선택',
        content: '선택된 항목이 없습니다.',
      })
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
    } catch (error) {
      showAlert(
        talentDonationApplicationMutationFailureAlert(
          error,
          '신청 삭제에 실패했습니다. 다시 시도해 주세요.',
        ),
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
    } catch (error) {
      showAlert(
        talentDonationApplicationMutationFailureAlert(
          error,
          '신청 확인에 실패했습니다. 다시 시도해 주세요.',
        ),
      )
      void listQuery.refetch()
    }
  }, [
    confirmMutation,
    detailRow,
    listQuery,
    refreshDetailFromList,
    selectedRowKeys,
    showAlert,
  ])

  const handleDetailConfirm = useCallback(async () => {
    if (!detailRow) return
    try {
      await confirmMutation.mutateAsync({
        ids: [detailRow.id],
        actorName: DEFAULT_CONFIRM_ACTOR,
      })
      await refreshDetailFromList(detailRow.id)
    } catch (error) {
      showAlert(
        talentDonationApplicationMutationFailureAlert(
          error,
          '신청 확인에 실패했습니다. 다시 시도해 주세요.',
        ),
      )
    }
  }, [confirmMutation, detailRow, refreshDetailFromList, showAlert])

  const handleDetailDelete = useCallback(async () => {
    if (!detailRow) return
    try {
      await removeMutation.mutateAsync([detailRow.id])
      setSelectedRowKeys(prev => prev.filter(k => k !== detailRow.id))
      closeDetail()
    } catch (error) {
      showAlert(
        talentDonationApplicationMutationFailureAlert(
          error,
          '신청 삭제에 실패했습니다. 다시 시도해 주세요.',
        ),
      )
    }
  }, [closeDetail, detailRow, removeMutation, showAlert])

  const columns: ColumnsType<TalentDonationApplication> = useMemo(
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
        render: (value: ApplicationStatus) => (
          <span
            className={
              value === 'pending'
                ? 'talent-apps-page__status talent-apps-page__status--pending'
                : 'talent-apps-page__status talent-apps-page__status--confirmed'
            }
          >
            {statusLabel(value)}
          </span>
        ),
      },
      {
        title: '신청자명',
        dataIndex: 'applicantName',
        key: 'applicantName',
        width: COL.name,
        align: 'center',
        ellipsis: true,
        render: (v: string) => v || '-',
      },
      {
        title: '연락처',
        dataIndex: 'phone',
        key: 'phone',
        width: COL.phone,
        align: 'center',
        render: (v: string) => maskPhoneNumber(v),
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: COL.email,
        align: 'center',
        ellipsis: true,
        render: (v: string) => maskEmail(v),
      },
      {
        title: 'JA 프로그램 참여 이력',
        dataIndex: 'jaProgramHistory',
        key: 'jaProgramHistory',
        width: COL.history,
        align: 'center',
        render: (v: boolean) => (v ? '있음' : '없음'),
      },
      {
        title: '신청일시',
        dataIndex: 'appliedAt',
        key: 'appliedAt',
        width: COL.applied,
        align: 'center',
        render: (v: string) => formatDateTimeDot(v),
      },
      {
        title: '확인일시',
        dataIndex: 'confirmedAt',
        key: 'confirmedAt',
        width: COL.confirmed,
        align: 'center',
        render: (v: string | null) => formatDateTimeDot(v),
      },
    ],
    [rowNoMap]
  )

  return (
    <div className="talent-apps-page">
      <div className="admin-list-card talent-apps-page__filter-card">
        <div className="admin-filter-area admin-filter-area--split talent-apps-page__filter">
          <div className="admin-filter-area__head">
            <div className="admin-filter-area__field admin-filter-area__field--control">
              <p className="admin-filter-area__label">처리 상태</p>
              <CmsSelect
                inputSize="large"
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
              <p className="admin-filter-area__label">신청자명</p>
              <CmsInput
                inputSize="large"
                width={FILTER_CONTROL_MAX_WIDTH_PX}
                value={pendingFilters.applicantName}
                placeholder="신청자명을 입력하세요."
                onChange={e =>
                  setPendingFilters(prev => ({ ...prev, applicantName: e.target.value }))
                }
                onPressEnter={handleSearch}
              />
            </div>
            <div className="admin-filter-area__field admin-filter-area__field--control">
              <p className="admin-filter-area__label">연락처</p>
              <CmsInput
                inputSize="large"
                width={FILTER_CONTROL_MAX_WIDTH_PX}
                value={pendingFilters.phone}
                placeholder="연락처를 입력하세요."
                onChange={e => setPendingFilters(prev => ({ ...prev, phone: e.target.value }))}
                onPressEnter={handleSearch}
              />
            </div>
            <div className="admin-filter-area__field admin-filter-area__field--control">
              <p className="admin-filter-area__label">이메일</p>
              <CmsInput
                inputSize="large"
                width={FILTER_CONTROL_MAX_WIDTH_PX}
                value={pendingFilters.email}
                placeholder="이메일을 입력하세요."
                onChange={e => setPendingFilters(prev => ({ ...prev, email: e.target.value }))}
                onPressEnter={handleSearch}
              />
            </div>
            <div className="admin-filter-area__field admin-filter-area__field--control">
              <p className="admin-filter-area__label">JA 프로그램 참여 이력</p>
              <CmsSelect
                inputSize="large"
                width={FILTER_CONTROL_MAX_WIDTH_PX}
                withAllOption
                value={pendingFilters.jaProgramHistory}
                placeholder="전체"
                options={[
                  { value: 'yes', label: '있음' },
                  { value: 'no', label: '없음' },
                ]}
                onChange={v =>
                  setPendingFilters(prev => ({
                    ...prev,
                    jaProgramHistory: (v as HistoryPending) || '',
                  }))
                }
              />
            </div>
          </div>
          <div className="admin-filter-area__bottom">
            <div className="admin-filter-area__bottom-fields">
              <div className="admin-filter-area__field admin-filter-area__field--date-range">
                <p className="admin-filter-area__label">신청일</p>
                <CmsDateRangePicker
                  inputSize="large"
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
                  inputSize="large"
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
            <span className="table-title">재능기부 신청 목록</span>
            <span className="table-description">총 {formatNumberDisplay(totalCount)}건</span>
          </div>
          <div className="table-header-actions--wrapper">
            <CmsButton
              variant="delete"
              size="large"
              type="button"
              loading={removeMutation.isPending && !detailOpen}
              onClick={handleBulkDeleteClick}
            >
              선택 삭제
            </CmsButton>
            <CmsButton
              variant="secondary"
              size="large"
              type="button"
              loading={confirmMutation.isPending && !detailOpen}
              onClick={handleBulkConfirmClick}
            >
              선택 확인
            </CmsButton>
          </div>
        </div>

        <div className="talent-apps-page__table-scroll">
          <Table<TalentDonationApplication>
            className="cms-data-table talent-apps-page__table"
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
                openDetail(record)
              },
              style: { cursor: 'pointer' },
            })}
            scroll={{ x: true }}
          />
        </div>
      </div>

      <TalentDonationApplicationDetailModal
        open={detailOpen}
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
        title="신청 삭제"
        content={`선택한 신청 ${selectedRowKeys.length}건을 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다.`}
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
        title="신청 확인"
        content={`선택한 신청 ${selectedRowKeys.length}건을 확인 완료 처리하시겠습니까?`}
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
