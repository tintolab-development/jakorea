import { useEffect } from 'react'
import { PFButton, PFModal, PFText } from '@/shared/ui'
import { usePaymentStatementCorrectionQuery } from '../api/use-payment-statement-correction-query'
import { useReapplyPaymentStatementMutation } from '../api/use-reapply-payment-statement-mutation'
import {
  instructorSettlementApiErrorMessage,
  PAYMENT_STATEMENT_REAPPLY_FAILED_MESSAGE,
} from '../lib/instructor-settlement-contract'
import {
  correctionGradeOrBasisLabel,
  correctionPricingModeLabel,
  formatCorrectionWon,
} from '../lib/payment-statement-correction'
import rowStyles from './row.module.css'
import styles from './correction-detail-modal.module.css'

type CorrectionDetailModalProps = {
  open: boolean
  /** 정정으로 만들어진 지급조서 settlementId (목록의 settlementId) */
  settlementId: number | null | undefined
  /** 사업 운영 종료 후에는 재신청 버튼을 숨긴다 */
  operationEnded?: boolean
  onClose: () => void
  /** 조회·재신청 오류 문구. 팝업은 닫고 부모가 알림을 띄운다 */
  onError: (message: string) => void
}

const CORRECTION_DETAIL_FAILED_MESSAGE = '정정 내역을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'

/** [정정 내역 확인하기] — 정정 전 → 정정 후 비교와 [지급조서 재신청] */
export function CorrectionDetailModal({
  open,
  settlementId,
  operationEnded = false,
  onClose,
  onError,
}: CorrectionDetailModalProps) {
  const query = usePaymentStatementCorrectionQuery(settlementId, open)
  const reapplyMutation = useReapplyPaymentStatementMutation()

  useEffect(() => {
    if (!open || !query.isError) return
    onClose()
    onError(instructorSettlementApiErrorMessage(query.error, CORRECTION_DETAIL_FAILED_MESSAGE))
  }, [open, query.isError, query.error, onClose, onError])

  const detail = query.data
  const before = detail?.before
  const after = detail?.after
  const reason = detail?.requestReason?.trim()
  const showReapply = detail?.reapplyAvailable === true && !operationEnded && settlementId != null

  // 행 순서·라벨은 기획 확정(2026-11-11)
  const rows: { label: string; before: string; after: string }[] = [
    {
      label: '강사비 책정 방식',
      before: correctionPricingModeLabel(before?.pricingMode),
      after: correctionPricingModeLabel(after?.pricingMode),
    },
    {
      label: '적용 등급 또는 지급 기준',
      before: correctionGradeOrBasisLabel(before),
      after: correctionGradeOrBasisLabel(after),
    },
    {
      label: '단가',
      before: formatCorrectionWon(before?.unitAmount),
      after: formatCorrectionWon(after?.unitAmount),
    },
    {
      label: '총 강사비',
      before: formatCorrectionWon(before?.lectureFee),
      after: formatCorrectionWon(after?.lectureFee),
    },
    {
      label: '실지급액',
      before: formatCorrectionWon(before?.netPaymentAmount),
      after: formatCorrectionWon(after?.netPaymentAmount),
    },
  ]

  return (
    <PFModal
      open={open}
      size="md"
      title="정정 내역 확인"
      onClose={onClose}
      mobilePlacement="center"
      showCloseButton={false}
    >
      <div className={rowStyles.rejectContent}>
        {detail ? (
          <div className={rowStyles.rejectBody}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">구분</th>
                  <th scope="col">정정 전</th>
                  <th scope="col">정정 후</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    <td>{row.before}</td>
                    <td>{row.after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reason ? (
              <>
                <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
                  정정 요청 사유
                </PFText>
                <PFText as="p" typo="bd-md-md" color="black">
                  {reason}
                </PFText>
              </>
            ) : null}
          </div>
        ) : null}
        <div className={rowStyles.rejectActions}>
          <PFButton
            type="button"
            variant="tertiary"
            size="xlarge"
            className={rowStyles.rejectButton}
            onClick={onClose}
          >
            닫기
          </PFButton>
          {showReapply ? (
            <PFButton
              type="button"
              variant="primary"
              size="xlarge"
              className={rowStyles.rejectButton}
              disabled={reapplyMutation.isPending}
              onClick={() => {
                if (settlementId == null || reapplyMutation.isPending) return
                reapplyMutation.mutate(settlementId, {
                  onSuccess: () => onClose(),
                  onError: error => {
                    onClose()
                    onError(
                      instructorSettlementApiErrorMessage(error, PAYMENT_STATEMENT_REAPPLY_FAILED_MESSAGE),
                    )
                  },
                })
              }}
            >
              지급조서 재신청
            </PFButton>
          ) : null}
        </div>
      </div>
    </PFModal>
  )
}
