/**
 * 정산 관리 > 계좌 지급 확인
 * 필터·목록: `FilterTableLayout` (`title`·`description`·`actions`) + 테이블·캘린더 본문
 */

import { lazy, Suspense, useCallback, useEffect, useMemo, useState, type Key } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Spin, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CalendarOutlined, DownloadOutlined, UnorderedListOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import {
  ACCOUNT_PAYMENT_STATUS_LABELS,
  mockAccountPaymentRows,
  formatAccountPaymentInstitutionDisplay,
  formatAccountPaymentSessionLabelDisplay,
  isPaymentOrderStatementConfirmedForAccountPayments,
  type AccountPaymentRow,
  type AccountPaymentTransferStatus,
} from '@/data/mock/account-payments-list'
import { getSettlementApiErrorMessage } from '@/features/settlement-management/api/get-settlement-api-error'
import { buildAccountPaymentExportRequest } from '@/features/settlement-management/api/account-payments/build-account-payment-export-request'
import { useAccountPaymentsListQuery } from '@/features/settlement-management/hooks/use-account-payments-list-query'
import {
  useBulkTransferExportMutation,
  useMarkAccountPaymentPaidMutation,
  useTaxReportExportMutation,
} from '@/features/settlement-management/hooks/use-account-payment-mutations'
import { useSettlementBudgetSummaryQuery } from '@/features/settlement-management/hooks/use-settlement-budget-summary-query'
import { shouldUseSettlementRemote } from '@/features/settlement-management/hooks/use-settlement-remote-enabled'
import { isGlobalApiErrorAlertShown } from '@/shared/lib/show-global-api-error-alert'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import {
  ACCOUNT_PAYMENT_LIST_FILTER_STATUSES,
} from '@/shared/constants/payment-order-aggregate-status'
import {
  FilterTableLayout,
  type FilterFieldConfig,
  type FilterTableExcelExportConfig,
} from '@/shared/components/filter-table-layout'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
} from '@/shared/components/table-filter-group-field-width'
import { CmsButton, CMS_ACTION_BUTTON_WIDTH } from '@/shared/ui/cms-button'
import '@/features/program/general/ui/detail-modal/program-status/program-status-participating-shared.css'
import '@/features/program/general/ui/detail-modal/program-status/program-progress-tab.css'
import './payment-orders-page.css'
import './account-payments-page.css'
import { AccountPaymentsCalendarView } from './account-payments-calendar-view'
import { getPaymentOrdersDefaultDateRange } from './payment-orders-date-range'
import {
  AccountPaymentConfirmationModal,
  buildAccountPaymentConfirmationPayloadForSelection,
} from '@/features/settlement/ui/account-payment-confirmation-modal'
import { AccountPaymentCompleteSuccessModal } from '@/features/settlement/ui/account-payment-complete-success-modal'
import { AccountPaymentStatusDetailFullPageModal } from './account-payment-status-detail-fullpage-modal'
import { InstructorPaymentStatementBlockedModal } from '@/features/user/detail/ui/modal/instructor-payment-statement-blocked-modal'

/** Fortune Sheet·ExcelJS 분리 — lazy 라우트 청크 과대로 인한 dev 동적 import 실패 완화 */
const BulkTransferPreviewModal = lazy(async () => {
  const m = await import('./bulk-transfer-preview-modal')
  return { default: m.BulkTransferPreviewModal }
})

const TaxFilingPreviewModal = lazy(async () => {
  const m = await import('./tax-filing-preview-modal')
  return { default: m.TaxFilingPreviewModal }
})

type PageViewMode = 'list' | 'calendar'

type AppliedAccountStatus = 'all' | AccountPaymentTransferStatus

interface AppliedFilters {
  instructorName: string
  programName: string
  accountStatus: AppliedAccountStatus
  transferDateRange: [Dayjs, Dayjs] | null
}

const KO_WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']

/** 계좌 지급 풀페이지 상세 — URL 동기화(뒤로가기로 목록 복귀) */
const AP_DETAIL_ID = 'ap_detail'

/** `FilterTableLayout` 툴바 — `CmsButton` size=large, width=auto에 최소 폭 180px 적용 */
const ACCOUNT_PAYMENTS_TOOLBAR_BTN_STYLE = { minWidth: 180 } as const

/** 세 번째 요약 위젯 — 이체 예정일 구간 표기 `YY. MM. DD ~ YY. MM. DD` */
function formatYyMmDd(d: Dayjs): string {
  return d.format('YY. MM. DD')
}

function formatSettlementPendingDateRangeOnly(range: [Dayjs, Dayjs]): string {
  return `${formatYyMmDd(range[0])} ~ ${formatYyMmDd(range[1])}`
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
    if (!isPaymentOrderStatementConfirmedForAccountPayments(row)) return false
    if (qi && !row.instructorName.includes(qi)) return false
    if (qp && !row.programName.includes(qp)) return false
    if (applied.accountStatus !== 'all' && row.accountPaymentStatus !== applied.accountStatus)
      return false
    // 목록 「이체 예정일」필터 = transferScheduledDate (캘린더 배치도 동일)
    if (!matchesDateRange(row.transferScheduledDate, applied.transferDateRange)) return false
    return true
  })
}

function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}

const statusSelectOptions: { value: AppliedAccountStatus; label: string }[] = [
  { value: 'all', label: '전체' },
  ...ACCOUNT_PAYMENT_LIST_FILTER_STATUSES.map(value => ({
    value,
    label: ACCOUNT_PAYMENT_STATUS_LABELS[value],
  })),
]

function getAccountPaymentStatusClassName(status: AccountPaymentTransferStatus): string {
  switch (status) {
    case 'awaiting_confirmation':
      return 'account-payments-page__status-text--awaiting-confirmation'
    case 'partial_confirmation':
      return 'account-payments-page__status-text--partial-confirmation'
    case 'account_paid':
      return 'account-payments-page__status-text--account-paid'
    case 'payment_correction_requested':
      return 'account-payments-page__status-text--payment-correction-requested'
    default:
      return ''
  }
}

function useCalendarYear(): number {
  const [y, setY] = useState(() => dayjs().year())
  useEffect(() => {
    const sync = () => setY(dayjs().year())
    const id = window.setInterval(sync, 60_000)
    window.addEventListener('focus', sync)
    const onVis = () => {
      if (document.visibilityState === 'visible') sync()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('focus', sync)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])
  return y
}

export default function AccountPaymentsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const calendarYear = useCalendarYear()
  const tabYears = useMemo(
    () => [calendarYear, calendarYear - 1, calendarYear - 2, calendarYear - 3],
    [calendarYear]
  )

  const [selectedYear, setSelectedYear] = useState(() => dayjs().year())
  /** 탭 구간(금년~3년 전) 밖 값은 표시·집계 시 클램프 — 연도 전환 후에도 동기 */
  const selectedYearScoped = useMemo(() => {
    const lo = calendarYear - 3
    const hi = calendarYear
    return Math.min(hi, Math.max(lo, selectedYear))
  }, [calendarYear, selectedYear])

  const [viewMode, setViewMode] = useState<PageViewMode>('list')
  const [draftInstructor, setDraftInstructor] = useState('')
  const [draftProgram, setDraftProgram] = useState('')
  const [draftAccountStatus, setDraftAccountStatus] = useState<AppliedAccountStatus>('all')
  const [draftDateRange, setDraftDateRange] = useState<[Dayjs, Dayjs] | null>(() =>
    getPaymentOrdersDefaultDateRange()
  )
  const [applied, setApplied] = useState<AppliedFilters>(() => ({
    instructorName: '',
    programName: '',
    accountStatus: 'all',
    transferDateRange: getPaymentOrdersDefaultDateRange(),
  }))
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [accountPayConfirmSelection, setAccountPayConfirmSelection] = useState<
    AccountPaymentRow[] | null
  >(null)
  const [bulkTransferPreviewOpen, setBulkTransferPreviewOpen] = useState(false)
  const [taxFilingPreviewOpen, setTaxFilingPreviewOpen] = useState(false)
  /** 대량이체·세금신고 미리보기에 넘길 행(툴바는 선택 완료 건만, 성공 모달 경로는 조회 결과 완료 건) */
  const [issuedFormPreviewRows, setIssuedFormPreviewRows] = useState<AccountPaymentRow[] | null>(
    null
  )
  const [accountFormIssueBlockedOpen, setAccountFormIssueBlockedOpen] = useState(false)
  const [accountFormIssueBlockedVariant, setAccountFormIssueBlockedVariant] = useState<
    'single' | 'multi'
  >('multi')
  const [accountFormIssueBlockedSelectedCount, setAccountFormIssueBlockedSelectedCount] =
    useState(0)
  const [accountPaymentCompleteSuccessOpen, setAccountPaymentCompleteSuccessOpen] = useState(false)
  /** mock 배열을 직접 수정하지 않도록 복사본 유지 — 계좌 지급 완료 시 상태 반영 (mock 전용) */
  const [mockAccountPaymentRowsState, setMockAccountPaymentRowsState] = useState<AccountPaymentRow[]>(
    () =>
      mockAccountPaymentRows
        .filter(isPaymentOrderStatementConfirmedForAccountPayments)
        .map(r => ({ ...r }))
  )

  const accountPaymentsRemote = shouldUseSettlementRemote('accountPayments')
  const markPaidMutation = useMarkAccountPaymentPaidMutation()
  const bulkTransferExportMutation = useBulkTransferExportMutation()
  const taxReportExportMutation = useTaxReportExportMutation()

  const accountFilterFields = useMemo((): FilterFieldConfig[] => {
    return [
      {
        key: 'instructorName',
        type: 'search',
        label: '신청자명',
        placeholder: '신청자명을 입력하세요',
        width: FILTER_CONTROL_MAX_WIDTH_PX,
      },
      {
        key: 'programName',
        type: 'search',
        label: '프로그램명',
        placeholder: '프로그램명을 입력하세요',
        width: FILTER_CONTROL_MAX_WIDTH_PX,
      },
      {
        key: 'accountStatus',
        type: 'select',
        label: '계좌 지급 현황',
        placeholder: '전체',
        options: statusSelectOptions,
        width: FILTER_CONTROL_MAX_WIDTH_PX,
      },
      {
        key: 'transferDateRange',
        type: 'dateRange',
        label: '이체 예정일',
        dateRangeOneMonthFromStart: true,
        width: FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
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

  const listQueryFilters = useMemo(
    () => ({
      instructorName: applied.instructorName,
      programName: applied.programName,
      accountStatus:
        applied.accountStatus === 'awaiting_confirmation' ||
        applied.accountStatus === 'account_paid'
          ? applied.accountStatus
          : ('all' as const),
      fromDate: applied.transferDateRange?.[0]?.format('YYYY-MM-DD'),
      toDate: applied.transferDateRange?.[1]?.format('YYYY-MM-DD'),
      // year는 예산 카드 전용. dateRange가 있을 때 목록 refetch 트리거로 쓰지 않음
    }),
    [applied]
  )

  const budgetSummaryQuery = useSettlementBudgetSummaryQuery(
    {
      year: selectedYearScoped,
      fromDate: listQueryFilters.fromDate,
      toDate: listQueryFilters.toDate,
    },
    accountPaymentsRemote
  )

  const accountPaymentsListQuery = useAccountPaymentsListQuery(
    listQueryFilters,
    accountPaymentsRemote
  )

  const accountPaymentRows = useMemo(() => {
    if (accountPaymentsRemote) {
      return accountPaymentsListQuery.data ?? []
    }
    return mockAccountPaymentRowsState
  }, [
    accountPaymentsRemote,
    accountPaymentsListQuery.data,
    mockAccountPaymentRowsState,
  ])

  const accountPaymentDetailRow = useMemo(() => {
    const id = searchParams.get(AP_DETAIL_ID)?.trim()
    if (!id) return null
    return accountPaymentRows.find(r => r.id === id) ?? null
  }, [searchParams, accountPaymentRows])

  const filteredRows = useMemo(() => {
    // Remote: 서버가 status·이체일·이름 필터를 적용. mock만 클라이언트 filterRows
    if (accountPaymentsRemote) return accountPaymentRows
    return filterRows(accountPaymentRows, applied)
  }, [accountPaymentsRemote, accountPaymentRows, applied])

  const accountPaymentConfirmModalData = useMemo(() => {
    if (!accountPayConfirmSelection?.length) return null
    return buildAccountPaymentConfirmationPayloadForSelection(accountPayConfirmSelection)
  }, [accountPayConfirmSelection])

  const completedTotalForSelectedYear = useMemo(() => {
    if (accountPaymentsRemote) return 0
    return accountPaymentRows
      .filter(r => r.accountPaymentStatus === 'account_paid')
      .reduce((s, r) => s + r.amount, 0)
  }, [accountPaymentRows, accountPaymentsRemote])

  /** 예산·완료·예정금 — remote면 budget-summary API만 (후원사 연간 기부금 합계 소스) */
  const annualBudgetAmount = accountPaymentsRemote
    ? budgetSummaryQuery.data?.annualBudgetAmount
    : undefined

  const completedTotalDisplay = useMemo(() => {
    if (accountPaymentsRemote) {
      return budgetSummaryQuery.data?.completedPaymentAmount ?? null
    }
    return completedTotalForSelectedYear
  }, [
    accountPaymentsRemote,
    budgetSummaryQuery.data?.completedPaymentAmount,
    completedTotalForSelectedYear,
  ])

  /** 기간 내 정산 예정금 = 이체 기간 ∩ CONFIRMED ∩ WAITING_PAYMENT (API expectedSettlementAmount) */
  const card3Meta = useMemo(() => {
    const range = applied.transferDateRange
    if (!range?.[0] || !range?.[1]) {
      return { labelDateRange: null as string | null, amount: null as number | null }
    }
    const labelDateRange = formatSettlementPendingDateRangeOnly([range[0], range[1]])
    if (accountPaymentsRemote) {
      const apiAmount = budgetSummaryQuery.data?.expectedSettlementAmount
      return {
        labelDateRange,
        amount: apiAmount != null ? apiAmount : null,
      }
    }
    const pendingSum = filteredRows
      .filter(r => r.accountPaymentStatus === 'awaiting_confirmation')
      .reduce((s, r) => s + r.amount, 0)
    return { labelDateRange, amount: pendingSum }
  }, [
    accountPaymentsRemote,
    applied.transferDateRange,
    budgetSummaryQuery.data?.expectedSettlementAmount,
    filteredRows,
  ])

  const handleSearch = useCallback(() => {
    setApplied({
      instructorName: draftInstructor.trim(),
      programName: draftProgram.trim(),
      accountStatus: draftAccountStatus,
      transferDateRange: draftDateRange,
    })
    setSelectedRowKeys([])
  }, [draftAccountStatus, draftDateRange, draftInstructor, draftProgram])

  const handleYearTabSelect = useCallback((y: number) => {
    setSelectedYear(y)
    setSelectedRowKeys([])
  }, [])

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
        width: 80,
        align: 'center',
      },
      {
        title: '신청자명',
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
        ellipsis: { showTitle: true },
        width: 140,
        align: 'center',
        render: (v: string) => formatAccountPaymentInstitutionDisplay(v),
      },
      {
        title: '강의 진행 차시',
        dataIndex: 'sessionLabel',
        key: 'sessionLabel',
        width: 120,
        align: 'center',
        render: (v: string) => formatAccountPaymentSessionLabelDisplay(v),
      },
      {
        title: '계좌 지급 현황',
        dataIndex: 'accountPaymentStatus',
        key: 'accountPaymentStatus',
        width: 160,
        align: 'center',
        render: (s: AccountPaymentTransferStatus) => (
          <span className={getAccountPaymentStatusClassName(s)}>
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

  /**
   * 툴바 양식 발급: 선택한 행만 대상. 선택에 계좌 지급 대기가 있으면 불가 모달.
   * 성공 시 `AccountPaymentRow[]` (선택분이 모두 완료인 경우).
   */
  const resolveToolbarFormIssueRows = useCallback((): AccountPaymentRow[] | null => {
    if (selectedRowKeys.length === 0) {
      return null
    }
    const keySet = new Set(selectedRowKeys.map(String))
    const picked = filteredRows.filter(r => keySet.has(String(r.id)))
    if (picked.length === 0) {
      return null
    }
    if (picked.some(r => r.accountPaymentStatus !== 'account_paid')) {
      setAccountFormIssueBlockedVariant(selectedRowKeys.length === 1 ? 'single' : 'multi')
      setAccountFormIssueBlockedSelectedCount(selectedRowKeys.length)
      setAccountFormIssueBlockedOpen(true)
      return null
    }
    return picked
  }, [filteredRows, selectedRowKeys])

  const notifyExportError = useCallback((error: unknown, fallback: string) => {
    if (isGlobalApiErrorAlertShown(error)) return
    cmsAlertModal.show({
      title: '발급 불가',
      content: getSettlementApiErrorMessage(error, fallback),
    })
  }, [])

  const requestExportForKind = useCallback(
    async (kind: 'bulk-transfer' | 'tax-report') => {
      if (!accountPaymentsRemote) return
      const body = buildAccountPaymentExportRequest({
        kind,
        fromDate: listQueryFilters.fromDate,
        toDate: listQueryFilters.toDate,
      })
      try {
        if (kind === 'bulk-transfer') {
          await bulkTransferExportMutation.mutateAsync(body)
        } else {
          await taxReportExportMutation.mutateAsync(body)
        }
      } catch (error) {
        notifyExportError(
          error,
          kind === 'bulk-transfer'
            ? '대량이체 양식 발급 요청에 실패했습니다.'
            : '세금신고 양식 발급 요청에 실패했습니다.'
        )
        throw error
      }
    },
    [
      accountPaymentsRemote,
      bulkTransferExportMutation,
      listQueryFilters.fromDate,
      listQueryFilters.toDate,
      notifyExportError,
      taxReportExportMutation,
    ]
  )

  const openBulkTransferPreview = useCallback(() => {
    const rows = resolveToolbarFormIssueRows()
    if (rows === null) return
    void (async () => {
      try {
        await requestExportForKind('bulk-transfer')
      } catch {
        return
      }
      setIssuedFormPreviewRows(rows)
      setBulkTransferPreviewOpen(true)
    })()
  }, [requestExportForKind, resolveToolbarFormIssueRows])

  const closeBulkTransferPreview = useCallback(() => {
    setBulkTransferPreviewOpen(false)
    setIssuedFormPreviewRows(null)
  }, [])

  const openTaxFilingPreview = useCallback(() => {
    const rows = resolveToolbarFormIssueRows()
    if (rows === null) return
    void (async () => {
      try {
        await requestExportForKind('tax-report')
      } catch {
        return
      }
      setIssuedFormPreviewRows(rows)
      setTaxFilingPreviewOpen(true)
    })()
  }, [requestExportForKind, resolveToolbarFormIssueRows])

  const closeTaxFilingPreview = useCallback(() => {
    setTaxFilingPreviewOpen(false)
    setIssuedFormPreviewRows(null)
  }, [])

  const closeAccountFormIssueBlocked = useCallback(() => {
    setAccountFormIssueBlockedOpen(false)
  }, [])

  const closeAccountPaymentDetail = useCallback(() => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.delete(AP_DETAIL_ID)
        return next
      },
      { replace: true }
    )
  }, [setSearchParams])

  const openAccountPaymentDetail = useCallback(
    (row: AccountPaymentRow) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          next.set(AP_DETAIL_ID, row.id)
          return next
        },
        { replace: false }
      )
    },
    [setSearchParams]
  )

  const notifyAccountPaymentPaidError = useCallback((error: unknown) => {
    if (isGlobalApiErrorAlertShown(error)) return
    cmsAlertModal.show({
      title: '처리 불가',
      content: getSettlementApiErrorMessage(
        error,
        '계좌 지급 완료 처리에 실패했습니다.'
      ),
    })
  }, [])

  const handleAccountPaymentCompletedForRow = useCallback(
    (rowId: string) => {
      const target = accountPaymentRows.find(r => r.id === rowId)
      if (!target) return

      if (accountPaymentsRemote) {
        const paymentId = target.accountPaymentId
        if (paymentId == null) {
          window.alert('지급 완료 API에 필요한 accountPaymentId가 없습니다.')
          return
        }
        void markPaidMutation.mutateAsync([paymentId]).catch(notifyAccountPaymentPaidError)
        return
      }

      setMockAccountPaymentRowsState(prev =>
        prev.map(r =>
          r.id === rowId ? { ...r, accountPaymentStatus: 'account_paid' as const } : r
        )
      )
    },
    [accountPaymentRows, accountPaymentsRemote, markPaidMutation, notifyAccountPaymentPaidError]
  )

  const closeAccountPaymentConfirmModal = useCallback(() => {
    setAccountPayConfirmSelection(null)
  }, [])

  const openAccountPaymentConfirmFromSelection = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      return
    }
    const keySet = new Set(selectedRowKeys.map(String))
    const picked = filteredRows.filter(r => keySet.has(String(r.id)))
    if (picked.length === 0) {
      return
    }
    setAccountPayConfirmSelection(picked)
  }, [filteredRows, selectedRowKeys])

  const accountPaymentsFilterTableActions = useMemo(
    () => (
      <>
        {viewMode === 'list' ? (
          <CmsButton
            variant="secondary"
            size="large"
            width="auto"
            style={ACCOUNT_PAYMENTS_TOOLBAR_BTN_STYLE}
            icon={<CalendarOutlined />}
            type="button"
            onClick={() => setViewMode('calendar')}
          >
            캘린더 뷰로 보기
          </CmsButton>
        ) : (
          <CmsButton
            variant="secondary"
            size="large"
            width="auto"
            style={ACCOUNT_PAYMENTS_TOOLBAR_BTN_STYLE}
            icon={<UnorderedListOutlined />}
            type="button"
            onClick={() => setViewMode('list')}
          >
            리스트 뷰로 보기
          </CmsButton>
        )}
        <CmsButton
          variant="primary"
          size="large"
          width="auto"
          style={ACCOUNT_PAYMENTS_TOOLBAR_BTN_STYLE}
          icon={<DownloadOutlined />}
          type="button"
          disabled={selectedRowKeys.length === 0}
          onClick={openBulkTransferPreview}
        >
          대량이체 양식 발급
        </CmsButton>
        <CmsButton
          variant="primary"
          size="large"
          width="auto"
          style={ACCOUNT_PAYMENTS_TOOLBAR_BTN_STYLE}
          icon={<DownloadOutlined />}
          type="button"
          disabled={selectedRowKeys.length === 0}
          onClick={openTaxFilingPreview}
        >
          세금 신고 양식 발급
        </CmsButton>
      </>
    ),
    [
      viewMode,
      selectedRowKeys.length,
      openBulkTransferPreview,
      openTaxFilingPreview,
    ]
  )

  const accountPaymentsAfterActions = useMemo(
    () => (
      <CmsButton
        variant="primary"
        size="large"
        width={CMS_ACTION_BUTTON_WIDTH}
        type="button"
        disabled={selectedRowKeys.length === 0}
        onClick={openAccountPaymentConfirmFromSelection}
      >
        일괄 지급 처리
      </CmsButton>
    ),
    [selectedRowKeys.length, openAccountPaymentConfirmFromSelection]
  )

  const accountPaymentsExcelExport = useMemo((): FilterTableExcelExportConfig => {
    return { columns, data: filteredRows }
  }, [columns, filteredRows])

  const handleAccountPaymentConfirmComplete = useCallback(() => {
    const selection = accountPayConfirmSelection
    if (!selection?.length) {
      closeAccountPaymentConfirmModal()
      return
    }

    if (accountPaymentsRemote) {
      const paymentIds = selection
        .map(r => r.accountPaymentId)
        .filter((id): id is number => id != null)
      if (paymentIds.length === 0) {
        window.alert('지급 완료 API에 필요한 accountPaymentId가 없습니다.')
        return
      }
      void markPaidMutation
        .mutateAsync(paymentIds)
        .then(() => {
          const ids = new Set(selection.map(r => r.id))
          setSelectedRowKeys(prev => prev.filter(k => !ids.has(String(k))))
          closeAccountPaymentConfirmModal()
          setAccountPaymentCompleteSuccessOpen(true)
        })
        .catch(notifyAccountPaymentPaidError)
      return
    }

    const ids = new Set(selection.map(r => r.id))
    setMockAccountPaymentRowsState(prev =>
      prev.map(r => (ids.has(r.id) ? { ...r, accountPaymentStatus: 'account_paid' as const } : r))
    )
    setSelectedRowKeys(prev => prev.filter(k => !ids.has(String(k))))
    closeAccountPaymentConfirmModal()
    setAccountPaymentCompleteSuccessOpen(true)
  }, [
    accountPayConfirmSelection,
    accountPaymentsRemote,
    closeAccountPaymentConfirmModal,
    markPaidMutation,
    notifyAccountPaymentPaidError,
  ])

  const closeAccountPaymentCompleteSuccess = useCallback(() => {
    setAccountPaymentCompleteSuccessOpen(false)
  }, [])

  const handleIssueBulkTransferFromSuccessModal = useCallback(() => {
    setAccountPaymentCompleteSuccessOpen(false)
    const completed = filteredRows.filter(r => r.accountPaymentStatus === 'account_paid')
    if (completed.length === 0) {
      console.debug('accountPaymentsPage no completed rows for bulk transfer')
      return
    }
    void (async () => {
      try {
        await requestExportForKind('bulk-transfer')
      } catch {
        return
      }
      setIssuedFormPreviewRows(completed)
      setBulkTransferPreviewOpen(true)
    })()
  }, [filteredRows, requestExportForKind])

  const filterLayoutClassName = 'account-payments-page__filter-table'

  return (
    <div className="payment-orders-page account-payments-page">
      <div className="account-payments-page__top-nav">
        <div className="account-payments-page__tabs" role="tablist" aria-label="연도별 조회">
          {tabYears.map(y => {
            const active = y === selectedYearScoped
            return (
              <button
                key={y}
                type="button"
                role="tab"
                aria-selected={active}
                id={`account-payments-year-tab-${y}`}
                className={
                  active
                    ? 'account-payments-page__tab account-payments-page__tab--active'
                    : 'account-payments-page__tab'
                }
                onClick={() => {
                  if (!active) handleYearTabSelect(y)
                }}
              >
                <span className="account-payments-page__tab-label">{y}년</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="account-payments-page__summary-row" aria-label="정산 요약">
        <div className="account-payments-page__summary-card">
          <span className="account-payments-page__card-label">
            {selectedYearScoped}년 예산 총액
          </span>
          <div className="account-payments-page__card-amount-row">
            <span className="account-payments-page__card-amount-num">
              {accountPaymentsRemote
                ? budgetSummaryQuery.isLoading
                  ? '…'
                  : annualBudgetAmount != null
                    ? annualBudgetAmount.toLocaleString('ko-KR')
                    : '-'
                : '-'}
            </span>
            {accountPaymentsRemote && annualBudgetAmount != null && (
              <span className="account-payments-page__card-amount-won">원</span>
            )}
          </div>
        </div>
        <div className="account-payments-page__summary-card">
          <span className="account-payments-page__card-label">
            {selectedYearScoped}년도 정산 완료 총액
          </span>
          <div className="account-payments-page__card-amount-row">
            <span className="account-payments-page__card-amount-num">
              {accountPaymentsRemote
                ? budgetSummaryQuery.isLoading
                  ? '…'
                  : completedTotalDisplay != null
                    ? completedTotalDisplay.toLocaleString('ko-KR')
                    : '-'
                : completedTotalDisplay != null
                  ? completedTotalDisplay.toLocaleString('ko-KR')
                  : '-'}
            </span>
            {(accountPaymentsRemote
              ? completedTotalDisplay != null && !budgetSummaryQuery.isLoading
              : completedTotalDisplay != null) && (
              <span className="account-payments-page__card-amount-won">원</span>
            )}
          </div>
        </div>
        <div
          className="account-payments-page__summary-card account-payments-page__summary-card--mint"
          aria-live="polite"
        >
          <span className="account-payments-page__card-label">
            {card3Meta.labelDateRange === null ? (
              '이체 예정일을 선택 후 조회'
            ) : (
              <>
                <span className="account-payments-page__card-label-date-range">
                  {card3Meta.labelDateRange}
                </span>
                {' 정산 예정 총액'}
              </>
            )}
          </span>
          <div className="account-payments-page__card-amount-row">
            <span className="account-payments-page__card-amount-num">
              {card3Meta.labelDateRange === null
                ? '-'
                : accountPaymentsRemote && budgetSummaryQuery.isLoading
                  ? '…'
                  : card3Meta.amount === null
                    ? '-'
                    : card3Meta.amount.toLocaleString('ko-KR')}
            </span>
            {card3Meta.amount !== null && (
              <span className="account-payments-page__card-amount-won">원</span>
            )}
          </div>
        </div>
      </div>

      <div className="payment-orders-page__content-wrapper">
        <FilterTableLayout
          className={filterLayoutClassName}
          contentVariant={viewMode === 'calendar' ? 'calendar' : 'table'}
          bordered={false}
          cardStyle={{ marginBottom: 0 }}
          fields={accountFilterFields}
          filters={unifiedFilterValues}
          onFilterChange={handleUnifiedFilterChange}
          onSearch={handleSearch}
          title={viewMode === 'list' ? '계좌 지급 대상 목록' : '예정 프로그램'}
          description={`총 ${total}건`}
          contentLoading={Boolean(accountPaymentsRemote && accountPaymentsListQuery.isLoading)}
          actions={accountPaymentsFilterTableActions}
          actionsAfterExcel={accountPaymentsAfterActions}
          excelExport={accountPaymentsExcelExport}
        >
          {viewMode === 'list' ? (
            accountPaymentsRemote && accountPaymentsListQuery.isError ? (
              <div className="page-content-error" role="alert">
                {accountPaymentsListQuery.error instanceof Error
                  ? accountPaymentsListQuery.error.message
                  : '목록을 불러오지 못했습니다.'}
              </div>
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
                  openAccountPaymentDetail(record)
                },
              })}
            />
            )
          ) : accountPaymentsRemote && accountPaymentsListQuery.isError ? (
            <div className="page-content-error" role="alert">
              {accountPaymentsListQuery.error instanceof Error
                ? accountPaymentsListQuery.error.message
                : '목록을 불러오지 못했습니다.'}
            </div>
          ) : (
            <AccountPaymentsCalendarView
              key={[
                applied.instructorName,
                applied.programName,
                applied.accountStatus,
                applied.transferDateRange?.[0]?.valueOf() ?? '',
                applied.transferDateRange?.[1]?.valueOf() ?? '',
              ].join('|')}
              rows={filteredRows}
              selectedRowKeys={selectedRowKeys}
              onSelectionChange={setSelectedRowKeys}
              onAccountPaymentRowClick={openAccountPaymentDetail}
            />
          )}
        </FilterTableLayout>
      </div>

      <AccountPaymentConfirmationModal
        open={accountPayConfirmSelection !== null}
        onCancel={closeAccountPaymentConfirmModal}
        onConfirm={handleAccountPaymentConfirmComplete}
        data={accountPaymentConfirmModalData}
      />

      <AccountPaymentCompleteSuccessModal
        open={accountPaymentCompleteSuccessOpen}
        onCancel={closeAccountPaymentCompleteSuccess}
        onIssueBulkTransfer={handleIssueBulkTransferFromSuccessModal}
      />

      <InstructorPaymentStatementBlockedModal
        open={accountFormIssueBlockedOpen}
        onClose={closeAccountFormIssueBlocked}
        variant={accountFormIssueBlockedVariant}
        selectedCount={accountFormIssueBlockedSelectedCount}
        purpose="accountPaymentForms"
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
          <BulkTransferPreviewModal
            open
            onCancel={closeBulkTransferPreview}
            rows={issuedFormPreviewRows ?? []}
          />
        </Suspense>
      ) : null}

      {taxFilingPreviewOpen ? (
        <Suspense
          fallback={
            <div
              className="account-payments-page__bulk-preview-loading"
              role="status"
              aria-live="polite"
              aria-label="세금신고 양식 불러오는 중"
            >
              <Spin size="large" />
            </div>
          }
        >
          <TaxFilingPreviewModal
            open
            onCancel={closeTaxFilingPreview}
            rows={issuedFormPreviewRows ?? []}
          />
        </Suspense>
      ) : null}

      <AccountPaymentStatusDetailFullPageModal
        open={accountPaymentDetailRow !== null}
        onClose={closeAccountPaymentDetail}
        row={accountPaymentDetailRow}
        onAccountPaymentCompleted={handleAccountPaymentCompletedForRow}
      />
    </div>
  )
}
