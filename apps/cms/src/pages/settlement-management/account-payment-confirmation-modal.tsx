/**
 * 정산 관리 > 계좌 지급 확인
 * - bulk: 목록 체크 후 일괄 지급 처리
 * - single: 상세 화면「지급 완료 처리」— 입금 안내 + 프로그램명·정산 금액·지급 계좌번호
 */

import { ContentModal } from '@/shared/ui/content-modal'
import { AppButton } from '@/shared/ui/app-button'
import { withProgramDetailTdDivider } from '@/features/program/ui/program-detail-td-divider'
import type {
  AccountPaymentRow,
  AccountPaymentStatusDetail,
} from '@/data/mock/account-payments-list'
import './account-payment-confirmation-modal.css'

/** 일괄: 지급 대상자 행 포함 */
export type AccountPaymentConfirmationModalPayloadBulk = {
  kind: 'bulk'
  programDisplay: string
  recipientLabel: string
  settlementAmount: number
}

/** 단건: 지급 계좌번호 행 포함(구분은 ProgramDetailTdDivider) */
export type AccountPaymentConfirmationModalPayloadSingle = {
  kind: 'single'
  programDisplay: string
  settlementAmount: number
  accountBankAndNumber: string
  accountHolder: string
}

export type AccountPaymentConfirmationModalPayload =
  | AccountPaymentConfirmationModalPayloadBulk
  | AccountPaymentConfirmationModalPayloadSingle

export interface AccountPaymentConfirmationModalProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  data: AccountPaymentConfirmationModalPayload | null
}

function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}

/** 테이블에서 체크한 행만 묶어 요약 표시 */
export function buildAccountPaymentConfirmationPayloadForSelection(
  rows: AccountPaymentRow[]
): AccountPaymentConfirmationModalPayload | null {
  if (rows.length === 0) return null
  const uniquePrograms = [...new Set(rows.map(r => r.programName))]
  const programDisplay =
    uniquePrograms.length === 1
      ? rows.length > 1
        ? `${uniquePrograms[0]} 외 ${rows.length - 1}개`
        : uniquePrograms[0]
      : `${uniquePrograms[0]} 외 ${uniquePrograms.length - 1}개`
  return {
    kind: 'bulk',
    programDisplay,
    recipientLabel: `총 ${rows.length}명`,
    settlementAmount: rows.reduce((s, r) => s + r.amount, 0),
  }
}

/** 상세 풀페이지「지급 완료 처리」— 산출 합계·정산 계좌 표시 */
export function buildAccountPaymentSingleConfirmationPayload(
  detail: AccountPaymentStatusDetail
): AccountPaymentConfirmationModalPayload {
  const { basic, totalAmount, plainAccountForPaymentConfirm } = detail
  return {
    kind: 'single',
    programDisplay: basic.programName,
    settlementAmount: totalAmount,
    accountBankAndNumber: plainAccountForPaymentConfirm.bankAndNumber,
    accountHolder: plainAccountForPaymentConfirm.holder,
  }
}

export function AccountPaymentConfirmationModal({
  open,
  onCancel,
  onConfirm,
  data,
}: AccountPaymentConfirmationModalProps) {
  const canShow = open && data !== null

  const modalClassName = [
    'account-payment-confirm-modal',
    data?.kind === 'single' ? 'account-payment-confirm-modal--single' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <ContentModal
      open={canShow}
      onCancel={onCancel}
      title="계좌 지급 확인"
      width={800}
      className={modalClassName}
      footer={
        <div className="account-payment-confirm-modal__footer-actions">
          <AppButton variant="cancel" size="large" onClick={onCancel}>
            취소
          </AppButton>
          <AppButton
            variant="primary"
            size="tableAction"
            modalTeal
            className="account-payment-confirm-modal__submit-btn"
            onClick={onConfirm}
          >
            계좌 지급 완료
          </AppButton>
        </div>
      }
    >
      {data ? (
        <div className="account-payment-confirm-modal__inner">
          <div className="account-payment-confirm-modal__intro">
            {data.kind === 'bulk' ? (
              <>
                <p className="account-payment-confirm-modal__line">
                  선택하신 모든 항목에 대해 강의비 계좌 지급을 완료 처리하시겠습니까?
                </p>
                <p className="account-payment-confirm-modal__line">
                  모든 항목에 대한 입금 완료 후, 아래의{' '}
                  <strong className="account-payment-confirm-modal__strong">[계좌 지급 완료]</strong>{' '}
                  버튼을 눌러주세요.
                </p>
              </>
            ) : (
              <>
                <p className="account-payment-confirm-modal__line">
                  아래의 내용을 확인하신 후 안내된 계좌번호로 정확한 금액을 입금해 주세요.
                </p>
                <p className="account-payment-confirm-modal__line">
                  입금이 완료되면 아래의{' '}
                  <strong className="account-payment-confirm-modal__strong">[계좌 지급 완료]</strong>{' '}
                  버튼을 눌러주세요.
                </p>
              </>
            )}
          </div>

          <div className="account-payment-confirm-modal__summary" role="table" aria-label="요약">
            {data.kind === 'bulk' ? (
              <>
                <div className="account-payment-confirm-modal__summary-row" role="row">
                  <div className="account-payment-confirm-modal__summary-th" role="rowheader">
                    프로그램명
                  </div>
                  <div className="account-payment-confirm-modal__summary-td" role="cell">
                    {data.programDisplay}
                  </div>
                </div>
                <div className="account-payment-confirm-modal__summary-row" role="row">
                  <div className="account-payment-confirm-modal__summary-th" role="rowheader">
                    지급 대상자
                  </div>
                  <div className="account-payment-confirm-modal__summary-td" role="cell">
                    {data.recipientLabel}
                  </div>
                </div>
                <div className="account-payment-confirm-modal__summary-row" role="row">
                  <div className="account-payment-confirm-modal__summary-th" role="rowheader">
                    정산 금액
                  </div>
                  <div
                    className="account-payment-confirm-modal__summary-td account-payment-confirm-modal__summary-td--amount"
                    role="cell"
                  >
                    {formatWon(data.settlementAmount)}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="account-payment-confirm-modal__summary-row" role="row">
                  <div className="account-payment-confirm-modal__summary-th" role="rowheader">
                    프로그램명
                  </div>
                  <div className="account-payment-confirm-modal__summary-td" role="cell">
                    {data.programDisplay}
                  </div>
                </div>
                <div className="account-payment-confirm-modal__summary-row" role="row">
                  <div className="account-payment-confirm-modal__summary-th" role="rowheader">
                    정산 금액
                  </div>
                  <div
                    className="account-payment-confirm-modal__summary-td account-payment-confirm-modal__summary-td--amount"
                    role="cell"
                  >
                    {formatWon(data.settlementAmount)}
                  </div>
                </div>
                <div className="account-payment-confirm-modal__summary-row" role="row">
                  <div className="account-payment-confirm-modal__summary-th" role="rowheader">
                    지급 계좌번호
                  </div>
                  <div
                    className="account-payment-confirm-modal__summary-td account-payment-confirm-modal__summary-td--divider-inline"
                    role="cell"
                  >
                    {withProgramDetailTdDivider([
                      data.accountBankAndNumber,
                      data.accountHolder,
                    ])}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </ContentModal>
  )
}
