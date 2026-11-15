/**
 * 참여 강사 상세 > 정산 현황 > [지급조서 보기] — 산출 내역서(프로그램형) 모달
 * 지급 현황 상세와 같은 `PaymentOrderCalculationStatementModalImpl`을 쓴다.
 *
 * - 확정 정산 행(settlementId): GET 정산 상세 정본 → 산출 내역서. 확인 처리는 지급조서(statementId) 확인.
 * - 확정 전 신청서 행(settlementApplicationId만): GET 신청서 지급조서(application-document) 정본.
 *   산출 행·강사비 책정·지급조서 보기는 제출 스냅샷만 쓰고, 프로그램 맥락만 목록 행 값을 쓴다.
 *   다른 API로 빈 값을 보완하거나 403/404 시 다른 정산 API로 재시도하지 않는다.
 *   확인 처리·신청 반려는 신청서 액션(onApplicationAction)으로 넘긴다.
 */
import { useCallback, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type { ParticipatingInstructorSettlementApiRow } from '@/features/program/general/lib/map-settlement-to-participating-instructor-settlement-row'

/** 산출 내역서를 여는 데 필요한 정산 행 필드 — 강사·봉사자 정산 탭 공통 */
export type ParticipatingSettlementStatementRow = Pick<
  ParticipatingInstructorSettlementApiRow,
  | 'id'
  | 'settlementId'
  | 'settlementApplicationId'
  | 'hasPaymentStatementApplication'
  | 'institutionName'
  | 'scheduledSettlementAmount'
>
import type {
  SettlementFrontendResponse,
  SettlementListItemResponse,
} from '@/shared/api/generated/settlement/schemas'
import {
  fetchSettlementApplicationDocumentRemote,
  fetchSettlementDetailRemote,
} from '@/features/settlement-management/api/settlement-api-client'
import {
  applyApplicationDocumentToProgramCalculationStatement,
  buildPaymentStatementPreviewOptionsFromApplicationDocument,
  getSettlementApplicationDocumentErrorMessage,
} from '@/features/program/general/lib/map-settlement-application-document-to-payment-statement-preview-options'
import { mapSettlementListItemToProgramDetailLineRow } from '@/features/settlement-management/api/payment-orders/map-settlement-detail'
import { mapSettlementDetailToProgramCalculationStatement } from '@/features/settlement-management/api/payment-orders/map-settlement-detail-to-calculation-statement'
import { PaymentOrderCalculationStatementModalImpl } from '@/features/settlement/ui/payment-record/payment-order-calculation-statement-modal-impl'
import { participatingInstructorSettlementsQueryOptions } from '@/features/program/general/api/participating-instructor-settlements-remote'
import { INDIVIDUAL_SETTLEMENT_REVIEW_STATEMENT_MODAL_Z_INDEX } from '@/features/program/general/lib/general-program-modal-z-index'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { confirmSettlementApplicationRemote } from '@/features/program/general/api/settlement-application-actions-remote'
import { useConfirmPaymentStatementMutation } from '@/features/settlement-management/hooks/use-confirm-payment-statement-mutation'
import { getSettlementApiErrorMessage } from '@/features/settlement-management/api/get-settlement-api-error'
import {
  isPaymentStatementApplicationMissing,
  PAYMENT_STATEMENT_VIEW_UNAVAILABLE_ALERT,
} from '@/features/settlement/lib/payment-statement-view-unavailable-alert'
import { networkAwareAlertTitle } from '@/shared/lib/extract-api-error-message'

/** 산출 내역서 — 일반 프로그램 상세 풀페이지(1100) 위 */
export const PARTICIPATING_INSTRUCTOR_CALCULATION_STATEMENT_Z_INDEX =
  INDIVIDUAL_SETTLEMENT_REVIEW_STATEMENT_MODAL_Z_INDEX

/** 산출 내역서 위에서 여는 신청서 승인·반려 모달 */
export const PARTICIPATING_INSTRUCTOR_CALCULATION_STATEMENT_NESTED_Z_INDEX =
  PARTICIPATING_INSTRUCTOR_CALCULATION_STATEMENT_Z_INDEX + 100

export type ParticipatingInstructorApplicationActionKind = 'confirm' | 'reject'

/** 확정 전 신청서 — 정산 상세가 없어 같은 목록 행 값만 옮긴다 (빈 칸은 산출 내역서 기본 표시) */
function pendingApplicationDetailFromListItem(
  item: SettlementListItemResponse
): SettlementFrontendResponse {
  return {
    programNameKo: item.programNameKo,
    businessPeriodStart: item.businessPeriodStart,
    businessPeriodEnd: item.businessPeriodEnd,
    sessionCompleted: item.sessionCompleted,
    sessionTotal: item.sessionTotal,
    programSessionProgressDisplay: item.programSessionProgressDisplay,
    sessionOrdinal: item.sessionOrdinal,
    institutionName: item.institutionName,
    instructorName: item.instructorName,
    expectedTransferDate: item.expectedTransferDate,
    totalAmount: item.netPaymentAmount,
    statementStatus: item.statementStatus,
    paymentStatus: item.paymentStatus,
  }
}

function findListItem(
  row: ParticipatingSettlementStatementRow,
  items: SettlementListItemResponse[]
): SettlementListItemResponse {
  const matched =
    row.settlementId != null
      ? items.find(item => item.settlementId === row.settlementId)
      : items.find(
          item =>
            item.settlementId == null && item.settlementApplicationId === row.settlementApplicationId
        )
  return (
    matched ?? {
      settlementId: row.settlementId ?? undefined,
      settlementApplicationId: row.settlementApplicationId,
      institutionName: row.institutionName,
      netPaymentAmount: row.scheduledSettlementAmount ?? undefined,
      grossAmount: row.scheduledSettlementAmount ?? undefined,
    }
  )
}

export function useParticipatingInstructorPaymentStatementView(input: {
  instructor: ParticipatingInstructorRow
  settlementItems: SettlementListItemResponse[]
  programId: string
  /** 산출 내역서 기본 정보 「프로그램명」— 목록 행 programNameKo가 없을 때 */
  programName?: string
  /** 산출 내역 「참여 기관명」 칸에 넣을 표시값 */
  institutionNameOverride?: string
  /** 기관 프로그램이 아니면(개인형) 산출 내역 「참여 기관명」열 미노출 */
  hideInstitutionColumn?: boolean
  /** 확정 전 신청서 행의 신청 반려 → 상위 사유 모달 (확인 처리는 이 훅이 지급조서 확인까지 처리) */
  onApplicationAction?: (
    kind: ParticipatingInstructorApplicationActionKind,
    settlementApplicationId: number
  ) => void
  applicationActionPending?: boolean
}) {
  const { showAlert } = useCmsAlert()
  const queryClient = useQueryClient()
  const [activeRow, setActiveRow] = useState<ParticipatingSettlementStatementRow | null>(null)
  const open = activeRow != null

  const isPendingApplication =
    activeRow != null &&
    activeRow.settlementId == null &&
    activeRow.settlementApplicationId != null

  const listItem = useMemo(
    () => (activeRow ? findListItem(activeRow, input.settlementItems) : null),
    [activeRow, input.settlementItems]
  )

  const detailQuery = useQuery({
    queryKey: ['participating-instructor-settlement-detail', activeRow?.settlementId],
    enabled: open && activeRow?.settlementId != null,
    queryFn: () => fetchSettlementDetailRemote(activeRow!.settlementId!),
    retry: false,
  })

  /**
   * 신청서 지급조서 문서 — 확정 전 신청서는 산출 내역서·지급조서 정본,
   * 확정 정산 행도 연결된 신청서(settlementApplicationId)가 있으면 [지급조서 발급] 화면을 제출 스냅샷으로 그린다.
   */
  const pendingDocumentApplicationId = activeRow?.settlementApplicationId ?? null
  const documentQuery = useQuery({
    queryKey: ['settlement-application-document', pendingDocumentApplicationId],
    enabled: open && pendingDocumentApplicationId != null,
    queryFn: () => fetchSettlementApplicationDocumentRemote(pendingDocumentApplicationId!),
    retry: false,
  })

  const documentLoadError = useMemo(
    () =>
      documentQuery.isError
        ? new Error(getSettlementApplicationDocumentErrorMessage(documentQuery.error))
        : undefined,
    [documentQuery.error, documentQuery.isError]
  )

  const issuanceOptionsFromDocument = useMemo(() => {
    if (pendingDocumentApplicationId == null || !documentQuery.data) return undefined
    return buildPaymentStatementPreviewOptionsFromApplicationDocument({
      document: documentQuery.data,
      settlementApplicationId: pendingDocumentApplicationId,
      hideInstitutionColumn: input.hideInstitutionColumn,
    })
  }, [documentQuery.data, input.hideInstitutionColumn, pendingDocumentApplicationId])

  const statement = useMemo(() => {
    if (!activeRow || !listItem) return null
    if (isPendingApplication && !documentQuery.data) return null
    const detail = isPendingApplication
      ? pendingApplicationDetailFromListItem(listItem)
      : detailQuery.data
    if (!detail) return null
    const lineRow = mapSettlementListItemToProgramDetailLineRow({
      ...listItem,
      institutionName: input.institutionNameOverride?.trim() || listItem.institutionName,
    })
    if (isPendingApplication) {
      lineRow.id = `application:${activeRow.settlementApplicationId}`
    }
    const programName =
      listItem.programNameKo?.trim() ||
      detail.programNameKo?.trim() ||
      input.programName?.trim() ||
      '-'
    const base = mapSettlementDetailToProgramCalculationStatement(
      lineRow,
      detail,
      programName,
      detail.instructorName?.trim() || input.instructor.instructorName
    )
    if (isPendingApplication && documentQuery.data && activeRow.settlementApplicationId != null) {
      return applyApplicationDocumentToProgramCalculationStatement(
        base,
        documentQuery.data,
        activeRow.settlementApplicationId
      )
    }
    return base
  }, [
    activeRow,
    detailQuery.data,
    documentQuery.data,
    input.institutionNameOverride,
    input.instructor.instructorName,
    input.programName,
    isPendingApplication,
    listItem,
  ])

  const handleOpen = useCallback(
    (row: ParticipatingSettlementStatementRow) => {
      const pending = row.settlementId == null && row.settlementApplicationId != null
      if (
        !pending &&
        (row.settlementId == null ||
          isPaymentStatementApplicationMissing(row.hasPaymentStatementApplication))
      ) {
        showAlert(PAYMENT_STATEMENT_VIEW_UNAVAILABLE_ALERT)
        return
      }
      setActiveRow(row)
    },
    [showAlert]
  )

  const handleClose = useCallback(() => {
    setActiveRow(null)
  }, [])

  const refreshSettlements = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: participatingInstructorSettlementsQueryOptions({
        programId: input.programId,
        instructorMemberId: input.instructor.memberId?.trim() ?? '',
      }).queryKey,
    })
  }, [input.instructor.memberId, input.programId, queryClient])

  const pendingApplicationId = isPendingApplication ? activeRow.settlementApplicationId : null
  const onApplicationAction = input.onApplicationAction
  const confirmStatementMutation = useConfirmPaymentStatementMutation()
  const [confirmingApplication, setConfirmingApplication] = useState(false)

  /**
   * 확정 전 신청서 [확인 처리] — 「지급조서 확인 안내」(계좌 지급 예정일) 한 번으로
   * 신청서 승인(→ settlement·payment_statement WAITING_CONFIRM 생성) + 지급조서 확인(CONFIRMED)까지 처리한다.
   */
  const confirmPendingApplication = useCallback(
    async (applicationId: number, lectureFeePaymentScheduledDateIso: string) => {
      setConfirmingApplication(true)
      try {
        const approved = await confirmSettlementApplicationRemote(applicationId)
        const statementId = approved?.paymentStatementId
        if (statementId == null) {
          throw new Error('정산 신청서는 승인됐지만 지급조서 ID를 받지 못해 확인 처리를 마치지 못했습니다.')
        }
        await confirmStatementMutation.mutateAsync({
          statementIds: [statementId],
          lectureFeePaymentScheduledDate: lectureFeePaymentScheduledDateIso,
        })
        // 승인으로 생긴 정산 행으로 전환 — 목록 재조회 후 「확인 완료」 상태로 다시 그리고 확인 완료 모달을 띄운다.
        const settlementId = approved?.settlementId
        if (settlementId != null) {
          setActiveRow(prev =>
            prev ? { ...prev, id: String(settlementId), settlementId } : prev
          )
        }
        await refreshSettlements()
      } catch (error) {
        await refreshSettlements()
        showAlert({
          title: networkAwareAlertTitle(error, '안내'),
          content: getSettlementApiErrorMessage(error, '지급조서 확인 처리에 실패했습니다.'),
        })
        throw error
      } finally {
        setConfirmingApplication(false)
      }
    },
    [confirmStatementMutation, refreshSettlements, showAlert]
  )

  const statementActionOverride = useMemo(() => {
    if (pendingApplicationId == null) return undefined
    return {
      onConfirm: (dateIso: string) => confirmPendingApplication(pendingApplicationId, dateIso),
      onRejectClick: () => onApplicationAction?.('reject', pendingApplicationId),
      pending: input.applicationActionPending || confirmingApplication,
    }
  }, [
    confirmPendingApplication,
    confirmingApplication,
    input.applicationActionPending,
    onApplicationAction,
    pendingApplicationId,
  ])

  const modal = (
    <PaymentOrderCalculationStatementModalImpl
      open={open}
      onCancel={handleClose}
      data={statement}
      loading={open && (isPendingApplication ? documentQuery.isPending : detailQuery.isPending)}
      loadError={
        isPendingApplication
          ? documentLoadError
          : detailQuery.isError
            ? detailQuery.error
            : undefined
      }
      issuanceParagraphBodyOptionsOverride={issuanceOptionsFromDocument}
      paymentOrdersRemote
      statementId={listItem?.statementId ?? null}
      settlementId={activeRow?.settlementId ?? null}
      availableActions={listItem?.availableActions ?? null}
      entryKind="program"
      entryClassName="payment-order-calc-statement-modal--entry-program"
      zIndex={PARTICIPATING_INSTRUCTOR_CALCULATION_STATEMENT_Z_INDEX}
      statementActionOverride={statementActionOverride}
      hideInstitutionColumn={input.hideInstitutionColumn}
      onStatementLineCommitted={() => {
        void refreshSettlements()
      }}
      onAfterRejectResultClosed={handleClose}
    />
  )

  return {
    open,
    activeRow,
    detailLoading: detailQuery.isPending,
    handleOpen,
    handleClose,
    modal,
  }
}
