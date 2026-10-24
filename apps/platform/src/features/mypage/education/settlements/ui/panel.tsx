import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useReceiptPaymentStatementConsent } from '../hooks/use-receipt-payment-statement-consent'
import { PaymentStatementPreConsentModal } from './payment-statement-pre-consent-modal'
import { resolveSettlementAreaFromPathname } from '../lib/write-path'
import { EducationSessionListSkeleton } from '@/features/mypage/shared/ui'
import { DEFAULT_PROGRAM_APPLICATION_REQUEST_ERROR_MESSAGE } from '@/features/program/lib/application-api-error'
import { PFButton, PFText } from '@/shared/ui'
import { usePortalProfileQuery } from '@/features/auth/sign-in'
import { useApplicationSettlementsQuery } from '../../applications/api/activity-hooks'
import type { ProgramApplicationType } from '../../applications/api/types'
import {
  readInstructorBusinessIncomeLabel,
  readInstructorFeeGradeLabel,
} from '../lib/instructor-settlement-summary'
import { filterItemsUpToLastParticipatedSession } from '../../applications/lib/display-status'
import { EducationSessionList } from '../../shared'
import { EDUCATION_SETTLEMENT_PAGE_SIZE } from '../model/types'
import {
  countCompletedSettlementSessions,
  resolvePaymentStatementProcessLabel,
} from '../lib/settlement-rules'
import { isGeminiSettlementProgram } from '../lib/payment-statement-status'
import {
  INDIVIDUAL_SETTLEMENT_DISABLED_MESSAGE,
  INDIVIDUAL_SETTLEMENT_EMPTY_SCHEDULES_MESSAGE,
  individualIneligibleMessage,
} from '../lib/individual-settlement-contract'
import {
  readProgramOperationEndAt,
  resolveSettlementDocumentKind,
} from '../lib/settlement-status-ui'
import { EducationSettlementRow } from './row'
import { EducationSettlementSummary } from './summary'
import styles from './panel.module.css'

type EducationSettlementPanelProps = {
  programId: string
  applicationId: string
  applicationType?: ProgramApplicationType | null
  lastParticipatedSession?: number
  /** 프로그램 사업 운영 종료일. 없으면 제출 마감일을 표시하지 않는다. */
  operationEndAt?: string | null
  programType?: string | null
  detailCase?: string | null
}

export function EducationSettlementPanel({
  programId,
  applicationId,
  applicationType,
  lastParticipatedSession,
  operationEndAt,
  programType,
  detailCase,
}: EducationSettlementPanelProps) {
  const location = useLocation()
  const [page, setPage] = useState(1)
  const profileQuery = usePortalProfileQuery({ enabled: applicationType === 'INSTRUCTOR' })
  const remoteSettlements = useApplicationSettlementsQuery(
    applicationType,
    applicationId,
    programId,
    { operationEndAt },
  )
  const settlementSearchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  )
  const rejectReasonSessionId = settlementSearchParams.get('sessionId')
  const shouldOpenRejectReason = settlementSearchParams.get('modal') === 'reject-reason'

  const allItems = useMemo(() => {
    const items = remoteSettlements.enabled ? remoteSettlements.items : []
    return filterItemsUpToLastParticipatedSession(items, lastParticipatedSession)
  }, [lastParticipatedSession, remoteSettlements.enabled, remoteSettlements.items])

  const totalElements = allItems.length
  const totalPages = Math.max(1, Math.ceil(totalElements / EDUCATION_SETTLEMENT_PAGE_SIZE))
  const requestedSessionIndex = useMemo(
    () =>
      rejectReasonSessionId == null
        ? -1
        : allItems.findIndex(item => String(item.id) === rejectReasonSessionId),
    [allItems, rejectReasonSessionId],
  )
  const requestedSessionPage =
    requestedSessionIndex >= 0
      ? Math.floor(requestedSessionIndex / EDUCATION_SETTLEMENT_PAGE_SIZE) + 1
      : null
  const currentPage = requestedSessionPage ?? Math.min(page, totalPages)
  const completedCount = countCompletedSettlementSessions(allItems)
  const documentKind = resolveSettlementDocumentKind(applicationType)
  const isGemini = isGeminiSettlementProgram({ programType, detailCase })
  const processLabel = resolvePaymentStatementProcessLabel(allItems, {
    variant: isGemini
      ? 'gemini'
      : documentKind === 'payment_statement'
        ? 'payment_statement'
        : 'receipt',
  })
  const area = resolveSettlementAreaFromPathname(location.pathname)
  const operationEnd = readProgramOperationEndAt(operationEndAt)
  const receiptConsent = useReceiptPaymentStatementConsent()
  const handleReceiptWrite =
    documentKind === 'receipt' ? receiptConsent.tryWriteReceipt : undefined

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * EDUCATION_SETTLEMENT_PAGE_SIZE
    return allItems.slice(start, start + EDUCATION_SETTLEMENT_PAGE_SIZE)
  }, [allItems, currentPage])

  if (remoteSettlements.isLoading) {
    return <EducationSessionListSkeleton statusMessage="정산현황을 불러오는 중입니다." />
  }
  if (remoteSettlements.individualDisabled) {
    return (
      <div className={styles.status}>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          {INDIVIDUAL_SETTLEMENT_DISABLED_MESSAGE}
        </PFText>
      </div>
    )
  }
  if (remoteSettlements.individualErrorCode) {
    return (
      <div className={styles.status}>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          {individualIneligibleMessage(remoteSettlements.individualErrorCode) ??
            '지급 항목을 불러오지 못했습니다.'}
        </PFText>
        <PFButton
          type="button"
          variant="tertiary"
          size="large"
          disabled={remoteSettlements.isRefetching}
          onClick={() => void remoteSettlements.refetch()}
        >
          다시 시도
        </PFButton>
      </div>
    )
  }
  if (remoteSettlements.isError) {
    const errorMessage =
      remoteSettlements.errorCode === 'DATABASE_ERROR'
        ? DEFAULT_PROGRAM_APPLICATION_REQUEST_ERROR_MESSAGE
        : '정산현황을 불러오지 못했습니다.'
    return (
      <div className={styles.status}>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          {errorMessage}
        </PFText>
        {remoteSettlements.traceId ? (
          <PFText as="p" typo="bd-sm-rg" color="neutral-cool-500">
            traceId: {remoteSettlements.traceId}
          </PFText>
        ) : null}
        <PFButton
          type="button"
          variant="tertiary"
          size="large"
          disabled={remoteSettlements.isRefetching}
          onClick={() => void remoteSettlements.refetch()}
        >
          다시 시도
        </PFButton>
      </div>
    )
  }

  return (
    <div className={styles.shell}>
      <EducationSettlementSummary
        processLabel={processLabel}
        completedCount={completedCount}
        totalCount={totalElements}
        feeGradeLabel={
          documentKind === 'payment_statement'
            ? readInstructorFeeGradeLabel(profileQuery.data)
            : undefined
        }
        businessIncomeLabel={
          documentKind === 'payment_statement'
            ? readInstructorBusinessIncomeLabel(profileQuery.data)
            : undefined
        }
      />
      <EducationSessionList
        title="정산 현황"
        totalCount={totalElements}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyMessage={
          remoteSettlements.individualEmpty
            ? INDIVIDUAL_SETTLEMENT_EMPTY_SCHEDULES_MESSAGE
            : '정산 현황이 없어요.'
        }
      >
        {pageItems.map(item => (
          <EducationSettlementRow
            key={item.id}
            item={item}
            applicationId={applicationId}
            applicationType={applicationType ?? undefined}
            documentKind={documentKind}
            area={area}
            operationEndAt={operationEnd}
            hideInstructorWrite={isGemini}
            onReceiptWrite={handleReceiptWrite}
            initialRejectOpen={
              shouldOpenRejectReason &&
              item.status === 'rejected' &&
              rejectReasonSessionId === String(item.id)
            }
          />
        ))}
      </EducationSessionList>
      <PaymentStatementPreConsentModal
        open={receiptConsent.modalOpen}
        onCancel={receiptConsent.closeModal}
        onWriteConsent={receiptConsent.goToConsents}
      />
    </div>
  )
}
