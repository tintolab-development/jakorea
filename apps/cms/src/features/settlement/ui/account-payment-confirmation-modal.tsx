/**
 * 정산 관리 > 계좌 지급 확인
 * - bulk: 목록에서 2건 이상 체크 후 일괄 지급 처리
 * - single: 목록 1건 체크 또는 상세「지급 완료 처리」— 입금 안내 + 프로그램명·정산 금액·지급 계좌번호
 */

import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { withProgramDetailTdDivider } from '@/features/program/shared/ui/program-detail-td-divider'
import type {
  AccountPaymentRow,
  AccountPaymentStatusDetail,
} from '@/features/settlement-management/model/account-payments-list'
import './account-payment-confirmation-modal.css'

/** 일괄: 지급 대상자 행 포함 */
export type AccountPaymentConfirmationModalPayloadBulk = {
  kind: 'bulk'
  programDisplay: string
  recipientLabel: string
  settlementAmount: number
  recipientName: string
  otherRecipientCount: number
}

/** 단건: 지급 계좌번호 행 포함(구분은 ProgramDetailTdDivider) */
export type AccountPaymentConfirmationModalPayloadSingle = {
  kind: 'single'
  programDisplay: string
  settlementAmount: number
  accountBankAndNumber: string
  accountHolder: string
  recipientName: string
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

/** 일괄 지급 확인 모달 — 선택 행 프로그램명 요약 */
export function formatAccountPaymentBulkProgramDisplay(programNames: string[]): string {
  const uniquePrograms = [...new Set(programNames)]
  if (uniquePrograms.length === 1) return uniquePrograms[0]
  return `${uniquePrograms[0]} 외 ${uniquePrograms.length - 1}개`
}

function PaymentCompleteButtonLabel() {
  return <strong className="account-payment-confirm-modal__strong">[계좌 지급 완료]</strong>
}

function AccountPaymentConfirmationSummary({
  data,
}: {
  data: AccountPaymentConfirmationModalPayload
}) {
  if (data.kind === 'bulk') {
    return (
      <DetailInfoForm
        title="요약"
        hideHeader
        mode="view"
        className="account-payment-confirm-modal__detail-form"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field label="프로그램명" view={<span>{data.programDisplay}</span>} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="정산 금액"
            view={
              <span className="account-payment-confirm-modal__amount-value">
                {formatWon(data.settlementAmount)}
              </span>
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field label="지급 대상자" view={<span>{data.recipientLabel}</span>} />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    )
  }

  return (
    <DetailInfoForm
      title="요약"
      hideHeader
      mode="view"
      className="account-payment-confirm-modal__detail-form"
    >
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field label="프로그램명" view={<span>{data.programDisplay}</span>} />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="정산 금액"
          view={
            <span className="account-payment-confirm-modal__amount-value">
              {formatWon(data.settlementAmount)}
            </span>
          }
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="지급 계좌번호"
          view={withProgramDetailTdDivider([data.accountBankAndNumber, data.accountHolder])}
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}

function resolveListRowDepositAccountDisplay(row: AccountPaymentRow): string {
  const deposit = row.depositAccountNumber?.trim()
  if (deposit) return deposit
  const bank = row.bankName?.trim()
  const account = row.maskedAccountNo?.trim()
  if (bank && account) return `${bank} ${account}`
  return bank || account || '-'
}

/** 목록 행만 있을 때 단건 지급 확인 모달(상세 API 없이 목록 필드 사용) */
export function buildAccountPaymentSingleConfirmationPayloadFromListRow(
  row: AccountPaymentRow
): AccountPaymentConfirmationModalPayloadSingle {
  return {
    kind: 'single',
    programDisplay: row.programName,
    settlementAmount: row.amount,
    accountBankAndNumber: resolveListRowDepositAccountDisplay(row),
    accountHolder: row.accountHolder?.trim() || '-',
    recipientName: row.instructorName?.trim() || '신청자',
  }
}

/** 테이블에서 체크한 행만 묶어 요약 표시 — 1건이면 단건(입금 안내) 모달 */
export function buildAccountPaymentConfirmationPayloadForSelection(
  rows: AccountPaymentRow[]
): AccountPaymentConfirmationModalPayload | null {
  if (rows.length === 0) return null
  if (rows.length === 1) {
    return buildAccountPaymentSingleConfirmationPayloadFromListRow(rows[0])
  }
  const programDisplay = formatAccountPaymentBulkProgramDisplay(rows.map(r => r.programName))
  const recipientName = rows[0].instructorName?.trim() || '신청자'
  return {
    kind: 'bulk',
    programDisplay,
    recipientLabel: `총 ${rows.length}명`,
    settlementAmount: rows.reduce((s, r) => s + r.amount, 0),
    recipientName,
    otherRecipientCount: rows.length - 1,
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
    recipientName: basic.nameKo.trim() || '신청자',
  }
}

export function AccountPaymentConfirmationModal({
  open,
  onCancel,
  onConfirm,
  data,
}: AccountPaymentConfirmationModalProps) {
  const canShow = open && data !== null

  const modalTitle = data?.kind === 'bulk' ? '계좌 지급 일괄 확인 안내' : '계좌 지급 확인 안내'

  const modalClassName = [
    'account-payment-confirm-modal',
    data?.kind === 'single' ? 'account-payment-confirm-modal--single' : '',
    data?.kind === 'bulk' ? 'account-payment-confirm-modal--bulk' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <ContentModal
      open={canShow}
      onCancel={onCancel}
      title={modalTitle}
      width={800}
      className={modalClassName}
      footer={
        <div className="account-payment-confirm-modal__footer-actions">
          <CmsButton variant="secondary" size="h40" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton variant="primary" size="h40" onClick={onConfirm}>
            계좌 지급 완료
          </CmsButton>
        </div>
      }
    >
      {data ? (
        <div className="account-payment-confirm-modal__inner">
          <div className="account-payment-confirm-modal__intro">
            {data.kind === 'bulk' ? (
              <>
                <p className="account-payment-confirm-modal__line">
                  <strong className="account-payment-confirm-modal__strong">
                    [{data.recipientName}] 님 외 {data.otherRecipientCount}명
                  </strong>
                  의 계좌 지급을 완료 처리하시겠습니까?
                  <br />
                  모든 항목에 대한 정확한 금액을 입금하신 후에 <PaymentCompleteButtonLabel /> 버튼을
                  눌러주세요.
                </p>
              </>
            ) : (
              <>
                <p className="account-payment-confirm-modal__line">
                  <strong className="account-payment-confirm-modal__strong">
                    [{data.recipientName}]
                  </strong>{' '}
                  님의 계좌 지급을 완료 처리하시겠습니까?
                  <br />
                  안내된 계좌번호로 정확한 금액을 입금하신 후에 <PaymentCompleteButtonLabel />{' '}
                  버튼을 눌러주세요.
                </p>
              </>
            )}
          </div>

          <AccountPaymentConfirmationSummary data={data} />
        </div>
      ) : null}
    </ContentModal>
  )
}
