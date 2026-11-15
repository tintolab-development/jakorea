/**
 * 지급 현황 상세 — 라인 테이블 필터·행 상태·일괄 확인·산출 내역서 커밋 싱크
 */

import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import type { PaymentOrderPayeeTypeFilter } from '@/pages/settlement-management/payment-orders-table.config'
import {
  instructorIdentityFromLine,
  mapSettlementDetailToInstructorPageCalculationStatement,
  mapSettlementDetailToProgramCalculationStatement,
} from '@/features/settlement-management/api/payment-orders/map-settlement-detail-to-calculation-statement'
import { getPaymentOrdersDetailContextRemote } from '@/features/settlement-management/api/payment-orders/admin-payment-orders-service'
import { fetchSettlementDetailRemote } from '@/features/settlement-management/api/settlement-api-client'
import {
  getSettlementApiErrorMessage,
  isFileDownloadPasswordApiError,
  isPaymentStatementConfirmConsentBlockError,
  isPaymentStatementStatusConflictError,
} from '@/features/settlement-management/api/get-settlement-api-error'
import {
  BULK_CONFIRM_PAYMENT_STATEMENT_ACTION,
  canConfirmPaymentStatement,
} from '@/features/settlement-management/api/shared/settlement-status-mappers'
import {
  isIndividualSettlementApplicationListItem,
  isSettlementApplicationListItem,
} from '@/features/settlement-management/api/payment-orders/map-settlement-detail'
import {
  downloadIndividualSettlementApplicationDocumentRemote,
  fetchIndividualSettlementApplicationDocumentRemote,
  isIndividualSettlementReviewConflict,
} from '@/features/program/general/api/individual-settlement-review-remote'
import {
  buildReceiptSettlementDocumentFileName,
  buildReceiptSettlementPreviewOptions,
} from '@/features/program/general/lib/map-receipt-settlement-document-to-preview-options'
import type { PaymentApplicationKind } from '@/features/settlement/lib/payment-application-copy'
import { formatLectureSessionLabel } from '@/features/settlement-management/api/shared/map-frontend-fields'
import { useConfirmPaymentStatementMutation } from '@/features/settlement-management/hooks/use-confirm-payment-statement-mutation'
import { shouldUseSettlementRemote } from '@/features/settlement-management/hooks/use-settlement-remote-enabled'
import type { PaymentOrdersDetailContextQueryResult } from '@/features/settlement-management/hooks/use-payment-orders-detail-query'
import {
  buildPaymentStatementIssuancePayloadFromCalculationStatement,
  isPaymentOrderLineEligibleForPaymentStatementIssue,
  type PaymentStatementIssuancePayload,
} from '@/features/settlement/lib/payment-order-calculation-statement-issuance-view'
import type {
  PaymentOrderAdminInstructorDetail,
  PaymentOrderAdminInstructorDetailProgramRow,
  PaymentOrderAdminInstructorRow,
  PaymentOrderAdminProgramDetail,
  PaymentOrderAdminProgramDetailInstructorRow,
  PaymentOrderAdminProgramRow,
} from '@/features/settlement-management/model/payment-order-admin-list'
import {
  resolvePaymentOrderInstructorDetailForLines,
  resolvePaymentOrderInstructorDetailLineRows,
  resolvePaymentOrderProgramDetailForLines,
  resolvePaymentOrderProgramDetailLineRows,
} from './resolve-payment-order-detail-line-source'
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
import { sumCountablePaymentOrderLineAmounts } from '@/features/settlement-management/api/payment-orders/payment-order-line-amounts'
import { renderLineProcessingStatusText } from '@/pages/settlement-management/payment-order-detail-aggregate-status'
import { useCmsAlert } from '@/shared/ui'
import { CalculationDetailViewButton } from './calculation-detail-view-button'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
} from '@/shared/components/table-filter-group-field-width'
import { PaymentOrderLectureDateSessionCell } from './payment-order-lecture-date-session-cell'
import { NO_SELECTION_ALERT } from '@/shared/constants/no-selection-alert'
import { ensureProgramWriteAllowed } from '@/features/program/shared/lib/program-role-action-check'
import {
  getApiErrorHttpStatus,
  networkAwareAlertTitle,
} from '@/shared/lib/extract-api-error-message'

export type PaymentOrderDetailLineRow =
  | PaymentOrderAdminProgramDetailInstructorRow
  | PaymentOrderAdminInstructorDetailProgramRow

type PaymentOrderDetailLineExcelRow = {
  id: string
  no: number
  name: string
  institutionName: string
  lectureDateSession: string
  processingStatusLabel: string
  estimatedAmountLabel: string
}

export interface DetailAppliedFilters {
  keyword: string
  institutionName: string
  status: AppliedLineStatus
  dateRange: [Dayjs, Dayjs] | null
}

export function filterDetailRows(
  rows: PaymentOrderDetailLineRow[],
  mode: 'program' | 'instructor',
  applied: DetailAppliedFilters,
  /** remote 조회 시 status·기간은 서버가 처리. 키워드·기관명은 클라이언트에서도 거른다 */
  remoteServerFiltered: boolean
): PaymentOrderDetailLineRow[] {
  const keyword = applied.keyword.trim().toLowerCase()
  const qInstitution = applied.institutionName.trim()
  return rows.filter(row => {
    // 서버 search는 프로그램명·회원명·기관명 OR라, 서버 조회 뒤에도 이름 열(프로그램 상세=신청자명,
    // 신청자 상세=프로그램명)로 한 번 더 거른다. 안 그러면 프로그램명에 든 단어로 신청자명을 찾을 때 전원이 나온다.
    if (keyword) {
      const name =
        mode === 'program'
          ? (row as PaymentOrderAdminProgramDetailInstructorRow).instructorName
          : (row as PaymentOrderAdminInstructorDetailProgramRow).programName
      if (!(name ?? '').toLowerCase().includes(keyword)) return false
    }
    if (qInstitution && !row.institutionName.includes(qInstitution)) return false
    if (
      !remoteServerFiltered &&
      applied.status !== 'all' &&
      row.processingStatus !== applied.status
    ) {
      return false
    }
    if (!remoteServerFiltered && !matchesDateRange(row.lectureDate, applied.dateRange)) return false
    return true
  })
}

/**
 * 일괄 확인 가능 여부. 영수증(참여자·봉사자) 행은 지급조서 확인 대신 영수증 승인(APPROVE)으로 처리한다
 * (일괄 확인 대상은 확인 대기 중·지급조서 재신청 건이고 신청자 유형으로 제외하지 않는다 — CMS-FUNC-0495).
 * 확정 전 강사 신청서 행은 BULK_CONFIRM_PAYMENT_STATEMENT가 있을 때만 일괄 확인한다(신청서 승인 + 지급조서 확인).
 */
export function canBatchConfirmDetailLine(row: PaymentOrderDetailLineRow): boolean {
  if (isIndividualSettlementApplicationListItem(row)) {
    return (
      row.individualSettlementApplicationId != null &&
      row.revisionNo != null &&
      (row.availableActions ?? []).includes('APPROVE')
    )
  }
  if (isSettlementApplicationListItem(row)) {
    return (
      row.settlementApplicationId != null &&
      (row.availableActions ?? []).includes(BULK_CONFIRM_PAYMENT_STATEMENT_ACTION)
    )
  }
  return canConfirmPaymentStatement(row)
}

function mapLineStatusToStatementStatus(status: AppliedLineStatus): string | null {
  switch (status) {
    case 'pending':
      return 'WAITING_CONFIRM'
    case 'reapplication':
      return 'REAPPLICATION'
    case 'confirmed':
      return 'CONFIRMED'
    case 'awaiting_payment':
      return 'CONFIRMED'
    case 'correction':
      return 'CORRECTION_REQUESTED'
    case 'application_rejected':
      return 'REJECTED'
    default:
      return null
  }
}

type RemoteDetailProps = {
  paymentOrdersRemote?: boolean
  detailContextQuery?: DetailContextQuery
  /** 목록에 조회 적용된 정산 대상자 구분 — 상세 재조회에도 같이 건다 */
  listPagePayeeType?: PaymentOrderPayeeTypeFilter
}

export type UsePaymentOrderDetailLinesControllerArgs = RemoteDetailProps &
  (
    | {
        mode: 'program'
        programRow: PaymentOrderAdminProgramRow
        isOpen: boolean
        listPageDateRange: [Dayjs | null, Dayjs | null] | null
        onAggregateChange: (status: PaymentOrderDetailAggregateStatus) => void
        /** 라인 상태 변경 시 반려·정정 제외 합산액 (신청자 상세 헤더용) */
        onCountableAmountChange?: (amount: number) => void
        onOpenCalculationStatement: (row: PaymentOrderAdminProgramDetailInstructorRow) => void
        registerStatementCommitSink?: (
          sink: (payload: PaymentOrderCalculationStatementCommitPayload) => void
        ) => void
      }
    | {
        mode: 'instructor'
        instructorRow: PaymentOrderAdminInstructorRow
        isOpen: boolean
        listPageDateRange: [Dayjs | null, Dayjs | null] | null
        onAggregateChange: (status: PaymentOrderDetailAggregateStatus) => void
        onCountableAmountChange?: (amount: number) => void
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
    onCountableAmountChange,
    onOpenCalculationStatement,
    registerStatementCommitSink,
    paymentOrdersRemote = shouldUseSettlementRemote('paymentOrders'),
    detailContextQuery,
    listPagePayeeType = 'all',
  } = args

  const { showAlert } = useCmsAlert()
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
  const [batchConfirmDoneOpen, setBatchConfirmDoneOpen] = useState(false)
  const [paymentStatementIssueBlocked, setPaymentStatementIssueBlocked] = useState<{
    open: boolean
    variant: 'single' | 'multi'
    selectedCount: number
  }>({ open: false, variant: 'single', selectedCount: 0 })
  const [issuanceViewOpen, setIssuanceViewOpen] = useState(false)
  const [issuanceQueue, setIssuanceQueue] = useState<PaymentStatementIssuancePayload[]>([])
  const [filterFetching, setFilterFetching] = useState(false)
  /** remote에서 조회 API로 search/status/기간을 이미 걸었으면 true */
  const [remoteServerFiltered, setRemoteServerFiltered] = useState(false)
  const currentIssuancePayload = issuanceQueue[0] ?? null
  /** 영수증 지급조서 다운로드 — 검토 모달 단건 발급과 같은 API·실패 안내 */
  const currentReceiptIssuance = currentIssuancePayload?.receiptSettlementApplication ?? null
  const downloadCurrentReceiptIssuancePdf = useMemo(() => {
    if (!currentReceiptIssuance) return undefined
    return async (password: string) => {
      try {
        await downloadIndividualSettlementApplicationDocumentRemote(
          currentReceiptIssuance.settlementApplicationId,
          { password, revisionNo: currentReceiptIssuance.revisionNo }
        )
      } catch (error) {
        if (!isFileDownloadPasswordApiError(error)) {
          showAlert({
            title: networkAwareAlertTitle(error, '안내'),
            content: getSettlementApiErrorMessage(error, '지급조서 다운로드에 실패했습니다.'),
          })
        }
        throw error
      }
    }
  }, [currentReceiptIssuance, showAlert])

  useEffect(() => {
    if (!isOpen) {
      setBatchConfirmOpen(false)
      setBatchConfirmDoneOpen(false)
      setPaymentStatementIssueBlocked({ open: false, variant: 'single', selectedCount: 0 })
      setIssuanceViewOpen(false)
      setIssuanceQueue([])
      setFilterFetching(false)
      setRemoteServerFiltered(false)
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
    setRemoteServerFiltered(false)

    if (mode === 'program') {
      setRowsState(
        resolvePaymentOrderProgramDetailLineRows(
          paymentOrdersRemote,
          args.programRow,
          detailContextQuery?.data
        )
      )
    } else {
      setRowsState(
        resolvePaymentOrderInstructorDetailLineRows(
          paymentOrdersRemote,
          args.instructorRow,
          detailContextQuery?.data
        )
      )
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

  useEffect(() => {
    onCountableAmountChange?.(sumCountablePaymentOrderLineAmounts(rowsState))
  }, [rowsState, onCountableAmountChange])

  const applyStatementCommit = useCallback(
    (payload: PaymentOrderCalculationStatementCommitPayload) => {
      setRowsState(prev =>
        prev.map(row => {
          if (row.id !== payload.lineId) return row
          if (payload.status === 'confirmed') {
            return {
              ...row,
              processingStatus: 'awaiting_payment',
              statementStatus: 'CONFIRMED',
              paymentStatus: 'WAITING_PAYMENT',
              lectureFeePaymentScheduledDate: payload.lectureFeePaymentScheduledDate,
              processingRejectionReason: undefined,
              canConfirmPaymentStatement: false,
              availableActions: (row.availableActions ?? []).filter(
                action => action !== 'CONFIRM_PAYMENT_STATEMENT'
              ),
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
    const nextApplied: DetailAppliedFilters = {
      keyword: draftKeyword.trim(),
      institutionName: draftInstitutionName.trim(),
      status: draftStatus,
      dateRange: draftDateRange,
    }
    setApplied(nextApplied)

    if (!paymentOrdersRemote || !contextAggregateKey) {
      setRemoteServerFiltered(false)
      return
    }

    const dateRange =
      nextApplied.dateRange?.[0] && nextApplied.dateRange[1]
        ? {
            from: nextApplied.dateRange[0].format('YYYY-MM-DD'),
            to: nextApplied.dateRange[1].format('YYYY-MM-DD'),
          }
        : null

    setFilterFetching(true)
    void getPaymentOrdersDetailContextRemote({
      type: mode,
      aggregateKey: contextAggregateKey,
      dateRange,
      search: nextApplied.keyword || null,
      statementStatus: mapLineStatusToStatementStatus(nextApplied.status),
      payeeType: listPagePayeeType,
    })
      .then(data => {
        if (mode === 'program') {
          setRowsState(resolvePaymentOrderProgramDetailLineRows(true, args.programRow, data))
        } else {
          setRowsState(resolvePaymentOrderInstructorDetailLineRows(true, args.instructorRow, data))
        }
        setRemoteServerFiltered(true)
        setSelectedRowKeys([])
      })
      .catch(error => {
        showAlert({
          title: networkAwareAlertTitle(error, '안내'),
          content: getSettlementApiErrorMessage(error,
            '지급 현황 상세 목록을 불러오지 못했습니다.'
          ),
        })
      })
      .finally(() => {
        setFilterFetching(false)
      })
  }, [
    draftDateRange,
    draftInstitutionName,
    draftKeyword,
    draftStatus,
    paymentOrdersRemote,
    contextAggregateKey,
    listPagePayeeType,
    mode,
    args,
    showAlert,
  ])

  const handleBatchConfirm = useCallback(
    (scheduledDate: Dayjs) => {
      const iso = scheduledDate.format('YYYY-MM-DD')

      if (paymentOrdersRemote) {
        const selected = rowsState.filter(r => selectedRowKeys.includes(r.id))
        if (selected.length === 0 || selected.some(row => !canBatchConfirmDetailLine(row))) {
          showAlert({
            title: '안내',
            content: '확인할 수 없는 지급조서가 포함되어 있습니다. 목록을 새로고침해 주세요.',
          })
          return
        }
        const receiptLines = selected.filter(row => isIndividualSettlementApplicationListItem(row))
        const instructorApplicationLines = selected.filter(
          row =>
            isSettlementApplicationListItem(row) && !isIndividualSettlementApplicationListItem(row)
        )
        const statementIds = selected
          .filter(
            row =>
              !isSettlementApplicationListItem(row) && !isIndividualSettlementApplicationListItem(row)
          )
          .map(row => row.statementId)
          .filter((id): id is number => id != null)

        if (
          statementIds.length === 0 &&
          receiptLines.length === 0 &&
          instructorApplicationLines.length === 0
        ) {
          showAlert({
            title: '안내',
            content: '지급조서 확인 API에 필요한 statementId가 없습니다.',
          })
          return
        }

        void (async () => {
          try {
            // 강사 지급조서·확정 전 강사 신청서·영수증(참여자·봉사자)을 일괄 확인 API 한 번으로 처리한다
            // — 한 트랜잭션, 전체 성공 또는 전체 롤백. 건별 호출로 나누지 않는다(부분 승인 방지).
            await confirmMutation.mutateAsync({
              statementIds,
              lectureFeePaymentScheduledDate: iso,
              individualSettlementApplications: receiptLines.map(line => ({
                settlementApplicationId: line.individualSettlementApplicationId!,
                expectedRevisionNo: line.revisionNo!,
              })),
              instructorSettlementApplications: instructorApplicationLines.map(line => ({
                settlementApplicationId: line.settlementApplicationId!,
              })),
            })
            setBatchConfirmOpen(false)
            setSelectedRowKeys([])
            setBatchConfirmDoneOpen(true)
            await detailContextQuery?.refetch()
          } catch (error) {
            const consentBlock = isPaymentStatementConfirmConsentBlockError(error)
            showAlert({
              title: networkAwareAlertTitle(
                error,
                consentBlock ? '지급조서 확인 불가 안내' : '안내'
              ),
              content: getSettlementApiErrorMessage(error, '지급조서 일괄 확인에 실패했습니다.'),
            })
            // 사전 동의 미완료·동의서 계좌 없음·영수증 revision 불일치(STALE_REVISION)도 상태 충돌처럼 목록을 다시 받아
            // 확인 불가 행을 반영한다(일괄 확인은 전체 롤백됨).
            // 확정 전 강사 신청서가 섞인 요청의 409(이미 처리된 신청서·계좌/지급 동의서 없음 등)도 전체 롤백이므로 목록을 다시 받는다.
            if (
              isPaymentStatementStatusConflictError(error) ||
              consentBlock ||
              (receiptLines.length > 0 && isIndividualSettlementReviewConflict(error)) ||
              (instructorApplicationLines.length > 0 && getApiErrorHttpStatus(error) === 409)
            ) {
              setBatchConfirmOpen(false)
              setSelectedRowKeys([])
              await detailContextQuery?.refetch()
            }
          }
        })()
        return
      }

      setRowsState(prev =>
        prev.map(row =>
          selectedRowKeys.includes(row.id)
            ? {
                ...row,
                processingStatus: 'awaiting_payment' as const,
                statementStatus: 'CONFIRMED',
                paymentStatus: 'WAITING_PAYMENT',
                lectureFeePaymentScheduledDate: iso,
                canConfirmPaymentStatement: false,
              }
            : row
        )
      )
      setBatchConfirmOpen(false)
      setSelectedRowKeys([])
      setBatchConfirmDoneOpen(true)
    },
    [
      selectedRowKeys,
      paymentOrdersRemote,
      rowsState,
      confirmMutation,
      detailContextQuery,
      showAlert,
    ]
  )

  const selectedConfirmableRows = useMemo(() => {
    const selected = rowsState.filter(r => selectedRowKeys.includes(r.id))
    return selected
  }, [rowsState, selectedRowKeys])

  /** 일괄 확인 안내 — 「[첫 신청자] 님 외 N명」(신청자 기준 상세는 본인 1명) */
  /**
   * 일괄 확인 안내 문구 유형 — 선택이 모두 영수증(참여자·봉사자)이면 영수증·실비 문구(기획 2026-11-12 3차 2번).
   * 강사와 영수증이 섞인 선택은 정해진 문구가 없어 기존 강사 문구를 둔다.
   */
  const batchConfirmApplicationKind = useMemo((): PaymentApplicationKind => {
    if (selectedConfirmableRows.length === 0) return 'instructor'
    return selectedConfirmableRows.every(row => isIndividualSettlementApplicationListItem(row))
      ? 'receipt'
      : 'instructor'
  }, [selectedConfirmableRows])

  const batchConfirmApplicantSummary = useMemo(() => {
    const names =
      mode === 'program'
        ? selectedConfirmableRows.map(row =>
            'instructorName' in row ? row.instructorName.trim() : ''
          )
        : selectedConfirmableRows.map(() => args.instructorRow.instructorName.trim())
    const distinct = [...new Set(names.filter(name => name !== ''))]
    return {
      leadApplicantName: distinct[0] ?? '',
      otherApplicantCount: Math.max(distinct.length - 1, 0),
    }
  }, [args, mode, selectedConfirmableRows])

  const canBatchConfirm = useMemo(() => {
    if (selectedConfirmableRows.length === 0) return false
    return selectedConfirmableRows.every(row => canBatchConfirmDetailLine(row))
  }, [selectedConfirmableRows])

  /**
   * 일괄 확인 — 버튼은 항상 활성. 선택 없음·확인 불가 항목 포함 시 안내 모달.
   * (체크박스도 전부 선택 가능 — 확인 완료 건은 지급조서 발급 대상)
   */
  /** 선택 행의 프로그램 id. 프로그램별 상세는 행에 없으면 상세 대상 프로그램으로 본다. */
  const fallbackProgramId = mode === 'program' ? args.programRow.programId : undefined
  const lineProgramIds = useCallback(
    (lines: readonly PaymentOrderDetailLineRow[]) =>
      lines.map(line => line.programId ?? fallbackProgramId),
    [fallbackProgramId]
  )

  const handleBatchConfirmClick = useCallback(() => {
    if (selectedConfirmableRows.length === 0) {
      showAlert(NO_SELECTION_ALERT)
      return
    }
    if (!canBatchConfirm) {
      showAlert({
        title: '지급조서 확인 불가 안내',
        content: (
          <>
            <strong>선택한 {selectedConfirmableRows.length}개의 항목</strong> 중 확인이 불가한
            항목이 있습니다.
            <br />
            지급조서는 확인 대기 중 또는 재신청 상태의 건만 확인 가능합니다.
            <br />
            처리 현황을 확인 후 다시 시도하여 주세요.
          </>
        ),
      })
      return
    }
    void (async () => {
      // 권한 설정 V1.2: 지급조서 확인은 역할 연동(Program Owner·Program Assistant). 선택한 건의 프로그램 역할을 먼저 본다.
      if (!(await ensureProgramWriteAllowed(lineProgramIds(selectedConfirmableRows)))) return
      setBatchConfirmOpen(true)
    })()
  }, [canBatchConfirm, lineProgramIds, selectedConfirmableRows, showAlert])

  const filteredRows = useMemo(
    () => filterDetailRows(rowsState, mode, applied, remoteServerFiltered && paymentOrdersRemote),
    [rowsState, mode, applied, remoteServerFiltered, paymentOrdersRemote]
  )

  const programDetail = useMemo((): PaymentOrderAdminProgramDetail | null => {
    if (mode !== 'program') return null
    return resolvePaymentOrderProgramDetailForLines(
      paymentOrdersRemote,
      args.programRow,
      detailContextQuery?.data
    )
  }, [mode, paymentOrdersRemote, detailContextQuery?.data, args])

  const instructorDetail = useMemo((): PaymentOrderAdminInstructorDetail | null => {
    if (mode !== 'instructor') return null
    return resolvePaymentOrderInstructorDetailForLines(
      paymentOrdersRemote,
      args.instructorRow,
      detailContextQuery?.data
    )
  }, [mode, paymentOrdersRemote, detailContextQuery?.data, args])

  const buildIssuancePayloadForLine = useCallback(
    async (lineRow: PaymentOrderDetailLineRow): Promise<PaymentStatementIssuancePayload> => {
      // 영수증(참여자·봉사자) 행 — 영수증 신청 지급조서 문서로 발급한다(확인 완료·계좌 지급 완료 건, CMS-FUNC-0492).
      // 검토 모달의 단건 발급과 같은 문서·미리보기·다운로드 경로다.
      if (isIndividualSettlementApplicationListItem(lineRow)) {
        const settlementApplicationId = lineRow.individualSettlementApplicationId
        if (!paymentOrdersRemote || settlementApplicationId == null) {
          // 강사 행과 같다 — mock 지급조서를 만들지 않고 호출부의 기존 실패 안내로 보낸다.
          throw new Error()
        }
        const document = await fetchIndividualSettlementApplicationDocumentRemote(
          settlementApplicationId,
          lineRow.revisionNo
        )
        return {
          paragraphBodyOptions: buildReceiptSettlementPreviewOptions({
            document,
            settlementApplicationId,
          }),
          fileName: buildReceiptSettlementDocumentFileName(document),
          receiptSettlementApplication: {
            settlementApplicationId,
            revisionNo: lineRow.revisionNo,
          },
        }
      }
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
          return { ...payload, settlementId: programLineRow.settlementId }
        }
        // 지급조서는 개인정보가 담긴 법정 문서다. 실서버 연동(관리자 JWT)이 없으면 mock 데이터로 만들지 않고
        // 호출부의 기존 실패 안내(지급조서 발급 미리보기를 불러오지 못했습니다.)로 보낸다.
        throw new Error()
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
        return { ...payload, settlementId: instructorLineRow.settlementId }
      }
      // 프로그램 기준과 같다 — mock 지급조서를 만들지 않는다.
      throw new Error()
    },
    [mode, programDetail, instructorDetail, paymentOrdersRemote]
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
    if (selectedRowKeys.length === 0) {
      showAlert(NO_SELECTION_ALERT)
      return
    }
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
      // 권한 설정 V1.2: 지급조서 발급·다운로드는 역할 연동(Program Owner·Program Assistant).
      if (!(await ensureProgramWriteAllowed(lineProgramIds(selected)))) return
      try {
        const payloads = await Promise.all(selected.map(line => buildIssuancePayloadForLine(line)))
        setIssuanceQueue(payloads)
        setIssuanceViewOpen(true)
      } catch (error) {
        showAlert({
          title: networkAwareAlertTitle(error, '안내'),
          content: getSettlementApiErrorMessage(error,
            '지급조서 발급 미리보기를 불러오지 못했습니다.'
          ),
        })
      }
    })()
  }, [buildIssuancePayloadForLine, lineProgramIds, rowsState, selectedRowKeys, showAlert])

  const keywordFieldKey = mode === 'program' ? 'instructorName' : 'programName'

  const filterFields = useMemo(() => {
    const keywordField =
      mode === 'program'
        ? {
            key: 'instructorName' as const,
            type: 'search' as const,
            label: '신청자명',
            placeholder: '신청자명을 입력해 주세요',
            width: FILTER_CONTROL_MAX_WIDTH_PX,
          }
        : {
            key: 'programName' as const,
            type: 'search' as const,
            label: '프로그램명',
            placeholder: '프로그램명을 입력해 주세요',
            width: FILTER_CONTROL_MAX_WIDTH_PX,
          }

    return [
      keywordField,
      {
        key: 'institutionName' as const,
        type: 'search' as const,
        label: '참여 기관명',
        placeholder: '기관명을 입력해 주세요',
        width: FILTER_CONTROL_MAX_WIDTH_PX,
      },
      {
        key: 'status' as const,
        type: 'select' as const,
        label: '지급조서 처리 현황',
        placeholder: '전체',
        // 시안: 기본값은 「전체」 옵션이 선택된 값으로 노출(placeholder 회색 아님)
        options: lineStatusSelectOptions,
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
      status: draftStatus,
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

  const filteredRowCount = filteredRows.length

  const columns: ColumnsType<PaymentOrderDetailLineRow> = useMemo(() => {
    /**
     * 시안 열 폭 (선택 60 · No. 80 별도)
     * - 프로그램별 상세(12432:439120): 신청자명 180 · 기관 220 · 교육 진행 일자 유연(346) · 나머지 220
     * - 신청자별 상세(15524:543381): 프로그램명 유연(436) · 기관 180 · 교육 진행 일자 250 · 나머지 180
     * `undefined` 열은 width 없이 minWidth만 두어 남는 폭을 흡수한다.
     */
    const w: Record<
      'no' | 'title' | 'institution' | 'lecture' | 'processing' | 'amount' | 'breakdown',
      number | undefined
    > =
      mode === 'instructor'
        ? {
            no: 80,
            title: undefined,
            institution: 180,
            lecture: 250,
            processing: 180,
            amount: 180,
            breakdown: 180,
          }
        : {
            no: 80,
            title: 180,
            institution: 220,
            lecture: undefined,
            processing: 220,
            amount: 220,
            breakdown: 220,
          }
    const FLEX_COLUMN_MIN_WIDTH = 220
    const widthOf = (value: number | undefined) =>
      value == null ? { minWidth: FLEX_COLUMN_MIN_WIDTH } : { width: value }

    const nameColumn: ColumnsType<PaymentOrderDetailLineRow>[0] =
      mode === 'program'
        ? {
            title: '신청자명',
            dataIndex: 'instructorName',
            key: 'instructorName',
            ellipsis: { showTitle: true },
            ...widthOf(w.title),
            align: 'center',
          }
        : {
            title: '프로그램명',
            dataIndex: 'programName',
            key: 'programName',
            ellipsis: { showTitle: true },
            ...widthOf(w.title),
            align: 'center',
          }

    return [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: w.no,
        align: 'center',
        // 시안: 번호는 총 건수부터 역순(10 → 1)
        render: (_: number, __: PaymentOrderDetailLineRow, index: number) =>
          filteredRowCount - index,
      },
      nameColumn,
      {
        title: '참여 기관명',
        dataIndex: 'institutionName',
        key: 'institutionName',
        ellipsis: { showTitle: true },
        ...widthOf(w.institution),
        align: 'center',
      },
      {
        title: '교육 진행 일자',
        key: 'lecture',
        ...widthOf(w.lecture),
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
        ...widthOf(w.processing),
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
        ...widthOf(w.amount),
        align: 'center',
        render: (amount: number, row: PaymentOrderDetailLineRow) => (
          <span
            className={
              row.processingStatus === 'application_rejected'
                ? 'payment-order-detail-filter-table__amount--rejected'
                : undefined
            }
          >
            {formatWon(amount)}
          </span>
        ),
      },
      {
        title: '산출 내역',
        key: 'breakdown',
        ...widthOf(w.breakdown),
        align: 'center',
        render: (_: unknown, row: PaymentOrderDetailLineRow) => (
          <CalculationDetailViewButton
            onClick={e => {
              e.stopPropagation()
              if (mode === 'program') {
                onOpenCalculationStatement(row as PaymentOrderAdminProgramDetailInstructorRow)
              } else {
                onOpenCalculationStatement(row as PaymentOrderAdminInstructorDetailProgramRow)
              }
            }}
          />
        ),
      },
    ]
  }, [mode, onOpenCalculationStatement, filteredRowCount])

  const sectionTitle = mode === 'program' ? '신청자별 정산 목록' : '프로그램별 정산 목록'

  const filterClassName = 'payment-order-detail-filter-table__filters'

  const excelExport = useMemo((): FilterTableExcelExportConfig<PaymentOrderDetailLineExcelRow> => {
    const nameTitle = mode === 'program' ? '신청자명' : '프로그램명'
    const data: PaymentOrderDetailLineExcelRow[] = filteredRows.map(row => {
      const dateLabel = formatKoreanDateWithWeekday(row.lectureDate)
      // 회차(session_no)가 없으면(사전교육 등) 날짜만 — 0회차를 만들지 않는다.
      const roundLabel = formatLectureSessionLabel(row.sessionOrdinal)
      return {
        id: row.id,
        no: row.no,
        name:
          mode === 'program'
            ? (row as PaymentOrderAdminProgramDetailInstructorRow).instructorName
            : (row as PaymentOrderAdminInstructorDetailProgramRow).programName,
        institutionName: row.institutionName,
        lectureDateSession: roundLabel !== '-' ? `${dateLabel} | ${roundLabel}` : dateLabel,
        processingStatusLabel: PAYMENT_ORDER_LINE_STATUS_LABELS_FULL[row.processingStatus],
        estimatedAmountLabel: formatWon(row.estimatedAmount),
      }
    })

    const columns: ColumnsType<PaymentOrderDetailLineExcelRow> = [
      { title: 'No.', dataIndex: 'no', key: 'no' },
      { title: nameTitle, dataIndex: 'name', key: 'name' },
      { title: '참여 기관명', dataIndex: 'institutionName', key: 'institutionName' },
      { title: '교육 진행 일자', dataIndex: 'lectureDateSession', key: 'lectureDateSession' },
      {
        title: '지급조서 처리 현황',
        dataIndex: 'processingStatusLabel',
        key: 'processingStatusLabel',
      },
      { title: '정산 신청 금액', dataIndex: 'estimatedAmountLabel', key: 'estimatedAmountLabel' },
    ]

    return {
      columns,
      data,
      selectedRowKeys,
      // program 모드는 신청자(강사)명, instructor 모드는 프로그램명 컬럼
      accessLog: {
        downloadKind: 'PAYMENT_ORDER_DETAIL_EXPORT',
        containedPiiTypes: mode === 'program' ? ['NAME'] : [],
      },
    }
  }, [filteredRows, mode, selectedRowKeys])

  return {
    filteredRows,
    batchConfirmOpen,
    setBatchConfirmOpen,
    batchConfirmDoneOpen,
    setBatchConfirmDoneOpen,
    batchConfirmApplicantSummary,
    batchConfirmApplicationKind,
    paymentStatementIssueBlocked,
    setPaymentStatementIssueBlocked,
    handleBatchConfirm,
    canBatchConfirm,
    handleBatchConfirmClick,
    handlePaymentStatementIssue,
    closeIssuanceView,
    issuanceViewOpen,
    currentIssuancePayload,
    downloadCurrentReceiptIssuancePdf,
    selectedRowKeys,
    setSelectedRowKeys,
    filterFields,
    filterFilters,
    onFilterCardChange,
    handleSearch,
    filterFetching,
    columns,
    sectionTitle,
    filterClassName,
    excelExport,
  }
}
