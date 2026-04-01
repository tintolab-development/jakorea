/**
 * 정산 관리 > 계좌 지급 확인
 * 필터·테이블: 지급조서 확인 페이지와 동일 패턴(participating-institutions-section)
 */

import { lazy, Suspense, useCallback, useMemo, useState, type Key } from 'react'
import { Spin, Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CalendarOutlined, DownloadOutlined, UnorderedListOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import {
  ACCOUNT_PAYMENT_STATUS_LABELS,
  MOCK_ACCOUNT_PAYMENT_ANNUAL_BUDGET,
  mockAccountPaymentRows,
  type AccountPaymentRow,
  type AccountPaymentTransferStatus,
} from '@/data/mock/account-payments-list'
import { AppButton } from '@/shared/ui/app-button'
import { UnifiedFilterCard, type FilterFieldConfig } from '@/shared/ui/unified-filter-card'
import '@/features/program/ui/detail-modal/program-status/program-status-participating-shared.css'
import '@/features/program/ui/detail-modal/program-status/program-progress-tab.css'
import './account-payments-page.css'
import { AccountPaymentsCalendarView } from './account-payments-calendar-view'
import {
  AccountPaymentConfirmationModal,
  buildAccountPaymentConfirmationPayloadForSelection,
} from './account-payment-confirmation-modal'
import { AccountPaymentStatusDetailFullPageModal } from './account-payment-status-detail-fullpage-modal'

/** Fortune Sheet·ExcelJS 분리 — lazy 라우트 청크 과대로 인한 dev 동적 import 실패 완화 */
const BulkTransferPreviewModal = lazy(async () => {
  const m = await import('./bulk-transfer-preview-modal')
  return { default: m.BulkTransferPreviewModal }
})

type PageViewMode = 'list' | 'calendar'

type AppliedAccountStatus = 'all' | AccountPaymentTransferStatus

interface AppliedFilters {
  instructorName: string
  programName: string
  accountStatus: AppliedAccountStatus
  transferDateRange: [Dayjs, Dayjs] | null
}

/** 기획: 전년도 12월 ~ 금년도 12월(말일) — 페이지 진입·초기 조회 기본 구간 */
function getDefaultTransferDateRange(reference: Dayjs = dayjs()): [Dayjs, Dayjs] {
  const y = reference.year()
  const start = dayjs(`${y - 1}-12-01`).startOf('day')
  const end = dayjs(`${y}-12-31`).endOf('day')
  return [start, end]
}

const KO_WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']

function formatKoShortWithWeekday(d: Dayjs): string {
  return `${d.format('YY. MM. DD')}(${KO_WEEKDAY[d.day()]})`
}

function formatTransferCell(iso: string): string {
  const d = dayjs(iso)
  return `${d.format('YYYY. MM. DD')}(${KO_WEEKDAY[d.day()]})`
}

function matchesDateRange(iso: string, range: [Dayjs, Dayjs] | null): boolean {
  if (!range?.[0] || !range?.[1]) return true
  const d = dayjs(iso)
  return !d.isBefore(range[0], 'day') && !d.isAfter(range[1], 'day')
}

function filterRows(rows: AccountPaymentRow[], applied: AppliedFilters): AccountPaymentRow[] {
  const qi = applied.instructorName.trim()
  const qp = applied.programName.trim()
  return rows.filter(row => {
    if (qi && !row.instructorName.includes(qi)) return false
    if (qp && !row.programName.includes(qp)) return false
    if (applied.accountStatus !== 'all' && row.accountPaymentStatus !== applied.accountStatus)
      return false
    if (!matchesDateRange(row.transferScheduledDate, applied.transferDateRange)) return false
    return true
  })
}

function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}

const statusSelectOptions: { value: AppliedAccountStatus; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'pending', label: ACCOUNT_PAYMENT_STATUS_LABELS.pending },
  { value: 'completed', label: ACCOUNT_PAYMENT_STATUS_LABELS.completed },
]

export default function AccountPaymentsPage() {
  const year = dayjs().year()

  const [viewMode, setViewMode] = useState<PageViewMode>('list')
  const [draftInstructor, setDraftInstructor] = useState('')
  const [draftProgram, setDraftProgram] = useState('')
  const [draftAccountStatus, setDraftAccountStatus] = useState<AppliedAccountStatus>('all')
  const [draftDateRange, setDraftDateRange] = useState<[Dayjs, Dayjs] | null>(() =>
    getDefaultTransferDateRange()
  )
  const [applied, setApplied] = useState<AppliedFilters>(() => ({
    instructorName: '',
    programName: '',
    accountStatus: 'all',
    transferDateRange: getDefaultTransferDateRange(),
  }))
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [accountPayConfirmSelection, setAccountPayConfirmSelection] = useState<
    AccountPaymentRow[] | null
  >(null)
  const [bulkTransferPreviewOpen, setBulkTransferPreviewOpen] = useState(false)
  const [accountPaymentDetailRow, setAccountPaymentDetailRow] = useState<AccountPaymentRow | null>(
    null
  )
  const accountFilterFields = useMemo((): FilterFieldConfig[] => {
    const colWidth = '25%'
    return [
      {
        key: 'instructorName',
        type: 'search',
        label: '강사명',
        placeholder: '강사명을 입력하세요',
        width: colWidth,
      },
      {
        key: 'programName',
        type: 'search',
        label: '프로그램명',
        placeholder: '프로그램명을 입력하세요',
        width: colWidth,
      },
      {
        key: 'accountStatus',
        type: 'select',
        label: '계좌 지급 현황',
        placeholder: '전체',
        options: statusSelectOptions,
        width: colWidth,
      },
      {
        key: 'transferDateRange',
        type: 'dateRange',
        label: '이체 예정일',
        width: colWidth,
      },
    ]
  }, [])
  const unifiedFilterValues = useMemo(
    () => ({
      instructorName: draftInstructor,
      programName: draftProgram,
      accountStatus: draftAccountStatus === 'all' ? undefined : draftAccountStatus,
      transferDateRange: draftDateRange,
    }),
    [draftAccountStatus, draftDateRange, draftInstructor, draftProgram]
  )
  const handleUnifiedFilterChange = useCallback((key: string, value: unknown) => {
    if (key === 'instructorName') {
      setDraftInstructor(String(value ?? ''))
      return
    }
    if (key === 'programName') {
      setDraftProgram(String(value ?? ''))
      return
    }
    if (key === 'accountStatus') {
      setDraftAccountStatus((value == null || value === '' ? 'all' : value) as AppliedAccountStatus)
      return
    }
    if (key === 'transferDateRange') {
      const range = Array.isArray(value) ? value : null
      setDraftDateRange(
        (range?.[0] && range?.[1] ? [range[0], range[1]] : null) as [Dayjs, Dayjs] | null
      )
    }
  }, [])

  const appliedResetKey = useMemo(
    () =>
      [
        applied.instructorName,
        applied.programName,
        applied.accountStatus,
        applied.transferDateRange?.[0]?.valueOf() ?? '',
        applied.transferDateRange?.[1]?.valueOf() ?? '',
      ].join('|'),
    [applied]
  )

  const filteredRows = useMemo(() => filterRows(mockAccountPaymentRows, applied), [applied])

  const accountPaymentConfirmModalData = useMemo(() => {
    if (!accountPayConfirmSelection?.length) return null
    return buildAccountPaymentConfirmationPayloadForSelection(accountPayConfirmSelection)
  }, [accountPayConfirmSelection])

  const completedTotalThisYear = useMemo(() => {
    return mockAccountPaymentRows
      .filter(
        r =>
          r.accountPaymentStatus === 'completed' && dayjs(r.transferScheduledDate).year() === year
      )
      .reduce((s, r) => s + r.amount, 0)
  }, [year])

  const card3Meta = useMemo(() => {
    const range = applied.transferDateRange
    if (!range?.[0] || !range?.[1]) {
      return { labelLine: '이체 예정일을 선택 후 조회', amount: null as number | null }
    }
    const end = range[1]
    const pendingSum = filteredRows
      .filter(r => {
        if (r.accountPaymentStatus !== 'pending') return false
        const d = dayjs(r.transferScheduledDate)
        return !d.isBefore(range[0], 'day') && !d.isAfter(range[1], 'day')
      })
      .reduce((s, r) => s + r.amount, 0)
    return {
      labelLine: `${formatKoShortWithWeekday(end)} 정산 예정 총액`,
      amount: pendingSum,
    }
  }, [applied.transferDateRange, filteredRows])

  const handleSearch = useCallback(() => {
    setApplied({
      instructorName: draftInstructor.trim(),
      programName: draftProgram.trim(),
      accountStatus: draftAccountStatus,
      transferDateRange: draftDateRange,
    })
    setSelectedRowKeys([])
  }, [draftAccountStatus, draftDateRange, draftInstructor, draftProgram])

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: (keys: Key[]) => setSelectedRowKeys(keys),
    }),
    [selectedRowKeys]
  )

  const columns: ColumnsType<AccountPaymentRow> = useMemo(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: 64,
        align: 'center',
      },
      {
        title: '강사명',
        dataIndex: 'instructorName',
        key: 'instructorName',
        ellipsis: { showTitle: true },
        width: 120,
        align: 'center',
      },
      {
        title: '프로그램명',
        dataIndex: 'programName',
        key: 'programName',
        ellipsis: { showTitle: true },
        width: 320,
        minWidth: 200,
        align: 'center',
      },
      {
        title: '참여 기관명',
        dataIndex: 'institutionName',
        key: 'institutionName',
        width: 140,
        align: 'center',
      },
      {
        title: '강의 진행 회차',
        dataIndex: 'sessionLabel',
        key: 'sessionLabel',
        width: 120,
        align: 'center',
      },
      {
        title: '계좌 지급 현황',
        dataIndex: 'accountPaymentStatus',
        key: 'accountPaymentStatus',
        width: 160,
        align: 'center',
        render: (s: AccountPaymentTransferStatus) => (
          <span
            className={
              s === 'pending'
                ? 'account-payments-page__status-text--pending'
                : 'account-payments-page__status-text--completed'
            }
          >
            {ACCOUNT_PAYMENT_STATUS_LABELS[s]}
          </span>
        ),
      },
      {
        title: '정산 예정금',
        dataIndex: 'amount',
        key: 'amount',
        width: 140,
        align: 'center',
        render: (amount: number) => formatWon(amount),
      },
      {
        title: '이체 예정일',
        dataIndex: 'transferScheduledDate',
        key: 'transferScheduledDate',
        width: 168,
        align: 'center',
        render: (iso: string) => formatTransferCell(iso),
      },
    ],
    []
  )

  /** 화면에는 `총 n건만` 표기. 기획상 집계 구간은 전년 12월 ~ 당해 12월이며 연도가 바뀌면 갱신(API·데이터 연동 시 반영). */
  const total = filteredRows.length

  const openBulkTransferPreview = useCallback(() => {
    const completed = filteredRows.filter(r => r.accountPaymentStatus === 'completed')
    if (completed.length === 0) {
      message.warning(
        '현재 조회 결과에 계좌 지급 완료 항목이 없습니다. 미리보기에는 열 헤더만 표시됩니다.'
      )
    }
    setBulkTransferPreviewOpen(true)
  }, [filteredRows])

  const closeBulkTransferPreview = useCallback(() => {
    setBulkTransferPreviewOpen(false)
  }, [])

  const closeAccountPaymentDetail = useCallback(() => {
    setAccountPaymentDetailRow(null)
  }, [])

  const closeAccountPaymentConfirmModal = useCallback(() => {
    setAccountPayConfirmSelection(null)
  }, [])

  const openAccountPaymentConfirmFromSelection = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      message.warning('지급 처리할 항목을 선택해주세요.')
      return
    }
    const keySet = new Set(selectedRowKeys.map(String))
    const picked = filteredRows.filter(r => keySet.has(String(r.id)))
    if (picked.length === 0) {
      message.warning('선택한 항목을 찾을 수 없습니다.')
      return
    }
    setAccountPayConfirmSelection(picked)
  }, [filteredRows, selectedRowKeys])

  const handleAccountPaymentConfirmComplete = useCallback(() => {
    message.info('추후 연결됩니다.')
    closeAccountPaymentConfirmModal()
  }, [closeAccountPaymentConfirmModal])

  return (
    <div className="payment-orders-page account-payments-page">
      <div className="account-payments-page__summary-row" aria-label="정산 요약">
        <div className="account-payments-page__summary-card">
          <span className="account-payments-page__card-label">{year}년 예산 총액</span>
          <div className="account-payments-page__card-amount-row">
            <span className="account-payments-page__card-amount-num">
              {MOCK_ACCOUNT_PAYMENT_ANNUAL_BUDGET.toLocaleString('ko-KR')}
            </span>
            <span className="account-payments-page__card-amount-won">원</span>
          </div>
        </div>
        <div className="account-payments-page__summary-card">
          <span className="account-payments-page__card-label">{year}년도 정산 완료 총액</span>
          <div className="account-payments-page__card-amount-row">
            <span className="account-payments-page__card-amount-num">
              {completedTotalThisYear.toLocaleString('ko-KR')}
            </span>
            <span className="account-payments-page__card-amount-won">원</span>
          </div>
        </div>
        <div
          className="account-payments-page__summary-card account-payments-page__summary-card--mint"
          aria-live="polite"
        >
          <span className="account-payments-page__card-label">{card3Meta.labelLine}</span>
          <div className="account-payments-page__card-amount-row">
            <span className="account-payments-page__card-amount-num">
              {card3Meta.amount === null ? '—' : card3Meta.amount.toLocaleString('ko-KR')}
            </span>
            {card3Meta.amount !== null && (
              <span className="account-payments-page__card-amount-won">원</span>
            )}
          </div>
        </div>
      </div>

      <div className="payment-orders-page__content-wrapper">
        <div className="participating-institutions-section">
          <UnifiedFilterCard
            bordered={false}
            cardStyle={{ marginBottom: 0 }}
            fields={accountFilterFields}
            filters={unifiedFilterValues}
            onFilterChange={handleUnifiedFilterChange}
            onSearch={handleSearch}
          />

          <div className="participating-institutions-section__divider" />

          <div className="participating-institutions-section__below-divider">
            <div className="participating-institutions-section__table-header">
              <div
                className={
                  viewMode === 'calendar'
                    ? 'participating-institutions-section__table-heading payment-orders-page__calendar-heading'
                    : 'participating-institutions-section__table-heading'
                }
              >
                <span className="payment-orders-page__calendar-title">계좌 지급 대상 목록</span>
                <span className="payment-orders-page__calendar-description">총 {total}건</span>
              </div>
              <div className="participating-institutions-section__table-actions">
                {viewMode === 'list' ? (
                  <AppButton
                    variant="cancel"
                    size="filter-wide"
                    icon={<CalendarOutlined />}
                    onClick={() => setViewMode('calendar')}
                  >
                    캘린더 뷰로 보기
                  </AppButton>
                ) : (
                  <AppButton
                    variant="cancel"
                    size="filter-wide"
                    icon={<UnorderedListOutlined />}
                    onClick={() => setViewMode('list')}
                  >
                    리스트 뷰로 보기
                  </AppButton>
                )}
                <AppButton
                  variant="primary"
                  size="filter-wide"
                  icon={<DownloadOutlined />}
                  onClick={openBulkTransferPreview}
                >
                  대량이체 양식 발급
                </AppButton>
                <AppButton
                  variant="primary"
                  size="filter-wide"
                  icon={<DownloadOutlined />}
                  onClick={() => message.info('추후 연결됩니다.')}
                >
                  세금 신고 양식 발급
                </AppButton>
                <AppButton
                  variant="primary"
                  size="filter-wide"
                  disabled={selectedRowKeys.length === 0}
                  onClick={openAccountPaymentConfirmFromSelection}
                >
                  일괄 지급 처리
                </AppButton>
              </div>
            </div>

            <div className="participating-institutions-section__table-wrap payment-orders-page__table-scroll-root">
              {viewMode === 'calendar' ? (
                <AccountPaymentsCalendarView key={appliedResetKey} rows={filteredRows} />
              ) : (
                <Table<AccountPaymentRow>
                  className="cms-data-table"
                  rowKey="id"
                  columns={columns}
                  dataSource={filteredRows}
                  pagination={false}
                  rowSelection={rowSelection}
                  rowClassName={() => 'account-payments-page__table-row--clickable'}
                  onRow={record => ({
                    onClick: e => {
                      const t = e.target as HTMLElement
                      if (t.closest('.ant-table-selection-column')) return
                      setAccountPaymentDetailRow(record)
                    },
                  })}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <AccountPaymentConfirmationModal
        open={accountPayConfirmSelection !== null}
        onCancel={closeAccountPaymentConfirmModal}
        onConfirm={handleAccountPaymentConfirmComplete}
        data={accountPaymentConfirmModalData}
      />

      {bulkTransferPreviewOpen ? (
        <Suspense
          fallback={
            <div
              className="account-payments-page__bulk-preview-loading"
              role="status"
              aria-live="polite"
              aria-label="대량이체 양식 불러오는 중"
            >
              <Spin size="large" />
            </div>
          }
        >
          <BulkTransferPreviewModal open onCancel={closeBulkTransferPreview} rows={filteredRows} />
        </Suspense>
      ) : null}

      <AccountPaymentStatusDetailFullPageModal
        open={accountPaymentDetailRow !== null}
        onClose={closeAccountPaymentDetail}
        row={accountPaymentDetailRow}
      />
    </div>
  )
}
