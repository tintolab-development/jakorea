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
import { useGeminiSettlementTabQuery } from '../api/use-gemini-settlement-query'
import {
  readInstructorBusinessIncomeLabel,
  readInstructorFeeGradeLabel,
} from '../lib/instructor-settlement-summary'
import {
  displayGeminiBusinessIncome,
  displayGeminiProcessingStatus,
  displayGeminiSummaryField,
  resolveGeminiFeeBasisDisplay,
} from '../lib/gemini-settlement-status'
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
import { GeminiSettlementTable } from './gemini-settlement-table'
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
  const isGemini = isGeminiSettlementProgram({ programType, detailCase })
  const profileQuery = usePortalProfileQuery({
    enabled: applicationType === 'INSTRUCTOR' && !isGemini,
  })
  const remoteSettlements = useApplicationSettlementsQuery(
    applicationType,
    applicationId,
    programId,
    { operationEndAt, programType, enabled: !isGemini },
  )
  const geminiSettlements = useGeminiSettlementTabQuery(applicationType, applicationId, isGemini)
  const settlementSearchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  )
  const rejectReasonSessionId = settlementSearchParams.get('sessionId')
  const shouldOpenRejectReason = settlementSearchParams.get('modal') === 'reject-reason'

  const allItems = useMemo(() => {
    const items = isGemini
      ? geminiSettlements.items
      : remoteSettlements.enabled
        ? remoteSettlements.items
        : []
    return filterItemsUpToLastParticipatedSession(items, lastParticipatedSession)
  }, [
    geminiSettlements.items,
    isGemini,
    lastParticipatedSession,
    remoteSettlements.enabled,
    remoteSettlements.items,
  ])

  /** 제미나이 정산 현황 표: 서버 순서 그대로, 활동 포기 시 마지막 참여 회차까지만 */
  const geminiRows = useMemo(() => {
    if (!isGemini) return []
    const visibleIds = new Set(allItems.map(item => item.id))
    return geminiSettlements.scheduleItems.filter((row, index) =>
      visibleIds.has(row.scheduleId != null ? String(row.scheduleId) : `gemini-schedule-${index + 1}`),
    )
  }, [allItems, geminiSettlements.scheduleItems, isGemini])

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
  const completedCount = isGemini
    ? displayGeminiSummaryField(geminiSettlements.summary?.lectureProgressRound)
    : countCompletedSettlementSessions(allItems)
  const totalCount = isGemini
    ? displayGeminiSummaryField(geminiSettlements.summary?.lectureTotalRound)
    : totalElements
  const documentKind = resolveSettlementDocumentKind(applicationType)
  const processLabel = isGemini
    ? displayGeminiProcessingStatus(geminiSettlements.summary)
    : resolvePaymentStatementProcessLabel(allItems, {
        variant: documentKind === 'payment_statement' ? 'payment_statement' : 'receipt',
      })
  const geminiFeeBasis = isGemini ? resolveGeminiFeeBasisDisplay(geminiSettlements.summary) : null
  const feeGradeLabel = geminiFeeBasis
    ? geminiFeeBasis.fallback
    : documentKind === 'payment_statement'
      ? readInstructorFeeGradeLabel(profileQuery.data)
      : undefined
  const businessIncomeLabel = isGemini
    ? displayGeminiBusinessIncome(geminiSettlements.summary)
    : documentKind === 'payment_statement'
      ? readInstructorBusinessIncomeLabel(profileQuery.data)
      : undefined
  const area = resolveSettlementAreaFromPathname(location.pathname)
  const operationEnd = readProgramOperationEndAt(operationEndAt)
  const receiptConsent = useReceiptPaymentStatementConsent({
    applicationId,
    area,
    applicationType: applicationType ?? undefined,
  })
  const handleReceiptWrite =
    documentKind === 'receipt' ? receiptConsent.tryWriteReceipt : undefined

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * EDUCATION_SETTLEMENT_PAGE_SIZE
    return allItems.slice(start, start + EDUCATION_SETTLEMENT_PAGE_SIZE)
  }, [allItems, currentPage])

  if (isGemini ? geminiSettlements.isLoading : remoteSettlements.isLoading) {
    return <EducationSessionListSkeleton statusMessage="정산현황을 불러오는 중입니다." />
  }
  if (!isGemini && remoteSettlements.individualDisabled) {
    return (
      <div className={styles.status}>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          {INDIVIDUAL_SETTLEMENT_DISABLED_MESSAGE}
        </PFText>
      </div>
    )
  }
  if (!isGemini && remoteSettlements.individualErrorCode) {
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
  if (isGemini ? geminiSettlements.isError : remoteSettlements.isError) {
    const errorMessage =
      !isGemini && remoteSettlements.errorCode === 'DATABASE_ERROR'
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
          disabled={isGemini ? geminiSettlements.isRefetching : remoteSettlements.isRefetching}
          onClick={() =>
            void (isGemini ? geminiSettlements.refetch() : remoteSettlements.refetch())
          }
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
        processTitle={documentKind === 'receipt' ? '영수증 처리 현황' : '지급조서 처리 현황'}
        completedCount={completedCount}
        totalCount={totalCount}
        feeGradeLabel={feeGradeLabel}
        businessIncomeLabel={businessIncomeLabel}
        layout={isGemini ? 'gemini' : 'default'}
        feeBasisItems={geminiFeeBasis?.items}
      />
      {isGemini ? (
        <GeminiSettlementTable rows={geminiRows} />
      ) : (
        <EducationSessionList
          title="정산 현황"
          totalCount={totalElements}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyMessage={
            !isGemini && remoteSettlements.individualEmpty
              ? INDIVIDUAL_SETTLEMENT_EMPTY_SCHEDULES_MESSAGE
              : '정산 현황이 없어요'
          }
          emptyDescription="정산 대상 일정이 생기면 이곳에서 확인할 수 있어요."
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
      )}
      <PaymentStatementPreConsentModal
        open={receiptConsent.modalOpen}
        onCancel={receiptConsent.closeModal}
        onWriteConsent={receiptConsent.goToConsents}
      />
    </div>
  )
}
