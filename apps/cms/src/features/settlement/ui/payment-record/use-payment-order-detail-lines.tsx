/**
 * 지급 현황 상세 — 라인 테이블 필터·행 상태·일괄 확인·산출 내역서 커밋 싱크
 */

import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import {
  buildInstructorDetailFromSettlements,
  buildProgramDetailFromSettlements,
} from '@/features/settlement-management/api/payment-orders/map-settlement-detail'
import {
  instructorIdentityFromLine,
  mapSettlementDetailToInstructorPageCalculationStatement,
  mapSettlementDetailToProgramCalculationStatement,
} from '@/features/settlement-management/api/payment-orders/map-settlement-detail-to-calculation-statement'
import { fetchSettlementDetailRemote } from '@/features/settlement-management/api/settlement-api-client'
import { getSettlementApiErrorMessage } from '@/features/settlement-management/api/get-settlement-api-error'
import { useConfirmPaymentStatementMutation } from '@/features/settlement-management/hooks/use-confirm-payment-statement-mutation'
import { shouldUseSettlementRemote } from '@/features/settlement-management/hooks/use-settlement-remote-enabled'
import type { PaymentOrdersDetailContextQueryResult } from '@/features/settlement-management/hooks/use-payment-orders-detail-query'
import {
  buildMockInstructorDetailLinePaymentStatementIssuancePayload,
  buildMockProgramDetailLinePaymentStatementIssuancePayload,
  buildPaymentStatementIssuancePayloadFromCalculationStatement,
  isPaymentOrderLineEligibleForPaymentStatementIssue,
  type PaymentStatementIssuancePayload,
} from '@/features/settlement/lib/payment-order-calculation-statement-issuance-view'
import {
  getMockPaymentOrderInstructorDetail,
  getMockPaymentOrderProgramDetail,
  type PaymentOrderAdminInstructorDetail,
  type PaymentOrderAdminInstructorDetailProgramRow,
  type PaymentOrderAdminInstructorRow,
  type PaymentOrderAdminProgramDetail,
  type PaymentOrderAdminProgramDetailInstructorRow,
  type PaymentOrderAdminProgramRow,
} from '@/data/mock/payment-order-admin-list'
import {
  PAYMENT_ORDER_LINE_STATUS_LABELS_FULL,
  type PaymentOrderDetailAggregateStatus,
} from '@/shared/constants/payment-order-aggregate-status'
import type { FilterTableExcelExportConfig } from '@/shared/components/filter-table-layout'

type DetailContextQuery = PaymentOrdersDetailContextQueryResult
import {
  deriveAggregateFromLines,
  formatKoreanDateWithWeekday,
  formatWon,
  lineStatusSelectOptions,
  matchesDateRange,
  resolveDetailInitialDateRange,
  type AppliedLineStatus,
  type PaymentOrderCalculationStatementCommitPayload,
} from '@/pages/settlement-management/payment-order-detail-fullpage-shared'
import { renderLineProcessingStatusText } from '@/pages/settlement-management/payment-order-detail-aggregate-status'
import { CmsButton } from '@/shared/ui'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
} from '@/shared/components/table-filter-group-field-width'
import { PaymentOrderLectureDateSessionCell } from './payment-order-lecture-date-session-cell'

export type PaymentOrderDetailLineRow =
  | PaymentOrderAdminProgramDetailInstructorRow
  | PaymentOrderAdminInstructorDetailProgramRow

type PaymentOrderDetailLineExcelRow = {
  no: number
  name: string
  institutionName: string
  lectureDateSession: string
  processingStatusLabel: string
  estimatedAmountLabel: string
}

interface DetailAppliedFilters {
  keyword: string
  institutionName: string
  status: AppliedLineStatus
  dateRange: [Dayjs, Dayjs] | null
}

function filterDetailRows(
  rows: PaymentOrderDetailLineRow[],
  mode: 'program' | 'instructor',
  applied: DetailAppliedFilters
): PaymentOrderDetailLineRow[] {
  const keyword = applied.keyword.trim()
  const qInstitution = applied.institutionName.trim()
  return rows.filter(row => {
    if (keyword) {
      const keywordMatch =
        mode === 'program'
          ? (row as PaymentOrderAdminProgramDetailInstructorRow).instructorName.includes(keyword)
          : (row as PaymentOrderAdminInstructorDetailProgramRow).programName.includes(keyword)
      if (!keywordMatch) return false
    }
    if (qInstitution && !row.institutionName.includes(qInstitution)) return false
    if (applied.status !== 'all' && row.processingStatus !== applied.status) return false
    if (!matchesDateRange(row.lectureDate, applied.dateRange)) return false
    return true
  })
}

type RemoteDetailProps = {
  paymentOrdersRemote?: boolean
  detailContextQuery?: DetailContextQuery
}

export type UsePaymentOrderDetailLinesControllerArgs = RemoteDetailProps &
  (
    | {
        mode: 'program'
        programRow: PaymentOrderAdminProgramRow
        isOpen: boolean
        listPageDateRange: [Dayjs, Dayjs] | null
        onAggregateChange: (status: PaymentOrderDetailAggregateStatus) => void
        onOpenCalculationStatement: (row: PaymentOrderAdminProgramDetailInstructorRow) => void
        registerStatementCommitSink?: (
          sink: (payload: PaymentOrderCalculationStatementCommitPayload) => void
        ) => void
      }
    | {
        mode: 'instructor'
        instructorRow: PaymentOrderAdminInstructorRow
        isOpen: boolean
        listPageDateRange: [Dayjs, Dayjs] | null
        onAggregateChange: (status: PaymentOrderDetailAggregateStatus) => void
        onOpenCalculationStatement: (row: PaymentOrderAdminInstructorDetailProgramRow) => void
        registerStatementCommitSink?: (
          sink: (payload: PaymentOrderCalculationStatementCommitPayload) => void
        ) => void
      }
  )

export function usePaymentOrderDetailLinesController(
  args: UsePaymentOrderDetailLinesControllerArgs
) {
  const {
    mode,
    isOpen,
    listPageDateRange,
    onAggregateChange,
    onOpenCalculationStatement,
    registerStatementCommitSink,
    paymentOrdersRemote = shouldUseSettlementRemote('paymentOrders'),
    detailContextQuery,
  } = args

  const confirmMutation = useConfirmPaymentStatementMutation()

  const contextRowNo = mode === 'program' ? args.programRow.no : args.instructorRow.no
  const contextAggregateKey =
    mode === 'program' ? args.programRow.aggregateKey : args.instructorRow.aggregateKey

  const [draftKeyword, setDraftKeyword] = useState('')
  const [draftInstitutionName, setDraftInstitutionName] = useState('')
  const [draftStatus, setDraftStatus] = useState<AppliedLineStatus>('all')
  const [draftDateRange, setDraftDateRange] = useState<[Dayjs, Dayjs] | null>(() =>
    resolveDetailInitialDateRange(listPageDateRange)
  )
  const [applied, setApplied] = useState<DetailAppliedFilters>({
    keyword: '',
    institutionName: '',
    status: 'all',
    dateRange: resolveDetailInitialDateRange(listPageDateRange),
  })
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [rowsState, setRowsState] = useState<PaymentOrderDetailLineRow[]>([])
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false)
  const [paymentStatementIssueBlocked, setPaymentStatementIssueBlocked] = useState<{
    open: boolean
    variant: 'single' | 'multi'
    selectedCount: number
  }>({ open: false, variant: 'single', selectedCount: 0 })
  const [issuanceViewOpen, setIssuanceViewOpen] = useState(false)
  const [issuanceQueue, setIssuanceQueue] = useState<PaymentStatementIssuancePayload[]>([])
  const currentIssuancePayload = issuanceQueue[0] ?? null

  useEffect(() => {
    if (!isOpen) {
      setBatchConfirmOpen(false)
      setPaymentStatementIssueBlocked({ open: false, variant: 'single', selectedCount: 0 })
      setIssuanceViewOpen(false)
      setIssuanceQueue([])
      return
    }

    const initialDateRange = resolveDetailInitialDateRange(listPageDateRange)

    setDraftKeyword('')
    setDraftInstitutionName('')
    setDraftStatus('all')
    setDraftDateRange(initialDateRange)
    setApplied({
      keyword: '',
      institutionName: '',
      status: 'all',
      dateRange: initialDateRange,
    })
    setSelectedRowKeys([])
    setBatchConfirmOpen(false)
    setPaymentStatementIssueBlocked({ open: false, variant: 'single', selectedCount: 0 })
    setIssuanceViewOpen(false)
    setIssuanceQueue([])

    if (mode === 'program') {
      if (paymentOrdersRemote && detailContextQuery?.data) {
        const d = buildProgramDetailFromSettlements(
          args.programRow,
          detailContextQuery.data.items ?? [],
          detailContextQuery.data.statements ?? []
        )
        setRowsState(d.instructorRows.map(r => ({ ...r })))
      } else {
        const d = getMockPaymentOrderProgramDetail(args.programRow)
        setRowsState(d.instructorRows.map(r => ({ ...r })))
      }
    } else if (paymentOrdersRemote && detailContextQuery?.data) {
      const d = buildInstructorDetailFromSettlements(
        args.instructorRow,
        detailContextQuery.data.items ?? [],
        detailContextQuery.data.statements ?? []
      )
      setRowsState(d.programRows.map(r => ({ ...r })))
    } else {
      const d = getMockPaymentOrderInstructorDetail(args.instructorRow)
      setRowsState(d.programRows.map(r => ({ ...r })))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- contextRowNo·aggregateKey로 행 식별
  }, [
    isOpen,
    mode,
    contextRowNo,
    contextAggregateKey,
    listPageDateRange,
    paymentOrdersRemote,
    detailContextQuery?.data,
  ])

  useEffect(() => {
    onAggregateChange(deriveAggregateFromLines(rowsState.map(r => r.processingStatus)))
  }, [rowsState, onAggregateChange])

  const applyStatementCommit = useCallback(
    (payload: PaymentOrderCalculationStatementCommitPayload) => {
      setRowsState(prev =>
        prev.map(row => {
          if (row.id !== payload.lineId) return row
          if (payload.status === 'confirmed') {
            return {
              ...row,
              processingStatus: 'confirmed',
              lectureFeePaymentScheduledDate: payload.lectureFeePaymentScheduledDate,
              processingRejectionReason: undefined,
            }
          }
          if (payload.status === 'application_rejected') {
            return {
              ...row,
              processingStatus: 'application_rejected',
              processingRejectionReason: payload.rejectionReason,
              lectureFeePaymentScheduledDate: undefined,
            }
          }
          return { ...row, processingStatus: payload.status }
        })
      )
      if (payload.status === 'confirmed') {
        console.debug('payment order confirmed', payload)
      } else if (payload.status === 'application_rejected') {
        console.debug('payment order application rejected', payload)
      }
    },
    []
  )

  useEffect(() => {
    if (!registerStatementCommitSink) return
    registerStatementCommitSink(applyStatementCommit)
    return () => {
      registerStatementCommitSink(() => {})
    }
  }, [registerStatementCommitSink, applyStatementCommit])

  const handleSearch = useCallback(() => {
    setApplied({
      keyword: draftKeyword.trim(),
      institutionName: draftInstitutionName.trim(),
      status: draftStatus,
      dateRange: draftDateRange,
    })
  }, [draftDateRange, draftInstitutionName, draftKeyword, draftStatus])

  const handleBatchConfirm = useCallback(
    (scheduledDate: Dayjs) => {
      const iso = scheduledDate.format('YYYY-MM-DD')

      if (paymentOrdersRemote) {
        const selected = rowsState.filter(r => selectedRowKeys.includes(r.id))
        const statementIds = selected
          .map(r => r.statementId)
          .filter((id): id is number => id != null)

        if (statementIds.length === 0) {
          window.alert('지급조서 확인 API에 필요한 statementId가 없습니다.')
          return
        }

        void confirmMutation
          .mutateAsync({
            statementIds,
            lectureFeePaymentScheduledDate: iso,
          })
          .then(() => {
            setRowsState(prev =>
              prev.map(row =>
                selectedRowKeys.includes(row.id)
                  ? {
                      ...row,
                      processingStatus: 'confirmed' as const,
                      lectureFeePaymentScheduledDate: iso,
                    }
                  : row
              )
            )
            setBatchConfirmOpen(false)
            setSelectedRowKeys([])
          })
          .catch(error => {
            window.alert(getSettlementApiErrorMessage(error, '지급조서 일괄 확인에 실패했습니다.'))
          })
        return
      }

      setRowsState(prev =>
        prev.map(row =>
          selectedRowKeys.includes(row.id)
            ? {
                ...row,
                processingStatus: 'confirmed' as const,
                lectureFeePaymentScheduledDate: iso,
              }
            : row
        )
      )
      setBatchConfirmOpen(false)
      setSelectedRowKeys([])
    },
    [selectedRowKeys, paymentOrdersRemote, rowsState, confirmMutation]
  )

  const filteredRows = useMemo(
    () => filterDetailRows(rowsState, mode, applied),
    [rowsState, mode, applied]
  )

  const programDetail = useMemo((): PaymentOrderAdminProgramDetail | null => {
    if (mode !== 'program') return null
    if (paymentOrdersRemote && detailContextQuery?.data) {
      return buildProgramDetailFromSettlements(
        args.programRow,
        detailContextQuery.data.items ?? [],
        detailContextQuery.data.statements ?? []
      )
    }
    return getMockPaymentOrderProgramDetail(args.programRow)
  }, [mode, paymentOrdersRemote, detailContextQuery?.data, args])

  const instructorDetail = useMemo((): PaymentOrderAdminInstructorDetail | null => {
    if (mode !== 'instructor') return null
    if (paymentOrdersRemote && detailContextQuery?.data) {
      return buildInstructorDetailFromSettlements(
        args.instructorRow,
        detailContextQuery.data.items ?? [],
        detailContextQuery.data.statements ?? []
      )
    }
    return getMockPaymentOrderInstructorDetail(args.instructorRow)
  }, [mode, paymentOrdersRemote, detailContextQuery?.data, args])

  const buildIssuancePayloadForLine = useCallback(
    async (lineRow: PaymentOrderDetailLineRow): Promise<PaymentStatementIssuancePayload> => {
      if (mode === 'program') {
        if (!programDetail) {
          throw new Error('프로그램 상세를 불러오지 못했습니다.')
        }
        const programLineRow = lineRow as PaymentOrderAdminProgramDetailInstructorRow
        if (paymentOrdersRemote) {
          if (programLineRow.settlementId == null) {
            throw new Error('지급조서 발급 API에 필요한 settlementId가 없습니다.')
          }
          const settlement = await fetchSettlementDetailRemote(programLineRow.settlementId)
          const statement = mapSettlementDetailToInstructorPageCalculationStatement(
            programLineRow,
            settlement,
            instructorIdentityFromLine(programLineRow.instructorName),
            programDetail.programName
          )
          const payload = buildPaymentStatementIssuancePayloadFromCalculationStatement(statement)
          if (!payload) {
            throw new Error('지급조서 발급 데이터를 만들 수 없습니다.')
          }
          return payload
        }
        return buildMockProgramDetailLinePaymentStatementIssuancePayload(
          args.programRow,
          programDetail,
          programLineRow
        )
      }

      if (!instructorDetail) {
        throw new Error('강사 상세를 불러오지 못했습니다.')
      }
      const instructorLineRow = lineRow as PaymentOrderAdminInstructorDetailProgramRow
      if (paymentOrdersRemote) {
        if (instructorLineRow.settlementId == null) {
          throw new Error('지급조서 발급 API에 필요한 settlementId가 없습니다.')
        }
        const settlement = await fetchSettlementDetailRemote(instructorLineRow.settlementId)
        const statement = mapSettlementDetailToProgramCalculationStatement(
          instructorLineRow,
          settlement,
          instructorLineRow.programName,
          instructorDetail.nameKo
        )
        const payload = buildPaymentStatementIssuancePayloadFromCalculationStatement(statement)
        if (!payload) {
          throw new Error('지급조서 발급 데이터를 만들 수 없습니다.')
        }
        return payload
      }
      return buildMockInstructorDetailLinePaymentStatementIssuancePayload(
        args.instructorRow,
        instructorDetail,
        instructorLineRow
      )
    },
    [mode, programDetail, instructorDetail, paymentOrdersRemote, args]
  )

  const closeIssuanceView = useCallback(() => {
    setIssuanceQueue(prev => {
      const [, ...rest] = prev
      if (rest.length === 0) {
        setIssuanceViewOpen(false)
      }
      return rest
    })
  }, [])

  const handlePaymentStatementIssue = useCallback(() => {
    if (selectedRowKeys.length === 0) return
    const selected = rowsState.filter(r => selectedRowKeys.includes(r.id))
    if (selected.length === 0) return

    const hasIneligible = selected.some(
      row => !isPaymentOrderLineEligibleForPaymentStatementIssue(row.processingStatus)
    )
    if (hasIneligible) {
      const n = selected.length
      setPaymentStatementIssueBlocked({
        open: true,
        variant: n === 1 ? 'single' : 'multi',
        selectedCount: n,
      })
      return
    }

    void (async () => {
      try {
        const payloads = await Promise.all(selected.map(line => buildIssuancePayloadForLine(line)))
        setIssuanceQueue(payloads)
        setIssuanceViewOpen(true)
      } catch (error) {
        window.alert(
          getSettlementApiErrorMessage(error, '지급조서 발급 미리보기를 불러오지 못했습니다.')
        )
      }
    })()
  }, [buildIssuancePayloadForLine, rowsState, selectedRowKeys])

  const keywordFieldKey = mode === 'program' ? 'instructorName' : 'programName'

  const filterFields = useMemo(() => {
    const keywordField =
      mode === 'program'
        ? {
            key: 'instructorName' as const,
            type: 'search' as const,
            label: '신청자명',
            placeholder: '신청자명을 입력하세요',
            width: FILTER_CONTROL_MAX_WIDTH_PX,
          }
        : {
            key: 'programName' as const,
            type: 'search' as const,
            label: '프로그램명',
            placeholder: '프로그램명을 입력하세요',
            width: FILTER_CONTROL_MAX_WIDTH_PX,
          }

    return [
      keywordField,
      {
        key: 'institutionName' as const,
        type: 'search' as const,
        label: '참여 기관명',
        placeholder: '기관명을 입력하세요',
        width: FILTER_CONTROL_MAX_WIDTH_PX,
      },
      {
        key: 'status' as const,
        type: 'select' as const,
        label: '지급조서 처리 현황',
        placeholder: '전체',
        options: lineStatusSelectOptions.filter(o => o.value !== 'all'),
        allowClear: true,
        width: FILTER_CONTROL_MAX_WIDTH_PX,
      },
      {
        key: 'dateRange' as const,
        type: 'dateRange' as const,
        label: '기간',
        width: FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
      },
    ]
  }, [mode])

  const filterFilters = useMemo(
    () => ({
      [keywordFieldKey]: draftKeyword,
      institutionName: draftInstitutionName,
      status: draftStatus === 'all' ? undefined : draftStatus,
      dateRange: draftDateRange,
    }),
    [draftDateRange, draftInstitutionName, draftKeyword, draftStatus, keywordFieldKey]
  )

  const onFilterCardChange = useCallback(
    (key: string, value: unknown) => {
      if (key === keywordFieldKey) {
        setDraftKeyword(value as string)
        return
      }
      if (key === 'institutionName') {
        setDraftInstitutionName(value as string)
        return
      }
      if (key === 'status') {
        setDraftStatus((value == null || value === '' ? 'all' : value) as AppliedLineStatus)
        return
      }
      if (key === 'dateRange') {
        setDraftDateRange(value as [Dayjs, Dayjs] | null)
      }
    },
    [keywordFieldKey]
  )

  const columns: ColumnsType<PaymentOrderDetailLineRow> = useMemo(() => {
    const w =
      mode === 'instructor'
        ? {
            no: 52,
            title: 312,
            institution: 136,
            lecture: 204,
            processing: 164,
            amount: 124,
            breakdown: 148,
          }
        : {
            no: 64,
            title: 120,
            institution: 160,
            lecture: 220,
            processing: 176,
            amount: 140,
            breakdown: 196,
          }

    const nameColumn: ColumnsType<PaymentOrderDetailLineRow>[0] =
      mode === 'program'
        ? {
            title: '신청자명',
            dataIndex: 'instructorName',
            key: 'instructorName',
            ellipsis: { showTitle: true },
            width: w.title,
            align: 'center',
          }
        : {
            title: '프로그램명',
            dataIndex: 'programName',
            key: 'programName',
            ellipsis: { showTitle: true },
            width: w.title,
            align: 'center',
          }

    return [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: w.no,
        align: 'center',
      },
      nameColumn,
      {
        title: '참여 기관명',
        dataIndex: 'institutionName',
        key: 'institutionName',
        ellipsis: { showTitle: true },
        width: w.institution,
        align: 'center',
      },
      {
        title: '교육 진행 일자',
        key: 'lecture',
        width: w.lecture,
        align: 'center',
        render: (_: unknown, row: PaymentOrderDetailLineRow) => (
          <PaymentOrderLectureDateSessionCell
            lectureDate={row.lectureDate}
            sessionOrdinal={row.sessionOrdinal}
          />
        ),
      },
      {
        title: '지급조서 처리 현황',
        key: 'processingStatus',
        width: w.processing,
        align: 'center',
        onCell: () => ({
          className: 'payment-order-detail-filter-table__td--processing-status',
        }),
        render: (_: unknown, row: PaymentOrderDetailLineRow) =>
          renderLineProcessingStatusText(row.processingStatus),
      },
      {
        title: '정산 신청 금액',
        dataIndex: 'estimatedAmount',
        key: 'estimatedAmount',
        width: w.amount,
        align: 'center',
        render: (amount: number) => formatWon(amount),
      },
      {
        title: '산출 내역',
        key: 'breakdown',
        width: w.breakdown,
        align: 'center',
        render: (_: unknown, row: PaymentOrderDetailLineRow) => (
          <CmsButton
            variant="default"
            size="large"
            className={
              mode === 'instructor'
                ? 'payment-order-detail-filter-table__breakdown-btn--140x40'
                : 'payment-order-detail-filter-table__breakdown-btn--180'
            }
            onClick={e => {
              e.stopPropagation()
              if (mode === 'program') {
                onOpenCalculationStatement(row as PaymentOrderAdminProgramDetailInstructorRow)
              } else {
                onOpenCalculationStatement(row as PaymentOrderAdminInstructorDetailProgramRow)
              }
            }}
          >
            상세 보기
          </CmsButton>
        ),
      },
    ]
  }, [mode, onOpenCalculationStatement])

  const sectionTitle = mode === 'program' ? '신청자별 정산 목록' : '프로그램별 정산 목록'

  const filterClassName = 'payment-order-detail-filter-table__filters'

  const excelExport = useMemo((): FilterTableExcelExportConfig<PaymentOrderDetailLineExcelRow> => {
    const nameTitle = mode === 'program' ? '신청자명' : '프로그램명'
    const data: PaymentOrderDetailLineExcelRow[] = filteredRows.map(row => ({
      no: row.no,
      name:
        mode === 'program'
          ? (row as PaymentOrderAdminProgramDetailInstructorRow).instructorName
          : (row as PaymentOrderAdminInstructorDetailProgramRow).programName,
      institutionName: row.institutionName,
      lectureDateSession: `${formatKoreanDateWithWeekday(row.lectureDate)} | ${row.sessionOrdinal}차시`,
      processingStatusLabel: PAYMENT_ORDER_LINE_STATUS_LABELS_FULL[row.processingStatus],
      estimatedAmountLabel: formatWon(row.estimatedAmount),
    }))

    const columns: ColumnsType<PaymentOrderDetailLineExcelRow> = [
      { title: 'No.', dataIndex: 'no', key: 'no' },
      { title: nameTitle, dataIndex: 'name', key: 'name' },
      { title: '참여 기관명', dataIndex: 'institutionName', key: 'institutionName' },
      { title: '강의 진행 일자', dataIndex: 'lectureDateSession', key: 'lectureDateSession' },
      {
        title: '지급 조서 처리 현황',
        dataIndex: 'processingStatusLabel',
        key: 'processingStatusLabel',
      },
      { title: '정산 예정 금액', dataIndex: 'estimatedAmountLabel', key: 'estimatedAmountLabel' },
    ]

    return { columns, data }
  }, [filteredRows, mode])

  return {
    filteredRows,
    batchConfirmOpen,
    setBatchConfirmOpen,
    paymentStatementIssueBlocked,
    setPaymentStatementIssueBlocked,
    handleBatchConfirm,
    handlePaymentStatementIssue,
    closeIssuanceView,
    issuanceViewOpen,
    currentIssuancePayload,
    selectedRowKeys,
    setSelectedRowKeys,
    filterFields,
    filterFilters,
    onFilterCardChange,
    handleSearch,
    columns,
    sectionTitle,
    filterClassName,
    excelExport,
  }
}
