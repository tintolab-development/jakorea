/**
 * 정산 관리 > 계좌 지급 확인 — 행 클릭 시 [계좌 지급 현황 상세] 풀페이지 모달
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchGeneralProgramCoreRemoteById } from '@/features/program/general/api/admin-general-programs-service'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { isIndividualProgramForSettlement } from '@/features/settlement/lib/settlement-program-individual'
import { ACCOUNT_PAYMENT_DETAIL_FORBIDDEN_ALERT_MESSAGE } from '@/shared/constants/messages'
import { getSettlementApiErrorMessage } from '@/features/settlement-management/api/get-settlement-api-error'
import { getApiErrorHttpStatus } from '@/shared/lib/extract-api-error-message'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canAccessAccountPayments } from '@/shared/lib/account-payments-access'
import { useLocation, useSearchParams } from 'react-router-dom'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import { DetailFullpageBreadcrumb } from '@/shared/ui/detail-fullpage-breadcrumb'
import { buildSearchParams, makeBreadcrumbItem } from '@/shared/lib/detail-fullpage-query-stack'
import {
  DetailModalSidebar,
  type DetailModalSidebarNavItem,
} from '@/shared/ui/detail-modal-sidebar'
import { CmsButton } from '@/shared/ui'
import '@/features/program/general/ui/detail-modal/program-status/program-status-participating-shared.css'
import type { AccountPaymentRow } from '@/features/settlement-management/model/account-payments-list'
import { useAccountPaymentDetailQuery } from '@/features/settlement-management/hooks/use-account-payment-detail-query'
import { shouldUseSettlementRemote } from '@/features/settlement-management/hooks/use-settlement-remote-enabled'
import { isAwaitingFirstQueryData } from '@/shared/lib/is-awaiting-first-query-data'
import {
  buildPaymentStatementIssuanceFileNameFromCalculation,
  buildPaymentStatementIssuanceViewOptionsFromCalculation,
  mapAccountPaymentStatusDetailToIssuanceInput,
} from '@/features/settlement/lib/payment-order-calculation-statement-issuance-view'
import { PaymentStatementIssuanceViewModal } from '@/features/program/shared/ui/payment-statement-issuance-view-modal'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-instructor-basic-info.css'
import './payment-order-admin-status-tag.css'
import '@/features/settlement/ui/payment-record/payment-order-program-calculation-statement-modal.css'
import { PaymentOrderStatusDetailLnbIcon } from './payment-order-status-detail-lnb-icon'
import { PaymentOrderCalculationBreakdownTable } from '@/features/settlement/ui/payment-record/payment-order-calculation-breakdown-table'
import {
  PaymentOrderCalculationBasisDetailModal,
  usePaymentOrderCalculationBasisDetailModal,
} from '@/features/settlement/ui/payment-record/payment-order-calculation-basis-detail-modal'
import { computePaymentOrderCalculationSubtotalBeforeWithholding } from '@/features/settlement/ui/payment-record/payment-order-calculation-basis-detail'
import {
  AccountPaymentConfirmationModal,
  buildAccountPaymentSingleConfirmationPayload,
} from '@/features/settlement/ui/account-payment-confirmation-modal'
import { AccountPaymentStatusDetailBasicInfo } from './account-payment-status-detail-basic-info'
import './account-payment-status-detail-fullpage-modal.css'

export interface AccountPaymentStatusDetailFullPageModalProps {
  open: boolean
  onClose: () => void
  row: AccountPaymentRow | null
  /** 계좌 지급 완료 확인 시 목록·상세의 `accountPaymentStatus`를 갱신 */
  onAccountPaymentCompleted?: (rowId: string) => void
}

export function AccountPaymentStatusDetailFullPageModal({
  open,
  onClose,
  row,
  onAccountPaymentCompleted,
}: AccountPaymentStatusDetailFullPageModalProps) {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { user } = useAuthStore()
  const canCompleteAccountPayment = canAccessAccountPayments(user)
  const accountPaymentsRemote = shouldUseSettlementRemote('accountPayments')
  const detailQuery = useAccountPaymentDetailQuery(row, open && accountPaymentsRemote)

  const detail = accountPaymentsRemote ? (detailQuery.data ?? null) : null
  /**
   * 개인형 프로그램이면 산출 표 「참여 기관명」열 미노출 — 산출 내역서(use-payment-order-detail-fullpage-modal)와 같은 판정.
   * 정산 응답에 프로그램 유형이 없어 프로그램 정본을 읽는다. 조회 실패 시 열을 그대로 둔다.
   * 계좌 지급 확인은 Accounting Manager가 담당이 아닌 프로그램 건도 보므로 프로그램 상세가 403일 수 있다.
   * 그래서 상세 응답의 programType을 먼저 쓰고, 프로그램 상세 조회는 이전 서버용 보조 조회로만 둔다
   * (공통 '접근 권한 없음' 팝업 없이, 상세 모달과 캐시를 나눠 실패가 섞이지 않게 한다).
   */
  const detailProgramId =
    detail?.programId ?? (row?.programId != null ? String(row.programId) : '')
  // 서버가 상세 응답에 programType을 주면 그 값으로 판정한다. 주지 않는 이전 서버에서만 프로그램 상세를 조회한다.
  const detailProgramType = detail?.programType?.trim().toUpperCase()
  const detailProgramQuery = useQuery({
    queryKey: [...generalProgramQueryKeys.detail(detailProgramId), 'account-payment-type-probe'],
    queryFn: () =>
      fetchGeneralProgramCoreRemoteById(detailProgramId, { skipGlobalErrorAlert: true }),
    staleTime: 30_000,
    retry: false,
    enabled:
      open &&
      accountPaymentsRemote &&
      detail != null &&
      !detailProgramType &&
      /^\d+$/.test(detailProgramId),
  })
  const hideInstitutionColumn = detailProgramType
    ? detailProgramType === 'GENERAL_INDIVIDUAL'
    : detailProgramQuery.data
      ? isIndividualProgramForSettlement(detailProgramQuery.data)
      : false
  const detailLoading = accountPaymentsRemote && open && isAwaitingFirstQueryData(detailQuery)
  const detailError = accountPaymentsRemote
    ? detailQuery.error
    : open
      ? new Error('계좌 지급 API가 연결되지 않았습니다.')
      : null
  const detailForbidden = getApiErrorHttpStatus(detailError) === 403
  const { showAlert } = useCmsAlert()
  const [paymentCompleteConfirmOpen, setPaymentCompleteConfirmOpen] = useState(false)
  const [issuanceViewOpen, setIssuanceViewOpen] = useState(false)
  const detailRowId = row?.id ?? ''
  const [overlayRowId, setOverlayRowId] = useState(detailRowId)
  if (detailRowId !== overlayRowId) {
    setOverlayRowId(detailRowId)
    setPaymentCompleteConfirmOpen(false)
    setIssuanceViewOpen(false)
  }
  const closeDetail = useCallback(() => {
    setPaymentCompleteConfirmOpen(false)
    setIssuanceViewOpen(false)
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!open || !detailForbidden) return
    onClose()
    void showAlert({ title: '권한 없음', content: ACCOUNT_PAYMENT_DETAIL_FORBIDDEN_ALERT_MESSAGE })
  }, [open, detailForbidden, onClose, showAlert])
  const basisDetailContext = useMemo(() => {
    const subtotalBeforeWithholding = detail
      ? computePaymentOrderCalculationSubtotalBeforeWithholding(detail.blocks)
      : 0
    const amountDigits = detail?.basic.lectureFeeStandardAmount?.replace(/[^\d]/g, '')
    const lectureFeeStandardAmountWon = amountDigits ? Number(amountDigits) : undefined
    return {
      lectureFeeStandardTitle: detail?.basic.lectureFeeStandardTitle,
      withholdingDailySalaryTotalWon:
        subtotalBeforeWithholding > 0 ? subtotalBeforeWithholding : undefined,
      /** remote calculationDetail만 모달 강의 시간 SSOT — sessionOrdinal fallback 금지 */
      remoteData: true,
      lectureFeeStandardAmountWon:
        lectureFeeStandardAmountWon != null && Number.isFinite(lectureFeeStandardAmountWon)
          ? lectureFeeStandardAmountWon
          : undefined,
    }
  }, [detail])

  const { basisDetailOpen, selectedBasisDetail, handleBasisDetailClick, closeBasisDetailModal } =
    usePaymentOrderCalculationBasisDetailModal(open, basisDetailContext)

  const singlePaymentConfirmPayload = useMemo(
    () => (detail ? buildAccountPaymentSingleConfirmationPayload(detail) : null),
    [detail]
  )

  const issuanceInput = useMemo(
    () => (detail ? mapAccountPaymentStatusDetailToIssuanceInput(detail) : null),
    [detail]
  )

  const issuanceParagraphBodyOptions = useMemo(
    () =>
      issuanceInput
        ? buildPaymentStatementIssuanceViewOptionsFromCalculation(issuanceInput)
        : undefined,
    [issuanceInput]
  )

  const issuanceFileName = useMemo(
    () =>
      issuanceInput
        ? buildPaymentStatementIssuanceFileNameFromCalculation(issuanceInput)
        : undefined,
    [issuanceInput]
  )

  const sidebarItems = useMemo<DetailModalSidebarNavItem[]>(
    () => [
      {
        key: 'payment-status-detail',
        label: '지급 현황 상세',
        icon: <PaymentOrderStatusDetailLnbIcon className="detail-fullpage-modal__lnb-icon" />,
      },
    ],
    []
  )

  if (!open || !row) {
    return null
  }

  const { basic } = detail ?? { basic: null }
  const instructorDisplayName =
    basic?.nameKo?.trim() || row.instructorName?.trim() || '신청자'
  const title = `계좌 지급 확인 현황 상세 (${instructorDisplayName})`
  const headerBreadcrumbItems = [
    makeBreadcrumbItem(
      '계좌 지급 확인',
      location.pathname,
      buildSearchParams(searchParams, { delete: ['ap_detail'] })
    ),
    { label: instructorDisplayName },
  ]

  return (
    <>
      <DetailFullPageModal
        open={open}
        onClose={closeDetail}
        title={title}
        loading={detailLoading}
        error={
          !detailLoading && !detailForbidden && (detailError || !detail)
            ? getSettlementApiErrorMessage(detailError, '상세를 불러오지 못했습니다.')
            : null
        }
        headerTrailing={<DetailFullpageBreadcrumb items={headerBreadcrumbItems} />}
        className="account-payment-status-detail-fullpage-modal"
        sidebar={
          <DetailModalSidebar
            navAriaLabel="계좌 지급 현황 상세 메뉴"
            items={sidebarItems}
            activeKey="payment-status-detail"
            activeChildKey=""
            expandedGroupKeys={[]}
            onSelectTop={() => {}}
            onSelectChild={() => {}}
          />
        }
      >
        {detail && basic ? (
          <div className="account-payment-status-detail-fullpage-modal__root">
            <AccountPaymentStatusDetailBasicInfo basic={basic} />

            <div className="account-payment-status-detail-fullpage-modal__calc-host">
              <PaymentOrderCalculationBreakdownTable
                blocks={detail.blocks}
                formulaLabel={detail.formulaLabel}
                totalAmount={detail.totalAmount}
                lectureSessionSegmentLabel="round"
                hideInstitutionColumn={hideInstitutionColumn}
                columnWidthPreset="account-payment-detail"
                actionButtonSize="h32"
                onBasisDetailClick={handleBasisDetailClick}
                onDownloadPaymentStatement={() => setIssuanceViewOpen(true)}
                headerActions={
                  row.accountPaymentStatus === 'account_paid' || !canCompleteAccountPayment
                    ? undefined
                    : (
                    <CmsButton
                      variant="primary"
                      size="h40"
                      className="account-payment-status-detail-fullpage-modal__complete-btn"
                      onClick={() => setPaymentCompleteConfirmOpen(true)} >
                      지급 완료 처리
                    </CmsButton>
                  )
                }
              />
            </div>
          </div>
        ) : null}
      </DetailFullPageModal>

      <AccountPaymentConfirmationModal
        open={paymentCompleteConfirmOpen && canCompleteAccountPayment}
        onCancel={() => setPaymentCompleteConfirmOpen(false)}
        onConfirm={() => {
          onAccountPaymentCompleted?.(row.id)
          setPaymentCompleteConfirmOpen(false)
        }}
        data={paymentCompleteConfirmOpen ? singlePaymentConfirmPayload : null}
      />
      <PaymentStatementIssuanceViewModal
        open={issuanceViewOpen && Boolean(issuanceParagraphBodyOptions)}
        onClose={() => setIssuanceViewOpen(false)}
        paragraphBodyOptions={issuanceParagraphBodyOptions}
        fileName={issuanceFileName}
        settlementId={row.settlementId}
        zIndex={1500}
      />
      <PaymentOrderCalculationBasisDetailModal
        open={basisDetailOpen}
        onCancel={closeBasisDetailModal}
        detail={selectedBasisDetail}
        zIndex={1400}
      />
    </>
  )
}
