import type { PaymentStatementIssuanceParagraphDisplayMode } from '@/features/template/ui/form-set/payment-statement-issuance/display-mode'
import { SettlementTransportFeeDetailForm } from '@/features/template/ui/form-set/detail-forms/settlement-transport-fee-detail-form'

interface TransportFeeApplicationParagraphProps {
  displayMode?: PaymentStatementIssuanceParagraphDisplayMode
}

export function TransportFeeApplicationParagraph({
  displayMode = 'editor',
}: TransportFeeApplicationParagraphProps) {
  return (
    <div className="form-editor-body settlement-transport-fee-detail-form-host">
      <SettlementTransportFeeDetailForm displayMode={displayMode} />
    </div>
  )
}
