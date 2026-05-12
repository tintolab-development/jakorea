import type { PaymentStatementIssuanceParagraphDisplayMode } from '@/features/template/ui/form-set/payment-statement-issuance/display-mode'
import { SettlementAccommodationFeeDetailForm } from '@/features/template/ui/form-set/settlement-accommodation-fee-detail-form'

interface AccommodationFeeApplicationParagraphProps {
  displayMode?: PaymentStatementIssuanceParagraphDisplayMode
}

export function AccommodationFeeApplicationParagraph({
  displayMode = 'editor',
}: AccommodationFeeApplicationParagraphProps) {
  return (
    <div className="form-editor-body settlement-accommodation-fee-detail-form-host">
      <SettlementAccommodationFeeDetailForm displayMode={displayMode} />
    </div>
  )
}
