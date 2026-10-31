/**
 * 정산 관리 > 계좌 지급 확인
 * 필터·목록: `FilterTableLayout` (`title`·`description`·`actions`) + 테이블·캘린더 본문
 */

import { lazy, Suspense, useCallback, useEffect, useMemo, useState, type Key } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import { formatDateDot, formatDateDotWithWeekday, formatNumberDisplay } from '@/shared/utils'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  ACCOUNT_PAYMENT_STATUS_LABELS,
  mockAccountPaymentRows,
  formatAccountPaymentInstitutionDisplay,
  formatAccountPaymentSessionLabelDisplay,
  isPaymentOrderStatementConfirmedForAccountPayments,
  type AccountPaymentRow,
  type AccountPaymentTransferStatus,
} from '@/features/settlement-management/model/account-payments-list'
import { getSettlementApiErrorMessage } from '@/features/settlement-management/api/get-settlement-api-error'
import { buildAccountPaymentExportRequest } from '@/features/settlement-management/api/account-payments/build-account-payment-export-request'
import { waitForSettlementExportDownload } from '@/features/settlement-management/api/settlement-api-client'
import type {
  SettlementExportHistoryResponse,
  SettlementExportRequest,
} from '@/shared/api/generated/settlement/schemas'
import { pickEligibleAccountPaymentFormIssueRows } from './resolve-toolbar-form-issue-rows'
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
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canAccessAccountPayments } from '@/shared/lib/account-payments-access'
import {
  resolveAdminRoleCodeFromUser,
  showAdminAccessDeniedAlert,
} from '@/shared/lib/admin-role-policy'
import { RawSettlementExportApprovalModal } from './raw-settlement-export-approval-modal'
import { ACCOUNT_PAYMENT_LIST_FILTER_STATUSES } from '@/shared/constants/payment-order-aggregate-status'
import {
  FilterTableLayout,
  type FilterFieldConfig,
  type FilterTableExcelExportConfig,
} from '@/shared/components/filter-table-layout'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
} from '@/shared/components/table-filter-group-field-width'
import { FilterTableToolbarButton } from '@/shared/ui'
import { CmsPageTabs } from '@/shared/ui/cms-text-tabs'
import '@/features/program/general/ui/detail-modal/program-status/program-status-participating-shared.css'
import '@/features/program/general/ui/detail-modal/program-status/program-progress-tab.css'
import './payment-orders-page.css'
import './account-payments-page.css'
import { AccountPaymentsCalendarView } from './account-payments-calendar-view'
import { getPaymentOrdersDefaultDateRange } from './payment-orders-date-range'
import {
  AP_YEAR_PARAM,
  parseAccountPaymentsYearParam,
  shiftTransferDateRangeToYear,
} from './account-payments-year'
import {
  AccountPaymentConfirmationModal,
  buildAccountPaymentConfirmationPayloadForSelection,
} from '@/features/settlement/ui/account-payment-confirmation-modal'
import {
  AccountPaymentCompleteSuccessModal,
  buildAccountPaymentCompleteSuccessContext,
  type AccountPaymentCompleteSuccessContext,
} from '@/features/settlement/ui/account-payment-complete-success-modal'
import { AccountPaymentStatusDetailFullPageModal } from './account-payment-status-detail-fullpage-modal'
import { InstructorPaymentStatementBlockedModal } from '@/features/user/detail/ui/modal/instructor-payment-statement-blocked-modal'

import {
  ButtonCalendarIcon,
  ButtonDownloadIcon,
  ButtonListIcon,
} from '@/shared/ui/icons/ButtonIcons'

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
  transferDateRange: [Dayjs | null, Dayjs | null] | null
}

/** 계좌 지급 풀페이지 상세 — URL 동기화(뒤로가기로 목록 복귀) */
const AP_DETAIL_ID = 'ap_detail'

/** `FilterTableLayout` 툴바 — `FilterTableToolbarButton` h40, width=auto에 최소 폭 180px 적용 */
const ACCOUNT_PAYMENTS_TOOLBAR_BTN_STYLE = { minWidth: 160 } as const

/**
 * 목록 가로 스크롤 기준 폭.
 * 선택80 + No.80 + 신청자88 + 프로그램420 + 기관130 + 차시100 + 현황130 + 금액110 + 이체일140
 */
const ACCOUNT_PAYMENTS_LIST_SCROLL_X = 80 + 80 + 88 + 420 + 130 + 100 + 130 + 110 + 140

/** 세 번째 요약 위젯 — 이체 예정일 구간 표기 `YYYY.MM.DD ~ YYYY.MM.DD` */
function formatYyMmDd(d: Dayjs): string {
  return formatDateDot(d)
}

function formatSettlementPendingDateRangeOnly(range: [Dayjs | null, Dayjs | null]): string {
  const from = range[0] ? formatYyMmDd(range[0]) : ''
  const to = range[1] ? formatYyMmDd(range[1]) : ''
  if (from && to) return `${from} ~ ${to}`
  if (from) return `${from} ~`
  if (to) return `~ ${to}`
  return ''
}

function formatTransferCell(iso: string): string {
  return formatDateDotWithWeekday(iso)
}

function matchesDateRange(iso: string, range: [Dayjs | null, Dayjs | null] | null): boolean {
  if (!range?.[0] && !range?.[1]) return true
  const d = dayjs(iso)
  if (!d.isValid()) return false
  if (range[0] && d.isBefore(range[0], 'day')) return false
  if (range[1] && d.isAfter(range[1], 'day')) return false
  return true
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
  return `${formatNumberDisplay(amount)}원`
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
  const { user } = useAuthStore()
  const canManageAccountPayments = canAccessAccountPayments(user)
  const sessionRoleCode = resolveAdminRoleCodeFromUser(user)
  const [rawExport, setRawExport] = useState<{
    mode: 'request' | 'approve'
    kind: 'bulk-transfer' | 'tax-report'
  } | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const calendarYear = useCalendarYear()
  const tabYears = useMemo(
    () => [calendarYear, calendarYear - 1, calendarYear - 2, calendarYear - 3],
    [calendarYear]
  )

  /** 탭 구간(금년~3년 전) — URL `ap_year`가 SSOT */
  const selectedYearScoped = useMemo(() => {
    const lo = calendarYear - 3
    const hi = calendarYear
    return parseAccountPaymentsYearParam(searchParams.get(AP_YEAR_PARAM), {
      minYear: lo,
      maxYear: hi,
      fallback: hi,
    })
  }, [calendarYear, searchParams])

  const [viewMode, setViewMode] = useState<PageViewMode>('list')
  const [draftInstructor, setDraftInstructor] = useState('')
  const [draftProgram, setDraftProgram] = useState('')
  const [draftAccountStatus, setDraftAccountStatus] = useState<AppliedAccountStatus>('all')
  const [draftDateRange, setDraftDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(() =>
    getPaymentOrdersDefaultDateRange()
  )
  const [applied, setApplied] = useState<AppliedFilters>(() => ({
    instructorName: '',
    programName: '',
    accountStatus: 'all',
    transferDateRange: getPaymentOrdersDefaultDateRange(),
  }))

  /** 최초 진입·잘못된 값이면 `ap_year`를 현재 탭 연도로 맞춤 */
  useEffect(() => {
    const lo = calendarYear - 3
    const hi = calendarYear
    const raw = searchParams.get(AP_YEAR_PARAM)
    const parsed = parseAccountPaymentsYearParam(raw, {
      minYear: lo,
      maxYear: hi,
      fallback: hi,
    })
    if (raw === String(parsed)) return
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.set(AP_YEAR_PARAM, String(parsed))
        return next
      },
      { replace: true }
    )
  }, [calendarYear, searchParams, setSearchParams])
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [accountPayConfirmSelection, setAccountPayConfirmSelection] = useState<
    AccountPaymentRow[] | null
  >(null)
  const [bulkTransferPreviewOpen, setBulkTransferPreviewOpen] = useState(false)
  const [taxFilingPreviewOpen, setTaxFilingPreviewOpen] = useState(false)
  /** 대량이체·세금신고 미리보기에 넘길 행 */
  const [issuedFormPreviewRows, setIssuedFormPreviewRows] = useState<AccountPaymentRow[] | null>(
    null
  )
  const [issuedFormExport, setIssuedFormExport] =
    useState<SettlementExportHistoryResponse | null>(null)
  const [accountFormIssueBlockedOpen, setAccountFormIssueBlockedOpen] = useState(false)
  const [accountFormIssueBlockedVariant, setAccountFormIssueBlockedVariant] = useState<
    'single' | 'multi'
  >('multi')
  const [accountFormIssueBlockedSelectedCount, setAccountFormIssueBlockedSelectedCount] =
    useState(0)
  const [accountPaymentCompleteSuccessContext, setAccountPaymentCompleteSuccessContext] =
    useState<AccountPaymentCompleteSuccessContext | null>(null)
  /** mock 배열을 직접 수정하지 않도록 복사본 유지 — 계좌 지급 완료 시 상태 반영 (mock 전용) */
  const [mockAccountPaymentRowsState, setMockAccountPaymentRowsState] = useState<
    AccountPaymentRow[]
  >(() =>
    mockAccountPaymentRows
      .filter(isPaymentOrderStatementConfirmedForAccountPayments)
      .map(r => ({ ...r }))
  )

  const accountPaymentsRemote = shouldUseSettlementRemote('accountPayments')
  const canRequestRawExport = accountPaymentsRemote && sessionRoleCode === 'ACCOUNTING_MANAGER'
  const canApproveRawExport = accountPaymentsRemote && sessionRoleCode === 'MASTER'
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
      const start = (range?.[0] ?? null) as Dayjs | null
      const end = (range?.[1] ?? null) as Dayjs | null
      setDraftDateRange(start == null && end == null ? null : [start, end])
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
      /** 이체일 구간이 있으면 BE가 year보다 from/to 우선. 구간 없을 때만 year 윈도우 */
      year: selectedYearScoped,
    }),
    [applied, selectedYearScoped]
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
  }, [accountPaymentsRemote, accountPaymentsListQuery.data, mockAccountPaymentRowsState])

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
    if (!range?.[0] && !range?.[1]) {
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

  const handleYearTabSelect = useCallback(
    (y: number) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          next.set(AP_YEAR_PARAM, String(y))
          return next
        },
        { replace: true }
      )
      // 이체 예정일 필터의 연도만 맞춰 목록이 같이 바뀌게 함 (from/to가 year를 덮음)
      setDraftDateRange(prev => shiftTransferDateRangeToYear(prev, y))
      setApplied(prev => ({
        ...prev,
        transferDateRange: shiftTransferDateRangeToYear(prev.transferDateRange, y),
      }))
      setSelectedRowKeys([])
    },
    [setSearchParams]
  )

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
        title: '신청자명',
        dataIndex: 'instructorName',
        key: 'instructorName',
        className: 'account-payments-page__col-instructor',
        ellipsis: { showTitle: true },
        width: 88,
        align: 'center',
      },
      {
        title: '프로그램명',
        dataIndex: 'programName',
        key: 'programName',
        className: 'account-payments-page__col-program',
        ellipsis: { showTitle: true },
        width: 420,
        align: 'center',
      },
      {
        title: '참여 기관명',
        dataIndex: 'institutionName',
        key: 'institutionName',
        className: 'account-payments-page__col-institution',
        ellipsis: { showTitle: true },
        width: 130,
        align: 'center',
        render: (v: string) => formatAccountPaymentInstitutionDisplay(v),
      },
      {
        title: '강의 진행 차시',
        dataIndex: 'sessionLabel',
        key: 'sessionLabel',
        className: 'account-payments-page__col-session',
        width: 100,
        align: 'center',
        render: (v: string) => formatAccountPaymentSessionLabelDisplay(v),
      },
      {
        title: '계좌 지급 현황',
        dataIndex: 'accountPaymentStatus',
        key: 'accountPaymentStatus',
        className: 'account-payments-page__col-status',
        width: 130,
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
        className: 'account-payments-page__col-amount',
        width: 110,
        align: 'center',
        render: (amount: number) => formatWon(amount),
      },
      {
        title: '이체 예정일',
        dataIndex: 'transferScheduledDate',
        key: 'transferScheduledDate',
        className: 'account-payments-page__col-transfer-date',
        width: 140,
        align: 'center',
        render: (iso: string) => formatTransferCell(iso),
      },
    ],
    []
  )

  const rawExportSelectedRows = useMemo(() => {
    const keySet = new Set(selectedRowKeys.map(String))
    return filteredRows.filter(row => keySet.has(String(row.id)))
  }, [filteredRows, selectedRowKeys])

  /** 화면에는 `총 n건만` 표기. 기획상 집계 구간은 전년 12월 ~ 당해 12월이며 연도가 바뀌면 갱신(API·데이터 연동 시 반영). */
  const total = filteredRows.length

  /**
   * 툴바 양식 발급: 선택한 행만 대상.
   * 대량이체 = 지급 대기, 세금신고 = 지급 완료. 조건 불일치면 불가 모달.
   */
  const resolveToolbarFormIssueRows = useCallback(
    (kind: 'bulk-transfer' | 'tax-report'): AccountPaymentRow[] | null => {
      if (selectedRowKeys.length === 0) {
        cmsAlertModal.show({
          title: '항목 선택 안내',
          content: '선택된 항목이 없습니다.\n항목 선택 후 다시 시도해 주세요.',
        })
        return null
      }
      const keySet = new Set(selectedRowKeys.map(String))
      const picked = filteredRows.filter(r => keySet.has(String(r.id)))
      if (picked.length === 0) {
        return null
      }
      const eligible = pickEligibleAccountPaymentFormIssueRows(kind, picked)
      if (eligible == null) {
        setAccountFormIssueBlockedVariant(selectedRowKeys.length === 1 ? 'single' : 'multi')
        setAccountFormIssueBlockedSelectedCount(selectedRowKeys.length)
        setAccountFormIssueBlockedOpen(true)
        return null
      }
      return eligible
    },
    [filteredRows, selectedRowKeys]
  )

  const notifyExportError = useCallback((error: unknown, fallback: string) => {
    if (isGlobalApiErrorAlertShown(error)) return
    cmsAlertModal.show({
      title: '발급 불가',
      content: getSettlementApiErrorMessage(error, fallback),
    })
  }, [])

  const requestExportForKind = useCallback(
    async (
      kind: 'bulk-transfer' | 'tax-report',
      rows: AccountPaymentRow[]
    ): Promise<SettlementExportHistoryResponse | null> => {
      if (!accountPaymentsRemote) return null
      const body = buildAccountPaymentExportRequest({
        kind,
        selection: { kind: 'selected', rows },
        fromDate: listQueryFilters.fromDate,
        toDate: listQueryFilters.toDate,
      })
      try {
        if (kind === 'bulk-transfer') {
          return await bulkTransferExportMutation.mutateAsync(body)
        }
        return await taxReportExportMutation.mutateAsync(body)
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

  const submitPreparedExport = useCallback(
    async (kind: 'bulk-transfer' | 'tax-report', body: SettlementExportRequest) => {
      if (kind === 'bulk-transfer') return bulkTransferExportMutation.mutateAsync(body)
      return taxReportExportMutation.mutateAsync(body)
    },
    [bulkTransferExportMutation, taxReportExportMutation]
  )

  const openRawExportRequest = useCallback(
    (kind: 'bulk-transfer' | 'tax-report') => {
      if (!canRequestRawExport) {
        showAdminAccessDeniedAlert()
        return
      }
      setRawExport({ mode: 'request', kind })
    },
    [canRequestRawExport]
  )

  const openBulkTransferPreview = useCallback(() => {
    const rows = resolveToolbarFormIssueRows('bulk-transfer')
    if (rows === null) return
    void (async () => {
      let readyExport: SettlementExportHistoryResponse | null = null
      try {
        const exportResult = await requestExportForKind('bulk-transfer', rows)
        readyExport = exportResult ? await waitForSettlementExportDownload(exportResult) : null
        if (readyExport?.pollingStatus === 'FAILED' || readyExport?.exportStatus === 'FAILED') {
          throw new Error(readyExport.failureReason || '대량이체 파일 생성에 실패했습니다.')
        }
      } catch (error) {
        notifyExportError(error, '대량이체 파일 생성에 실패했습니다.')
        return
      }
      setIssuedFormPreviewRows(rows)
      setIssuedFormExport(readyExport)
      setBulkTransferPreviewOpen(true)
    })()
  }, [notifyExportError, requestExportForKind, resolveToolbarFormIssueRows])

  const closeBulkTransferPreview = useCallback(() => {
    setBulkTransferPreviewOpen(false)
    setIssuedFormPreviewRows(null)
    setIssuedFormExport(null)
  }, [])

  const openTaxFilingPreview = useCallback(() => {
    const rows = resolveToolbarFormIssueRows('tax-report')
    if (rows === null) return
    void (async () => {
      let readyExport: SettlementExportHistoryResponse | null = null
      try {
        const exportResult = await requestExportForKind('tax-report', rows)
        readyExport = exportResult ? await waitForSettlementExportDownload(exportResult) : null
        if (readyExport?.pollingStatus === 'FAILED' || readyExport?.exportStatus === 'FAILED') {
          throw new Error(readyExport.failureReason || '세금신고 파일 생성에 실패했습니다.')
        }
      } catch (error) {
        notifyExportError(error, '세금신고 파일 생성에 실패했습니다.')
        return
      }
      setIssuedFormPreviewRows(rows)
      setIssuedFormExport(readyExport)
      setTaxFilingPreviewOpen(true)
    })()
  }, [notifyExportError, requestExportForKind, resolveToolbarFormIssueRows])

  const closeTaxFilingPreview = useCallback(() => {
    setTaxFilingPreviewOpen(false)
    setIssuedFormPreviewRows(null)
    setIssuedFormExport(null)
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
      if (!canManageAccountPayments) {
        showAdminAccessDeniedAlert()
        return
      }
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          next.set(AP_DETAIL_ID, row.id)
          return next
        },
        { replace: false }
      )
    },
    [canManageAccountPayments, setSearchParams]
  )

  const notifyAccountPaymentPaidError = useCallback((error: unknown) => {
    if (isGlobalApiErrorAlertShown(error)) return
    const content = getSettlementApiErrorMessage(error, '계좌 지급 완료 처리에 실패했습니다.')
    cmsAlertModal.show({
      title: content.includes('권한이 없습니다') ? '권한 없음' : '처리 불가',
      content,
    })
  }, [])

  const handleAccountPaymentCompletedForRow = useCallback(
    (rowId: string) => {
      const target = accountPaymentRows.find(r => r.id === rowId)
      if (!target) return

      if (accountPaymentsRemote) {
        const paymentId = target.accountPaymentId
        if (paymentId == null) {
          cmsAlertModal.show({
            title: '안내',
            content: '지급 완료 API에 필요한 accountPaymentId가 없습니다.',
          })
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
    if (!canManageAccountPayments) {
      showAdminAccessDeniedAlert()
      return
    }
    if (selectedRowKeys.length === 0) {
      cmsAlertModal.show({
        title: '항목 선택 안내',
        content: '선택된 항목이 없습니다.\n항목 선택 후 다시 시도해 주세요.',
      })
      return
    }
    const keySet = new Set(selectedRowKeys.map(String))
    const picked = filteredRows.filter(r => keySet.has(String(r.id)))
    if (picked.length === 0) {
      return
    }
    setAccountPayConfirmSelection(picked)
  }, [canManageAccountPayments, filteredRows, selectedRowKeys])

  const accountPaymentsFilterTableActions = useMemo(
    () => (
      <>
        {viewMode === 'list' ? (
          <FilterTableToolbarButton
            variant="secondary"
            style={ACCOUNT_PAYMENTS_TOOLBAR_BTN_STYLE}
            icon={<ButtonCalendarIcon />}
            type="button"
            onClick={() => setViewMode('calendar')} >
            캘린더 뷰로 보기
          </FilterTableToolbarButton>
        ) : (
          <FilterTableToolbarButton
            variant="secondary"
            style={ACCOUNT_PAYMENTS_TOOLBAR_BTN_STYLE}
            icon={<ButtonListIcon />}
            type="button"
            onClick={() => setViewMode('list')} >
            리스트 뷰로 보기
          </FilterTableToolbarButton>
        )}
        <FilterTableToolbarButton
          variant="primary"
          style={ACCOUNT_PAYMENTS_TOOLBAR_BTN_STYLE}
          icon={<ButtonDownloadIcon />}
          type="button"
          onClick={openBulkTransferPreview} >
          대량이체 양식 발급
        </FilterTableToolbarButton>
        <FilterTableToolbarButton
          variant="primary"
          style={ACCOUNT_PAYMENTS_TOOLBAR_BTN_STYLE}
          icon={<ButtonDownloadIcon />}
          type="button"
          onClick={openTaxFilingPreview} >
          세금 신고 양식 발급
        </FilterTableToolbarButton>
        {canRequestRawExport ? (
          <>
            <FilterTableToolbarButton
              variant="secondary"
              style={ACCOUNT_PAYMENTS_TOOLBAR_BTN_STYLE}
              type="button"
              onClick={() => openRawExportRequest('bulk-transfer')} >
              대량이체 전체 원본 승인
            </FilterTableToolbarButton>
            <FilterTableToolbarButton
              variant="secondary"
              style={ACCOUNT_PAYMENTS_TOOLBAR_BTN_STYLE}
              type="button"
              onClick={() => openRawExportRequest('tax-report')} >
              세금신고 전체 원본 승인
            </FilterTableToolbarButton>
          </>
        ) : null}
        {canApproveRawExport ? (
          <FilterTableToolbarButton
            variant="secondary"
            style={ACCOUNT_PAYMENTS_TOOLBAR_BTN_STYLE}
            type="button"
            onClick={() =>
              setRawExport({ mode: 'approve', kind: 'bulk-transfer' })
            } >
            원본 양식 승인
          </FilterTableToolbarButton>
        ) : null}
      </>
    ),
    [
      viewMode,
      openBulkTransferPreview,
      openTaxFilingPreview,
      canRequestRawExport,
      canApproveRawExport,
      openRawExportRequest,
    ]
  )

  const accountPaymentsAfterActions = useMemo(
    () =>
      canManageAccountPayments ? (
        <FilterTableToolbarButton
          variant="primary"
          type="button"
          onClick={openAccountPaymentConfirmFromSelection} >
          일괄 지급 처리
        </FilterTableToolbarButton>
      ) : null,
    [canManageAccountPayments, openAccountPaymentConfirmFromSelection]
  )

  const accountPaymentsExcelExport = useMemo((): FilterTableExcelExportConfig => {
    return {
      columns,
      data: filteredRows,
      selectedRowKeys: viewMode === 'list' ? selectedRowKeys : undefined,
    }
  }, [columns, filteredRows, selectedRowKeys, viewMode])

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
        cmsAlertModal.show({
          title: '안내',
          content: '지급 완료 API에 필요한 accountPaymentId가 없습니다.',
        })
        return
      }
      void markPaidMutation
        .mutateAsync(paymentIds)
        .then(() => {
          const ids = new Set(selection.map(r => r.id))
          setSelectedRowKeys(prev => prev.filter(k => !ids.has(String(k))))
          closeAccountPaymentConfirmModal()
          setAccountPaymentCompleteSuccessContext(
            buildAccountPaymentCompleteSuccessContext(selection)
          )
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
    setAccountPaymentCompleteSuccessContext(buildAccountPaymentCompleteSuccessContext(selection))
  }, [
    accountPayConfirmSelection,
    accountPaymentsRemote,
    closeAccountPaymentConfirmModal,
    markPaidMutation,
    notifyAccountPaymentPaidError,
  ])

  const closeAccountPaymentCompleteSuccess = useCallback(() => {
    setAccountPaymentCompleteSuccessContext(null)
  }, [])

  const handleIssueBulkTransferFromSuccessModal = useCallback(() => {
    const ctx = accountPaymentCompleteSuccessContext
    if (ctx?.kind !== 'bulk') return
    const rowsForPreview = ctx.completedRows
    setAccountPaymentCompleteSuccessContext(null)
    if (rowsForPreview.length === 0) {
      console.debug('accountPaymentsPage no rows from bulk payment success for bulk transfer')
      return
    }
    void (async () => {
      let readyExport: SettlementExportHistoryResponse | null = null
      try {
        const exportResult = await requestExportForKind('bulk-transfer', rowsForPreview)
        readyExport = exportResult ? await waitForSettlementExportDownload(exportResult) : null
        if (readyExport?.pollingStatus === 'FAILED' || readyExport?.exportStatus === 'FAILED') {
          throw new Error(readyExport.failureReason || '대량이체 파일 생성에 실패했습니다.')
        }
      } catch (error) {
        notifyExportError(error, '대량이체 파일 생성에 실패했습니다.')
        return
      }
      setIssuedFormPreviewRows(rowsForPreview)
      setIssuedFormExport(readyExport)
      setBulkTransferPreviewOpen(true)
    })()
  }, [accountPaymentCompleteSuccessContext, notifyExportError, requestExportForKind])

  const filterLayoutClassName = 'account-payments-page__filter-table'

  return (
    <div className="payment-orders-page account-payments-page">
      <div className="account-payments-page__top-nav">
        <CmsPageTabs
          className="account-payments-page__tabs"
          wrap
          aria-label="연도별 조회"
          value={String(selectedYearScoped)}
          onChange={key => handleYearTabSelect(Number(key))}
          items={tabYears.map(y => ({
            value: String(y),
            label: `${y}년`,
          }))}
        />
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

      <div
        className={[
          'payment-orders-page__content-wrapper',
          viewMode === 'calendar' ? 'payment-orders-page__content-wrapper--calendar' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <FilterTableLayout
          className={filterLayoutClassName}
          showFilter={viewMode === 'list'}
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
                {getSettlementApiErrorMessage(
                  accountPaymentsListQuery.error,
                  '목록을 불러오지 못했습니다.'
                )}
              </div>
            ) : (
              <CmsDataTable<AccountPaymentRow>
                className="cms-data-table account-payments-page__table"
                rowKey="id"
                columns={columns}
                dataSource={filteredRows}
                pagination={false}
                rowSelection={rowSelection}
                scroll={{ x: ACCOUNT_PAYMENTS_LIST_SCROLL_X }}
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
              {getSettlementApiErrorMessage(
                accountPaymentsListQuery.error,
                '목록을 불러오지 못했습니다.'
              )}
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
        open={accountPaymentCompleteSuccessContext !== null}
        context={accountPaymentCompleteSuccessContext}
        onCancel={closeAccountPaymentCompleteSuccess}
        onIssueBulkTransfer={handleIssueBulkTransferFromSuccessModal}
      />

      <RawSettlementExportApprovalModal
        open={rawExport != null}
        mode={rawExport?.mode ?? 'request'}
        kind={rawExport?.kind ?? 'bulk-transfer'}
        sessionAdminAccountId={user?.adminAccountId ?? null}
        selectedRows={rawExportSelectedRows}
        onRequestExport={submitPreparedExport}
        onClose={() => setRawExport(null)}
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
            serverExport={issuedFormExport}
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
            serverExport={issuedFormExport}
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
