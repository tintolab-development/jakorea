/**
 * 백엔드 calculationDetail 표시용 generic read-only UI.
 * 타입별 payload가 완전하지 않아도 서버가 제공한 snapshot만 표시한다.
 */

import type { PaymentOrderCalculationBasisDetailRemote } from './payment-order-calculation-basis-detail'
import {
  BasisDetailInfoForm,
  BasisDetailInfoFormRow,
  BasisDetailReadOnlyValue,
} from './payment-order-calculation-basis-detail-shared'
import { formatPaymentOrderCalculationWonPlain } from './payment-order-calculation-breakdown-table'

function RemoteTextList({ items }: { items: string[] }) {
  return (
    <ul className="payment-order-calculation-basis-detail-modal__remote-list">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  )
}

export function PaymentOrderCalculationBasisDetailRemoteView({
  detail,
}: {
  detail: PaymentOrderCalculationBasisDetailRemote
}) {
  const title = detail.emojiOverride ? `${detail.emojiOverride} ${detail.title}` : detail.title

  return (
    <BasisDetailInfoForm title={title}>
      {detail.formulaText ? (
        <BasisDetailInfoFormRow label="산정 공식">
          <BasisDetailReadOnlyValue>{detail.formulaText}</BasisDetailReadOnlyValue>
        </BasisDetailInfoFormRow>
      ) : null}
      {detail.lineLabels.length > 0 ? (
        <BasisDetailInfoFormRow label="산정 항목">
          <BasisDetailReadOnlyValue>
            <RemoteTextList items={detail.lineLabels} />
          </BasisDetailReadOnlyValue>
        </BasisDetailInfoFormRow>
      ) : null}
      {detail.formulaLines.length > 0 ? (
        <BasisDetailInfoFormRow label="산출 과정">
          <BasisDetailReadOnlyValue>
            <RemoteTextList items={detail.formulaLines} />
          </BasisDetailReadOnlyValue>
        </BasisDetailInfoFormRow>
      ) : null}
      {detail.summaryLabels.length > 0 ? (
        <BasisDetailInfoFormRow label="요약 항목">
          <BasisDetailReadOnlyValue>
            <RemoteTextList items={detail.summaryLabels} />
          </BasisDetailReadOnlyValue>
        </BasisDetailInfoFormRow>
      ) : null}
      {detail.resultAmount != null ? (
        <BasisDetailInfoFormRow label="산출 금액">
          <BasisDetailReadOnlyValue>
            {formatPaymentOrderCalculationWonPlain(detail.resultAmount)}
          </BasisDetailReadOnlyValue>
        </BasisDetailInfoFormRow>
      ) : null}
    </BasisDetailInfoForm>
  )
}
